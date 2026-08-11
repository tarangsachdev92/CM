import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services/api';
import type { IRoleRequest } from '../../types/request';

export const fetchRoleData = createAsyncThunk(
  'roles/fetchRoleData',
  async (request: IRoleRequest, { rejectWithValue }) => {
    try {
      const response = await postAPI(
        'api/roles/role-details',
        request
      );

      return response.data; 
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data ?? 'Failed to fetch role data'
      );
    }
  }
);
