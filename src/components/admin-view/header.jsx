import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { logoutUser } from "@/store/auth-slice";
import { Button } from "../ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Menu, LogOut, User, ChevronRight, ShieldCheck, Settings,
} from "lucide-react";

// ── Breadcrumb from pathname ──────────────────────────────────────────────────
const LABEL_MAP = {
  dashboard:            "Dashboard",
  vendors:              "Vendors",
  products:             "Products",
  "seller-applications":"Seller Applications",
  orders:               "Orders",
  withdrawals:          "Withdrawals",
  customers:            "Customers",
  profile:              "My Profile",
};

function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);       // ["admin", "vendors"]
  const page     = LABEL_MAP[segments[1]] || segments[1] || "Dashboard";

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">Admin</span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-semibold text-foreground">{page}</span>
    </div>
  );
}

export default function AdminHeader({ setOpen }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector((s) => s.auth);

  async function handleLogout() {
    await dispatch(logoutUser());
    navigate("/admin/auth/login", { replace: true });
  }

  const initials = user?.userName
    ? user.userName.slice(0, 2).toUpperCase()
    : "AD";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-white/95 backdrop-blur-sm px-4 md:px-6 shadow-sm">

      {/* Left — hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumb />
      </div>

      {/* Right — user menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-muted transition-colors outline-none">
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold leading-tight text-foreground">
                {user?.userName || "Admin"}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {user?.email || ""}
              </p>
            </div>
            <div className="hidden sm:flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 ml-1">
              <ShieldCheck className="h-3 w-3 text-blue-600" />
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm">{user?.userName}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
              <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide mt-0.5">
                Administrator
              </span>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => navigate("/admin/profile")}
            className="gap-2 cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            My Profile
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
