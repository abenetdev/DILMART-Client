import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  User, Lock, MapPin, Loader2, ArrowLeft,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { updateProfile, changePassword } from "@/store/auth-slice";
import { fetchAllAddresses } from "@/store/shop/address-slice";
import Address from "../address";

// ── Inline feedback banner ───────────────────────────────────────────────────

function Feedback({ type, message }) {
  if (!message) return null;
  const isSuccess = type === "success";
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm mt-3 ${
        isSuccess
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {isSuccess
        ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
        : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
      }
      <span>{message}</span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

function AccountSettings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // ── Profile form state ──────────────────────────────────────────────────
  const [profile, setProfile] = useState({ userName: "", email: "" });
  const [profileFeedback, setProfileFeedback] = useState({ type: "", message: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password form state ─────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordFeedback, setPasswordFeedback] = useState({ type: "", message: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  const userId = user?.id || user?._id;

  // Pre-populate from Redux user — only runs when user changes (not on every keystroke)
  useEffect(() => {
    if (user) {
      setProfile({ userName: user.userName || "", email: user.email || "" });
    }
  }, [user?.userName, user?.email]);

  useEffect(() => {
    if (userId) dispatch(fetchAllAddresses(userId));
  }, [dispatch, userId]);

  // ── Profile validation ──────────────────────────────────────────────────
  function validateProfile() {
    if (!profile.userName.trim()) return "Name is required.";
    if (profile.userName.trim().length < 2) return "Name must be at least 2 characters.";
    if (!profile.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) return "Enter a valid email address.";
    return null;
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileFeedback({ type: "", message: "" });

    const error = validateProfile();
    if (error) {
      setProfileFeedback({ type: "error", message: error });
      return;
    }

    setSavingProfile(true);
    const result = await dispatch(updateProfile({
      userName: profile.userName.trim(),
      email: profile.email.trim(),
    }));
    setSavingProfile(false);

    if (result?.payload?.success) {
      setProfileFeedback({ type: "success", message: result.payload.message || "Profile updated successfully." });
    } else {
      setProfileFeedback({
        type: "error",
        message: result?.payload?.message || "Could not update profile. Please try again.",
      });
    }
  }

  // ── Password validation ─────────────────────────────────────────────────
  function validatePassword() {
    if (!passwords.currentPassword) return "Current password is required.";
    if (!passwords.newPassword) return "New password is required.";
    if (passwords.newPassword.length < 6) return "New password must be at least 6 characters.";
    if (passwords.newPassword !== passwords.confirmPassword) return "Passwords do not match.";
    if (passwords.currentPassword === passwords.newPassword) return "New password must differ from current password.";
    return null;
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPasswordFeedback({ type: "", message: "" });

    const error = validatePassword();
    if (error) {
      setPasswordFeedback({ type: "error", message: error });
      return;
    }

    setSavingPassword(true);
    const result = await dispatch(
      changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
    );
    setSavingPassword(false);

    if (result?.payload?.success) {
      setPasswordFeedback({ type: "success", message: result.payload.message || "Password changed successfully." });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setPasswordFeedback({
        type: "error",
        message: result?.payload?.message || "Could not change password. Please try again.",
      });
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-2xl mx-auto lg:mx-0">

      {/* ── Profile information ──────────────────────────────────────────── */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-muted-foreground" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your display name and email address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="userName">Full Name</Label>
              <Input
                id="userName"
                value={profile.userName}
                onChange={(e) => {
                  setProfile((p) => ({ ...p, userName: e.target.value }));
                  setProfileFeedback({ type: "", message: "" });
                }}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => {
                  setProfile((p) => ({ ...p, email: e.target.value }));
                  setProfileFeedback({ type: "", message: "" });
                }}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <Feedback type={profileFeedback.type} message={profileFeedback.message} />

            <Button type="submit" disabled={savingProfile} className="w-full sm:w-auto gap-2">
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Change password ──────────────────────────────────────────────── */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Change Password
          </CardTitle>
          <CardDescription>Choose a strong password of at least 6 characters</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSave} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <PasswordInput
                id="currentPassword"
                value={passwords.currentPassword}
                onChange={(e) => {
                  setPasswords((p) => ({ ...p, currentPassword: e.target.value }));
                  setPasswordFeedback({ type: "", message: "" });
                }}
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInput
                id="newPassword"
                value={passwords.newPassword}
                onChange={(e) => {
                  setPasswords((p) => ({ ...p, newPassword: e.target.value }));
                  setPasswordFeedback({ type: "", message: "" });
                }}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <PasswordInput
                id="confirmPassword"
                value={passwords.confirmPassword}
                onChange={(e) => {
                  setPasswords((p) => ({ ...p, confirmPassword: e.target.value }));
                  setPasswordFeedback({ type: "", message: "" });
                }}
                autoComplete="new-password"
              />
            </div>

            <Feedback type={passwordFeedback.type} message={passwordFeedback.message} />

            <Button
              type="submit"
              variant="secondary"
              disabled={savingPassword}
              className="w-full sm:w-auto gap-2"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Saved addresses ──────────────────────────────────────────────── */}
      <div>
        <Address />
      </div>
    </div>
  );
}

export default AccountSettings;
