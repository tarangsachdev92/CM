import type {
    IssueImpactDetailsRequest,
    IssueImpactKpiRequest,
    IssueRootCauseRequest,
    IssueGeneralDeatilsRequest,
    IssueSituationRequest,
    IssueRecommendationCommentRequest,
    assignUserRequest,
    AddResolutionRequest,
    IEditMappingDetails,
    AddIssueActionCommentRequest,
    IssueActivity,
} from '../types/request';
import { ResolutionrecommendationDetailsData } from '../types/response';
import { logError } from '../utils/helpers';
import { deleteAPI, getAPI, patchAPI, postAPI, putAPI } from './api';

export const saveIssue = async (payload: {
    issueTitle: string;
    functionId: number;
    subFunctionId: number;
    issueCategoryId: number;
    priorityId: number;
    forumId: number;
    tags: string;
    collaboratorJSON: Array<{ CollabTypeId: number; CollaboratorEmail: string }>;
    dimensionMappingJSON: any[];
    descriptionContent: string;
    attachmentJSON: string;
    activityLogJSON?: IssueActivity;
}): Promise<{ data: any; statusCode: number; message: string }> => {
    const saveIssueRequest = {
        ...payload,
        tags: Array.isArray(payload.tags) ? payload.tags.join(',') : payload.tags, // Ensure the tags are a string
    };

    return await postAPI('api/IssueManagement/save-issue', saveIssueRequest);
};

export const deleteIssue = async (
    issueId: number,
): Promise<{ data: boolean; statusCode: number; message: string }> => {
    return await deleteAPI(`api/IssueManagement/issue?issueId=${issueId}`, {});
};

export const deleteFilterGroup = async (
    filterGroupId: number,
): Promise<{ data: boolean; statusCode: number; message: string }> => {
    return await deleteAPI(`api/IssueManagement/issue?issueId=${filterGroupId}`, {});
};

export const deleteIssueAction = async (
    issueId: number,
    actionId: number,
    activityLog: IssueActivity,
): Promise<{ data: boolean; statusCode: number; message: string }> => {
    return await deleteAPI(
        `api/IssueManagement/issue-action?issueId=${issueId}&actionId=${actionId}`,
        activityLog,
    );
};

export const markRecommendationAsFinalResolution = async (
    payload: ResolutionrecommendationDetailsData,
) => {
    const response = await postAPI(`api/IssueManagement/finalize-resolution`, payload);
    return response;
};

export const deleteIssueRecommendation = async (
    resolutionId: number,
    activityPayload: IssueActivity,
): Promise<{ data: boolean; statusCode: number; message: string }> => {
    return await deleteAPI(
        `api/IssueManagement/issue-resolution?resolutionId=${resolutionId}`,
        activityPayload,
    );
};

export const updateDecisionStatus = async (
    issueId: number,
    decisionStatus: number,
    activityLog: IssueActivity,
): Promise<{ data: boolean; statusCode: number; message: string }> => {
    return await postAPI(
        `api/IssueManagement/save-decision-status?issueId=${issueId}&decisionStatusId=${decisionStatus}`,
        activityLog,
    );
};

export const getIssueDetailsById = async (payload: {
    issueId: number | null;
    pageNumber?: number;
    pageSize?: number;
}) => {
    const response = await getAPI(
        `api/IssueManagement/issue-details-by-id?issueId=${payload.issueId}`,
        {},
    );
    return response?.data?.data;
};

export const getIssueCategories = async () => {
    const response = await getAPI(`api/IssueManagement/categories`, {});
    return response?.data?.data;
};

export const getIssueForums = async () => {
    const response = await getAPI(`api/common/forums`, {});
    return response?.data?.data;
};

export const getIssuePriority = async () => {
    const response = await getAPI(`api/common/priority`, {});
    return response?.data?.data;
};

export const getBlockedByIssueIds = async () => {
    const response = await getAPI(`api/IssueManagement/blocked-by-issue-ids`, {});
    return response?.data?.data;
};

export const getCollaboratorType = async () => {
    const response = await getAPI(`api/IssueManagement/collaborater-types`, {});
    return response?.data?.data;
};

