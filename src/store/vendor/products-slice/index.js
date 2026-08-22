import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const initialState = {
  isListLoading: false,   // true only during the very first page load
  isLoadingMore: false,   // true while appending subsequent pages
  isSubmitting:  false,
  productList:   [],
  productDetails: null,
  error: null,

  // ── Infinite-scroll pagination state ──────────────────────────────────
  currentPage:  0,        // last page that was successfully fetched (0 = none yet)
  hasNextPage:  true,     // whether the API says more pages exist
};

// ── Helper: build the filter query string ─────────────────────────────────
function buildFilterQS({ status, category, search, page = 1, limit = 20 } = {}) {
  const p = [];
  if (status   && status   !== "all") p.push(`status=${encodeURIComponent(status)}`);
  if (category && category !== "all") p.push(`category=${encodeURIComponent(category)}`);
  if (search)                          p.push(`search=${encodeURIComponent(search)}`);
  p.push(`page=${page}`);
  p.push(`limit=${limit}`);
  return p.join("&");
}

// ── fetchProductsPage — loads one page and APPENDS to productList ─────────
// Used by the infinite-scroll logic on the Products page.
// page=1 replaces the list; page>1 appends.
export const fetchProductsPage = createAsyncThunk(
  "/vendor/products/fetchProductsPage",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, status, category, search } = params;
      const qs     = buildFilterQS({ status, category, search, page, limit });
      const result = await axios.get(`/api/vendor/products/get?${qs}`, { withCredentials: true });
      return { ...result.data, page, isFirstPage: page === 1 };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ── fetchAllProducts — kept for post-mutation refreshes (edit/delete) ─────
// Re-fetches only the products that were already loaded so the list stays
// consistent after an add/edit/delete without restarting infinite scroll.
export const fetchAllProducts = createAsyncThunk(
  "/vendor/products/fetchAllProducts",
  async (params = {}, { getState }) => {
    const { currentPage } = getState().vendorProducts;
    const { status, category, search } = params;

    // Re-fetch everything up to the current page in one call so the vendor
    // doesn't lose their scroll position context after mutating a product.
    const pagesLoaded = Math.max(1, currentPage);
    const qs = buildFilterQS({ status, category, search, page: 1, limit: pagesLoaded * 20 });
    const result = await axios.get(`/api/vendor/products/get?${qs}`, { withCredentials: true });
    return result?.data;
  }
);

