// store.ts
import { configureStore } from "@reduxjs/toolkit";
import searchReducer from "./slices/searchSlice";
import componentsReducer from "./slices/componentsSlice";

export const store = configureStore({
  reducer: {
    search: searchReducer,
    components: componentsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;