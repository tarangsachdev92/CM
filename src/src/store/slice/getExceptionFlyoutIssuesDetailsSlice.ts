import { createSlice } from '@reduxjs/toolkit';
import { getExceptionIssuesDetails } from '../thunks/getExceptionFlyoutIssuesDetails';
import type { IGetExceptionsFlyoutIssuesDetails } from '../../types/response';

interface ExceptionsFlyoutIssuesState {
  data: IGetExceptionsFlyoutIssuesDetails[];
  loading: boolean;
  error: string | null;
}

const initialState: ExceptionsFlyoutIssuesState = {
  data: [],
  loading: false,
  error: null,
};

const exceptionsFlyoutIssuesSlice = createSlice({
  name: 'exceptionsFlyoutIssues',
  initialState,
  reducers: {
    resetExceptionsFlyoutState: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getExceptionIssuesDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getExceptionIssuesDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getExceptionIssuesDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch exception issues';
      });
  },
});

export const { resetExceptionsFlyoutState } = exceptionsFlyoutIssuesSlice.actions;
export default exceptionsFlyoutIssuesSlice.reducer;
