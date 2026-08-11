// store/thunks/getExceptionRiskDetails.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';
import type { IGetExceptionsFlyoutRiskDetails } from '../../types/response';

export const getExceptionRiskDetails = createAsyncThunk<
    IGetExceptionsFlyoutRiskDetails[],
    void,
    { rejectValue: string }
>('/sidenavigation/exception-risk-details', async (_, { rejectWithValue }) => {
    try {
        const response = await getAPI('api/sidenavigation/get-exception-details?ExceptionTypeId=2');
        return response.data?.data ?? [];
    } catch (error: any) {
        return rejectWithValue(error?.response?.data || 'An error occurred');
    }
});
