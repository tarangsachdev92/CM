import { createSlice } from '@reduxjs/toolkit';
import { fetchApplicationData } from '../thunks/fetchApplicationData';
import { IToolData, IApplicationFiltersData, IPaginationData } from '../../types/response';

interface IApplicationState {
    data: IToolData[];
    loading: boolean;
    error: string | null;
    totalRows: number;
    totalPages: number;
    columnFilters: IApplicationFiltersData;
    paginationData: IPaginationData;
}

const initialState: IApplicationState = {
    data: [],
    loading: false,
    error: null,
    totalRows: 0,
    totalPages: 0,
    columnFilters: {
        "Sub-Function": [],
        "Geography Level": [],
        "Tool Name": [],
        "Owner": [],
        "Type": [],
        Status: [],
        ToolOwner: [],
        ToolType: [],
        Function: [],
        SubFunction: [],
        Market: [],
        Region: [],
        Site: [],
        Team: [],
        Version: [],
        Tool: []
    },
    paginationData: {
        totalRows: 0,
        totalPages: 0,
    },
};

const applicationDataSlice = createSlice({
    name: 'applicationData',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchApplicationData.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchApplicationData.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.data.tools;
                state.totalRows = action.payload.data.pagination?.totalRows;
                state.totalPages = action.payload.data.pagination?.totalPages;
                state.columnFilters = action.payload.data.distinctFilters;
                state.paginationData = action.payload.data.pagination;
            })
            .addCase(fetchApplicationData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default applicationDataSlice.reducer;
