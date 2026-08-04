import { useState, useRef, useEffect } from "react";
import {
  User,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Info,
  Mail,
  Calendar,
  CreditCardIcon,
  Invoice01Icon,
  Shield01Icon,
  LegalDocument01Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  ArrowLeft02Icon,
  CustomerSupportIcon,
  Layers01Icon,
  SquareLockPasswordIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";
import {
  PlanManagementPage,
  usePlanStatePreview,
} from "./plan-management-page";
import { MeetingsSettingsPanel } from "./calendar-settings";
import { PrivacyPolicyPage } from "./privacy-policy-page";
import { TermsOfUsePage } from "./terms-of-use-page";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { cn } from "./ui/utils";
import { MODAL_SURFACE, MODAL_W_CONFIRM, MODAL_W_FORM, MODAL_FOOTER, MODAL_HEADER } from "./modal-surface";
import { useUserProfile } from "./user-profile-context";
import { setInnerScreen } from "./inner-screen";
import { useAuth } from "./auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ── Password requirements ─────────────────────────────────────
const PW_RULES = [
  { label: "8 - 20 characters",           test: (v: string) => v.length >= 8 && v.length <= 20 },
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
      className={`h-9 rounded-full border px-4 shrink-0 text-[13px] font-medium ${
        variant === "danger"
          ? "border-destructive/20 bg-destructive/10 text-destructive hover:border-destructive/30 hover:bg-destructive/15 hover:text-destructive"
          : "border-border !bg-transparent text-muted-foreground hover:!bg-transparent hover:border-muted-foreground/40 hover:text-foreground"
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
    <div className="flex items-center flex-1 rounded-[12px] px-4 h-10 min-w-0 bg-muted cursor-not-allowed">
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      {/* The base content draws its own bare close glyph as the last child. This
          product closes with a round ghost button in the header, so that one is
          hidden rather than drawn twice. The description is opted out of because
          each dialog says what it is in its own body. */}
      <DialogContent
        aria-describedby={undefined}
        className={cn(MODAL_SURFACE, MODAL_W_FORM, "gap-0 p-0 [&>button:last-child]:hidden")}
      >
        <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0 px-6 pt-6 pb-5 text-left">
          <DialogTitle className="font-bold text-[18px] text-foreground tracking-tight">
            {title}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-full">
              <svg viewBox="0 0 14 14" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1l12 12M13 1L1 13"/>
              </svg>
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
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
      <Button variant="pill-outline" onClick={onCancel}
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
              <div className="flex items-center rounded-[12px] overflow-hidden border border-border bg-background">
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
              <div className={`flex items-center rounded-[12px] overflow-hidden bg-background ${
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

// ── Change Password Dialog ───────────────────────────────────
interface ChangePasswordDialogProps {
  email: string;
  onClose: () => void;
}
function ChangePasswordDialog({ email, onClose }: ChangePasswordDialogProps) {
  const [currentPw,  setCurrentPw]  = useState("");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showCurr,   setShowCurr]   = useState(false);
  const [showPw,     setShowPw]     = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [pwFocused,  setPwFocused]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const passwordsMatch = password !== "" && confirm !== "" && password === confirm;
  const canSubmit = currentPw.trim() !== "" && password.length >= 6 && passwordsMatch && !saving;

  async function handleSave() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);

    // Verify current password by re-authenticating
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPw,
    });
    if (verifyError) {
      setError("Current password is incorrect");
      setSaving(false);
      return;
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    toast.success("Password changed successfully");
    onClose();
  }

  return (
    <DialogShell title="Change password" onClose={onClose}>
      <div className="px-6 flex flex-col gap-4">
        {error && (
          <p className="text-[13px] text-destructive">{error}</p>
        )}

        {/* Current password */}
        <div>
          <FieldLabel label="Current password" />
          <div className="flex items-center rounded-[12px] overflow-hidden border border-border bg-background">
            <div className="flex items-center gap-2 flex-1 px-4">
              <Icon icon={Lock} className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5}/>
              <Input type={showCurr?"text":"password"} value={currentPw}
                onChange={e => { setCurrentPw(e.target.value); setError(null); }}
                placeholder="Enter your current password"
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 py-2.5 text-sm h-auto rounded-none"/>
            </div>
            <Button variant="ghost" type="button" onClick={() => setShowCurr(v=>!v)}
              className="pr-4 pl-2 py-2.5 h-auto rounded-none text-muted-foreground hover:text-foreground">
              {showCurr ? <Icon icon={EyeOff} className="size-4"/> : <Icon icon={Eye} className="size-4"/>}
            </Button>
          </div>
        </div>

        {/* New password */}
        <div>
          <FieldLabel label="New password" />
          <div className="relative">
            <div className="flex items-center rounded-[12px] overflow-hidden border border-border bg-background">
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
          {password && password.length < 6 && !pwFocused && (
            <p className="text-[11px] mt-1.5 px-1 text-destructive">
              Password must be at least 6 characters
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <FieldLabel label="Confirm new password" />
          <div className={`flex items-center rounded-[12px] overflow-hidden bg-background ${
            confirm && confirm !== password ? "border border-destructive" : "border border-border"
          }`}>
            <div className="flex items-center gap-2 flex-1 px-4">
              <Icon icon={Lock} className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5}/>
              <Input type={showConf?"text":"password"} value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter your new password"
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
        onConfirm={handleSave}
        confirmLabel={saving ? "Saving..." : "Change password"}
        confirmDisabled={!canSubmit}
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
      <AlertDialogContent className={cn(MODAL_SURFACE, MODAL_W_CONFIRM, "p-0 gap-0")}>
        <AlertDialogHeader className={cn(MODAL_HEADER, "px-6 pt-6 pb-5")}>
          <AlertDialogTitle className="font-bold text-[17px] tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-[13px] leading-[1.55]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={cn(MODAL_FOOTER, "px-6 pb-5 max-md:pb-[calc(20px+env(safe-area-inset-bottom))]")}>
          <AlertDialogCancel
            className="h-9 px-4 rounded-full text-[13px] font-medium"
            onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-9 px-5 rounded-full text-[13px] font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Two-letter initials from a display name, for the avatar fallback.
function initialsOf(name: string): string {
  const parts = String(name || "").trim().split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ── Account Tab ───────────────────────────────────────────────
const HELP_ROWS = [
  {
    label: "Contact Support",
    desc: "support@transcribetotext.ai",
    icon: Mail,
    mail: "support@transcribetotext.ai",
    section: null as null | "terms" | "privacy",
  },
  { label: "Terms of Use", desc: "How the service works", icon: LegalDocument01Icon, section: "terms" as const },
  { label: "Privacy Policy", desc: "What we store and why", icon: Shield01Icon, section: "privacy" as const },
];

export function AccountSettingsDetailed({ onOpenSection }: { onOpenSection: (id: "terms" | "privacy") => void }) {
  const { displayName: localName, avatarSrc, setDisplayName: setLocalName, setAvatarSrc } = useUserProfile();
  const { user, signOut } = useAuth();

  // Use Supabase user data, fall back to local profile
  const authName = user?.user_metadata?.full_name as string | undefined;
  const name = authName || localName;
  const EMAIL = user?.email || "";

  const [editingName,  setEditingName]  = useState(false);
  const [draftName,    setDraftName]    = useState(name);
  const [showSetPw,    setShowSetPw]    = useState(false);
  const [showChgEmail, setShowChgEmail] = useState(false);
  const [showSignOut,  setShowSignOut]  = useState(false);
  const [showDeleteAcc,setShowDeleteAcc]= useState(false);
  const [savingName,   setSavingName]   = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName && nameRef.current) {
      setDraftName(name);
      nameRef.current.focus();
      nameRef.current.select();
    }
  }, [editingName, name]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function saveName() {
    if (!draftName.trim()) return;
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: draftName.trim() },
    });
    setSavingName(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLocalName(draftName.trim());
    setEditingName(false);
    toast.success("Profile updated");
  }

  return (
    <>
      {showSetPw     && <ChangePasswordDialog email={EMAIL} onClose={() => setShowSetPw(false)} />}
      {showChgEmail  && <ChangeEmailDialog currentEmail={EMAIL} onClose={() => setShowChgEmail(false)} />}
      {showSignOut   && <ConfirmDialog
        title="Are you sure you want to log out?"
        description="You'll need to sign in again to access your account."
        confirmLabel="Log out"
        onConfirm={() => { setShowSignOut(false); signOut(); }}
        onClose={() => setShowSignOut(false)}
      />}
      {showDeleteAcc && <ConfirmDialog
        title="Are you sure you want to delete your account?"
        description="This action is permanent and cannot be undone. All your data will be deleted."
        confirmLabel="Delete account"
        onConfirm={() => { setShowDeleteAcc(false); toast("Account deletion coming soon."); }}
        onClose={() => setShowDeleteAcc(false)}
      />}

      <div className="flex flex-col">

        {/* ── Avatar row ──────────────────────────── */}
        <div className="flex items-center gap-4 py-5">
          <div className="relative group shrink-0">
            <Avatar className="size-14">
              {avatarSrc ? <AvatarImage src={avatarSrc} alt="Avatar" className="object-cover" /> : null}
              <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">{initialsOf(name)}</AvatarFallback>
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
              className="h-9 rounded-full border border-border !bg-transparent px-4 text-[13px] font-medium text-muted-foreground hover:!bg-transparent hover:border-muted-foreground/40 hover:text-foreground"
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
                <div className="flex items-center flex-1 rounded-[12px] overflow-hidden border border-input focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] bg-background">
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
              <ActionBtn label="Change password" onClick={() => setShowSetPw(true)} />
            </div>
          </div>
        </div>

        {/* ── Danger zone ─────────────────────────── */}
        {/* Help and legal: the rows the account screen is expected to carry.
            Support opens a mail draft; the two documents open in place. */}
        <div className="mt-7">
          <p className="text-[13px] font-semibold text-foreground">Support and legal</p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border">
            {HELP_ROWS.map((row, i) => (
              <button
                key={row.label}
                type="button"
                onClick={() => {
                  if (row.section) onOpenSection(row.section);
                  else window.location.href = `mailto:${row.mail}`;
                }}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/10">
                  <Icon icon={row.icon} className="size-4 text-primary" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-foreground">{row.label}</span>
                  <span className="block text-[12.5px] text-muted-foreground">{row.desc}</span>
                </span>
                <Icon
                  icon={ArrowRight01Icon}
                  className="size-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.8}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col mt-4 gap-1">

          {/* Sign out */}
          <div className="flex flex-col items-start gap-2.5 py-3 md:flex-row md:items-center md:justify-between md:gap-4">
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
          <div className="flex flex-col items-start gap-2.5 py-3 md:flex-row md:items-center md:justify-between md:gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Delete account</p>
              <p className="text-xs mt-0.5 text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive-outline" size="sm"
              onClick={() => setShowDeleteAcc(true)}
              className="rounded-full text-[13px]"
            >
              Delete account
            </Button>
          </div>

        </div>

      </div>
    </>
  );
}

// ── Invoices (coming soon) ────────────────────────────────────
function InvoicesComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <Icon icon={Invoice01Icon} className="size-7 text-muted-foreground" strokeWidth={1.4} />
      </div>
      <h2 className="text-[17px] font-semibold text-foreground">Invoices are coming soon</h2>
      <p className="mt-2 max-w-[360px] text-[13.5px] leading-relaxed text-muted-foreground">
        You'll be able to view and download your billing history and receipts here once your workspace has its first paid invoice.
      </p>
    </div>
  );
}

