/**
 * NewOrderToast
 *
 * Polished DilMart in-app notification shown when the vendor is actively
 * using the dashboard and a new order arrives via Socket.IO.
 *
 * Design goals:
 *  - Feels native to DilMart (teal brand, same radius/shadow/typography)
 *  - Shopify-level quality: strong hierarchy, icon, amount, CTA
 *  - Slides in from the top-right with a smooth spring animation
 *  - Auto-dismisses after 8 s with a visible progress bar
 *  - Dismissible via the × button at any time
 *  - Never blocks content — fixed overlay, high z-index
 *  - Responsive: full-width on mobile, 360 px card on desktop
 *  - No third-party toast library — pure React + Tailwind
 *
 * Props:
 *  notification  - { title, message, orderId, relatedEntityId, createdAt }
 *  onDismiss     - called when the toast is closed (by timer or user)
 *  onViewOrder   - called when "View Order" is clicked
 *  stackIndex    - 0-based position in the toast stack (0 = top). Used to
 *                  offset each toast vertically so they don't overlap.
 */

import { useEffect, useRef, useState } from "react";
import { X, PackageCheck, ArrowRight } from "lucide-react";

// Auto-dismiss delay in ms
const AUTO_DISMISS_MS = 8000;
// Height of one toast card + gap between cards (px)
const TOAST_STRIDE_PX = 108;

export default function NewOrderToast({ notification, onDismiss, onViewOrder, stackIndex = 0 }) {
  const [visible,  setVisible]  = useState(false);   // controls CSS enter animation
  const [leaving,  setLeaving]  = useState(false);   // controls CSS leave animation
  const [progress, setProgress] = useState(100);     // progress bar 100→0
  const timerRef    = useRef(null);
  const intervalRef = useRef(null);
  const startedAt   = useRef(Date.now());

  // ── Mount: trigger enter animation one frame after render ────────────────
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Auto-dismiss timer with progress bar ─────────────────────────────────
  useEffect(() => {
    startedAt.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed  = Date.now() - startedAt.current;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
    }, 50);

    timerRef.current = setTimeout(() => dismiss(), AUTO_DISMISS_MS);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    setLeaving(true);
    // Wait for leave animation to finish before removing from DOM
    setTimeout(() => onDismiss?.(), 320);
  }

  function handleViewOrder() {
    dismiss();
    onViewOrder?.();
  }

  // ── Parse display values ─────────────────────────────────────────────────
  const title   = notification?.title   || "🎉 New Order Received";
  const message = notification?.message || "You have a new order waiting for confirmation.";

  // Extract order number and amount from message if present
  // message format: "Order #ORD-XXXXX • 1,250 ETB from Name"
  const orderRefMatch = message.match(/#([\w-]+)/);
  const amountMatch   = message.match(/([\d,]+)\s*ETB/);
  const orderRef      = orderRefMatch ? orderRefMatch[1] : null;
  const amount        = amountMatch   ? amountMatch[1]   : null;

  // Clean display: strip the "from X" part to avoid long overflow
  const bodyLine = orderRef && amount
    ? `Order #${orderRef} · ${amount} ETB`
    : message;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{ top: `${1 + stackIndex * TOAST_STRIDE_PX / 16}rem` }}
      className={[
        // ── Position — top offset driven by stackIndex ─────────────────────
        "fixed right-4 z-[9999]",
        "w-[calc(100vw-2rem)] max-w-[360px]",
        // ── Card shell ─────────────────────────────────────────────────────
        "bg-background border border-border",
        "rounded-xl shadow-2xl overflow-hidden",
        // ── Transition ─────────────────────────────────────────────────────
        "transition-all duration-300 ease-out",
        visible && !leaving
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0",
      ].join(" ")}
    >
      {/* ── Teal accent bar at the top ──────────────────────────────────── */}
      <div className="h-1 w-full bg-primary" />

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start gap-3">

          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <img
                src="/icons/notification.jpg"
                alt="DilMart"
                className="h-10 w-10 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to icon if image fails
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextSibling.style.display = "flex";
                }}
              />
              {/* PackageCheck fallback — hidden by default, shown on img error */}
              <PackageCheck
                className="h-5 w-5 text-primary hidden"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground leading-tight">
                {title}
              </p>
              {/* Dismiss button */}
              <button
                onClick={dismiss}
                aria-label="Dismiss notification"
                className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center
                           text-muted-foreground hover:text-foreground hover:bg-muted
                           transition-colors focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-ring"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Body */}
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {bodyLine}
            </p>

            {/* CTA */}
            <button
              onClick={handleViewOrder}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary
                         hover:text-primary/80 transition-colors focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              View Order
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Progress bar ────────────────────────────────────────────────── */}
      <div className="h-0.5 w-full bg-muted">
        <div
          className="h-full bg-primary transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
