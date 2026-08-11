import { createSlice, SerializedError } from '@reduxjs/toolkit';
import { fetchTeam, fetchOwnerName } from '../thunks/fetchTeamAndOwnerName';

const initialState = {
    team: [],
    ownerName: [],
    loading: false,
    error: null as SerializedError | null,
};

const teamAndOwnerNameSlice = createSlice({
    name: 'teamAndOwnerNameSlice',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchTeam.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTeam.fulfilled, (state, action) => {
                state.loading = false;
                state.team = action.payload;
            })
            .addCase(fetchTeam.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error as SerializedError;
            })
            .addCase(fetchOwnerName.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOwnerName.fulfilled, (state, action) => {
                state.loading = false;
                state.ownerName = action.payload;
            })
            .addCase(fetchOwnerName.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error as SerializedError;
            });
    },
});

export default teamAndOwnerNameSlice.reducer;