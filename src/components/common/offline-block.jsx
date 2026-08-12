import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

/**
 * OfflineBlock
 *
 * Full-area offline placeholder shown when a page or section cannot
 * load because the device is offline.
 *
 * Props:
 *   onRetry   – () => void   Called when the user clicks "Try Again".
 *                            The parent decides what to re-fetch.
 *   message   – string       Optional override for the body text.
 *   fullPage  – boolean      When true, fills the whole viewport height.
 *                            Default: false (fills its container).
 */
export default function OfflineBlock({
  onRetry,
  message,
  fullPage = false,
}) {
  const { isOnline } = useNetworkStatus();

  const handleRetry = () => {
    if (isOnline && onRetry) onRetry();
  };

  return (
    <div
      className={`
        flex flex-col items-center justify-center gap-5 px-6 text-center
        ${fullPage ? "min-h-[80vh]" : "min-h-[300px] py-16"}
      `}
    >
      {/* Icon */}
      <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
        <WifiOff className="h-9 w-9 text-gray-400" />
      </div>

      {/* Text */}
      <div className="space-y-1.5 max-w-xs">
        <h2 className="text-lg font-semibold text-gray-900">No internet connection</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          {message ||
            "Please check your connection and try again."}
        </p>
      </div>

      {/* Try Again */}
      {onRetry && (
        <Button
          onClick={handleRetry}
          disabled={!isOnline}
          variant="outline"
          className="gap-2 min-w-[140px]"
        >
          <RefreshCw className="h-4 w-4" />
          {isOnline ? "Try Again" : "No connection…"}
        </Button>
      )}
    </div>
  );
}

/**
 * isOfflineError(error)
 *
 * Returns true when an error was caused by the device being offline
 * rather than a real server/API failure.
 * Works with both the axios interceptor tag and the native network error.
 */
export function isOfflineError(error) {
  if (!error) return false;
  if (error.isOffline === true)              return true;
  if (error.code === "ERR_NETWORK_OFFLINE")  return true;
  // axios wraps network failures as ERR_NETWORK when the request couldn't be sent at all
  if (error.code === "ERR_NETWORK" && !navigator.onLine) return true;
  return false;
}
