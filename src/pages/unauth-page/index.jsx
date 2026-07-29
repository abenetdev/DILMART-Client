import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ShieldX, Home, ArrowLeft, ShoppingBag, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthPage() {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  function getHomeRoute() {
    if (!isAuthenticated) return "/";
    if (user?.role === "admin")  return "/admin/dashboard";
    if (user?.role === "vendor") return "/vendor/dashboard";
    return "/";
  }

  const homeRoute  = getHomeRoute();
  const isVendor   = user?.role === "vendor";
  const isAdmin    = user?.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 overflow-hidden relative">

      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/5 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md text-center">

        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Outer ring pulse */}
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/30 border border-red-500/30 flex items-center justify-center backdrop-blur-sm">
              <ShieldX className="h-14 w-14 text-red-400" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-2">
            <div className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-400 text-xs font-semibold tracking-widest uppercase">
              Access Denied
            </span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight">
            You're not supposed<br />to be here
          </h1>

          <p className="text-slate-400 text-base leading-relaxed max-w-sm mx-auto">
            You don't have permission to access this page.
            {isAuthenticated && user
              ? ` Your account (${user.userName}) doesn't have the required role.`
              : " Please sign in with an authorised account."
            }
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2 border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>

          <Button
            onClick={() => navigate(homeRoute, { replace: true })}
            className="gap-2 bg-white text-slate-900 hover:bg-slate-100 font-semibold"
          >
            {isAdmin ? (
              <><LayoutDashboard className="h-4 w-4" />Admin Dashboard</>
            ) : isVendor ? (
              <><LayoutDashboard className="h-4 w-4" />Vendor Dashboard</>
            ) : (
              <><ShoppingBag className="h-4 w-4" />Go Shopping</>
            )}
          </Button>

          {!isAuthenticated && (
            <Button
              onClick={() => navigate("/auth/login")}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Home className="h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>

        {/* Error code */}
        <p className="mt-12 text-slate-700 text-xs font-mono tracking-widest">
          ERROR 403 · FORBIDDEN
        </p>
      </div>
    </div>
  );
}
