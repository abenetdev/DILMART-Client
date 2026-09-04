import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import AuthLayout from "./components/auth/layout";
import AuthLogin from "./pages/auth/login";
import AuthRegister from "./pages/auth/register";
import VerifyOtp from "./pages/auth/verify-otp";
import ForgotPassword from "./pages/auth/forgot-password";
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
import AdminCategories from "./pages/admin-view/categories";
import AdminBrands from "./pages/admin-view/brands";
import AdminBanners from "./pages/admin-view/banners";
import AdminSettings from "./pages/admin-view/settings";
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
import AccountOrdersPage from "./pages/shopping-view/account-orders";
import AccountWishlistPage from "./pages/shopping-view/account-wishlist";
import AccountCartPage from "./pages/shopping-view/account-cart";
import AccountSettingsPage from "./pages/shopping-view/account-settings";
import AccountOverviewPage from "./pages/shopping-view/account-overview";
import CheckAuth from "./components/common/check-auth";
import ScrollToTop from "./components/common/scroll-to-top";
import UnauthPage from "./pages/unauth-page";
import OfflineBanner from "./components/common/offline-banner";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { checkAuth, clearAuth } from "./store/auth-slice";
import { loadGuestCartToStore } from "./store/shop/cart-slice";
import PaymentSuccessPage from "./pages/shopping-view/payment-success";
import CartPage from "./pages/shopping-view/cart";
import AllStoresPage from "./pages/shopping-view/all-stores";
import SearchProducts from "./pages/shopping-view/search";
import ChapaReturnPage from "./pages/shopping-view/chapa-return";
import StoreFront from "./pages/shopping-view/store";
import AllCategoriesPage from "./pages/shopping-view/all-categories";
import ShoppingHeader from "./components/shopping-view/header";
import Footer from "./components/common/footer";
import MobileBottomNav from "./components/shopping-view/mobile-bottom-nav";
import SuperDealsPage from "./pages/shopping-view/super-deals";
import PrivacyPolicyPage from "./pages/privacy-policy";
import RefundPolicyPage from "./pages/refund-policy";
import TermsPage from "./pages/terms";
import BecomeASeller from "./pages/become-seller/becomeSeller";
import { SocketProvider } from "./context/SocketContext";

// ── Pre-launch ────────────────────────────────────────────────────────────
import LaunchGuard from "./components/common/LaunchGuard";
import { IS_LAUNCHED } from "./config/launch";

// Legacy /shop/* redirect helpers
function ProductRedirect() {
  const { productId } = useParams();
  return <Navigate to={`/product/${productId}`} replace />;
}
function AccountRedirect() {
  const { "*": rest } = useParams();
  return <Navigate to={`/account${rest ? `/${rest}` : ""}`} replace />;
}

