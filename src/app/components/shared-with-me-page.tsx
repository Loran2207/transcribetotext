import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { UserMultiple02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { SourceIcon, type SourceType } from "@/app/components/source-icons";
import { useLanguage } from "@/app/components/language-context";
import { getSharedWithMe, type Share } from "@/lib/shares";
import { getInitials } from "@/lib/format";
import { records } from "@/app/components/records-table";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/** Try to resolve a mock record by ID for demo purposes. */
function findMockRecord(resourceId: string) {
  return records.find((r) => r.id === resourceId) ?? null;
}

/** Get display name for the share owner. */
function getOwnerDisplay(share: Share, fallbackLabel: string): string {
  if (share.owner_email) return share.owner_email;
  return fallbackLabel;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SharedItem {
  share: Share;
  name: string;
  source: SourceType;
  duration: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SharedWithMePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const shares = await getSharedWithMe();
        if (cancelled) return;

        const mapped: SharedItem[] = shares.map((share) => {
          const mock = findMockRecord(share.resource_id);
          return {
            share,
            name: mock?.name ?? `Shared ${share.resource_type}`,
            source: mock?.source ?? "mp3",
            duration: mock?.duration ?? "--",
          };
        });

        setItems(mapped);
      } catch {
        // Silently handle — demo app may not have DB tables
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  const animProps = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-8 pt-8 pb-4">
        <motion.div {...animProps(0)}>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("nav.sharedWithMe")}
          </h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            {t("shared.subtitle")}
          </p>
        </motion.div>
      </div>

      <motion.div {...animProps(0.08)} className="px-8">
        {loading ? (
          <div className="space-y-3 mt-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 h-[52px]">
                <Skeleton className="size-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[60%]" />
                  <Skeleton className="h-3 w-[30%]" />
                </div>
                <Skeleton className="h-6 w-[70px] rounded-full" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-[calc(100vh-180px)]">
            {/* Table header */}
            <div className="flex items-center h-[36px] border-b border-border text-[12px] font-medium text-muted-foreground uppercase tracking-[0.4px]">
              <div className="flex-1 min-w-0 pl-1">{t("table.name")}</div>
              <div className="w-[160px] shrink-0">{t("shared.sharedBy")}</div>
              <div className="w-[100px] shrink-0">{t("shared.access")}</div>
              <div className="w-[120px] shrink-0">{t("shared.dateShared")}</div>
              <div className="w-[60px] shrink-0 text-center">{t("table.type")}</div>
            </div>

            {/* Table rows */}
            {items.map((item, index) => {
              const ownerDisplay = getOwnerDisplay(item.share, t("shared.unknownOwner"));
              const ownerInitials = item.share.owner_email
                ? getInitials(item.share.owner_email)
                : "?";
              const accessLabel =
                item.share.access_level === "editor"
                  ? t("share.editor")
                  : t("share.viewer");

              return (
                <motion.div
                  key={item.share.id}
                  {...(prefersReducedMotion
                    ? {}
                    : {
                        initial: { opacity: 0, y: 8 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.25, delay: index * 0.04 },
                      })}
                  className="flex items-center h-[48px] border-b border-border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/transcriptions/${item.share.resource_id}`)}
                >
                  {/* Name */}
                  <div className="flex-1 min-w-0 flex items-center gap-3 pl-1">
                    <SourceIcon source={item.source} />
                    <span className="text-[14px] font-medium text-foreground truncate">
                      {item.name}
                    </span>
                  </div>

                  {/* Shared by */}
                  <div className="w-[160px] shrink-0 flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                        {ownerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[13px] text-muted-foreground truncate">
                      {ownerDisplay}
                    </span>
                  </div>

                  {/* Access level */}
                  <div className="w-[100px] shrink-0">
                    <Badge
                      variant="secondary"
                      className={`rounded-full text-[11px] ${
                        item.share.access_level === "editor"
                          ? "bg-primary/10 text-primary"
                          : ""
                      }`}
                    >
                      {accessLabel}
                    </Badge>
                  </div>

                  {/* Date shared */}
                  <div className="w-[120px] shrink-0">
                    <span className="text-[13px] text-muted-foreground">
                      {formatDate(item.share.created_at)}
                    </span>
                  </div>

                  {/* Source type */}
                  <div className="w-[60px] shrink-0 flex justify-center">
                    <SourceIcon source={item.source} />
                  </div>
                </motion.div>
              );
            })}
          </ScrollArea>
        )}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 px-6">
      <div className="size-[72px] rounded-2xl bg-primary/5 flex items-center justify-center">
        <Icon icon={UserMultiple02Icon} size={32} className="text-primary/60" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">
          {t("shared.emptyTitle")}
        </h2>
        <p className="text-[14px] text-muted-foreground mt-1.5 max-w-[320px]">
          {t("shared.emptyDesc")}
        </p>
      </div>
    </div>
  );
}
