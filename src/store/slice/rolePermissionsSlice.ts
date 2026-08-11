import { createSlice } from '@reduxjs/toolkit';
import {
    fetchApplicationPermissionsForRole,
    fetchAllApplicationsAndPermissions,
    fetchIsAdmin,
    fetchToolPersonaPermissionByRole,
    fetchApplicationPermissionsForRoleV1
} from '../thunks/fetchRolePermissions';
import type { IRoleApplicationData } from '../../types/response';

export interface IRolePermissionsInitialState {
    applicationsData: {
        existingToolPermissions: IRoleApplicationData[] | [];
        otherToolPermissions: IRoleApplicationData[] | [];
        pagination: {
            totalRows: number;
            totalPages: number;
        };
    };
    allApplicationsAndPermissions: IRoleApplicationData[] | [];
    isLoading: boolean;
    error: {} | null;
    isAdmin: boolean;
    toolPersonaData: {
        existingToolPermissions: IRoleApplicationData[] | [];
        otherToolPermissions: IRoleApplicationData[] | [];
        pagination: {
            totalRows: number;
            totalPages: number;
        };
        existingToolPersonaPermissions: IRoleApplicationData[] | []; 
        otherToolPersonaPermissions: IRoleApplicationData[] | [];
    }
}

const initialState: IRolePermissionsInitialState = {
    applicationsData: {
        existingToolPermissions: [],
        otherToolPermissions: [],
        pagination: {
            totalRows: 1,
            totalPages: 1,
        },
    },
    allApplicationsAndPermissions: [],
    isLoading: false,
    error: null,
    isAdmin: false,
    toolPersonaData: {
        existingToolPermissions: [],
        otherToolPermissions: [],
        pagination: {
            totalRows: 1,
            totalPages: 1,
        },
        existingToolPersonaPermissions: [],
        otherToolPersonaPermissions: []
    }
};

const RolePermissionsSlice = createSlice({
    name: 'fetchRolePermissions',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(fetchApplicationPermissionsForRole.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchApplicationPermissionsForRole.fulfilled, (state, action) => {
            state.isLoading = false;
            state.applicationsData = action.payload;
        });
        builder.addCase(fetchApplicationPermissionsForRole.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchApplicationPermissionsForRoleV1.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchApplicationPermissionsForRoleV1.fulfilled, (state, action) => {
            state.isLoading = false;
            state.applicationsData = action.payload;
        });
        builder.addCase(fetchApplicationPermissionsForRoleV1.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchAllApplicationsAndPermissions.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchAllApplicationsAndPermissions.fulfilled, (state, action) => {
            state.isLoading = false;
            state.allApplicationsAndPermissions = action.payload;
        });
        builder.addCase(fetchAllApplicationsAndPermissions.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });
        builder.addCase(fetchIsAdmin.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchIsAdmin.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAdmin = action.payload.data;
        });
        builder.addCase(fetchIsAdmin.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });
        builder.addCase(fetchToolPersonaPermissionByRole.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchToolPersonaPermissionByRole.fulfilled, (state, action) => {
            state.isLoading = false;
            state.toolPersonaData = action.payload;
        });
        builder.addCase(fetchToolPersonaPermissionByRole.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });
    },
});

export default RolePermissionsSlice.reducer;
