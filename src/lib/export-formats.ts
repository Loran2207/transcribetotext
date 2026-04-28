/**
 * Multi-format transcript export utilities.
 * Supports: TXT, DOCX (HTML-as-Word), PDF (hand-crafted), SRT, VTT.
 * Pure client-side, no external dependencies.
 */

export type ExportFormat = "txt" | "docx" | "pdf" | "srt" | "vtt";

export interface ExportSegment {
  speaker?: string;
  /** "M:SS" or "H:MM:SS" */
  timestamp: string;
  text: string;
  /** Optional explicit end timestamp; if absent, computed from next segment */
  endTimestamp?: string;
}

export interface ExportableRecord {
  title: string;
  /** Optional one-paragraph summary */
  summary?: string;
  /** Transcript segments in order */
  segments: ExportSegment[];
  /** Optional metadata shown in the doc header */
  metadata?: {
    date?: string;
    duration?: string;
    source?: string;
    speakers?: string[];
    language?: string;
  };
}

export const FORMAT_META: Record<
  ExportFormat,
  { label: string; extension: string; description: string; mime: string; accentClass: string }
> = {
  txt: {
    label: "Plain text",
    extension: "txt",
    description: "Lightweight, universal, opens anywhere",
    mime: "text/plain;charset=utf-8",
    accentClass: "bg-slate-100 text-slate-700",
  },
  docx: {
    label: "Word document",
    extension: "doc",
    description: "Best for editing in Word, Pages, Google Docs",
    mime: "application/msword",
    accentClass: "bg-blue-50 text-blue-700",
  },
  pdf: {
    label: "PDF",
    extension: "pdf",
    description: "Polished, print-ready, share-friendly",
    mime: "application/pdf",
    accentClass: "bg-rose-50 text-rose-700",
  },
  srt: {
    label: "SRT subtitles",
    extension: "srt",
    description: "Industry standard for video editors",
    mime: "application/x-subrip;charset=utf-8",
    accentClass: "bg-amber-50 text-amber-700",
  },
  vtt: {
    label: "WebVTT subtitles",
    extension: "vtt",
    description: "Native HTML5 video captions",
    mime: "text/vtt;charset=utf-8",
    accentClass: "bg-emerald-50 text-emerald-700",
  },
};

/* ──────────────────────────────────────────
   Time helpers
   ────────────────────────────────────────── */

