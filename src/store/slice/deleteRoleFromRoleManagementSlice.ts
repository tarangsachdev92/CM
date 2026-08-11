import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { deleteRoleFromRoleManagement, updateRoleStatus } from '../thunks/deleteRoleFromRoleManagement';

interface IRoleManagementState {
    delete: {
        isLoading: boolean;
        isSuccess: boolean;
        error: string | null;
    };
    statusUpdate: {
        isLoading: boolean;
        isSuccess: boolean;
        error: string | null;
    };
}

const initialState: IRoleManagementState = {
    delete: {
        isLoading: false,
        isSuccess: false,
        error: null,
    },
    statusUpdate: {
        isLoading: false,
        isSuccess: false,
        error: null,
    },
};

const roleManagementSlice = createSlice({
    name: 'roleManagement',
    initialState,
    reducers: {
        resetDeleteState: (state) => {
            state.delete = initialState.delete;
        },
        resetStatusUpdateState: (state) => {
            state.statusUpdate = initialState.statusUpdate;
        },
    },
    extraReducers: (builder) => {
        // Delete role cases
        builder
            .addCase(deleteRoleFromRoleManagement.pending, (state) => {
                state.delete.isLoading = true;
                state.delete.isSuccess = false;
                state.delete.error = null;
            })
            .addCase(deleteRoleFromRoleManagement.fulfilled, (state, action: PayloadAction<boolean>) => {
                state.delete.isLoading = false;
                state.delete.isSuccess = action.payload;
                state.delete.error = null;
            })
            .addCase(deleteRoleFromRoleManagement.rejected, (state, action) => {
                state.delete.isLoading = false;
                state.delete.isSuccess = false;
                state.delete.error = action.payload as string;
            });

        // Status update cases
        builder
            .addCase(updateRoleStatus.pending, (state) => {
                state.statusUpdate.isLoading = true;
                state.statusUpdate.isSuccess = false;
                state.statusUpdate.error = null;
            })
            .addCase(updateRoleStatus.fulfilled, (state, action: PayloadAction<boolean>) => {
                state.statusUpdate.isLoading = false;
                state.statusUpdate.isSuccess = action.payload;
                state.statusUpdate.error = null;
            })
            .addCase(updateRoleStatus.rejected, (state, action) => {
                state.statusUpdate.isLoading = false;
                state.statusUpdate.isSuccess = false;
                state.statusUpdate.error = action.payload as string;
            });
    },
});

export const { resetDeleteState, resetStatusUpdateState } = roleManagementSlice.actions;
export default roleManagementSlice.reducer;