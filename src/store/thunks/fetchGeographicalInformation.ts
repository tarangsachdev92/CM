import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchGeographicalRegion = createAsyncThunk('common/fetchGeographicalRegion', async () => {
    const response = await getAPI('api/common/regions');
    return response.data.data;
});

const fetchGeographicalClusters = createAsyncThunk(
    'common/fetchGeographicalClusters',
    async (payload: { regionId: number }) => {
        const response = await getAPI('api/common/clusters', payload);
        return response.data.data;
    },
);

const fetchGeographicalClustersOnMultipleRegionsIds = createAsyncThunk(
    'common/fetchGeographicalClustersMultiple',
    async (payload: { regionIds: number | number[] }) => {
        // Convert to comma-separated string
        const regionIds = Array.isArray(payload.regionIds)
            ? payload.regionIds.join(',')
            : payload.regionIds.toString();

        const response = await getAPI(`api/common/clusters-multiple-regionIds?regionIds=${regionIds}`);
        return response.data.data;
    }
);

const fetchGeographicalMarkets = createAsyncThunk(
    'common/fetchGeographicalMarkets',
    async (payload: { clusterId: number }) => {
        const response = await getAPI('api/common/markets', payload);
        return response.data.data;
    },
);

const fetchGeographicalMarketsOnMultipleClusterIds = createAsyncThunk(
    'common/fetchGeographicalMarketsMultiple',
    async (payload: { clusterIds: number | number[] }) => {
        // Convert to comma-separated string
        const clusterIds = Array.isArray(payload.clusterIds)
            ? payload.clusterIds.join(',')
            : payload.clusterIds.toString();
        const response = await getAPI(`api/common/markets-multiple-clusterIds?clusterIds=${clusterIds}`);
        return response.data.data;
    }
);

const fetchGeographicalSites = createAsyncThunk(
    'common/fetchGeographicalSites',
    async (payload: { marketId: number }) => {
        const response = await getAPI('api/common/sites', payload);
        return response.data.data;
    },
);

const fetchGeographicalSitesOnMultipleMarketIds = createAsyncThunk(
    'common/fetchGeographicalSitesMultiple',
    async (payload: { marketIds: number | number[] }) => {
        // Convert to comma-separated string
        const marketIds = Array.isArray(payload.marketIds)
            ? payload.marketIds.join(',')
            : payload.marketIds.toString();
        const response = await getAPI(`api/common/sites-multiple-marketIds?marketIds=${marketIds}`);
        return response.data.data;
    }
);

export {
    fetchGeographicalRegion,
    fetchGeographicalClusters,
    fetchGeographicalMarkets,
    fetchGeographicalSites,
    fetchGeographicalClustersOnMultipleRegionsIds,
    fetchGeographicalMarketsOnMultipleClusterIds,
    fetchGeographicalSitesOnMultipleMarketIds,
};
