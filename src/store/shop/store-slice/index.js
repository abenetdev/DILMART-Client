import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:5000/api/shop/store";

const initialState = {
  isLoading: false,
  storeData:  null,   // { store, products, productCount }
  allStores:  [],
  error:      null,
};

export const getStoreBySlug = createAsyncThunk(
  "shopStore/getBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE}/${slug}`);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const getAllStores = createAsyncThunk(
  "shopStore/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(BASE);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const shopStoreSlice = createSlice({
  name: "shopStore",
  initialState,
  reducers: {
    clearStoreData: (state) => {
      state.storeData = null;
      state.error     = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStoreBySlug.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
        state.storeData = null;
      })
      .addCase(getStoreBySlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.storeData = action.payload.data;
      })
      .addCase(getStoreBySlug.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload?.message || "Store not found";
      })
      .addCase(getAllStores.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllStores.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allStores = action.payload.data;
      })
      .addCase(getAllStores.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { clearStoreData } = shopStoreSlice.actions;
export default shopStoreSlice.reducer;
