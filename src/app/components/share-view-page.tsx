import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { Link01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Separator } from "@/app/components/ui/separator";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { SourceIcon, type SourceType } from "@/app/components/source-icons";
import { useLanguage } from "@/app/components/language-context";
import { validateShareToken, type ShareLink } from "@/lib/shares";
import { records, type RecordRow } from "@/app/components/records-table";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a mock record for demo display. */
function findMockRecord(resourceId: string): RecordRow | null {
  return records.find((r) => r.id === resourceId) ?? null;
}

// Mock transcript segments for demo display
const DEMO_SEGMENTS = [
  { speaker: "Speaker 1", timestamp: "0:00", text: "Welcome everyone, let's get started with today's discussion." },
  { speaker: "Speaker 2", timestamp: "0:15", text: "Thanks for organizing this. I have some updates on the project timeline." },
  { speaker: "Speaker 1", timestamp: "0:32", text: "Great, please go ahead and share what you have." },
  { speaker: "Speaker 2", timestamp: "0:45", text: "We've completed the initial phase ahead of schedule. The integration testing is now underway and we expect results by end of week." },
  { speaker: "Speaker 1", timestamp: "1:12", text: "That's excellent progress. Any blockers we should be aware of?" },
  { speaker: "Speaker 2", timestamp: "1:25", text: "One minor issue with the API rate limits, but the team has a workaround in place." },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShareViewPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  const [loading, setLoading] = useState(true);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [record, setRecord] = useState<RecordRow | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function validate() {
      setLoading(true);
      try {
        const link = await validateShareToken(token!);
        if (cancelled) return;
        setShareLink(link);

        if (link) {
          const mockRecord = findMockRecord(link.resource_id);
          setRecord(mockRecord);
        }
      } catch {
        if (!cancelled) setShareLink(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void validate();
    return () => { cancelled = true; };
  }, [token]);

  const animProps = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
        };

  if (loading) {
    return <LoadingState />;
  }

  if (!shareLink) {
    return <InvalidLinkState prefersReducedMotion={prefersReducedMotion} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <Icon icon={Link01Icon} size={18} className="text-primary" />
          <span className="text-[14px] font-medium text-foreground">
            {t("shareView.title")}
          </span>
        </div>
        <Link to="/login">
          <Button variant="outline" className="rounded-full text-[13px] h-8 px-4">
            {t("shareView.signIn")}
          </Button>
        </Link>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Title and meta */}
          <motion.div {...animProps(0)}>
            <div className="flex items-center gap-3 mb-2">
              {record && <SourceIcon source={record.source} />}
              <h1 className="text-2xl font-semibold text-foreground">
                {record?.name ?? t("shareView.sharedTranscription")}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
              {record?.duration && <span>{record.duration}</span>}
              {record?.dateCreated && (
                <>
                  <span className="size-1 rounded-full bg-muted-foreground/40" />
                  <span>{record.dateCreated}</span>
                </>
              )}
              {record?.language && (
                <>
                  <span className="size-1 rounded-full bg-muted-foreground/40" />
                  <span className="uppercase">{record.language}</span>
                </>
              )}
            </div>
          </motion.div>

          <Separator className="my-6" />

          {/* Summary */}
          {record?.summary && (
            <motion.div {...animProps(0.08)} className="mb-8">
              <h2 className="text-[15px] font-semibold text-foreground mb-3">
                {t("shareView.summary")}
              </h2>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-[14px] text-foreground leading-relaxed">
                  {record.summary}
                </p>
              </div>
            </motion.div>
          )}

          {/* Transcript */}
          <motion.div {...animProps(0.16)}>
            <h2 className="text-[15px] font-semibold text-foreground mb-3">
              {t("shareView.transcript")}
            </h2>
            <div className="space-y-4">
              {DEMO_SEGMENTS.map((segment, index) => (
                <motion.div
                  key={index}
                  {...(prefersReducedMotion
                    ? {}
                    : {
                        initial: { opacity: 0, y: 8 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.25, delay: 0.2 + index * 0.05 },
                      })}
                  className="flex gap-4"
                >
                  <div className="w-[80px] shrink-0 pt-0.5">
                    <span className="text-[12px] font-medium text-primary">
                      {segment.speaker}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {segment.timestamp}
                    </p>
                  </div>
                  <p className="text-[14px] text-foreground leading-relaxed flex-1">
                    {segment.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <Separator className="my-8" />

          {/* Footer CTA */}
          <motion.div
            {...animProps(0.24)}
            className="text-center py-6"
          >
            <p className="text-[13px] text-muted-foreground mb-3">
              {t("shareView.poweredBy")}
            </p>
            <Link to="/signup">
              <Button className="rounded-full px-6">
                {t("shareView.signUpFree")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border flex items-center px-6 shrink-0">
        <Skeleton className="h-5 w-[180px]" />
      </header>
      <div className="max-w-3xl mx-auto px-6 py-8 w-full space-y-6">
        <Skeleton className="h-8 w-[60%]" />
        <Skeleton className="h-4 w-[30%]" />
        <Separator />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="h-4 w-[70%]" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invalid / expired link
// ---------------------------------------------------------------------------

function InvalidLinkState({ prefersReducedMotion }: { prefersReducedMotion: boolean | null }) {
  const { t } = useLanguage();

  const animProps = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div {...animProps(0)} className="text-center max-w-md">
        <div className="size-[72px] rounded-2xl bg-destructive/5 flex items-center justify-center mx-auto mb-5">
          <Icon icon={Link01Icon} size={32} className="text-destructive/60" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">
          {t("shareView.linkExpired")}
        </h1>
        <p className="text-[14px] text-muted-foreground mb-6">
          {t("shareView.linkExpiredDesc")}
        </p>
        <Link to="/login">
          <Button className="rounded-full px-6">
            {t("shareView.goToApp")}
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
