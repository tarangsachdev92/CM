import {
    IToolFeature,
    IPersonaDescription,
    IPersonaPermissionMappings,
    IReportCombinationDetails,
    IReportCombinationSetup,
} from '../types/response';
import { logError } from '../utils/helpers';
import { deleteAPI, getAPI, postAPI, putAPI } from './api';

export type GeneralInfoDropdownTool = {
    toolId: number;
    toolName: string;
    toolUrl?: string | null;
    toolDocumentationUrl?: string | null;
    toolThumbnailUrl?: string | null;
}[];

export const getAdGroupsByAppId = async (appId: string) => {
    const response = await getAPI(
        `api/application/onboarding-application-permission?appName=${appId}`,
        {},
    );
    return response?.data?.data;
};

export const getApplicationDetailsById = async (appId: string) => {
    const response = await getAPI(`api/application/application-details-by-id?appId=${appId}`, {});
    return response?.data?.data;
};

export const saveApplicationDetails = async (payload: {
    toolId: number;
    toolTypeId: number;
    toolName: string;
    version: string;
    toolUrl: string;
    geographyLevelId: string | null;
    documentationUrl: string;
    thumbnailUrl: string;
    team: string;
    owner: string;
    toolDescription: string;
    region: string;
    cluster: string;
    market: string;
    site: string;
    urlActionId: number;
    urlActionName: string;
    functionId: string;
    subFunctionId: string;
    teamId: number;
    ownerEmail: string;
    toolFeatures: IToolFeature[];
    description: IPersonaDescription[];
    personaPermissionMappings: IPersonaPermissionMappings[];
    reportCombinationDetails?: IReportCombinationDetails[];
    reportCombinationSetups?: IReportCombinationSetup[];
}) => {
    return await postAPI('api/application/new-application', payload);
};

export const updateApplicationDetails = async (payload: {
    toolIds: string;
    owner: string;
    region: string;
    cluster: string;
    market: string;
    site: string;
}) => {
    return await postAPI('api/application/update-applications', payload);
};

export const editApplicationDetails = async (payload: {
    toolIds: string | null;
    functionIds: string | null;
    subFunctionIds: string | null;
    owner: string | null;
    team: string | null;
    toolDescription: string | null;
    region: string | null;
    cluster: string | null;
    market: string | null;
    site: string | null;
    toolUrl: string | null;
    documentationUrl: string | null;
    thumbnailUrl: string | null;
    isActive: boolean | null;
}) => {
    const response = await putAPI(`api/application/edit-application-detail`, payload);
    return response?.data?.data;
};

export const getLatestAppId = async () => {
    try {
        const response = await getAPI('api/application/latest-app-id', null);
        return response.data;
    } catch (error) {
        logError('Error getting latest App id:', error);
        throw error;
    }
};

export const getForumById = async (forumId: number) => {
    try {
        const response = await getAPI(`api/forum/forum-details-by-id?forumId=${forumId}`);
        return response.data.data;
    } catch (error) {
        logError('Error getting forum details:', error);
        throw error;
    }
};

export const getPowerBIEmbedToken = async (toolId: number) => {
    const response = await getAPI(`api/common/powerbi-embed-token?toolId=${toolId}`);
    return response.data.data;
};

export const checkUserAccessForReport = async (toolId: number) => {
    const response = await getAPI(`api/common/check-user-report-access?toolId=${toolId}`);
    return response.data.data;
};

export const getToolPersonas = async (toolId: number) => {
    const response = await getAPI(`api/application/get-tool-personas?toolId=${toolId}`, {});
    return response?.data?.data;
};

export const getToolPersonaConfiguration = async (toolId: number) => {
    const response = await getAPI(
        `api/application/get-tool-persona-configuration?toolId=${toolId}`,
        {},
    );
    return response?.data?.data;
};

export const createToolPersona = async (payload: {
    toolId: number;
    personaName: string;
    description: string;
}) => {
    const response = await postAPI('api/application/create-tool-persona', payload);
    return response?.data?.data;
};

export const editToolPersona = async (payload: {
    personaId: number;
    personaName: string;
    description: string;
    toolId: number;
    adGroupId: number | null | undefined;
    dataAccessId: number | null | undefined;
    roleIds: string | null;
}) => {
    const response = await putAPI('api/application/edit-tool-persona', payload);
    return response?.data?.data;
};

export const deleteToolPersona = async (payload: {
    personaId: number;
    targetPersonaId: number | null;
}) => {
    const { personaId, targetPersonaId } = payload;

    const response = await deleteAPI(
        `api/application/delete-tool-persona?PersonaId=${personaId}${
            targetPersonaId !== null ? `&TargetPersonaId=${targetPersonaId}` : ''
        }`,
        {},
    );

    return response?.data;
};

