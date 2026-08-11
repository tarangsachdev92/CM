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

export const fetchTestingToDos = createAsyncThunk(
    'todoTesting/fetchTestingToDos',
    async (payload: ToDoRequestPayload) => {
        const response = await postAPI('api/todo/get-todoNew-details-v1', payload);  
        return response.data.data;
    },
);