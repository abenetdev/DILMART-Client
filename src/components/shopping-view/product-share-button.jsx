import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ProductShareButton
 *
 * Opens the device/browser native share sheet (Web Share API).
 * Passes title, url, and — where supported — a File blob of the
 * product image so platforms that accept files show a rich preview.
 *
 * Props:
 *   productId   – string  (required) — builds the canonical product URL
 *   productName – string  (required) — share title
 *   productImage – string (optional) — first product image URL for rich preview
 *   variant     – "icon" | "button"  (default "button")
 *                 "icon"   → compact round button for product cards
 *                 "button" → labelled outline button for the detail page
 */
export default function ProductShareButton({
  productId,
  productName,
  productImage = "",
  variant = "button",
}) {
  const productUrl = `${window.location.origin}/product/${productId}`;

  const handleShare = async (e) => {
    e.stopPropagation();

    if (!navigator.share) return; // nothing to do if unsupported (button is hidden)

    // Base share data — always included
    const shareData = {
      title: productName,
      url:   productUrl,
    };

    // Try to include the product image as a File so platforms like
    // iOS Messages / Android share targets show the actual product thumbnail.
    // navigator.canShare({ files }) gates this — we never throw on unsupported browsers.
    if (productImage) {
      try {
        const response = await fetch(productImage);
        const blob     = await response.blob();
        // Derive a clean filename from the URL
        const ext      = blob.type.split("/")[1] || "jpg";
        const filename = `${productName.replace(/\s+/g, "-").toLowerCase()}.${ext}`;
        const file     = new File([blob], filename, { type: blob.type });

        if (navigator.canShare?.({ files: [file] })) {
          shareData.files = [file];
        }
      } catch {
        // Network error fetching the image — proceed without it
      }
    }

    try {
      await navigator.share(shareData);
    } catch {
      // User dismissed the sheet — no action needed
    }
  };

  // Hide completely on browsers that don't support the Web Share API
  if (typeof navigator !== "undefined" && !navigator.share) return null;

  if (variant === "icon") {
    return (
      <button
        onClick={handleShare}
        aria-label="Share product"
        className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors"
      >
        <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
      </button>
    );
  }

  return (
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
}
