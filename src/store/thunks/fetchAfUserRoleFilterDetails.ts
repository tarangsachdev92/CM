import { createAsyncThunk } from '@reduxjs/toolkit'; // Async thunk to fetch role details
// import { IAPIResponse } from '../../types/response';
import { getAPI } from '../../services/api';

const fetchAfUserRoleFilterDetails = createAsyncThunk(
    'common/fetchAfUserRoleFilterDetails',
    async () => {
        const response = await getAPI('api/common/af-user-role-filter-details');
        return response.data;
    },
);

export { fetchAfUserRoleFilterDetails };
