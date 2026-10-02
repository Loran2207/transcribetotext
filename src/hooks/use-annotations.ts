import { useCallback, useEffect, useMemo, useState } from "react";

import {
  YOU,
  DEFAULT_LABEL_ID,
  demoStartsEmpty,
  loadAnnotations,
  loadLabels,
  loadLastLabel,
  saveLabels,
  saveLastLabel,
  overlaps,
  saveAnnotations,
  seedAnnotations,
  type Anchor,
  type Annotations,
  type Highlight,
  type Label,
  type Person,
  type LabelColor,
  type Reply,
  type Thread,
} from "@/lib/annotations";

type BlockText = { id: number; text: string; timestamp: string };

const EMPTY: Annotations = { highlights: [], threads: [] };

function initial(record: string, blocks: BlockText[], owner?: Person): Annotations {
  return loadAnnotations(record) ?? (demoStartsEmpty() ? EMPTY : seedAnnotations(blocks, Date.now(), owner));
}

/* One record's highlights and comment threads, kept in this browser.
   owner: on a record shared with you, the notes the demo marks as the
   owner's are theirs, not yours. */
export function useAnnotations(record: string, blocks: BlockText[], owner?: Person) {
  const [store, setStore] = useState(() => ({ record, data: initial(record, blocks, owner) }));
  const data = store.record === record ? store.data : initial(record, blocks, owner);

  useEffect(() => {
    if (store.record !== record) setStore({ record, data: initial(record, blocks, owner) });
  }, [record, store.record, blocks, owner]);

  useEffect(() => {
    if (store.record === record) saveAnnotations(record, store.data);
  }, [record, store]);

  const set = useCallback((fn: (d: Annotations) => Annotations) => {
    setStore((s) => ({ record: s.record, data: fn(s.data) }));
  }, []);

  /* Transcript order, so both lists read the way the conversation went. */
  const order = useMemo(() => new Map(blocks.map((b, i) => [b.id, i])), [blocks]);
  const byPlace = useCallback(
    (a: Anchor, b: Anchor) => (order.get(a.segmentId) ?? 0) - (order.get(b.segmentId) ?? 0) || a.start - b.start,
    [order],
  );
  const highlights = useMemo(() => [...data.highlights].filter((h) => order.has(h.segmentId)).sort(byPlace), [data.highlights, order, byPlace]);
  const threads = useMemo(() => [...data.threads].filter((t) => order.has(t.segmentId)).sort(byPlace), [data.threads, order, byPlace]);

  /* Marking words you already marked grows the one mark instead of stacking a
     second on top. Somebody else's mark stays theirs. */
  /* merge: false for a whole-block highlight, which sits over the marks inside
     it and must give them back when it is taken off */
  const addHighlight = useCallback((a: Anchor, labelId: string = DEFAULT_LABEL_ID, merge = true) => {
    const id = `h-${Date.now()}`;
    set((d) => {
      const mine = merge ? d.highlights.filter((h) => h.segmentId === a.segmentId && h.by.you && !h.block && overlaps(h, a)) : [];
      const start = Math.min(a.start, ...mine.map((h) => h.start));
      const end = Math.max(a.end, ...mine.map((h) => h.end));
      const rest = d.highlights.filter((h) => !mine.includes(h));
      return { ...d, highlights: [...rest, { id, segmentId: a.segmentId, start, end, by: YOU, at: Date.now(), labelId, ...(merge ? {} : { block: true }) }] };
    });
    return id;
  }, [set]);

  const setLabel = useCallback((highlightId: string, labelId: string) => {
    set((d) => ({ ...d, highlights: d.highlights.map((h) => (h.id === highlightId ? { ...h, labelId } : h)) }));
  }, [set]);

  const removeHighlight = useCallback((id: string) => {
    const found = data.highlights.find((h) => h.id === id);
    set((d) => ({ ...d, highlights: d.highlights.filter((h) => h.id !== id) }));
    return found;
  }, [data.highlights, set]);

  const restoreHighlight = useCallback((h: Highlight) => {
    set((d) => ({ ...d, highlights: [...d.highlights.filter((x) => x.id !== h.id), h] }));
  }, [set]);

  const addThread = useCallback((a: Anchor & { quote: string; timestamp: string }, text: string) => {
    const id = `t-${Date.now()}`;
    set((d) => ({ ...d, threads: [...d.threads, { ...a, id, by: YOU, text, at: Date.now(), replies: [] }] }));
    return id;
  }, [set]);

  const reply = useCallback((threadId: string, text: string) => {
    const r: Reply = { id: `r-${Date.now()}`, by: YOU, text, at: Date.now() };
    set((d) => ({ ...d, threads: d.threads.map((t) => (t.id === threadId ? { ...t, replies: [...t.replies, r] } : t)) }));
  }, [set]);

  const editThread = useCallback((threadId: string, text: string) => {
    set((d) => ({ ...d, threads: d.threads.map((t) => (t.id === threadId ? { ...t, text, edited: true } : t)) }));
  }, [set]);

  const editReply = useCallback((threadId: string, replyId: string, text: string) => {
    set((d) => ({
      ...d,
      threads: d.threads.map((t) => (t.id === threadId ? { ...t, replies: t.replies.map((r) => (r.id === replyId ? { ...r, text, edited: true } : r)) } : t)),
    }));
  }, [set]);

  const deleteThread = useCallback((threadId: string) => {
    const found = data.threads.find((t) => t.id === threadId);
    set((d) => ({ ...d, threads: d.threads.filter((t) => t.id !== threadId) }));
    return found;
  }, [data.threads, set]);

  const restoreThread = useCallback((t: Thread) => {
    set((d) => ({ ...d, threads: [...d.threads.filter((x) => x.id !== t.id), t] }));
  }, [set]);

  const deleteReply = useCallback((threadId: string, replyId: string) => {
    const thread = data.threads.find((t) => t.id === threadId);
    const index = thread?.replies.findIndex((r) => r.id === replyId) ?? -1;
    const found = index >= 0 ? thread?.replies[index] : undefined;
    set((d) => ({ ...d, threads: d.threads.map((t) => (t.id === threadId ? { ...t, replies: t.replies.filter((r) => r.id !== replyId) } : t)) }));
    return found ? { reply: found, index } : undefined;
  }, [data.threads, set]);

  const restoreReply = useCallback((threadId: string, r: Reply, index: number) => {
    set((d) => ({
      ...d,
      threads: d.threads.map((t) => {
        if (t.id !== threadId) return t;
        const replies = t.replies.filter((x) => x.id !== r.id);
        replies.splice(Math.min(index, replies.length), 0, r);
        return { ...t, replies };
      }),
    }));
  }, [set]);

  const resolve = useCallback((threadId: string) => {
    set((d) => ({ ...d, threads: d.threads.map((t) => (t.id === threadId ? { ...t, resolved: { by: YOU, at: Date.now() } } : t)) }));
  }, [set]);

  const reopen = useCallback((threadId: string) => {
    set((d) => ({ ...d, threads: d.threads.map((t) => (t.id === threadId ? { ...t, resolved: undefined } : t)) }));
  }, [set]);

  return {
    highlights,
    threads,
    addHighlight,
    removeHighlight,
    restoreHighlight,
    setLabel,
    addThread,
    reply,
    editThread,
    editReply,
    deleteThread,
    restoreThread,
    deleteReply,
    restoreReply,
    resolve,
    reopen,
  };
}

