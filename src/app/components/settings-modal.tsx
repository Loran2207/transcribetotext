import { useState, useRef, useEffect } from "react";
import { User, Camera, Lock, Eye, EyeOff, Shield, Info, Mail } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./ui/alert-dialog";
import { useUserProfile } from "./user-profile-context";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

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
    <div className="absolute left-full top-0 ml-3 w-[220px] bg-card rounded-[10px] shadow-lg border border-border py-3 px-4 z-10">
      <div className="flex flex-col gap-[6px]">
        {PW_RULES.map(rule => (
          <div key={rule.label} className="flex items-center gap-2">
            <div
              className={`size-[6px] rounded-full shrink-0 transition-colors ${
                value && rule.test(value) ? "bg-green-500" : "bg-muted-foreground/30"
              }`}
            />
            <span className="text-[12px] text-muted-foreground">{rule.label}</span>
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
  variant?: "default" | "danger";
}
function ActionBtn({ label, onClick, variant = "default" }: ActionBtnProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`rounded-full shrink-0 text-[13px] ${
        variant === "danger"
          ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
          : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </Button>
  );
}

// ── Disabled display field ────────────────────────────────────
interface DisplayFieldProps {
  value: string;
  placeholder?: string;
  type?: "text" | "password";
}
function DisplayField({ value, placeholder, type = "text" }: DisplayFieldProps) {
  return (
    <div className="flex items-center flex-1 rounded-full px-4 h-10 min-w-0 bg-muted cursor-not-allowed">
      <span
        className="text-sm truncate text-muted-foreground"
        style={{ letterSpacing: type === "password" ? "0.12em" : undefined }}
      >
        {type === "password" ? "••••••••••••" : (value || placeholder || "")}
      </span>
    </div>
  );
}

// ── Shared dialog shell ───────────────────────────────────────
function DialogShell({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/30 backdrop-blur-[3px]">
      <div className="relative flex flex-col bg-background border border-border shadow-xl"
        style={{ width: "480px", maxWidth: "calc(100vw - 32px)", borderRadius: "18px" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-5">
          <h3 className="font-bold text-[18px] text-foreground tracking-tight">
            {title}
          </h3>
          <Button variant="ghost" size="icon"
            onClick={onClose}
            className="size-8 rounded-full">
            <svg viewBox="0 0 14 14" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Info banner ───────────────────────────────────────────────
function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-4 py-3 bg-primary/5 border border-primary/10">
      <Icon icon={Info} className="size-4 shrink-0 mt-px text-primary" strokeWidth={1.8}/>
      <p className="text-[13px] text-primary leading-[1.55]">
        {children}
      </p>
    </div>
  );
}

// ── Field label ───────────────────────────────────────────────
function FieldLabel({ label }: { label: string }) {
  return (
    <Label className="text-[12px] font-medium mb-1.5 text-muted-foreground">
      {label}
    </Label>
  );
}

// ── Dialog footer ─────────────────────────────────────────────
function DialogFooter({ onCancel, onConfirm, confirmLabel, confirmDisabled }: {
  onCancel: () => void; onConfirm: () => void; confirmLabel: string; confirmDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
      <Button variant="outline" onClick={onCancel}
        className="h-9 px-4 rounded-full text-[13px] text-muted-foreground">
        Cancel
      </Button>
      <Button onClick={onConfirm} disabled={confirmDisabled}
        className="h-9 px-5 rounded-full text-[13px] font-semibold">
        {confirmLabel}
      </Button>
    </div>
  );
}

// ── Change Email Dialog ───────────────────────────────────────
interface ChangeEmailDialogProps {
  currentEmail: string;
  onClose: () => void;
}
function ChangeEmailDialog({ currentEmail, onClose }: ChangeEmailDialogProps) {
  const [step,     setStep]     = useState<1 | 2>(1);
  const [code,     setCode]     = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [saved,    setSaved]    = useState(false);

  function handleContinue() { if (code.trim()) setStep(2); }
  function handleSave() {
    if (!newEmail.trim()) return;
    setSaved(true);
    setTimeout(onClose, 900);
  }

  const stepLabels = ["Verify your current email", "Enter your new email"];

  return (
    <DialogShell title="Change your email" onClose={onClose}>
      {/* Stepper */}
      <div className="flex items-center px-6 pb-5">
        {stepLabels.map((label, i) => {
          const idx      = i + 1;
          const isActive = step === idx;
          const isDone   = step > idx;
          return (
            <div key={idx} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={`size-6 rounded-full flex items-center justify-center shrink-0 ${
                  (isActive || isDone) ? "bg-primary" : "bg-muted-foreground/30"
                }`}>
                  {isDone
                    ? <svg className="size-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <span className="text-[11px] font-semibold text-primary-foreground">{idx}</span>
                  }
                </div>
                <span className={`text-[13px] whitespace-nowrap ${
                  (isActive || isDone)
                    ? "text-primary font-semibold"
                    : "text-muted-foreground font-normal"
                }`}>
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`mx-3 h-px w-7 ${step > 1 ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="px-6 flex flex-col gap-4">
        {step === 1 ? (
          <>
            <InfoBanner>
              Click <strong>Send</strong> to receive a verification code at{" "}
              <strong>{currentEmail}</strong>
            </InfoBanner>
            <div>
              <FieldLabel label="Verification code" />
              <div className="flex items-center rounded-full overflow-hidden border border-border bg-background">
                <div className="flex items-center gap-2 flex-1 px-4">
                  <Icon icon={Shield} className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5}/>
                  <Input value={code} onChange={e => setCode(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && handleContinue()}
                    placeholder="Enter the code from your email"
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 py-2.5 text-sm h-auto rounded-none"/>
                </div>
                <Button variant="ghost" onClick={() => setCodeSent(true)} disabled={codeSent}
                  className={`px-4 py-2.5 text-[13px] font-semibold shrink-0 rounded-none border-l border-border h-auto ${
                    codeSent ? "text-muted-foreground" : "text-primary"
                  }`}>
                  {codeSent ? "Sent \u2713" : "Send"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <InfoBanner>
              Your current email was verified. Enter the new email address for your account.
            </InfoBanner>
            <div>
              <FieldLabel label="New email address" />
              <div className={`flex items-center rounded-full overflow-hidden bg-background ${
                newEmail ? "border-[1.5px] border-primary" : "border border-border"
              }`}>
                <div className="flex items-center gap-2 flex-1 px-4">
                  <Icon icon={Mail} className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5}/>
                  <Input autoFocus value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && handleSave()}
                    placeholder="name@example.com" type="email"
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 py-2.5 text-sm h-auto rounded-none"/>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="h-4" />
      <DialogFooter
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
}
function SetPasswordDialog({ email, onClose }: SetPasswordDialogProps) {
  const [code,      setCode]      = useState("");
  const [codeSent,  setCodeSent]  = useState(false);
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [saved,     setSaved]     = useState(false);

  const allFilled = code.trim() !== "" && password !== "" && confirm !== "" && password === confirm;

  return (
    <DialogShell title="Set Password" onClose={onClose}>
      <div className="px-6 flex flex-col gap-4">
        <InfoBanner>
          Click <strong>Send</strong> to receive a verification code at{" "}
          <strong>{email}</strong>
        </InfoBanner>

        {/* Verification code */}
        <div>
          <FieldLabel label="Verification code" />
          <div className="flex items-center rounded-full overflow-hidden border border-border bg-background">
            <div className="flex items-center gap-2 flex-1 px-4">
              <Icon icon={Shield} className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5}/>
              <Input value={code} onChange={e => setCode(e.target.value)}
                placeholder="Enter the code from your email"
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 py-2.5 text-sm h-auto rounded-none"/>
            </div>
            <Button variant="ghost" onClick={() => setCodeSent(true)} disabled={codeSent}
              className={`px-4 py-2.5 text-[13px] font-semibold shrink-0 rounded-none border-l border-border h-auto ${
                codeSent ? "text-muted-foreground" : "text-primary"
              }`}>
              {codeSent ? "Sent \u2713" : "Send"}
            </Button>
          </div>
        </div>

        {/* New password */}
        <div>
          <FieldLabel label="New password" />
          <div className="relative">
            <div className="flex items-center rounded-full overflow-hidden border border-border bg-background">
              <div className="flex items-center gap-2 flex-1 px-4">
                <Icon icon={Lock} className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5}/>
                <Input type={showPw?"text":"password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setPwFocused(true)} onBlur={() => setPwFocused(false)}
                  placeholder="Create a strong password..."
                  className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 py-2.5 text-sm h-auto rounded-none min-w-0"/>
              </div>
              <Button variant="ghost" type="button" onClick={() => setShowPw(v=>!v)}
                className="pr-4 pl-2 py-2.5 h-auto rounded-none text-muted-foreground hover:text-foreground">
                {showPw ? <Icon icon={EyeOff} className="size-4"/> : <Icon icon={Eye} className="size-4"/>}
              </Button>
            </div>
            {pwFocused && <PasswordRequirements value={password}/>}
          </div>
          {/* Inline requirements when not focused */}
          {!pwFocused && password && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 px-1">
              {PW_RULES.map(rule => (
                <span key={rule.label} className={`flex items-center gap-1.5 text-[11px] ${
                  rule.test(password) ? "text-green-600" : "text-muted-foreground"
                }`}>
                  <span className={`size-1.5 rounded-full shrink-0 ${
                    rule.test(password) ? "bg-green-600" : "bg-muted-foreground/30"
                  }`}/>
                  {rule.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <FieldLabel label="Confirm password" />
          <div className={`flex items-center rounded-full overflow-hidden bg-background ${
            confirm && confirm !== password ? "border border-destructive" : "border border-border"
          }`}>
            <div className="flex items-center gap-2 flex-1 px-4">
              <Icon icon={Lock} className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5}/>
              <Input type={showConf?"text":"password"} value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 py-2.5 text-sm h-auto rounded-none"/>
            </div>
            <Button variant="ghost" type="button" onClick={() => setShowConf(v=>!v)}
              className="pr-4 pl-2 py-2.5 h-auto rounded-none text-muted-foreground hover:text-foreground">
              {showConf ? <Icon icon={EyeOff} className="size-4"/> : <Icon icon={Eye} className="size-4"/>}
            </Button>
          </div>
          {confirm && confirm !== password && (
            <p className="text-[11px] mt-1.5 px-1 text-destructive">
              Passwords do not match
            </p>
          )}
        </div>
      </div>

      <div className="h-4" />
      <DialogFooter
        onCancel={onClose}
        onConfirm={() => { if (allFilled) { setSaved(true); setTimeout(onClose, 900); } }}
        confirmLabel={saved ? "Password set!" : "Set password"}
        confirmDisabled={!allFilled}
      />
    </DialogShell>
  );
}

// ── Confirm Dialog (using shadcn AlertDialog) ────────────────
function ConfirmDialog({ title, description, confirmLabel, onConfirm, onClose }: {
  title: string; description: string; confirmLabel: string;
  onConfirm: () => void; onClose: () => void;
}) {
  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent className="rounded-[18px] max-w-[380px] p-0 gap-0">
        <AlertDialogHeader className="px-6 pt-6 pb-5">
          <AlertDialogTitle className="font-bold text-[17px] tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-[13px] leading-[1.55]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-end gap-2 px-6 pb-5">
          <AlertDialogCancel
            className="h-9 px-4 rounded-full text-[13px] font-medium"
            onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-9 px-5 rounded-full text-[13px] font-semibold bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Account Tab ───────────────────────────────────────────────
function AccountPage() {
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
      {showSetPw     && <SetPasswordDialog   email={EMAIL} onClose={() => setShowSetPw(false)} />}
      {showChgEmail  && <ChangeEmailDialog currentEmail={EMAIL} onClose={() => setShowChgEmail(false)} />}
      {showSignOut   && <ConfirmDialog
        title="Are you sure you want to log out?"
        description="You'll need to sign in again to access your account."
        confirmLabel="Log Out"
        onConfirm={() => setShowSignOut(false)}
        onClose={() => setShowSignOut(false)}
      />}
      {showDeleteAcc && <ConfirmDialog
        title="Are you sure you want to delete your account?"
        description="This action is permanent and cannot be undone. All your data will be deleted."
        confirmLabel="Delete Account"
        onConfirm={() => setShowDeleteAcc(false)}
        onClose={() => setShowDeleteAcc(false)}
      />}

      <div className="flex flex-col">

        {/* ── Avatar row ──────────────────────────── */}
        <div className="flex items-center gap-4 py-5">
          <div className="relative group shrink-0">
            <Avatar className="size-14">
              <AvatarImage src={avatarSrc} alt="Avatar" className="object-cover" />
              <AvatarFallback className="text-base">{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button variant="ghost"
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            >
              <Icon icon={Camera} className="size-4 text-primary-foreground" strokeWidth={1.5} />
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex items-center justify-between flex-1">
            <div>
              <p className="font-semibold text-[15px] text-foreground">{name}</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">{EMAIL}</p>
            </div>
            <Button variant="outline" size="sm"
              onClick={() => fileRef.current?.click()}
              className="rounded-full text-[13px] text-muted-foreground"
            >
              Upload image
            </Button>
          </div>
        </div>

        {/* ── Fields ──────────────────────────────── */}
        <div className="flex flex-col gap-5 pb-4">

          {/* Full name */}
          <div>
            <Label className="text-xs font-medium mb-1.5 px-1 text-muted-foreground">Full name</Label>
            <div className="flex items-center gap-2">
              {editingName ? (
                <div className="flex items-center flex-1 rounded-full overflow-hidden border border-input focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] bg-background">
                  <Input
                    ref={nameRef}
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-4 h-10 text-sm rounded-none"
                    maxLength={255}
                  />
                  <div className="flex items-center gap-1 pr-2">
                    <Button variant="ghost" size="sm"
                      onClick={() => setEditingName(false)}
                      className="h-7 px-2.5 rounded-full text-[12px] text-muted-foreground"
                    >
                      Cancel
                    </Button>
                    <Button size="sm"
                      onClick={saveName}
                      disabled={!draftName.trim()}
                      className="h-7 px-3 rounded-full text-[12px] font-medium"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <DisplayField value={name} />
                  <ActionBtn label="Edit" onClick={() => { setDraftName(name); setEditingName(true); }} />
                </>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <Label className="text-xs font-medium mb-1.5 px-1 text-muted-foreground">Email address</Label>
            <div className="flex items-center gap-2">
              <DisplayField value={EMAIL} />
              <ActionBtn label="Change email" onClick={() => setShowChgEmail(true)} />
            </div>
          </div>

          {/* Password */}
          <div>
            <Label className="text-xs font-medium mb-1.5 px-1 text-muted-foreground">Password</Label>
            <div className="flex items-center gap-2">
              <DisplayField value="placeholder" type="password" />
              <ActionBtn label="Set password" onClick={() => setShowSetPw(true)} />
            </div>
          </div>
        </div>

        {/* ── Danger zone ─────────────────────────── */}
        <div className="flex flex-col mt-4 gap-1">

          {/* Sign out */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Sign out</p>
              <p className="text-xs mt-0.5 text-muted-foreground">Sign out of your account on this device</p>
            </div>
            <Button variant="destructive-outline" size="sm"
              onClick={() => setShowSignOut(true)}
              className="rounded-full text-[13px]"
            >
              Sign out
            </Button>
          </div>

          {/* Delete account */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Delete account</p>
              <p className="text-xs mt-0.5 text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm"
              onClick={() => setShowDeleteAcc(true)}
              className="rounded-full text-[13px]"
            >
              Delete Account
            </Button>
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

  const NAV_ITEMS = [
    { id: "account", label: "Account", icon: User },
  ];

  return (
    <div className="flex flex-1 overflow-hidden h-full">

      {/* ── Settings secondary nav ── */}
      <div className="flex flex-col shrink-0 h-full w-[260px] bg-background border-r border-border">
        {/* "Settings" heading — aligned with dashboard greeting */}
        <div className="px-[32px] pt-[28px] pb-6">
          <p className="whitespace-nowrap text-foreground" style={{ fontWeight: 700, fontSize: "28px", lineHeight: "33.6px", letterSpacing: "-0.56px" }}>
            Settings
          </p>
        </div>

        {/* Nav items — reusing sidebar navigation components */}
        <SidebarMenu className="px-[16px]">
          {NAV_ITEMS.map(({ id, label, icon: NavIcon }) => (
            <SidebarMenuItem key={id}>
              <SidebarMenuButton
                isActive={activeSection === id}
                onClick={() => setActiveSection(id)}
              >
                <Icon icon={NavIcon} strokeWidth={1.3} />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>

      {/* ── Content area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background">

        {/* Section header */}
        <div className="flex items-center justify-between px-[32px] pt-[28px] pb-5 shrink-0 border-b border-border">
          <h1 className="font-bold text-[22px] text-foreground tracking-tight">
            {NAV_ITEMS.find(n => n.id === activeSection)?.label ?? "Settings"}
          </h1>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[560px] px-[32px] pb-10">
            <AccountPage />
          </div>
        </div>
      </div>
    </div>
  );
}
