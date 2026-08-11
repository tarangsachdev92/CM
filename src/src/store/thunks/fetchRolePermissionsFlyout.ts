import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

export const fetchRolePermissionsFlyout = createAsyncThunk(
    'rolePermission/fetchRolePermissionFlyout',
    async (
        {
            roleId,
            pageNumber = 1,
            pageSize = 10,
        }: { roleId: number; pageNumber?: number; pageSize?: number },
        { rejectWithValue },
    ) => {
        try {
            const response = await getAPI(
                `api/roles/role-permissions-flyout?roleId=${encodeURIComponent(
                    roleId,
                )}&pageNumber=${encodeURIComponent(
                    pageNumber,
                )}&pageSize=${encodeURIComponent(pageSize)}`,
            );

            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error?.message || 'Failed to fetch role permissions');
        }
    },
);
