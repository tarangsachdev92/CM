import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI, postAPI } from '../../services/api';
import { IDimensionValueRequest } from '../../types/request';

const fetchIssueFunctions = createAsyncThunk('common/fetchRoleFunctions', async () => {
    const response = await getAPI('api/common/functions');
    return response.data.data;
});

const fetchIssueSubFunctions = createAsyncThunk(
    'common/fetchSubRoleFunctions',
    async (payload: { functionId: number }) => {
        const response = await getAPI('api/common/sub-functions', payload);
        return response.data.data;
    },
);

const fetchIssueCategories = createAsyncThunk('Issue/categories', async () => {
    const response = await getAPI('api/IssueManagement/categories');
    return response.data.data;
});

const fetchIssuePriority = createAsyncThunk('Issue/priority', async () => {
    const response = await getAPI(`api/IssueManagement/priority`);
    return response.data.data;
});

const fetchIssueForums = createAsyncThunk('Issue/forums', async () => {
    const response = await getAPI(`api/IssueManagement/forums`);
    return response.data.data;
});

const fetchIssueTags = createAsyncThunk('Issue/tags', async () => {
    const response = await getAPI(`api/IssueManagement/tags`);
    return response.data.data;
});

const fetchDimensionData = createAsyncThunk('issue/fetchDimensionData', async () => {
    const response = await getAPI('api/IssueManagement/dimension');
    return response.data.data;
});

const fetchDimensionValue = createAsyncThunk('issue/fetchDimensionValue', async () => {
    const response = await getAPI('api/notification/dimension-values');
    return response.data.data;
});

const fetchDimension = createAsyncThunk('issue/fetchDimension', async () => {
    const response = await getAPI('api/notification/dimension');
    return response.data.data;
});

const fetchOtherDimensionValues = createAsyncThunk(
    'issueManagement/fetchOtherDimensionValues',
    async (request: IDimensionValueRequest) => {
        const response = await postAPI(
            'api/notification/other-dimension-values',
            request
        );
        return response?.data?.data;
    }
);

const fetchIssueActionDetails = createAsyncThunk(
    'issueManagement/fetchIssueActionDetails',
    async (issueId: string | null) => {
        const requestBody = {
            issueIds: issueId ?? '',
            gridFilters: [],
        };

        const response = await postAPI(
            'api/IssueManagement/issue-action-details-by-id',
            requestBody,
        );

        return response?.data?.data;
    },
);

const fetchIssueRoleUser = createAsyncThunk('Issue/RoleUser', async () => {
    const response = await getAPI(`api/IssueManagement/role-user`);
    return response.data.data;
});

const fetchIssueOwner = createAsyncThunk('Issue/Owner', async () => {
    const response = await getAPI(`api/IssueManagement/forums`);
    return response.data.data;
});

const fetchIssueScrDetails = createAsyncThunk('Issue/ScrDetails', async () => {
    const response = await getAPI(`api/IssueManagement/scr-details-by-id`);
    return response.data.data;
});

export {
    fetchIssueFunctions,
    fetchIssueSubFunctions,
    fetchIssueCategories,
    fetchIssuePriority,
    fetchIssueForums,
    fetchIssueTags,
    fetchDimensionData,
    fetchDimensionValue,
    fetchDimension,
    fetchIssueActionDetails,
    fetchIssueRoleUser,
    fetchIssueOwner,
    fetchIssueScrDetails,
    fetchOtherDimensionValues
};
