import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

export const fetchToDoFilters = createAsyncThunk('todo/get-todo-filters', async () => {
    const response = await getAPI('api/todo/get-todo-filters', null);
    return response.data.data;
});
