// ============================================
// CART SLICE
// ============================================
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../utils/axios';

const initialState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  loading: false,
  error: null,
};

// ── Get Cart ──
export const getCart = createAsyncThunk(
  'cart/getCart',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get('/cart');
      return data.cart;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch cart'
      );
    }
  }
);

// ── Add to Cart ──
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/cart', { productId, quantity });
      return data.cart;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to add to cart'
      );
    }
  }
);

// ── Update Cart Item ──
export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/cart/${itemId}`, { quantity });
      return data.cart;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update cart'
      );
    }
  }
);

// ── Remove from Cart ──
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue }) => {
    try {
      const { data } = await API.delete(`/cart/${itemId}`);
      return data.cart;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to remove item'
      );
    }
  }
);

// ── Clear Cart ──
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.delete('/cart');
      return data.cart;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to clear cart'
      );
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Cart
      .addCase(getCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.totalAmount = action.payload.totalAmount;
      })
      .addCase(getCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to Cart
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.totalAmount = action.payload.totalAmount;
      })
      // Update Cart Item
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.totalAmount = action.payload.totalAmount;
      })
      // Remove from Cart
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.totalAmount = action.payload.totalAmount;
      })
      // Clear Cart
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.totalItems = 0;
        state.totalAmount = 0;
      });
  },
});

export const { clearCartError } = cartSlice.actions;
export default cartSlice.reducer;