import { useSearchParams } from "react-router";
import { Link } from "react-router";

import { Button } from "@/app/components/ui/button";
import { useLanguage } from "@/app/components/language-context";
import { getInitials } from "@/lib/format";
import { SHARED_OWNERS } from "@/lib/share-demo";

/* What a link actually opens.
 *
 * The page a stranger lands on used to print the whole record: transcript,
 * summary, date, duration. A link can be forwarded, and a forwarded link that
 * reads out the meeting before anyone signs in gives the record away. So this
 * page says exactly three things - who sent it, what it is, and the two ways
 * in - and nothing else. The record itself is behind the sign in.
 */

const RECORD_NAME = "Weekly product sync - Q2 roadmap";
const FOLDER_NAME = "Q2 research calls";

export function ShareViewPage() {
  const [params] = useSearchParams();
  const state = params.get("state") ?? "invite";
  const isFolder = params.get("kind") === "folder";

  if (state === "invalid") return <InvalidLink />;
  if (state === "card") return <MessengerCard isFolder={isFolder} />;
  return <InviteLanding isFolder={isFolder} />;
}

/* ------------------------------------------------------------------ */
/* 10.1 The screen an emailed link opens for somebody not signed in.    */

function InviteLanding({ isFolder }: { isFolder: boolean }) {
  const { t } = useLanguage();
  const owner = SHARED_OWNERS.emma;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10">
      <div className="flex w-full max-w-[400px] flex-col items-center text-center">
        <img src="/images/logo-full.svg" alt="Transcribe To Text" className="mb-10 h-[22px]" />

        <span
          className="mb-5 flex size-[56px] items-center justify-center overflow-hidden rounded-full text-[18px] font-medium"
          style={{ background: owner.tint, color: owner.ink }}
        >
          {owner.avatar ? <img src={owner.avatar} alt="" className="size-full object-cover" /> : getInitials(owner.name)}
        </span>

        <p className="text-[15px] leading-[22px] text-muted-foreground">
          {t(isFolder ? "shareView.sharedFolderWithYou" : "shareView.sharedWithYou").replace("{owner}", owner.name)}
        </p>

        <h1 className="mt-2 text-[22px] font-bold leading-[30px] tracking-[-0.3px] text-foreground">
          {isFolder ? FOLDER_NAME : RECORD_NAME}
        </h1>

        {/* Two ways in and nothing under them. Whatever else could be written
            here would be a fact about a record the reader has not earned yet. */}
        <div className="mt-8 flex w-full flex-col gap-2.5">
          <Link to="/signup" className="w-full">
            <Button className="h-11 w-full rounded-full text-[14px] font-semibold">
              {t("shareView.signUp")}
            </Button>
          </Link>
          <Link to="/login" className="w-full">
            <Button variant="pill-outline" className="h-11 w-full text-[14px] font-medium">
              {t("shareView.logIn")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10.2 One screen for every dead link: revoked, deleted, switched off.  */

function InvalidLink() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10">
      <div className="flex w-full max-w-[400px] flex-col items-center text-center">
        <img src="/images/logo-full.svg" alt="Transcribe To Text" className="mb-10 h-[22px]" />

        <span className="mb-5 flex size-[56px] items-center justify-center rounded-full bg-muted">
          <svg className="size-[26px] text-muted-foreground" fill="none" viewBox="0 0 24 24">
            <path d="M9.5 14.5l5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M11 6.5l1.6-1.6a4 4 0 015.6 5.6L16.6 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M13 17.5l-1.6 1.6a4 4 0 01-5.6-5.6L7.4 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>

        <h1 className="text-[22px] font-bold leading-[30px] tracking-[-0.3px] text-foreground">
          {t("shareView.linkNotValid")}
        </h1>
        <p className="mt-2 text-[14px] leading-[21px] text-muted-foreground">
          {t("shareView.linkNotValidDesc")}
        </p>

        <Link to="/" className="mt-8 w-full">
          <Button className="h-11 w-full rounded-full text-[14px] font-semibold">
            {t("shareView.goHome")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10.3 What the link looks like when it is pasted into a chat.         */

function MessengerCard({ isFolder }: { isFolder: boolean }) {
  const { t } = useLanguage();
  const owner = SHARED_OWNERS.emma;
  const line = t(isFolder ? "shareView.sharedFolderWithYou" : "shareView.sharedWithYou").replace("{owner}", owner.name);

  /* Drawn inside a message, because that is the only place this card is ever
     seen, and its size only means something next to the bubble around it. */
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10" style={{ background: "#F4F4F5" }}>
      <div className="w-full max-w-[420px]">
        <div className="flex items-start gap-2">
          <span
            className="mt-[2px] flex size-[28px] shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
            style={{ background: owner.tint, color: owner.ink }}
          >
            {getInitials(owner.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="inline-block max-w-full rounded-[18px] rounded-bl-[6px] bg-card px-3.5 py-2.5 text-[14px] leading-[20px] text-foreground shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
              Have a look at this one
            </div>

            <div className="mt-1.5 overflow-hidden rounded-[14px] border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
                <img src="/images/logo-mark.svg" alt="" className="size-[18px]" />
                <span className="text-[12px] font-medium text-muted-foreground">transcribetotext.ai</span>
              </div>
              <div className="px-3.5 py-3">
                <p className="text-[12.5px] leading-[18px] text-muted-foreground">{line}</p>
                <p className="mt-1 text-[14.5px] font-semibold leading-[20px] text-foreground">
                  {isFolder ? FOLDER_NAME : RECORD_NAME}
                </p>
              </div>
            </div>

            <p className="mt-1.5 text-[11px] text-muted-foreground">9:41</p>
          </div>
        </div>
      </div>
    </div>
  );
}
