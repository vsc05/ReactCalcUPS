import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, setAuthToken } from '../api';
import type { RootState } from '../store';
import { resetCart } from './cartSlice';
import { clearSearch } from './searchSlice';

interface UserState {
  username: string;
  isAuthenticated: boolean;
  token: string | null;
  error: string | null;
  loading: boolean;
  userId?: number; // userID из JWT токена
}

const initialState: UserState = {
  username: '',
  isAuthenticated: false,
  token: null,
  error: null,
  loading: false,
};

// Функция для декодирования JWT токена
const decodeJWT = (token: string) => {
  try {
    // JWT формат: header.payload.signature
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ Ошибка декодирования JWT:', error);
    return null;
  }
};

// Асинхронное действие для авторизации
export const loginUserAsync = createAsyncThunk(
  'user/loginUserAsync',
  async (credentials: { login: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.loginCreate({ 
        login: credentials.login, 
        password: credentials.password 
      });
      
      console.log('🔐 Login response:', response.data);
      
      return { 
        data: response.data,
        login: credentials.login
      };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return rejectWithValue(error.response?.data?.message || 'Ошибка авторизации');
    }
  }
);

// Асинхронное действие для регистрации
export const registerUserAsync = createAsyncThunk(
  'user/registerUserAsync',
  async (credentials: { login: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.registerCreate({
        login: credentials.login,
        password: credentials.password,
        isModerator: false
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка регистрации');
    }
  }
);

// НОВОЕ: Асинхронное действие для обновления профиля (логина/пароля)
export const updateUserProfileAsync = createAsyncThunk(
  'user/updateUserProfileAsync',
  async (
    updateData: {
      userId: number;
      login?: string;
      newPassword?: string;
      currentPassword: string; // Требуется для подтверждения
    }, 
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.user.token;

      if (!token) {
        return rejectWithValue('Токен авторизации не найден.');
      }

      // Подготавливаем данные для отправки на сервер
      // В запросе PUT http://localhost:8080/api/users/1{ "login": "user1", "password":"123" }
      const requestBody: { login?: string; password: string; old_password: string } = {
        old_password: updateData.currentPassword, // Старый пароль для подтверждения
        // Отправляем новый пароль, если он есть, иначе старый (на случай если меняется только логин)
        password: updateData.newPassword || updateData.currentPassword, 
      };

      if (updateData.login) {
        requestBody.login = updateData.login;
      }
      
      const response = await fetch(`/api/users/${updateData.userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Не удалось обновить данные пользователя (${response.status})`);
      }

      const responseData = await response.json();

      // Возвращаем новый логин, если он был изменен
      return {
        message: responseData.message || 'Данные пользователя успешно обновлены',
        newLogin: updateData.login,
      };

    } catch (error: any) {
      console.error('❌ Ошибка обновления профиля:', error);
      return rejectWithValue(error.message || 'Ошибка обновления профиля');
    }
  }
);

// Асинхронное действие для выхода с очисткой корзины
export const logoutUserAsync = createAsyncThunk(
  'user/logoutUserAsync',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as RootState;
      const token = state.user.token;
      const bidId = state.cart.bid_id;
      
      // 1. Очищаем корзину, если она есть
      if (token && bidId) {
        try {
          // Сначала получаем детали корзины
          const cartDetailResponse = await fetch(`/api/bidUPS/${bidId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (cartDetailResponse.ok) {
            const cartDetail = await cartDetailResponse.json();
            // Удаляем все компоненты из корзины
            const components = cartDetail.data?.components || cartDetail.components || [];
            
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
              }
            }
          }
          
          // Теперь удаляем саму корзину с moderator_id: 3
          await fetch(`/api/bidUPS/${bidId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ moderator_id: 3 })
          });
          
        } catch (cartError) {
          console.warn('Не удалось удалить корзину на сервере:', cartError);
        }
      }
      
      // 2. Выполняем логаут на сервере
      if (token) {
        try {
          await api.logoutCreate();
        } catch (error) {
          console.warn('Не удалось выполнить логаут на сервере:', error);
        }
      }
      
      // 3. Сбрасываем состояние на клиенте
      dispatch(resetCart()); // Сбрасываем корзину
      dispatch(clearSearch()); // Сбрасываем поиск
      dispatch(resetUser()); // Сбрасываем пользователя
      
      // 4. Очищаем токен в API
      setAuthToken(null);
      
      return true;
    } catch (error: any) {
      // Даже если произошла ошибка, сбрасываем состояние на клиенте
      dispatch(resetCart());
      dispatch(clearSearch());
      dispatch(resetUser());
      setAuthToken(null);
      return rejectWithValue('Ошибка при выходе из системы');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Синхронный сброс пользователя
    resetUser: (state) => {
      state.username = '';
      state.isAuthenticated = false;
      state.token = null;
      state.error = null;
      state.loading = false;
      state.userId = undefined;
    },
    // Установка пользователя (для сохранения при перезагрузке)
    setUserFromStorage: (state, action) => {
      state.username = action.payload.username || '';
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.error = null;
      state.loading = false;
      state.userId = action.payload.userId;
    },
    // Обновление имени пользователя
    updateUsername: (state, action: { payload: string }) => {
      state.username = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Логин
      .addCase(loginUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUserAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        
        const token = action.payload.data.access_token;
        state.token = token || null;
        
        console.log('✅ Login successful, setting username:', action.payload.login);
        
        // Сохраняем логин из credentials
        state.username = action.payload.login;
        
        // Декодируем JWT токен для получения userID
        if (token) {
          try {
            const decoded = decodeJWT(token);
            console.log('🔑 Decoded JWT payload:', decoded);
            
            // Пробуем получить userID из разных полей (в зависимости от сервера)
            if (decoded) {
              // 💡 ДОБАВЛЕНА ПРОВЕРКА НА user_db_id
              if (decoded.user_db_id !== undefined) { 
                state.userId = decoded.user_db_id;
                console.log('👤 Got userID from user_db_id field:', state.userId);
              } else if (decoded.userDBID !== undefined) {
                state.userId = decoded.userDBID;
                console.log('👤 Got userID from userDBID field:', state.userId);
              } else if (decoded.userID !== undefined) {
                state.userId = decoded.userID;
                console.log('👤 Got userID from userID field:', state.userId);
              } else if (decoded.sub !== undefined) {
                state.userId = decoded.sub;
                console.log('👤 Got userID from sub field:', state.userId);
              } else if (decoded.user_id !== undefined) {
                state.userId = decoded.user_id;
                console.log('👤 Got userID from user_id field:', state.userId);
              } else if (decoded.userId !== undefined) {
                state.userId = decoded.userId;
                console.log('👤 Got userID from userId field:', state.userId);
              } else {
                console.warn('⚠️ No userID found in JWT token');
              }
            }
            
            setAuthToken(token);
          } catch (error) {
            console.error('❌ Error decoding JWT token:', error);
            // Продолжаем без userID
          }
        }
        
        state.error = null;
      })
      .addCase(loginUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // ОБНОВЛЕНИЕ ПРОФИЛЯ
      .addCase(updateUserProfileAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfileAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Если логин был изменен, обновляем его в state, чтобы ProfilePage отображал новое имя
        if (action.payload.newLogin) {
          state.username = action.payload.newLogin;
        }
      })
      .addCase(updateUserProfileAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Регистрация
      .addCase(registerUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUserAsync.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Выход
      .addCase(logoutUserAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUserAsync.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(logoutUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetUser, setUserFromStorage, updateUsername } = userSlice.actions;
export default userSlice.reducer;