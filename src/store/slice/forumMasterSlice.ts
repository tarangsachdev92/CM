import { createSlice } from '@reduxjs/toolkit';
import {
    fetchForumDropdownInit,
    fetchSubFunctions,
    fetchRegions,
    fetchClusters,
    fetchMarkets,
    fetchSites,
    fetchPersona,
} from '../thunks/forumMasterData';

interface IForumMasterState {
    loading: boolean;
    error: string | null;

    functions: any[];
    geographyLevels: any[];
    forumPeriods: any[];

    subFunctions: any[];
    regions: any[];
    clusters: any[];
    markets: any[];
    sites: any[];
    personas: any[];
}

const initialState: IForumMasterState = {
    loading: false,
    error: null,

    functions: [],
    geographyLevels: [],
    forumPeriods: [],

    subFunctions: [],
    regions: [],
    clusters: [],
    markets: [],
    sites: [],
    personas: [],
};

const forumMasterSlice = createSlice({
    name: 'forumMaster',
    initialState,
    reducers: {
        resetMasterState: state => {
            state.error = null;
        },
    },
    extraReducers: builder => {
        builder

            .addCase(fetchForumDropdownInit.pending, state => {
                state.loading = true;
            })
            .addCase(fetchForumDropdownInit.fulfilled, (state, action) => {
                state.loading = false;
                state.functions = action.payload.functions || [];
                state.geographyLevels = action.payload.geographyLevels || [];
                state.forumPeriods = action.payload.forumPeriods || [];
            })

            .addCase(fetchSubFunctions.fulfilled, (state, action) => {
                state.subFunctions = action.payload;
            })

            .addCase(fetchRegions.fulfilled, (state, action) => {
                state.regions = action.payload;
            })

            .addCase(fetchClusters.fulfilled, (state, action) => {
                state.clusters = action.payload;
            })

            .addCase(fetchMarkets.fulfilled, (state, action) => {
                state.markets = action.payload;
            })

            .addCase(fetchSites.fulfilled, (state, action) => {
                state.sites = action.payload;
            })

            .addCase(fetchPersona.fulfilled, (state, action) => {
                state.personas = action.payload;
            });
    },
});

export const { resetMasterState } = forumMasterSlice.actions;
export default forumMasterSlice.reducer;
