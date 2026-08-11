import { createAsyncThunk } from '@reduxjs/toolkit';
import {
    transformKpiDetailsToCardData,
    type KPICardData,
    type KpiDetailsParams,
} from '../../components/organisms/performance-management-customizations/kpiDetailsToCardData';
import { getKpiDetails } from '../../services/performanceManagementWidgets';

export const fetchKpiDetailsCard = createAsyncThunk<
    KPICardData,
    KpiDetailsParams, { rejectValue: string }
>(
    'kpiDetails/fetchKpiDetailsCard',
    async (params, { rejectWithValue }) => {
        try {
            const response = await getKpiDetails(params);
            const apiBody = response.data;
            const card = transformKpiDetailsToCardData(apiBody, params, {
                axisTickIndices: [0, 5, 11], // Jan, Jun, Dec labels
                monthLabelStyle: 'full',
            });
            return card;
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to fetch KPI details';
            return rejectWithValue(msg);
        }
    }
);
