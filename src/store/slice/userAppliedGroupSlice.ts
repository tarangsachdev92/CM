import { createSlice, SerializedError } from '@reduxjs/toolkit';
import { fetchUserAppliedFilterDetails } from '../thunks/fetchUserAppliedFilterDetails';
import { FilterGroupDataModel } from '../../types/request';

interface FilterGroupState {
    data: FilterGroupDataModel[];
    hierarchy: any;
    loading: boolean;
    error: SerializedError | null;
}

const initialState: FilterGroupState = {
    data: [],
    hierarchy: null,
    loading: false,
    error: null,
};

const userAppliedGroupSlice = createSlice({
    name: 'fetchUserAppliedFilterDetails',
    initialState,
    reducers: {},
    extraReducers: builder => {
        // Handle fetchFilterGroupDetails
        builder
            .addCase(fetchUserAppliedFilterDetails.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserAppliedFilterDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
                state.hierarchy = action.payload.data?.[0].hierarchy;
            })
            .addCase(fetchUserAppliedFilterDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error;
            });
    },
});

export default userAppliedGroupSlice.reducer;
