import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchColumnKpiCard = createAsyncThunk('common/fetchColumnKpiCard', async () => {
    const response = await getAPI('api/KPICard/failure-reason-data');
    return response.data.data;
});

export { fetchColumnKpiCard };