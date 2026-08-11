import { createAsyncThunk } from '@reduxjs/toolkit';
import { deleteAPI } from '../../services/api';
import type { IDeleteUser } from '../../types/request';

export const deleteUserFromUserManagement = createAsyncThunk(
  'users/deleteUser',
  async (request: IDeleteUser, { rejectWithValue }) => {
    try {
      const url = `api/users/user-role?primaryRoleId=${request.primaryRoleId}&userEmail=${encodeURIComponent(request.userEmail)}`;
      const response = await deleteAPI(url, {});
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || 'An error occurred while deleting the user');
    }
  }
);