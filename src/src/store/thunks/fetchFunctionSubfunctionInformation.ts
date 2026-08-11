import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchFunctions = createAsyncThunk('common/fetchFunctions', async () => {
    const response = await getAPI('api/common/functions');
    return response.data.data;
});

const fetchSubfunctionsOnMultipleFunctionIds = createAsyncThunk(
    'common/fetchSubfunctionsOnMultipleFunctionIds',
    async (payload: { functionIds: number[] }) => {
        // Convert to comma-separated string
        const functionIds = Array.isArray(payload.functionIds) ? payload.functionIds.join(',') : '';

        const response = await getAPI(
            `api/common/sub-functions-by-function-ids?functionIds=${functionIds}`,
        );
        return response.data.data;
    },
);

export { fetchFunctions, fetchSubfunctionsOnMultipleFunctionIds };
