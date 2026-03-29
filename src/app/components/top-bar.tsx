import { useState, useRef, useEffect } from "react";
import { Search, Help, Settings, Globe, LogOut, Zap, ChevronDown } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Button } from "./ui/button";
import { useLanguage, LANGUAGES } from "./language-context";
import { SearchModal } from "./search-modal";
import { useUserProfile } from "./user-profile-context";
import { useAuth } from "./auth-context";

// Profile and avatar synced via UserProfileContext
interface TopBarProps {
  onNavigate: (page: string) => void;
}

/* ── Profile Dropdown ── */
function ProfileDropdown({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { lang, setLang, t } = useLanguage();
  const { displayName, avatarSrc } = useUserProfile();
  const { signOut, user } = useAuth();
  const userEmail = user?.email || "";

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setLangOpen(false); } }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const languages = LANGUAGES;

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost"
        onClick={() => { setOpen(!open); setLangOpen(false); }}
        className="flex items-center gap-[8px] h-[36px] px-[8px] rounded-full"
      >
        <div className="size-[28px] rounded-full overflow-hidden shrink-0">
          <img src={avatarSrc} alt="Avatar" className="size-full object-cover" />
        </div>
        <div className="flex flex-col items-start">
          <span className="flex items-center gap-[4px] font-medium text-[12.5px] text-foreground whitespace-nowrap">
            {userEmail}
            <Icon icon={ChevronDown} className="size-[10px] text-muted-foreground" strokeWidth={2} />
          </span>
          <span className="font-normal text-[10.5px] text-muted-foreground whitespace-nowrap">Free Plan</span>
        </div>
      </Button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-[236px] rounded-[12px] py-[6px] z-50 bg-popover border border-border shadow-md">
          <div className="flex items-center gap-[10px] px-[14px] py-[8px] mb-[2px]">
            <img alt="" className="shrink-0 size-[32px] rounded-full object-cover" src={avatarSrc} />
            <div className="flex flex-col min-w-0">
              <p className="truncate font-medium text-[13px] text-foreground">{displayName}</p>
              <p className="truncate font-normal text-[11px] text-muted-foreground">{t("profile.proPlan")}</p>
            </div>
          </div>
          <div className="h-px mx-[10px] my-[2px] bg-border" />
          <Button variant="ghost" onClick={() => { setOpen(false); onNavigate("settings"); }} className="flex items-center gap-[10px] w-full px-[14px] h-[36px] rounded-none justify-start">
            <Icon icon={Settings} className="size-[16px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <span className="font-normal text-[13px] text-foreground">{t("profile.settings")}</span>
          </Button>
          <div className="relative">
            <Button variant="ghost" onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-[10px] w-full px-[14px] h-[36px] rounded-none justify-start">
              <Icon icon={Globe} className="size-[16px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
              <span className="flex-1 text-left font-normal text-[13px] text-foreground">{t("profile.language")}</span>
              <span className="shrink-0 font-medium text-[11px] text-muted-foreground">{languages.find(l => l.code === lang)?.short}</span>
              <svg className={`size-[12px] shrink-0 text-muted-foreground transition-transform ${langOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 12 12"><path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Button>
            {langOpen && (
              <div className="absolute right-[calc(100%+4px)] top-0 w-[170px] rounded-[10px] py-[4px] z-50 bg-popover border border-border shadow-md">
                {languages.map(l => (
                  <Button variant="ghost" key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); setOpen(false); }} className="flex items-center gap-[8px] w-full px-[12px] h-[32px] rounded-none justify-start">
                    <span className="font-medium text-[11px] text-muted-foreground tracking-[0.3px]">{l.short}</span>
                    <span className={`flex-1 text-left text-[13px] ${lang === l.code ? "font-medium text-primary" : "font-normal text-foreground"}`}>{l.label}</span>
                    {lang === l.code && <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8.5L6.5 12L13 4" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="h-px mx-[10px] my-[2px] bg-border" />
          <Button variant="ghost" onClick={() => { setOpen(false); signOut(); }} className="flex items-center gap-[10px] w-full px-[14px] h-[36px] rounded-none justify-start hover:bg-destructive/5">
            <Icon icon={LogOut} className="size-[16px] shrink-0 text-destructive" strokeWidth={1.5} />
            <span className="font-normal text-[13px] text-destructive">{t("profile.logOut")}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Top Bar ── */
export function TopBar({ onNavigate }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  const kbdClass = "flex items-center justify-center h-[18px] px-[5px] rounded-[4px] bg-background border border-border text-muted-foreground font-medium text-[10px] leading-none shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.05)]";

  useEffect(() => {
    function h(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    }
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="shrink-0 flex items-center px-[16px] h-[56px] gap-[12px] bg-sidebar">
      {/* Search trigger */}
      <Button variant="ghost"
        onClick={() => setSearchOpen(true)}
        className="relative flex items-center flex-1 max-w-[380px] h-[32px] rounded-full bg-foreground/[0.04] justify-start"
      >
        <Icon icon={Search} className="absolute left-[12px] size-[14px] text-muted-foreground" strokeWidth={1.5} />
        <span className="absolute left-[34px] font-normal text-[13px] text-muted-foreground">Quick Find</span>
        <div className="absolute right-[10px] flex items-center gap-[3px]">
          <kbd className={kbdClass}>Ctrl</kbd>
          <kbd className={`${kbdClass} size-[18px] px-0`}>K</kbd>
        </div>
      </Button>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={onNavigate} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Trial CTA */}
      <Button variant="ghost" className="flex items-center gap-[6px] h-[30px] px-[14px] rounded-full shrink-0 bg-primary/[0.06] hover:bg-primary/[0.1]">
        <Icon icon={Zap} className="size-[12px] text-primary" strokeWidth={2} style={{ fill: "var(--primary)" }} />
        <span className="font-semibold text-[12px] text-primary whitespace-nowrap">Start my 3-day free trial now</span>
      </Button>

      {/* Icon buttons */}
      <div className="flex items-center gap-[2px]">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("support")} className="size-[32px] rounded-full" title="Support">
          <Icon icon={Help} className="size-[16px] text-muted-foreground" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Profile */}
      <ProfileDropdown onNavigate={onNavigate} />
    </div>
  );
}
