import { createSlice } from '@reduxjs/toolkit';
import { getUserGlobalFilters } from '../thunks/getUserGlobalFilters';
import { IUserActiveGlobalFilter } from '../../types/response';

interface IUserGlobalFilter {
    data: IUserActiveGlobalFilter;
    loading: boolean;
    error: string | null;
};

const initialState: IUserGlobalFilter = {
    data: {
        financialCycle: '',
        userGlobalFilters: {
            geographies: {
                regions: [],
                clusters: [],
                markets: [],
                sites: [],
                siteCode: []
            },
            products: {
                segments: [],
                categories: [],
                brands: []
            },
            customers: {
                channels: [],
                customers: []
            }
        }
    },
    loading: false,
    error: null
};

const userGlobalFilterSlice = createSlice({
    name: 'userGlobalFilter',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(getUserGlobalFilters.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUserGlobalFilters.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(getUserGlobalFilters.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default userGlobalFilterSlice.reducer;