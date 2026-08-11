import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchToolName = createAsyncThunk(
    'common/fetchToolName',
    async (toolTypeId: string, thunkAPI) => {
        try {
            // Pass as query param (adjust based on your API requirement)
            const response = await getAPI(
                `api/application/general-info-dropdowns?toolTypeId=${toolTypeId}`,
            );
            return response.data.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    },
);

export { fetchToolName };
