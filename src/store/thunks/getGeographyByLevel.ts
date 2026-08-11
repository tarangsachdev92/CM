import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

export const getGeographyByLevel = createAsyncThunk(
    'appReport/getGeographyByLevel',
    async (geographyTypeId: number) => {
        const response = await getAPI('/api/appReport/get-geography-by-level', { geographyTypeId });
        const payload = response.data?.data ?? response.data;
        return Array.isArray(payload) ? payload : [];
    },
);
