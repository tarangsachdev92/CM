import { createSlice } from '@reduxjs/toolkit';
import { fetchLastRefreshDate } from '../thunks/fetchLastRefreshDate';
import { ILastRefreshData } from '../../types/response';

interface ILastRefreshDataState {
    data: ILastRefreshData;
    isLoading: boolean;
    error: {} | null;
}

const initialState: ILastRefreshDataState = {
    data: {
        userId: 0,
        firstName: null,
        lastName: null,
        userName: '',
        userEmail: '',
        activityTimeStamp: '',
    },

    isLoading: false,
    error: null,
};

const LastRefreshDateSlice = createSlice({
    name: 'fetchLastRefreshDate',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(fetchLastRefreshDate.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchLastRefreshDate.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data = action.payload;
        });
        builder.addCase(fetchLastRefreshDate.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });
    },
});

export default LastRefreshDateSlice.reducer;
