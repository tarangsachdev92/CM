import { DelegationRequestPayload } from '../types/request';
import { deleteAPI, getAPI, postAPI } from './api';

export const getUserForDelegation = async () => {
    const response = await getAPI('api/users/users-delegation');
    return response?.data?.data;
};

export const getRolesByUserForDelegation = async (payload: {
    delegatedByUser: string;
    delegatedToUser: string;
}) => {
    const response = await getAPI('api/users/roles-delegation', payload);
    return response?.data?.data;
};

export const getToolsByRoleIdForDelegation = async (payload: { roleId: string }) => {
    const response = await getAPI('api/users/tools-delegation', payload);
    return response?.data?.data;
};

export const getToolRolePermissionDetailsForDelegation = async (payload: {
    roleId?: string;
    toolID?: string;
    pageSize?: number;
    pageNumber?: number;
}) => {
    const response = await getAPI('api/users/delegated-role-permission-details', payload);
    return response?.data?.data;
};

export const saveDelegation = async (payload: DelegationRequestPayload) => {
    const response = await postAPI('api/users/save-role-delegation', payload);
    return response?.data?.data;
};

export const getDelegations = async (payload: { pageSize: number; pageNumber: number }) => {
    const response = await getAPI('api/users/delegations-history', payload);
    return response?.data;
};

export const deleteDelegation = async (delegationId: number) => {
    const response = await deleteAPI(
        `api/users/delete-delegation?delegationId=${delegationId}`,
        {},
    );
    return response.data;
};

export const getDelegationPermissions = async (
    delegationId: number,
    pageNumber = 1,
    pageSize = 10,
) => {
    const res = await getAPI('api/users/delegation-permission-view-by-Id', {
        delegationId,
        pageNumber,
        pageSize,
    });
    return res?.data;
};
export const getDelegationDetailsById = async (payload: { delegationId: number }) => {
    const response = await getAPI('api/users/get-delegated-role-details-by-Id', payload);
    return response?.data?.data;
};

export const editDelegation = async (payload: DelegationRequestPayload) => {
    const response = await postAPI('api/users/edit-role-delegation', payload);
    return response?.data?.data;
};
