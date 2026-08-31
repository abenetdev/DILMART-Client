import { Home, ShoppingCart, Heart, User, Package } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// ── Main bottom nav ────────────────────────────────────────────────────────

function MobileBottomNav() {
  const location  = useLocation();
  const { cartItems }               = useSelector((s) => s.shopCart);
  const { count: wishlistCount }    = useSelector((s) => s.shopWishlist);
  const { isAuthenticated, user }   = useSelector((s) => s.auth);

  const cartCount = cartItems?.items?.length || 0;
  const pathname  = location.pathname;

  function isActive(path) {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  }

  // Navigation items
  const navItems = [
    {
      label: "Home",
      icon:  Home,
      path:  "/",
      badge: null,
      badgeClass: "",
    },
    {
      label: "Orders",
      icon:  Package,
      path:  "/orders",
      badge: null,
      badgeClass: "",
    },
    {
      label: "Cart",
      icon:  ShoppingCart,
      path:  "/cart",
      badge: cartCount > 0 ? cartCount : null,
      badgeClass: "bg-primary text-primary-foreground",
    },
    {
      label: "Wishlist",
      icon:  Heart,
      path:  "/wishlist",
      badge: isAuthenticated && wishlistCount > 0 ? wishlistCount : null,
      badgeClass: "bg-red-500 text-white",
    },
  ];

  const accountActive =
    // On any /account sub-route EXCEPT /wishlist (which has its own tab)
    (pathname.startsWith("/account") && !pathname.startsWith("/wishlist")) ||
    pathname.startsWith("/auth/login");
  const initial = user?.userName?.[0]?.toUpperCase() || "U";

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.08)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch h-16">

        {/* ── Home, Orders, Cart, Wishlist ── */}
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon   = item.icon;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`
                relative flex flex-1 flex-col items-center justify-center gap-0.5
                min-w-0 touch-manipulation select-none transition-colors duration-150
                ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              `}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-primary" />
              )}
              <span className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${active ? "scale-110" : ""}`}
                  strokeWidth={active ? 2.5 : 1.75}
                />
                {item.badge !== null && (
                  <span className={`absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold px-1 leading-none ${item.badgeClass}`}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium leading-none ${active ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* ── Account tab (5th item) ── */}
        {isAuthenticated ? (
          // Authenticated: circular avatar link → goes to /account
          <Link
            to="/account"
            className={`
              relative flex flex-1 flex-col items-center justify-center gap-0.5
              min-w-0 touch-manipulation select-none transition-colors duration-150
              ${accountActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}
            `}
            aria-label="Account"
            aria-current={accountActive ? "page" : undefined}
          >
            {accountActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-primary" />
            )}

            {/* Circular avatar */}
            <span
              className={`
                flex h-7 w-7 items-center justify-center rounded-full
                text-[11px] font-bold text-primary-foreground select-none
                transition-transform duration-150
                ${accountActive ? "bg-primary scale-110 ring-2 ring-primary/30" : "bg-primary/80"}
              `}
            >
              {initial}
            </span>

            <span className={`text-[10px] font-medium leading-none ${accountActive ? "font-semibold" : ""}`}>
              Account
            </span>
          </Link>
        ) : (
          // Unauthenticated: plain link to login with outline User icon
          <Link
            to="/auth/login"
            className={`
              relative flex flex-1 flex-col items-center justify-center gap-0.5
              min-w-0 touch-manipulation select-none transition-colors duration-150
              ${isActive("/auth/login") ? "text-primary" : "text-muted-foreground hover:text-foreground"}
            `}
            aria-label="Login"
          >
            {isActive("/auth/login") && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-primary" />
            )}
            <User
              className={`w-5 h-5 transition-transform duration-150 ${isActive("/auth/login") ? "scale-110" : ""}`}
              strokeWidth={isActive("/auth/login") ? 2.5 : 1.75}
            />
            <span className={`text-[10px] font-medium leading-none ${isActive("/auth/login") ? "font-semibold" : ""}`}>
              Account
            </span>
          </Link>
        )}

      </div>

      {/* iOS safe area */}
      <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} className="bg-background" />
    </nav>
  );
}

export default MobileBottomNav;
