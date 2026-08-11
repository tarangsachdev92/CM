import { createAsyncThunk } from '@reduxjs/toolkit';
import { deleteAPI, getAPI, postAPI } from '../../services/api';
import type { ApiUser } from '../../components/organisms/user-groups/userGroupstypes';

/* =========================
   FETCH USER GROUP DETAILS
   ========================= */

const fetchUserGroupDetails = createAsyncThunk(
  'userGroups/fetchUserGroupDetails',
  async () => {
    const response = await getAPI(
      'api/roles/user-group-details',
    );
    return response.data.data;
  },
);

/* =========================
   FETCH USERS FOR A GROUP
   ========================= */

const fetchUsersForUserGroup = createAsyncThunk(
  'userGroups/fetchUsersForUserGroup',
  async ({ groupId }: { groupId: number }) => {
    const response = await postAPI(
      `api/users/Get-Users-For-UserGroup?GroupId=${encodeURIComponent(groupId)}`,
      {},
    );

    const apiUsers = (response?.data?.data ?? []) as Array<{
      userEmail?: string;
      userName?: string;
      roleName?: string;
      roleId?: number;
    }>;

    const users: ApiUser[] = apiUsers
      .filter(u => !!u?.userEmail)
      .map(u => ({
        useremail: u.userEmail as string,
        username: u.userName ?? '',
        roleName: u.roleName as string,
        roleId: u.roleId as number
      }));

    return { groupId, users };
  },
);

/* =========================
   USERS CRUD IN GROUP
   ========================= */

const fetchUsersAvailableForGroup = createAsyncThunk(
  'userGroups/fetchUsersAvailableForGroup',
  async () => {
    // NOTE: backend uses HttpDelete for this endpoint; keep as-is.
    const response = await deleteAPI('api/users/Get-user-in-group', {});
    return (response?.data?.data ?? []) as Array<{
      userEmail?: string;
      UserName?: string;
      WWID?: number;
      GroupId?: number | null;
    }>;
  },
);

const saveUserInGroup = createAsyncThunk(
  'userGroups/saveUserInGroup',
  async ({
    roleName,
    userGroupId,
    userEmail,
  }: {
    roleName: string;
    userGroupId: number;
    userEmail: string;
  }) => {
    const response = await postAPI(
      `api/users/Save-user-inGroup?RoleName=${encodeURIComponent(
        roleName,
      )}&userGroupId=${encodeURIComponent(
        userGroupId,
      )}&userEmail=${encodeURIComponent(userEmail)}`,
      {},
    );
    return response?.data?.data;
  },
);

const editUserInGroup = createAsyncThunk(
  'userGroups/editUserInGroup',
  async ({
    oldUserEmail,
    newUserEmail,
    userGroupId,
    roleName,
  }: {
    oldUserEmail: string;
    newUserEmail: string;
    userGroupId: number;
    roleName: string;
  }) => {
    const response = await postAPI(
      `api/users/Edit-user-inGroup?oldUserEmail=${encodeURIComponent(
        oldUserEmail,
      )}&newUserEmail=${encodeURIComponent(
        newUserEmail,
      )}&userGroupId=${encodeURIComponent(
        userGroupId,
      )}&roleName=${encodeURIComponent(roleName)}`,
      {},
    );
    return response?.data?.data;
  },
);

const moveOrRemoveUserFromGroup = createAsyncThunk(
  'userGroups/moveOrRemoveUserFromGroup',
  async ({
    oldGroupId,
    newGroupId,
    userEmail,
  }: {
    oldGroupId: number;
    newGroupId?: number;
    userEmail: string;
  }) => { 
    const newGroupIdPart =
      typeof newGroupId === 'number'
        ? `&NewGroupId=${encodeURIComponent(newGroupId)}`
        : '';

    const response = await postAPI(
      `api/users/Move-user-to-OtherGroup?oldGroupId=${encodeURIComponent(
        oldGroupId,
      )}${newGroupIdPart}&userEmail=${encodeURIComponent(userEmail)}`,
      {},
    );
    return response?.data?.data;
  },
);

/* =========================
   CREATE USER GROUP
   ========================= */

const createUserGroup = createAsyncThunk(
  'userGroups/createUserGroup',
  async ({ groupId, groupName }: { groupId: number, groupName: string }) => {
    const response = await postAPI(
      'api/roles/user-groups',
      { groupId, groupName },
    );

    return response.data.data; // success message
  },
);

/* =========================
   DELETE USER GROUP
   ========================= */

const deleteUserGroup = createAsyncThunk(
  'userGroups/deleteUserGroup',
  async ({ groupId, moveToGroupId }: { groupId: number, moveToGroupId: number }) => {
    const response = await deleteAPI(
      'api/roles/delete-user-group',
      { groupId, moveToGroupId },
    );

    return response.data.data; // success message
  },
);

const validateUserEmail = createAsyncThunk(
  'userGroups/validateUserEmail',
  async ({emailId} : {emailId :string}) => {
    const response = await getAPI(
      `api/users/validate-user-by-email/${emailId}`,
    );
    return response.data.data;
  },
);


export const validateUserRole = createAsyncThunk(
  "userGroups/validateUserRole",
  async ({roleName, userEmail,  } : {roleName: string; userEmail: string;}) => {
    const response = await getAPI(
      `api/roles/validate-user-group-role-name?roleName=${encodeURIComponent(roleName,
      )}&userEmail=${encodeURIComponent(userEmail)}`
    );

    return response?.data?.data;
  }
);

export {
  fetchUserGroupDetails,
  fetchUsersForUserGroup,
  fetchUsersAvailableForGroup,
  saveUserInGroup,
  editUserInGroup,
  moveOrRemoveUserFromGroup,
  createUserGroup,
  deleteUserGroup,
  validateUserEmail,
};
