import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuthLayout from "./components/auth/layout";
import AuthLogin from "./pages/auth/login";
import AuthRegister from "./pages/auth/register";
import VerifyOtp from "./pages/auth/verify-otp";
import AdminLayout from "./components/admin-view/layout";
import AdminLogin from "./pages/admin-view/login";
import AdminDashboard from "./pages/admin-view/dashboard";
import AdminVendors from "./pages/admin-view/vendors";
import AdminOrders from "./pages/admin-view/orders";
import AdminWithdrawals from "./pages/admin-view/withdrawals";
import AdminSellerApplications from "./pages/admin-view/seller-applications";
import AdminCustomers from "./pages/admin-view/customers";
import AdminProducts from "./pages/admin-view/products";
import AdminProfile from "./pages/admin-view/profile";
import VendorLayout from "./components/vendor-view/layout";
import VendorDashboard from "./pages/vendor-view/dashboard";
import VendorProducts from "./pages/vendor-view/products";
import VendorOrders from "./pages/vendor-view/orders";
import VendorOrderDetails from "./pages/vendor-view/order-details";
import VendorFeatures from "./pages/vendor-view/features";
import VendorStoreSettings from "./pages/vendor-view/store-settings";
import VendorWallet from "./pages/vendor-view/wallet";
import VendorPayoutSettings from "./pages/vendor-view/payout-settings";
import VendorProfile from "./pages/vendor-view/profile";
import VendorNotifications from "./pages/vendor-view/notifications";
import ShoppingLayout from "./components/shopping-view/layout";
import NotFound from "./pages/not-found";
import ShoppingHome from "./pages/shopping-view/home";
import ShoppingListing from "./pages/shopping-view/listing";
import ProductDetailPage from "./pages/shopping-view/productDetail";
import ShoppingCheckout from "./pages/shopping-view/checkout";
import ShoppingAccount from "./pages/shopping-view/account";
import AccountOverviewPage from "./pages/shopping-view/account-overview";
import AccountOrdersPage from "./pages/shopping-view/account-orders";
import AccountWishlistPage from "./pages/shopping-view/account-wishlist";
import AccountCartPage from "./pages/shopping-view/account-cart";
import AccountSettingsPage from "./pages/shopping-view/account-settings";
import CheckAuth from "./components/common/check-auth";
import ScrollToTop from "./components/common/scroll-to-top";
import UnauthPage from "./pages/unauth-page";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { checkAuth } from "./store/auth-slice";
import { loadGuestCartToStore } from "./store/shop/cart-slice";
import { Skeleton } from "@/components/ui/skeleton";
import PaymentSuccessPage from "./pages/shopping-view/payment-success";
import CartPage from "./pages/shopping-view/cart";
import AllStoresPage from "./pages/shopping-view/all-stores";
import SearchProducts from "./pages/shopping-view/search";
import ChapaReturnPage from "./pages/shopping-view/chapa-return";
import StoreFront from "./pages/shopping-view/store";
import ShoppingHeader from "./components/shopping-view/header";
import Footer from "./components/common/footer";
import SuperDealsPage from "./pages/shopping-view/super-deals";
import BecomeASeller from "./pages/become-seller/becomeSeller";
import { SocketProvider } from "./context/SocketContext";

function App() {
  const { user, isAuthenticated, isLoading } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();
const location = useLocation();

  const hideHeaderRoutes = [
    "/auth",
    "/admin",
    "/vendor",
  ];

  const shouldHideHeader = hideHeaderRoutes.some((path) =>
    location.pathname.startsWith(path)
  );
  useEffect(() => {
    dispatch(checkAuth());
    // Seed guest cart from localStorage into Redux on every app start
    dispatch(loadGuestCartToStore());
  }, [dispatch]);

  if (isLoading) return <Skeleton className="w-[800] bg-black h-[600px]" />;

  console.log(isLoading, user);

  return (
   <div className="flex flex-col overflow-hidden bg-white">
      <ScrollToTop />
      {/* HEADER — hidden on auth / admin / vendor pages */}
      {!shouldHideHeader && <ShoppingHeader />}

      <SocketProvider>

      <Routes>
        <Route path="/" element={<Navigate to="/shop/home" replace />} />

        <Route
          path="/auth"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <AuthLayout />
            </CheckAuth>
          }
        >
          <Route path="login" element={<AuthLogin />} />
          <Route path="register" element={<AuthRegister />} />
          <Route path="verify-otp" element={<VerifyOtp />} />
        </Route>

        {/* ── Admin auth (standalone, no layout) ── */}
        <Route path="/admin/auth/login" element={
          <CheckAuth isAuthenticated={isAuthenticated} user={user}>
            <AdminLogin />
          </CheckAuth>
        } />

        <Route
          path="/admin"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <AdminLayout />
            </CheckAuth>
          }
        >
          <Route path="dashboard"    element={<AdminDashboard />} />
          <Route path="vendors"      element={<AdminVendors />} />
          <Route path="products"     element={<AdminProducts />} />
          <Route path="orders"       element={<AdminOrders />} />
          <Route path="withdrawals"  element={<AdminWithdrawals />} />
          <Route path="customers"    element={<AdminCustomers />} />
          <Route path="seller-applications" element={<AdminSellerApplications />} />
          <Route path="profile"     element={<AdminProfile />} />
        </Route>

        <Route
          path="/vendor"
          element={
            <CheckAuth isAuthenticated={isAuthenticated} user={user}>
              <VendorLayout />
            </CheckAuth>
          }
        >
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="products" element={<VendorProducts />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="orders/:orderId" element={<VendorOrderDetails />} />
          <Route path="wallet" element={<VendorWallet />} />
          <Route path="payout-settings" element={<VendorPayoutSettings />} />
          <Route path="features" element={<VendorFeatures />} />
          <Route path="store-settings" element={<VendorStoreSettings />} />
          <Route path="profile" element={<VendorProfile />} />
          <Route path="notifications" element={<VendorNotifications />} />
        </Route>

        <Route path="/shop" element={<ShoppingLayout />}>
          <Route path="home" element={<ShoppingHome />} />
          <Route path="listing" element={<ShoppingListing />} />
          <Route path="become-seller" element={<BecomeASeller />} />
          <Route path="product/:productId" element={<ProductDetailPage />} />
          <Route
            path="checkout"
            element={
              isAuthenticated
                ? <ShoppingCheckout />
                : <Navigate to="/auth/login?redirect=/shop/checkout" replace />
            }
          />
          <Route path="account" element={<ShoppingAccount />}>
            <Route index element={<AccountOverviewPage />} />
            <Route path="orders" element={<AccountOrdersPage />} />
            <Route path="wishlist" element={<AccountWishlistPage />} />
            <Route path="cart" element={<AccountCartPage />} />
            <Route path="settings" element={<AccountSettingsPage />} />
          </Route>
          <Route path="payment-success" element={<PaymentSuccessPage />} />
          <Route path="chapa-return" element={<ChapaReturnPage />} />
          <Route path="paypal-cancel" element={<PaymentSuccessPage />} />
          <Route path="search" element={<SearchProducts />} />
          <Route path="cart"    element={<CartPage />} />
          <Route path="stores"  element={<AllStoresPage />} />
          <Route path="super-deals" element={<SuperDealsPage />} />
        </Route>

        <Route path="/unauth-page" element={<UnauthPage />} />
        <Route path="/store/:slug" element={<StoreFront />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      </SocketProvider>

      {/* FOOTER — hidden on auth / admin / vendor pages */}
      {!shouldHideHeader && <Footer />}
    </div>
  );
}

export default App;
