import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

export const fetchToDoWidgetDetails = createAsyncThunk('todo/fetchToDoWidgetDetails', async () => {
    const response = await getAPI('api/todo/todoWidget-details', null);
    return response.data.data;
});
