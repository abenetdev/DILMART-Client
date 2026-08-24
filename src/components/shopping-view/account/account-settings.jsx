import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { User, Lock, MapPin, Loader2, LogOut } from "lucide-react";
import { updateProfile, changePassword, logoutUser } from "@/store/auth-slice";
import { fetchAllAddresses } from "@/store/shop/address-slice";
import Address from "../address";
import { useToast } from "@/components/ui/use-toast";

function AccountSettings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState({ userName: "", email: "" });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (user) {
      setProfile({ userName: user.userName || "", email: user.email || "" });
    }
  }, [user]);

  useEffect(() => {
    if (userId) dispatch(fetchAllAddresses(userId));
  }, [dispatch, userId]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    const result = await dispatch(updateProfile(profile));
    setSavingProfile(false);

    if (result?.payload?.success) {
      toast({ title: result.payload.message });
    } else {
      toast({
        title: "Update failed",
        description: result?.payload?.message || "Could not update profile",
        variant: "destructive",
      });
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Passwords don't match",
        variant: "destructive",
      });
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
      toast({ title: result.payload.message });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      toast({
        title: "Password change failed",
        description: result?.payload?.message || "Could not change password",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/", { replace: true });
    toast({ title: "Logged out successfully" });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, security, and addresses
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your name and email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Full Name</Label>
                <Input
                  id="userName"
                  value={profile.userName}
                  onChange={(e) => setProfile({ ...profile, userName: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <PasswordInput
                  id="current"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <PasswordInput
                  id="new"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <PasswordInput
                  id="confirm"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                />
              </div>
              <Button type="submit" variant="secondary" disabled={savingPassword}>
                {savingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Saved Addresses
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage delivery addresses for checkout
          </p>
        </div>
        <Address />
      </div>

      <Separator />

      {/* Logout Section */}
      <Card className="border-0 shadow-md border-red-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-red-600">
            <LogOut className="h-5 w-5" />
            Logout
          </CardTitle>
          <CardDescription>
            Sign out of your account on this device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setLogoutDialogOpen(true)}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout from Account
          </Button>
        </CardContent>
      </Card>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Logout from your account?</DialogTitle>
            <DialogDescription>
              You will be signed out and redirected to the home page. You can log back in anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLogoutDialogOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AccountSettings;
