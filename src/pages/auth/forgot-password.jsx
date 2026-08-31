import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { forgotPassword, resetPassword } from "@/store/auth-slice";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, ArrowLeft, Mail, KeyRound, Eye, EyeOff,
  RefreshCw, CheckCircle2, ShieldCheck,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────
const OTP_LENGTH  = 6;
const RESEND_SECS = 60;


// ── Step 1 — Email input ───────────────────────────────────────────────────────
function StepEmail({ onSuccess }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch  = useDispatch();
  const { toast } = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const result = await dispatch(forgotPassword({ email: email.trim() }));
    setLoading(false);

    // Server always returns success=true (enumeration defence).
    // Only block on a hard network/server error (success === false explicitly).
    if (result?.payload?.success !== false) {
      toast({
        title: "Check your inbox",
        description: `If an account exists for ${email.trim()}, a reset code was sent.`,
      });
      onSuccess(email.trim());
    } else {
      toast({
        title:       "Something went wrong",
        description: result?.payload?.message || "Please try again.",
        variant:     "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Mail className="h-7 w-7 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Forgot your password?</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Enter the email linked to your account and we'll send you a reset code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fp-email">Email address</Label>
          <Input
            id="fp-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            className="h-11"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full h-11 gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {loading ? "Sending…" : "Send Reset Code"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Remembered it?{" "}
        <Link to="/auth/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

// ── Step 2 — OTP verification ──────────────────────────────────────────────────
function StepOtp({ email, onSuccess, onBack }) {
  const [digits,    setDigits]    = useState(Array(OTP_LENGTH).fill(""));
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECS);
  const [shake,     setShake]     = useState(false);

  const inputRefs = useRef([]);
  const dispatch  = useDispatch();
  const { toast } = useToast();

  // Auto-focus first box on mount
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  // Resend countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (digits.every((d) => d !== "") && !loading) {
      handleVerify();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  function handleChange(i, value) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    if (char && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits]; next[i] = ""; setDigits(next);
      } else if (i > 0) {
        inputRefs.current[i - 1]?.focus();
        const next = [...digits]; next[i - 1] = ""; setDigits(next);
      }
    } else if (e.key === "ArrowLeft"  && i > 0)              inputRefs.current[i - 1]?.focus();
    else if   (e.key === "ArrowRight" && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, idx) => { next[idx] = ch; });
    setDigits(next);
    const last = Math.min(pasted.length - 1, OTP_LENGTH - 1);
    inputRefs.current[last]?.focus();
  }

  async function handleVerify() {
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH || loading) return;
    setLoading(true);
    const result = await dispatch(
      resetPassword({ email, otp, verifyOnly: true })
    );
    setLoading(false);

    if (result?.payload?.success) {
      onSuccess(otp);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      toast({
        title:   result?.payload?.message || "Invalid or expired code",
        variant: "destructive",
      });
    }
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    const result = await dispatch(forgotPassword({ email }));
    setResending(false);

    if (result?.payload?.success !== false) {
      setDigits(Array(OTP_LENGTH).fill(""));
      setCountdown(RESEND_SECS);
      inputRefs.current[0]?.focus();
      toast({ title: "New code sent!", description: `Check ${email}` });
    } else {
      toast({ title: result?.payload?.message || "Could not resend", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-7">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enter the code</h1>
          <p className="mt-1 text-sm text-gray-500">We sent a 6-digit code to</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{email}</p>
        </div>
      </div>

      {/* OTP boxes */}
      <div className={`flex justify-center gap-3 ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={loading}
            className={`
              w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none
              transition-all duration-150 bg-white
              ${digit
                ? "border-primary text-primary bg-primary/5 shadow-sm"
                : "border-gray-200 text-gray-900 focus:border-primary focus:bg-primary/5"
              }
              ${loading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          />
        ))}
      </div>

      {/* Manual verify button — only shown when not all digits filled */}
      {digits.some((d) => d === "") && (
        <Button
          className="w-full h-11 gap-2"
          onClick={handleVerify}
          disabled={loading || digits.some((d) => d === "")}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Verifying…" : "Verify Code"}
        </Button>
      )}

      {/* Inline spinner when auto-submitting (all boxes filled) */}
      {loading && digits.every((d) => d !== "") && (
        <div className="flex items-center justify-center gap-2 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying…
        </div>
      )}

      {/* Resend */}
      <div className="text-center space-y-1">
        <p className="text-sm text-gray-500">Didn't receive the code?</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0 || resending}
          className={`
            inline-flex items-center gap-1.5 text-sm font-semibold transition-colors
            ${countdown > 0 || resending
              ? "text-gray-400 cursor-not-allowed"
              : "text-primary hover:text-primary/80 cursor-pointer"
            }
          `}
        >
          {resending
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
            : countdown > 0
              ? <><RefreshCw className="h-3.5 w-3.5" /> Resend in {countdown}s</>
              : <><RefreshCw className="h-3.5 w-3.5" /> Resend code</>
          }
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">Code expires in 10 minutes</p>
    </div>
  );
}

