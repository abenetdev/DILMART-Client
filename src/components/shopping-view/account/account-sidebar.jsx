import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard, Package, Heart, ShoppingCart,
  Settings, LogOut, ChevronRight, Store, Clock,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/store/auth-slice";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/shop/account", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/shop/account/orders", label: "Orders", icon: Package },
  { to: "/shop/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/shop/account/cart", label: "Cart", icon: ShoppingCart },
  { to: "/shop/account/settings", label: "Settings", icon: Settings },
];

function AccountSidebar({ onNavigate }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user }  = useSelector((state) => state.auth);
  const { sellerStatus } = useSelector((state) => state.shopSeller);
  const { count: wishlistCount } = useSelector((state) => state.shopWishlist);
  const { cartItems } = useSelector((state) => state.shopCart);

  const cartCount = cartItems?.items?.length || 0;

  const badgeFor = (to) => {
    if (to.includes("wishlist") && wishlistCount > 0) return wishlistCount;
    if (to.includes("cart") && cartCount > 0) return cartCount;
    return null;
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/auth/login");
  };

  return (
    <aside className="flex flex-col h-full">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-white/20">
            <AvatarFallback className="bg-white/10 text-white text-xl font-bold">
              {user?.userName?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-lg truncate">{user?.userName}</p>
            <p className="text-sm text-slate-300 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex flex-col gap-1 flex-1">
        {navItems.map(({ to, label, icon: Icon, end }) => {
          const badge = badgeFor(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {label}
              </span>
              {badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-bold">
                  {badge}
                </span>
              ) : (
                <ChevronRight className="h-4 w-4 opacity-40" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <Button
        variant="outline"
        className="mt-6 w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>

      {/* ── Become a Seller CTA ─────────────────────── */}
      {user?.role === "user" && !sellerStatus && (
        <Button
          className="mt-3 w-full gap-2 bg-slate-900 hover:bg-slate-800 text-white"
          onClick={() => { navigate("/shop/become-seller"); onNavigate?.(); }}
        >
          <Store className="h-4 w-4" />
          Become a Seller
        </Button>
      )}

      {user?.role === "user" && sellerStatus === "pending" && (
        <div className="mt-3 flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          Application under review
        </div>
      )}
    </aside>
  );
}

export default AccountSidebar;
