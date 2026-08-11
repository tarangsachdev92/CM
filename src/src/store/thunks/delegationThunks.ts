// src/store/thunks/delegationThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getDelegations } from '../../services/delegation';
import { getDelegationsNew } from '../../services/delegationNew';

export const fetchDelegations = createAsyncThunk(
    'delegation/fetchDelegations',
    async (payload: { pageSize: number; pageNumber: number }) => {
        const response = await getDelegations(payload);

        // API shape:
        // { statusCode: 200, data: [...], message: null }

        return {
            items: response.data ?? [],
            totalRows: response.data?.[0]?.delegationCount ?? 0,
            totalPages: 1,
        };
    },
);


export const fetchDelegationsNew = createAsyncThunk(
    'delegationNew/fetchDelegations',
    async (payload: { pageSize: number; pageNumber: number }) => {
        const response = await getDelegationsNew(payload);
        return {
            items: response.data ?? [],
            totalRows: response.data?.[0]?.delegationCount ?? 0,
            totalPages: 1,
        };
    },
);
