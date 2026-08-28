/**
 * SocketContext
 *
 * Manages a single Socket.IO connection for the vendor dashboard.
 *  - Connects when a vendor is authenticated
 *  - Joins vendor_{vendorId} private room
 *  - Listens for "newOrderNotification" events → dispatches to Redux
 *  - Plays notification sound on real-time events
 *  - Shows the polished DilMart NewOrderToast when the tab is active
 *
 * Toast stack behaviour:
 *  - Up to 3 toasts stack vertically (oldest at top, newest below)
 *  - Each toast auto-dismisses after 8 s
 *  - The × button dismisses immediately
 *  - "View Order" dismisses and navigates to the order detail page
 *  - Rapid back-to-back orders each get their own toast
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate }                   from "react-router-dom";
import { io }                            from "socket.io-client";
import { useDispatch, useSelector }      from "react-redux";
import { prependNotification }           from "@/store/vendor/notification-slice";
import notificationSoundSrc              from "@/assets/notification.mp3";
import { API_URL }                       from "@/lib/axios";
import NewOrderToast                     from "@/components/vendor-view/new-order-toast";

const SocketContext = createContext(null);
const SOCKET_URL    = API_URL;
const MAX_TOASTS    = 3;

export function SocketProvider({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((s) => s.auth);

  const socketRef = useRef(null);
  const audioRef  = useRef(null);

  // Toast queue — each entry: { id: string, notification: object }
  const [toasts, setToasts] = useState([]);

  // ── Audio helpers ─────────────────────────────────────────────────────────
  function getAudio() {
    if (!audioRef.current) {
      audioRef.current         = new Audio(notificationSoundSrc);
      audioRef.current.volume  = 0.7;
    }
    return audioRef.current;
  }

  function playNotificationSound() {
    try {
      const audio = getAudio();
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch { /* ignore */ }
  }

  // ── Toast helpers ─────────────────────────────────────────────────────────
  function addToast(notification) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => {
      const next = [...prev, { id, notification }];
      // Never show more than MAX_TOASTS — drop the oldest
      return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next;
    });
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Socket.IO lifecycle ───────────────────────────────────────────────────
  useEffect(() => {
    const isVendor = isAuthenticated && user?.role === "vendor" && user?.id;

    if (!isVendor) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      withCredentials:      true,
      transports:           ["websocket", "polling"],
      reconnection:         true,
      reconnectionAttempts: 10,
      reconnectionDelay:    2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
      socket.emit("joinVendorRoom", user.id);
    });

    socket.on("newOrderNotification", (payload) => {
      // 1. Persist to Redux — updates bell badge and notification list
      dispatch(prependNotification(payload));
      // 2. Sound
      playNotificationSound();
      // 3. Foreground in-app toast
      addToast(payload);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    return () => {
      if (socket.connected) socket.emit("leaveVendorRoom", user.id);
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, user?.role]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}

      {/*
        ── In-app toast stack ─────────────────────────────────────────────────
        Each toast receives a stackIndex so it can compute its own top offset.
        index 0 → top of stack (newest), index 1 → below it, etc.
        We reverse the array so the newest toast always appears at the top.
      */}
      {[...toasts].reverse().map((toast, index) => (
        <NewOrderToast
          key={toast.id}
          notification={toast.notification}
          stackIndex={index}
          onDismiss={() => removeToast(toast.id)}
          onViewOrder={() => {
            // orderId is the MongoDB Order._id sent by the server
            const orderId =
              toast.notification?.orderId ||
              toast.notification?.relatedEntityId;
            if (orderId) navigate(`/vendor/orders/${orderId}`);
          }}
        />
      ))}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
