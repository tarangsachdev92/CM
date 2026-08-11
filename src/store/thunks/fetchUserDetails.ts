import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services/api';
import type { IUserDataResponse } from '../../types/response';
import type { IUserRequest } from '../../types/request';

export const fetchUserData = createAsyncThunk(
    'users/fetchUserData',
    async (request: IUserRequest, { rejectWithValue }) => {        
        try {
           const response = await postAPI('/api/roles/user-access-details', request);
            return response.data.data as IUserDataResponse;
            
        } catch (error: any) {
            return rejectWithValue(error.response.data || 'An error occurred');
        } 
    },
);

export const fetchAllUserData = createAsyncThunk(
    'users/fetchAllUserData',
    async (request: IUserRequest, { rejectWithValue }) => {        
        try {
            const response = await postAPI('/api/roles/user-access-details', request);
            return response.data.data as IUserDataResponse;
            
        } catch (error: any) {
            return rejectWithValue(error.response.data || 'An error occurred');
        } 
    },
);