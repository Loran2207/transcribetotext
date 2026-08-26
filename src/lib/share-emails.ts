/* The four letters sharing sends.
 *
 * Written as the HTML that actually goes out - one table, inline styles, no
 * class names, no web fonts - so what is drawn in Figma and what lands in a
 * mailbox are the same thing rather than a picture of each other.
 *
 * The spec is strict about what a letter may carry: who sent it, what it is
 * called, and one way in. No transcript, no summary, no speakers, no date, no
 * duration. A mailbox is not a place to leak a meeting.
 *
 * The palette is the product's own, resolved out of oklch because mail clients
 * do not understand it.
 */

const INK = "#09090b";
const MUTED = "#71717b";
const BORDER = "#e4e4e7";
const PRIMARY = "#1447e6";
const PRIMARY_INK = "#eff6ff";
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type EmailKind = "record" | "folder";

export interface ShareEmailInput {
  kind: EmailKind;
  /** A person who already has an account gets a way in, not a way to sign up. */
  registered: boolean;
  senderName: string;
  senderInitials: string;
  senderTint: string;
  senderInk: string;
  resourceName: string;
  url: string;
  /** Absolute in production; the preview serves it from the app. */
  logoUrl?: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function shareEmailSubject(i: ShareEmailInput): string {
  const what = i.kind === "folder" ? "a folder" : "a record";
  return `${i.senderName} shared ${what} with you`;
}

export function buildShareEmail(i: ShareEmailInput): string {
  const what = i.kind === "folder" ? "a folder" : "a record";
  const openLabel = i.kind === "folder" ? "Open folder" : "Open record";
  const cta = i.registered ? openLabel : "Sign up free to view";
  const logo = i.logoUrl ?? "/images/logo-full.svg";

  /* The one line that differs between a person who has an account and a person
     who does not. It is placed under the name, where the reader is already
     looking, rather than in the footer where nobody reads. */
  const gate = i.registered
    ? ""
    : `<tr><td style="padding:0 0 4px 0;font:400 14px/21px ${FONT};color:${MUTED};">
         You will need a free account to open it. It takes a minute.
       </td></tr>`;

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(shareEmailSubject(i))}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
 <tr><td align="center" style="padding:32px 16px;">
  <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;">
   <tr><td style="padding:28px 32px 0 32px;">
     <img src="${esc(logo)}" alt="Transcribe To Text" width="150" style="display:block;height:20px;width:auto;border:0;">
   </td></tr>

   <tr><td style="padding:24px 32px 0 32px;">
     <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
       <td width="40" style="width:40px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
               style="width:40px;height:40px;background:${i.senderTint};border-radius:20px;">
         <tr><td align="center" style="font:500 14px/40px ${FONT};color:${i.senderInk};height:40px;">
           ${esc(i.senderInitials)}
         </td></tr>
        </table>
       </td>
       <td style="padding-left:12px;font:600 15px/20px ${FONT};color:${INK};">
        ${esc(i.senderName)}
       </td>
      </tr>
     </table>
   </td></tr>

   <tr><td style="padding:14px 32px 0 32px;font:400 14px/21px ${FONT};color:${MUTED};">
     shared ${what} with you
   </td></tr>

   <tr><td style="padding:4px 32px 0 32px;font:700 22px/30px ${FONT};color:${INK};letter-spacing:-0.3px;">
     ${esc(i.resourceName)}
   </td></tr>

   <tr><td style="padding:18px 32px 0 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">${gate}
     <tr><td>
      <a href="${esc(i.url)}"
         style="display:inline-block;background:${PRIMARY};color:${PRIMARY_INK};text-decoration:none;
                padding:12px 24px;border-radius:999px;font:600 14px/18px ${FONT};">${cta}</a>
     </td></tr>
    </table>
   </td></tr>

   <tr><td style="padding:26px 32px 28px 32px;">
     <div style="height:1px;background:${BORDER};line-height:1px;font-size:0;">&nbsp;</div>
     <div style="padding-top:14px;font:400 12px/18px ${FONT};color:${MUTED};">
       You are getting this because ${esc(i.senderName)} shared ${what} with this address.
       Only people who have been given access can open it.
     </div>
   </td></tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
 </td></tr>
</table>
</body></html>`;
}

export const EMAIL_SENDER = {
  senderName: "Emma Larsen",
  senderInitials: "EL",
  senderTint: "#dbeafe",
  senderInk: "#1d4ed8",
};

export const EMAIL_SAMPLES: Record<string, ShareEmailInput> = {
  record_registered: {
    ...EMAIL_SENDER,
    kind: "record",
    registered: true,
    resourceName: "Weekly product sync - Q2 roadmap",
    url: "https://transcribetotext.ai/share/8f3a2c41d9",
  },
  record_new: {
    ...EMAIL_SENDER,
    kind: "record",
    registered: false,
    resourceName: "Weekly product sync - Q2 roadmap",
    url: "https://transcribetotext.ai/share/8f3a2c41d9",
  },
  folder_registered: {
    ...EMAIL_SENDER,
    kind: "folder",
    registered: true,
    resourceName: "Q2 research calls",
    url: "https://transcribetotext.ai/share/2b71e0c4aa",
  },
  folder_new: {
    ...EMAIL_SENDER,
    kind: "folder",
    registered: false,
    resourceName: "Q2 research calls",
    url: "https://transcribetotext.ai/share/2b71e0c4aa",
  },
};
