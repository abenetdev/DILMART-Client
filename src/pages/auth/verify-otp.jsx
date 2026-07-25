import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { verifyOtp, resendOtp } from "@/store/auth-slice";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck, RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react";

const OTP_LENGTH  = 6;
const RESEND_SECS = 60;

export default function VerifyOtpPage() {
  const [digits, setDigits]     = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECS);
  const [verified, setVerified] = useState(false);
  const [shake, setShake]       = useState(false);

  const inputRefs = useRef([]);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast }  = useToast();

  const email = searchParams.get("email") || "";

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (digits.every((d) => d !== "") && !loading && !verified) {
      handleVerify();
    }
  }, [digits]);

  // ── Input handlers ────────────────────────────────────────────────────────

  function handleChange(index, value) {
    // Only accept single digits
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    // Move focus forward
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    // Focus last filled or last box
    const lastIdx = Math.min(pasted.length - 1, OTP_LENGTH - 1);
    inputRefs.current[lastIdx]?.focus();
  }

  // ── Verify ────────────────────────────────────────────────────────────────

  async function handleVerify() {
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) return;
    setLoading(true);
    const result = await dispatch(verifyOtp({ email, otp }));
    setLoading(false);

    if (result?.payload?.success) {
      setVerified(true);
      setTimeout(() => navigate("/auth/login"), 2200);
    } else {
      // Shake + clear
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      toast({
        title:       result?.payload?.message || "Invalid code",
        variant:     "destructive",
      });
    }
  }

  // ── Resend ────────────────────────────────────────────────────────────────

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    const result = await dispatch(resendOtp({ email }));
    setResending(false);

    if (result?.payload?.success) {
      setDigits(Array(OTP_LENGTH).fill(""));
      setCountdown(RESEND_SECS);
      inputRefs.current[0]?.focus();
      toast({ title: "New code sent!", description: `Check ${email}` });
    } else {
      toast({ title: result?.payload?.message || "Could not resend", variant: "destructive" });
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (verified) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center animate-[scale-in_0.4s_ease-out]">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email verified!</h2>
          <p className="text-gray-500 mt-2 text-sm">Redirecting you to sign in…</p>
        </div>
        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full animate-[grow_2s_linear_forwards]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Back link */}
      <Link
        to="/auth/register"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to register
      </Link>

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <MailCheck className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
          <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{email || "your email"}</p>
        </div>
      </div>

      {/* OTP boxes */}
      <div
        className={`flex justify-center gap-3 ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
      >
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
                ? "border-blue-500 text-blue-700 bg-blue-50 shadow-sm"
                : "border-gray-200 text-gray-900 focus:border-blue-400 focus:bg-blue-50/40"
              }
              ${loading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          />
        ))}
      </div>

      {/* Verify button — visible if not all filled (auto-submits when full) */}
      {digits.some((d) => d === "") && (
        <Button
          className="w-full h-11 gap-2"
          onClick={handleVerify}
          disabled={loading || digits.some((d) => d === "")}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Verifying…" : "Verify Email"}
        </Button>
      )}

      {/* Loading indicator when auto-submitting */}
      {loading && digits.every((d) => d !== "") && (
        <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying…
        </div>
      )}

      {/* Resend */}
      <div className="text-center space-y-1">
        <p className="text-sm text-gray-500">Didn't receive the code?</p>
        <button
          onClick={handleResend}
          disabled={countdown > 0 || resending}
          className={`
            inline-flex items-center gap-1.5 text-sm font-semibold transition-colors
            ${countdown > 0 || resending
              ? "text-gray-400 cursor-not-allowed"
              : "text-blue-600 hover:text-blue-800 cursor-pointer"
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

      {/* Expiry notice */}
      <p className="text-center text-xs text-gray-400">
        Code expires in 10 minutes
      </p>
    </div>
  );
}
