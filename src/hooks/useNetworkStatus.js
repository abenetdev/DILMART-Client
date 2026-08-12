import { useEffect, useState } from "react";

/**
 * Returns { isOnline: boolean }
 * Subscribes to the browser's online/offline events and reflects
 * the current navigator.onLine state in real time.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return { isOnline };
}
