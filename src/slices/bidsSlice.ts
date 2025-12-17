// src/slices/bidsSlice.ts

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns"; 
import { api } from '../api'; 
import type { RootState } from "../store";

// Определяем тип данных для одной заявки
export interface Bid {
  id: number;
  status: string;
  date_update: string; 
  date_finish: string | null; 
  battery_life: number; 
  incoming_current: number;
  creator_login: string; 
  moderator_login: string | null;
  calculated_power_count: number;
}

interface BidsState {
  items: Bid[];
  loading: boolean;
  error: string | null;
}

const initialState: BidsState = {
  items: [],
  loading: false,
  error: null
};

// Определяем параметры для Thunk загрузки
interface FetchBidsParams {
  username?: string; 
  status?: string; 
  start_date?: string;   
  end_date?: string;     
}

// ⭐️ НОВЫЕ ТИПЫ ДЛЯ ОПЕРАЦИИ МОДЕРАТОРА ⭐️
interface UpdateStatusRequest {
  bidId: number;
  newStatus: 'завершена' | 'отклонена';
  moderatorId: number; 
}

// ⭐️ THUNK: Загрузка заявок ⭐️
export const fetchUserBids = createAsyncThunk<
  Bid[], 
  FetchBidsParams, 
  { state: RootState } 
>(
  'bids/fetchUserBids',
  async (params, { rejectWithValue, getState }) => {
    const { username, status, start_date, end_date } = params;
    const state = getState() as RootState;
    const token = state.user.token;
    
    if (!token) {
        return rejectWithValue("Пользователь не авторизован. Токен отсутствует.");
    }

    const lowerCaseUsername = username ? username.toLowerCase() : undefined; 
    const filterStatus = status ? status.toLowerCase() : '';

    try {
      const response = await api.bidUpsAllList({}); 
      
      let rawBids: any[] = [];
      const apiData = response?.data as any; 
      
      if (apiData && apiData.data && Array.isArray(apiData.data.bid_ups)) {
          rawBids = apiData.data.bid_ups;
      }
      
      if (rawBids.length === 0) {
          return [];
      }
      
      // 1. Приведение типов и усиление защиты
      const allBids: Bid[] = rawBids.map((item: any) => ({
          id: item.id,
          status: (item.status || 'неизвестен'), 
          date_update: item.date_update,
          date_finish: item.date_finish,
          battery_life: item.battery_life,
          incoming_current: item.incoming_current,
          creator_login: (item.creator_login || 'система').toLowerCase(), 
          moderator_login: item.moderator_login,
          calculated_power_count: item.calculated_power_count,
      }));

      // 2. ФИЛЬТРАЦИЯ: ПОЛЬЗОВАТЕЛЬ/МОДЕРАТОР (Неполное совпадение)
      let userBids = allBids;
      
      if (lowerCaseUsername) {
          // Используем .includes() для неполного совпадения
          userBids = allBids.filter((bid) => 
            bid.creator_login.includes(lowerCaseUsername)
          );
      }
      
      // 3. ФИЛЬТРАЦИЯ: СТАТУС
      if (filterStatus) {
           userBids = userBids.filter((bid) => bid.status.toLowerCase() === filterStatus);
      }
      
      // 4. ФИЛЬТРАЦИЯ: ДАТА
      if (start_date || end_date) {
        let dateStart: Date | null = start_date ? startOfDay(parseISO(start_date)) : null;
        let dateEnd: Date | null = end_date ? endOfDay(parseISO(end_date)) : null;

        userBids = userBids.filter((bid) => {
            if (!bid.date_update) return false; 
            
            const bidDate = parseISO(bid.date_update);

            if (dateStart && isBefore(bidDate, dateStart)) {
                return false;
            }
            if (dateEnd && isAfter(bidDate, dateEnd)) {
                return false;
            }
            return true;
        });
      }

      return userBids;
      
    } catch (error: any) {
      console.error("❌ Ошибка при запросе заявок:", error);
      return rejectWithValue(error.response?.data?.message || "Не удалось загрузить заявки");
    }
  }
);


// ⭐️ THUNK: Обновление статуса модератором ⭐️
export const updateBidStatusAsync = createAsyncThunk<
  Bid, 
  UpdateStatusRequest, 
  { state: RootState } 
>(
  'bids/updateBidStatus',
  async ({ bidId, newStatus, moderatorId }, { rejectWithValue }) => {
    
    const requestBody = {
      moderator_id: moderatorId,
      status: newStatus,
    };

    try {
      const response = await api.bidUpsDeclineUpdate(bidId, requestBody);
      
      // Предполагаем, что API возвращает обновленные данные
      const updatedData = response.data as any; 
      
      // Возвращаем объект, содержащий ID и обновленные поля
      return { 
        id: bidId, 
        status: newStatus, 
        date_finish: updatedData.date_finish || null, 
        moderator_login: updatedData.moderator_login || null,
        // Добавьте другие поля, если API их возвращает
      } as Bid; 

    } catch (error: any) {
      console.error(`❌ Ошибка обновления статуса для заявки ${bidId}:`, error);
      return rejectWithValue(error.response?.data?.message || `Не удалось обновить статус заявки ${bidId}`);
    }
  }
);


const bidsSlice = createSlice({
  name: "bids",
  initialState,
  reducers: {
    clearBids: (state) => {
      state.items = [];
      state.error = null;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Обработчики для fetchUserBids
      .addCase(fetchUserBids.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBids.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload; 
        state.error = null;
      })
      .addCase(fetchUserBids.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || action.error.message || "Ошибка загрузки заявок";
        state.items = [];
      })
      
      // ⭐️ Обработчики для updateBidStatusAsync ⭐️
      .addCase(updateBidStatusAsync.pending, (state) => {
        state.error = null; // Очищаем общую ошибку перед новой операцией
      })
      .addCase(updateBidStatusAsync.fulfilled, (state, action) => {
        // Находим заявку по ID и обновляем ее
        const index = state.items.findIndex(bid => bid.id === action.payload.id);
        if (index !== -1) {
          // Обновляем только те поля, которые изменились
          state.items[index] = { ...state.items[index], ...action.payload };
        }
        state.error = null;
      })
      .addCase(updateBidStatusAsync.rejected, (state, action) => {
        // Устанавливаем ошибку, чтобы показать ее пользователю
        state.error = action.payload as string || action.error.message || "Ошибка обновления статуса";
      });
  }
});

export const { clearBids } = bidsSlice.actions;
export default bidsSlice.reducer;