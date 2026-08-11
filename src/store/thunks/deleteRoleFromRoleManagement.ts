import { createAsyncThunk } from '@reduxjs/toolkit';
import { deleteAPI, getAPI } from '../../services/api';
import type { IDeleteRole, IUpdateRoleStatus } from '../../types/request';

export const deleteRoleFromRoleManagement = createAsyncThunk(
    'roles/deleteRole',
    async (request: IDeleteRole, { rejectWithValue }) => {
        try {
            const response = await deleteAPI(`api/roles/role-details?roleId=${request.roleId}`, {});
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data || 'An error occurred');
        }
    },
);

export const updateRoleStatus = createAsyncThunk(
    'roles/updateStatus',
    async (payload: IUpdateRoleStatus, { rejectWithValue }) => {
        try {
            // TODO - Convert to GET with query parameters
            const response = await getAPI(
                `api/roles/role-details-status-update?roleId=${payload.roleId}&makeActive=${payload.makeActive}`,
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to update role status');
        }
    },
);
