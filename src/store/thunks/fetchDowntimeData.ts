import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

export const fetchDowntimeData = createAsyncThunk('downtime/fetchDowntime', async () => {
    const response = await getAPI('api/common/downtime-announcements', null);
    return response.data.data;
});
