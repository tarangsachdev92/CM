import { createSlice } from '@reduxjs/toolkit';
import { getForumDetails } from '../thunks/getForumDetails';
import { IForumData, IForumFiltersData, IRolePaginationData } from '../../types/response';

interface IForumState {
    data: IForumData[];
    loading: boolean;
    error: string | null;
    totalRows: number;
    totalPages: number;
    columnFilters: IForumFiltersData;
    paginationData: IRolePaginationData;
}

const initialState: IForumState = {
    data: [],
    loading: false,
    error: null,
    totalRows: 0,
    totalPages: 0,
    columnFilters: {
        forumName: [],
        function:[],
        functionName: [],
        subFunctionName:[],
        Region: [],
        Cluster: [],
        Market: [],
        Site: [],
        forumOwner: [],
        repeatsEveryType: [],
        forumLevel:[],
        forumPeriod:[],
    },
    paginationData: {
        totalRows: 0,
        totalPages: 0,
    },
};

const forumSlice = createSlice({
    name: 'forum',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(getForumDetails.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getForumDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.forums;
                state.totalRows = action.payload.pagination?.totalRows;
                state.totalPages = action.payload.pagination?.totalPages;
                state.columnFilters = action.payload.distinctFilters;
                state.paginationData = action.payload.pagination;
            })
            .addCase(getForumDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default forumSlice.reducer;
