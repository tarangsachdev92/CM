import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

export const fetchSnoozedTodos = createAsyncThunk(
  'todo/get-snooze-todo-details',
  async () => {
    const response = await getAPI('api/todo/get-snooze-todo-details', {});
    return response.data.data; 
  }
);
