import { DelegationRequestPayload } from '../types/request';
import { deleteAPI, getAPI, postAPI } from './api';

// 🔥 Global toggle for testing
const USE_V1 = true;

// Helper to append -v1 conditionally
const withVersion = (endpoint: string, tempBool:boolean=false) =>
    USE_V1 || tempBool ? `${endpoint}-v1` : endpoint;

export const getUserForDelegationNew = async () => {
    const response = await getAPI(withVersion('api/users/users-delegation'));
    return response?.data?.data;
};

export const getRolesByUserForDelegationNew = async (payload: {
    delegatedByUser: string;
    delegatedToUser: string;
}) => {
    const response = await getAPI(
        withVersion('api/users/roles-delegation'),
        payload
    );
    return response?.data?.data;
};

export const getToolsByRoleIdForDelegationNew = async (payload: { roleId: string }) => {
    const response = await getAPI(
        withVersion('api/users/tools-delegation'),
        payload
    );
    return response?.data?.data;
};

export const getToolRolePermissionDetailsForDelegationNew = async (payload: {
    roleId?: string;
    toolID?: string;
    pageSize?: number;
    pageNumber?: number;
}) => {
    const response = await getAPI(
        withVersion('api/users/delegated-role-permission-details'),
        payload
    );
    return response?.data?.data;
};

export const saveDelegationNew = async (payload: DelegationRequestPayload) => {
    const response = await postAPI(
        withVersion('api/users/save-role-delegation'),
        payload
    );
    return response?.data?.data;
};

export const getDelegationsNew = async (payload: {
    pageSize: number;
    pageNumber: number;
}) => {
    const response = await getAPI(
        withVersion('api/users/delegations-history'),
        payload
    );
    return response?.data;
};

export const deleteDelegationNew = async (delegationId: number) => {
    const endpoint = USE_V1
        ? `api/users/delete-delegation-v1?delegationId=${delegationId}`
        : `api/users/delete-delegation?delegationId=${delegationId}`;

    const response = await deleteAPI(endpoint, {});
    return response.data;
};

export const getDelegationPermissionsNew = async (
    delegationId: number,
    pageNumber = 1,
    pageSize = 10
) => {
    const res = await getAPI(
        withVersion('api/users/delegation-permission-view-by-Id'),
        {
            delegationId,
            pageNumber,
            pageSize,
        }
    );
    return res?.data;
};

export const getDelegationDetailsByIdNew = async (payload: {
    delegationId: number;
}) => {
    const response = await getAPI(
        withVersion('api/users/get-delegated-role-details-by-Id'),
        payload
    );
    return response?.data?.data;
};

export const editDelegationNew = async (payload: DelegationRequestPayload) => {
    const response = await postAPI(
        withVersion('api/users/edit-role-delegation'),
        payload
    );
    return response?.data?.data;
};