// ── Step 3 — New password ──────────────────────────────────────────────────────
function StepNewPassword({ email, otp, onSuccess }) {
  const [form,    setForm]    = useState({ password: "", confirm: "" });
  const [show,    setShow]    = useState({ password: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const dispatch  = useDispatch();
  const { toast } = useToast();

  const set    = (field, val) => setForm((p) => ({ ...p, [field]: val }));
  const toggle = (field)      => setShow((p) => ({ ...p, [field]: !p[field] }));

  const tooShort  = form.password.length > 0 && form.password.length < 6;
  const mismatch  = form.confirm.length > 0 && form.confirm !== form.password;
  const bothMatch = form.confirm.length > 0 && form.confirm === form.password;
  const canSubmit = form.password.length >= 6 && form.password === form.confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    const result = await dispatch(
      resetPassword({ email, otp, newPassword: form.password, verifyOnly: false })
    );
    setLoading(false);

    if (result?.payload?.success) {
      onSuccess();
    } else {
      toast({
        title:       "Reset failed",
        description: result?.payload?.message || "Please start over.",
        variant:     "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
        <p className="text-sm text-gray-500">
          Choose a strong password — at least 6 characters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="fp-new-password">New password</Label>
          <div className="relative">
            <Input
              id="fp-new-password"
              type={show.password ? "text" : "password"}
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              autoFocus
              autoComplete="new-password"
              className="h-11 pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => toggle("password")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {tooShort && (
            <p className="text-xs text-orange-500">Password must be at least 6 characters</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="fp-confirm-password">Confirm password</Label>
          <div className="relative">
            <Input
              id="fp-confirm-password"
              type={show.confirm ? "text" : "password"}
              placeholder="Repeat your new password"
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
              required
              autoComplete="new-password"
              className={`h-11 pr-10 ${mismatch ? "border-red-400 focus-visible:ring-red-400" : ""}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => toggle("confirm")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mismatch && (
            <p className="text-xs text-red-500">Passwords do not match</p>
          )}
          {bothMatch && !mismatch && (
            <p className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full h-11 gap-2 mt-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Updating…" : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}

// ── Success screen ─────────────────────────────────────────────────────────────
function SuccessScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/auth/login", { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Password reset!</h2>
        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
          Your password has been updated successfully.
          <br />
          Redirecting you to sign in…
        </p>
      </div>
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full animate-[grow_3s_linear_forwards]" />
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => navigate("/auth/login", { replace: true })}
      >
        Sign in now
      </Button>
    </div>
  );
}

// ── Page root ──────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  // step: 0 = email, 1 = otp, 2 = new password, 3 = success
  const [step,  setStep]  = useState(0);
  const [email, setEmail] = useState("");
  const [otp,   setOtp]   = useState("");

  return (
    <div className="space-y-2">
      {/* Step progress dots — hide on success */}

      {step === 0 && (
        <StepEmail
          onSuccess={(confirmedEmail) => {
            setEmail(confirmedEmail);
            setStep(1);
          }}
        />
      )}

      {step === 1 && (
        <StepOtp
          email={email}
          onBack={() => setStep(0)}
          onSuccess={(confirmedOtp) => {
            setOtp(confirmedOtp);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <StepNewPassword
          email={email}
          otp={otp}
          onSuccess={() => setStep(3)}
        />
      )}

      {step === 3 && <SuccessScreen />}
    </div>
  );
}
