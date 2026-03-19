import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { User, CreditCard, LifeBuoy, X, Camera, Eye, EyeOff, Check, Copy, Zap, ExternalLink, Mail, MessageCircle } from "lucide-react";
import svgPaths from "../../imports/svg-i3wf63n6gj";
import { useTheme } from "./theme-context";
import { getDarkPalette } from "./dark-palette";

// ── Re-usable Logo (same as in app-sidebar) ──────────────────
function SettingsLogo() {
  const { navStyle } = useTheme();
  const navDk = navStyle === "dark";
  const textFill = navDk ? "#d2d6e0" : "#1E1E1E";
  const logoBlue = navDk ? "#5b8def" : "#2563EB";
  return (
    <div className="h-[26px] overflow-clip relative shrink-0" style={{ width: "155px" }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 180 30">
        <path d={svgPaths.p2badec00} fill={logoBlue} />
        <path d={svgPaths.p1a0b7800} fill={logoBlue} />
        <path clipRule="evenodd" d={svgPaths.p27195800} fill={logoBlue} fillRule="evenodd" />
        <path d={svgPaths.p13614280} fill={textFill} />
        <path d={svgPaths.p11015500} fill={textFill} />
        <path d={svgPaths.p1f84c200} fill={textFill} />
        <path d={svgPaths.p3c365b00} fill={textFill} />
        <path d={svgPaths.p10e82600} fill={textFill} />
        <path d={svgPaths.pc3be80} fill={textFill} />
        <path d={svgPaths.p1b650100} fill={textFill} />
        <path d={svgPaths.p2868a650} fill={textFill} />
        <path d={svgPaths.p284dfb60} fill={textFill} />
        <path d={svgPaths.p1bf24200} fill={textFill} />
        <path d={svgPaths.p3f098bc0} fill={textFill} />
        <path d={svgPaths.p27b8300} fill={textFill} />
        <path d={svgPaths.p2a7a24b0} fill={textFill} />
        <path d={svgPaths.p13ca3e70} fill={textFill} />
        <path d={svgPaths.padf6a00} fill={textFill} />
        <path d={svgPaths.p4d43600} fill={textFill} />
        <path d={svgPaths.p81b6100} fill={textFill} />
      </svg>
    </div>
  );
}

// ── Nav items ─────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "profile",  label: "Profile",       icon: User },
  { id: "billing",  label: "Billing",        icon: CreditCard },
  { id: "help",     label: "Help & Support", icon: LifeBuoy },
] as const;

type TabId = typeof NAV_ITEMS[number]["id"];

