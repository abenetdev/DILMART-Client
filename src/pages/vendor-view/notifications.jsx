/**
 * Vendor Notifications Page — /vendor/notifications
 *
 * Features:
 *  - Notification list with pagination
 *  - Status / type / date filters
 *  - Mark single or all as read
 *  - Single delete, bulk checkbox delete, delete all read
 *  - Confirmation modal before bulk/all-read delete
 *  - Loading skeletons, empty state, error state
 */

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BellOff,
  PackageCheck,
  Check,
  CheckCheck,
  Trash2,
  Trash,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteNotificationsBulk,
  deleteAllReadNotifications,
  setFilters,
  setPage,
  optimisticMarkRead,
  optimisticRemove,
} from "@/store/vendor/notification-slice";
import { formatDistanceToNow, formatDate } from "@/lib/timeUtils";
import { useFCM } from "@/hooks/useFCM";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, BellRing, BellOff as BellOffIcon, Loader2 } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "all",    label: "All"    },
  { value: "unread", label: "Unread" },
  { value: "read",   label: "Read"   },
];

const TYPE_OPTIONS = [
  { value: "all",       label: "All Types"  },
  { value: "NEW_ORDER", label: "New Order"  },
];

const DATE_OPTIONS = [
  { value: "any",        label: "Any time"   },
  { value: "today",      label: "Today"      },
  { value: "this_week",  label: "This week"  },
  { value: "this_month", label: "This month" },
];

// ── Page component ─────────────────────────────────────────────────────────