// ── Account ───────────────────────────────────────────────────
// The screen the product already ships, drawn with our tokens: the same rows,
// the same words, the same order, so nothing has to be rebuilt to adopt it.
// Every row below the form opens an inner page. There is no tab strip.
const ACCOUNT_ROWS: {
  label: string;
  icon: typeof Mail;
  section?: SectionId;
  mail?: string;
}[] = [
  { label: "Contact Support", icon: CustomerSupportIcon, mail: "support@transcribetotext.ai" },
  { label: "Privacy Policy",  icon: Shield01Icon,        section: "privacy" },
  { label: "Terms of Use",    icon: LegalDocument01Icon, section: "terms" },
  { label: "Plan Management", icon: Layers01Icon,        section: "plan" },
  { label: "Invoices",        icon: Invoice01Icon,       section: "invoices" },
];

function FormLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-[12.5px] text-muted-foreground">{children}</span>;
}

function AccountPage({ onOpenSection }: { onOpenSection: (id: SectionId) => void }) {
  const { displayName: localName, setDisplayName: setLocalName } = useUserProfile();
  const { user } = useAuth();

  const authName = user?.user_metadata?.full_name as string | undefined;
  const name = authName || localName;
  const email = user?.email || "";

  const [draftName, setDraftName] = useState(name);
  const [savingName, setSavingName] = useState(false);
  const [showSetPw, setShowSetPw] = useState(false);
  const [showDeleteAcc, setShowDeleteAcc] = useState(false);

  useEffect(() => { setDraftName(name); }, [name]);

  const dirty = draftName.trim() !== "" && draftName.trim() !== name;

  async function saveName() {
    if (!dirty) return;
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: draftName.trim() } });
    setSavingName(false);
    if (error) { toast.error(error.message); return; }
    setLocalName(draftName.trim());
    toast.success("Profile updated");
  }

  return (
    <>
      {showSetPw && <ChangePasswordDialog email={email} onClose={() => setShowSetPw(false)} />}
      {showDeleteAcc && <ConfirmDialog
        title="Are you sure you want to delete your account?"
        description="This action is permanent and cannot be undone. All your data will be deleted."
        confirmLabel="Delete account"
        onConfirm={() => { setShowDeleteAcc(false); toast("Account deletion coming soon."); }}
        onClose={() => setShowDeleteAcc(false)}
      />}

      <div className="flex flex-col">
        {/* Name and email sit side by side on anything wider than a phone,
            exactly as the product lays them out. */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div>
            <FormLabel>User name</FormLabel>
            <div className="flex h-12 items-center gap-2 rounded-[14px] border border-border bg-card pl-4 pr-2 focus-within:border-primary">
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
                maxLength={255}
                className="h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 text-[14px] shadow-none focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={saveName}
                disabled={!dirty || savingName}
                className={`h-8 shrink-0 px-3 text-[13px] font-semibold ${dirty ? "text-primary" : "text-primary/40"}`}
              >
                {savingName ? "Saving" : "Save"}
              </Button>
            </div>
          </div>

          <div>
            <FormLabel>Email</FormLabel>
            <div className="flex h-12 items-center rounded-[14px] bg-muted px-4">
              <span className="truncate text-[14px] text-muted-foreground">{email}</span>
            </div>
          </div>
        </div>

        {/* Set password keeps the product's half width on desktop. */}
        <button
          type="button"
          onClick={() => setShowSetPw(true)}
          className="mt-5 flex w-full items-center gap-4 rounded-[16px] bg-primary/5 px-5 py-4 text-left transition-colors hover:bg-primary/[0.08] sm:w-[calc(50%-12px)]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-foreground">Set password</span>
            <span className="mt-0.5 block text-[13px] text-muted-foreground">
              Set a password for your T2T.Ai account
            </span>
          </span>
          <Icon icon={SquareLockPasswordIcon} className="size-5 shrink-0 text-primary" strokeWidth={1.8} />
        </button>

        {/* The five inner pages. */}
        <div className="mt-8 flex flex-col gap-3">
          {ACCOUNT_ROWS.map((row) => (
            <button
              key={row.label}
              type="button"
              onClick={() => {
                if (row.section) onOpenSection(row.section);
                else if (row.mail) window.location.href = `mailto:${row.mail}`;
              }}
              className="flex w-full items-center gap-4 rounded-[16px] border border-border bg-card px-5 py-4 text-left shadow-[var(--elevation-sm)] transition-colors hover:bg-accent"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon icon={row.icon} className="size-5 text-primary" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-semibold text-foreground">{row.label}</span>
              <Icon icon={ArrowRight02Icon} className="size-5 shrink-0 text-primary" strokeWidth={2} />
            </button>
          ))}
        </div>

        <Button
          variant="destructive-outline"
          onClick={() => setShowDeleteAcc(true)}
          className="mt-8 h-12 w-full border border-destructive/40 bg-transparent text-[14px] font-semibold hover:bg-destructive/5 sm:w-[calc(50%-12px)]"
        >
          Delete account
        </Button>
      </div>
    </>
  );
}

