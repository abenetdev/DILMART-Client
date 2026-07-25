/**
 * NotificationBell
 *
 * Renders the bell icon with unread badge + dropdown preview for the vendor header.
 * On mount it fetches the latest notifications. Real-time updates come via Redux
 * (dispatched by SocketContext). Clicking a notification marks it read and
 * navigates to the related order.
 */

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, PackageCheck, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/store/vendor/notification-slice";
import { formatDistanceToNow } from "@/lib/timeUtils";

export default function NotificationBell() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { notifications, unreadCount, isLoading } = useSelector(
    (s) => s.vendorNotification
  );

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchNotifications({ limit: 8 }));
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleBellClick() {
    setOpen((prev) => !prev);
  }

  function handleNotificationClick(notification) {
    if (!notification.isRead) {
      dispatch(markNotificationRead(notification._id));
    }
    setOpen(false);
    if (notification.relatedEntityId) {
      navigate(`/vendor/orders/${notification.relatedEntityId}`);
    }
  }

  function handleMarkAllRead(e) {
    e.stopPropagation();
    dispatch(markAllNotificationsRead());
  }

  function handleViewAll(e) {
    e.stopPropagation();
    setOpen(false);
    navigate("/vendor/notifications");
  }

  const previewList = notifications.slice(0, 8);
  const cappedBadge = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={handleBellClick}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-primary animate-[ring_0.5s_ease-in-out]" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 min-w-[1rem] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none px-0.5">
            {cappedBadge}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-background shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                  {cappedBadge}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-primary hover:text-primary"
                onClick={handleMarkAllRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[360px] overflow-y-auto">
            {isLoading && previewList.length === 0 ? (
              <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : previewList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  New orders will appear here
                </p>
              </div>
            ) : (
              previewList.map((n) => (
                <NotificationItem
                  key={n._id}
                  notification={n}
                  onClick={() => handleNotificationClick(n)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {previewList.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full text-sm text-primary justify-between"
                onClick={handleViewAll}
              >
                View all notifications
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Single notification row in dropdown ───────────────────────────────────

function NotificationItem({ notification, onClick }) {
  const { title, message, isRead, createdAt } = notification;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors
        ${isRead
          ? "hover:bg-muted/50"
          : "bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary"
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-0.5
          ${isRead ? "bg-muted" : "bg-primary/10"}
        `}>
          <PackageCheck className={`h-4 w-4 ${isRead ? "text-muted-foreground" : "text-primary"}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-tight truncate ${isRead ? "font-normal text-foreground" : "font-semibold text-foreground"}`}>
            {title}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{message}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            {formatDistanceToNow(createdAt)}
          </p>
        </div>

        {/* Unread dot */}
        {!isRead && (
          <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />
        )}
      </div>
    </button>
  );
}
