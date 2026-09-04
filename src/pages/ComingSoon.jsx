import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, ExternalLink } from "lucide-react";
import logo from "@/assets/logo2.png";
import { LAUNCH_DATE } from "@/config/launch";
import "./ComingSoon.css";

/* ─────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────── */

/** Parse LAUNCH_DATE and return a Date object. */
function getLaunchDate() {
  return new Date(LAUNCH_DATE);
}

/**
 * Calculate remaining time from now until `target`.
 * Returns { days, hours, minutes, seconds, expired }.
 */
function calcTimeLeft(target) {
  const diff = target - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

/** Zero-pad a number to two digits. */
const pad = (n) => String(n).padStart(2, "0");

/* ─────────────────────────────────────────────────────────────────────────
   CountdownUnit — single card with flip animation on change
───────────────────────────────────────────────────────────────────────── */
function CountdownUnit({ value, label }) {
  const [flipping, setFlipping] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setFlipping(true);
      const t = setTimeout(() => setFlipping(false), 310);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="cs-unit">
      <div className="cs-card">
        <span className={`cs-number${flipping ? " cs-flip" : ""}`}>
          {pad(value)}
        </span>
      </div>
      <span className="cs-unit-label">{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   TikTok icon (not in lucide-react)
───────────────────────────────────────────────────────────────────────── */
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  );
}

/* Social links — hrefs are "#" until official URLs are set.
   Update these values (or pull from env vars) when pages go live. */
const SOCIAL_LINKS = [
  { label: "Follow DilMart on Facebook",  Icon: Facebook,  href: "https://www.facebook.com/share/19CyvzFM5w/" },
  { label: "Follow DilMart on Instagram", Icon: Instagram, href: "https://www.instagram.com/dilmart.et?igsi=bTA0YTc3NHdtYXZw" },
  { label: "Follow DilMart on Twitter",   Icon: Twitter,   href: "#" },
  { label: "Follow DilMart on TikTok",    Icon: TikTokIcon, href: "https://www.tiktok.com/@dilmart.et?_r=1&_t=ZS-99Sd9Ha7mdt" },
];

/* Feature highlights shown below CTA */
const FEATURES = [
  { icon: "🛒", text: "Local sellers" },
  { icon: "🛡️", text: "Escrow protection" },
  { icon: "🚀", text: "Fast delivery" },
  { icon: "🤝", text: "Trusted vendors" },
  { icon: "💳", text: "Secure payments" },
];

/* ─────────────────────────────────────────────────────────────────────────
   ComingSoon — main export
───────────────────────────────────────────────────────────────────────── */
export default function ComingSoon() {
  const launchDate = getLaunchDate();
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(launchDate));

  /* ── Countdown ticker ──────────────────────────────────────────────── */
  useEffect(() => {
    // Immediately recalculate on mount in case SSR/hydration mismatch
    setTimeLeft(calcTimeLeft(launchDate));

    if (timeLeft.expired) return; // already past launch date — no interval needed

    const id = setInterval(() => {
      const next = calcTimeLeft(launchDate);
      setTimeLeft(next);
      if (next.expired) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once — launchDate is a constant derived from config

  /* ── Update document title while on this page ──────────────────────── */
  useEffect(() => {
    const prev = document.title;
    document.title = "DilMart — Coming Soon";
    return () => { document.title = prev; };
  }, []);

  return (
    <div className="cs-root">
      {/* Decorative background glow */}
      <div className="cs-bg-glow" aria-hidden="true" />

      <div className="cs-inner">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="cs-header">
          {/* Logo — links back to "/" (which is this page in pre-launch) */}
          <a href="/" className="cs-logo-link" aria-label="DilMart home">
            <img src={logo} alt="DilMart" className="cs-logo-img" />
          </a>

          {/* Social icons */}
          <nav className="cs-header-social" aria-label="DilMart social media">
            {SOCIAL_LINKS.map(({ label, Icon, href }) => (
              <a
                key={label}
                href={href}
                className="cs-social-btn"
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon />
              </a>
            ))}
          </nav>
        </header>

        {/* ── Main ───────────────────────────────────────────────────── */}
        <main className="cs-main" id="main-content">

          {/* Status badge */}
          <div className="cs-badge" role="status">
            <span className="cs-badge-dot" aria-hidden="true" />
            Launching Soon
          </div>

          {/* Hero headline */}
          <h1 className="cs-headline">
            <span className="cs-headline-accent">Dilmart</span>
            <br />
             is coming.
          </h1>

          {/* Supporting copy */}
          <p className="cs-subline">
            The First Ethiopian social commerce platform is on the way to make selling and buying online easier and safer than before
          </p>

          {/* ── Countdown ──────────────────────────────────────────── */}
          <p className="cs-countdown-label" aria-live="polite" aria-atomic="true">
            {timeLeft.expired ? "We have launched!" : "Launching in"}
          </p>

          {timeLeft.expired ? (
            /* Already past launch date */
            <div className="cs-launched-badge" role="status">
              <span aria-hidden="true">🎉</span>
              DilMart is live — visit the app!
            </div>
          ) : (
            <div
              className="cs-countdown"
              aria-label={`${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds remaining`}
            >
              <CountdownUnit value={timeLeft.days}    label="Days"    />
              <span className="cs-sep" aria-hidden="true">:</span>
              <CountdownUnit value={timeLeft.hours}   label="Hours"   />
              <span className="cs-sep" aria-hidden="true">:</span>
              <CountdownUnit value={timeLeft.minutes} label="Minutes" />
              <span className="cs-sep" aria-hidden="true">:</span>
              <CountdownUnit value={timeLeft.seconds} label="Seconds" />
            </div>
          )}

          {/* ── CTA ────────────────────────────────────────────────── */}
          <div className="cs-cta">
            <h2 className="cs-cta-heading">
              Be the first to know when DilMart launches.
            </h2>
            <p className="cs-cta-sub">
              Follow us on social media for updates, sneak peeks, and exclusive launch offers.
            </p>

            <div className="cs-cta-buttons">
              {/* Primary: follow on Instagram (most visual platform for a marketplace) */}
              <a
                href={SOCIAL_LINKS[1].href}
                className="cs-btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={16} aria-hidden="true" />
                Follow DilMart
              </a>

              <a
                href={SOCIAL_LINKS[0].href}  
                className="cs-btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook size={16} aria-hidden="true" />
                Facebook Page
              </a>
            </div>
          </div>

          {/* ── Feature pills ──────────────────────────────────────── */}
          <ul className="cs-features" aria-label="Platform highlights">
            {FEATURES.map(({ icon, text }) => (
              <li key={text} className="cs-feature-pill">
                <span className="cs-feature-pill-icon" aria-hidden="true">{icon}</span>
                {text}
              </li>
            ))}
          </ul>

        </main>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer className="cs-footer">
          <p className="cs-footer-text">
            © {new Date().getFullYear()} DilMart. All rights reserved.
          </p>
          {/* <nav className="cs-footer-links" aria-label="Legal">
            <Link to="/privacy-policy" className="cs-footer-link">Privacy Policy</Link>
            <Link to="/terms"          className="cs-footer-link">Terms &amp; Conditions</Link>
            <Link to="/refund-policy"  className="cs-footer-link">Refund Policy</Link>
          </nav> */}
        </footer>

      </div>
    </div>
  );
}
