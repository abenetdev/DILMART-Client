import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { adminLoginUser } from "@/store/auth-slice";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, ShieldCheck, Lock } from "lucide-react";

export default function AdminLogin() {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { toast } = useToast();

  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const result = await dispatch(adminLoginUser(form));
    setLoading(false);

    if (result?.payload?.success) {
      toast({ title: "Welcome, Admin!" });
      navigate("/admin/dashboard", { replace: true });
    } else {
      toast({
        title: result?.payload?.message || "Login failed",
        variant: "destructive",
      });
    }
  }

  const isValid = form.email.trim() && form.password.length >= 6;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
            <p className="text-slate-400 text-sm mt-1">MarketPlace Control Panel</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl">
          <form onSubmit={onSubmit} className="space-y-5">

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-sm">Admin email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                autoComplete="email"
                className="h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !isValid}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 mt-1"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</>
                : <><Lock className="h-4 w-4" />Sign In</>
              }
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Restricted access — authorised personnel only
        </p>
      </div>
    </div>
  );
}
