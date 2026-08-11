import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchLastRefreshDate = createAsyncThunk(
    'common/fetchLastRefreshDate',
    async (payload: { toolId?: string; isRefreshed?: boolean }) => {
        const response = await getAPI('api/users/last-refreshed-date', payload);
        return response.data.data;
    },
);

export { fetchLastRefreshDate };
