import { Navigate, useLocation } from "react-router-dom";

function getHomeRoute(role) {
  if (role === "admin")  return "/admin/dashboard";
  if (role === "vendor") return "/vendor/dashboard";
  return "/shop/home";
}

function CheckAuth({ isAuthenticated, user, children }) {
  const location  = useLocation();
  const homeRoute = getHomeRoute(user?.role);
  const path      = location.pathname;

  // Root → redirect based on auth state
  if (path === "/") {
    return <Navigate to={isAuthenticated ? homeRoute : "/shop/home"} replace />;
  }

  // ── Admin routes ──────────────────────────────────────────────────────────

  // Unauthenticated trying to access /admin/* (except /admin/auth/login)
  if (!isAuthenticated && path.startsWith("/admin") && !path.startsWith("/admin/auth")) {
    return <Navigate to="/admin/auth/login" replace />;
  }

  // Authenticated non-admin trying to reach /admin/*
  if (isAuthenticated && path.startsWith("/admin") && !path.startsWith("/admin/auth")) {
    if (user?.role !== "admin") return <Navigate to="/unauth-page" replace />;
  }

  // Authenticated admin on the admin login page → send to dashboard
  if (isAuthenticated && user?.role === "admin" && path.startsWith("/admin/auth")) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // ── Vendor routes ─────────────────────────────────────────────────────────

  if (!isAuthenticated && path.startsWith("/vendor")) {
    return <Navigate to="/auth/login" replace />;
  }

  if (isAuthenticated && path.startsWith("/vendor") && user?.role !== "vendor") {
    return <Navigate to="/unauth-page" replace />;
  }

  // ── User auth routes (/auth/*) ────────────────────────────────────────────

  const isUserAuthPage =
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/register") ||
    path.startsWith("/auth/verify-otp");

  // Unauthenticated on a protected non-auth, non-admin, non-vendor page
  // (shop routes are open — no redirect needed)

  // Authenticated user/vendor on /auth/* → send home
  if (isAuthenticated && isUserAuthPage) {
    return <Navigate to={homeRoute} replace />;
  }

  // Authenticated admin trying to visit /auth/* → send to admin dashboard
  if (isAuthenticated && user?.role === "admin" && path.startsWith("/auth")) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Authenticated admin browsing /shop/* → redirect to dashboard
  if (isAuthenticated && user?.role === "admin" && path.startsWith("/shop")) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}

export default CheckAuth;
