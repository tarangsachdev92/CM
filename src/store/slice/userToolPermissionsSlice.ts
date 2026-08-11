import { createSlice } from '@reduxjs/toolkit';
import { fetchDelegatedRoleView, fetchUserToolPermissions } from '../thunks/fetchUserToolPermissions';
import { IUserToolsApiResponse } from '../../types/response';

interface UserToolPermissionsState {
  data: IUserToolsApiResponse;
  loading: boolean;
  error: string | null;
  pagination: {
    totalRows: number;
    totalPages: number;
  };
}

const initialState: UserToolPermissionsState = {
  data: {
    roleId: 0,
    role: '',
    tools: [],
    totalRows: 0,
    totalPages: 0,
    totalPermissionCount: 0
  },
  loading: false,
  error: null,
  pagination: {
    totalRows: 0,
    totalPages: 0,
  },
};

const userToolPermissionsSlice = createSlice({
  name: 'userToolPermissions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserToolPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserToolPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.pagination.totalRows = action.payload.totalRows;
        state.pagination.totalPages = action.payload.totalPages;
      })
      .addCase(fetchUserToolPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      });
      builder    
      .addCase(fetchDelegatedRoleView.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDelegatedRoleView.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // array of DelegatedPermissionRow
        state.pagination.totalPages = action.payload.totalPages;
        state.pagination.totalRows = action.payload.totalRows
      })
      .addCase(fetchDelegatedRoleView.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch delegated role permissions';
      state.data = {    roleId: 0,    role: '',    tools: [],    totalRows: 0,    totalPages: 0,    totalPermissionCount: 0,  };  
      state.pagination.totalRows = 0
      state.pagination.totalPages = 0
      });

  },
});

export default userToolPermissionsSlice.reducer;
