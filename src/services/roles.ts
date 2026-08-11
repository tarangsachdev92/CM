import { deleteAPI, getAPI, postAPI, putAPI } from './api';
import type { IRoleDetails, IAPIResponse } from '../types/response';
import { logError } from '../utils/helpers';
import { INewRoleRequest } from '../types/request';

export const getRoleDetailsById = async (payload: {
    roleId: number;
    pageNumber?: number;
    pageSize?: number;
}): Promise<IRoleDetails> => {
    const response = await getAPI(
        `api/roles/role-details-by-id?roleId=${payload.roleId}&pageNumber=${payload.pageNumber}&pageSize=${payload.pageSize}`,
        {},
    );
    return response?.data?.data;
};

export const getAFaccess = async (): Promise<IAPIResponse> => {
    const response = await getAPI(`api/common/af-user-role-filter-details`, {});
    return response; // Return the full response
};

export const getRoleDetailsByIId = async (payload: {
    roleId: number;
    pageNumber?: number;
    pageSize?: number;
}): Promise<IRoleDetails> => {
    const response = await getAPI(`api/roles/role-details-by-id?roleId=${payload.roleId}`, {});
    return response?.data?.data;
};

export const saveRoleDetails = async (payload: {
    roleName: string;
    responsibilityLevelId: number;
    functionId: number;
    subFunctionId: number;
    departmentId: number;
    subDepartmentId: number;
    userAttributeIds: string | null;
    kpiIds: string;
    isAllSubFunction: boolean;
    isAllDepartment: boolean;
    isAllSubDepartment: boolean;
    toolPersonaIds?: string | null;
}) => {
    return await postAPI('api/roles', payload);
};

export const getRoleBasedFilter = async (
    commanCenterHierarchy: string | null,
    filterType: string | null,
) => {
    const response = await getAPI(
        `/api/globalFilter/role-based-filters?commanCenterHierarchy=${commanCenterHierarchy}&filterType=${filterType}`,
    );
    return response?.data?.data;
};

export const checkDuplicateRoleDetails = async (payload: {
    roleName: string;
    responsibilityLevelId: number;
    geographyLevelId: number;
    functionId: number;
    subFunctionId: number;
    departmentId: number;
    subDepartmentId: number;
    userAttributeIds: string;
    kpiIds: string;
    isAllSubFunction?: boolean;
    isAllDepartment?: boolean;
    isAllSubDepartment?: boolean;
}) => {
    try {
        const response = await postAPI('api/roles/check-duplicate-role', payload);
        return response;
    } catch (error) {
        logError('Error checking duplicate role:', error);
        throw error;
    }
};

export const updateRoleDetails = async (payload: {
    roleName: string;
    roleId: number;
    responsibilityLevelId: number;
    geographyLevelId: number;
    functionId: number;
    subFunctionId: number;
    departmentId: number;
    subDepartmentId: number;
    userAttributeIds?: string;
    kpiIds?: string;
    isAllSubFunction: boolean;
    isAllDepartment: boolean;
    isAllSubDepartment: boolean;
    toolPersonaIds?: string;
}) => {
    const response = await putAPI(`api/roles/edit-role`, payload);
    return response?.data?.data;
};

export const getAllRoles = async () => {
    try {
        const response = await getAPI('api/common/roles', null);
        return response;
    } catch (error) {
        logError('Error checking duplicate role:', error);
        throw error;
    }
};

export const getLeadershipRoles = async () => {
    try {
        const response = await getAPI('api/common/leadership-roles', null);
        return response;
    } catch (error) {
        logError('Error checking duplicate role:', error);
        throw error;
    }
};

export const getLatestRoleId = async () => {
    try {
        const response = await getAPI('api/roles/latest-role-id', null);
        return response;
    } catch (error) {
        logError('Error getting latest role id:', error);
        throw error;
    }
};

export const deleteRoleAppDetails = async (payload: { toolId: number; roleId: number }) => {
    try {
        const response = await deleteAPI(
            `api/permission/app-role-mapping?roleId=${payload.roleId}&toolId=${payload.toolId}`,
            {},
        );
        return response?.data?.data;
    } catch (error) {
        logError('deleteRoleAppDetails error : ', error);
        return error;
    }
};

export const getAllToolsPersonaPermissionDetails = async () => {
    try {
        const response = await getAPI('api/permission/all-tools-persona-permission-details', null);
        return response;
    } catch (error) {
        logError('Something went wrong!', error);
        throw error;
    }
};

export const getToolPersonaPermissionByRole = async (payload: {
    roleId: number;
    pageNumber?: number;
    pageSize?: number;
}) => {
    try {
        const response = await getAPI(
            `api/permission/tool-persona-permission-by-role?roleId=${payload.roleId}`,
            null,
        );
        return response;
    } catch (error) {
        logError('Something went wrong!', error);
        throw error;
    }
};

export const deleteRoleToolPersona = async (payload: { roleId: number; personaId: number }) => {
    try {
        const response = await deleteAPI(
            `api/roles/role-persona?roleId=${payload.roleId}&personaId=${payload.personaId}`,
            {},
        );
        return response?.data?.data;
    } catch (error) {
        logError('deleteRoleToolPersona error : ', error);
        return error;
    }
};


export const getFilteredRolesAndUsers = async (payload: {
    exceptionId: string;
    geographyId: string;
    functionId: string;
    roleLevelId: string;
}) => {
    try {
        const response = await postAPI('api/common/get-roleuser-selection', payload);
        return response?.data?.data;
    } catch (error) {
        logError('Error checking duplicate role:', error);
        throw error;
    }
};

export const getFilteredRoles = async (payload: {
    locationId:number,
    functionId:number|null,
    subFunctionId:number|null,
    departmentId:number|null,
    subDepartmentId:number|null,
    responsibilityLevelId:number|null,
    search:string|null,
    pageNumber:number|1,
    pageSize:number|20
}) => {    
    try {
        const response = await postAPI('api/roles/roles-by-filters', payload);
        return response?.data?.data;
    } catch (error) {
        logError('Error', error);
        throw error;
    }
};

export const getAttributeOptions = async (payload: {
    attributeId:number,
    pageNumber?:number,
    pageSize?:number
}) => {
    try {
        const response = await postAPI('api/common/get-attribute-options', payload);
        return response?.data?.data;
    } catch (error) {
        logError('Error', error);
        throw error;
    }
};

export const saveNewRoleRequest = async (payload: INewRoleRequest)=>{
    try{
        const response = await postAPI('api/users/save-user-role-preferences', payload);        
        return response?.data;
    }
    catch(error){
        logError('Error', error);
        throw error;
    }
}

export const GetUserRoleRequests = async(type:string)=>{
    try{
        const response = await getAPI('api/roles/get-user-role-requests?requestType='+type);        
        return response?.data?.data[0];    
    }
    catch(error){
        logError('Error', error);
        throw error;
    }
}