import { useState, useRef, useEffect } from "react";
import { Share2, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Platform definitions ───────────────────────────────────────────────────
function getPlatforms(url, title) {
  const encodedUrl   = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return [
    {
      id:    "whatsapp",
      label: "WhatsApp",
      color: "hover:bg-[#25D366]/10 hover:text-[#25D366]",
      icon:  (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      id:    "telegram",
      label: "Telegram",
      color: "hover:bg-[#229ED9]/10 hover:text-[#229ED9]",
      icon:  (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      id:    "facebook",
      label: "Facebook",
      color: "hover:bg-[#1877F2]/10 hover:text-[#1877F2]",
      icon:  (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id:    "x",
      label: "X (Twitter)",
      color: "hover:bg-gray-100 hover:text-gray-900",
      icon:  (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.861L1.524 2.25h6.957l4.26 5.631 5.503-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      href: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
  ];
}

// ── ProductShareButton ─────────────────────────────────────────────────────
/**
 * Props:
 *   productId   – string   (required) used to build the URL
 *   productName – string   (required) used in share text
 *   variant     – "icon" | "button"   (default "button")
 *                 "icon"   → compact round icon used on product cards
 *                 "button" → labelled button used on detail page
 */
export default function ProductShareButton({
  productId,
  productName,
  variant = "button",
}) {
  const [open,   setOpen]   = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef          = useRef(null);

  const productUrl = `${window.location.origin}/product/${productId}`;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleShare = async (e) => {
    e.stopPropagation();

    // Native share sheet on mobile
    if (navigator.share) {
      try {
        await navigator.share({ title: productName, url: productUrl });
        return;
      } catch {
        // User cancelled or not supported — fall through to popup
      }
    }

    setOpen((p) => !p);
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = productUrl;
      ta.style.position = "fixed";
      ta.style.opacity  = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const platforms = getPlatforms(productUrl, productName);

  // ── Trigger button ──────────────────────────────────────────────────────
  const trigger =
    variant === "icon" ? (
      // Compact round button for product cards
      <button
        onClick={handleShare}
        aria-label="Share product"
        className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors"
      >
        <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
      </button>
    ) : (
      // Labelled button for detail page
      <Button
        size="lg"
        variant="outline"
        className="px-4 gap-2"
        onClick={handleShare}
        aria-label="Share product"
      >
        <Share2 className="h-5 w-5" />
        <span className="hidden sm:inline text-sm">Share</span>
      </Button>
    );

  return (
    <div className="relative" ref={popoverRef}>
      {trigger}

      {/* ── Popover ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          className={`
            absolute z-50 bg-white rounded-2xl shadow-xl border border-gray-100
            w-64 p-4
            ${variant === "icon"
              ? "bottom-full right-0 mb-2"   // above the card icon
              : "top-full right-0 mt-2"       // below the detail-page button
            }
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800">Share product</p>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Platform list */}
          <ul className="space-y-1">
            {platforms.map((p) => (
              <li key={p.id}>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 transition-colors ${p.color}`}
                >
                  {p.icon}
                  {p.label}
                </a>
              </li>
            ))}

            {/* Divider */}
            <li className="my-1 border-t border-gray-100" />

            {/* Copy Link */}
            <li>
              <button
                onClick={handleCopy}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
                {copied ? (
                  <span className="text-green-600 font-semibold">Link copied!</span>
                ) : (
                  "Copy Link"
                )}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
