// slices/componentsSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { type Component, getComponentsByTitle } from "../modules/componentApi";
import { COMPONENTS_MOCK } from "../modules/mock";

interface ComponentsState {
  items: Component[];
  filteredItems: Component[];
  loading: boolean;
  error: string | null;
}

const initialState: ComponentsState = {
  items: [],
  filteredItems: [],
  loading: false,
  error: null
};

// Асинхронный thunk для загрузки компонентов
export const fetchComponents = createAsyncThunk(
  'components/fetchComponents',
  async (searchQuery: string = "") => {
    try {
      const response = await getComponentsByTitle(searchQuery);
      return response?.data?.Components?.filter((item) => !item.is_delete) || [];
    } catch (error) {
      console.error("Ошибка при запросе компонентов:", error);
      return COMPONENTS_MOCK;
    }
  }
);

const componentsSlice = createSlice({
  name: "components",
  initialState,
  reducers: {
    filterComponents: (state, action: PayloadAction<{
      searchValue: string;
      filters?: any;
    }>) => {
      const { searchValue } = action.payload;
      
      let filtered = state.items;
      
      // Фильтрация по поисковому запросу
      if (searchValue) {
        filtered = filtered.filter(item =>
          item.title.toLowerCase().includes(searchValue.toLowerCase())
        );
      }
      
      // Здесь можно добавить дополнительную фильтрацию по filters
      // Например, по категории, цене и т.д.
      
      state.filteredItems = filtered;
    },
    clearComponents: (state) => {
      state.items = [];
      state.filteredItems = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComponents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComponents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.filteredItems = action.payload;
      })
      .addCase(fetchComponents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Ошибка загрузки компонентов";
      });
  }
});

export const { filterComponents, clearComponents } = componentsSlice.actions;
export default componentsSlice.reducer;