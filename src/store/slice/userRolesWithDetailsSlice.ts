import { createSlice } from '@reduxjs/toolkit';
import { fetchUserRolesWithDetails } from '../thunks/fetchUserRolesWithDetails';
import { UserRoleDetails, UserRoleStatus, UserRoleAttribute } from '../../types/response';

interface UserRolesState {
    roles: UserRoleDetails[];
    statusCounts: UserRoleStatus[];
    attributes: UserRoleAttribute[];
    loading: boolean;
    error: string | null;
}

const initialState: UserRolesState = {
    roles: [],
    statusCounts: [],
    attributes: [],
    loading: false,
    error: null,
};

const userRolesWithDetailsSlice = createSlice({
    name: 'userRolesWithDetails',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchUserRolesWithDetails.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserRolesWithDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.roles = action.payload.roles ?? [];
                state.statusCounts = action.payload.statusCounts ?? [];
                state.attributes = action.payload.attributes ?? [];
            })
            .addCase(fetchUserRolesWithDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? 'Something went wrong'; // ✅ FIXED
            });
    },
});

export default userRolesWithDetailsSlice.reducer;
