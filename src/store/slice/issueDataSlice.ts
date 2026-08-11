import { createSlice } from '@reduxjs/toolkit';
import { IIssueData, IIssueFiltersData, IPaginationData } from '../../types/response';
import { fetchIssuenData, fetchColumnPreference, saveColumnPreference } from '../thunks/fetchIssueData';

interface IIssueState {
    data: IIssueData[];
    loading: boolean;
    error: string | null;
    totalRows: number;
    totalPages: number;
    hasIssues: number;
    columnFilters: IIssueFiltersData;
    paginationData: IPaginationData;
    columnPreferences: {
        shownColumns: string[];
        columnPositions: Array<{
            columnName: string;
            columnValue: number;
        }>;
    };
}

const initialState: IIssueState = {
    data: [],
    loading: false,
    error: null,
    totalRows: 0,
    totalPages: 0,
    hasIssues: 0,
    columnFilters: {
        issueTitle: [],
        product: [],
        forum: [],
        issueOwner: [],
        decisionStatus: [],
        actionStatus: [],
        dueDate: [],
        priority: [],
        lane: [],
    },
    paginationData: {
        totalRows: 0,
        totalPages: 0,
    },
    columnPreferences: {
        shownColumns: [],
        columnPositions: []
    }
};

const issueDataSlice = createSlice({
    name: 'issueData',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchIssuenData.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIssuenData.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.data.exceptionManagement;
                state.totalRows = action.payload.data.pagination?.totalRows;
                state.totalPages = action.payload.data.pagination?.totalPages;
                state.columnFilters = action.payload.data.distinctFilters;
                state.paginationData = action.payload.data.pagination;
                state.hasIssues = action.payload.data.hasIssues;
            })
            .addCase(fetchIssuenData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Fetch Column Preferences
            .addCase(fetchColumnPreference.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchColumnPreference.fulfilled, (state, action) => {
                state.loading = false;
                state.columnPreferences = {
                    shownColumns: action.payload?.data?.columnShown || [],
                    columnPositions: action.payload?.data?.columnPosition || []
                };
            })
            .addCase(fetchColumnPreference.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Save Column Preferences
            .addCase(saveColumnPreference.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(saveColumnPreference.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(saveColumnPreference.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default issueDataSlice.reducer;
