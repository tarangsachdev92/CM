import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI, postAPI } from '../../services/api';
import type { IApplicationRequest } from '../../types/request';

const fetchApplicationData = createAsyncThunk(
    'application/fetchApplicationData',
    async (request: IApplicationRequest, { rejectWithValue }) => {
        try {
            const response = await postAPI('api/application/tool-details', request);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data || 'An error occurred');
        }
    },
);

const fetchApplicationDetailsById = createAsyncThunk(
    'application/fetchApplicationDetailsById',
    async (payload: { appId: number }) => {
        const response = await getAPI('api/application/application-details-by-id', payload);
        return response.data.data;
    },
);

const fetchRolePermissionsForApplication = createAsyncThunk(
    'application/fetchRolePermissionsForApplication',
    async (payload: { appId: number; pageSize: number; pageNumber: number }) => {
        const response = await getAPI('api/application/role-app-permission-by-appid', payload);
        return response.data.data;
    },
);

export { fetchApplicationData, fetchApplicationDetailsById, fetchRolePermissionsForApplication };