export const getTags = async () => {
    const response = await getAPI(`api/IssueManagement/tags`, {});
    return response?.data?.data;
};

export const getRoleusers = async () => {
    const response = await getAPI(`api/IssueManagement/role-user`, {});
    return response?.data?.data;
};

export const saveGeneralDetails = async (payload: IssueGeneralDeatilsRequest) => {
    const response = await putAPI(`api/IssueManagement/edit-issue-general-detail`, payload);
    return response;
};

export const saveIssueSituation = async (payload: IssueSituationRequest) => {
    const response = await postAPI(`api/IssueManagement/issue-situation`, payload);
    return response;
};

export const getIssueImpactDetailsByIssueid = async (issueId: number | null) => {
    const response = await getAPI(`api/IssueManagement/issue-impact-details?issueId=${issueId}`);
    return response?.data?.data;
};

export const getIssueUserAssignment = async (issueId: number | null, sectionId: number | null) => {
    const response = await getAPI(
        `api/IssueManagement/issue-user-assignment?issueId=${issueId}&sectionId=${sectionId}`,
    );
    return response?.data?.data;
};

export const getIssueRecommendationByIssueid = async (issueId: number | null) => {
    const response = await getAPI(
        `api/IssueManagement/issue-resolution-recommendations?issueId=${issueId}`,
    );
    return response?.data?.data;
};

export const saveIssueImpactDetails = async (payload: IssueImpactDetailsRequest) => {
    const response = await postAPI(`api/IssueManagement/issue-impact-details`, payload);
    return response;
};

export const saveIssueActionComment = async (payload: AddIssueActionCommentRequest) => {
    const response = await postAPI(`api/IssueManagement/action-comment-details`, payload);
    return response;
};

export const saveAssignUserWithDateDetails = async (payload: assignUserRequest) => {
    const response = await postAPI(`api/IssueManagement/issue-user-assignment`, payload);
    return response;
};

export const toggleSCRTemplateFlag = async (issueId: number | null) => {
    const response = await patchAPI(`api/IssueManagement/scr-generation?issueId=${issueId}`, {});
    return response;
};

export const saveIssueRecommendationComment = async (
    payload: IssueRecommendationCommentRequest,
) => {
    const response = await postAPI(`api/IssueManagement/resolution-comment-details`, payload);
    return response;
};

export const getIssueRootCauseDetailsByIssueid = async (issueId: number | null) => {
    const response = await getAPI(`api/IssueManagement/root-cause-details?issueId=${issueId}`);
    return response?.data?.data;
};

export const saveIssueRootcauseDetails = async (payload: IssueRootCauseRequest) => {
    const response = await postAPI(`api/IssueManagement/root-cause-details`, payload);
    return response;
};

export const getIssueActionDetailsByIssueid = async (issueId: string | null) => {
    const requestBody = {
        issueIds: issueId ?? '',
        gridFilters: [],
    };
    const response = await postAPI(`api/IssueManagement/issue-action-details-by-id`, requestBody);
    return response?.data?.data;
};
// const fetchIssueActionDetails = createAsyncThunk(
//     'issueManagement/fetchIssueActionDetails',
//     async (issueId: string | null) => {
//         const requestBody = {
//             issueIds: issueId ?? '',
//             gridFilters: [],
//         };

//         const response = await postAPI(
//             'api/IssueManagement/issue-action-details-by-id',
//             requestBody,
//         );

//         return response?.data?.data;
//     },
// );

export const saveAction = async (payload: {
    issueId: string;
    actionTitle: string;
    assignedTo: string;
    dueDate: string;
    actionDescription: string;
}): Promise<{ data: any; statusCode: number; message: string }> => {
    const refinedPayload = { ...payload, dueDate: new Date(payload.dueDate).toISOString() };

    // Perform API call
    return await postAPI('/api/ActionManagement/save-issue-action', refinedPayload);
};

export const getKpiMasters = async () => {
    const response = await getAPI(`api/common/kpi-name`);
    return response;
};

