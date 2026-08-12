import { useEffect, useState } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff, Wifi } from "lucide-react";

/**
 * OfflineBanner
 *
 * Sticky notification bar that slides in from the top whenever the
 * device goes offline and briefly shows a "Back online" confirmation
 * when the connection is restored.
 *
 * Mount once near the top of the component tree (e.g. in App.jsx).
 * No props required.
 */
export default function OfflineBanner() {
  const { isOnline }        = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setRestored(false);
      setVisible(true);
    } else if (visible) {
      // Was showing the offline bar — briefly show "restored" then hide
      setRestored(true);
      const t = setTimeout(() => {
        setVisible(false);
        setRestored(false);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed top-0 left-0 right-0 z-[9999]
        flex items-center justify-center gap-2.5
        px-4 py-3 text-sm font-medium
        transition-all duration-300
        ${restored
          ? "bg-green-600 text-white"
          : "bg-gray-900 text-white"
        }
      `}
    >
      {restored ? (
        <>
          <Wifi className="h-4 w-4 shrink-0" />
          Back online
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 shrink-0" />
          No internet connection
        </>
      )}
    </div>
  );
}
