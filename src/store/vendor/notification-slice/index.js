import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:5000/api/vendor/notifications";

// ── Async thunks ───────────────────────────────────────────────────────────

export const fetchNotifications = createAsyncThunk(
  "vendorNotification/fetchNotifications",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { status, type, dateFilter, page = 1, limit = 20 } = params;
      const query = new URLSearchParams();
      if (status)     query.set("status",     status);
      if (type)       query.set("type",        type);
      if (dateFilter) query.set("dateFilter",  dateFilter);
      query.set("page",  page);
      query.set("limit", limit);

      const res = await axios.get(`${BASE}?${query.toString()}`, {
        withCredentials: true,
      });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "vendorNotification/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/unread-count`, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "vendorNotification/markSingleRead",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}/read`, {}, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "vendorNotification/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/read-all`, {}, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "vendorNotification/deleteSingle",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${BASE}/${id}`, { withCredentials: true });
      return { id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const deleteNotificationsBulk = createAsyncThunk(
  "vendorNotification/deleteBulk",
  async (notificationIds, { rejectWithValue }) => {
    try {
      await axios.delete(`${BASE}`, {
        data: { notificationIds },
        withCredentials: true,
      });
      return { notificationIds };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const deleteAllReadNotifications = createAsyncThunk(
  "vendorNotification/deleteAllRead",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${BASE}/read`, { withCredentials: true });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// ── Initial state ──────────────────────────────────────────────────────────

const initialState = {
  notifications:  [],
  unreadCount:    0,
  pagination:     { page: 1, limit: 20, total: 0, totalPages: 1 },
  isLoading:      false,
  isActionLoading: false,
  error:          null,
  // Filters
  filters: {
    status:     "all",
    type:       "all",
    dateFilter: "",
    page:       1,
    limit:      20,
  },
};

// ── Slice ──────────────────────────────────────────────────────────────────

const vendorNotificationSlice = createSlice({
  name: "vendorNotification",
  initialState,
  reducers: {
    // Called by SocketProvider when a real-time notification arrives
    prependNotification: (state, action) => {
      const incoming = action.payload; // shape: { notificationId, title, message, orderId, createdAt }
      // Build a minimal notification object that matches the DB shape
      const newItem = {
        _id:               incoming.notificationId,
        title:             incoming.title,
        message:           incoming.message,
        relatedEntityId:   incoming.orderId,
        relatedEntityType: "order",
        type:              "NEW_ORDER",
        isRead:            false,
        createdAt:         incoming.createdAt,
        recipientRole:     "vendor",
      };
      state.notifications.unshift(newItem);
      state.unreadCount += 1;
      state.pagination.total += 1;
    },

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },

    setPage: (state, action) => {
      state.filters.page = action.payload;
    },

    // Optimistic: mark one read in-place
    optimisticMarkRead: (state, action) => {
      const id = action.payload;
      const item = state.notifications.find((n) => n._id === id);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    // Optimistic: remove one from list
    optimisticRemove: (state, action) => {
      const id = action.payload;
      const item = state.notifications.find((n) => n._id === id);
      if (item && !item.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter((n) => n._id !== id);
      state.pagination.total = Math.max(0, state.pagination.total - 1);
    },
  },
  extraReducers: (builder) => {
    // fetchNotifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading    = false;
        const d = action.payload?.data;
        if (d) {
          state.notifications = d.notifications  || [];
          state.unreadCount   = d.unreadCount    ?? state.unreadCount;
          state.pagination    = d.pagination     || state.pagination;
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload?.message || "Failed to load notifications";
      });

    // fetchUnreadCount
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload?.data?.unreadCount ?? state.unreadCount;
      });

    // markNotificationRead
    builder
      .addCase(markNotificationRead.pending, (state) => { state.isActionLoading = true; })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const updated = action.payload?.data;
        if (updated) {
          const idx = state.notifications.findIndex((n) => n._id === updated._id);
          if (idx !== -1) state.notifications[idx] = updated;
          // Recount
          state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
        }
      })
      .addCase(markNotificationRead.rejected, (state) => { state.isActionLoading = false; });

    // markAllNotificationsRead
    builder
      .addCase(markAllNotificationsRead.pending, (state) => { state.isActionLoading = true; })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.isActionLoading = false;
        state.notifications   = state.notifications.map((n) => ({ ...n, isRead: true }));
        state.unreadCount     = 0;
      })
      .addCase(markAllNotificationsRead.rejected, (state) => { state.isActionLoading = false; });

    // deleteNotification
    builder
      .addCase(deleteNotification.pending, (state) => { state.isActionLoading = true; })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const { id } = action.payload;
        const item = state.notifications.find((n) => n._id === id);
        if (item && !item.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications   = state.notifications.filter((n) => n._id !== id);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteNotification.rejected, (state) => { state.isActionLoading = false; });

    // deleteNotificationsBulk
    builder
      .addCase(deleteNotificationsBulk.pending, (state) => { state.isActionLoading = true; })
      .addCase(deleteNotificationsBulk.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const { notificationIds } = action.payload;
        const idSet = new Set(notificationIds);
        const removedUnread = state.notifications.filter(
          (n) => idSet.has(n._id) && !n.isRead
        ).length;
        state.notifications    = state.notifications.filter((n) => !idSet.has(n._id));
        state.unreadCount      = Math.max(0, state.unreadCount - removedUnread);
        state.pagination.total = Math.max(0, state.pagination.total - notificationIds.length);
      })
      .addCase(deleteNotificationsBulk.rejected, (state) => { state.isActionLoading = false; });

    // deleteAllReadNotifications
    builder
      .addCase(deleteAllReadNotifications.pending, (state) => { state.isActionLoading = true; })
      .addCase(deleteAllReadNotifications.fulfilled, (state) => {
        state.isActionLoading = false;
        const removed = state.notifications.filter((n) => n.isRead).length;
        state.notifications    = state.notifications.filter((n) => !n.isRead);
        state.pagination.total = Math.max(0, state.pagination.total - removed);
      })
      .addCase(deleteAllReadNotifications.rejected, (state) => { state.isActionLoading = false; });
  },
});

export const {
  prependNotification,
  setFilters,
  setPage,
  optimisticMarkRead,
  optimisticRemove,
} = vendorNotificationSlice.actions;

export default vendorNotificationSlice.reducer;
