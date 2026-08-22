import { Outlet } from "react-router-dom";
import { ShoppingBag, Star, Shield, Truck, Store } from "lucide-react";
import logo from "@/assets/logo.png";

const features = [
  { icon: ShoppingBag, text: "10,000+ Products from verified vendors" },
  { icon: Star,        text: "Trusted by 50,000+ happy customers"    },
  { icon: Shield,      text: "Secure payments with Chapa"            },
  { icon: Truck,       text: "Fast delivery across Ethiopia"         },
];

/* Decorative floating stat pill */
function StatPill({ value, label, delay = "0s" }) {
  return (
    <div
      className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5"
      style={{ animationDelay: delay }}
    >
      <span className="text-lg font-extrabold text-white leading-none">{value}</span>
      <span className="text-xs text-white/60 leading-tight">{label}</span>
    </div>
  );
}

function AuthLayout() {
  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel (desktop only) ───────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden text-white p-12"
        style={{
          background: "linear-gradient(145deg, #0a2e2c 0%, #0d3b38 35%, #0f4a44 65%, #0a2e2c 100%)",
        }}
      >
        {/* ── Decorative background shapes ── */}
        <div
          className="absolute -top-24 -right-24 h-80 w-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(176 84% 31% / 0.35) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 -left-16 h-64 w-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(176 84% 31% / 0.25) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(176 84% 31% / 0.08) 0%, transparent 70%)" }}
        />

        {/* ── Fine dot-grid texture overlay ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* ── LOGO ── */}
        <a href="/" className="relative z-10 flex items-center">
          <img
            src={logo}
            alt="DilMart"
            className="h-10 w-auto object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </a>

        {/* ── MAIN COPY ── */}
        <div className="relative z-10 space-y-8">

          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span
              className="h-px w-8 rounded-full"
              style={{ backgroundColor: "hsl(176 84% 50%)" }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "hsl(176 84% 65%)" }}
            >
              Ethiopia's Premier Marketplace
            </span>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight">
              Shop. Sell.
              <br />
              <span style={{ color: "hsl(176 84% 55%)" }}>Grow.</span>
            </h1>
            <p className="mt-4 text-base text-white/55 leading-relaxed max-w-[280px]">
              Discover thousands of verified stores, exclusive deals, and fast delivery — all in one place.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                  style={{ backgroundColor: "hsl(176 84% 31% / 0.4)" }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: "hsl(176 84% 65%)" }} />
                </div>
                <span className="text-white/70">{text}</span>
              </li>
            ))}
          </ul>

          {/* Stat pills row */}
          <div className="flex flex-wrap gap-3 pt-2">
            <StatPill value="50K+" label="Happy Customers" />
            <StatPill value="1,200+" label="Verified Stores" />
          </div>
        </div>

        {/* ── FOOTER ── */}
        <p className="relative z-10 text-white/25 text-xs">
          © {new Date().getFullYear()} DilMart. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <a href="/" className="flex lg:hidden items-center justify-center mb-8">
            <img src={logo} alt="DilMart" className="h-9 w-auto object-contain" />
          </a>
          <Outlet />
        </div>
      </div>

    </div>
  );
}

export default AuthLayout;
