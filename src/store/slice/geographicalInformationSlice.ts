import { createSlice } from '@reduxjs/toolkit';
import {
    fetchGeographicalRegion,
    fetchGeographicalClusters,
    fetchGeographicalMarkets,
    fetchGeographicalSites,
    fetchGeographicalClustersOnMultipleRegionsIds,
    fetchGeographicalMarketsOnMultipleClusterIds,
    fetchGeographicalSitesOnMultipleMarketIds,
} from '../thunks/fetchGeographicalInformation';
import { IClustersData, ILocationsData, IMarketsData, ISitesData } from '../../types/response';

interface IGeographicalInformation {
    data: {
        regions: ILocationsData[] | [];
        clusters: IClustersData[] | [];
        markets: IMarketsData[] | [];
        sites: ISitesData[] | [];
    };
    isLoading: boolean;
    error: {} | null;
}

const initialState: IGeographicalInformation = {
    data: {
        regions: [],
        clusters: [],
        markets: [],
        sites: [],
    },

    isLoading: false,
    error: null,
};

const GeographicalInformationSlice = createSlice({
    name: 'fetchGeographicalInformation',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(fetchGeographicalRegion.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchGeographicalRegion.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data.regions = action.payload;
        });
        builder.addCase(fetchGeographicalRegion.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchGeographicalClusters.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchGeographicalClusters.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data.clusters = action.payload;
        });
        builder.addCase(fetchGeographicalClusters.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchGeographicalMarkets.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchGeographicalMarkets.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data.markets = action.payload;
        });
        builder.addCase(fetchGeographicalMarkets.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchGeographicalSites.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchGeographicalSites.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data.sites = action.payload;
        });
        builder.addCase(fetchGeographicalSites.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchGeographicalClustersOnMultipleRegionsIds.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchGeographicalClustersOnMultipleRegionsIds.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data.clusters = action.payload;
        });
        builder.addCase(fetchGeographicalClustersOnMultipleRegionsIds.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchGeographicalMarketsOnMultipleClusterIds.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchGeographicalMarketsOnMultipleClusterIds.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data.markets = action.payload;
        });
        builder.addCase(fetchGeographicalMarketsOnMultipleClusterIds.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchGeographicalSitesOnMultipleMarketIds.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchGeographicalSitesOnMultipleMarketIds.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data.sites = action.payload;
        });
        builder.addCase(fetchGeographicalSitesOnMultipleMarketIds.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });
    },
});

export default GeographicalInformationSlice.reducer;