export const addNewProduct = createAsyncThunk(
  "/vendor/products/addnewproduct",
  async (formData, { rejectWithValue }) => {
    try {
      const result = await axios.post(
        "/api/vendor/products/add",
        formData,
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      return result?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getProductById = createAsyncThunk(
  "/vendor/products/getProductById",
  async (id) => {
    const result = await axios.get(`/api/vendor/products/get/${id}`, { withCredentials: true });
    return result?.data;
  }
);

export const editProduct = createAsyncThunk(
  "/vendor/products/editProduct",
  async ({ id, formData }) => {
    const result = await axios.put(
      `/api/vendor/products/edit/${id}`,
      formData,
      { headers: { "Content-Type": "application/json" }, withCredentials: true }
    );
    return result?.data;
  }
);

export const deleteProduct = createAsyncThunk(
  "/vendor/products/deleteProduct",
  async (id) => {
    const result = await axios.delete(`/api/vendor/products/delete/${id}`, { withCredentials: true });
    return result?.data;
  }
);

export const bulkUpdateStatus = createAsyncThunk(
  "/vendor/products/bulkUpdateStatus",
  async ({ productIds, status, storeId }) => {
    const result = await axios.put(
      "/api/vendor/products/bulk-status",
      { productIds, status, storeId },
      { headers: { "Content-Type": "application/json" }, withCredentials: true }
    );
    return result?.data;
  }
);

export const setSuperDeal = createAsyncThunk(
  "/vendor/products/setSuperDeal",
  async ({ id, dealPrice, dealTitle, expiresAt }, { rejectWithValue }) => {
    try {
      const result = await axios.put(
        `/api/vendor/products/super-deal/${id}`,
        { dealPrice, dealTitle, expiresAt },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      return result?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const cancelSuperDeal = createAsyncThunk(
  "/vendor/products/cancelSuperDeal",
  async (id, { rejectWithValue }) => {
    try {
      const result = await axios.delete(
        `/api/vendor/products/super-deal/${id}`,
        { withCredentials: true }
      );
      return result?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────
const VendorProductsSlice = createSlice({
  name: "vendorProducts",
  initialState,
  reducers: {
    clearProductDetails: (state) => {
      state.productDetails = null;
    },
    // Called by the Products page when filters/search change so the next
    // fetchProductsPage(page=1) starts clean.
    resetProducts: (state) => {
      state.productList  = [];
      state.currentPage  = 0;
      state.hasNextPage  = true;
      state.isListLoading = false;
      state.isLoadingMore = false;
      state.error         = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchProductsPage ────────────────────────────────────────────────
      .addCase(fetchProductsPage.pending, (state, action) => {
        const isFirst = (action.meta.arg?.page ?? 1) === 1;
        if (isFirst) {
          state.isListLoading = true;
          state.productList   = [];       // clear stale results for fresh filter
        } else {
          state.isLoadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchProductsPage.fulfilled, (state, action) => {
        const { data = [], hasNextPage = false, page, isFirstPage } = action.payload;

        if (isFirstPage) {
          state.productList  = data;
          state.isListLoading = false;
        } else {
          // Append, dedup by _id in case the observer fires twice
          const existingIds = new Set(state.productList.map((p) => p._id));
          const fresh = data.filter((p) => !existingIds.has(p._id));
          state.productList  = [...state.productList, ...fresh];
          state.isLoadingMore = false;
        }

        state.currentPage = page;
        state.hasNextPage = hasNextPage;
      })
      .addCase(fetchProductsPage.rejected, (state, action) => {
        state.isListLoading = false;
        state.isLoadingMore = false;
        state.error = action.payload?.message || "Failed to load products";
      })

      // ── fetchAllProducts (post-mutation refresh) ─────────────────────────
      .addCase(fetchAllProducts.pending, (state) => {
        state.isListLoading = true;
        state.error = null;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.isListLoading = false;
        state.productList   = action.payload?.data || [];
        // Preserve pagination: hasNextPage from server, keep currentPage as-is
        if (action.payload?.hasNextPage !== undefined) {
          state.hasNextPage = action.payload.hasNextPage;
        }
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.isListLoading = false;
        state.error = action.error?.message || "Failed to load products";
      })

      // ── addNewProduct ────────────────────────────────────────────────────
      .addCase(addNewProduct.pending,   (state) => { state.isSubmitting = true; })
      .addCase(addNewProduct.fulfilled, (state) => { state.isSubmitting = false; })
      .addCase(addNewProduct.rejected,  (state) => { state.isSubmitting = false; })

      // ── getProductById ───────────────────────────────────────────────────
      .addCase(getProductById.pending,   (state) => { state.isSubmitting = true; })
      .addCase(getProductById.fulfilled, (state, action) => {
        state.isSubmitting  = false;
        state.productDetails = action.payload.data;
      })
      .addCase(getProductById.rejected,  (state) => {
        state.isSubmitting   = false;
        state.productDetails = null;
      })

      // ── editProduct ──────────────────────────────────────────────────────
      .addCase(editProduct.pending,   (state) => { state.isSubmitting = true; })
      .addCase(editProduct.fulfilled, (state) => { state.isSubmitting = false; })
      .addCase(editProduct.rejected,  (state) => { state.isSubmitting = false; })

      // ── deleteProduct ────────────────────────────────────────────────────
      .addCase(deleteProduct.pending,   (state) => { state.isSubmitting = true; })
      .addCase(deleteProduct.fulfilled, (state) => { state.isSubmitting = false; })
      .addCase(deleteProduct.rejected,  (state) => { state.isSubmitting = false; })

      // ── setSuperDeal / cancelSuperDeal ───────────────────────────────────
      .addCase(setSuperDeal.pending,      (state) => { state.isSubmitting = true; })
      .addCase(setSuperDeal.fulfilled,    (state) => { state.isSubmitting = false; })
      .addCase(setSuperDeal.rejected,     (state) => { state.isSubmitting = false; })
      .addCase(cancelSuperDeal.pending,   (state) => { state.isSubmitting = true; })
      .addCase(cancelSuperDeal.fulfilled, (state) => { state.isSubmitting = false; })
      .addCase(cancelSuperDeal.rejected,  (state) => { state.isSubmitting = false; });
  },
});

export const { clearProductDetails, resetProducts } = VendorProductsSlice.actions;
export default VendorProductsSlice.reducer;
