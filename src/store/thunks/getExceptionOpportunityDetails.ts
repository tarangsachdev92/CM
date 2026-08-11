// store/thunks/getExceptionOpportunityDetails.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';
import type { IGetExceptionsFlyoutOpportunityDetails } from '../../types/response';

export const getExceptionOpportunityDetails = createAsyncThunk<
    IGetExceptionsFlyoutOpportunityDetails[],
    void,
    { rejectValue: string }
>('/sidenavigation/exception-opportunity-details', async (_, { rejectWithValue }) => {
    try {
        const response = await getAPI('api/sidenavigation/get-exception-details?ExceptionTypeId=3');
        return response.data?.data ?? [];
    } catch (error: any) {
        return rejectWithValue(error?.response?.data || 'An error occurred');
    }
});
