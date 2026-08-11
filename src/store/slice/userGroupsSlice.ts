import { createSlice } from '@reduxjs/toolkit';
import { UserGroupState } from '../../components/organisms/user-groups/userGroupstypes';
import type { ApiUserGroup } from '../../components/organisms/user-groups/userGroupstypes';
import {
  fetchUserGroupDetails,
  createUserGroup,
  fetchUsersForUserGroup,
} from '../thunks/fetchUserGroupDetails';

const initialState: UserGroupState = {
  groups: [],
  loading: false,
  error: null,
};

const userGroupsSlice = createSlice({
  name: 'userGroups',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      /* FETCH GROUPS */
      .addCase(fetchUserGroupDetails.pending, state => {
        state.loading = true;
      })
      .addCase(fetchUserGroupDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload.map((incomingGroup: ApiUserGroup) => {
          const existingGroup = state.groups.find(group => group.id === incomingGroup.id);
          const hasIncomingUsers = Array.isArray(incomingGroup.users) && incomingGroup.users.length > 0;

          if (hasIncomingUsers || !existingGroup?.users?.length) {
            return incomingGroup;
          }

          return {
            ...incomingGroup,
            users: existingGroup.users,
          };
        });
      })
      .addCase(fetchUserGroupDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* FETCH USERS FOR ONE GROUP (for collapse) */
      // .addCase(fetchUsersForUserGroup.pending, state => {
      //   state.loading = true;
      // })
      .addCase(fetchUsersForUserGroup.fulfilled, (state, action) => {
        ///state.loading = false;
        const { groupId, users } = action.payload;
        const target = state.groups.find(g => parseInt(g.id) === groupId);
        if (target) {
          target.users = users;
        }
      })
      .addCase(fetchUsersForUserGroup.rejected, (state, action) => {
        ///state.loading = false;
        state.error = action.payload as string;
      })

      /* CREATE GROUP */
      .addCase(createUserGroup.pending, state => {
        state.loading = true;
      })
      .addCase(createUserGroup.fulfilled, state => {
        state.loading = false;
      })
      .addCase(createUserGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default userGroupsSlice.reducer;