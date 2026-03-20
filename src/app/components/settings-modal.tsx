import { useState, useRef, useEffect } from "react";
import { User, Camera, Lock, Eye, EyeOff, Shield, Info, Mail } from "lucide-react";
import { useTheme } from "./theme-context";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { useUserProfile } from "./user-profile-context";

// ── Password requirements ─────────────────────────────────────
const PW_RULES = [
  { label: "8 – 20 characters",           test: (v: string) => v.length >= 8 && v.length <= 20 },
  { label: "At least 1 uppercase letter",  test: (v: string) => /[A-Z]/.test(v) },
  { label: "At least 1 lowercase letter",  test: (v: string) => /[a-z]/.test(v) },
  { label: "At least 1 special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
  { label: "At least 1 number",            test: (v: string) => /[0-9]/.test(v) },
];

function PasswordRequirements({ value }: { value: string }) {
  return (
    <div className="absolute left-full top-0 ml-3 w-[220px] bg-white rounded-[10px] shadow-lg border border-gray-100 py-3 px-4 z-10">
      <div className="flex flex-col gap-[6px]">
        {PW_RULES.map(rule => (
          <div key={rule.label} className="flex items-center gap-2">
            <div
              className="size-[6px] rounded-full shrink-0 transition-colors"
              style={{ backgroundColor: value ? (rule.test(value) ? "#22c55e" : "#d1d5db") : "#d1d5db" }}
            />
            <span className="text-[12px]" style={{ color: "#6b7280" }}>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reusable action button ────────────────────────────────────
interface ActionBtnProps {
  label: string;
  onClick: () => void;
  isDark: boolean;
  variant?: "default" | "danger";
}
function ActionBtn({ label, onClick, isDark, variant = "default" }: ActionBtnProps) {
  const [hov, setHov] = useState(false);
  const color = variant === "danger" ? "#ef4444" : (isDark ? "rgba(255,255,255,0.55)" : "#6b7280");
  const bg    = hov
    ? (variant === "danger" ? "rgba(239,68,68,0.07)" : (isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6"))
    : "transparent";
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="h-8 px-3 rounded-full text-[13px] font-medium transition-colors shrink-0 border"
      style={{
        fontFamily: "'Inter', sans-serif",
        color,
        backgroundColor: bg,
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
      }}
    >
      {label}
    </button>
  );
}

// ── Disabled display field ────────────────────────────────────
interface DisplayFieldProps {
  value: string;
  isDark: boolean;
  placeholder?: string;
  type?: "text" | "password";
}
function DisplayField({ value, isDark, placeholder, type = "text" }: DisplayFieldProps) {
  const disabledBg    = isDark ? "rgba(255,255,255,0.04)" : "#f4f5f7";
  const disabledColor = isDark ? "rgba(229,231,235,0.6)"  : "#9ca3af";
  const border        = isDark ? "rgba(255,255,255,0.07)" : "#e9eaec";

  return (
    <div
      className="flex items-center flex-1 rounded-full px-4 h-10 min-w-0"
      style={{ backgroundColor: disabledBg, border: `1px solid ${border}` }}
    >
      <span
        className="text-sm truncate"
        style={{
          fontFamily: "'Inter', sans-serif",
          color: value ? (isDark ? "rgba(229,231,235,0.75)" : "#4b5563") : disabledColor,
          letterSpacing: type === "password" ? "0.12em" : undefined,
        }}
      >
        {type === "password" ? "••••••••••••" : (value || placeholder || "")}
      </span>
    </div>
  );
}

// ── Shared dialog shell ───────────────────────────────────────
function DialogShell({
  title, onClose, isDark, children,
}: { title: string; onClose: () => void; isDark: boolean; children: React.ReactNode }) {
  const bg     = isDark ? "#1a1a24" : "white";
  const border = isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb";
  const txtPri = isDark ? "#f3f4f6" : "#111827";
  const txtSec = isDark ? "#9ca3af" : "#6b7280";
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.3)", backdropFilter: "blur(3px)" }}>
      <div className="relative flex flex-col"
        style={{ width: "480px", maxWidth: "calc(100vw - 32px)", borderRadius: "18px",
          backgroundColor: bg, border: `1px solid ${border}`,
          boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.55)" : "0 24px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-5">
          <h3 style={{ fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:"18px", color:txtPri, letterSpacing:"-0.01em" }}>
            {title}
          </h3>
          <button onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center transition-colors"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg viewBox="0 0 14 14" className="size-3.5" fill="none" stroke={txtSec} strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Info banner ───────────────────────────────────────────────
function InfoBanner({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-4 py-3"
      style={{ backgroundColor: isDark ? "rgba(37,99,235,0.10)" : "rgba(37,99,235,0.06)",
        border: `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.12)"}` }}>
      <Info className="size-4 shrink-0 mt-px" style={{ color:"#2563eb" }} strokeWidth={1.8}/>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", color: isDark?"#93c5fd":"#1e40af", lineHeight:"1.55" }}>
        {children}
      </p>
    </div>
  );
}

// ── Field label ───────────────────────────────────────────────
function FieldLabel({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <p className="text-[12px] font-medium mb-1.5" style={{ fontFamily:"'Inter',sans-serif", color: isDark?"#9ca3af":"#6b7280" }}>
      {label}
    </p>
  );
}

// ── Dialog footer ─────────────────────────────────────────────
function DialogFooter({ onCancel, onConfirm, confirmLabel, confirmDisabled, isDark }: {
  onCancel: () => void; onConfirm: () => void; confirmLabel: string; confirmDisabled?: boolean; isDark: boolean;
}) {
  const border = isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb";
  const txtSec = isDark ? "#9ca3af" : "#6b7280";
  return (
    <div className="flex items-center justify-end gap-2 px-6 py-4"
      style={{ borderTop: `1px solid ${border}` }}>
      <button onClick={onCancel}
        className="h-9 px-4 rounded-full text-[13px] font-medium transition-colors border"
        style={{ fontFamily:"'Inter',sans-serif", borderColor:border, color:txtSec, backgroundColor:"transparent" }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark?"rgba(255,255,255,0.05)":"#f9fafb"}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
        Cancel
      </button>
      <button onClick={onConfirm} disabled={confirmDisabled}
        className="h-9 px-5 rounded-full text-[13px] font-semibold transition-colors"
        style={{ fontFamily:"'Inter',sans-serif",
          backgroundColor: confirmDisabled ? (isDark?"#2a2a35":"#f3f4f6") : "#2563eb",
          color: confirmDisabled ? txtSec : "white",
          cursor: confirmDisabled ? "not-allowed" : "pointer" }}>
        {confirmLabel}
      </button>
    </div>
  );
}

// ── Change Email Dialog ───────────────────────────────────────
interface ChangeEmailDialogProps {
  currentEmail: string;
  onClose: () => void;
  isDark: boolean;
}
function ChangeEmailDialog({ currentEmail, onClose, isDark }: ChangeEmailDialogProps) {
  const [step,     setStep]     = useState<1 | 2>(1);
  const [code,     setCode]     = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [saved,    setSaved]    = useState(false);

  const txtPri      = isDark ? "#e5e7eb" : "#111827";
  const txtSec      = isDark ? "#9ca3af" : "#6b7280";
  const fieldBg     = isDark ? "#1e2430" : "white";
  const fieldBorder = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";

  function handleContinue() { if (code.trim()) setStep(2); }
  function handleSave() {
    if (!newEmail.trim()) return;
    setSaved(true);
    setTimeout(onClose, 900);
  }

  const stepLabels = ["Verify your current email", "Enter your new email"];

  return (
    <DialogShell title="Change your email" onClose={onClose} isDark={isDark}>
      {/* Stepper */}
      <div className="flex items-center px-6 pb-5">
        {stepLabels.map((label, i) => {
          const idx      = i + 1;
          const isActive = step === idx;
          const isDone   = step > idx;
          const circleColor = (isActive || isDone) ? "#2563eb" : (isDark ? "#374151" : "#d1d5db");
          const textColor   = (isActive || isDone) ? (isDark ? "#93c5fd" : "#1d4ed8") : txtSec;
          return (
            <div key={idx} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: circleColor }}>
                  {isDone
                    ? <svg className="size-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"11px", fontWeight:600, color:"white" }}>{idx}</span>
                  }
                </div>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:isActive?600:400, color:textColor, whiteSpace:"nowrap" }}>
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className="mx-3" style={{ height:"1px", width:"28px", backgroundColor: step > 1 ? "#2563eb" : (isDark?"#374151":"#e5e7eb") }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="px-6 flex flex-col gap-4">
        {step === 1 ? (
          <>
            <InfoBanner isDark={isDark}>
              Click <strong>Send</strong> to receive a verification code at{" "}
              <strong>{currentEmail}</strong>
            </InfoBanner>
            <div>
              <FieldLabel label="Verification code" isDark={isDark} />
              <div className="flex items-center rounded-full overflow-hidden"
                style={{ border:`1px solid ${fieldBorder}`, backgroundColor:fieldBg }}>
                <div className="flex items-center gap-2 flex-1 px-4">
                  <Shield className="size-4 shrink-0" style={{ color:txtSec }} strokeWidth={1.5}/>
                  <input value={code} onChange={e => setCode(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && handleContinue()}
                    placeholder="Enter the code from your email"
                    className="flex-1 bg-transparent outline-none py-2.5 text-sm"
                    style={{ fontFamily:"'Inter',sans-serif", color:txtPri }}/>
                </div>
                <button onClick={() => setCodeSent(true)} disabled={codeSent}
                  className="px-4 py-2.5 text-[13px] font-semibold transition-all shrink-0"
                  style={{ fontFamily:"'Inter',sans-serif", color:codeSent?"#9ca3af":"#2563eb",
                    borderLeft:`1px solid ${fieldBorder}`, cursor:codeSent?"default":"pointer" }}>
                  {codeSent ? "Sent ✓" : "Send"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <InfoBanner isDark={isDark}>
              Your current email was verified. Enter the new email address for your account.
            </InfoBanner>
            <div>
              <FieldLabel label="New email address" isDark={isDark} />
              <div className="flex items-center rounded-full overflow-hidden"
                style={{ border:`1.5px solid ${newEmail?"#2563eb":fieldBorder}`, backgroundColor:fieldBg }}>
                <div className="flex items-center gap-2 flex-1 px-4">
                  <Mail className="size-4 shrink-0" style={{ color:txtSec }} strokeWidth={1.5}/>
                  <input autoFocus value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && handleSave()}
                    placeholder="name@example.com" type="email"
                    className="flex-1 bg-transparent outline-none py-2.5 text-sm"
                    style={{ fontFamily:"'Inter',sans-serif", color:txtPri }}/>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="h-4" />
      <DialogFooter
        isDark={isDark}
        onCancel={step === 1 ? onClose : () => setStep(1)}
        onConfirm={step === 1 ? handleContinue : handleSave}
        confirmLabel={step === 1 ? "Continue" : (saved ? "Saved!" : "Save email")}
        confirmDisabled={step === 1 ? !code.trim() : !newEmail.trim()}
      />
    </DialogShell>
  );
}

// ── Set Password Dialog ───────────────────────────────────────
interface SetPasswordDialogProps {
  email: string;
  onClose: () => void;
  isDark: boolean;
}
function SetPasswordDialog({ email, onClose, isDark }: SetPasswordDialogProps) {
  const [code,      setCode]      = useState("");
  const [codeSent,  setCodeSent]  = useState(false);
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [saved,     setSaved]     = useState(false);

  const allFilled   = code.trim() !== "" && password !== "" && confirm !== "" && password === confirm;
  const txtPri      = isDark ? "#e5e7eb" : "#111827";
  const txtSec      = isDark ? "#9ca3af" : "#6b7280";
  const fieldBg     = isDark ? "#1e2430" : "white";
  const fieldBorder = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";

  return (
    <DialogShell title="Set Password" onClose={onClose} isDark={isDark}>
      <div className="px-6 flex flex-col gap-4">
        <InfoBanner isDark={isDark}>
          Click <strong>Send</strong> to receive a verification code at{" "}
          <strong>{email}</strong>
        </InfoBanner>

        {/* Verification code */}
        <div>
          <FieldLabel label="Verification code" isDark={isDark} />
          <div className="flex items-center rounded-full overflow-hidden"
            style={{ border:`1px solid ${fieldBorder}`, backgroundColor:fieldBg }}>
            <div className="flex items-center gap-2 flex-1 px-4">
              <Shield className="size-4 shrink-0" style={{ color:txtSec }} strokeWidth={1.5}/>
              <input value={code} onChange={e => setCode(e.target.value)}
                placeholder="Enter the code from your email"
                className="flex-1 bg-transparent outline-none py-2.5 text-sm"
                style={{ fontFamily:"'Inter',sans-serif", color:txtPri }}/>
            </div>
            <button onClick={() => setCodeSent(true)} disabled={codeSent}
              className="px-4 py-2.5 text-[13px] font-semibold transition-all shrink-0"
              style={{ fontFamily:"'Inter',sans-serif", color:codeSent?"#9ca3af":"#2563eb",
                borderLeft:`1px solid ${fieldBorder}`, cursor:codeSent?"default":"pointer" }}>
              {codeSent ? "Sent ✓" : "Send"}
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <FieldLabel label="New password" isDark={isDark} />
          <div className="relative">
            <div className="flex items-center rounded-full overflow-hidden"
              style={{ border:`1px solid ${fieldBorder}`, backgroundColor:fieldBg }}>
              <div className="flex items-center gap-2 flex-1 px-4">
                <Lock className="size-4 shrink-0" style={{ color:txtSec }} strokeWidth={1.5}/>
                <input type={showPw?"text":"password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setPwFocused(true)} onBlur={() => setPwFocused(false)}
                  placeholder="Create a strong password..."
                  className="flex-1 bg-transparent outline-none py-2.5 text-sm"
                  style={{ fontFamily:"'Inter',sans-serif", color:txtPri, minWidth:0 }}/>
              </div>
              <button type="button" onClick={() => setShowPw(v=>!v)}
                className="pr-4 pl-2 py-2.5 flex items-center" style={{ color:txtSec }}>
                {showPw ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}
              </button>
            </div>
            {pwFocused && <PasswordRequirements value={password}/>}
          </div>
          {/* Inline requirements when not focused */}
          {!pwFocused && password && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 px-1">
              {PW_RULES.map(rule => (
                <span key={rule.label} className="flex items-center gap-1.5 text-[11px]"
                  style={{ color: rule.test(password) ? "#16a34a" : (isDark?"#6b7280":"#9ca3af") }}>
                  <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: rule.test(password)?"#16a34a":(isDark?"#4b5563":"#d1d5db") }}/>
                  {rule.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <FieldLabel label="Confirm password" isDark={isDark} />
          <div className="flex items-center rounded-full overflow-hidden"
            style={{ border:`1px solid ${confirm && confirm !== password ? "#ef4444" : fieldBorder}`, backgroundColor:fieldBg }}>
            <div className="flex items-center gap-2 flex-1 px-4">
              <Lock className="size-4 shrink-0" style={{ color:txtSec }} strokeWidth={1.5}/>
              <input type={showConf?"text":"password"} value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                className="flex-1 bg-transparent outline-none py-2.5 text-sm"
                style={{ fontFamily:"'Inter',sans-serif", color:txtPri }}/>
            </div>
            <button type="button" onClick={() => setShowConf(v=>!v)}
              className="pr-4 pl-2 py-2.5 flex items-center" style={{ color:txtSec }}>
              {showConf ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}
            </button>
          </div>
          {confirm && confirm !== password && (
            <p className="text-[11px] mt-1.5 px-1" style={{ color:"#ef4444", fontFamily:"'Inter',sans-serif" }}>
              Passwords do not match
            </p>
          )}
        </div>
      </div>

      <div className="h-4" />
      <DialogFooter
        isDark={isDark}
        onCancel={onClose}
        onConfirm={() => { if (allFilled) { setSaved(true); setTimeout(onClose, 900); } }}
        confirmLabel={saved ? "Password set!" : "Set password"}
        confirmDisabled={!allFilled}
      />
    </DialogShell>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────
function ConfirmDialog({ title, description, confirmLabel, onConfirm, onClose, isDark }: {
  title: string; description: string; confirmLabel: string;
  onConfirm: () => void; onClose: () => void; isDark: boolean;
}) {
  const bg     = isDark ? "#1a1a24" : "white";
  const border = isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb";
  const txtPri = isDark ? "#f3f4f6" : "#111827";
  const txtSec = isDark ? "#9ca3af" : "#6b7280";
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.3)", backdropFilter: "blur(3px)" }}>
      <div className="flex flex-col"
        style={{ width: "380px", maxWidth: "calc(100vw - 32px)", borderRadius: "18px",
          backgroundColor: bg, border: `1px solid ${border}`,
          boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.55)" : "0 24px 60px rgba(0,0,0,0.10)" }}>
        <div className="px-6 pt-6 pb-5">
          <h3 style={{ fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:"17px", color:txtPri, letterSpacing:"-0.01em" }}>
            {title}
          </h3>
          <p className="mt-2" style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", color:txtSec, lineHeight:"1.55" }}>
            {description}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          <button onClick={onClose}
            className="h-9 px-4 rounded-full text-[13px] font-medium border transition-colors"
            style={{ fontFamily:"'Inter',sans-serif", borderColor:border, color:txtSec, backgroundColor:"transparent" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark?"rgba(255,255,255,0.05)":"#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="h-9 px-5 rounded-full text-[13px] font-semibold transition-colors"
            style={{ fontFamily:"'Inter',sans-serif", backgroundColor:"#ef4444", color:"white" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#dc2626"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#ef4444"}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Account Tab ───────────────────────────────────────────────
function AccountPage({ isDark }: { isDark: boolean }) {
  const { displayName: name, avatarSrc, setDisplayName: setName, setAvatarSrc } = useUserProfile();
  const [editingName,  setEditingName]  = useState(false);
  const [draftName,    setDraftName]    = useState(name);
  const [showSetPw,    setShowSetPw]    = useState(false);
  const [showChgEmail, setShowChgEmail] = useState(false);
  const [showSignOut,  setShowSignOut]  = useState(false);
  const [showDeleteAcc,setShowDeleteAcc]= useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const EMAIL   = "kutskrikirill@gmail.com";

  const txtPri  = isDark ? "#e5e7eb" : "#111827";
  const txtSec  = isDark ? "#9ca3af" : "#6b7280";
  const border  = isDark ? "rgba(255,255,255,0.1)"  : "#e5e7eb";
  const fieldActiveBg = isDark ? "#262e2e" : "white";

  useEffect(() => {
    if (editingName && nameRef.current) {
      setDraftName(name);
      nameRef.current.focus();
      nameRef.current.select();
    }
  }, [editingName]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  function saveName() {
    if (!draftName.trim()) return;
    setName(draftName.trim());
    setEditingName(false);
  }

  return (
    <>
      {showSetPw     && <SetPasswordDialog   email={EMAIL} onClose={() => setShowSetPw(false)}    isDark={isDark} />}
      {showChgEmail  && <ChangeEmailDialog currentEmail={EMAIL} onClose={() => setShowChgEmail(false)} isDark={isDark} />}
      {showSignOut   && <ConfirmDialog
        title="Are you sure you want to log out?"
        description="You'll need to sign in again to access your account."
        confirmLabel="Log Out"
        onConfirm={() => setShowSignOut(false)}
        onClose={() => setShowSignOut(false)}
        isDark={isDark}
      />}
      {showDeleteAcc && <ConfirmDialog
        title="Are you sure you want to delete your account?"
        description="This action is permanent and cannot be undone. All your data will be deleted."
        confirmLabel="Delete Account"
        onConfirm={() => setShowDeleteAcc(false)}
        onClose={() => setShowDeleteAcc(false)}
        isDark={isDark}
      />}

      <div className="flex flex-col">

        {/* ── Avatar row ──────────────────────────── */}
        <div className="flex items-center gap-4 py-5">
          <div className="relative group shrink-0">
            <Avatar className="size-14">
              <AvatarImage src={avatarSrc} alt="Avatar" className="object-cover" />
              <AvatarFallback className="text-base">{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="size-4 text-white" strokeWidth={1.5} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex items-center justify-between flex-1">
            <div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "15px", color: txtPri }}>{name}</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: txtSec, marginTop: "2px" }}>{EMAIL}</p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="h-8 px-3 rounded-full text-[13px] font-medium shrink-0 transition-colors border"
              style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "transparent", color: isDark ? "rgba(255,255,255,0.55)" : "#6b7280", borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              Upload image
            </button>
          </div>
        </div>

        {/* ── Fields ──────────────────────────────── */}
        <div className="flex flex-col gap-2 pb-4">

          {/* Full name */}
          <div>
            <p className="text-xs font-medium mb-1.5 px-1" style={{ color: txtSec, fontFamily: "'Inter', sans-serif" }}>Full name</p>
            <div className="flex items-center gap-2">
              {editingName ? (
                <div
                  className="flex items-center flex-1 rounded-full overflow-hidden"
                  style={{ border: `1.5px solid #2563eb`, backgroundColor: fieldActiveBg }}
                >
                  <input
                    ref={nameRef}
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                    className="flex-1 bg-transparent outline-none px-4 h-10 text-sm"
                    style={{ fontFamily: "'Inter', sans-serif", color: txtPri }}
                    maxLength={255}
                  />
                  <div className="flex items-center gap-1 pr-2">
                    <button
                      onClick={() => setEditingName(false)}
                      className="h-7 px-2.5 rounded-full text-[12px] transition-colors"
                      style={{ color: txtSec, fontFamily: "'Inter', sans-serif" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveName}
                      disabled={!draftName.trim()}
                      className="h-7 px-3 rounded-full text-[12px] font-medium transition-colors"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        backgroundColor: draftName.trim() ? "#2563eb" : "#f3f4f6",
                        color: draftName.trim() ? "white" : txtSec,
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <DisplayField value={name} isDark={isDark} />
                  <ActionBtn label="Edit" onClick={() => { setDraftName(name); setEditingName(true); }} isDark={isDark} />
                </>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <p className="text-xs font-medium mb-1.5 px-1" style={{ color: txtSec, fontFamily: "'Inter', sans-serif" }}>Email address</p>
            <div className="flex items-center gap-2">
              <DisplayField value={EMAIL} isDark={isDark} />
              <ActionBtn label="Change email" onClick={() => setShowChgEmail(true)} isDark={isDark} />
            </div>
          </div>

          {/* Password */}
          <div>
            <p className="text-xs font-medium mb-1.5 px-1" style={{ color: txtSec, fontFamily: "'Inter', sans-serif" }}>Password</p>
            <div className="flex items-center gap-2">
              <DisplayField value="placeholder" isDark={isDark} type="password" />
              <ActionBtn label="Set password" onClick={() => setShowSetPw(true)} isDark={isDark} />
            </div>
          </div>
        </div>

        {/* ── Danger zone ─────────────────────────── */}
        <div className="flex flex-col mt-4 gap-1">

          {/* Sign out */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif", color: txtPri }}>Sign out</p>
              <p className="text-xs mt-0.5" style={{ fontFamily: "'Inter', sans-serif", color: txtSec }}>Sign out of your account on this device</p>
            </div>
            <button
              onClick={() => setShowSignOut(true)}
              className="h-8 px-4 rounded-full text-[13px] font-medium shrink-0 transition-colors"
              style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.14)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"}
            >
              Sign out
            </button>
          </div>

          {/* Delete account */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif", color: txtPri }}>Delete account</p>
              <p className="text-xs mt-0.5" style={{ fontFamily: "'Inter', sans-serif", color: txtSec }}>Permanently delete your account and all data</p>
            </div>
            <button
              onClick={() => setShowDeleteAcc(true)}
              className="h-8 px-4 rounded-full text-[13px] font-medium shrink-0 transition-colors"
              style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#ef4444", color: "white" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#dc2626"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#ef4444"}
            >
              Delete Account
            </button>
          </div>

        </div>

      </div>
    </>
  );
}

// ── Settings Page (inline, full content area) ─────────────────
interface SettingsPageProps {
  onClose: () => void;
}

export function SettingsPage({ onClose }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState("account");
  const { isDark, navStyle } = useTheme();
  const navDk = navStyle === "dark";
  const dk = isDark;

  const contentBg   = dk ? "#111115" : "white";
  // Settings nav uses same background as content (no grey panel)
  const navBg       = contentBg;
  const navBorder   = dk ? "rgba(255,255,255,0.08)" : "#f0f0f0";
  const borderColor = dk ? "rgba(255,255,255,0.08)" : "#f0f0f0";
  const activeNavBg = navDk ? "rgba(255,255,255,0.08)" : (dk ? "rgba(59,130,246,0.12)" : "rgba(37,99,235,0.07)");
  const activeColor = navDk ? "#ffffff" : (dk ? "#3b82f6" : "#2563eb");
  const inactiveColor = navDk ? "rgba(210,214,224,0.7)" : (dk ? "rgba(229,231,235,0.6)" : "#6b7280");
  const titleColor  = navDk ? "rgba(210,214,224,0.9)" : (dk ? "#e5e7eb" : "#111827");
  // "Settings" heading: large, bold, black
  const settingsTitleColor = navDk ? "#ffffff" : (dk ? "#f9fafb" : "#111827");

  const NAV_ITEMS = [
    { id: "account", label: "Account", icon: User },
  ];

  return (
    <div className="flex flex-1 overflow-hidden h-full">

      {/* ── Settings secondary nav ── */}
      <div
        className="flex flex-col shrink-0 h-full"
        style={{ width: "220px", backgroundColor: navBg, borderRight: `1px solid ${borderColor}` }}
      >
        {/* "Settings" heading */}
        <div className="px-5 pt-7 pb-4">
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: "22px",
            color: settingsTitleColor,
            letterSpacing: "-0.01em",
          }}>
            Settings
          </p>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col px-2 gap-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className="h-[32px] w-full rounded-[100px] text-left transition-colors"
                style={{ backgroundColor: isActive ? activeNavBg : "transparent" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = navDk ? "rgba(255,255,255,0.04)" : (dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"); }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <div className="flex items-center gap-[8px] px-[8px] h-full">
                  <Icon
                    className="size-[15px] shrink-0"
                    style={{ color: isActive ? activeColor : inactiveColor }}
                    strokeWidth={1.4}
                  />
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: isActive ? 500 : 400,
                    fontSize: "13.5px",
                    color: isActive ? activeColor : inactiveColor,
                  }}>
                    {label}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Content area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ backgroundColor: contentBg }}>

        {/* Section header */}
        <div
          className="flex items-center justify-between px-8 pt-6 pb-5 shrink-0"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <h1 style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: "18px",
            color: titleColor,
          }}>
            {NAV_ITEMS.find(n => n.id === activeSection)?.label ?? "Settings"}
          </h1>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto">
          <div style={{ maxWidth: "560px", padding: "0 32px 40px" }}>
            <AccountPage isDark={dk} />
          </div>
        </div>
      </div>
    </div>
  );
}
