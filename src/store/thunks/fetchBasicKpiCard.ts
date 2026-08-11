import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchBasicKpiCard = createAsyncThunk('common/fetchBasicKpiCard', async (queryParams: any) => {
    const response = await getAPI('api/KPICard/basic-kpi-data', queryParams);
    return response.data.data;
});

export { fetchBasicKpiCard };
