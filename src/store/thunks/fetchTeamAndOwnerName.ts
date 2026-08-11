import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchTeam = createAsyncThunk('common/fetchTeam', async () => {
    const response = await getAPI('api/application/teams');
    return response.data.data;
});

const fetchOwnerName = createAsyncThunk('common/fetchOwnerName', async () => {
    const response = await getAPI('api/application/application-owners');
    return response.data.data;
});

export { fetchTeam, fetchOwnerName };
