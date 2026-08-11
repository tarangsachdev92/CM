import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchUserPrimaryRole = createAsyncThunk(
    'user/fetchUserPrimaryRole',
    async (payload: { roleType: string }) => {
        const response = await getAPI('api/users/roles', payload);
        return response.data.data;
    },
);

const fetchUserSecondaryRole = createAsyncThunk(
    'user/fetchUserSecondaryRole',
    async (payload: { roleType: string }) => {
        const response = await getAPI('api/users/roles', payload);
        return response.data.data;
    },
);

const fetchUserDelegationRole = createAsyncThunk(
  'user/fetchUserDelegationRoles',
  async (payload: { roleType: string }) => {
    const response = await getAPI('api/users/roles', payload);

    const json = response.data as {
      statusCode: number;
      data: {
        roles: any[];
        otherRoles: any[];
      };
      message: string | null;
    };

    return {
      roles: json?.data?.roles ?? [],
      otherRoles: json?.data?.otherRoles ?? []
    };
  }
);


const fetchUserDelegatedRole = createAsyncThunk(
    'user/fetchUserDelegationRole',
    async (payload: { roleType: string }) => {
        const response = await getAPI('api/users/delegated-role-details', payload);
       
const json = response.data as {
      statusCode: number;
      data: Array<{
        delegateRoleProfile: DelegatedRoleProfile[];
        delegateRoleStatusSummary: DelegatedRoleStatusSummary[];
      }>;
      message: string | null;
    };

    // ✅ Return the bucket object, never the array
    const bucket =
      json?.data?.[0] ?? { delegateRoleProfile: [], delegateRoleStatusSummary: [] };

    return bucket;

    },
);



type DelegatedRoleProfile = {
  delegationId: number;
  userEmail: string;
  delegatedByUser: string;
  startDate: string | null;
  endDate: string | null;
  roleId: number;
  roleName: string;
  roleRegion: string;
  roleType: 'Delegated';
  status: 'Pending' | 'Approved' | 'AutoRejected' | 'Requested' | 'AddFailed' | string;
  permissionCount: number;
};

type DelegatedRoleStatusSummary = {
  roleId: number;
  userEmail: string;
  status: string;
  statusCount: number;
};


export { fetchUserPrimaryRole, fetchUserSecondaryRole,fetchUserDelegatedRole,fetchUserDelegationRole };
