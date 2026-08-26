import { useSearchParams } from "react-router";
import {
  EMAIL_SAMPLES,
  buildShareEmail,
  shareEmailSubject,
} from "@/lib/share-emails";

/* The letters, drawn where they are actually read.
 *
 * A letter shown on its own tells you nothing about whether it works: what
 * decides that is the line in the list, the subject, and the sender. So the
 * frame carries the mail client's own chrome around the real HTML, and the
 * body inside it is the exact markup that gets sent.
 */

/** The document the builder makes is a whole page; only its body goes on screen. */
function bodyOf(html: string): string {
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return m ? m[1] : html;
}

export function EmailPreviewPage() {
  const [params] = useSearchParams();
  const key = params.get("tpl") ?? "record_registered";
  const sample = EMAIL_SAMPLES[key] ?? EMAIL_SAMPLES.record_registered;
  const html = buildShareEmail({ ...sample, logoUrl: "/images/logo-full.svg" });
  const subject = shareEmailSubject(sample);

  return (
    <div className="min-h-screen bg-[#f4f4f5] px-4 py-8">
      <div className="mx-auto w-full max-w-[720px]">
        <div className="overflow-hidden rounded-[16px] border border-border bg-card">
          {/* The client's own header, so the subject and the sender are read
              together with the letter rather than guessed at. */}
          <div className="border-b border-border px-5 py-4">
            <p className="text-[16px] font-semibold leading-[22px] text-foreground">{subject}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="flex size-[28px] shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                style={{ background: sample.senderTint, color: sample.senderInk }}
              >
                {sample.senderInitials}
              </span>
              <span className="text-[13px] text-foreground">Transcribe To Text</span>
              <span className="text-[13px] text-muted-foreground">&lt;notifications@transcribetotext.ai&gt;</span>
              <span className="ml-auto text-[12px] text-muted-foreground">9:41</span>
            </div>
          </div>

          {/* The letter itself. Put into the page rather than an iframe: the
              capture that turns this screen into layers cannot see inside a
              frame, and a letter that does not reach Figma is not a design.
              Every rule in the markup is inline, so nothing from the app
              reaches it. */}
          <div dangerouslySetInnerHTML={{ __html: bodyOf(html) }} />
        </div>
      </div>
    </div>
  );
}
