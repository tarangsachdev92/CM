import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchRolePermissionsForApplication = createAsyncThunk(
    'application/fetchRolePermissionsForApplication',
    async () => {
        const response = await getAPI('api/common/roles');
        return response.data.data;
    },
);

export { fetchRolePermissionsForApplication };
