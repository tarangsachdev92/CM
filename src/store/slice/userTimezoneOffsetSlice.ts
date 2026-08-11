import { createSlice } from "@reduxjs/toolkit";
import { TimeZoneOffset } from "../../types/common";
import { fetchUserTimezoneOffset } from "../thunks/fetchUserTimezoneOffset";


interface IUserTimezoneOffsetDataState {
    data: TimeZoneOffset;
    isLoading: boolean;
    error: {} | null;
}

const initialState: IUserTimezoneOffsetDataState = {
    data: {
        userTimeOffset:null,
    },

    isLoading: false,
    error: null,
};

const UserTimezoneOffsetSlice = createSlice({
    name: 'fetchUserTimezoneOffset',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(fetchUserTimezoneOffset.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchUserTimezoneOffset.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data = action.payload;
        });
        builder.addCase(fetchUserTimezoneOffset.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });
    },
});

export default UserTimezoneOffsetSlice.reducer;
