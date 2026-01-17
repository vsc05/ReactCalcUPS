import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

interface bidUPSState {
  bid_id: number | null;
  count_items: number;
  loading: boolean;
  error: string | null;
  // Добавляем поле для хранения рассчитанного результата (если он нужен глобально)
  calculation_result: number | null; 
}

interface bidUPSApiResponse {
  data: {
    bid_id: number | null; // Может быть null, если корзина пуста или удалена
    items_count?: number;
    count_items?: number;
    result?: number; // Для ответа formBidAsync
  };
  result?: number; // Если результат возвращается на верхнем уровне
}

const initialState: bidUPSState = {
  bid_id: null,
  count_items: 0,
  loading: false,
  error: null,
  calculation_result: null, // Инициализируем новое поле
};

// --- Асинхронные действия (Thunks) ---

// Асинхронное действие для получения корзины (без изменений)
export const fetchbidUPSAsync = createAsyncThunk<
  bidUPSApiResponse,
  void,
  { rejectValue: string }
>(
  'bidUPS/fetchbidUPS',
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
      
      const data: bidUPSApiResponse = await response.json();
      return data;
      
    } catch (error: any) {
      return rejectWithValue(error.message || 'Не удалось получить корзину');
    }
  }
);

// Асинхронное действие для добавления в корзину (без изменений)
export const addTobidUPSAsync = createAsyncThunk<
  bidUPSApiResponse,
  number, // componentId (не CalcUPS ID)
  { rejectValue: string }
>(
  'bidUPS/addTobidUPS',
  async (itemId, { getState, rejectWithValue }) => {
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
      
      const addData: bidUPSApiResponse = await addResponse.json();
      return addData; 
      
    } catch (error: any) {
      return rejectWithValue(error.message || 'Не удалось добавить товар в корзину');
    }
  }
);

// Асинхронное действие для удаления из корзины (без изменений)
export const removeFrombidUPSAsync = createAsyncThunk<
  bidUPSApiResponse,
  { bidId: number; componentId: number }, // componentId здесь - это ID записи CalcUPS
  { rejectValue: string }
>(
  'bidUPS/removeFrombidUPS',
  async ({ bidId, componentId }, { getState, rejectWithValue }) => {
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
      
      const data: bidUPSApiResponse = await response.json();
      return data; 
      
    } catch (error: any) {
      return rejectWithValue(error.message || 'Не удалось удалить товар из корзины');
    }
  }
);

// Асинхронное действие для полной очистки корзины (без изменений)
export const clearbidUPSAsync = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'bidUPS/clearbidUPS',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.user?.token;
      const bidId = state.bidUPS?.bid_id;
      
      if (!token) {
        return rejectWithValue('Токен не найден. Авторизуйтесь');
      }
      
      if (!bidId) {
        return; 
      }
      
      const deleteResponse = await fetch(`/api/bidUPS/${bidId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // moderator_id: 3 - добавляем в тело запроса
        body: JSON.stringify({ moderator_id: 3 })
      });
      
      if (!deleteResponse.ok) {
        return rejectWithValue(`Ошибка HTTP при удалении корзины: ${deleteResponse.status}`);
      }
      
    } catch (error: any) {
      return rejectWithValue(error.message || 'Не удалось очистить корзину');
    }
  }
);


// 🚨 НОВОЕ АСИНХРОННОЕ ДЕЙСТВИЕ: Сохранение входящих токов
export const saveBidIncomingCurrentAsync = createAsyncThunk<
  bidUPSApiResponse,
  { bidId: number; incomingCurrent: number },
  { rejectValue: string }
>(
  'bidUPS/saveBidIncomingCurrent',
  async ({ bidId, incomingCurrent }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.user?.token;
      
      if (!token) {
        return rejectWithValue('Токен не найден. Авторизуйтесь');
      }
      
      // PUT http://localhost:8080/api/bidUPS/:id
      const response = await fetch(`/api/bidUPS/${bidId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          incoming_current: incomingCurrent 
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return rejectWithValue(`Ошибка сохранения входящих токов: ${response.status} - ${errorText}`);
      }
      
      const data: bidUPSApiResponse = await response.json();
      return data; 
      
    } catch (error: any) {
      return rejectWithValue(error.message || 'Не удалось сохранить входящие токи');
    }
  }
);


// 🚨 НОВОЕ АСИНХРОННОЕ ДЕЙСТВИЕ: Формирование заявки и расчет
export const formBidAsync = createAsyncThunk<
  bidUPSApiResponse,
  number, // bidId
  { rejectValue: string }
>(
  'bidUPS/formBid',
  async (bidId, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.user?.token;
      
      if (!token) {
        return rejectWithValue('Токен не найден. Авторизуйтесь');
      }
      
      // PUT /api/bidUPS/:id/form
      const response = await fetch(`/api/bidUPS/${bidId}/form`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return rejectWithValue(`Ошибка формирования и расчета: ${response.status} - ${errorText}`);
      }
      
      const data: bidUPSApiResponse = await response.json();
      return data; 
      
    } catch (error: any) {
      return rejectWithValue(error.message || 'Не удалось сформировать и рассчитать заявку');
    }
  }
);


// --- Слайс и Редьюсеры ---

