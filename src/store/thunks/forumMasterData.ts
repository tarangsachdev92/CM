import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

export const fetchForumDropdownInit = createAsyncThunk(
    'forumMaster/fetchDropdownInit',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getAPI('api/forum/forum-general-dropdowns-init');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch dropdowns');
        }
    },
);

export const fetchSubFunctions = createAsyncThunk(
    'forumMaster/fetchSubFunctions',
    async (functionId: number, { rejectWithValue }) => {
        try {
            const response = await getAPI(`api/forum/subfunctions?functionId=${functionId}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch subfunctions');
        }
    },
);

export const fetchRegions = createAsyncThunk(
    'forumMaster/fetchRegions',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getAPI('api/forum/regions');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch regions');
        }
    },
);

export const fetchClusters = createAsyncThunk(
    'forumMaster/fetchClusters',
    async (regionIds: string[], { rejectWithValue }) => {
        try {
            const query = regionIds.join(',');
            const response = await getAPI(`api/forum/clusters?regionId=${query}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch clusters');
        }
    },
);

export const fetchMarkets = createAsyncThunk(
    'forumMaster/fetchMarkets',
    async (clusterIds: string[], { rejectWithValue }) => {
        try {
            const query = clusterIds.join(',');
            const response = await getAPI(`api/forum/markets?clusterId=${query}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch markets');
        }
    },
);

export const fetchSites = createAsyncThunk(
    'forumMaster/fetchSites',
    async (marketIds: string[], { rejectWithValue }) => {
        try {
            const query = marketIds.join(',');
            const response = await getAPI(`api/forum/sites?marketId=${query}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch sites');
        }
    },
);

export const fetchPersona = createAsyncThunk(
    'forumMaster/fetchPersona',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getAPI('api/forum/forum-persona');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch persona');
        }
    },
);
