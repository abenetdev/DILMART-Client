/**
 * SocketContext
 *
 * Manages a single Socket.IO connection for the vendor dashboard.
 * - Connects when a vendor is authenticated
 * - Joins vendor_{vendorId} private room
 * - Listens for "newOrderNotification" events and dispatches to Redux
 * - Plays notification sound only for real-time events (not history loads)
 */

import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { prependNotification } from "@/store/vendor/notification-slice";
import notificationSoundSrc from "@/assets/notification.mp3";
import { API_URL } from "@/lib/axios";

const SocketContext = createContext(null);

const SOCKET_URL = API_URL;

export function SocketProvider({ children }) {
  const dispatch  = useDispatch();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const socketRef = useRef(null);
  const audioRef  = useRef(null);

  // Lazily create Audio object on first real-time notification
  function getAudio() {
    if (!audioRef.current) {
      audioRef.current = new Audio(notificationSoundSrc);
      audioRef.current.volume = 0.7;
    }
    return audioRef.current;
  }

  function playNotificationSound() {
    try {
      const audio = getAudio();
      // Reset to start in case it's already playing
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Browser may block autoplay before user interaction — silently ignore
      });
    } catch {
      // Ignore audio errors entirely
    }
  }

  useEffect(() => {
    const isVendor = isAuthenticated && user?.role === "vendor" && user?.id;
    if (!isVendor) {
      // Clean up any existing socket when vendor logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Already connected to the correct vendor room — nothing to do
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports:      ["websocket", "polling"],
      reconnection:    true,
      reconnectionAttempts: 10,
      reconnectionDelay:    2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
      // Join the vendor's private room
      socket.emit("joinVendorRoom", user.id);
    });

    socket.on("newOrderNotification", (payload) => {
      // Dispatch to Redux — prepend to list & increment badge
      dispatch(prependNotification(payload));
      // Play sound only for real-time incoming events
      playNotificationSound();
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    return () => {
      if (socket.connected) {
        socket.emit("leaveVendorRoom", user.id);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  // Re-run if auth state or user id changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, user?.role]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
