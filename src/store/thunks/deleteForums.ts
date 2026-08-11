import { createAsyncThunk } from '@reduxjs/toolkit';
import { deleteAPI, postAPI } from '../../services/api';
import type { IForumActionRequest } from '../../types/request';

export const deleteForums = createAsyncThunk(
  'forum/deleteForum',
  async (request: IForumActionRequest, { rejectWithValue }) => {
    try {
      const response = await deleteAPI(
        'api/forum/deleteforumV1',   
        request
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || 'Delete forum failed'
      );
    }
  }
);
export const inactivateForum = createAsyncThunk(
  'forum/inactivateForum',
  async (request: IForumActionRequest, { rejectWithValue }) => {
    try {
      const response = await postAPI(
        'api/forum/inactivate', 
        request
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || 'Inactivate forum failed'
      );
    }
  }
);