/** Parse "M:SS", "MM:SS", "H:MM:SS" into total seconds. */
export function parseTimestamp(ts: string): number {
  const parts = ts.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

/** Seconds → "HH:MM:SS,mmm" (SRT). */
function secondsToSrt(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

/** Seconds → "HH:MM:SS.mmm" (WebVTT). */
function secondsToVtt(seconds: number): string {
  return secondsToSrt(seconds).replace(",", ".");
}

function pad(n: number, w: number): string {
  return String(n).padStart(w, "0");
}

/** Compute end-time (in seconds) for segment i: either explicit, or next segment's start, or +5s. */
function segmentEndSeconds(record: ExportableRecord, i: number): number {
  const seg = record.segments[i];
  if (seg.endTimestamp) return parseTimestamp(seg.endTimestamp);
  const next = record.segments[i + 1];
  if (next) return parseTimestamp(next.timestamp);
  return parseTimestamp(seg.timestamp) + 5;
}

/* ──────────────────────────────────────────
   Sanitizers
   ────────────────────────────────────────── */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeFilename(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "transcript"
  );
}

/* ──────────────────────────────────────────
   TXT
   ────────────────────────────────────────── */

export function buildTxt(records: ExportableRecord[]): string {
  return records
    .map((r) => {
      const lines: string[] = [];
      lines.push(r.title);
      lines.push("=".repeat(Math.min(r.title.length, 60)));
      const meta = r.metadata;
      if (meta) {
        if (meta.date) lines.push(`Date: ${meta.date}`);
        if (meta.duration) lines.push(`Duration: ${meta.duration}`);
        if (meta.source) lines.push(`Source: ${meta.source}`);
        if (meta.speakers?.length) lines.push(`Speakers: ${meta.speakers.join(", ")}`);
        if (meta.language) lines.push(`Language: ${meta.language}`);
      }
      if (r.summary) {
        lines.push("");
        lines.push("SUMMARY");
        lines.push("-------");
        lines.push(r.summary);
      }
      if (r.segments.length) {
        lines.push("");
        lines.push("TRANSCRIPT");
        lines.push("----------");
        for (const seg of r.segments) {
          const speaker = seg.speaker ? `${seg.speaker} ` : "";
          lines.push(`${speaker}(${seg.timestamp})`);
          lines.push(seg.text);
          lines.push("");
        }
      }
      return lines.join("\n");
    })
    .join("\n\n" + "═".repeat(60) + "\n\n");
}

/* ──────────────────────────────────────────
   DOCX (HTML wrapped in Word-friendly envelope)
   ────────────────────────────────────────── */

export function buildDocx(records: ExportableRecord[]): string {
  const body = records
    .map((r) => {
      const meta = r.metadata;
      const metaLine = [meta?.date, meta?.duration, meta?.source]
        .filter(Boolean)
        .map((s) => escapeHtml(s as string))
        .join(" &middot; ");
      return `
        <h1 style="font-family:Calibri,Arial,sans-serif;font-size:24pt;color:#111;margin:0 0 6pt;">${escapeHtml(
          r.title
        )}</h1>
        ${metaLine ? `<p style="font-family:Calibri,Arial,sans-serif;font-size:10pt;color:#666;margin:0 0 18pt;">${metaLine}</p>` : ""}
        ${
          r.summary
            ? `<h2 style="font-family:Calibri,Arial,sans-serif;font-size:14pt;color:#111;margin:14pt 0 6pt;">Summary</h2>
               <p style="font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.55;margin:0 0 18pt;color:#333;">${escapeHtml(
                 r.summary
               )}</p>`
            : ""
        }
        ${
          r.segments.length
            ? `<h2 style="font-family:Calibri,Arial,sans-serif;font-size:14pt;color:#111;margin:14pt 0 8pt;">Transcript</h2>` +
              r.segments
                .map(
                  (seg) => `
              <p style="font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.55;margin:0 0 10pt;color:#222;">
                ${seg.speaker ? `<strong style="color:#111;">${escapeHtml(seg.speaker)}</strong> ` : ""}
                <span style="color:#888;font-size:9.5pt;">[${escapeHtml(seg.timestamp)}]</span><br/>
                ${escapeHtml(seg.text)}
              </p>`
                )
                .join("")
            : ""
        }
      `;
    })
    .join('<div style="page-break-before:always;"></div>');

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(records[0]?.title ?? "Transcript")}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument>
</xml>
<![endif]-->
<style>@page WordSection1 { size:8.5in 11.0in; margin:1.0in 1.0in 1.0in 1.0in; } div.WordSection1 { page:WordSection1; }</style>
</head>
<body><div class="WordSection1">${body}</div></body>
</html>`;
}

/* ──────────────────────────────────────────
   SRT
   ────────────────────────────────────────── */

export function buildSrt(records: ExportableRecord[]): string {
  const cues: string[] = [];
  let n = 1;
  for (const r of records) {
    if (records.length > 1) {
      cues.push(`${n}\n00:00:00,000 --> 00:00:01,000\n— ${r.title} —\n`);
      n += 1;
    }
    for (let i = 0; i < r.segments.length; i++) {
      const seg = r.segments[i];
      const start = parseTimestamp(seg.timestamp);
      const end = Math.max(segmentEndSeconds(r, i), start + 1);
      const speaker = seg.speaker ? `${seg.speaker}: ` : "";
      cues.push(`${n}\n${secondsToSrt(start)} --> ${secondsToSrt(end)}\n${speaker}${seg.text}\n`);
      n += 1;
    }
  }
  return cues.join("\n");
}

/* ──────────────────────────────────────────
   VTT
   ────────────────────────────────────────── */

export function buildVtt(records: ExportableRecord[]): string {
  const cues: string[] = ["WEBVTT", ""];
  for (const r of records) {
    if (records.length > 1) {
      cues.push(`NOTE ${r.title}`);
      cues.push("");
    }
    for (let i = 0; i < r.segments.length; i++) {
      const seg = r.segments[i];
      const start = parseTimestamp(seg.timestamp);
      const end = Math.max(segmentEndSeconds(r, i), start + 1);
      const speaker = seg.speaker ? `<v ${seg.speaker}>` : "";
      cues.push(`${secondsToVtt(start)} --> ${secondsToVtt(end)}`);
      cues.push(`${speaker}${seg.text}`);
      cues.push("");
    }
  }
  return cues.join("\n");
}

/* ──────────────────────────────────────────
   PDF — minimal, hand-crafted, multi-page
   ────────────────────────────────────────── */

interface PdfLine {
  text: string;
  size: number;
  bold?: boolean;
  spacingBefore?: number;
}

const PDF_PAGE_WIDTH = 612; // 8.5"
const PDF_PAGE_HEIGHT = 792; // 11"
const PDF_MARGIN_X = 56;
const PDF_MARGIN_TOP = 56;
const PDF_MARGIN_BOTTOM = 56;
const PDF_LINE_HEIGHT_FACTOR = 1.4;
const PDF_USABLE_WIDTH = PDF_PAGE_WIDTH - PDF_MARGIN_X * 2;

/** Naive char-width estimate for Helvetica at given size. */
function approxCharWidth(size: number): number {
  return size * 0.5;
}

/** Wrap a string to a max pixel width using the naive char-width estimate. */
function wrapToWidth(text: string, size: number, maxWidth: number): string[] {
  const charW = approxCharWidth(size);
  const maxChars = Math.max(10, Math.floor(maxWidth / charW));
  const out: string[] = [];
  for (const para of text.split("\n")) {
    if (!para.trim()) {
      out.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (next.length > maxChars && line) {
        out.push(line);
        line = w;
      } else {
        line = next;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function recordsToPdfLines(records: ExportableRecord[]): PdfLine[] {
  const lines: PdfLine[] = [];
  records.forEach((r, idx) => {
    if (idx > 0) lines.push({ text: "\f", size: 0 }); // page break sentinel
    // Title
    for (const t of wrapToWidth(r.title, 20, PDF_USABLE_WIDTH))
      lines.push({ text: t, size: 20, bold: true });
    // Meta
    const meta = r.metadata;
    const metaParts = [meta?.date, meta?.duration, meta?.source].filter(Boolean) as string[];
    if (metaParts.length) {
      for (const t of wrapToWidth(metaParts.join(" • "), 10, PDF_USABLE_WIDTH))
        lines.push({ text: t, size: 10, spacingBefore: 6 });
    }
    // Summary
    if (r.summary) {
      lines.push({ text: "Summary", size: 13, bold: true, spacingBefore: 18 });
      for (const t of wrapToWidth(r.summary, 11, PDF_USABLE_WIDTH))
        lines.push({ text: t, size: 11, spacingBefore: 4 });
    }
    // Transcript
    if (r.segments.length) {
      lines.push({ text: "Transcript", size: 13, bold: true, spacingBefore: 18 });
      for (const seg of r.segments) {
        const header = `${seg.speaker ? seg.speaker + " " : ""}[${seg.timestamp}]`;
        lines.push({ text: header, size: 10.5, bold: true, spacingBefore: 10 });
        for (const t of wrapToWidth(seg.text, 11, PDF_USABLE_WIDTH))
          lines.push({ text: t, size: 11, spacingBefore: 2 });
      }
    }
  });
  return lines;
}

/** Encode a string for a PDF text-string (parens balanced, backslashes escaped, non-ASCII via \\xxx octal). */
function escapePdfString(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (ch === "\\") out += "\\\\";
    else if (ch === "(") out += "\\(";
    else if (ch === ")") out += "\\)";
    else if (code >= 32 && code <= 126) out += ch;
    else if (code < 256) out += "\\" + code.toString(8).padStart(3, "0");
    else out += "?"; // outside Latin-1, replaced
  }
  return out;
}

export function buildPdfBlob(records: ExportableRecord[]): Blob {
  const lines = recordsToPdfLines(records);
  const pages: PdfLine[][] = [[]];
  let yLeft = PDF_PAGE_HEIGHT - PDF_MARGIN_TOP - PDF_MARGIN_BOTTOM;
  for (const line of lines) {
    if (line.text === "\f") {
      pages.push([]);
      yLeft = PDF_PAGE_HEIGHT - PDF_MARGIN_TOP - PDF_MARGIN_BOTTOM;
      continue;
    }
    const lineHeight = line.size * PDF_LINE_HEIGHT_FACTOR;
    const totalHeight = lineHeight + (line.spacingBefore ?? 0);
    if (yLeft - totalHeight < 0) {
      pages.push([]);
      yLeft = PDF_PAGE_HEIGHT - PDF_MARGIN_TOP - PDF_MARGIN_BOTTOM;
    }
    pages[pages.length - 1].push(line);
    yLeft -= totalHeight;
  }

  // Build content stream per page.
  const pageStreams = pages.map((pageLines) => {
    let stream = "";
    let y = PDF_PAGE_HEIGHT - PDF_MARGIN_TOP;
    for (const ln of pageLines) {
      const lineHeight = ln.size * PDF_LINE_HEIGHT_FACTOR;
      y -= lineHeight + (ln.spacingBefore ?? 0);
      const font = ln.bold ? "F2" : "F1";
      stream += `BT /${font} ${ln.size} Tf ${PDF_MARGIN_X} ${y.toFixed(2)} Td (${escapePdfString(
        ln.text
      )}) Tj ET\n`;
    }
    return stream;
  });

  // Build PDF objects.
  const objects: string[] = [];
  // 1: Catalog → 2 (Pages)
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  // 2: Pages → kids
  // (filled below once we know kid IDs)
  objects.push("PLACEHOLDER_PAGES");
  // 3: Font F1 (Helvetica)
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  // 4: Font F2 (Helvetica-Bold)
  objects.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
  );
  // Pages and content streams (one of each, interleaved).
  const pageObjIds: number[] = [];
  pageStreams.forEach((stream) => {
    const pageId = objects.length + 1;
    pageObjIds.push(pageId);
    objects.push("PLACEHOLDER_PAGE_" + pageId);
    const contentId = objects.length + 1;
    const streamBody = stream;
    objects.push(`<< /Length ${streamBody.length} >>\nstream\n${streamBody}endstream`);
    // Replace page placeholder.
    objects[pageId - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
  });
  // Fill Pages object.
  objects[1] =
    `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjIds.length} >>`;

  // Serialize.
  let pdf = "%PDF-1.4\n%\xff\xff\xff\xff\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const off of offsets) pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  // Encode as Latin-1 bytes (we restricted content to that).
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: "application/pdf" });
}

/* ──────────────────────────────────────────
   Public entrypoint
   ────────────────────────────────────────── */

export function exportRecords(records: ExportableRecord[], format: ExportFormat): void {
  if (!records.length) return;
  const meta = FORMAT_META[format];
  const baseName =
    records.length === 1 ? safeFilename(records[0].title) : `transcripts-${records.length}`;
  const filename = `${baseName}.${meta.extension}`;

  let blob: Blob;
  switch (format) {
    case "txt":
      blob = new Blob([buildTxt(records)], { type: meta.mime });
      break;
    case "docx":
      blob = new Blob([buildDocx(records)], { type: meta.mime });
      break;
    case "srt":
      blob = new Blob([buildSrt(records)], { type: meta.mime });
      break;
    case "vtt":
      blob = new Blob([buildVtt(records)], { type: meta.mime });
      break;
    case "pdf":
      blob = buildPdfBlob(records);
      break;
  }

  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
