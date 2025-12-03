// src/slices/searchSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface SearchState {
  searchValue: string;
  previousSearches: string[];
  filters: {
    category?: string;
    priceRange?: {
      min: number;
      max: number;
    };
  };
}

const initialState: SearchState = {
  searchValue: "",
  previousSearches: [],
  filters: {}
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearchValue: (state, action: PayloadAction<string>) => {
      state.searchValue = action.payload;
    },
    addToSearchHistory: (state, action: PayloadAction<string>) => {
      if (action.payload && !state.previousSearches.includes(action.payload)) {
        state.previousSearches.unshift(action.payload);
        if (state.previousSearches.length > 10) {
          state.previousSearches.pop();
        }
      }
    },
    clearSearch: (state) => {
      state.searchValue = "";
    },
    // Полный сброс поиска (используется при логауте)
    resetSearch: (state) => {
      state.searchValue = "";
      state.previousSearches = [];
      state.filters = {};
    },
    setFilters: (state, action: PayloadAction<SearchState['filters']>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    }
  }
});

export const { 
  setSearchValue, 
  addToSearchHistory, 
  clearSearch, 
  resetSearch, // Экспортируем новый экшен
  setFilters, 
  clearFilters 
} = searchSlice.actions;

export default searchSlice.reducer;