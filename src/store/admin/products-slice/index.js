import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/admin/products";
const cfg  = { withCredentials: true };

// ── Thunks ─────────────────────────────────────────────────────────────────

export const fetchAdminProducts = createAsyncThunk(
  "adminProductsMgmt/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") q.set(k, v);
      });
      const res = await axios.get(`${BASE}?${q}`, cfg);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const fetchAdminProductStats = createAsyncThunk(
  "adminProductsMgmt/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/stats`, cfg);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const fetchAdminProductById = createAsyncThunk(
  "adminProductsMgmt/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/${id}`, cfg);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const editAdminProduct = createAsyncThunk(
  "adminProductsMgmt/edit",
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}`, data, cfg);
      return { ...res.data, id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const unpublishAdminProduct = createAsyncThunk(
  "adminProductsMgmt/unpublish",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}/unpublish`, { reason }, cfg);
      return { ...res.data, id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const publishAdminProduct = createAsyncThunk(
  "adminProductsMgmt/publish",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}/publish`, {}, cfg);
      return { ...res.data, id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const softDeleteAdminProduct = createAsyncThunk(
  "adminProductsMgmt/softDelete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${BASE}/${id}`, cfg);
      return { ...res.data, id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const restoreAdminProduct = createAsyncThunk(
  "adminProductsMgmt/restore",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/${id}/restore`, {}, cfg);
      return { ...res.data, id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const bulkAdminProductAction = createAsyncThunk(
  "adminProductsMgmt/bulk",
  async ({ action, productIds, reason }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${BASE}/bulk`, { action, productIds, reason }, cfg);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const fetchAdminProductOrders = createAsyncThunk(
  "adminProductsMgmt/fetchOrders",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/${id}/orders`, cfg);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// ── Helper: apply optimistic update to a product in the list ───────────────
function patchInList(list, id, changes) {
  return list.map((p) => (p._id === id ? { ...p, ...changes } : p));
}

// ── Slice ──────────────────────────────────────────────────────────────────
const adminProductsMgmtSlice = createSlice({
  name: "adminProductsMgmt",
  initialState: {
    isListLoading:   false,
    isDetailLoading: false,
    isSubmitting:    false,
    productList:     [],
    productDetails:  null,
    productOrders:   [],
    pagination:      null,
    stats:           null,
    error:           null,
  },
  reducers: {
    clearProductDetails: (state) => {
      state.productDetails = null;
      state.productOrders  = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchAll ────────────────────────────────────────────────────────
      .addCase(fetchAdminProducts.pending, (s) => {
        s.isListLoading = true;
        s.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (s, a) => {
        s.isListLoading = false;
        s.productList   = a.payload.data || [];
        s.pagination    = a.payload.pagination || null;
      })
      .addCase(fetchAdminProducts.rejected, (s, a) => {
        s.isListLoading = false;
        s.error = a.payload?.message || "Failed to load products";
      })

      // ── fetchStats ──────────────────────────────────────────────────────
      .addCase(fetchAdminProductStats.fulfilled, (s, a) => {
        s.stats = a.payload.data || null;
      })

      // ── fetchById ───────────────────────────────────────────────────────
      .addCase(fetchAdminProductById.pending, (s) => {
        s.isDetailLoading = true;
      })
      .addCase(fetchAdminProductById.fulfilled, (s, a) => {
        s.isDetailLoading = false;
        s.productDetails  = a.payload.data;
      })
      .addCase(fetchAdminProductById.rejected, (s) => {
        s.isDetailLoading = false;
      })

      // ── fetchOrders ─────────────────────────────────────────────────────
      .addCase(fetchAdminProductOrders.pending, (s) => {
        s.isDetailLoading = true;
      })
      .addCase(fetchAdminProductOrders.fulfilled, (s, a) => {
        s.isDetailLoading = false;
        s.productOrders   = a.payload.data || [];
      })
      .addCase(fetchAdminProductOrders.rejected, (s) => {
        s.isDetailLoading = false;
      })

      // ── unpublish ───────────────────────────────────────────────────────
      .addCase(unpublishAdminProduct.pending, (s) => {
        s.isSubmitting = true;
        s.error = null;
      })
      .addCase(unpublishAdminProduct.fulfilled, (s, a) => {
        s.isSubmitting = false;
        const id = a.payload.id;
        // Optimistic update: flip adminStatus in the list immediately
        s.productList = patchInList(s.productList, id, {
          adminStatus:     "unpublished",
          effectiveStatus: "UNPUBLISHED",
          unpublishedReason: a.payload.data?.unpublishedReason || "",
          unpublishedAt:   a.payload.data?.unpublishedAt || new Date().toISOString(),
        });
        // Also update detail view if it's open for this product
        if (s.productDetails && s.productDetails._id === id) {
          s.productDetails = { ...s.productDetails, adminStatus: "unpublished", effectiveStatus: "UNPUBLISHED" };
        }
      })
      .addCase(unpublishAdminProduct.rejected, (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message || "Unpublish failed";
      })

      // ── publish ─────────────────────────────────────────────────────────
      .addCase(publishAdminProduct.pending, (s) => {
        s.isSubmitting = true;
        s.error = null;
      })
      .addCase(publishAdminProduct.fulfilled, (s, a) => {
        s.isSubmitting = false;
        const id = a.payload.id;
        s.productList = patchInList(s.productList, id, {
          adminStatus:     "published",
          effectiveStatus: "PUBLISHED",
        });
        if (s.productDetails && s.productDetails._id === id) {
          s.productDetails = { ...s.productDetails, adminStatus: "published", effectiveStatus: "PUBLISHED" };
        }
      })
      .addCase(publishAdminProduct.rejected, (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message || "Republish failed";
      })

      // ── softDelete ──────────────────────────────────────────────────────
      .addCase(softDeleteAdminProduct.pending, (s) => {
        s.isSubmitting = true;
        s.error = null;
      })
      .addCase(softDeleteAdminProduct.fulfilled, (s, a) => {
        s.isSubmitting = false;
        const id = a.payload.id;
        s.productList = patchInList(s.productList, id, {
          isDeleted:       true,
          adminStatus:     "deleted",
          effectiveStatus: "DELETED",
        });
      })
      .addCase(softDeleteAdminProduct.rejected, (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message || "Delete failed";
      })

      // ── restore ─────────────────────────────────────────────────────────
      .addCase(restoreAdminProduct.pending, (s) => {
        s.isSubmitting = true;
        s.error = null;
      })
      .addCase(restoreAdminProduct.fulfilled, (s, a) => {
        s.isSubmitting = false;
        const id = a.payload.id;
        s.productList = patchInList(s.productList, id, {
          isDeleted:       false,
          adminStatus:     "published",
          effectiveStatus: "PUBLISHED",
        });
      })
      .addCase(restoreAdminProduct.rejected, (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message || "Restore failed";
      })

      // ── edit ────────────────────────────────────────────────────────────
      .addCase(editAdminProduct.pending, (s) => { s.isSubmitting = true; s.error = null; })
      .addCase(editAdminProduct.fulfilled, (s, a) => {
        s.isSubmitting = false;
        const id = a.payload.id;
        const updated = a.payload.data || {};
        s.productList = patchInList(s.productList, id, {
          adminCategory: updated.adminCategory,
          adminBrand:    updated.adminBrand,
          adminTags:     updated.adminTags,
        });
      })
      .addCase(editAdminProduct.rejected, (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message || "Edit failed";
      })

      // ── bulk ────────────────────────────────────────────────────────────
      .addCase(bulkAdminProductAction.pending,   (s) => { s.isSubmitting = true; s.error = null; })
      .addCase(bulkAdminProductAction.fulfilled, (s) => { s.isSubmitting = false; })
      .addCase(bulkAdminProductAction.rejected,  (s, a) => {
        s.isSubmitting = false;
        s.error = a.payload?.message || "Bulk action failed";
      });
  },
});

export const { clearProductDetails, clearError } = adminProductsMgmtSlice.actions;
export default adminProductsMgmtSlice.reducer;
