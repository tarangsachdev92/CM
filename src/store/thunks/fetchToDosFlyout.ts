import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services/api';

interface ToDoRequestPayload {
    toolName?: string | null;
    priorityName?: string | null;
    dueDate?: string | null;
    startDueDate?: string | null;
    endDueDate?: string | null;
    selectedId?: string | null;
}

export const fetchToDosFlyout = createAsyncThunk(
    'todo/fetchToDosFlyout',
    async (payload: ToDoRequestPayload) => {
        const response = await postAPI('api/todo/get-todoNew-details', payload);
        return response.data.data;
    },
);
