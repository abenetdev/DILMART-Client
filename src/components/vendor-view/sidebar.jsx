import {
  ChartNoAxesCombined,
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Wallet,
  Store,
  LogOut,
  User,
  ChevronRight,
  Settings,
  Bell,
} from "lucide-react";
import { Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { logoutUser } from "@/store/auth-slice";
import vendorIcon from "@/assets/vendor.png"
// ── Nav Items ──────────────────────────────────────────────────────────────

const navItems = [
  {
    id:       "dashboard",
    label:    "Overview",
    sublabel: "Business Summary",
    path:     "/vendor/dashboard",
    icon:     LayoutDashboard,
  },
  {
    id:       "products",
    label:    "Products",
    sublabel: "Manage Inventory",
    path:     "/vendor/products",
    icon:     ShoppingBag,
  },
  {
    id:       "orders",
    label:    "Orders",
    sublabel: "Track & Fulfill",
    path:     "/vendor/orders",
    icon:     ClipboardList,
  },
  // {
  //   id:       "notifications",
  //   label:    "Notifications",
  //   sublabel: "Alerts & Updates",
  //   path:     "/vendor/notifications",
  //   icon:     Bell,
  // },
  {
    id:       "wallet",
    label:    "Wallet",
    sublabel: "Earnings & Payouts",
    path:     "/vendor/wallet",
    icon:     Wallet,
  },
  {
    id:       "store-settings",
    label:    "Store Settings",
    sublabel: "Customize Your Store",
    path:     "/vendor/store-settings",
    icon:     Store,
  },
  {
    id:       "profile",
    label:    "Profile",
    sublabel: "Personal Details",
    path:     "/vendor/profile",
    icon:     User,
  },
];

// ── Nav Item Component ─────────────────────────────────────────────────────

function NavItem({ item, setOpen, badge }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isActive  = location.pathname === item.path ||
                    location.pathname.startsWith(item.path + "/");
  const Icon      = item.icon;

  return (
    <button
      onClick={() => {
        navigate(item.path);
        setOpen?.(false);
      }}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
        transition-all duration-150 group
        ${isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }
      `}
    >
      {/* Icon box */}
      <div
        className={`
          flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center
          transition-colors
          ${isActive
            ? "bg-white/20"
            : "bg-muted group-hover:bg-background"
          }
        `}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight tracking-wide ${isActive ? "text-primary-foreground" : ""}`}>
          {item.label}
        </p>
        <p className={`text-[10px] leading-tight mt-0.5 truncate ${isActive ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
          {item.sublabel}
        </p>
      </div>

      {/* Unread badge (notifications) */}
      {badge > 0 && (
        <span className={`
          flex-shrink-0 h-4 min-w-[1rem] px-1 rounded-full text-[10px] font-bold
          flex items-center justify-center leading-none
          ${isActive ? "bg-white/30 text-primary-foreground" : "bg-red-500 text-white"}
        `}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}

      {/* Active indicator */}
      {isActive && !badge && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-primary-foreground/70" />}
    </button>
  );
}

// ── Profile Footer ─────────────────────────────────────────────────────────

function ProfileFooter({ setOpen }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const initials = user?.userName
    ? user.userName.slice(0, 2).toUpperCase()
    : "VD";

  function handleLogout() {
    dispatch(logoutUser());
    setOpen?.(false);
  }

  return (
    <div className="mt-auto border-t pt-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-colors text-left group">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">
                {user?.userName || "Vendor"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user?.email || "vendor@store.com"}
              </p>
            </div>
            <Settings className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 group-hover:text-foreground transition-colors" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
          {/* Profile header */}
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-semibold">{user?.userName}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>

          <DropdownMenuItem
            onClick={() => {
              navigate("/vendor/store-settings");
              setOpen?.(false);
            }}
            className="gap-2 cursor-pointer"
          >
            <User className="h-4 w-4" />
            My Account
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              navigate("/vendor/payout-settings");
              setOpen?.(false);
            }}
            className="gap-2 cursor-pointer"
          >
            <Wallet className="h-4 w-4" />
            Payout Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Sidebar Content ────────────────────────────────────────────────────────

function SidebarContent({ setOpen }) {
  const navigate = useNavigate();
  const { unreadCount } = useSelector((s) => s.vendorNotification);

  return (
    <div className="flex flex-col h-full py-4">
      {/* Logo */}
      <div
        onClick={() => { navigate("/vendor/dashboard"); setOpen?.(false); }}
        className="flex items-center gap-3 px-3 mb-6 cursor-pointer group"
      >
        <div className="h-9 w-9 rounded-xl  flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
          <img src={vendorIcon} alt="" />
         
        </div>
        <div>
          <h1 className="text-base font-extrabold leading-tight tracking-tight">
           Dilmart
          </h1>
          <p className="text-[10px] text-muted-foreground">Seller Dashboard</p>
        </div>
      </div>

      {/* Section label */}
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
        Main Menu
      </p>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            setOpen={setOpen}
            badge={item.id === "notifications" ? unreadCount : 0}
          />
        ))}
      </nav>

      {/* Profile footer */}
      <ProfileFooter setOpen={setOpen} />
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────

function VendorSideBar({ open, setOpen }) {
  return (
    <Fragment>
      {/* Mobile sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 px-3">
          <SheetHeader className="sr-only">
            <SheetTitle>Vendor Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent setOpen={setOpen} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-background px-3 flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <SidebarContent />
      </aside>
    </Fragment>
  );
}

export default VendorSideBar;
