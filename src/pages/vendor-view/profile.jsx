import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getProfile, updateProfile, changePassword, clearErrors,
} from "@/store/vendor/profile-slice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

// ── Inline field error ─────────────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" /> {msg}
    </p>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function VendorProfile() {
  const dispatch  = useDispatch();
  const { toast } = useToast();
  const { profile, isLoading, fieldErrors } = useSelector((s) => s.vendorProfile);

  // ── Personal info form ─────────────────────────────────────────────────
  const [info, setInfo] = useState({ userName: "", email: "" });

  // ── Password form ──────────────────────────────────────────────────────
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [savingInfo, setSavingInfo]     = useState(false);
  const [savingPwd,  setSavingPwd]      = useState(false);

  // Load profile
  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  // Sync profile into form once loaded
  useEffect(() => {
    if (profile) {
      setInfo({ userName: profile.userName || "", email: profile.email || "" });
    }
  }, [profile]);

  // ── Save personal info ─────────────────────────────────────────────────
  async function handleSaveInfo(e) {
    e.preventDefault();
    dispatch(clearErrors());
    setSavingInfo(true);
    const res = await dispatch(updateProfile(info));
    setSavingInfo(false);

    if (res?.payload?.success) {
      toast({ title: "Profile updated", description: "Your details have been saved." });
    } else {
      toast({
        title:       "Update failed",
        description: res?.payload?.message || "Check the errors below",
        variant:     "destructive",
      });
    }
  }

  // ── Change password ────────────────────────────────────────────────────
  async function handleChangePwd(e) {
    e.preventDefault();
    dispatch(clearErrors());
    setSavingPwd(true);
    const res = await dispatch(changePassword(pwd));
    setSavingPwd(false);

    if (res?.payload?.success) {
      toast({ title: "Password changed", description: "You can now log in with your new password." });
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      toast({
        title:       "Password change failed",
        description: res?.payload?.message || "Check the errors below",
        variant:     "destructive",
      });
    }
  }

  const toggle = (key) => setShow((p) => ({ ...p, [key]: !p[key] }));

  const passwordStrength = (p) => {
    if (!p) return null;
    if (p.length < 6) return { label: "Too short", color: "text-red-500 bg-red-100" };
    if (p.length < 8)  return { label: "Weak",      color: "text-orange-500 bg-orange-100" };
    if (p.length < 12) return { label: "Good",      color: "text-blue-600 bg-blue-100" };
    if (p.length < 16) return { label: "Strong",      color: "text-green-600 bg-green-100" };
    return { label: "Strong", color: "text-green-600 bg-green-100" };
  };

  const pwdStrength = passwordStrength(pwd.newPassword);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and security</p>
      </div>

      {/* ── Personal Information ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-primary" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your username and email address</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Avatar row */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {profile?.userName?.[0]?.toUpperCase() || "V"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{profile?.userName}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3" /> Verified Vendor
              </span>
            </div>
          </div>

          <Separator className="mb-6" />

          <form onSubmit={handleSaveInfo} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Username</Label>
                <Input
                  value={info.userName}
                  onChange={(e) => { setInfo((p) => ({ ...p, userName: e.target.value })); dispatch(clearErrors()); }}
                  placeholder="yourname"
                  className="mt-1"
                />
                <FieldError msg={fieldErrors?.userName} />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={info.email}
                  onChange={(e) => { setInfo((p) => ({ ...p, email: e.target.value })); dispatch(clearErrors()); }}
                  placeholder="you@example.com"
                  className="mt-1"
                />
                <FieldError msg={fieldErrors?.email} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={savingInfo || isLoading} className="gap-2">
                {savingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {savingInfo ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Change Password ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>Use a strong password of at least 6 characters</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePwd} className="space-y-4">
            {/* Current password */}
            <div>
              <Label>Current Password</Label>
              <div className="relative mt-1">
                <Input
                  type={show.current ? "text" : "password"}
                  value={pwd.currentPassword}
                  onChange={(e) => { setPwd((p) => ({ ...p, currentPassword: e.target.value })); dispatch(clearErrors()); }}
                  placeholder="Your current password"
                  className="pr-10"
                />
                <button type="button" tabIndex={-1} onClick={() => toggle("current")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError msg={fieldErrors?.currentPassword} />
            </div>

            {/* New password */}
            <div>
              <Label>New Password</Label>
              <div className="relative mt-1">
                <Input
                  type={show.next ? "text" : "password"}
                  value={pwd.newPassword}
                  onChange={(e) => { setPwd((p) => ({ ...p, newPassword: e.target.value })); dispatch(clearErrors()); }}
                  placeholder="At least 6 characters"
                  className="pr-10"
                />
                <button type="button" tabIndex={-1} onClick={() => toggle("next")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength badge */}
              {pwdStrength && (
                <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${pwdStrength.color}`}>
                  {pwdStrength.label}
                </span>
              )}
              <FieldError msg={fieldErrors?.newPassword} />
            </div>

            {/* Confirm password */}
            <div>
              <Label>Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  type={show.confirm ? "text" : "password"}
                  value={pwd.confirmPassword}
                  onChange={(e) => { setPwd((p) => ({ ...p, confirmPassword: e.target.value })); dispatch(clearErrors()); }}
                  placeholder="Repeat new password"
                  className={`pr-10 ${
                    pwd.confirmPassword && pwd.confirmPassword !== pwd.newPassword
                      ? "border-red-400 focus-visible:ring-red-400"
                      : pwd.confirmPassword && pwd.confirmPassword === pwd.newPassword
                      ? "border-green-400 focus-visible:ring-green-400"
                      : ""
                  }`}
                />
                <button type="button" tabIndex={-1} onClick={() => toggle("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {pwd.confirmPassword && pwd.confirmPassword === pwd.newPassword && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3" /> Passwords match
                </p>
              )}
              <FieldError msg={fieldErrors?.confirmPassword} />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={
                  savingPwd || isLoading ||
                  !pwd.currentPassword ||
                  !pwd.newPassword ||
                  !pwd.confirmPassword
                }
                className="gap-2"
              >
                {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {savingPwd ? "Changing…" : "Change Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Account Info ──────────────────────────────────────────────────── */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Account Type</p>
              <p className="font-medium capitalize mt-0.5">{profile?.role || "vendor"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Member Since</p>
              <p className="font-medium mt-0.5">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
