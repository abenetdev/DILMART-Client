import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/shop/categories";

export const fetchFeaturedCategories = createAsyncThunk(
  "shopCategory/fetchFeatured",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/featured`);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const fetchAllActiveCategories = createAsyncThunk(
  "shopCategory/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(BASE);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const shopCategorySlice = createSlice({
  name: "shopCategory",
  initialState: {
    featured:  [],
    all:       [],
    isLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeaturedCategories.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchFeaturedCategories.fulfilled, (s, a) => {
        s.isLoading = false;
        s.featured  = a.payload.data || [];
      })
      .addCase(fetchFeaturedCategories.rejected,  (s) => { s.isLoading = false; })

      .addCase(fetchAllActiveCategories.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchAllActiveCategories.fulfilled, (s, a) => {
        s.isLoading = false;
        s.all       = a.payload.data || [];
      })
      .addCase(fetchAllActiveCategories.rejected,  (s) => { s.isLoading = false; });
  },
});

export default shopCategorySlice.reducer;
