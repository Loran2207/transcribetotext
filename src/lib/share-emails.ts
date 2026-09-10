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
const SOFT = "#fafafa";
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
     who does not. It sits under the button, so the reader meets the way in
     first and the condition second. */
  const gate = i.registered
    ? ""
    : `<tr><td style="padding:12px 0 0 0;font:400 13px/20px ${FONT};color:${MUTED};">
         You will need a free account to open it. It takes a minute.
       </td></tr>`;

  /* What the reader is actually being handed, drawn as an object rather than
     printed as a headline: a quiet card carrying the kind and the name. The
     letter still says nothing about what is inside - no transcript, no summary,
     no speakers, no duration - so a mailbox stays a mailbox. */
  const kindLabel = i.kind === "folder" ? "Folder" : "Record";

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(shareEmailSubject(i))}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
 <tr><td align="center" style="padding:32px 16px;">
  <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;">
   <!-- Top band: the letter has a head, so the body reads as a body. -->
   <tr><td style="padding:22px 32px 20px 32px;border-bottom:1px solid ${BORDER};">
     <img src="${esc(logo)}" alt="Transcribe To Text" width="150" style="display:block;height:19px;width:auto;border:0;">
   </td></tr>

   <!-- Who, and what they did, as one block: the sentence belongs under the
        name it is about, not floating between two other things. -->
   <tr><td style="padding:30px 32px 0 32px;">
     <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
       <td width="44" valign="top" style="width:44px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
               style="width:44px;height:44px;background:${i.senderTint};border-radius:22px;">
         <tr><td align="center" style="font:600 15px/44px ${FONT};color:${i.senderInk};height:44px;">
           ${esc(i.senderInitials)}
         </td></tr>
        </table>
       </td>
       <td valign="top" style="padding-left:14px;">
        <div style="font:600 16px/22px ${FONT};color:${INK};">${esc(i.senderName)}</div>
        <div style="padding-top:2px;font:400 14px/20px ${FONT};color:${MUTED};">shared ${what} with you</div>
       </td>
      </tr>
     </table>
   </td></tr>

   <!-- The thing itself, as an object you could pick up. -->
   <tr><td style="padding:22px 32px 0 32px;">
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="width:100%;background:${SOFT};border:1px solid ${BORDER};border-radius:12px;">
      <tr><td style="padding:16px 18px;">
        <div style="font:500 12px/16px ${FONT};color:${MUTED};">${kindLabel}</div>
        <div style="padding-top:4px;font:600 18px/25px ${FONT};color:${INK};letter-spacing:-0.2px;">
          ${esc(i.resourceName)}
        </div>
      </td></tr>
     </table>
   </td></tr>

   <tr><td style="padding:22px 32px 30px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
     <tr><td>
      <a href="${esc(i.url)}"
         style="display:inline-block;background:${PRIMARY};color:${PRIMARY_INK};text-decoration:none;
                padding:13px 26px;border-radius:999px;font:600 15px/19px ${FONT};">${cta}</a>
     </td></tr>${gate}
    </table>
   </td></tr>

   <!-- Bottom band: one sentence, in the words the dialog itself uses. -->
   <tr><td style="padding:18px 32px;background:${SOFT};border-top:1px solid ${BORDER};
                  border-radius:0 0 16px 16px;font:400 12px/18px ${FONT};color:${MUTED};">
     You are getting this because ${esc(i.senderName)} shared it with this address.
     Only invited people can open it.
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
