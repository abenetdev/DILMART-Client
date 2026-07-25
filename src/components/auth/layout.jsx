import { Outlet } from "react-router-dom";
import { ShoppingBag, Star, Shield, Truck } from "lucide-react";

const features = [
  { icon: ShoppingBag, text: "10,000+ Products from verified vendors" },
  { icon: Star,        text: "Trusted by 50,000+ happy customers"    },
  { icon: Shield,      text: "Secure payments with Chapa"            },
  { icon: Truck,       text: "Fast delivery across Ethiopia"         },
];

function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel (desktop only) ─────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-12">
        {/* Logo */}
        <a href={`/shop/home`} className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <ShoppingBag className="h-6 w-6 text-blue-400" />
          </div>
          <span className="text-xl font-bold">MarketPlace</span>
        </a>

        {/* Headline */}
        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight">
            Ethiopia's #1
            <br />
            <span className="text-blue-400">Multi-Vendor</span>
            <br />
            Marketplace
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-xs">
            Shop from thousands of verified stores or start selling your products today.
          </p>

          {/* Feature list */}
          <ul className="space-y-4 mt-8">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="p-1.5 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-slate-500 text-xs">
          © {new Date().getFullYear()} MarketPlace. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <a href={`/shop/home`} className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="p-2 bg-primary rounded-xl">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">MarketPlace</span>
          </a>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
