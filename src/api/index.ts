// src/api/index.ts
import { Api } from './Api';

// Создаем инстанс API
const apiInstance = new Api({
  baseURL: '/',
});

export const api = apiInstance.api;

// Функция для установки токена
let currentToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentToken = token;
  if (token) {
    // Устанавливаем токен в заголовки
    apiInstance.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiInstance.instance.defaults.headers.common['Authorization'];
  }
  console.log('Auth token updated:', token ? 'set' : 'cleared');
};

export const getAuthToken = () => currentToken;