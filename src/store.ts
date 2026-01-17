// src/store.ts
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import searchReducer from './slices/searchSlice';
import componentsReducer from './slices/componentsSlice';
import cartReducer from './slices/cartSlice';
import bidsReducer from './slices/bidsSlice'; // <--- ДОБАВЛЕНО

// Кастомный мидлвар для сброса состояния при логауте
const logoutMiddleware = (store: any) => (next: any) => (action: any) => {
  // Если это действие успешного логаута, сбрасываем все редьюсеры
  if (action.type === 'user/logoutUserAsync/fulfilled') {
    // Получаем текущий state
    const state = store.getState();
    
    // Сбрасываем все редьюсеры вручную
    store.dispatch({ type: 'RESET_ALL' });
    
    // Также вызываем reset для каждого редьюсера
    store.dispatch({ type: 'user/resetUser' });
    store.dispatch({ type: 'cart/resetCart' });
    store.dispatch({ type: 'search/clearSearch' });
    store.dispatch({ type: 'bids/clearBids' }); // <-- Добавляем сброс для заявок
    
    // Очищаем localStorage
    localStorage.removeItem('persist:root');
  }
  
  return next(action);
};

export const store = configureStore({
  reducer: {
    user: userReducer,
    search: searchReducer,
    components: componentsReducer,
    bidUPS: cartReducer,
    bids: bidsReducer, 
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(logoutMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;