export default function VendorNotificationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    isActionLoading,
    error,
    filters,
  } = useSelector((s) => s.vendorNotification);

  // Local UI state
  const [selectedIds, setSelectedIds]     = useState(new Set());
  const [confirmModal, setConfirmModal]   = useState(null); // { type: "bulk"|"read", count: N }
  const [successMsg, setSuccessMsg]       = useState("");

  // Fetch whenever filters change
  useEffect(() => {
    setSelectedIds(new Set());
    dispatch(fetchNotifications(filters));
  }, [dispatch, filters]);

  // Auto-clear success messages
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // ── Filter handlers ──────────────────────────────────────────────────────

  function handleFilterChange(key, value) {
    dispatch(setFilters({ [key]: value }));
  }

  function handlePageChange(newPage) {
    dispatch(setPage(newPage));
  }

  // ── Selection ────────────────────────────────────────────────────────────

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n._id)));
    }
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  function handleClickNotification(n) {
    if (!n.isRead) {
      dispatch(optimisticMarkRead(n._id));
      dispatch(markNotificationRead(n._id));
    }
    if (n.relatedEntityId) {
      navigate(`/vendor/orders/${n.relatedEntityId}`);
    }
  }

  function handleMarkAllRead() {
    dispatch(markAllNotificationsRead()).then((res) => {
      if (!res.error) setSuccessMsg("All notifications marked as read");
    });
  }

  function handleDeleteSingle(e, id) {
    e.stopPropagation();
    dispatch(optimisticRemove(id));
    dispatch(deleteNotification(id)).then((res) => {
      if (!res.error) setSuccessMsg("Notification deleted");
    });
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  function handleBulkDeleteConfirm() {
    const ids = Array.from(selectedIds);
    setConfirmModal(null);
    dispatch(deleteNotificationsBulk(ids)).then((res) => {
      if (!res.error) {
        setSuccessMsg(`${ids.length} notification(s) deleted`);
        setSelectedIds(new Set());
      }
    });
  }

  function handleDeleteAllReadConfirm() {
    setConfirmModal(null);
    dispatch(deleteAllReadNotifications()).then((res) => {
      if (!res.error) setSuccessMsg("All read notifications cleared");
    });
  }

  const readCount = notifications.filter((n) => n.isRead).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-xs text-muted-foreground">
              {pagination.total} total
              {unreadCount > 0 && ` · ${unreadCount} unread`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mark all read */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isActionLoading}
              className="gap-1.5"
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Mark all read</span>
            </Button>
          )}

          {/* Delete all read */}
          {readCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModal({ type: "read", count: readCount })}
              disabled={isActionLoading}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
              <span className="hidden sm:inline">Clear read</span>
            </Button>
          )}

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(fetchNotifications(filters))}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Push notification opt-in card */}
      <PushNotificationCard />

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2 rounded-lg">
          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 rounded-xl border">
        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />

        <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={(v) => handleFilterChange("type", v)}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.dateFilter || "any"}
          onValueChange={(v) => handleFilterChange("dateFilter", v === "any" ? "" : v)}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset filters */}
        {(filters.status !== "all" || filters.type !== "all" || filters.dateFilter) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() =>
              dispatch(setFilters({ status: "all", type: "all", dateFilter: "" }))
            }
          >
            Reset
          </Button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              setConfirmModal({ type: "bulk", count: selectedIds.size })
            }
            disabled={isActionLoading}
            className="gap-1.5 ml-auto"
          >
            <Trash2 className="h-4 w-4" />
            Delete selected
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Notification list */}
      <div className="bg-background border rounded-xl overflow-hidden">
        {/* Select-all header */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/20">
            <Checkbox
              checked={
                selectedIds.size === notifications.length && notifications.length > 0
              }
              onCheckedChange={toggleSelectAll}
              aria-label="Select all"
            />
            <span className="text-xs text-muted-foreground">
              Select all on this page
            </span>
          </div>
        )}

        {/* List body */}
        {isLoading && notifications.length === 0 ? (
          <LoadingSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          notifications.map((n) => (
            <NotificationRow
              key={n._id}
              notification={n}
              selected={selectedIds.has(n._id)}
              onSelect={() => toggleSelect(n._id)}
              onClick={() => handleClickNotification(n)}
              onDelete={(e) => handleDeleteSingle(e, n._id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
            <span className="ml-2 text-xs">({pagination.total} total)</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pg = i + 1;
              return (
                <Button
                  key={pg}
                  variant={pg === pagination.page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => handlePageChange(pg)}
                  disabled={isLoading}
                >
                  {pg}
                </Button>
              );
            })}

            {pagination.totalPages > 5 && <span className="text-muted-foreground text-sm px-1">…</span>}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={
          confirmModal?.type === "bulk"
            ? handleBulkDeleteConfirm
            : handleDeleteAllReadConfirm
        }
        title={
          confirmModal?.type === "bulk"
            ? `Delete ${confirmModal?.count} notification(s)?`
            : `Clear ${confirmModal?.count} read notification(s)?`
        }
        description="This action cannot be undone."
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function NotificationRow({ notification, selected, onSelect, onClick, onDelete }) {
  const { title, message, isRead, type, createdAt } = notification;

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3.5 border-b last:border-b-0 cursor-pointer
        transition-colors group
        ${isRead
          ? "hover:bg-muted/40"
          : "bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary"
        }
        ${selected ? "bg-primary/10" : ""}
      `}
      onClick={onClick}
    >
      {/* Checkbox */}
      <div
        className="flex-shrink-0 pt-0.5"
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          aria-label="Select notification"
        />
      </div>

      {/* Type icon */}
      <div className={`
        flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center mt-0.5
        ${isRead ? "bg-muted" : "bg-primary/10"}
      `}>
        <PackageCheck className={`h-4 w-4 ${isRead ? "text-muted-foreground" : "text-primary"}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm leading-snug ${isRead ? "font-normal" : "font-semibold"}`}>
            {title}
          </span>
          <Badge
            variant={isRead ? "secondary" : "default"}
            className="text-[10px] h-4 px-1.5 shrink-0"
          >
            {type === "NEW_ORDER" ? "New Order" : type}
          </Badge>
          {!isRead && (
            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{message}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
          <span>{formatDistanceToNow(createdAt)}</span>
          <span>·</span>
          <span>{formatDate(createdAt)}</span>
        </p>
      </div>

      {/* Actions */}
      <div
        className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {!isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            title="Mark as read"
            onClick={(e) => {
              e.stopPropagation();
              onClick(); // mark read + navigate
            }}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          title="Delete"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <BellOff className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No notifications</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        You're all caught up! New order notifications will appear here.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="divide-y">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3.5">
          <Skeleton className="h-4 w-4 rounded mt-0.5" />
          <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title, description }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Push Notification Opt-In Card ─────────────────────────────────────────
/**
 * PushNotificationCard
 *
 * Minimal UI to let a vendor enable or disable browser push notifications.
 * Placed at the top of the Notifications page so it is discoverable without
 * cluttering the main list.
 *
 * Uses the useFCM() hook — all FCM logic lives there.
 * This component only handles rendering and user feedback.
 *
 * Spec constraints respected:
 *  - No redesign of existing pages
 *  - No custom install popup
 *  - No notification preferences / history
 *  - Uses existing DilMart Card/Switch/Button/Badge styling
 */
function PushNotificationCard() {
  const {
    isSupported,
    isEnabled,
    isLoading,
    isRegistering,
    error,
    enable,
    disable,
  } = useFCM();

  const [localSuccess, setLocalSuccess] = React.useState("");

  // Auto-clear success message after 4 s
  React.useEffect(() => {
    if (!localSuccess) return;
    const t = setTimeout(() => setLocalSuccess(""), 4000);
    return () => clearTimeout(t);
  }, [localSuccess]);

  async function handleToggle() {
    if (isEnabled) {
      const ok = await disable();
      if (ok) setLocalSuccess("Push notifications disabled.");
    } else {
      const ok = await enable();
      if (ok) setLocalSuccess("Push notifications enabled! You'll be notified when a new order arrives.");
    }
  }

  // Don't render the card if the browser definitely doesn't support FCM
  // (checked after the async isSupported resolves — while loading show skeleton)
  if (!isLoading && !isSupported) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 py-4 px-5">
          <BellOffIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Push notifications are not supported in this browser. Try Chrome or Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-4 px-5">
        {/* Loading skeleton while checking backend status */}
        {isLoading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        ) : (
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`
              flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center mt-0.5
              ${isEnabled ? "bg-primary/10" : "bg-muted"}
            `}>
              {isEnabled
                ? <BellRing className="h-4 w-4 text-primary" />
                : <Smartphone className="h-4 w-4 text-muted-foreground" />
              }
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold">
                  {isEnabled ? "Order Notifications Enabled" : "Enable Order Notifications"}
                </span>
                {isEnabled && (
                  <Badge variant="default" className="text-[10px] h-4 px-1.5">Active</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEnabled
                  ? "You'll receive a push notification on this device when a customer places an order."
                  : "Get notified immediately when a customer places an order, even when the dashboard isn't open."
                }
              </p>

              {/* Success feedback */}
              {localSuccess && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {localSuccess}
                </p>
              )}

              {/* Error feedback */}
              {error && (
                <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {error}
                </p>
              )}
            </div>

            {/* Toggle switch */}
            <div className="flex-shrink-0 flex items-center gap-2 mt-0.5">
              {isRegistering && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggle}
                disabled={isRegistering || isLoading}
                aria-label={isEnabled ? "Disable push notifications" : "Enable push notifications"}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
