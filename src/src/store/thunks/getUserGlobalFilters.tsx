import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

export const getUserGlobalFilters = createAsyncThunk('globalFilter/users-global-filters', async () => {
    const response = await getAPI(`api/globalFilter/active-user-applied-filter`);
    return response.data.data;
});

