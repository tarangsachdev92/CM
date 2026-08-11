import { createSlice } from '@reduxjs/toolkit';
import { IAPIResponse } from '../../types/response';
import { fetchAfUserRoleFilterDetails } from '../thunks/fetchAfUserRoleFilterDetails';

interface RoleState {
    roleDetail: IAPIResponse | null;
    loading: boolean;
    error: string | null;
}

const initialState: RoleState = {
    roleDetail: null,
    loading: false,
    error: null,
};

// Create the slice
const afUserRoleFilterDetailsSlice = createSlice({
    name: 'afUserRoleFilterDetails',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchAfUserRoleFilterDetails.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAfUserRoleFilterDetails.fulfilled, (state, action) => {
                state.roleDetail = action.payload;
                state.loading = false;
            })
            .addCase(fetchAfUserRoleFilterDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch role details';
            });
    },
});

// Export the reducer to be used in the store
export default afUserRoleFilterDetailsSlice.reducer;
