import { useNavigate } from "react-router-dom";
import { Home, ShoppingBag, Tag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

// Subtle floating product-tag decorations
function FloatingTag({ className }) {
  return (
    <div className={`absolute opacity-[0.07] pointer-events-none select-none ${className}`}>
      <Tag className="h-full w-full text-primary" strokeWidth={1.5} />
    </div>
  );
}

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#f0f4ff_0%,_transparent_70%)] pointer-events-none" />

      {/* Floating tag decorations */}
      <FloatingTag className="h-24 w-24 top-[8%] left-[6%] rotate-[-20deg]" />
      <FloatingTag className="h-16 w-16 top-[15%] right-[8%] rotate-[15deg]" />
      <FloatingTag className="h-20 w-20 bottom-[12%] left-[10%] rotate-[25deg]" />
      <FloatingTag className="h-14 w-14 bottom-[10%] right-[7%] rotate-[-10deg]" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">

        {/* Illustration */}
        <div className="relative mb-8">
          {/* Outer ring */}
          <div className="h-36 w-36 rounded-full bg-primary/5 flex items-center justify-center">
            {/* Inner ring */}
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-11 w-11 text-primary" strokeWidth={1.5} />
            </div>
          </div>

          {/* Small floating product dots */}
          <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shadow-sm">
            <Package className="h-4 w-4 text-orange-400" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -left-2 h-7 w-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
            <Tag className="h-3.5 w-3.5 text-blue-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Oops! We couldn't find that page.
          </h1>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-xs mx-auto">
            The page you're looking for may have been moved, removed, or never existed.
            Let's get you back on track.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            onClick={() => navigate("/", { replace: true })}
            className="gap-2 px-6"
            size="lg"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
          <Button
            onClick={() => navigate("/listing")}
            variant="outline"
            className="gap-2 px-6"
            size="lg"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Products
          </Button>
        </div>

        {/* Subtle divider with suggestion links */}
        <div className="mt-10 pt-8 border-t border-gray-100 w-full">
          <p className="text-xs text-gray-400 mb-3">You might be looking for</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Home",      path: "/"         },
              { label: "Products",  path: "/listing"  },
              { label: "My Orders", path: "/orders" },
              { label: "Stores",    path: "/stores"   },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="text-xs text-primary hover:underline underline-offset-2 px-2 py-1 rounded-md hover:bg-primary/5 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
