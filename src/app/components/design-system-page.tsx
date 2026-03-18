import { useState } from "react";
import {
  Search, Settings, ChevronRight, ChevronDown, Plus, Trash2, FolderPlus, Download,
  Copy, Star, Calendar, Mic, Video, FileText, Upload, Filter, X, Check,
  ArrowLeft, Bell, HelpCircle, Zap, Eye, EyeOff, Mail, Lock, User
} from "lucide-react";

/* ─── Color swatch ─── */
function Swatch({ color, name, hex }: { color: string; name: string; hex: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="flex flex-col items-center gap-[6px] cursor-pointer group"
      onClick={() => { navigator.clipboard.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
    >
      <div
        className="w-[56px] h-[56px] rounded-[12px] border border-[#e5e7eb] transition-transform group-hover:scale-105"
        style={{ backgroundColor: color }}
      />
      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: "#344054" }}>{name}</span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "10px", color: "#98a2b3" }}>
        {copied ? "Copied!" : hex}
      </span>
    </button>
  );
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mb-[56px]">
      <div className="flex items-center gap-[10px] mb-[24px] pb-[12px]" style={{ borderBottom: "1px solid #eaecf0" }}>
        <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: "22px", color: "#101828" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-[32px]">
      <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "14px", color: "#344054", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</h3>
      {children}
    </div>
  );
}

function ComponentCard({ title, children, description }: { title: string; children: React.ReactNode; description?: string }) {
  return (
    <div className="rounded-[14px] border border-[#eaecf0] overflow-hidden">
      <div className="px-[20px] py-[12px]" style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #eaecf0" }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px", color: "#344054" }}>{title}</span>
        {description && <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: "#98a2b3", marginTop: "2px" }}>{description}</p>}
      </div>
      <div className="px-[24px] py-[20px] flex flex-wrap items-center gap-[12px] bg-white">
        {children}
      </div>
    </div>
  );
}

/* ─── NAV ─── */
const navItems = [
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "badges", label: "Badges & Tags" },
  { id: "tabs", label: "Tabs & Filters" },
  { id: "cards", label: "Cards" },
  { id: "icons", label: "Icons" },
  { id: "misc", label: "Misc" },
];

