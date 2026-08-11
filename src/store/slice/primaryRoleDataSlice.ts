import { createSlice } from '@reduxjs/toolkit';
import { fetchPrimaryRole } from '../thunks/fetchPrimaryRole';
import { IPrimaryRoleData } from '../../types/response';

interface IPrimaryRoleDataState {
    data: IPrimaryRoleData;
    isLoading: boolean;
    error: {} | null;
}

const initialState: IPrimaryRoleDataState = {
    data: {
        roleId: 0,
        latestRoleId: null,
        role: '',
        roleType: '',
        function: '',
        functionId: 0,
        subFunction: '',
        subFunctionId: 0,
        region: '',
        regionId: 0,
        cluster: '',
        clusterId: 0,
        market: '',
        marketId: 0,
        site: '',
        siteId: 0,
        roleLevel: '',
        department: '',
        levelName: '',
        subFunctionName: '',
        roleGeoName: '',
        secondaryRoles:[]
    },

    isLoading: false,
    error: null,
};

const PrimaryRoleDateSlice = createSlice({
    name: 'fetchPrimaryRole',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(fetchPrimaryRole.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchPrimaryRole.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data = action.payload;
        });
        builder.addCase(fetchPrimaryRole.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });
    },
});

export default PrimaryRoleDateSlice.reducer;
