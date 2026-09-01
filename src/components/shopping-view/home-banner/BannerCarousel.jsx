import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Utility: detect mobile viewport ──────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ── Single Slide ──────────────────────────────────────────────────────────
function BannerSlide({ banner, isActive, isMobile }) {
  const navigate = useNavigate();
  const imgSrc = (isMobile && banner.mobileImage) ? banner.mobileImage : banner.desktopImage;
  const hasContent = banner.title || banner.subtitle || banner.badge ||
                     banner.buttonText;

  return (
    <div
      aria-hidden={!isActive}
      className={`
        absolute inset-0 transition-opacity duration-700 ease-in-out
        ${isActive ? "opacity-100 z-10" : "opacity-0 z-0"}
      `}
    >
      {/* Background Image */}
      <img
        src={imgSrc}
        alt={banner.title || "Banner"}
        className="absolute inset-0 w-full h-full object-cover object-center"
        loading="lazy"
        draggable={false}
      />

      {/* Gradient overlay — only when there's text content */}
      {hasContent && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
      )}

      {/* Text Content */}
      {hasContent && (
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 sm:px-10 md:px-16 lg:px-24 max-w-xl md:max-w-2xl">
            {/* Badge */}
            {banner.badge && (
              <span className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-sm tracking-wide">
                {banner.badge}
              </span>
            )}

            {/* Title */}
            {banner.title && (
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                {banner.title}
              </h2>
            )}

            {/* Subtitle */}
            {banner.subtitle && (
              <p className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg text-white/85 leading-relaxed drop-shadow-sm max-w-md">
                {banner.subtitle}
              </p>
            )}

            {/* Button */}
            {banner.buttonText && (
              <div className="mt-5 sm:mt-6">
                <Button
                  size="lg"
                  className="rounded-xl bg-white text-gray-900 hover:bg-white/90 font-semibold shadow-lg shadow-black/20 transition-all duration-200 hover:scale-105"
                  onClick={() =>
                    banner.buttonLink ? navigate(banner.buttonLink) : undefined
                  }
                >
                  {banner.buttonText}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Carousel ─────────────────────────────────────────────────────────
const AUTO_INTERVAL = 5500; // ms

export default function BannerCarousel({ banners = [] }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isMobile = useIsMobile();
  const count = banners.length;

  // ── Auto-advance ────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (count < 2) return;
    timerRef.current = setInterval(() => {
      setCurrent((p) => (p + 1) % count);
    }, AUTO_INTERVAL);
  }, [count]);

  useEffect(() => {
    if (!isPaused) startTimer();
    return () => clearInterval(timerRef.current);
  }, [isPaused, startTimer]);

  // Reset to slide 0 if banners change
  useEffect(() => {
    setCurrent(0);
  }, [count]);

  // ── Navigation helpers ──────────────────────────────────────────────────
  const goTo = useCallback(
    (index) => {
      setCurrent((index + count) % count);
      setIsPaused(true);
      // Restart auto-scroll after a short pause
      clearTimeout(timerRef._restartTimeout);
      timerRef._restartTimeout = setTimeout(() => setIsPaused(false), 4000);
    },
    [count]
  );

  const goPrev = () => goTo(current - 1);
  const goNext = () => goTo(current + 1);

  // ── Touch / Swipe ───────────────────────────────────────────────────────
  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    // Only treat as horizontal swipe if dx > 40px and horizontal > vertical
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy) {
      dx < 0 ? goNext() : goPrev();
    }
    touchStartX.current = null;
    setTimeout(() => setIsPaused(false), 4000);
  }

  // ── Keyboard nav ────────────────────────────────────────────────────────
  function handleKeyDown(e) {
    if (e.key === "ArrowLeft") goPrev();
    if (e.key === "ArrowRight") goNext();
  }

  if (!count) return null;

  return (
    <section
      className="relative w-full overflow-hidden rounded-none select-none"
      style={{ aspectRatio: "890 / 266", maxHeight: "366px" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Homepage banner carousel"
      aria-roledescription="carousel"
    >
      {/* Slides */}
      {banners.map((banner, i) => (
        <BannerSlide
          key={banner._id || i}
          banner={banner}
          isActive={i === current}
          isMobile={isMobile}
        />
      ))}

      {/* Prev / Next buttons — only when > 1 slide */}
      {count > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous banner"
            className="
              absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20
              h-9 w-9 sm:h-10 sm:w-10 rounded-full
              bg-black/30 hover:bg-black/55 backdrop-blur-sm
              text-white border border-white/20
              flex items-center justify-center
              transition-all duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-white/50
            "
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={goNext}
            aria-label="Next banner"
            className="
              absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20
              h-9 w-9 sm:h-10 sm:w-10 rounded-full
              bg-black/30 hover:bg-black/55 backdrop-blur-sm
              text-white border border-white/20
              flex items-center justify-center
              transition-all duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-white/50
            "
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5"
          role="tablist"
          aria-label="Carousel navigation dots"
        >
          {banners.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to banner ${i + 1}`}
              onClick={() => goTo(i)}
              className={`
                rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white/60
                ${
                  i === current
                    ? "bg-white w-6 h-2"
                    : "bg-white/45 hover:bg-white/70 w-2 h-2"
                }
              `}
            />
          ))}
        </div>
      )}
    </section>
  );
}
