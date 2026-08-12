import { useEffect } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import AccountSidebar from "@/components/shopping-view/account/account-sidebar";
import { fetchWishlist } from "@/store/shop/wishlist-slice";
import { fetchCartItems } from "@/store/shop/cart-slice";
import { getSellerStatus } from "@/store/shop/seller-slice";
import { cn } from "@/lib/utils";

// Horizontal scrollable tab bar for the account sub-sections on mobile
// const accountTabs = [
//   { to: "/account", label: "Overview", end: true },
//   { to: "/account/orders", label: "Orders" },
//   { to: "/account/wishlist", label: "Wishlist" },
//   { to: "/account/settings", label: "Settings" },
// ];

function MobileAccountTabs() {
  return (
    <nav className="lg:hidden mb-5 -mx-4 px-4 overflow-x-auto scrollbar-none" aria-label="Account sections">
      {/* <div className="flex gap-1 w-max pb-1">
        {accountTabs.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </div> */}
    </nav>
  );
}

function ShoppingAccount() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (userId) {
      dispatch(fetchWishlist(userId));
      dispatch(fetchCartItems(userId));
      dispatch(getSellerStatus());
    }
  }, [dispatch, userId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user?.role !== "user" && user?.role !== "vendor") {
    return <Navigate to="/unauth-page" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <AccountSidebar />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile horizontal tab navigation */}
            <MobileAccountTabs />
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingAccount;
