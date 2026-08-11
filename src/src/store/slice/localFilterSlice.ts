import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BusinessUnitLocalFilter, LineLocalFilter } from '../thunks/localFilterData';

export interface Option {
  label: string;
  value: string;
}

interface LocalFilterState {
  buIsLoading: boolean;
  buData: Option[];
  buError: string | null;
  lineIsLoading: boolean;
  lineData: Option[];
  lineError: string | null;
  selectedLocalFilters: Record<string, Option[]>;
}

const initialState: LocalFilterState = {
  buIsLoading: false,
  buData: [],
  buError: null,
  lineIsLoading: false,
  lineData: [],
  lineError: null,
  selectedLocalFilters: {},
};

const localFilterSlice = createSlice({
  name: 'localFilter',
  initialState,
  reducers: {
    setLocalFilters(state, action: PayloadAction<Record<string, Option[]>>) {
      state.selectedLocalFilters = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(BusinessUnitLocalFilter.pending, (state) => {
        state.buIsLoading = true;
        state.buError = null;
      })
      .addCase(BusinessUnitLocalFilter.fulfilled, (state, action: PayloadAction<Option[]>) => {
        state.buIsLoading = false;
        state.buData = action.payload;
      })
      .addCase(BusinessUnitLocalFilter.rejected, (state, action) => {
        state.buIsLoading = false;
        state.buError = action.payload as string;
      })
      .addCase(LineLocalFilter.pending, (state) => {
        state.lineIsLoading = true;
        state.lineError = null;
      })
      .addCase(LineLocalFilter.fulfilled, (state, action: PayloadAction<Option[]>) => {
        state.lineIsLoading = false;
        state.lineData = action.payload;
      })
      .addCase(LineLocalFilter.rejected, (state, action) => {
        state.lineIsLoading = false;
        state.lineError = action.payload as string;
      });
  },
});

export const { setLocalFilters } = localFilterSlice.actions;
export default localFilterSlice.reducer;