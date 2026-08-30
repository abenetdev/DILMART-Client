import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import AccountSidebar from "@/components/shopping-view/account/account-sidebar";
import { fetchWishlist } from "@/store/shop/wishlist-slice";
import { fetchCartItems } from "@/store/shop/cart-slice";
import { getSellerStatus } from "@/store/shop/seller-slice";

function ShoppingAccount() {
  const dispatch   = useDispatch();
  const location   = useLocation();
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);

  const userId = user?.id || user?._id;

  // Hide the sidebar on the update-profile sub-page — it has its own back button
  const isUpdateProfile = location.pathname.includes("/account/update-profile");

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

          {/* Desktop sidebar — hidden on update-profile sub-page */}
          {!isUpdateProfile && (
            <div className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-24">
                <AccountSidebar />
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>

        </div>
      </div>
    </div>
  );
}

export default ShoppingAccount;
