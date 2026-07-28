import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerUser } from "@/store/auth-slice";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, UserPlus, Clock } from "lucide-react";

function AuthRegister() {
  const [form, setForm]               = useState({ userName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { toast } = useToast();

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  // Countdown timer for rate limit
  useEffect(() => {
    let interval;
    if (rateLimited && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [rateLimited, timeRemaining]);

  async function onSubmit(e) {
    e.preventDefault();
    if (rateLimited) return;

    setLoading(true);
    const data = await dispatch(registerUser(form));
    setLoading(false);

    // Unwrap — payload comes from fulfilled, error.payload from rejectWithValue
    const result = data?.payload;

    if (result?.success) {
      toast({ title: "Code sent!", description: `Check ${form.email} for your verification code.` });
      navigate(`/auth/verify-otp?email=${encodeURIComponent(form.email)}`);
    } else if (result?.retryAfter || data?.error?.message?.includes("429")) {
      const retryAfter = result?.retryAfter || 900;
      setRateLimited(true);
      setTimeRemaining(retryAfter);
      toast({
        title:       "Too many attempts",
        description: `Please wait ${Math.ceil(retryAfter / 60)} minutes before trying again`,
        variant:     "destructive",
      });
    } else {
      toast({
        title:       "Registration failed",
        description: result?.message || "Something went wrong. Please try again.",
        variant:     "destructive",
      });
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isValid = form.userName.trim() && form.email.trim() && form.password.length >= 6;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Join thousands of shoppers on MarketPlace.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Username */}
        <div className="space-y-1.5">
          <Label htmlFor="userName">Username</Label>
          <Input
            id="userName"
            type="text"
            placeholder="johndoe"
            value={form.userName}
            onChange={(e) => set("userName", e.target.value)}
            required
            autoComplete="username"
            className="h-11"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
            autoComplete="email"
            className="h-11"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="h-11 pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.password && form.password.length < 6 && (
            <p className="text-xs text-orange-500">Password must be at least 6 characters</p>
          )}
          {/* Rate limit countdown below password */}
          {rateLimited && (
            <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm">
              <Clock className="h-4 w-4" />
              <span>Wait {formatTime(timeRemaining)} before trying again</span>
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading || rateLimited || (!rateLimited && !isValid)}
          className="w-full h-11 gap-2 text-sm font-medium mt-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : rateLimited ? (
            <Clock className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {loading ? "Creating account…" : rateLimited ? `Wait ${formatTime(timeRemaining)}` : "Create Account"}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-gray-50 px-2 text-gray-400">or</span>
        </div>
      </div>

      {/* Login link */}
      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          to="/auth/login"
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default AuthRegister;