export const saveIssueImpactKPIDetails = async (payload: IssueImpactKpiRequest[]) => {
    const response = await postAPI(`api/IssueManagement/issue-impact-kpi-details`, payload);
    return response;
};

export const UpdateActionStatus = async (payload: {
    issueId: string; // Converted issueId to number for consistency
    actionId: string;
    StatusId: string; // Assuming it's a status code (change if needed)
    IsActive: string; // Adjusted for clarity
    ActionTitle: string | null;
    AssignedTo: string | null;
    DueDate: string | null;
    ActionDescription: string | null;
    activityLogJSON?: IssueActivity;
}): Promise<{ data: any; statusCode: number; message: string }> => {
    const refinedPayload = {
        ...payload, // Convert boolean to string if needed
    };

    try {
        const response = await putAPI('/api/IssueManagement/edit-issue-action', refinedPayload);
        return response.data;
    } catch (error) {
        logError('Error updating action status:', error);
        throw error;
    }
};

export const UpdateAction = async (payload: {
    issueId: string; // Converted issueId to number for consistency
    actionId: string;
    IsActive: string; // Adjusted for clarity
    actionTitle: string;
    assignedTo: string;
    dueDate: string;
    actionDescription: string;
    activityLogJSON?: IssueActivity;
}): Promise<{ data: any; statusCode: number; message: string }> => {
    const refinedPayload = {
        ...payload, // Convert boolean to string if needed
    };

    try {
        const response = await putAPI('/api/IssueManagement/edit-issue-action', refinedPayload);
        return response.data;
    } catch (error) {
        logError('Error updating action status:', error);
        throw error;
    }
};

export const getIssueDecisionStatusMaster = async () => {
    const response = await getAPI(`api/IssueManagement/issue-decision-status-category`);
    return response?.data?.data;
};

export const createMSTeamsChat = async (
    issueId: number,
): Promise<{ data: boolean; statusCode: number; message: string }> => {
    try {
        const response = await postAPI(
            `api/IssueManagement/create-ms-teams-chat?issueId=${issueId}`,
            {},
        );
        return { data: true, statusCode: response?.status, message: response.message };
    } catch (error: any) {
        return { data: false, statusCode: error?.response?.status ?? 500, message: '' };
    }
};

export const createMSTeamsChatForAction = async (
    issueId: number,
    actionId: number,
): Promise<{ data: boolean; statusCode: number; message: string }> => {
    try {
        const response = await postAPI(
            `api/IssueManagement/create-ms-teams-chat-for-action?issueId=${issueId}&actionId=${actionId}`,
            {},
        );
        return { data: true, statusCode: response?.status, message: response.message };
    } catch (error: any) {
        return { data: false, statusCode: error?.response?.status ?? 500, message: '' };
    }
};

export const saveDimensionMappingDetails = async (editMappingDetails: IEditMappingDetails) => {
    const response = await putAPI(
        `api/IssueManagement/edit-dimension-mapping-detail`,
        editMappingDetails,
    );
    return response;
};

export const saveNewResolution = async (payload: AddResolutionRequest) => {
    const response = await postAPI(`api/IssueManagement/issue-resolution-details`, payload);
    return response;
};

export const getIssueScrDetails = async (payload: { issueId: number }) => {
    const response = await getAPI(
        `api/IssueManagement/scr-details-by-id?issueId=${payload.issueId}`,
    );
    return response?.data?.data;
};

export const getSections = async () => {
    const response = await getAPI(`api/IssueManagement/sections`);
    return response?.data?.data;
};

export const getForumMembers = async (forumId: number) => {
    const response = await getAPI(`api/IssueManagement/forum-members?forumId=${forumId}`);
    return response?.data?.data;
};

export const getIssueActivities = async (issueId: number) => {
    const response = await getAPI(`api/IssueManagement/issue-activity-log?issueId=${issueId}`);
    return response?.data?.data;
};

export const toggleForumStatus = async (forumId: number | null) => {
    const response = await patchAPI(`api/forum/forum-toggle-status?forumId=${forumId}`, {});
    return response;
};
