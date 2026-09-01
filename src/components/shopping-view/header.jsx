import {
  ShoppingCart,
  LogIn, UserPlus,
  Store, Search, X, Heart, Package,
} from "lucide-react";
import logo from "@/assets/logo.png";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useEffect, useRef, useState } from "react";
import { fetchCartItems } from "@/store/shop/cart-slice";
import { fetchWishlist } from "@/store/shop/wishlist-slice";
import { getSearchResults } from "@/store/shop/search-slice";
import { fetchAllActiveCategories } from "@/store/shop/category-slice";

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
    // If input is cleared, do nothing — keep existing results visible
    if (value.trim().length === 0) return;
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
    // Don't reset results or navigate — keep last search results visible
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

// ── Category nav (dynamic, horizontally scrollable) ──────────────────────
// Used in both the desktop nav row and the mobile strip below the search bar.

function CategoryNav({ onNavigate }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [, setSearchParams] = useSearchParams();
  const { all: categories } = useSelector((s) => s.shopCategory);

  function handleCategoryClick(cat) {
    sessionStorage.setItem("filters", JSON.stringify({ category: [cat.slug] }));

    if (location.pathname.includes("listing")) {
      setSearchParams(new URLSearchParams(`?category=${cat.slug}`));
    } else {
      navigate(`/listing?category=${cat.slug}`);
    }
    onNavigate?.();
  }

  function handleHomeClick() {
    sessionStorage.removeItem("filters");
    sessionStorage.setItem("filters", JSON.stringify(null));
    navigate("/");
    onNavigate?.();
  }

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
    >
      {/* Static "Home" link */}
      <button
        onClick={handleHomeClick}
        className={`
          flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap
          transition-colors
          ${location.pathname === "/"
            ? "text-primary bg-primary/10"
            : "text-foreground/70 hover:text-primary hover:bg-primary/5"
          }
        `}
      >
        Home
      </button>

      {/* Dynamic categories from backend */}
      {categories.map((cat) => (
        <button
          key={cat._id}
          onClick={() => handleCategoryClick(cat)}
          className="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors text-foreground/70 hover:text-primary hover:bg-primary/5"
        >
          {cat.name}
        </button>
      ))}
    </div>
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

// ── Account / auth controls ───────────────────────────────────────────────

function AccountControls({ onAction }) {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  function go(path) {
    navigate(path);
    onAction?.();
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => go("/become-seller")}
          className="gap-1 bg-green-600 hover:bg-green-700 text-xs px-2.5 py-1 h-8"
        >
          <Store className="h-3.5 w-3.5" />
          Become Seller
        </Button>
        <Avatar
          className="cursor-pointer bg-primary h-9 w-9 hover:ring-2 hover:ring-primary/40 transition-all"
          onClick={() => go("/account")}
          role="button"
          aria-label="My account"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && go("/account")}
        >
          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
            {user.userName?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => go("/auth/login")} className="gap-1.5">
        <LogIn className="h-4 w-4" />
        Login
      </Button>
      <Button size="sm" onClick={() => go("/auth/register")} className="gap-1.5">
        <UserPlus className="h-4 w-4" />
        Register
      </Button>
      <Button
        size="sm"
        onClick={() => go("/become-seller")}
        className="gap-1 bg-green-600 hover:bg-green-700 text-xs px-2.5 py-1 h-8"
      >
        <Store className="h-3.5 w-3.5" />
        Sell
      </Button>
    </div>
  );
}

// ── Main header ────────────────────────────────────────────────────────────

function ShoppingHeader() {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const navigate   = useNavigate();
  const dispatch   = useDispatch();

  // Fetch categories + cart + wishlist on mount / auth change
  useEffect(() => {
    dispatch(fetchAllActiveCategories());
  }, [dispatch]);

  useEffect(() => {
    const cartUserId = getCartUserId(user, isAuthenticated);
    dispatch(fetchCartItems(cartUserId));
    if (isAuthenticated && user?.id) {
      dispatch(fetchWishlist(user.id));
    }
  }, [dispatch, isAuthenticated, user?.id]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">

      {/* ── Mobile header: logo + search only ── */}
      <div className="flex lg:hidden h-14 items-center gap-2 px-3">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center mr-1">
          <img src={logo} alt="DilMart" className="h-8 w-auto object-contain" />
        </Link>

        {/* Search bar fills remaining width */}
        <div className="flex flex-1 min-w-0">
          <HeaderSearchBar />
        </div>
      </div>

      {/* ── Mobile category strip (below search bar) ── */}
      <div className="lg:hidden border-t bg-muted/30 px-3 py-1 overflow-hidden">
        <CategoryNav />
      </div>

      {/* ── Desktop header: logo + search + actions ── */}
      <div className="hidden lg:flex h-16 items-center gap-2 px-6">
        <Link to="/" className="flex shrink-0 items-center">
          <img src={logo} alt="DilMart" className="h-9 w-auto object-contain" />
        </Link>

        <div className="flex flex-1 min-w-0 justify-center px-4">
          <HeaderSearchBar />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <WishlistButton onClick={() => navigate("/wishlist")} />
          <CartButton onClick={() => navigate("/cart")} />
          {isAuthenticated && (
            <Button
              variant="outline"
              size="icon"
              className="relative shrink-0"
              onClick={() => navigate("/orders")}
              aria-label="My orders"
            >
              <Package className="w-5 h-5" />
              <span className="sr-only">Orders</span>
            </Button>
          )}
          <AccountControls />
        </div>
      </div>

      {/* ── Desktop category nav row ── */}
      <div className="hidden lg:block border-t bg-muted/30 px-6 py-0 h-10 overflow-hidden">
        <div className="h-full flex items-center">
          <CategoryNav />
        </div>
      </div>
    </header>
  );
}

export default ShoppingHeader;
