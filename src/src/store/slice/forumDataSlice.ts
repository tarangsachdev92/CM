import { createSlice } from '@reduxjs/toolkit';
import { fetchForumData } from '../thunks/fetchForumData';
import { IForumData, IRolePaginationData } from '../../types/response';

interface IForumState {
    forums: IForumData[];
    loading: boolean;
    error: string | null;
    paginationData: IRolePaginationData;
}

const initialState: IForumState = {
    forums: [],
    loading: false,
    error: null,
    paginationData: {
        totalRows: 0,
        totalPages: 0,
    },
};

const forumDataSlice = createSlice({
    name: 'forumData',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchForumData.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchForumData.fulfilled, (state, action) => {
                state.loading = false;
                state.forums = action.payload.forums;
                state.paginationData = {
                    totalRows: action.payload.pagination?.totalRows || 0,
                    totalPages: action.payload.pagination?.totalPages || 0,
                };
            })
            .addCase(fetchForumData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default forumDataSlice.reducer;
