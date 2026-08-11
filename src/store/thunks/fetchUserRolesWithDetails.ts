import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';
import type { UserRolesWithDetailsResponse } from '../../types/response';

const fetchUserRolesWithDetails = createAsyncThunk<
    UserRolesWithDetailsResponse,
    void,
    { rejectValue: string }
>('user/fetchUserRolesWithDetails', async (_, { rejectWithValue }) => {
    try {
        const response = await getAPI('api/roles/user-roles-with-details');

        const json = response.data as {
            statusCode: number;
            data: UserRolesWithDetailsResponse;
            message: string | null;
        };

        return (
            json?.data ?? {
                roles: [],
                statusCounts: [],
                attributes: [],
            }
        );
    } catch (error: any) {
        return rejectWithValue(error?.response?.data?.message || 'Failed to fetch user roles');
    }
});

export { fetchUserRolesWithDetails };
