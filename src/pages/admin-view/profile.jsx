import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck, User, Mail, KeyRound, Loader2, CheckCircle2, Eye, EyeOff,
} from "lucide-react";
import axios from "axios";
import { patchUserInState } from "@/store/auth-slice";

const BASE = "http://localhost:5000/api/admin/auth";
const cfg  = { withCredentials: true };

// ── Password input with show/hide toggle ──────────────────────────────────
function PasswordInput({ id, value, onChange, placeholder, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-10"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((p) => !p)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Field-level feedback ──────────────────────────────────────────────────
function FieldError({ msg }) {
  return msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;
}

export default function AdminProfile() {
  const dispatch   = useDispatch();
  const { toast }  = useToast();
  const { user }   = useSelector((s) => s.auth);

  // ── Profile form ──────────────────────────────────────────────────────
  const [profileForm,    setProfileForm]    = useState({ userName: user?.userName || "", email: user?.email || "" });
  const [profileErrors,  setProfileErrors]  = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved,   setProfileSaved]   = useState(false);

  // ── Password form ─────────────────────────────────────────────────────
  const [pwdForm,    setPwdForm]    = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwdErrors,  setPwdErrors]  = useState({});
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSaved,   setPwdSaved]   = useState(false);

  // ── Profile submit ────────────────────────────────────────────────────
  function validateProfile() {
    const e = {};
    if (!profileForm.userName.trim()) e.userName = "Name is required";
    else if (profileForm.userName.trim().length < 2) e.userName = "Name must be at least 2 characters";
    if (!profileForm.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) e.email = "Enter a valid email";
    return e;
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    const errors = validateProfile();
    if (Object.keys(errors).length) { setProfileErrors(errors); return; }
    setProfileErrors({});
    setProfileLoading(true);
    try {
      const res = await axios.patch(`${BASE}/profile`, {
        userName: profileForm.userName.trim(),
        email:    profileForm.email.trim().toLowerCase(),
      }, cfg);

      if (res.data.success) {
        // Push updated name/email into Redux so the header reflects the change
        dispatch(patchUserInState({ userName: res.data.user.userName, email: res.data.user.email }));
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
        toast({ title: "Profile updated successfully" });
      } else {
        toast({ title: res.data.message || "Update failed", variant: "destructive" });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setProfileLoading(false);
    }
  }

  // ── Password submit ───────────────────────────────────────────────────
  function validatePassword() {
    const e = {};
    if (!pwdForm.currentPassword) e.currentPassword = "Current password is required";
    if (!pwdForm.newPassword) e.newPassword = "New password is required";
    else if (pwdForm.newPassword.length < 8) e.newPassword = "Must be at least 8 characters";
    else if (pwdForm.currentPassword && pwdForm.currentPassword === pwdForm.newPassword)
      e.newPassword = "New password must differ from current";
    if (!pwdForm.confirmPassword) e.confirmPassword = "Please confirm your new password";
    else if (pwdForm.newPassword !== pwdForm.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    const errors = validatePassword();
    if (Object.keys(errors).length) { setPwdErrors(errors); return; }
    setPwdErrors({});
    setPwdLoading(true);
    try {
      const res = await axios.patch(`${BASE}/change-password`, {
        currentPassword: pwdForm.currentPassword,
        newPassword:     pwdForm.newPassword,
      }, cfg);

      if (res.data.success) {
        setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPwdSaved(true);
        setTimeout(() => setPwdSaved(false), 3000);
        toast({ title: "Password changed successfully" });
      } else {
        toast({ title: res.data.message || "Failed to change password", variant: "destructive" });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      // Show field-level error for wrong current password
      if (msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("current")) {
        setPwdErrors({ currentPassword: msg });
      } else {
        toast({ title: msg, variant: "destructive" });
      }
    } finally {
      setPwdLoading(false);
    }
  }

  const profileDirty =
    profileForm.userName.trim() !== (user?.userName || "") ||
    profileForm.email.trim().toLowerCase() !== (user?.email || "");

  const passwordStrength = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 8) return { label: "Too short", color: "bg-red-400" };
    const strong = /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
    const medium = /[A-Z]/.test(pwd) || /[0-9]/.test(pwd);
    if (strong) return { label: "Strong",  color: "bg-green-500" };
    if (medium) return { label: "Medium",  color: "bg-yellow-400" };
    return           { label: "Weak",    color: "bg-red-400" };
  };
  const pwdStrength = passwordStrength(pwdForm.newPassword);

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Admin Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account credentials</p>
        </div>
      </div>

      {/* ── Profile info ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-muted-foreground" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your display name and email address.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <form onSubmit={handleProfileSave} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="userName">Display Name</Label>
              <Input
                id="userName"
                value={profileForm.userName}
                onChange={(e) => {
                  setProfileForm((p) => ({ ...p, userName: e.target.value }));
                  if (profileErrors.userName) setProfileErrors((p) => ({ ...p, userName: "" }));
                }}
                placeholder="Your name"
                disabled={profileLoading}
              />
              <FieldError msg={profileErrors.userName} />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => {
                    setProfileForm((p) => ({ ...p, email: e.target.value }));
                    if (profileErrors.email) setProfileErrors((p) => ({ ...p, email: "" }));
                  }}
                  placeholder="admin@example.com"
                  disabled={profileLoading}
                  className="pl-9"
                />
              </div>
              <FieldError msg={profileErrors.email} />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                type="submit"
                disabled={profileLoading || !profileDirty}
                className="gap-2"
              >
                {profileLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : profileSaved
                  ? <CheckCircle2 className="h-4 w-4" />
                  : <User className="h-4 w-4" />
                }
                {profileSaved ? "Saved!" : "Save Changes"}
              </Button>
              {!profileDirty && (
                <span className="text-xs text-muted-foreground">No changes to save</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Change password ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Change Password
          </CardTitle>
          <CardDescription>
            Use a strong password of at least 8 characters. Changing your password will
            invalidate all other active admin sessions.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <form onSubmit={handlePasswordSave} className="space-y-4">
            {/* Current */}
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <PasswordInput
                id="currentPassword"
                value={pwdForm.currentPassword}
                onChange={(e) => {
                  setPwdForm((p) => ({ ...p, currentPassword: e.target.value }));
                  if (pwdErrors.currentPassword) setPwdErrors((p) => ({ ...p, currentPassword: "" }));
                }}
                placeholder="Enter current password"
                disabled={pwdLoading}
              />
              <FieldError msg={pwdErrors.currentPassword} />
            </div>

            {/* New */}
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInput
                id="newPassword"
                value={pwdForm.newPassword}
                onChange={(e) => {
                  setPwdForm((p) => ({ ...p, newPassword: e.target.value }));
                  if (pwdErrors.newPassword) setPwdErrors((p) => ({ ...p, newPassword: "" }));
                }}
                placeholder="At least 8 characters"
                disabled={pwdLoading}
              />
              {/* Strength bar */}
              {pwdForm.newPassword && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pwdStrength?.color}`}
                      style={{ width: pwdStrength?.label === "Strong" ? "100%" : pwdStrength?.label === "Medium" ? "60%" : "30%" }}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${
                    pwdStrength?.label === "Strong" ? "text-green-600"
                    : pwdStrength?.label === "Medium" ? "text-yellow-600"
                    : "text-red-500"
                  }`}>
                    {pwdStrength?.label}
                  </span>
                </div>
              )}
              <FieldError msg={pwdErrors.newPassword} />
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <PasswordInput
                id="confirmPassword"
                value={pwdForm.confirmPassword}
                onChange={(e) => {
                  setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }));
                  if (pwdErrors.confirmPassword) setPwdErrors((p) => ({ ...p, confirmPassword: "" }));
                }}
                placeholder="Re-enter new password"
                disabled={pwdLoading}
              />
              {/* Match indicator */}
              {pwdForm.confirmPassword && pwdForm.newPassword && (
                <p className={`text-xs mt-1 ${pwdForm.newPassword === pwdForm.confirmPassword ? "text-green-600" : "text-red-500"}`}>
                  {pwdForm.newPassword === pwdForm.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                </p>
              )}
              <FieldError msg={pwdErrors.confirmPassword} />
            </div>

            <Button
              type="submit"
              disabled={pwdLoading || !pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword}
              className="gap-2"
            >
              {pwdLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : pwdSaved
                ? <CheckCircle2 className="h-4 w-4" />
                : <KeyRound className="h-4 w-4" />
              }
              {pwdSaved ? "Password Changed!" : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
