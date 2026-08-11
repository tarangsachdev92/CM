import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchImpactAnalysisTableData = createAsyncThunk('common/fetchImpactAnalysisTableData', async () => {
    const response = await getAPI('api/KPICard/impact-analysis-table-data');
    return response.data.data;
});

export { fetchImpactAnalysisTableData };