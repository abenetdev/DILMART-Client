import {
  HousePlug, LogOut, Menu, ShoppingCart,
  UserCog, LogIn, UserPlus, Package,
  Store, Search, X, Heart,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import { shoppingViewHeaderMenuItems } from "@/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { logoutUser } from "@/store/auth-slice";
import { useEffect, useRef, useState } from "react";
import { fetchCartItems } from "@/store/shop/cart-slice";
import { fetchWishlist } from "@/store/shop/wishlist-slice";
import { Label } from "../ui/label";
import { getSearchResults, resetSearchResults } from "@/store/shop/search-slice";

function getCartUserId(user, isAuthenticated) {
  return isAuthenticated && user?.id ? user.id : null;
}

// ── Search bar ────────────────────────────────────────────────────────────

function HeaderSearchBar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const dispatch   = useDispatch();
  const inputRef   = useRef(null);
  const debounceRef = useRef(null);

  const initialKeyword =
    location.pathname === "/search"
      ? new URLSearchParams(location.search).get("keyword") || ""
      : "";

  const [value, setValue] = useState(initialKeyword);

  useEffect(() => {
    if (location.pathname === "/search") {
      const kw = new URLSearchParams(location.search).get("keyword") || "";
      setValue(kw);
    }
  }, [location.search, location.pathname]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (value.trim().length === 0) {
      dispatch(resetSearchResults());
      if (location.pathname === "/search") {
        navigate("/search", { replace: true });
      }
      return;
    }
    debounceRef.current = setTimeout(() => {
      navigate(
        `/search?keyword=${encodeURIComponent(value.trim())}`,
        { replace: location.pathname === "/search" }
      );
      dispatch(getSearchResults(value.trim()));
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    clearTimeout(debounceRef.current);
    navigate(`/search?keyword=${encodeURIComponent(value.trim())}`);
    dispatch(getSearchResults(value.trim()));
    inputRef.current?.blur();
  }

  function handleClear() {
    setValue("");
    dispatch(resetSearchResults());
    if (location.pathname === "/search") {
      navigate("/search", { replace: true });
    }
    inputRef.current?.focus();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-2xl items-center rounded-full border-2 border-primary bg-background overflow-hidden shadow-sm focus-within:shadow-md transition-shadow"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search for anything..."
        className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground min-w-0"
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center justify-center px-2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <button
        type="submit"
        className="flex items-center justify-center gap-1.5 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}

// ── Nav menu items ────────────────────────────────────────────────────────

function MenuItems({ onNavigate }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [, setSearchParams] = useSearchParams();

  function handleNavigate(menuItem) {
    sessionStorage.removeItem("filters");
    const currentFilter =
      menuItem.id !== "home" &&
      menuItem.id !== "products" &&
      menuItem.id !== "search"
        ? { category: [menuItem.id] }
        : null;

    sessionStorage.setItem("filters", JSON.stringify(currentFilter));

    location.pathname.includes("listing") && currentFilter !== null
      ? setSearchParams(new URLSearchParams(`?category=${menuItem.id}`))
      : navigate(menuItem.path);

    onNavigate?.();
  }

  return (
    <nav className="flex flex-col mb-3 lg:mb-0 lg:items-center gap-6 lg:flex-row">
      {shoppingViewHeaderMenuItems.map((menuItem) => (
        <Label
          key={menuItem.id}
          onClick={() => handleNavigate(menuItem)}
          className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
        >
          {menuItem.label}
        </Label>
      ))}
    </nav>
  );
}

// ── Wishlist button — only visible when authenticated ─────────────────────

function WishlistButton({ onClick }) {
  const { count }           = useSelector((s) => s.shopWishlist);
  const { isAuthenticated } = useSelector((s) => s.auth);

  if (!isAuthenticated) return null;

  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="icon"
      className="relative shrink-0"
      aria-label="Wishlist"
    >
      <Heart className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
          {count}
        </span>
      )}
      <span className="sr-only">Wishlist</span>
    </Button>
  );
}

// ── Cart button (shared, used in both top-bar and desktop right section) ──

function CartButton({ onClick }) {
  const { cartItems } = useSelector((s) => s.shopCart);
  const cartCount     = cartItems?.items?.length || 0;

  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="icon"
      className="relative shrink-0"
    >
      <ShoppingCart className="w-5 h-5" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
          {cartCount}
        </span>
      )}
      <span className="sr-only">Cart</span>
    </Button>
  );
}

// ── Account / auth controls (shown inside drawer on mobile, top-bar on desktop) ──

function AccountControls({ onAction }) {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function handleLogout() {
    dispatch(logoutUser());
    onAction?.();
  }

  function go(path) {
    navigate(path);
    onAction?.();
  }

  if (isAuthenticated && user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer bg-primary h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
              {user.userName?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">{user.userName}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => go("/account")}>
            <UserCog className="mr-2 h-4 w-4" />
            My Account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => go("/account")}>
            <Package className="mr-2 h-4 w-4" />
            My Orders
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => go("/auth/login")} className="gap-1.5">
        <LogIn className="h-4 w-4" />
        Login
      </Button>
      <Button size="sm" onClick={() => go("/auth/register")} className="gap-1.5">
        <UserPlus className="h-4 w-4" />
        Register
      </Button>
      <Button size="sm" onClick={() => go("/become-seller")} className="gap-1.5 bg-green-600">
        <Store className="h-4 w-4" />
        Become Seller
      </Button>
    </div>
  );
}

// ── Main header ────────────────────────────────────────────────────────────

function ShoppingHeader() {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const navigate   = useNavigate();
  const dispatch   = useDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch cart and wishlist on mount / auth change
  useEffect(() => {
    const cartUserId = getCartUserId(user, isAuthenticated);
    dispatch(fetchCartItems(cartUserId));
    if (isAuthenticated && user?.id) {
      dispatch(fetchWishlist(user.id));
    }
  }, [dispatch, isAuthenticated, user?.id]);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">

      {/* ── Main row ── */}
      <div className="flex h-14 lg:h-16 items-center gap-2 px-3 md:px-6">

        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-1.5">
          <HousePlug className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
          <span className="hidden sm:inline font-bold text-base lg:text-lg">MarketPlace</span>
        </Link>

        {/* Search — fills remaining space */}
        <div className="flex flex-1 min-w-0 justify-center px-1">
          <HeaderSearchBar />
        </div>

        {/* ── Mobile-only: wishlist + cart + hamburger ── */}
        <div className="flex items-center gap-2 lg:hidden">
          <WishlistButton onClick={() => navigate("/account/wishlist")} />
          <CartButton onClick={() => navigate("/cart")} />

          {/* Hamburger — account & nav only */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="mt-6">
                <MenuItems onNavigate={closeMobile} />
              </div>
              <div className="mt-6 border-t pt-6">
                {/* No cart here on mobile — it's in the header */}
                <AccountControls onAction={closeMobile} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* ── Desktop-only: wishlist + cart + account ── */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <WishlistButton onClick={() => navigate("/account/wishlist")} />
          <CartButton onClick={() => navigate("/cart")} />
          <AccountControls />
        </div>
      </div>

      {/* ── Desktop category nav row ── */}
      <div className="hidden lg:flex h-10 items-center border-t px-4 md:px-6 bg-muted/30">
        <MenuItems />
      </div>
    </header>
  );
}

export default ShoppingHeader;