export type AnnotationsApi = ReturnType<typeof useAnnotations>;

/* The person's labels (the same set on every record) and the one the
   Highlight button applies: the last one they picked. */
/* The labels of one recording: every label made for all recordings, and the
   ones made for this recording only. */
export function useLabels(record: string) {
  const [all, setAll] = useState<Label[]>(loadLabels);
  const [lastId, setLastId] = useState<string>(loadLastLabel);
  useEffect(() => { saveLabels(all); }, [all]);

  const labels = useMemo(() => all.filter((l) => !l.record || l.record === record), [all, record]);
  const byId = useMemo(() => new Map(labels.map((l) => [l.id, l])), [labels]);
  const labelOf = useCallback((id?: string) => byId.get(id ?? "") ?? labels[0], [byId, labels]);
  const current = byId.get(lastId) ?? labels[0];

  const pick = useCallback((id: string) => { setLastId(id); saveLastLabel(id); }, []);
  const add = useCallback((name: string, color: LabelColor, onlyHere = false) => {
    const id = `l-${Date.now()}`;
    setAll((list) => [...list, onlyHere ? { id, name, color, record } : { id, name, color }]);
    return id;
  }, [record]);
  const update = useCallback((id: string, patch: Partial<Omit<Label, "id" | "record">>) => {
    setAll((list) => list.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);
  /* move a label between every recording and this one only */
  const setOnlyHere = useCallback((id: string, onlyHere: boolean) => {
    setAll((list) => list.map((l) => {
      if (l.id !== id) return l;
      const { record: _was, ...rest } = l;
      return onlyHere ? { ...rest, record } : rest;
    }));
  }, [record]);
  /* A removed label never leaves a highlight without one: those fall back to the first label. */
  const remove = useCallback((id: string) => {
    setAll((list) => (list.filter((l) => !l.record || l.record === record).length > 1 ? list.filter((l) => l.id !== id) : list));
    setLastId((cur) => (cur === id ? DEFAULT_LABEL_ID : cur));
  }, [record]);

  /* back where it stood in this recording's list */
  const restore = useCallback((label: Label, index: number) => {
    setAll((list) => {
      if (list.some((l) => l.id === label.id)) return list;
      const after = list.filter((l) => !l.record || l.record === record)[index];
      const at = after ? list.indexOf(after) : list.length;
      const next = [...list];
      next.splice(at, 0, label);
      return next;
    });
  }, [record]);

  return { labels, labelOf, current, pick, add, update, setOnlyHere, remove, restore };
}

export type LabelsApi = ReturnType<typeof useLabels>;
