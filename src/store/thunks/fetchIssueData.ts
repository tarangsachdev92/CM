import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI, postAPI } from '../../services/api';
import type { IIssueRequest } from '../../types/request';

export const fetchIssuenData = createAsyncThunk(
    'issue/fetchIssueData',
    async (request: IIssueRequest, { rejectWithValue }) => {
        try {
            const response = await postAPI('api/IssueManagement/app-issue-details', request);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data || 'An error occurred');
        }
    },
);

export const fetchColumnPreference = createAsyncThunk(
    'issue/fetchColumnPreference',
    async (payload: { pageId: string }) => {
        const response = await getAPI('api/IssueManagement/user-column-preference', payload);
        return response.data;
    },
);

export const saveColumnPreference = createAsyncThunk(
    'issue/saveColumnPreference',
    async ({ userColumnPreferenceJson, pageId }: { userColumnPreferenceJson: string; pageId: string }, { rejectWithValue }) => {
        try {
            const response = await postAPI('api/IssueManagement/save-user-column-preference', {
                userColumnPreferenceJson,
                pageId
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'An error occurred while saving column preferences');
        }
    }
);
