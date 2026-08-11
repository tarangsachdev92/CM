import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ISelectedCalendarData } from '../../types/response';

interface ISelectedCalendarState {
    data: ISelectedCalendarData | null;
    isLoading: boolean;
    error: {} | null;
}

const initialState: ISelectedCalendarState = {
    data: null,
    isLoading: false,
    error: null,
};

export const setSelectedCalendar = createAsyncThunk(
    'calendar/setSelectedCalendar',
    async (selectedData: ISelectedCalendarData) => {
        return selectedData;
    },
);

const selectedCalendarSlice = createSlice({
    name: 'selectedCalendar',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(setSelectedCalendar.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(setSelectedCalendar.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data = action.payload;
        });
        builder.addCase(setSelectedCalendar.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });
    },
});

export default selectedCalendarSlice.reducer;
