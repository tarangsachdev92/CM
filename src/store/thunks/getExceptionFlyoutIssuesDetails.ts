import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';
import type { IGetExceptionsFlyoutIssuesDetails } from '../../types/response';

export const getExceptionIssuesDetails = createAsyncThunk<
    IGetExceptionsFlyoutIssuesDetails[],
    void,
    { rejectValue: string }
>('/sidenavigation/exception-issue-details', async (_, { rejectWithValue }) => {
    try {
        const response = await getAPI('api/sidenavigation/get-exception-details?ExceptionTypeId=1');
        return response.data?.data ?? [];
    } catch (error: any) {
        return rejectWithValue(error?.response?.data || 'An error occurred');
    }
});
