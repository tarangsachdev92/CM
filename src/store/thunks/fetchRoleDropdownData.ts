// store/thunks/fetchRoleDropdownData.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

export interface RoleDropdownResponse {
    responsibilityLevels: any[];
    geographyLevels: any[];
    functions: any[];
}

export const fetchRoleDropdownData = createAsyncThunk('role/fetchRoleDropdownData', async () => {
    const response = await getAPI('api/common/role-dropdown-options');
    return response.data.data as RoleDropdownResponse;
});