// ── Small toggle for password show/hide ───────────────────────
function ShowHideBtn({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-[14px] top-1/2 -translate-y-1/2 flex items-center justify-center size-[20px] rounded-full transition-opacity"
      style={{ opacity: 0.5 }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
    >
      {show ? <EyeOff className="size-[14px]" /> : <Eye className="size-[14px]" />}
    </button>
  );
}

// ── Profile Page ──────────────────────────────────────────────
function ProfilePage({ onClose }: { onClose: () => void }) {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);

  // State
  const [avatarSrc, setAvatarSrc] = useState("/images/avatar.png");
  const [name, setName] = useState("Kirill Kuts");
  const [nameSaved, setNameSaved] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [copied, setCopied] = useState(false);

  // Password change
  const [pwOpen, setPwOpen] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const USER_ID = "310519663342249865";
  const EMAIL = "kutskrikirill@gmail.com";

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarSrc(url);
    e.target.value = "";
  }

  function handleSaveName() {
    setNameSaved(true);
    setEditingName(false);
    setTimeout(() => setNameSaved(false), 2000);
  }

  function handleCopyId() {
    navigator.clipboard.writeText(USER_ID).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleSavePassword() {
    setPwSaved(true);
    setTimeout(() => { setPwSaved(false); setPwOpen(false); setCurPw(""); setNewPw(""); setConfPw(""); }, 1500);
  }

  const inputBase: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    fontSize: "13px",
    color: c.textSecondary,
    backgroundColor: c.bgInput,
    border: `1px solid ${c.borderInput}`,
    borderRadius: "9999px",
    outline: "none",
    width: "100%",
    height: "40px",
    paddingLeft: "14px",
    paddingRight: "14px",
    transition: "border-color 0.15s ease",
  };

  const sectionLabel: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    fontSize: "12px",
    color: c.textMuted,
    marginBottom: "6px",
    display: "block",
  };

  return (
    <div className="flex flex-col gap-[28px]">
      {/* Avatar */}
      <div className="flex items-center gap-[20px]">
        <div className="relative shrink-0 group">
          <div className="size-[72px] rounded-full overflow-hidden" style={{ border: `2px solid ${c.border}` }}>
            <img src={avatarSrc} alt="Avatar" className="size-full object-cover" />
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-full flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          >
            <Camera className="size-[18px] text-white" strokeWidth={1.5} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "16px", color: c.textPrimary }}>{name}</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: c.textMuted, marginTop: "2px" }}>{EMAIL}</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-[8px] h-[28px] px-[12px] rounded-full text-[12px] font-[500] transition-colors"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "#f0f2f5", color: c.textSecondary }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.12)" : "#e5e8ed"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.07)" : "#f0f2f5"}
          >
            Change photo
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ backgroundColor: c.border }} />

      {/* Name */}
      <div>
        <span style={sectionLabel}>Full name</span>
        <div className="flex items-center gap-[8px]">
          <input
            value={name}
            onChange={e => { setName(e.target.value); setEditingName(true); setNameSaved(false); }}
            style={inputBase}
            onFocus={e => (e.currentTarget.style.borderColor = "#2563eb")}
            onBlur={e => (e.currentTarget.style.borderColor = c.borderInput)}
          />
          {editingName && (
            <button
              onClick={handleSaveName}
              className="h-[40px] px-[16px] rounded-full shrink-0 transition-colors"
              style={{ backgroundColor: "#2563eb", color: "white", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", whiteSpace: "nowrap" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#1d4ed8"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#2563eb"}
            >
              Save
            </button>
          )}
          {nameSaved && (
            <div className="flex items-center gap-[6px] shrink-0">
              <Check className="size-[14px] text-emerald-500" strokeWidth={2.5} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#10b981" }}>Saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <span style={sectionLabel}>Email address</span>
        <div className="relative">
          <div
            className="flex items-center gap-[8px] h-[40px] px-[14px] rounded-full"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#fafbfc", border: `1px solid ${c.borderInput}`, opacity: 0.7 }}
          >
            <Mail className="size-[14px] shrink-0" style={{ color: c.textMuted }} strokeWidth={1.5} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: c.textMuted }}>{EMAIL}</span>
          </div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: c.textFaint, marginTop: "5px", display: "block" }}>
            Email cannot be changed.
          </span>
        </div>
      </div>

      {/* User ID */}
      <div>
        <span style={sectionLabel}>User ID</span>
        <div className="flex items-center gap-[8px]">
          <div
            className="flex items-center h-[40px] px-[14px] rounded-full flex-1 min-w-0"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#fafbfc", border: `1px solid ${c.borderInput}` }}
          >
            <span className="truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: c.textMuted }}>{USER_ID}</span>
          </div>
          <button
            onClick={handleCopyId}
            className="size-[40px] rounded-full flex items-center justify-center shrink-0 transition-colors"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f0f2f5", border: `1px solid ${c.borderInput}` }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.09)" : "#e5e8ed"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.05)" : "#f0f2f5"}
          >
            {copied
              ? <Check className="size-[14px] text-emerald-500" strokeWidth={2.5} />
              : <Copy className="size-[14px]" style={{ color: c.textMuted }} strokeWidth={1.5} />
            }
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ backgroundColor: c.border }} />

      {/* Password */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "14px", color: c.textSecondary }}>Password</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: c.textMuted, marginTop: "2px" }}>
              {pwOpen ? "Enter your current and new password below." : "••••••••••••"}
            </p>
          </div>
          {!pwOpen && (
            <button
              onClick={() => setPwOpen(true)}
              className="h-[36px] px-[16px] rounded-full border transition-colors shrink-0"
              style={{ borderColor: c.borderBtn, backgroundColor: "transparent", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              Update password
            </button>
          )}
        </div>

        {/* Password form */}
        {pwOpen && (
          <div className="mt-[16px] flex flex-col gap-[10px]">
            {[
              { label: "Current password", value: curPw, set: setCurPw, show: showCur, toggle: () => setShowCur(v => !v) },
              { label: "New password",     value: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(v => !v) },
              { label: "Confirm password", value: confPw, set: setConfPw, show: showConf, toggle: () => setShowConf(v => !v) },
            ].map(({ label, value, set, show, toggle }) => (
              <div key={label}>
                <span style={{ ...sectionLabel, marginBottom: "4px" }}>{label}</span>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder="••••••••"
                    style={{ ...inputBase, paddingRight: "40px" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#2563eb")}
                    onBlur={e => (e.currentTarget.style.borderColor = c.borderInput)}
                  />
                  <ShowHideBtn show={show} onToggle={toggle} />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-[8px] mt-[4px]">
              <button
                onClick={handleSavePassword}
                className="h-[36px] px-[18px] rounded-full transition-colors"
                style={{ backgroundColor: "#2563eb", color: "white", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#1d4ed8"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#2563eb"}
              >
                {pwSaved ? "Saved!" : "Save password"}
              </button>
              <button
                onClick={() => { setPwOpen(false); setCurPw(""); setNewPw(""); setConfPw(""); }}
                className="h-[36px] px-[18px] rounded-full border transition-colors"
                style={{ borderColor: c.borderBtn, backgroundColor: "transparent", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: c.textSecondary }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Billing Page ──────────────────────────────────────────────
function BillingPage() {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);

  return (
    <div className="flex flex-col gap-[24px]">
      {/* Current plan */}
      <div className="rounded-[14px] p-[20px]" style={{ backgroundColor: isDark ? "rgba(37,99,235,0.06)" : "#f0f5ff", border: `1px solid ${isDark ? "rgba(37,99,235,0.2)" : "#c7d9ff"}` }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-[8px] mb-[4px]">
              <span className="h-[22px] px-[8px] rounded-full flex items-center text-[11px] font-[600]" style={{ backgroundColor: isDark ? "rgba(37,99,235,0.2)" : "#dbeafe", color: "#2563eb" }}>
                Free Plan
              </span>
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "20px", color: c.textPrimary, marginTop: "6px" }}>$0 / month</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: c.textMuted, marginTop: "4px" }}>10 of 120 minutes used · Resets Apr 10, 2026</p>
          </div>
          <button
            className="h-[36px] px-[16px] rounded-full flex items-center gap-[6px] transition-colors"
            style={{ backgroundColor: "#2563eb", color: "white" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#1d4ed8"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#2563eb"}
          >
            <Zap className="size-[12px]" strokeWidth={2} fill="white" />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px" }}>Upgrade to Pro</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-[16px]">
          <div className="h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#dbeafe" }}>
            <div className="h-full rounded-full" style={{ width: "8%", backgroundColor: "#2563eb" }} />
          </div>
        </div>
      </div>

      {/* Pro features list */}
      <div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px", color: c.textMuted, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "12px" }}>
          Unlock with Pro
        </p>
        <div className="flex flex-col gap-[10px]">
          {[
            "Up to 5 hours per transcription",
            "AI Notes — automatic summaries",
            "Recordings & transcripts export",
            "Transcript translation",
            "Speaker identification",
            "Priority support",
          ].map(feature => (
            <div key={feature} className="flex items-center gap-[10px]">
              <div className="size-[18px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: isDark ? "rgba(37,99,235,0.15)" : "#dbeafe" }}>
                <Check className="size-[10px] text-blue-600" strokeWidth={3} />
              </div>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: c.textSecondary }}>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Help & Support Page ───────────────────────────────────────
function HelpPage() {
  const { isDark } = useTheme();
  const c = getDarkPalette(isDark);

  const items = [
    { icon: ExternalLink, label: "Documentation", desc: "Browse guides, tutorials and API reference", href: "#" },
    { icon: Mail,         label: "Email support",  desc: "support@transcribetotext.com", href: "mailto:support@transcribetotext.com" },
    { icon: MessageCircle, label: "Live chat",     desc: "Chat with our team in real time", href: "#" },
  ];

  return (
    <div className="flex flex-col gap-[12px]">
      {items.map(({ icon: Icon, label, desc, href }) => (
        <a
          key={label}
          href={href}
          className="flex items-center gap-[14px] p-[16px] rounded-[12px] transition-colors"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#fafbfc", border: `1px solid ${c.border}`, textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.06)" : "#f0f2f5")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.03)" : "#fafbfc")}
        >
          <div className="size-[38px] rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: isDark ? "rgba(37,99,235,0.1)" : "#eff4ff" }}>
            <Icon className="size-[17px]" style={{ color: "#2563eb" }} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "14px", color: c.textSecondary }}>{label}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: c.textMuted, marginTop: "2px" }}>{desc}</p>
          </div>
          <ExternalLink className="size-[14px] shrink-0" style={{ color: c.textFaint }} strokeWidth={1.5} />
        </a>
      ))}
    </div>
  );
}

// ── Main Settings Modal ───────────────────────────────────────
interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: TabId;
}

export function SettingsModal({ open, onClose, initialTab = "profile" }: SettingsModalProps) {
  const { isDark, navStyle } = useTheme();
  const c = getDarkPalette(isDark);
  const navDk = navStyle === "dark";

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const PAGE_TITLES: Record<TabId, string> = {
    profile: "Profile",
    billing: "Billing",
    help:    "Help & Support",
  };

  // Sidebar background — subtle gray like reference
  const sidebarBg = navDk ? "#1a1d2e" : (isDark ? "#16161c" : "#f7f8f9");
  const sidebarBorder = isDark ? "rgba(255,255,255,0.07)" : "#ebebeb";
  const navItemActive = isDark ? "rgba(255,255,255,0.08)" : "#eceef1";
  const navItemHover = isDark ? "rgba(255,255,255,0.05)" : "#f0f2f5";
  const navIconActive = "#2563eb";
  const navIconIdle = c.textMuted;
  const navLabelActive = c.textPrimary;
  const navLabelIdle = c.textMuted;

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative flex overflow-hidden"
        style={{
          width: "860px",
          maxWidth: "calc(100vw - 48px)",
          height: "600px",
          maxHeight: "calc(100vh - 48px)",
          borderRadius: "20px",
          boxShadow: isDark
            ? "0 32px 80px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4)"
            : "0 32px 80px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.07)",
        }}
      >
        {/* ── Left sidebar ── */}
        <div className="flex flex-col shrink-0" style={{ width: "220px", backgroundColor: sidebarBg, borderRight: `1px solid ${sidebarBorder}` }}>
          {/* Logo */}
          <div className="flex items-center px-[20px] pt-[22px] pb-[20px]">
            <SettingsLogo />
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-[2px] px-[10px]">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex items-center gap-[10px] h-[36px] px-[10px] rounded-[8px] w-full text-left transition-colors"
                  style={{ backgroundColor: isActive ? navItemActive : "transparent" }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = navItemHover; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <Icon
                    className="size-[15px] shrink-0"
                    style={{ color: isActive ? navIconActive : navIconIdle }}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: isActive ? 500 : 400,
                    fontSize: "13px",
                    color: isActive ? navLabelActive : navLabelIdle,
                  }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Right content ── */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: c.bg }}>
          {/* Header */}
          <div className="flex items-center justify-between px-[28px] pt-[22px] pb-[18px] shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
            <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "16px", color: c.textPrimary }}>
              {PAGE_TITLES[activeTab]}
            </h2>
            <button
              onClick={onClose}
              className="size-[28px] rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = c.bgHover}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <X className="size-[15px]" style={{ color: c.textMuted }} strokeWidth={2} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-[28px] py-[24px]">
            {activeTab === "profile" && <ProfilePage onClose={onClose} />}
            {activeTab === "billing" && <BillingPage />}
            {activeTab === "help"    && <HelpPage />}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
