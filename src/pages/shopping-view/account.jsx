import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Menu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AccountSidebar from "@/components/shopping-view/account/account-sidebar";
import { fetchWishlist } from "@/store/shop/wishlist-slice";
import { fetchCartItems } from "@/store/shop/cart-slice";
import { getSellerStatus } from "@/store/shop/seller-slice";

function ShoppingAccount() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (userId) {
      dispatch(fetchWishlist(userId));
      dispatch(fetchCartItems(userId));
      // Load seller status so sidebar and overview can show the right CTA
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

  // Allow both "user" AND "vendor" — vendors keep customer access
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
            {/* Mobile nav toggle */}
            <div className="lg:hidden mb-6">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Menu className="h-4 w-4" />
                    Account Menu
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-6">
                  <AccountSidebar onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>

            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingAccount;
