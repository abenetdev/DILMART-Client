import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  newArrivals:      [],
  trendingProducts: [],
  popularStores:    [],
  superDeals:       [],
};

export const getHomeData = createAsyncThunk(
  "shopHome/getHomeData",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("http://localhost:5000/api/shop/home");
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const shopHomeSlice = createSlice({
  name: "shopHome",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getHomeData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getHomeData.fulfilled, (state, action) => {
        state.isLoading       = false;
        state.newArrivals      = action.payload.data.newArrivals;
        state.trendingProducts = action.payload.data.trendingProducts;
        state.popularStores    = action.payload.data.popularStores;
        state.superDeals       = action.payload.data.superDeals || [];
      })
      .addCase(getHomeData.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export default shopHomeSlice.reducer;
