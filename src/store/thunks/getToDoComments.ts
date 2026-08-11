import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';
import type { ToDoComments } from '../../types/response';

// Define the thunk for fetching to-do comments
export const getToDoComments = createAsyncThunk<
    ToDoComments[], // Expected return type
    number, // Argument type (toDoId)
    { rejectValue: string } // Type for the reject value
>(
    'todo/getToDoComments', // Action type string
    async (toDoId, { rejectWithValue }) => {
        try {
            // Build the API URL with encoded toDoId
            const url = `api/todo/Get-ToDoComments?toDoId=${encodeURIComponent(toDoId)}`;
            const response = await getAPI(url);
            // Return the comments data or an empty array if not found
            return response.data?.data ?? [];
        } catch (error: any) {
            // Handle errors and return a meaningful message
            return rejectWithValue(error?.response?.data || 'An error occurred');
        }
    },
);
