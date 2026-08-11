import { createSlice } from '@reduxjs/toolkit';
import { getExceptionRiskDetails } from '../thunks/getExceptionRiskDetails';
import type { IGetExceptionsFlyoutRiskDetails } from '../../types/response';

interface ExceptionsFlyoutRiskState {
    data: IGetExceptionsFlyoutRiskDetails[];
    loading: boolean;
    error: string | null;
}

const initialState: ExceptionsFlyoutRiskState = {
    data: [],
    loading: false,
    error: null,
};

const exceptionsFlyoutRiskSlice = createSlice({
    name: 'exceptionsFlyoutRisk',
    initialState,
    reducers: {
        resetExceptionsFlyoutRiskState: state => {
            state.data = [];
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getExceptionRiskDetails.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getExceptionRiskDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(getExceptionRiskDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? 'Failed to fetch exception issues';
            });
    },
});

export const { resetExceptionsFlyoutRiskState } = exceptionsFlyoutRiskSlice.actions;
export default exceptionsFlyoutRiskSlice.reducer;
