import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE  = "/api/shop/products/super-deals";
const LIMIT = 12;

const initialState = {
  isLoading:    false,
  isLoadingMore: false,
  deals:        [],
  hasMore:      true,
  currentPage:  1,
  total:        0,
  error:        null,
};

// Replaces the list — used on first load / filter change
export const fetchSuperDeals = createAsyncThunk(
  "shopSuperDeals/fetch",
  async ({ sort = "expiry", category = "all", page = 1 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ sort, page, limit: LIMIT });
      if (category && category !== "all") params.append("category", category);
      const res = await axios.get(`${BASE}?${params.toString()}`);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

// Appends to the list — used by infinite scroll
export const fetchMoreSuperDeals = createAsyncThunk(
  "shopSuperDeals/fetchMore",
  async ({ sort = "expiry", category = "all", page } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ sort, page, limit: LIMIT });
      if (category && category !== "all") params.append("category", category);
      const res = await axios.get(`${BASE}?${params.toString()}`);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const shopSuperDealsSlice = createSlice({
  name: "shopSuperDeals",
  initialState,
  reducers: {
    clearDeals: (state) => {
      state.deals       = [];
      state.hasMore     = true;
      state.currentPage = 1;
      state.total       = 0;
      state.error       = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchSuperDeals (reset) ──
      .addCase(fetchSuperDeals.pending, (state) => {
        state.isLoading   = true;
        state.deals       = [];
        state.hasMore     = true;
        state.currentPage = 1;
        state.error       = null;
      })
      .addCase(fetchSuperDeals.fulfilled, (state, action) => {
        const { data, pagination } = action.payload;
        state.isLoading   = false;
        state.deals       = data ?? [];
        state.total       = pagination?.total ?? 0;
        state.hasMore     = (data?.length ?? 0) < (pagination?.total ?? 0);
        state.currentPage = 1;
      })
      .addCase(fetchSuperDeals.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload?.message || "Failed to load deals";
      })

      // ── fetchMoreSuperDeals (append) ──
      .addCase(fetchMoreSuperDeals.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreSuperDeals.fulfilled, (state, action) => {
        const { data, pagination } = action.payload;
        state.isLoadingMore = false;
        state.deals         = [...state.deals, ...(data ?? [])];
        state.total         = pagination?.total ?? state.total;
        state.hasMore       = state.deals.length < state.total;
        state.currentPage  += 1;
      })
      .addCase(fetchMoreSuperDeals.rejected, (state) => {
        state.isLoadingMore = false;
      });
  },
});

export const { clearDeals } = shopSuperDealsSlice.actions;
export default shopSuperDealsSlice.reducer;
