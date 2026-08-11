import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchApplicationPermissionsForRole = createAsyncThunk(
    'role/fetchApplicationPermissionsForRole',
    async (payload?: { roleId: number; pageNumber?: number; pageSize?: number }) => {
        const response = await getAPI('api/permission/app-permission-by-role-id', payload);
        return response.data.data;
    },
);

const fetchApplicationPermissionsForRoleV1 = createAsyncThunk(
    'role/fetchApplicationPermissionsForRoleV1',
    async (payload?: { roleId: number; pageNumber?: number; pageSize?: number }) => {
        const response = await getAPI('api/permission/app-permission-by-role-id-v1', payload);
        return response.data.data;
    },
);

const fetchAllApplicationsAndPermissions = createAsyncThunk(
    'role/fetchAllApplicationsAndPermissions',
    async () => {
        const response = await getAPI('api/permission/all-apps-and-permissions');
        return response.data.data;
    },
);

 const fetchIsAdmin = createAsyncThunk('roles/fetchIsAdmin', async () => {
    const response = await getAPI('api/roles/is-admin');
    return response.data; 
});

const fetchToolPersonaPermissionByRole = createAsyncThunk(
    'role/fetchToolPersonaPermissionByRole',
    async (payload?: { roleId: number; pageNumber?: number; pageSize?: number }) => {
        const response = await getAPI('api/permission/tool-persona-permission-by-role-id', payload);
        return response.data.data;
    },
);

export { fetchApplicationPermissionsForRole, fetchApplicationPermissionsForRoleV1, fetchAllApplicationsAndPermissions, fetchIsAdmin, fetchToolPersonaPermissionByRole};
