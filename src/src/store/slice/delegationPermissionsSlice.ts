// store/slices/delegationPermissionsSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import { fetchDelegatedRoleViewByDelegation } from "../thunks/fetchDelegatedRoleView";

interface NormalizedPermissions {
  items: any[];                 // ApiRow[]
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
  totalPermissionCount?: number;
}

interface State {
  data: NormalizedPermissions;
  loading: boolean;
  error: any;
}

const initialState: State = {
  data: {
    items: [],
    totalItems: 0,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 0,
    totalPermissionCount: 0,
  },
  loading: false,
  error: null,
};

const delegationPermissionsSlice = createSlice({
  name: "delegationPermissions",
  initialState,
  reducers: {
    resetDelegationPermissions: (state) => {
      state.data = { ...initialState.data };
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDelegatedRoleViewByDelegation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDelegatedRoleViewByDelegation.fulfilled, (state, action) => {
        state.loading = false;
        // payload is the normalized object
        state.data = action.payload as NormalizedPermissions;
      })
      .addCase(fetchDelegatedRoleViewByDelegation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetDelegationPermissions } = delegationPermissionsSlice.actions;
export default delegationPermissionsSlice.reducer;