// ── Settings, as internal pages ───────────────────────────────
// Account is the root. Everything else opens under it with a back arrow,
// which is how the product navigates. On phones the drill-in chrome in the
// top bar carries the back control, so the inline header hides there.
interface SettingsPageProps {
  onClose: () => void;
}

type SectionId = "account" | "plan" | "meetings" | "invoices" | "privacy" | "terms";

const SECTION_TITLE: Record<SectionId, string> = {
  account:  "Account",
  plan:     "Plan Management",
  meetings: "Meetings",
  invoices: "Invoices",
  privacy:  "Privacy Policy",
  terms:    "Terms of Use",
};

const MAX_WIDTH: Record<SectionId, string> = {
  account:  "max-w-[800px]",
  plan:     "max-w-[788px]",
  meetings: "max-w-[720px]",
  invoices: "max-w-[560px]",
  privacy:  "max-w-[1080px]",
  terms:    "max-w-[1080px]",
};

export function SettingsPage({ onClose: _onClose }: SettingsPageProps) {
  const [section, setSection] = useState<SectionId>(() => {
    try {
      const f = localStorage.getItem("ttt_demo_settings_section");
      if (f && Object.prototype.hasOwnProperty.call(SECTION_TITLE, f)) return f as SectionId;
    } catch { /* ignore */ }
    return "account";
  });
  const [planState] = usePlanStatePreview();

  const isRoot = section === "account";
  const title = SECTION_TITLE[section];

  // Only the phone bars read this store, so it registers at every width and
  // survives a resize. Gating it on a one-shot media query missed the phone
  // whenever the app had loaded wide first.
  useEffect(() => {
    if (isRoot) { setInnerScreen(null); return; }
    setInnerScreen({ back: () => setSection("account"), parent: "Account", title, hideNav: true });
    return () => setInnerScreen(null);
  }, [isRoot, title]);

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-background">
      <div className={`${MAX_WIDTH[section]} w-full px-[16px] pb-16 pt-[16px] lg:px-[32px] lg:pt-[28px]`}>
        <div className={isRoot ? "" : "max-md:hidden"}>
          <div className="mb-6 flex items-center gap-2 lg:mb-8">
            {!isRoot && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSection("account")}
                aria-label="Back to account"
                className="-ml-2 size-9 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Icon icon={ArrowLeft02Icon} className="size-5" strokeWidth={2} />
              </Button>
            )}
            <h1
              className="text-foreground text-[24px] leading-[30px] tracking-[-0.4px] lg:text-[32px] lg:leading-[38px] lg:tracking-[-0.6px]"
              style={{ fontWeight: 700 }}
            >
              {title}
            </h1>
          </div>
        </div>

        {section === "account"  && <AccountPage onOpenSection={setSection} />}
        {section === "plan"     && <PlanManagementPage state={planState} />}
        {section === "meetings" && <MeetingsSettingsPanel />}
        {section === "invoices" && <InvoicesComingSoon />}
        {section === "privacy"  && <PrivacyPolicyPage />}
        {section === "terms"    && <TermsOfUsePage />}
      </div>
    </div>
  );
}
