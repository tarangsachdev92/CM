import { createAsyncThunk } from '@reduxjs/toolkit';
import { deleteAPI, getAPI, postAPI } from '../../services/api';

const fetchPrimaryRole = createAsyncThunk('common/fetchPrimaryRole', async () => {
    const response = await getAPI('api/users/primary-role');
    return response.data.data;
});

const fetchPrimaryRoleNew = createAsyncThunk('common/fetchPrimaryRoleNew', async () => {
    const response = await getAPI('api/users/get-user-primary-role');
    return response.data.data;
});

const fetchUserRoleCardDetails = createAsyncThunk('common/fetchUserRoleCardDetails', async () => {
    const response = await getAPI('api/users/get-user-role-card-details');
    return response.data.data;
});

const fetchRoleRequestStatus = createAsyncThunk('common/fetchRoleRequestStatus', async () => {
    const response = await getAPI('api/users/get-user-role-status-chips');
    return response.data.data;
});

const fetchForumDetail = createAsyncThunk('common/fetchForumDetail', async (req: {pageSize: number, pageNumber: number}) => {
    const response = await getAPI(`api/forum/roles-tab-forum-details?pageNumber=${req.pageNumber}&pageSize=${req.pageSize}`);
    return response.data.data;
});

const editForumData = createAsyncThunk('common/editForumDetail', async (request: {
    forumId: number,
    personaId: number,
    geographyId: number,
    roleUsers: {roleId: number,
        users: {
            userEmail: string
        }[]
    }[],

}) => {
    const response = await postAPI('api/forum/edit-forum-members', request);
    return response.data.data;
});


const resendRequestForAutoRejects = createAsyncThunk(
    'users/resendRequestForAutoRejects',
    async (request: {roleId: number, adGroups: string}, { rejectWithValue }) => {
        try {
            const response = await postAPI(`api/users/edit-user-role-reject-status?roleId=${request.roleId}&adGroups=${request.adGroups}`, request);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data || 'An error occurred');
        }
    },
);

const deleteUserRoleMapping = createAsyncThunk(
    'users/deleteUserRoleMapping',
    async (request: {roleId: number}, { rejectWithValue }) => {
        try {
            const response = await deleteAPI(`api/users/delete-user-role-by-id?roleId=${request.roleId}`, request);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data || 'An error occurred');
        }
    },
);

export { fetchPrimaryRole, fetchPrimaryRoleNew, fetchUserRoleCardDetails, fetchRoleRequestStatus, resendRequestForAutoRejects, deleteUserRoleMapping, fetchForumDetail, editForumData };
