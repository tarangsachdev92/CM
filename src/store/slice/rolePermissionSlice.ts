import { createSlice } from '@reduxjs/toolkit';
import { fetchRolePermissionsFlyout } from '../thunks/fetchRolePermissionsFlyout';
import { RolePermissionsState } from '../../types/response';

const initialState: RolePermissionsState = {
    tools: [],
    pagination: null,
    loading: false,
    error: null,
};

const rolePermissionSlice = createSlice({
    name: 'rolePermission',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            /* FETCH ROLE PERMISSIONS */
            .addCase(fetchRolePermissionsFlyout.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRolePermissionsFlyout.fulfilled, (state, action) => {
                const { tools, pagination } = action.payload;

                state.tools = tools ?? [];
                state.pagination = pagination ?? null;
                state.loading = false;
            })

            .addCase(fetchRolePermissionsFlyout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default rolePermissionSlice.reducer;
