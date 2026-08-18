import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/admin/banners";
const cfg  = { withCredentials: true };

// ── Thunks ─────────────────────────────────────────────────────────────────

export const fetchAdminBanners = createAsyncThunk(
  "adminBanner/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(BASE, cfg);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const createAdminBanner = createAsyncThunk(
  "adminBanner/create",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post(BASE, formData, {
        ...cfg,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const updateAdminBanner = createAsyncThunk(
  "adminBanner/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}`, formData, {
        ...cfg,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const deleteAdminBanner = createAsyncThunk(
  "adminBanner/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${BASE}/${id}`, cfg);
      return { ...res.data, id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const toggleAdminBanner = createAsyncThunk(
  "adminBanner/toggle",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}/toggle`, {}, cfg);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const reorderAdminBanners = createAsyncThunk(
  "adminBanner/reorder",
  async (orders, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/reorder`, { orders }, cfg);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────
const adminBannerSlice = createSlice({
  name: "adminBanner",
  initialState: {
    isLoading:    false,
    isSubmitting: false,
    banners:      [],
    error:        null,
  },
  reducers: {
    clearBannerError: (s) => { s.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchAdminBanners.pending,   (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchAdminBanners.fulfilled, (s, a) => {
        s.isLoading = false;
        s.banners   = a.payload.data || [];
      })
      .addCase(fetchAdminBanners.rejected,  (s, a) => {
        s.isLoading = false;
        s.error = a.payload?.message || "Failed to load banners";
      })

      // create
      .addCase(createAdminBanner.pending,   (s) => { s.isSubmitting = true; s.error = null; })
      .addCase(createAdminBanner.fulfilled, (s, a) => {
        s.isSubmitting = false;
        s.banners = [...s.banners, a.payload.data].sort((a, b) => a.order - b.order);
      })
      .addCase(createAdminBanner.rejected,  (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message || "Failed to create banner";
      })

      // update
      .addCase(updateAdminBanner.pending,   (s) => { s.isSubmitting = true; s.error = null; })
      .addCase(updateAdminBanner.fulfilled, (s, a) => {
        s.isSubmitting = false;
        s.banners = s.banners
          .map((b) => (b._id === a.payload.data._id ? a.payload.data : b))
          .sort((a, b) => a.order - b.order);
      })
      .addCase(updateAdminBanner.rejected,  (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message || "Failed to update banner";
      })

      // delete
      .addCase(deleteAdminBanner.pending,   (s) => { s.isSubmitting = true; })
      .addCase(deleteAdminBanner.fulfilled, (s, a) => {
        s.isSubmitting = false;
        s.banners = s.banners.filter((b) => b._id !== a.payload.id);
      })
      .addCase(deleteAdminBanner.rejected,  (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message || "Failed to delete banner";
      })

      // toggle
      .addCase(toggleAdminBanner.fulfilled, (s, a) => {
        s.banners = s.banners.map((b) =>
          b._id === a.payload.data._id ? a.payload.data : b
        );
      })

      // reorder (optimistic — no state change needed, list was already reordered locally)
      .addCase(reorderAdminBanners.rejected, (s, a) => {
        s.error = a.payload?.message || "Failed to reorder banners";
      });
  },
});

export const { clearBannerError } = adminBannerSlice.actions;
export default adminBannerSlice.reducer;
