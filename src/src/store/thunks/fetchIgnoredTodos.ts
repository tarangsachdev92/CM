import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services/api';

interface IgnoredTodosPayload {
    toolName: string | null;
    priorityName: string | null;
    dueDate: string | null;
    startDueDate: string | null;
    endDueDate: string | null;
}

export const fetchIgnoredTodos = createAsyncThunk(
    'todo/get-ignored-todo-details',
    async (payload: IgnoredTodosPayload) => {
        const response = await postAPI('api/todo/get-ignored-todo-details', payload);
        return response.data.data; // assuming API returns { statusCode, data }
    },
);
