import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const BASE = "/api/shop/brands";

export const fetchAllActiveBrands = createAsyncThunk(
  "shopBrand/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(BASE);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const shopBrandSlice = createSlice({
  name: "shopBrand",
  initialState: {
    all:       [],
    isLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllActiveBrands.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchAllActiveBrands.fulfilled, (s, a) => {
        s.isLoading = false;
        s.all       = a.payload.data || [];
      })
      .addCase(fetchAllActiveBrands.rejected,  (s) => { s.isLoading = false; });
  },
});

export default shopBrandSlice.reducer;
