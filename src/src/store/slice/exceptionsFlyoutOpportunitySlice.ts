// store/slices/exceptionsFlyoutOpportunitySlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { getExceptionOpportunityDetails } from '../thunks/getExceptionOpportunityDetails';
import type { IGetExceptionsFlyoutRiskDetails } from '../../types/response';

interface ExceptionsFlyoutOpportunityState {
    data: IGetExceptionsFlyoutRiskDetails[];
    loading: boolean;
    error: string | null;
}

const initialState: ExceptionsFlyoutOpportunityState = {
    data: [],
    loading: false,
    error: null,
};

const exceptionsFlyoutOpportunitySlice = createSlice({
    name: 'exceptionFlyoutOpportunityDetails',
    initialState,
    reducers: {
        resetExceptionsFlyoutOpportunityState: state => {
            state.data = [];
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getExceptionOpportunityDetails.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getExceptionOpportunityDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(getExceptionOpportunityDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) ?? 'Failed to fetch opportunity issues';
            });
    },
});

export const { resetExceptionsFlyoutOpportunityState } = exceptionsFlyoutOpportunitySlice.actions;
export default exceptionsFlyoutOpportunitySlice.reducer;
