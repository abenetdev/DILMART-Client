import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

// Floating particle component
function Particle({ style }) {
  return (
    <div
      className="absolute rounded-full bg-blue-500/20 animate-[float_ease-in-out_infinite]"
      style={style}
    />
  );
}

const PARTICLES = [
  { width: 8,  height: 8,  top: "15%", left: "10%", animationDuration: "6s",  animationDelay: "0s"   },
  { width: 5,  height: 5,  top: "70%", left: "15%", animationDuration: "8s",  animationDelay: "1s"   },
  { width: 12, height: 12, top: "25%", left: "80%", animationDuration: "7s",  animationDelay: "0.5s" },
  { width: 6,  height: 6,  top: "80%", left: "75%", animationDuration: "9s",  animationDelay: "2s"   },
  { width: 9,  height: 9,  top: "45%", left: "5%",  animationDuration: "5s",  animationDelay: "1.5s" },
  { width: 4,  height: 4,  top: "55%", left: "90%", animationDuration: "10s", animationDelay: "0.8s" },
  { width: 7,  height: 7,  top: "10%", left: "50%", animationDuration: "7s",  animationDelay: "3s"   },
  { width: 5,  height: 5,  top: "90%", left: "40%", animationDuration: "6s",  animationDelay: "2.5s" },
];

export default function NotFound() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [dots, setDots] = useState("");

  // Animated dots for the "searching..." text
  useEffect(() => {
    const t = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center px-4 overflow-hidden relative">

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} style={p} />
      ))}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 text-center max-w-lg w-full">

        {/* 404 number with glitch effect */}
        <div className="relative mb-6 select-none">
          {/* Shadow layers for depth */}
          <p
            className="absolute inset-0 text-[9rem] md:text-[12rem] font-black leading-none text-blue-500/10 blur-sm"
            aria-hidden
          >
            404
          </p>
          <p
            className="relative text-[9rem] md:text-[12rem] font-black leading-none bg-gradient-to-b from-white via-blue-100 to-slate-400 bg-clip-text text-transparent"
            style={{ letterSpacing: "-0.05em" }}
          >
            404
          </p>
        </div>

        {/* Divider line with dots */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-600" />
          <div className="flex gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400/60" />
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400/30" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-600" />
        </div>

        {/* Text */}
        <div className="space-y-3 mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Page not found
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            The page{" "}
            <code className="bg-slate-800 text-blue-300 px-2 py-0.5 rounded text-xs font-mono">
              {location.pathname}
            </code>{" "}
            doesn't exist or has been moved.
          </p>
          <p className="text-slate-500 text-sm flex items-center justify-center gap-1.5">
            <Search className="h-3.5 w-3.5 animate-pulse" />
            <span>Looking for something else{dots}</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2 border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate("/shop/home", { replace: true })}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/25"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Error code footer */}
        <p className="mt-14 text-slate-700 text-xs font-mono tracking-widest">
          HTTP 404 · NOT FOUND
        </p>
      </div>
    </div>
  );
}
