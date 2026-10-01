import { useCallback, useEffect, useMemo, useState } from "react";

import {
  YOU,
  demoStartsEmpty,
  loadAnnotations,
  overlaps,
  saveAnnotations,
  seedAnnotations,
  type Anchor,
  type Annotations,
  type Highlight,
  type Reply,
  type Thread,
} from "@/lib/annotations";

type BlockText = { id: number; text: string; timestamp: string };

const EMPTY: Annotations = { highlights: [], threads: [] };

function initial(record: string, blocks: BlockText[]): Annotations {
  return loadAnnotations(record) ?? (demoStartsEmpty() ? EMPTY : seedAnnotations(blocks));
}

/* One record's highlights and comment threads, kept in this browser. */
export function useAnnotations(record: string, blocks: BlockText[]) {
  const [store, setStore] = useState(() => ({ record, data: initial(record, blocks) }));
  const data = store.record === record ? store.data : initial(record, blocks);

  useEffect(() => {
    if (store.record !== record) setStore({ record, data: initial(record, blocks) });
  }, [record, store.record, blocks]);

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
  const addHighlight = useCallback((a: Anchor) => {
    const id = `h-${Date.now()}`;
    set((d) => {
      const mine = d.highlights.filter((h) => h.segmentId === a.segmentId && h.by.you && overlaps(h, a));
      const start = Math.min(a.start, ...mine.map((h) => h.start));
      const end = Math.max(a.end, ...mine.map((h) => h.end));
      const rest = d.highlights.filter((h) => !mine.includes(h));
      return { ...d, highlights: [...rest, { id, segmentId: a.segmentId, start, end, by: YOU, at: Date.now() }] };
    });
    return id;
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