function App() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  const hideHeaderRoutes = ["/auth", "/admin", "/vendor"];
  const shouldHideHeader = hideHeaderRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  // Hide the global header/footer/nav entirely during pre-launch
  const isComingSoonPage = !IS_LAUNCHED;

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const isProduction = import.meta.env.PROD;

    if (!isProduction || storedToken) {
      dispatch(checkAuth());
    } else {
      dispatch(clearAuth());
    }

    dispatch(loadGuestCartToStore());
  }, [dispatch]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <ScrollToTop />
      {/* Global offline indicator — always mounted, shows only when needed */}
      <OfflineBanner />

      {/* HEADER — hidden on auth/admin/vendor pages AND the ComingSoon page */}
      {!shouldHideHeader && !isComingSoonPage && <ShoppingHeader />}

      <SocketProvider>
        <Routes>

          {/* ── Auth routes — always accessible (vendors/admins need login) ── */}
          <Route
            path="/auth"
            element={
              <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                <AuthLayout />
              </CheckAuth>
            }
          >
            <Route path="login"           element={<AuthLogin />} />
            <Route path="register"        element={<AuthRegister />} />
            <Route path="verify-otp"      element={<VerifyOtp />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* ── Admin auth (standalone, no layout) — always accessible ────── */}
          <Route
            path="/admin/auth/login"
            element={
              <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                <AdminLogin />
              </CheckAuth>
            }
          />

          {/* ── Admin routes — protected by CheckAuth (admin role required) ── */}
          <Route
            path="/admin"
            element={
              <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                <AdminLayout />
              </CheckAuth>
            }
          >
            <Route path="dashboard"            element={<AdminDashboard />} />
            <Route path="vendors"              element={<AdminVendors />} />
            <Route path="products"             element={<AdminProducts />} />
            <Route path="orders"               element={<AdminOrders />} />
            <Route path="withdrawals"          element={<AdminWithdrawals />} />
            <Route path="customers"            element={<AdminCustomers />} />
            <Route path="seller-applications"  element={<AdminSellerApplications />} />
            <Route path="categories"           element={<AdminCategories />} />
            <Route path="brands"               element={<AdminBrands />} />
            <Route path="banners"              element={<AdminBanners />} />
            <Route path="settings"             element={<AdminSettings />} />
            <Route path="profile"              element={<AdminProfile />} />
          </Route>

          {/* ── Vendor routes — protected by CheckAuth (vendor role required) */}
          <Route
            path="/vendor"
            element={
              <CheckAuth isAuthenticated={isAuthenticated} user={user}>
                <VendorLayout />
              </CheckAuth>
            }
          >
            <Route path="dashboard"      element={<VendorDashboard />} />
            <Route path="products"       element={<VendorProducts />} />
            <Route path="orders"         element={<VendorOrders />} />
            <Route path="orders/:orderId" element={<VendorOrderDetails />} />
            <Route path="wallet"         element={<VendorWallet />} />
            <Route path="payout-settings" element={<VendorPayoutSettings />} />
            <Route path="features"       element={<VendorFeatures />} />
            <Route path="store-settings" element={<VendorStoreSettings />} />
            <Route path="profile"        element={<VendorProfile />} />
            <Route path="notifications"  element={<VendorNotifications />} />
          </Route>

          {/* ── Public shopping routes — guarded during pre-launch ─────────
               LaunchGuard redirects every path except "/" to "/"
               when IS_LAUNCHED is false. When IS_LAUNCHED is true it is
               a transparent no-op and everything works as before.
          ──────────────────────────────────────────────────────────────── */}
          <Route
            path="/"
            element={
              <LaunchGuard>
                <ShoppingLayout />
              </LaunchGuard>
            }
          >
            <Route index element={<ShoppingHome />} />
            <Route path="listing"       element={<ShoppingListing />} />
            <Route path="become-seller" element={<BecomeASeller />} />
            <Route path="product/:productId" element={<ProductDetailPage />} />
            <Route
              path="checkout"
              element={
                isAuthenticated
                  ? <ShoppingCheckout />
                  : <Navigate to="/auth/login?redirect=/checkout" replace />
              }
            />
            <Route
              path="orders"
              element={
                isAuthenticated
                  ? <AccountOrdersPage />
                  : <Navigate to="/auth/login?redirect=/orders" replace />
              }
            />
            <Route path="account" element={<ShoppingAccount />}>
              <Route index element={<AccountOverviewPage />} />
              <Route path="wishlist"        element={<Navigate to="/wishlist" replace />} />
              <Route path="cart"            element={<AccountCartPage />} />
              <Route path="settings"        element={<AccountOverviewPage />} />
              <Route path="update-profile"  element={<AccountSettingsPage />} />
            </Route>
            <Route path="payment-success" element={<PaymentSuccessPage />} />
            <Route path="chapa-return"    element={<ChapaReturnPage />} />
            <Route path="paypal-cancel"   element={<PaymentSuccessPage />} />
            <Route path="search"          element={<SearchProducts />} />
            <Route path="cart"            element={<CartPage />} />
            <Route
              path="wishlist"
              element={
                isAuthenticated
                  ? <AccountWishlistPage />
                  : <Navigate to="/auth/login?redirect=/wishlist" replace />
              }
            />
            <Route path="stores"      element={<AllStoresPage />} />
            <Route path="categories"  element={<AllCategoriesPage />} />
            <Route path="super-deals" element={<SuperDealsPage />} />
          </Route>

          {/* ── Misc public pages — also guarded ───────────────────────── */}
          <Route
            path="/unauth-page"
            element={
              <LaunchGuard>
                <UnauthPage />
              </LaunchGuard>
            }
          />
          <Route
            path="/store/:slug"
            element={
              <LaunchGuard>
                <StoreFront />
              </LaunchGuard>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <LaunchGuard>
                <PrivacyPolicyPage />
              </LaunchGuard>
            }
          />
          <Route
            path="/refund-policy"
            element={
              <LaunchGuard>
                <RefundPolicyPage />
              </LaunchGuard>
            }
          />
          <Route
            path="/terms"
            element={
              <LaunchGuard>
                <TermsPage />
              </LaunchGuard>
            }
          />

          {/* 404 — always visible */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </SocketProvider>

      {/* FOOTER — hidden on auth/admin/vendor pages AND the ComingSoon page */}
      {!shouldHideHeader && !isComingSoonPage && <Footer />}

      {/* MOBILE BOTTOM NAV — same hiding logic */}
      {!shouldHideHeader && !isComingSoonPage && <MobileBottomNav />}
    </div>
  );
}

export default App;
