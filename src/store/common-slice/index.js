import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const initialState = {
  isLoading: false,
  featureImageList: [],
};

// Fetch active banners for the homepage from the new Banner collection
export const getFeatureImages = createAsyncThunk(
  "commonFeature/getFeatureImages",
  async () => {
    const response = await axios.get("/api/shop/home/banners");
    return response.data;
  }
);

// Legacy thunk kept for any remaining usages
export const addFeatureImage = createAsyncThunk(
  "commonFeature/addFeatureImage",
  async (image) => {
    const response = await axios.post("/api/common/feature/add", { image });
    return response.data;
  }
);

const commonSlice = createSlice({
  name: "commonSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getFeatureImages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getFeatureImages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featureImageList = action.payload.data;
      })
      .addCase(getFeatureImages.rejected, (state) => {
        state.isLoading = false;
        state.featureImageList = [];
      });
  },
});

export default commonSlice.reducer;
