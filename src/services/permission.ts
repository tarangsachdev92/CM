import { deleteAPI, postAPI, putAPI } from './api';
import type { IRolePermissionsMappingPayload } from '../types/request';

export const getAppRolePermissionDetails = async (payload: {
    pageSize?: number;
    pageNumber?: number;
    searchKeyword?: string;
    searchColumn?: string;
    roleId?: number;
    toolDD?: string;
    toolFunctionDD?: string;
    toolLocationDD?: string;
    toolRolesDD?: string;
    rolesToolDD?: string;
    rolesDD?: string;
    rolesFunctionDD?: string;
    rolesLocationDD?: string;
    toolTypeId?: number;
}) => {
    const response = await postAPI('api/permission/app-permission-details', payload);
    return response?.data?.data;
};

export const submitApplicationRoleMapping = async (
    payload: {
        roleId: number;
        toolPermissions: {
            toolId: number;
            toolFeatureId: number;
            isActive: number;
        }[];
    }[],
): Promise<{ data: null; message: null; statusCode: number }> => {
    const response = await postAPI('api/permission/application-role-mapping', payload);
    return response.data;
};


export const submitApplicationRoleMappingNew = async (
    payload: {
        roleId: number;
        toolPermissions: {
            toolId: number;
            toolFeatureId: number;
            isActive: number;
        }[];
    }[],
): Promise<{ data: null; message: null; statusCode: number }> => {
    const response = await postAPI('api/permission/application-role-mapping', payload);
    return response.data;
};


export const deleteApplicationRoleMapping = async (payload: {
    toolId: number;
    roleId: number;
}): Promise<{ data: string; statusCode: number; message: null | string }> => {
    const response = await deleteAPI(
        `api/permission/app-role-mapping?toolId=${payload.toolId}&roleId=${payload.roleId}`,
        {},
    );
    return response.data;
};

export const deleteApplicationRoleMappingNew = async (payload: {
    toolId: number;
    roleId: number;
}): Promise<{ data: string; statusCode: number; message: null | string }> => {
    const response = await deleteAPI(
        `api/permission/app-role-mapping-v1?toolId=${payload.toolId}&roleId=${payload.roleId}`,
        {},
    );
    return response.data;
};

export const updateApplicationRolePermissionsMapping = async (
    payload: IRolePermissionsMappingPayload[],
): Promise<{ data: string; statusCode: number; message: null | string }> => {
    const response = await putAPI(
        'api/application/edit-application-access-and-permission',
        payload,
    );
    return response.data;
};
