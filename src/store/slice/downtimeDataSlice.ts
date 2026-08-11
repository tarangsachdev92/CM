import { createSlice } from '@reduxjs/toolkit';
import { fetchDowntimeData } from '../thunks/fetchDowntimeData';
import { DowntimeData } from '../../types/response';

interface DownTimeDataState {
    DowntimeData: DowntimeData;
    loading: boolean;
    error: string | null;
}

const initialState: DownTimeDataState = {
    DowntimeData: { header:'', description:''},
    loading: false,
    error: null,
};

const downtimeDataSlice = createSlice({
    name: 'downTimeData',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchDowntimeData.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDowntimeData.fulfilled, (state, action) => {
                state.loading = false;
                state.DowntimeData = action.payload;
            })
            .addCase(fetchDowntimeData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default downtimeDataSlice.reducer;