export const getToolAccessAndPermissionsById = async (toolId: number) => {
    const response = await getAPI(
        `api/application/new-tool-persona-permission?toolId=${toolId}`,
        {},
    );
    return response?.data?.data;
};

export const getGeographiesByTypeId = async (geographyTypeId: number) => {
    const response = await getAPI(
        `api/appReport/get-geography-by-level?geographyTypeId=${geographyTypeId}`,
        {},
    );
    return response?.data;
};

export const getToolReportCombinationsByToolId = async (toolId: number) => {
    const response = await getAPI(
        `api/appReport/get-toolmanagement-reportcombination-data?toolId=${toolId}`,
        {},
    );
    return response?.data;
};
export const deleteToolReportCombination = async (payload: {
    toolId: number;
    reportCombinationId: number;
}) => {
    const { toolId, reportCombinationId } = payload;

    const response = await deleteAPI(
        `api/application/delete-tool-report-combination?toolId=${toolId}&reportCombinationId=${reportCombinationId}`,
        {},
    );

    return response?.data?.data;
};

export const getRoleUserSelection = async (payload: {
    geographyLevelId: string | null;
    functionId: string | null;
    subFunctionId: string | null;
    roleResponsibilityLevelId: string | null;
    userEmail: string | null;
    userGroupId: string | null;
    roleId : string | null;
    locationId?: string | null;
    isLeadership?: boolean | null;
    searchKeyword?: string;
    pageNumber?: number;
    pageSize?: number;

}) => {
    return await postAPI('api/common/get-roleuser-selection', payload);
};

export const getRoleSelection = async (payload: {
    geographyLevelId: string | null;
    functionId: string | null;
    subFunctionId: string | null;
    roleResponsibilityLevelId: string | null;
    userGroupId: string | null;
    roleId: string | null;
    locationId: string | null;
    isLeadership: boolean | null;
    searchKeyword?: string;
    pageNumber: number;
    pageSize: number;
}) => {
    return await postAPI('api/common/get-role-selection', payload);
};

export const getAdgroupPermissionMapping = async (toolId: number) => {
    const response = await postAPI(
        `api/application/get-adgroup-permission-mapping?toolId=${toolId}`,
        {},
    );
    return response?.data;
};
export const editToolPersonaAccessPermissions = async (payload: {
    toolId: number;
    applicationPersonaDetails: {
        personaId: number | null;
        personaName: string;
        description: string;
        ADGroupId: string | null;
        dataAccessId: string | null;
        roleIds: string;
        isNew: boolean;
    }[];
    applicationToolPersonaPermissionMappings: {
        personaId: number | null;
        personaName: string;
        permissionId: number;
        isChecked: boolean | null;
    }[];
}) => {
    const response = await postAPI(`api/application/edit-tool-persona-access-permissions`, payload);
    return response?.data;
};

export const updateGeneralInformation = async (payload: {
    toolIds: string | null;
    owner: string | null;
    region: string | null;
    cluster: string | null;
    market: string | null;
    site: string | null;
    geographyLevelId: number | null;
    functionId: string | null;
    subFunctionId: string | null;
    isFunctionAll: boolean;
    isSubFunctionAll: boolean;
    isRegionAll: boolean;
    isClusterAll: boolean;
    isMarketAll: boolean;
    isSiteAll: boolean;
    ownerEmail: string | null;
    ownerWWID: string | null;
    documentationURL: string | null;
    thumbnailURL: string | null;
    teamId: number;
    description: string;
    status: boolean;
}) => {
    const response = await postAPI(`api/application/update-applications`, payload);
    return response?.data?.data;
};

export const saveToolCombination = async (payload: {
    toolId: number;
    reportCombinationDetails: [
        {
            reportCombinationId: number;
            tempKey: number;
            reportLevelId: number;
            reportPeriodId: number;
            reportGeographyId: string;
            isAllReportGeography: boolean;
        },
    ];
    reportCombinationForumMappings: [
        {
            forumId: number;
            forumPersonaTypeId: number;
            personaId: number;
            reportCombinationId: number;
            reportCombinationTempKey: number;
        },
    ];
    reportCombinationPersonaRoleMappings: [
        {
            personaId: number;
            roleIds: string;
            reportCombinationId: number;
            reportCombinationTempKey: number;
        },
    ];
}) => {
    const response = await postAPI(`api/application/save-tool-combination`, payload);
    return response?.data?.data;
};
