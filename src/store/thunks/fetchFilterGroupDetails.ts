import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchFilterGroupDetails = createAsyncThunk(
    'application/fetchFilterGroupDetails',
    async () => {
        const response = await getAPI('api/globalFilter/filter-group-details');
        return response.data.data;
    },
);

const fetchFilterHierarchies = createAsyncThunk('application/fetchHierarchies', async () => {
    const response = await getAPI('api/globalFilter/filter-group-hierarchies');
    return response.data.data;
});

const fetchFilterFinancialCycle = createAsyncThunk('application/fetchFinancialcycle', async () => {
    const response = await getAPI('api/globalFilter/financial-cycle');
    return response.data.data;
});

export { fetchFilterGroupDetails, fetchFilterHierarchies, fetchFilterFinancialCycle };
