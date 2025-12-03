// src/slices/cartSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

interface CartState {
  bid_id: number | null;
  count_items: number;
  loading: boolean;
  error: string | null;
}

interface CartApiResponse {
  data: {
    bid_id: number;
    items_count?: number;
    count_items?: number;
  };
}

const initialState: CartState = {
  bid_id: null,
  count_items: 0,
  loading: false,
  error: null
};

// Асинхронное действие для получения корзины
export const fetchCartAsync = createAsyncThunk<
  CartApiResponse,
  void,
  { rejectValue: string }
>(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.user?.token;
      
      if (!token) {
        return rejectWithValue('Токен не найден. Авторизуйтесь');
      }
      
      const response = await fetch('/api/bidUPS', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return rejectWithValue(`Ошибка HTTP: ${response.status}`);
      }
      
      const data: CartApiResponse = await response.json();
      return data;
      
    } catch (error: any) {
      return rejectWithValue(error.message || 'Не удалось получить корзину');
    }
  }
);

// Асинхронное действие для добавления в корзину
export const addToCartAsync = createAsyncThunk<
  CartApiResponse,
  number,
  { rejectValue: string }
>(
  'cart/addToCart',
  async (itemId, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as any;
      const token = state.user?.token;
      
      if (!token) {
        return rejectWithValue('Токен не найден. Авторизуйтесь');
      }
      
      // Добавляем компонент в корзину
      const addResponse = await fetch(`/api/component/${itemId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!addResponse.ok) {
        return rejectWithValue(`Ошибка HTTP: ${addResponse.status}`);
      }
      
      const addData: CartApiResponse = await addResponse.json();
      
      // Сразу обновляем состояние корзины из ответа добавления
      if (addData?.data) {
        dispatch(updateCartState({
          bid_id: addData.data.bid_id,
          count_items: addData.data.items_count || addData.data.count_items || 0,
          loading: false
        }));
      }
      
      return addData;
      
    } catch (error: any) {
      return rejectWithValue(error.message || 'Не удалось добавить товар в корзину');
    }
  }
);

// Асинхронное действие для удаления из корзины
export const removeFromCartAsync = createAsyncThunk<
  CartApiResponse,
  { bidId: number; componentId: number },
  { rejectValue: string }
>(
  'cart/removeFromCart',
  async ({ bidId, componentId }, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as any;
      const token = state.user?.token;
      
      if (!token) {
        return rejectWithValue('Токен не найден. Авторизуйтесь');
      }
      
      const response = await fetch('/api/calcUPS', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bidId: bidId,
          componentId: componentId
        })
      });
      
      if (!response.ok) {
        return rejectWithValue(`Ошибка HTTP: ${response.status}`);
      }
      
      const data: CartApiResponse = await response.json();
      
      // Обновляем состояние из ответа
      if (data?.data) {
        dispatch(updateCartState({
          bid_id: data.data.bid_id,
          count_items: data.data.items_count || data.data.count_items || 0,
          loading: false
        }));
      }
      
      return data;
      
    } catch (error: any) {
      return rejectWithValue(error.message || 'Не удалось удалить товар из корзины');
    }
  }
);

// Асинхронное действие для очистки корзины (удаляет все компоненты и саму корзину)
export const clearCartAsync = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'cart/clearCart',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as any;
      const token = state.user?.token;
      const bidId = state.cart?.bid_id;
      
      if (!token) {
        return rejectWithValue('Токен не найден. Авторизуйтесь');
      }
      
      if (!bidId) {
        // Если корзины нет, просто сбрасываем состояние
        dispatch(updateCartState({
          bid_id: null,
          count_items: 0,
          loading: false
        }));
        return;
      }
      
      // 1. Получаем детали корзины, чтобы узнать какие компоненты в ней есть
      const cartResponse = await fetch(`/api/bidUPS/${bidId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (cartResponse.ok) {
        const cartData = await cartResponse.json();
        // Предполагаем, что API возвращает компоненты в таком формате
        // Нужно адаптировать под реальный формат ответа
        const components = cartData.data?.components || cartData.components || [];
        
        // 2. Удаляем все компоненты из корзины
        for (const component of components) {
          try {
            await fetch('/api/calcUPS', {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                bidId: bidId,
                componentId: component.id || component.component_id
              })
            });
          } catch (componentError) {
            console.warn('Не удалось удалить компонент:', componentError);
            // Продолжаем удаление других компонентов
          }
        }
      }
      
      // 3. Удаляем саму корзину с moderator_id: 3
      const deleteResponse = await fetch(`/api/bidUPS/${bidId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ moderator_id: 3 })
      });
      
      if (!deleteResponse.ok) {
        return rejectWithValue(`Ошибка HTTP при удалении корзины: ${deleteResponse.status}`);
      }
      
      // 4. Сбрасываем состояние корзины
      dispatch(updateCartState({
        bid_id: null,
        count_items: 0,
        loading: false
      }));
      
    } catch (error: any) {
      return rejectWithValue(error.message || 'Не удалось очистить корзину');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    updateCartState: (state, action: PayloadAction<{
      bid_id: number | null;
      count_items: number;
      loading?: boolean;
    }>) => {
      state.bid_id = action.payload.bid_id;
      state.count_items = action.payload.count_items;
      state.loading = action.payload.loading ?? false;
      state.error = null;
    },
    
    resetCart: (state) => {
      state.bid_id = null;
      state.count_items = 0;
      state.loading = false;
      state.error = null;
    },
    
    setCartError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    clearCartError: (state) => {
      state.error = null;
    },
    
    // Ручное увеличение счетчика (для оптимистичного обновления)
    incrementCartCount: (state) => {
      state.count_items += 1;
    },
    
    // Ручное уменьшение счетчика
    decrementCartCount: (state) => {
      state.count_items = Math.max(0, state.count_items - 1);
    },
    
    // Установить bid_id вручную
    setBidId: (state, action: PayloadAction<number | null>) => {
      state.bid_id = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Обработка fetchCartAsync
    builder
      .addCase(fetchCartAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartAsync.fulfilled, (state, action) => {
        state.loading = false;
        const response = action.payload;
        if (response?.data) {
          state.bid_id = response.data.bid_id;
          state.count_items = response.data.items_count || response.data.count_items || 0;
        }
      })
      .addCase(fetchCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Не удалось загрузить корзину';
      });

    // Обработка addToCartAsync
    builder
      .addCase(addToCartAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Состояние уже обновлено в самом thunk через dispatch
        const response = action.payload;
        if (response?.data && state.count_items === 0) {
          // На всякий случай, если что-то пошло не так с оптимистичным обновлением
          state.bid_id = response.data.bid_id;
          state.count_items = response.data.items_count || response.data.count_items || 0;
        }
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Не удалось добавить товар в корзину';
        // Откатываем оптимистичное обновление
        if (state.count_items > 0) {
          state.count_items -= 1;
        }
      });
  }
});

export const { 
  updateCartState, 
  resetCart, 
  setCartError, 
  clearCartError,
  incrementCartCount,
  decrementCartCount,
  setBidId
} = cartSlice.actions;

export default cartSlice.reducer;

export const selectCart = (state: { cart: CartState }) => state.cart;
export const selectCartItemsCount = (state: { cart: CartState }) => state.cart.count_items;
export const selectCartBidId = (state: { cart: CartState }) => state.cart.bid_id;
export const selectCartLoading = (state: { cart: CartState }) => state.cart.loading;
export const selectCartError = (state: { cart: CartState }) => state.cart.error;