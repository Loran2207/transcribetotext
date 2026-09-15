/* The letter that says a transcript is ready.
 *
 * Same rules as the sharing letters: one table, inline styles, no web fonts,
 * so the Figma frame and the mailbox show the same thing. The reader is the
 * owner of the file, so the letter may name it and say how long it is; it
 * still carries none of the words that were said.
 *
 * The one thing this letter must do better than the competitors' is the name.
 * A name can be a whole YouTube title, or a file called "1003 Participant 3.wav":
 * it gets its own card, the largest type on the page, and is allowed to wrap
 * over several lines rather than be squeezed into a sentence.
 */

const INK = "#09090b";
const MUTED = "#71717b";
const BORDER = "#e4e4e7";
const SOFT = "#fafafa";
const PRIMARY = "#1447e6";
const PRIMARY_INK = "#eff6ff";
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type ReadySource = "file" | "youtube" | "link" | "call";

export interface TranscriptReadyInput {
  /** What was transcribed: a file, a YouTube video, a link or a recorded call. */
  source: ReadySource;
  /** The file name or the video title, exactly as the person will recognise it. */
  name: string;
  /** "42 min" - the only fact about the content the letter carries. */
  duration: string;
  language: string;
  url: string;
  settingsUrl: string;
  unsubscribeUrl: string;
  logoUrl?: string;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const SOURCE_LABEL: Record<ReadySource, string> = {
  file: "File",
  youtube: "YouTube video",
  link: "Link",
  call: "Recorded call",
};

export function transcriptReadySubject(i: TranscriptReadyInput): string {
  /* the name goes into the subject, so the inbox row already says which one */
  return `Transcript ready: ${i.name}`;
}

export function buildTranscriptReadyEmail(i: TranscriptReadyInput): string {
  const logo = i.logoUrl ?? "/images/logo-full.svg";
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(transcriptReadySubject(i))}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
 <tr><td align="center" style="padding:32px 16px;">
  <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;">
   <!-- Top band -->
   <tr><td style="padding:22px 32px 20px 32px;border-bottom:1px solid ${BORDER};">
     <img src="${esc(logo)}" alt="Transcribe To Text" width="150" style="display:block;height:19px;width:auto;border:0;">
   </td></tr>

   <!-- What happened, in one line -->
   <tr><td style="padding:30px 32px 0 32px;">
     <div style="font:600 20px/26px ${FONT};color:${INK};letter-spacing:-0.2px;">Your transcript is ready</div>
     <div style="padding-top:6px;font:400 14px/20px ${FONT};color:${MUTED};">Open it to read, search or export. It stays in your records.</div>
   </td></tr>

   <!-- The thing that got transcribed: the name is the loudest thing on the page and may take several lines -->
   <tr><td style="padding:22px 32px 0 32px;">
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="width:100%;background:${SOFT};border:1px solid ${BORDER};border-radius:12px;">
      <tr><td style="padding:16px 18px;">
        <div style="font:500 12px/16px ${FONT};color:${MUTED};">${SOURCE_LABEL[i.source]}</div>
        <div style="padding-top:4px;font:600 18px/25px ${FONT};color:${INK};letter-spacing:-0.2px;word-break:break-word;overflow-wrap:anywhere;">
          ${esc(i.name)}
        </div>
        <div style="padding-top:8px;font:400 13px/18px ${FONT};color:${MUTED};">${esc(i.duration)} &middot; ${esc(i.language)}</div>
      </td></tr>
     </table>
   </td></tr>

   <!-- One way in -->
   <tr><td style="padding:22px 32px 30px 32px;">
    <a href="${esc(i.url)}"
       style="display:inline-block;background:${PRIMARY};color:${PRIMARY_INK};text-decoration:none;
              padding:13px 26px;border-radius:999px;font:600 15px/19px ${FONT};">Open transcript</a>
   </td></tr>

   <!-- Bottom band: why this came, and the one place to turn it off -->
   <tr><td style="padding:18px 32px;background:${SOFT};border-top:1px solid ${BORDER};
                  border-radius:0 0 16px 16px;font:400 12px/18px ${FONT};color:${MUTED};">
     You get a letter when a transcription finishes.
     <a href="${esc(i.settingsUrl)}" style="color:${MUTED};text-decoration:underline;">Turn it off in Settings</a>
     &middot; <a href="${esc(i.unsubscribeUrl)}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a>
   </td></tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
 </td></tr>
</table>
</body></html>`;
}

const LINKS = {
  url: "https://app.transcribetotext.ai/transcriptions/8f3a2c41d9",
  settingsUrl: "https://app.transcribetotext.ai/settings/notifications",
  unsubscribeUrl: "https://app.transcribetotext.ai/unsubscribe/8f3a2c41d9",
};

export const READY_SAMPLES: Record<string, TranscriptReadyInput> = {
  ready_file: { ...LINKS, source: "file", name: "1003 Participant 3.wav", duration: "38 min", language: "English" },
  ready_youtube: { ...LINKS, source: "youtube", name: "Шиномонтаж №1 в России. Путь из мойщика машин в миллионеры. Айдар Исмагилов / Оскар Хартманн", duration: "1 h 12 min", language: "Russian" },
  ready_call: { ...LINKS, source: "call", name: "Nexora <> QL | Instance Daily Sync", duration: "24 min", language: "English" },
};
