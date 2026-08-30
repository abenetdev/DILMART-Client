import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Pencil,
  Store,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  Clock,
  RefreshCcw,
} from "lucide-react";
import { logoutUser } from "@/store/auth-slice";

// ── Action row item ──────────────────────────────────────────────────────────

function ActionRow({ icon: Icon, label, description, onClick, variant = "default" }) {
  const isDestructive = variant === "destructive";
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-4 rounded-xl px-4 py-3.5 text-left
        transition-colors group
        ${isDestructive
          ? "hover:bg-red-50 text-red-600"
          : "hover:bg-muted/70 text-foreground"
        }
      `}
    >
      <span
        className={`
          flex h-9 w-9 shrink-0 items-center justify-center rounded-full
          ${isDestructive ? "bg-red-100" : "bg-muted"}
        `}
      >
        <Icon className={`h-4 w-4 ${isDestructive ? "text-red-500" : "text-muted-foreground"}`} />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-medium ${isDestructive ? "text-red-600" : "text-foreground"}`}>
          {label}
        </span>
        {description && (
          <span className="block text-xs text-muted-foreground mt-0.5 truncate">{description}</span>
        )}
      </span>
      <ChevronRight className={`h-4 w-4 shrink-0 opacity-40 group-hover:opacity-70 transition-opacity ${isDestructive ? "text-red-400" : ""}`} />
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

function AccountOverview() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { sellerStatus } = useSelector((state) => state.shopSeller);

  const [logoutOpen, setLogoutOpen] = useState(false);

  const initial = user?.userName?.[0]?.toUpperCase() || "U";

  function handleLogout() {
    dispatch(logoutUser());
    navigate("/", { replace: true });
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto lg:mx-0">

      {/* ── Profile card ──────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <Avatar className="h-20 w-20 border-2 border-white/20 shrink-0">
            <AvatarFallback className="bg-white/10 text-white text-3xl font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-tight truncate">
              {user?.userName}
            </h1>
            <p className="text-slate-300 mt-1 flex items-center gap-1.5 text-sm truncate">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {user?.email}
            </p>
          </div>

          {/* Edit button — visible on desktop inline, full-width on mobile below */}
          <Button
            onClick={() => navigate("/account/update-profile")}
            variant="outline"
            className="hidden sm:flex shrink-0 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        {/* Mobile edit button */}
        <Button
          onClick={() => navigate("/account/update-profile")}
          variant="outline"
          className="sm:hidden mt-4 w-full border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white gap-2"
        >
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* ── Seller status banners ─────────────────────────────────────── */}
      {user?.role === "user" && sellerStatus === "pending" && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <Clock className="h-4 w-4 shrink-0 text-yellow-600" />
          <span>
            Your seller application is <strong>under review</strong>. We'll notify you once it's processed.
          </span>
        </div>
      )}

      {user?.role === "user" && sellerStatus === "rejected" && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>Your previous seller application was not approved.</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/become-seller")}
            className="shrink-0 border-red-300 text-red-700 hover:bg-red-100 gap-1.5"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reapply
          </Button>
        </div>
      )}

      {/* ── Account actions ───────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">

        {/* Account section */}
        
        {/* {user?.role === "user" && !sellerStatus && (
          <ActionRow
            icon={Store}
            label="Become a Seller"
            description="Open your own store and start earning"
            onClick={() => navigate("/become-seller")}
          />
        )} */}

        <Separator className="mx-4" />

        {/* Support section */}
        <div className="px-4 pt-4 pb-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1">
            Support & Legal
          </p>
        </div>

        <div className="flex flex-col">
        <ActionRow
          icon={Store}
          label="Become a Seller"
          onClick={() => navigate("/become-seller")}
        />
        <ActionRow
          icon={FileText}
          label="Terms & Conditions"
          onClick={() => navigate("/terms")}
        />

        <ActionRow
          icon={HelpCircle}
          label="Help & Support"          
        />
         </div>

        <Separator className="mx-4" />

        {/* Danger section */}
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1">
            Danger
          </p>
        </div>

        <div className="pb-2">
          <ActionRow
            icon={LogOut}
            label="Log Out"
            onClick={() => setLogoutOpen(true)}
            variant="destructive"
          />
        </div>
      </div>

      {/* ── Logout confirmation dialog ─────────────────────────────────── */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>
              You will be signed out of your account on this device.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLogoutOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AccountOverview;