const bidUPSSlice = createSlice({
  name: 'bidUPS',
  initialState,
  reducers: {
    // ... (остальные редьюсеры без изменений)
    updatebidUPSState: (state, action: PayloadAction<{
      bid_id: number | null;
      count_items: number;
      loading?: boolean;
    }>) => {
      state.bid_id = action.payload.bid_id;
      state.count_items = action.payload.count_items;
      state.loading = action.payload.loading ?? false;
      state.error = null;
    },
    
    resetbidUPS: (state) => {
      state.bid_id = null;
      state.count_items = 0;
      state.loading = false;
      state.error = null;
      state.calculation_result = null; // Сбрасываем результат
    },
    
    setbidUPSError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    clearbidUPSError: (state) => {
      state.error = null;
    },
    
    // Ручное увеличение счетчика (для оптимистичного обновления)
    incrementbidUPSCount: (state) => {
      state.count_items += 1;
    },
    
    // Ручное уменьшение счетчика
    decrementbidUPSCount: (state) => {
      state.count_items = Math.max(0, state.count_items - 1);
    },
    
    // Установить bid_id вручную
    setBidId: (state, action: PayloadAction<number | null>) => {
      state.bid_id = action.payload;
    },
    
    // Ручная установка результата расчета (если нужно из BidPage)
    setCalculationResult: (state, action: PayloadAction<number | null>) => {
        state.calculation_result = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Вспомогательная функция для обновления состояния из ответа API
    const handleFulfilled = (state: bidUPSState, response: bidUPSApiResponse) => {
        state.loading = false;
        if (response?.data) {
          state.bid_id = response.data.bid_id;
          state.count_items = response.data.items_count || response.data.count_items || 0;
          
          // Обновляем результат расчета, если он пришел
          state.calculation_result = response.data.result || response.result || null;
        } else {
           // Если ответа нет, но статус успешный, сброс (например, после clearbidUPSAsync)
           if (!state.bid_id && state.count_items > 0) {
               state.count_items = 0;
           }
           // Также сбрасываем результат, если нет данных
           state.calculation_result = null; 
        }
    }
    
    // ------------------------------------
    // Обработка fetchbidUPSAsync (без изменений, кроме использования handleFulfilled)
    // ------------------------------------
    builder
      .addCase(fetchbidUPSAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchbidUPSAsync.fulfilled, (state, action) => {
        handleFulfilled(state, action.payload);
      })
      .addCase(fetchbidUPSAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Не удалось загрузить корзину';
        state.bid_id = null; 
        state.count_items = 0;
        state.calculation_result = null;
      });

    // ------------------------------------
    // Обработка addTobidUPSAsync (без изменений, кроме использования handleFulfilled)
    // ------------------------------------
    builder
      .addCase(addTobidUPSAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTobidUPSAsync.fulfilled, (state, action) => {
        handleFulfilled(state, action.payload);
      })
      .addCase(addTobidUPSAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Не удалось добавить товар в корзину';
        state.count_items = Math.max(0, state.count_items - 1);
      });
      
    // ------------------------------------
    // Обработка removeFrombidUPSAsync (без изменений, кроме использования handleFulfilled)
    // ------------------------------------
    builder
      .addCase(removeFrombidUPSAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFrombidUPSAsync.fulfilled, (state, action) => {
        handleFulfilled(state, action.payload);
      })
      .addCase(removeFrombidUPSAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Не удалось удалить товар из корзины';
      });
      
    // ------------------------------------
    // Обработка clearbidUPSAsync (без изменений)
    // ------------------------------------
    builder
      .addCase(clearbidUPSAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearbidUPSAsync.fulfilled, (state) => {
        state.loading = false;
        state.bid_id = null;
        state.count_items = 0;
        state.calculation_result = null;
      })
      .addCase(clearbidUPSAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Не удалось очистить корзину';
      });
      
    // ------------------------------------
    // 🚨 НОВАЯ ОБРАБОТКА: saveBidIncomingCurrentAsync
    // ------------------------------------
    builder
      .addCase(saveBidIncomingCurrentAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveBidIncomingCurrentAsync.fulfilled, (state) => {
        // Успешное сохранение входящих токов. Loading будет сброшен в formBid.
        state.error = null;
      })
      .addCase(saveBidIncomingCurrentAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Не удалось сохранить входящие токи';
      });
      
    // ------------------------------------
    // 🚨 НОВАЯ ОБРАБОТКА: formBidAsync
    // ------------------------------------
    builder
      .addCase(formBidAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.calculation_result = null; // Очищаем старый результат перед расчетом
      })
      .addCase(formBidAsync.fulfilled, (state, action) => {
        handleFulfilled(state, action.payload);
        // Дополнительно: устанавливаем сообщение об успехе через setSuccessMessage в компоненте
      })
      .addCase(formBidAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Не удалось сформировать и рассчитать заявку';
        state.calculation_result = null;
      });
  }
});

export const { 
  updatebidUPSState, 
  resetbidUPS, 
  setbidUPSError, 
  clearbidUPSError,
  incrementbidUPSCount,
  decrementbidUPSCount,
  setBidId,
  setCalculationResult // Новый экшн
} = bidUPSSlice.actions;

export default bidUPSSlice.reducer;

export const selectbidUPS = (state: { bidUPS: bidUPSState }) => state.bidUPS;
export const selectbidUPSItemsCount = (state: { bidUPS: bidUPSState }) => state.bidUPS.count_items;
export const selectbidUPSBidId = (state: { bidUPS: bidUPSState }) => state.bidUPS.bid_id;
export const selectbidUPSLoading = (state: { bidUPS: bidUPSState }) => state.bidUPS.loading;
export const selectbidUPSError = (state: { bidUPS: bidUPSState }) => state.bidUPS.error;
export const selectCalculationResult = (state: { bidUPS: bidUPSState }) => state.bidUPS.calculation_result;