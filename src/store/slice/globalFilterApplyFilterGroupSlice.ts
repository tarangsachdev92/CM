import { createSlice } from '@reduxjs/toolkit';
import { ApplyFilterGroup } from '../thunks/globalFilterApplyFilterGroup'; 

interface GlobalFilterState {
    isLoading: boolean;
    data: any | null;
    error: string | null;
}

const initialState: GlobalFilterState = {
    isLoading: false,
    data: null,
    error: null,
};

const globalFilterSlice = createSlice({
    name: 'globalFilter',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(ApplyFilterGroup.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(ApplyFilterGroup.fulfilled, (state, action) => {
                state.isLoading = false;
                state.data = action.payload;
            })
            .addCase(ApplyFilterGroup.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export default globalFilterSlice.reducer;
