import { useMemo } from "react";

import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/app/components/ui/tooltip";

import { useLanguage } from "@/app/components/language-context";
import { getInitials } from "@/lib/format";
import { getShareStatus } from "@/lib/shares";
import type { Share, ShareStatus } from "@/lib/shares";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SharedUsersAvatarsProps {
  shares: Share[];
  maxVisible?: number;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<ShareStatus, string> = {
  pending: "bg-amber-400",
  active: "bg-emerald-400",
  viewed: "bg-primary",
};

function statusLabel(status: ShareStatus, t: (k: string) => string): string {
  switch (status) {
    case "pending":
      return t("share.statusPending");
    case "active":
      return t("share.statusActive");
    case "viewed":
      return t("share.statusViewed");
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SharedUsersAvatars({
  shares,
  maxVisible = 4,
}: SharedUsersAvatarsProps) {
  const { t } = useLanguage();

  const visible = useMemo(() => shares.slice(0, maxVisible), [shares, maxVisible]);
  const overflow = shares.length - maxVisible;

  if (shares.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center -space-x-2">
        {visible.map((share) => {
          const status = getShareStatus(share);
          const initials = getInitials(share.shared_with_email);
          const label = statusLabel(status, t);

          return (
            <Tooltip key={share.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="size-7 border-2 border-background cursor-default">
                    <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Status dot */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background ${STATUS_COLORS[status]}`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p className="font-medium">{share.shared_with_email}</p>
                <p className="text-muted-foreground">{label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="size-7 rounded-full bg-muted border-2 border-background flex items-center justify-center cursor-default">
                <span className="text-[10px] font-medium text-muted-foreground">
                  +{overflow}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {shares.slice(maxVisible).map((s) => (
                <p key={s.id}>{s.shared_with_email}</p>
              ))}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
