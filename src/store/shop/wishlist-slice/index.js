import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:5000/api/shop/wishlist";

const initialState = {
  items: [],
  count: 0,
  isLoading: false,
};

export const fetchWishlist = createAsyncThunk(
  "shopWishlist/fetch",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE}/get/${userId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const addToWishlist = createAsyncThunk(
  "shopWishlist/add",
  async ({ userId, productId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE}/add`,
        { userId, productId },
        { withCredentials: true }
      );
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  "shopWishlist/remove",
  async ({ userId, productId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${BASE}/${userId}/${productId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const wishlistSlice = createSlice({
  name: "shopWishlist",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload?.data?.items || [];
        state.count = action.payload?.data?.count || 0;
      })
      .addCase(fetchWishlist.rejected, (state) => {
        state.isLoading = false;
        state.items = [];
        state.count = 0;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.items = action.payload?.data?.items || [];
        state.count = action.payload?.data?.count || 0;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = action.payload?.data?.items || [];
        state.count = action.payload?.data?.count || 0;
      });
  },
});

export default wishlistSlice.reducer;