export function DesignSystemPage() {
  const [activeNav, setActiveNav] = useState("colors");

  const scrollTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex h-screen w-full bg-white">
      {/* Sidebar nav */}
      <aside className="w-[220px] shrink-0 h-full overflow-y-auto py-[32px] px-[20px]" style={{ borderRight: "1px solid #eaecf0" }}>
        <div className="flex items-center gap-[8px] mb-[28px]">
          <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7F56D9, #2563eb)" }}>
            <Zap className="size-[14px] text-white" strokeWidth={2} />
          </div>
          <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: "15px", color: "#101828" }}>UI Kit</span>
        </div>
        <nav className="flex flex-col gap-[2px]">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-left px-[12px] py-[8px] rounded-[8px] transition-colors"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: activeNav === item.id ? 600 : 400,
                fontSize: "13px",
                color: activeNav === item.id ? "#2563eb" : "#667085",
                backgroundColor: activeNav === item.id ? "#eff4ff" : "transparent",
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-[32px] pt-[16px]" style={{ borderTop: "1px solid #eaecf0" }}>
          <a
            href="/"
            className="flex items-center gap-[6px] px-[12px] py-[8px] rounded-[8px] transition-colors hover:bg-[#f9fafb]"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "#98a2b3", textDecoration: "none" }}
          >
            <ArrowLeft className="size-[14px]" strokeWidth={1.5} />
            Back to App
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-[48px] py-[40px]">
        <div className="max-w-[880px]">
          {/* Header */}
          <div className="mb-[48px]">
            <h1 style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 800, fontSize: "32px", color: "#101828", lineHeight: 1.2 }}>
              Nexora Design System
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "15px", color: "#667085", marginTop: "8px" }}>
              Complete UI kit with all primitives, tokens, and components used across the TranscribeToText.AI platform.
            </p>
          </div>

          {/* ═══════════ COLORS ═══════════ */}
          <Section title="Color Palette" id="colors">
            <SubSection title="Brand Colors">
              <div className="flex flex-wrap gap-[20px]">
                <Swatch color="#7F56D9" name="Primary" hex="#7F56D9" />
                <Swatch color="#6941C6" name="Primary Dark" hex="#6941C6" />
                <Swatch color="#B692F6" name="Primary Light" hex="#B692F6" />
                <Swatch color="#E9D7FE" name="Primary 100" hex="#E9D7FE" />
                <Swatch color="#F9F5FF" name="Primary 50" hex="#F9F5FF" />
                <Swatch color="#2563EB" name="Brand Blue" hex="#2563EB" />
                <Swatch color="#F97316" name="Accent Orange" hex="#F97316" />
              </div>
            </SubSection>

            <SubSection title="Neutral Palette">
              <div className="flex flex-wrap gap-[20px]">
                <Swatch color="#101828" name="Gray 900" hex="#101828" />
                <Swatch color="#1D2939" name="Gray 800" hex="#1D2939" />
                <Swatch color="#344054" name="Gray 700" hex="#344054" />
                <Swatch color="#475467" name="Gray 600" hex="#475467" />
                <Swatch color="#667085" name="Gray 500" hex="#667085" />
                <Swatch color="#98A2B3" name="Gray 400" hex="#98A2B3" />
                <Swatch color="#D0D5DD" name="Gray 300" hex="#D0D5DD" />
                <Swatch color="#EAECF0" name="Gray 200" hex="#EAECF0" />
                <Swatch color="#F2F4F7" name="Gray 100" hex="#F2F4F7" />
                <Swatch color="#F9FAFB" name="Gray 50" hex="#F9FAFB" />
                <Swatch color="#FFFFFF" name="White" hex="#FFFFFF" />
              </div>
            </SubSection>

            <SubSection title="Semantic Tokens">
              <div className="flex flex-wrap gap-[20px]">
                <Swatch color="rgba(127,86,217,1)" name="--primary" hex="rgb(127,86,217)" />
                <Swatch color="rgba(52,64,84,1)" name="--foreground" hex="rgb(52,64,84)" />
                <Swatch color="rgba(249,250,251,1)" name="--secondary" hex="rgb(249,250,251)" />
                <Swatch color="rgba(242,244,247,1)" name="--muted" hex="rgb(242,244,247)" />
                <Swatch color="rgba(102,112,133,1)" name="--muted-fg" hex="rgb(102,112,133)" />
                <Swatch color="rgba(217,45,32,1)" name="--destructive" hex="rgb(217,45,32)" />
                <Swatch color="rgba(234,236,240,1)" name="--border" hex="rgb(234,236,240)" />
                <Swatch color="rgba(127,86,217,1)" name="--ring" hex="rgb(127,86,217)" />
              </div>
            </SubSection>

            <SubSection title="Special Use">
              <div className="flex flex-wrap gap-[20px]">
                <Swatch color="#FEF2EB" name="Promo BG" hex="#FEF2EB" />
                <Swatch color="#EFF4FF" name="Blue Tint" hex="#EFF4FF" />
                <Swatch color="#ECFDF3" name="Success BG" hex="#ECFDF3" />
                <Swatch color="#FEF3F2" name="Error BG" hex="#FEF3F2" />
                <Swatch color="#FFFAEB" name="Warning BG" hex="#FFFAEB" />
              </div>
            </SubSection>
          </Section>

          {/* ═══════════ TYPOGRAPHY ═══════════ */}
          <Section title="Typography" id="typography">
            <SubSection title="Font Families">
              <div className="flex flex-col gap-[16px]">
                <div className="flex items-baseline gap-[16px]">
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "24px", color: "#101828" }}>Inter</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#98a2b3" }}>Primary — Body, UI, Labels</span>
                </div>
                <div className="flex items-baseline gap-[16px]">
                  <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: "24px", color: "#101828" }}>Inter Tight</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#98a2b3" }}>Display — Headlines, Titles</span>
                </div>
                <div className="flex items-baseline gap-[16px]">
                  <span style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: "24px", color: "#101828" }}>Roboto</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#98a2b3" }}>Mono / Special</span>
                </div>
              </div>
            </SubSection>

            <SubSection title="Type Scale">
              <div className="flex flex-col gap-[14px]">
                {[
                  { label: "H1", size: "36px", weight: 600, family: "Inter" },
                  { label: "H2", size: "24px", weight: 600, family: "Inter" },
                  { label: "H3 / Section", size: "18px", weight: 600, family: "Inter" },
                  { label: "H4 / Subsection", size: "14px", weight: 600, family: "Inter" },
                  { label: "Body", size: "14px", weight: 400, family: "Inter" },
                  { label: "Caption", size: "12px", weight: 400, family: "Inter" },
                  { label: "Tiny", size: "11px", weight: 500, family: "Inter" },
                ].map(t => (
                  <div key={t.label} className="flex items-baseline gap-[20px]">
                    <span style={{ fontFamily: `'${t.family}', sans-serif`, fontWeight: t.weight, fontSize: t.size, color: "#101828", minWidth: "200px" }}>
                      {t.label} — {t.size}
                    </span>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: "#98a2b3" }}>
                      weight {t.weight}
                    </span>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection title="Font Weights">
              <div className="flex gap-[32px]">
                {[
                  { w: 400, name: "Regular" },
                  { w: 500, name: "Medium" },
                  { w: 600, name: "Semibold" },
                  { w: 700, name: "Bold" },
                ].map(fw => (
                  <span key={fw.w} style={{ fontFamily: "'Inter', sans-serif", fontWeight: fw.w, fontSize: "16px", color: "#344054" }}>
                    {fw.name} ({fw.w})
                  </span>
                ))}
              </div>
            </SubSection>
          </Section>

          {/* ═══════════ BUTTONS ═══════════ */}
          <Section title="Buttons" id="buttons">
            <div className="flex flex-col gap-[16px]">
              <ComponentCard title="Primary Buttons" description="Main CTA actions, gradient and solid">
                <button className="h-[36px] px-[20px] rounded-full flex items-center gap-[8px] text-white transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, #7F56D9, #6941C6)", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", border: "none" }}>
                  <Zap className="size-[14px]" strokeWidth={1.5} /> Primary Action
                </button>
                <button className="h-[36px] px-[20px] rounded-full flex items-center gap-[8px] text-white transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, #4f46e5, #2563eb, #06b6d4)", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", border: "none" }}>
                  <Zap className="size-[14px] text-[#F97316]" strokeWidth={1.5} /> Upgrade to Pro
                </button>
                <button className="h-[36px] px-[20px] rounded-full flex items-center gap-[8px] text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2563eb", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", border: "none" }}>
                  Start Free Trial
                </button>
              </ComponentCard>

              <ComponentCard title="Secondary / Outlined Buttons" description="With gray border and dark text">
                <button className="h-[36px] px-[20px] rounded-full flex items-center gap-[8px] transition-colors hover:bg-[#f9fafb]" style={{ backgroundColor: "transparent", border: "1px solid #d1d5db", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#1a1a1a" }}>
                  <FolderPlus className="size-[14px]" strokeWidth={1.5} /> Add Folder
                </button>
                <button className="h-[36px] px-[20px] rounded-full flex items-center gap-[8px] transition-colors hover:bg-[#f9fafb]" style={{ backgroundColor: "transparent", border: "1px solid #d1d5db", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#1a1a1a" }}>
                  <Download className="size-[14px]" strokeWidth={1.5} /> Export
                </button>
                <button className="h-[36px] px-[20px] rounded-full flex items-center gap-[8px] transition-colors hover:bg-[#f9fafb]" style={{ backgroundColor: "transparent", border: "1px solid #d1d5db", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#1a1a1a" }}>
                  <Filter className="size-[14px]" strokeWidth={1.5} /> Filter
                </button>
              </ComponentCard>

              <ComponentCard title="Ghost / Text Buttons" description="No background, no border — icon + label">
                <button className="flex items-center gap-[6px] transition-opacity hover:opacity-60" style={{ backgroundColor: "transparent", border: "none", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#2563eb" }}>
                  <Copy className="size-[14px]" strokeWidth={1.5} /> Summary
                </button>
                <button className="flex items-center gap-[6px] transition-opacity hover:opacity-60" style={{ backgroundColor: "transparent", border: "none", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#2563eb" }}>
                  <FolderPlus className="size-[14px]" strokeWidth={1.5} /> Folder
                </button>
                <button className="flex items-center gap-[6px] transition-opacity hover:opacity-60" style={{ backgroundColor: "transparent", border: "none", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#2563eb" }}>
                  <Download className="size-[14px]" strokeWidth={1.5} /> Export
                </button>
                <button className="flex items-center gap-[6px] transition-opacity hover:opacity-60" style={{ backgroundColor: "transparent", border: "none", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#ef4444" }}>
                  <Trash2 className="size-[14px]" strokeWidth={1.5} /> Trash
                </button>
              </ComponentCard>

              <ComponentCard title="Icon Buttons" description="Icon-only, used in toolbars and headers">
                <button className="size-[32px] rounded-full flex items-center justify-center transition-colors hover:bg-[#f2f4f7]" style={{ border: "none", backgroundColor: "transparent" }}>
                  <Search className="size-[16px] text-[#667085]" strokeWidth={1.5} />
                </button>
                <button className="size-[32px] rounded-full flex items-center justify-center transition-colors hover:bg-[#f2f4f7]" style={{ border: "none", backgroundColor: "transparent" }}>
                  <Settings className="size-[16px] text-[#667085]" strokeWidth={1.5} />
                </button>
                <button className="size-[32px] rounded-full flex items-center justify-center transition-colors hover:bg-[#f2f4f7]" style={{ border: "none", backgroundColor: "transparent" }}>
                  <Bell className="size-[16px] text-[#667085]" strokeWidth={1.5} />
                </button>
                <button className="size-[32px] rounded-full flex items-center justify-center transition-colors hover:bg-[#f2f4f7]" style={{ border: "none", backgroundColor: "transparent" }}>
                  <HelpCircle className="size-[16px] text-[#667085]" strokeWidth={1.5} />
                </button>
                <button className="size-[32px] rounded-full flex items-center justify-center transition-colors hover:bg-[#f2f4f7]" style={{ border: "none", backgroundColor: "transparent" }}>
                  <Star className="size-[16px] text-[#667085]" strokeWidth={1.5} />
                </button>
                <button className="size-[32px] rounded-full flex items-center justify-center transition-colors hover:bg-[#f2f4f7]" style={{ border: "none", backgroundColor: "transparent" }}>
                  <X className="size-[16px] text-[#667085]" strokeWidth={1.5} />
                </button>
              </ComponentCard>

              <ComponentCard title="Title with Chevron" description="Clickable title + arrow for navigation">
                <div className="flex items-center gap-[3px]">
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "18px", color: "#101828" }}>My Records</span>
                  <button className="flex items-center transition-opacity hover:opacity-60" style={{ backgroundColor: "transparent", border: "none" }}>
                    <ChevronRight className="size-[16px] text-[#101828]" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="flex items-center gap-[2px]">
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "14px", color: "#101828" }}>Today's Events (3)</span>
                  <button className="flex items-center transition-opacity hover:opacity-60" style={{ backgroundColor: "transparent", border: "none" }}>
                    <ChevronRight className="size-[14px] text-[#101828]" strokeWidth={2} />
                  </button>
                </div>
              </ComponentCard>

              <ComponentCard title="Destructive" description="Delete and destructive actions">
                <button className="h-[36px] px-[20px] rounded-full flex items-center gap-[8px] text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#D92D20", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", border: "none" }}>
                  <Trash2 className="size-[14px]" strokeWidth={1.5} /> Delete
                </button>
                <button className="h-[36px] px-[20px] rounded-full flex items-center gap-[8px] transition-colors hover:bg-[#fef3f2]" style={{ backgroundColor: "transparent", border: "1px solid #fda29b", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#D92D20" }}>
                  <Trash2 className="size-[14px]" strokeWidth={1.5} /> Remove
                </button>
              </ComponentCard>
            </div>
          </Section>

          {/* ═══════════ INPUTS ═══════════ */}
          <Section title="Inputs & Forms" id="inputs">
            <div className="flex flex-col gap-[16px]">
              <ComponentCard title="Text Input" description="Default input with border and placeholder">
                <div className="flex flex-col gap-[6px] w-[280px]">
                  <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#344054" }}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-[10px] top-1/2 -translate-y-1/2 size-[16px] text-[#98a2b3]" strokeWidth={1.5} />
                    <input
                      placeholder="you@example.com"
                      className="w-full h-[38px] pl-[32px] pr-[12px] rounded-[8px] outline-none transition-all focus:ring-[3px] focus:ring-[#7F56D9]/20 focus:border-[#7F56D9]"
                      style={{ border: "1px solid #d0d5dd", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#101828", backgroundColor: "white" }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-[6px] w-[280px]">
                  <label style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#344054" }}>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-[10px] top-1/2 -translate-y-1/2 size-[16px] text-[#98a2b3]" strokeWidth={1.5} />
                    <input
                      type="password"
                      placeholder="Enter password"
                      className="w-full h-[38px] pl-[32px] pr-[36px] rounded-[8px] outline-none transition-all focus:ring-[3px] focus:ring-[#7F56D9]/20 focus:border-[#7F56D9]"
                      style={{ border: "1px solid #d0d5dd", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#101828", backgroundColor: "white" }}
                    />
                    <EyeOff className="absolute right-[10px] top-1/2 -translate-y-1/2 size-[16px] text-[#98a2b3] cursor-pointer" strokeWidth={1.5} />
                  </div>
                </div>
              </ComponentCard>

              <ComponentCard title="Search Input" description="With search icon and rounded-full shape">
                <div className="relative w-[320px]">
                  <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 size-[15px] text-[#98a2b3]" strokeWidth={1.5} />
                  <input
                    placeholder="Search records..."
                    className="w-full h-[36px] pl-[34px] pr-[12px] rounded-full outline-none transition-all focus:ring-[3px] focus:ring-[#7F56D9]/20 focus:border-[#7F56D9]"
                    style={{ border: "1px solid #d0d5dd", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#101828", backgroundColor: "white" }}
                  />
                </div>
              </ComponentCard>

              <ComponentCard title="Folder Name Input" description="With color picker dot and create button">
                <div className="flex items-center gap-[10px] w-[400px]">
                  <div className="size-[12px] rounded-full shrink-0" style={{ backgroundColor: "#2563eb" }} />
                  <input
                    placeholder="e.g. Client Meetings"
                    className="flex-1 h-[38px] px-[12px] rounded-[8px] outline-none transition-all focus:ring-[3px] focus:ring-[#7F56D9]/20 focus:border-[#7F56D9]"
                    style={{ border: "1px solid #d0d5dd", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#101828", backgroundColor: "white" }}
                  />
                  <button className="h-[38px] px-[16px] rounded-[8px] text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#7F56D9", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", border: "none" }}>
                    Create
                  </button>
                </div>
              </ComponentCard>

              <ComponentCard title="Checkbox" description="Blue checked state">
                <div className="flex items-center gap-[24px]">
                  <label className="flex items-center gap-[8px] cursor-pointer">
                    <div className="size-[18px] rounded-[4px] flex items-center justify-center" style={{ backgroundColor: "#2563eb" }}>
                      <Check className="size-[12px] text-white" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#344054" }}>Checked</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer">
                    <div className="size-[18px] rounded-[4px]" style={{ border: "1.5px solid #d0d5dd", backgroundColor: "white" }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#344054" }}>Unchecked</span>
                  </label>
                </div>
              </ComponentCard>

              <ComponentCard title="Toggle / Switch" description="On/Off toggle">
                <div className="flex items-center gap-[24px]">
                  <div className="flex items-center gap-[8px]">
                    <div className="w-[36px] h-[20px] rounded-full flex items-center px-[2px] cursor-pointer" style={{ backgroundColor: "#7F56D9" }}>
                      <div className="size-[16px] rounded-full bg-white ml-auto" />
                    </div>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#344054" }}>On</span>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <div className="w-[36px] h-[20px] rounded-full flex items-center px-[2px] cursor-pointer" style={{ backgroundColor: "#d0d5dd" }}>
                      <div className="size-[16px] rounded-full bg-white" />
                    </div>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#344054" }}>Off</span>
                  </div>
                </div>
              </ComponentCard>
            </div>
          </Section>

          {/* ═══════════ BADGES ═══════════ */}
          <Section title="Badges & Tags" id="badges">
            <div className="flex flex-col gap-[16px]">
              <ComponentCard title="Source Badges" description="Record source type indicators">
                <div className="flex items-center gap-[10px]">
                  {[
                    { icon: <Mic className="size-[11px]" strokeWidth={1.5} />, label: "Audio", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
                    { icon: <Video className="size-[11px]" strokeWidth={1.5} />, label: "Video", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
                    { icon: <FileText className="size-[11px]" strokeWidth={1.5} />, label: "Text", bg: "#fefce8", color: "#a16207", border: "#fef08a" },
                    { icon: <Upload className="size-[11px]" strokeWidth={1.5} />, label: "Upload", bg: "#faf5ff", color: "#7e22ce", border: "#e9d5ff" },
                  ].map(b => (
                    <span key={b.label} className="inline-flex items-center gap-[5px] h-[24px] px-[10px] rounded-full" style={{ backgroundColor: b.bg, border: `1px solid ${b.border}`, color: b.color, fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px" }}>
                      {b.icon} {b.label}
                    </span>
                  ))}
                </div>
              </ComponentCard>

              <ComponentCard title="Status Badges" description="Completion and status indicators">
                <span className="inline-flex items-center gap-[5px] h-[24px] px-[10px] rounded-full" style={{ backgroundColor: "#ecfdf3", color: "#067647", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px" }}>
                  <div className="size-[6px] rounded-full" style={{ backgroundColor: "#12b76a" }} /> Completed
                </span>
                <span className="inline-flex items-center gap-[5px] h-[24px] px-[10px] rounded-full" style={{ backgroundColor: "#fffaeb", color: "#b54708", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px" }}>
                  <div className="size-[6px] rounded-full" style={{ backgroundColor: "#f79009" }} /> Processing
                </span>
                <span className="inline-flex items-center gap-[5px] h-[24px] px-[10px] rounded-full" style={{ backgroundColor: "#fef3f2", color: "#b42318", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px" }}>
                  <div className="size-[6px] rounded-full" style={{ backgroundColor: "#f04438" }} /> Failed
                </span>
              </ComponentCard>

              <ComponentCard title="Language Tag" description="Small inline language indicator">
                <span className="inline-flex items-center h-[20px] px-[8px] rounded-[4px]" style={{ backgroundColor: "#f2f4f7", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: "#667085" }}>
                  EN
                </span>
                <span className="inline-flex items-center h-[20px] px-[8px] rounded-[4px]" style={{ backgroundColor: "#f2f4f7", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: "#667085" }}>
                  RU
                </span>
                <span className="inline-flex items-center h-[20px] px-[8px] rounded-[4px]" style={{ backgroundColor: "#f2f4f7", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: "#667085" }}>
                  ES
                </span>
              </ComponentCard>

              <ComponentCard title="Folder Dot" description="Color-coded folder indicators">
                <div className="flex items-center gap-[16px]">
                  {["#2563eb", "#7F56D9", "#F97316", "#16a34a", "#ef4444", "#eab308"].map(c => (
                    <div key={c} className="flex items-center gap-[6px]">
                      <div className="size-[10px] rounded-full" style={{ backgroundColor: c }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: "#667085" }}>{c}</span>
                    </div>
                  ))}
                </div>
              </ComponentCard>
            </div>
          </Section>

          {/* ═══════════ TABS & FILTERS ═══════════ */}
          <Section title="Tabs & Filters" id="tabs">
            <div className="flex flex-col gap-[16px]">
              <ComponentCard title="Tab Bar" description="Bottom-border active style, used in Records Table">
                <div className="flex items-center" style={{ borderBottom: "1px solid #eaecf0" }}>
                  {["Recent", "Starred", "Trash"].map((tab, i) => (
                    <button
                      key={tab}
                      className="px-[16px] py-[10px] transition-colors"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: i === 0 ? 600 : 400,
                        fontSize: "13px",
                        color: i === 0 ? "#2563eb" : "#667085",
                        borderBottom: i === 0 ? "2px solid #2563eb" : "2px solid transparent",
                        backgroundColor: "transparent",
                        border: "none",
                        borderBottomWidth: "2px",
                        borderBottomStyle: "solid",
                        borderBottomColor: i === 0 ? "#2563eb" : "transparent",
                      }}
                    >
                      {tab}
                      {tab === "Starred" && <span className="ml-[6px] text-[11px]" style={{ color: "#98a2b3" }}>4</span>}
                      {tab === "Trash" && <span className="ml-[6px] text-[11px]" style={{ color: "#98a2b3" }}>2</span>}
                    </button>
                  ))}
                </div>
              </ComponentCard>

              <ComponentCard title="Filter Chips" description="Dropdown-style filter triggers">
                <div className="flex items-center gap-[8px]">
                  <button className="h-[32px] px-[12px] rounded-full flex items-center gap-[6px] transition-colors hover:bg-[#f9fafb]" style={{ border: "1px solid #d0d5dd", backgroundColor: "white", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "#344054" }}>
                    <Filter className="size-[13px]" strokeWidth={1.5} /> Type <ChevronDown className="size-[12px] text-[#98a2b3]" strokeWidth={1.5} />
                  </button>
                  <button className="h-[32px] px-[12px] rounded-full flex items-center gap-[6px] transition-colors hover:bg-[#f9fafb]" style={{ border: "1px solid #d0d5dd", backgroundColor: "white", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "#344054" }}>
                    <Calendar className="size-[13px]" strokeWidth={1.5} /> Date <ChevronDown className="size-[12px] text-[#98a2b3]" strokeWidth={1.5} />
                  </button>
                  <button className="h-[32px] px-[12px] rounded-full flex items-center gap-[6px]" style={{ border: "1px solid #2563eb", backgroundColor: "#eff4ff", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "#2563eb" }}>
                    Audio <X className="size-[12px]" strokeWidth={2} />
                  </button>
                </div>
              </ComponentCard>
            </div>
          </Section>

          {/* ═══════════ CARDS ═══════════ */}
          <Section title="Cards" id="cards">
            <div className="flex flex-col gap-[16px]">
              <ComponentCard title="Product Card" description="Dashboard grid card with icon, title, description and arrow">
                <div className="w-[240px] rounded-[16px] p-[20px] transition-all hover:shadow-md cursor-pointer" style={{ border: "1px solid #eaecf0", backgroundColor: "white" }}>
                  <div className="size-[40px] rounded-[10px] flex items-center justify-center mb-[12px]" style={{ backgroundColor: "#f9f5ff" }}>
                    <Mic className="size-[20px] text-[#7F56D9]" strokeWidth={1.5} />
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "14px", color: "#101828", marginBottom: "4px" }}>Transcribe Audio</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: "#667085", marginBottom: "12px" }}>Convert audio files to text</p>
                  <div className="flex items-center gap-[4px]">
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "#7F56D9" }}>Open</span>
                    <ChevronRight className="size-[14px] text-[#7F56D9]" strokeWidth={1.5} />
                  </div>
                </div>
              </ComponentCard>

              <ComponentCard title="Promo Card (Ticket)" description="Promotional ticket-shaped card with sparkle animation and warm background">
                <div className="w-[320px] rounded-[14px] p-[18px] relative overflow-hidden" style={{ backgroundColor: "#FEF2EB" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "14px", color: "#101828" }}>Special Offer</p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: "#667085", marginTop: "4px" }}>Get 20% off Pro plan</p>
                    </div>
                    <span className="inline-flex items-center h-[24px] px-[10px] rounded-full" style={{ backgroundColor: "#fff7ed", fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "11px", color: "#c2410c", border: "1px solid #fed7aa" }}>
                      PROMO20
                    </span>
                  </div>
                  {/* Sparkle dots */}
                  <div className="absolute top-[8px] right-[10px] size-[6px] rounded-full" style={{ backgroundColor: "#f97316", animation: "sparkle 2s ease-in-out infinite" }} />
                  <div className="absolute bottom-[12px] right-[24px] size-[4px] rounded-full" style={{ backgroundColor: "#f97316", animation: "sparkle 2s ease-in-out infinite 0.7s" }} />
                </div>
              </ComponentCard>

              <ComponentCard title="Plan Card" description="Free plan info with feature usage progress bars">
                <div className="w-[320px] rounded-[14px] p-[18px]" style={{ border: "1px solid #eaecf0", backgroundColor: "white" }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "14px", color: "#101828", marginBottom: "12px" }}>You on Free Plan</p>
                  <div className="flex flex-col gap-[10px]">
                    {[
                      { name: "Transcriptions", used: 3, total: 5 },
                      { name: "Storage", used: 120, total: 500 },
                    ].map(f => (
                      <div key={f.name}>
                        <div className="flex items-center justify-between mb-[4px]">
                          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: "#667085" }}>{f.name}</span>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: "#344054" }}>{f.used}/{f.total}</span>
                        </div>
                        <div className="w-full h-[6px] rounded-full" style={{ backgroundColor: "#e5e7eb" }}>
                          <div className="h-full rounded-full" style={{ backgroundColor: "#2563eb", width: `${(f.used / f.total) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ComponentCard>

              <ComponentCard title="Meeting / Event Card" description="Calendar event item">
                <div className="w-[320px] flex items-center gap-[12px] px-[14px] py-[10px] rounded-[10px] transition-colors hover:bg-[#f9fafb]" style={{ border: "1px solid #eaecf0" }}>
                  <div className="size-[36px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: "#eff4ff" }}>
                    <Calendar className="size-[16px] text-[#2563eb]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#101828" }}>Weekly Team Standup</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "11px", color: "#98a2b3" }}>10:00 AM — 10:30 AM</p>
                  </div>
                </div>
              </ComponentCard>
            </div>
          </Section>

          {/* ═══════════ ICONS ═══════════ */}
          <Section title="Icons" id="icons">
            <ComponentCard title="Lucide Icons" description="strokeWidth={1.5} for UI, 1.3 in sidebar">
              <div className="flex flex-wrap gap-[20px]">
                {[
                  { Icon: Search, name: "Search" },
                  { Icon: Settings, name: "Settings" },
                  { Icon: Plus, name: "Plus" },
                  { Icon: Trash2, name: "Trash2" },
                  { Icon: Star, name: "Star" },
                  { Icon: FolderPlus, name: "FolderPlus" },
                  { Icon: Download, name: "Download" },
                  { Icon: Copy, name: "Copy" },
                  { Icon: ChevronRight, name: "ChevronRight" },
                  { Icon: ChevronDown, name: "ChevronDown" },
                  { Icon: Filter, name: "Filter" },
                  { Icon: Calendar, name: "Calendar" },
                  { Icon: Mic, name: "Mic" },
                  { Icon: Video, name: "Video" },
                  { Icon: FileText, name: "FileText" },
                  { Icon: Upload, name: "Upload" },
                  { Icon: X, name: "X" },
                  { Icon: Bell, name: "Bell" },
                  { Icon: HelpCircle, name: "HelpCircle" },
                  { Icon: Zap, name: "Zap" },
                  { Icon: Eye, name: "Eye" },
                  { Icon: EyeOff, name: "EyeOff" },
                  { Icon: Mail, name: "Mail" },
                  { Icon: Lock, name: "Lock" },
                  { Icon: User, name: "User" },
                  { Icon: ArrowLeft, name: "ArrowLeft" },
                ].map(({ Icon, name }) => (
                  <div key={name} className="flex flex-col items-center gap-[6px]">
                    <div className="size-[40px] rounded-[8px] flex items-center justify-center" style={{ backgroundColor: "#f9fafb", border: "1px solid #eaecf0" }}>
                      <Icon className="size-[18px] text-[#344054]" strokeWidth={1.5} />
                    </div>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "10px", color: "#98a2b3" }}>{name}</span>
                  </div>
                ))}
              </div>
            </ComponentCard>
          </Section>

          {/* ═══════════ MISC ═══════════ */}
          <Section title="Miscellaneous" id="misc">
            <div className="flex flex-col gap-[16px]">
              <ComponentCard title="Progress Bar" description="Feature usage indicator, blue (#2563eb)">
                <div className="w-[300px] flex flex-col gap-[12px]">
                  {[20, 50, 80, 100].map(v => (
                    <div key={v} className="flex items-center gap-[10px]">
                      <div className="flex-1 h-[6px] rounded-full" style={{ backgroundColor: "#e5e7eb" }}>
                        <div className="h-full rounded-full transition-all" style={{ backgroundColor: "#2563eb", width: `${v}%` }} />
                      </div>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: "#667085", minWidth: "32px", textAlign: "right" }}>{v}%</span>
                    </div>
                  ))}
                </div>
              </ComponentCard>

              <ComponentCard title="Avatar" description="User profile avatars in various sizes">
                <div className="flex items-center gap-[16px]">
                  {[24, 32, 40].map(s => (
                    <div key={s} className="rounded-full flex items-center justify-center" style={{ width: s, height: s, backgroundColor: "#7F56D9" }}>
                      <User className="text-white" style={{ width: s * 0.5, height: s * 0.5 }} strokeWidth={1.5} />
                    </div>
                  ))}
                  <div className="size-[40px] rounded-full flex items-center justify-center" style={{ backgroundColor: "#eff4ff", border: "2px solid #2563eb" }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px", color: "#2563eb" }}>JD</span>
                  </div>
                </div>
              </ComponentCard>

              <ComponentCard title="Keyboard Shortcut" description="Command palette trigger hint">
                <div className="flex items-center gap-[8px]">
                  <kbd className="h-[24px] px-[8px] rounded-[6px] flex items-center" style={{ backgroundColor: "#f2f4f7", border: "1px solid #d0d5dd", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: "#667085" }}>
                    Ctrl
                  </kbd>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#98a2b3" }}>+</span>
                  <kbd className="h-[24px] px-[8px] rounded-[6px] flex items-center" style={{ backgroundColor: "#f2f4f7", border: "1px solid #d0d5dd", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: "#667085" }}>
                    K
                  </kbd>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: "#98a2b3", marginLeft: "8px" }}>Quick Find</span>
                </div>
              </ComponentCard>

              <ComponentCard title="Unlock Feature Row" description="Pro feature list with blue check circles">
                <div className="flex flex-col gap-[10px]">
                  {["Unlimited transcriptions", "Priority support", "Custom vocabulary"].map(f => (
                    <div key={f} className="flex items-center gap-[10px]">
                      <div className="size-[20px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#2563eb" }}>
                        <Check className="size-[12px] text-white" strokeWidth={2.5} />
                      </div>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "13px", color: "#344054" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </ComponentCard>

              <ComponentCard title="Accordion" description="Collapsible section used in plan info">
                <div className="w-[320px] rounded-[10px]" style={{ border: "1px solid #eaecf0" }}>
                  <button className="w-full flex items-center justify-between px-[14px] py-[10px]" style={{ backgroundColor: "transparent", border: "none" }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", color: "#344054" }}>Check feature usage</span>
                    <ChevronDown className="size-[14px] text-[#98a2b3]" strokeWidth={1.5} />
                  </button>
                </div>
              </ComponentCard>

              <ComponentCard title="Border Radius Scale" description="Consistent rounding tokens">
                <div className="flex items-end gap-[20px]">
                  {[
                    { r: "4px", label: "sm" },
                    { r: "6px", label: "md" },
                    { r: "8px", label: "lg" },
                    { r: "12px", label: "xl" },
                    { r: "16px", label: "2xl" },
                    { r: "9999px", label: "full" },
                  ].map(v => (
                    <div key={v.label} className="flex flex-col items-center gap-[6px]">
                      <div className="size-[44px]" style={{ backgroundColor: "#f2f4f7", border: "1px solid #d0d5dd", borderRadius: v.r }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "10px", color: "#98a2b3" }}>{v.label}</span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "10px", color: "#d0d5dd" }}>{v.r}</span>
                    </div>
                  ))}
                </div>
              </ComponentCard>

              <ComponentCard title="Shadow / Elevation" description="Box-shadow levels">
                <div className="flex items-center gap-[24px]">
                  <div className="size-[64px] rounded-[12px] bg-white flex items-center justify-center" style={{ boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.05)" }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "10px", color: "#98a2b3" }}>sm</span>
                  </div>
                  <div className="size-[64px] rounded-[12px] bg-white flex items-center justify-center" style={{ boxShadow: "0px 4px 8px -2px rgba(16,24,40,0.1), 0px 2px 4px -2px rgba(16,24,40,0.06)" }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "10px", color: "#98a2b3" }}>md</span>
                  </div>
                  <div className="size-[64px] rounded-[12px] bg-white flex items-center justify-center" style={{ boxShadow: "0px 12px 16px -4px rgba(16,24,40,0.08), 0px 4px 6px -2px rgba(16,24,40,0.03)" }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "10px", color: "#98a2b3" }}>lg</span>
                  </div>
                </div>
              </ComponentCard>

              <ComponentCard title="Multi-Action Bar" description="Selection action bar from Records Table">
                <div className="flex items-center gap-[2px] px-[16px] py-[10px] rounded-[12px]" style={{ backgroundColor: "#f9fafb", border: "1px solid #eaecf0" }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "#344054", marginRight: "12px" }}>3 selected</span>
                  <button className="flex items-center gap-[5px] px-[10px] py-[6px] rounded-[6px] transition-colors hover:bg-[#eff4ff]" style={{ backgroundColor: "transparent", border: "none", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "#2563eb" }}>
                    <Copy className="size-[13px]" strokeWidth={1.5} /> Summary
                  </button>
                  <button className="flex items-center gap-[5px] px-[10px] py-[6px] rounded-[6px] transition-colors hover:bg-[#eff4ff]" style={{ backgroundColor: "transparent", border: "none", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "#2563eb" }}>
                    <FolderPlus className="size-[13px]" strokeWidth={1.5} /> Folder
                  </button>
                  <button className="flex items-center gap-[5px] px-[10px] py-[6px] rounded-[6px] transition-colors hover:bg-[#eff4ff]" style={{ backgroundColor: "transparent", border: "none", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "#2563eb" }}>
                    <Download className="size-[13px]" strokeWidth={1.5} /> Export
                  </button>
                  <button className="flex items-center gap-[5px] px-[10px] py-[6px] rounded-[6px] transition-colors hover:bg-[#fef3f2]" style={{ backgroundColor: "transparent", border: "none", fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "12px", color: "#ef4444" }}>
                    <Trash2 className="size-[13px]" strokeWidth={1.5} /> Trash
                  </button>
                </div>
              </ComponentCard>
            </div>
          </Section>

          {/* Footer */}
          <div className="pt-[24px] pb-[48px]" style={{ borderTop: "1px solid #eaecf0" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "12px", color: "#98a2b3" }}>
              Nexora Design System v1.0 — Light theme only
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
