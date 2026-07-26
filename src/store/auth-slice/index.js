import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
};

export const registerUser = createAsyncThunk(
  "/auth/register",

  async (formData) => {
    const response = await axios.post(
      "/api/auth/register",
      formData,
      {
        withCredentials: true,
      }
    );

    return response.data;
  }
);

export const loginUser = createAsyncThunk(
  "/auth/login",

  async (formData) => {
    const response = await axios.post(
      "/api/auth/login",
      formData,
      {
        withCredentials: true,
      }
    );

    return response.data;
  }
);

export const logoutUser = createAsyncThunk(
  "/auth/logout",

  async () => {
    const response = await axios.post(
      "/api/auth/logout",
      {},
      {
        withCredentials: true,
      }
    );

    return response.data;
  }
);

export const checkAuth = createAsyncThunk(
  "/auth/checkauth",

  async () => {
    const response = await axios.get(
      "/api/auth/check-auth",
      {
        withCredentials: true,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );

    return response.data;
  }
);

export const updateProfile = createAsyncThunk(
  "/auth/updateProfile",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        "/api/auth/profile",
        formData,
        { withCredentials: true }
      );
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data.message || { message: e.message });
    }
  }
);

export const changePassword = createAsyncThunk(
  "/auth/changePassword",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        "/api/auth/change-password",
        formData,
        { withCredentials: true }
      );
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const adminLoginUser = createAsyncThunk(
  "/auth/adminLogin",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "/api/admin/auth/login",
        formData,
        { withCredentials: true }
      );
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "/auth/verifyOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "/api/auth/verify-otp",
        { email, otp },
        { withCredentials: true }
      );
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

export const resendOtp = createAsyncThunk(
  "/auth/resendOtp",
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "/api/auth/resend-otp",
        { email },
        { withCredentials: true }
      );
      return response.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: e.message });
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {},
    // Triggered by the global axios 401 interceptor
    forceLogout: (state) => {
      state.isLoading      = false;
      state.user           = null;
      state.isAuthenticated = false;
    },
    // Called directly after a successful admin profile PATCH
    patchUserInState: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log(action);

        state.isLoading = false;
        state.user = action.payload.success ? action.payload.user : null;
        state.isAuthenticated = action.payload.success;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.success ? action.payload.user : null;
        state.isAuthenticated = action.payload.success;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(adminLoginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(adminLoginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.success ? action.payload.user : null;
        state.isAuthenticated = action.payload.success;
      })
      .addCase(adminLoginUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload?.success && action.payload?.user) {
          state.user = action.payload.user;
        }
      });
  },
});

export const { setUser, forceLogout, patchUserInState } = authSlice.actions;
export default authSlice.reducer;
