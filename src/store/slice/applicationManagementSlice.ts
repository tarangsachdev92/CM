import { createSlice } from '@reduxjs/toolkit';
import {
    fetchApplicationDetailsById,
    fetchRolePermissionsForApplication,
} from '../thunks/fetchApplicationData';
import type { IToolDetails, IRoleToolPermissions } from '../../types/response';

interface IApplicationManagementInitialState {
    toolDetails: IToolDetails;
    roleAppPermissions: {
        existingRoleToolPermissions: IRoleToolPermissions[];
        otherRoleToolPermssions: IRoleToolPermissions[];
        pagination: {
            totalPages: number;
            totalRows: number;
        };
    };
    isLoading: boolean;
    error: string | null;
}

const initialState: IApplicationManagementInitialState = {
    toolDetails: {} as IToolDetails,
    roleAppPermissions: {
        existingRoleToolPermissions: [],
        otherRoleToolPermssions: [],
        pagination: {
            totalPages: 0,
            totalRows: 0,
        },
    },
    isLoading: false,
    error: null,
};

const applicationManagementSlice = createSlice({
    name: 'applicationManagementSlice',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(fetchApplicationDetailsById.pending, state => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchApplicationDetailsById.fulfilled, (state, action) => {
            state.isLoading = false;
            state.toolDetails.toolDetail = action.payload.toolDetail?.[0];
            state.toolDetails.geography = action.payload.geography;
            state.toolDetails.functions = action.payload.functions;
            state.toolDetails.subFunctions = action.payload.subFunctions;
            state.error = null;
        });
        builder.addCase(fetchApplicationDetailsById.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        builder.addCase(fetchRolePermissionsForApplication.pending, state => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchRolePermissionsForApplication.fulfilled, (state, action) => {
            state.isLoading = false;
            state.roleAppPermissions = action.payload;
            state.error = null;
        });
        builder.addCase(fetchRolePermissionsForApplication.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });
    },
});

export default applicationManagementSlice.reducer;
