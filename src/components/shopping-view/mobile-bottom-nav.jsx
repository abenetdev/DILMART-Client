import { Home, ShoppingCart, Heart, User, UserCog, Package, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { logoutUser } from "@/store/auth-slice";

// ── Account popup (anchored above the Account tab) ────────────────────────

function AccountPopup({ onClose, anchorRef }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector((s) => s.auth);
  const popupRef  = useRef(null);

  // Close on outside tap
  useEffect(() => {
    function handlePointerDown(e) {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose, anchorRef]);

  function go(path) {
    onClose();
    navigate(path);
  }

  function handleLogout() {
    onClose();
    // logoutUser.pending clears auth state synchronously — UI updates immediately
    dispatch(logoutUser());
    navigate("/", { replace: true });
  }

  const initial = user?.userName?.[0]?.toUpperCase() || "U";

  return (
    // Positioned above the bottom nav (bottom: 100% + 8px gap)
    <div
      ref={popupRef}
      role="dialog"
      aria-label="Account menu"
      className="
        absolute bottom-[calc(100%+8px)] right-0
        w-44 h-25 rounded-2xl bg-background border border-border
        shadow-[0_8px_32px_rgba(0,0,0,0.18)]
        overflow-hidden
        animate-in fade-in slide-in-from-bottom-2 duration-150
      "
    >

      {/* Menu items */}
      <div className="py-2">
        <button
          onClick={() => go("/account/settings")}
          className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
        >
          <UserCog className="h-4 w-4 text-muted-foreground shrink-0" />
          My Account
        </button>

        <button
          onClick={() => go("/account/orders")}
          className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
        >
          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
          My Orders
        </button>

        <div className="mx-4 my-1 border-t border-border" />

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}

// ── Main bottom nav ────────────────────────────────────────────────────────

function MobileBottomNav() {
  const location  = useLocation();
  const { cartItems }               = useSelector((s) => s.shopCart);
  const { count: wishlistCount }    = useSelector((s) => s.shopWishlist);
  const { isAuthenticated, user }   = useSelector((s) => s.auth);

  const [popupOpen, setPopupOpen] = useState(false);
  const accountTabRef = useRef(null);

  const cartCount = cartItems?.items?.length || 0;
  const pathname  = location.pathname;

  // Close popup on route change
  useEffect(() => { setPopupOpen(false); }, [pathname]);

  function isActive(path) {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  }

  // The first 3 tabs are always plain links
  const linkItems = [
    {
      label: "Home",
      icon:  Home,
      path:  "/",
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
      path:  "/account/wishlist",
      badge: isAuthenticated && wishlistCount > 0 ? wishlistCount : null,
      badgeClass: "bg-red-500 text-white",
    },
  ];

  const accountActive =
    // On any /account sub-route EXCEPT /account/wishlist (which has its own tab)
    (pathname.startsWith("/account") && !pathname.startsWith("/account/wishlist")) ||
    pathname.startsWith("/auth/login");
  const initial = user?.userName?.[0]?.toUpperCase() || "U";

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.08)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch h-16">

        {/* ── Home, Cart, Wishlist ── */}
        {linkItems.map((item) => {
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
                  className={`w-6 h-6 transition-transform duration-150 ${active ? "scale-110" : ""}`}
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

        {/* ── Account tab (4th item) ── */}
        <div className="relative flex flex-1 items-stretch">

          {isAuthenticated ? (
            // Authenticated: circular avatar button → opens popup
            <button
              ref={accountTabRef}
              onClick={() => setPopupOpen((o) => !o)}
              className={`
                relative flex flex-1 flex-col items-center justify-center gap-0.5
                min-w-0 touch-manipulation select-none transition-colors duration-150
                ${accountActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              `}
              aria-label="Account menu"
              aria-haspopup="dialog"
              aria-expanded={popupOpen}
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
            </button>
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
                className={`w-6 h-6 transition-transform duration-150 ${isActive("/auth/login") ? "scale-110" : ""}`}
                strokeWidth={isActive("/auth/login") ? 2.5 : 1.75}
              />
              <span className={`text-[10px] font-medium leading-none ${isActive("/auth/login") ? "font-semibold" : ""}`}>
                Account
              </span>
            </Link>
          )}

          {/* Popup — rendered inside the relative wrapper so it stays anchored */}
          {popupOpen && (
            <AccountPopup
              onClose={() => setPopupOpen(false)}
              anchorRef={accountTabRef}
            />
          )}
        </div>

      </div>

      {/* iOS safe area */}
      <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} className="bg-background" />
    </nav>
  );
}

export default MobileBottomNav;
