import { createSlice } from '@reduxjs/toolkit';
import { fetchUserPrimaryRole, fetchUserSecondaryRole,fetchUserDelegatedRole, fetchUserDelegationRole } from '../thunks/fetchUserRole';
import { IUserRole, IUserForumRoles, IDelegateRoleProfile, IDelegateRoleStatusSummary } from '../../types/response';

interface IUserRoleState {
    primary: IUserRole;
    secondary: {
        roles: IUserRole[];
        otherRoles: IUserForumRoles[];
    };
    delegationRole: IUserRole;
     delegationRoles: IUserRole[],
    
    delegated: {                     // ✅ NEW
        delegateRoleProfile: IDelegateRoleProfile[];
        delegateRoleStatusSummary: IDelegateRoleStatusSummary[];
      };

    isLoading: boolean;
    error: {} | null;
}

const initialState: IUserRoleState = {
    primary: {
        roleId: 0,
        role: '',
        adgroupsList: [],
        isAnyADGroupRequested: false,
        isAnyADGroupPending: false,
        region: '',
        roleGeoName: '',
        statusChips: {
            Approved: 0,
            Pending: 0,
            Requested: 0,
            AutoRejected: 0,
            AddFailed: 0,
        },
        levelName: '',
        subFunctionName: '',
        departmentName: '',
    },
    secondary: { roles: [], otherRoles: [] },
    delegationRoles: [],
    delegationRole: {
        roleId: 0,
        role: '',
        adgroupsList: [],
        isAnyADGroupRequested: false,
        isAnyADGroupPending: false,
        region: '',
        roleGeoName: '',
        statusChips: {
            Approved: 0,
            Pending: 0,
            Requested: 0,
            AutoRejected: 0,
            AddFailed: 0,
        },
        levelName: '',
        subFunctionName: '',
        departmentName: '',
    },
    delegated: {                                 // ✅ must be bucket object
    delegateRoleProfile: [],
    delegateRoleStatusSummary: [],
  },

    isLoading: false,
    error: null,
};

const userRoleSlice = createSlice({
    name: 'fetchUserRole',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchUserPrimaryRole.pending, state => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUserPrimaryRole.fulfilled, (state, action) => {
                if (action.payload?.roles?.length) {
                    state.primary = action.payload.roles[0];
                }
                state.isLoading = false;
            })
            .addCase(fetchUserPrimaryRole.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message ?? 'Failed to fetch user primary role';
            });
        builder
            .addCase(fetchUserSecondaryRole.pending, state => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUserSecondaryRole.fulfilled, (state, action) => {
                state.secondary = action.payload;
                state.isLoading = false;
            })
            .addCase(fetchUserSecondaryRole.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message ?? 'Failed to fetch user secondary roles';
            });
            
        builder
            .addCase(fetchUserDelegationRole.pending, state => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUserDelegationRole.fulfilled, (state, action) => {
               
                 const roles = action.payload?.roles ?? [];
                 state.delegationRoles = roles; 
                state.isLoading = false;
            })
            .addCase(fetchUserDelegationRole.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message ?? 'Failed to fetch user primary role';
            });
        builder
              .addCase(fetchUserDelegatedRole.pending, state => {
                state.isLoading = true;
                state.error = null;
              })
              .addCase(fetchUserDelegatedRole.fulfilled, (state, action) => {
                state.delegated =
                action.payload ?? { delegateRoleProfile: [], delegateRoleStatusSummary: [] };

                state.isLoading = false;
              })
              .addCase(fetchUserDelegatedRole.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message ?? 'Failed to fetch user delegated roles';
              });
          
            },
        });

export default userRoleSlice.reducer;
