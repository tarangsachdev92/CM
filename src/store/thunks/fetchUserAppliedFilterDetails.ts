import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchUserAppliedFilterDetails = createAsyncThunk(
    'application/fetchFilterGroupDetails',
    async () => {
        const response = await getAPI('api/globalFilter/user-applied-filter');
        return response.data;
    },
);

export { fetchUserAppliedFilterDetails };
