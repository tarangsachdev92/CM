import { createSlice, SerializedError } from '@reduxjs/toolkit';
import { fetchToolName } from '../thunks/fetchToolName';

const initialState = {
    toolName: [],
    loading: false,
    error: null as SerializedError | null,
};

const toolNameSlice = createSlice({
    name: 'toolNameSlice',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchToolName.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchToolName.fulfilled, (state, action) => {
                console.log('action:', action.payload);
                state.loading = false;
                state.toolName = action.payload;
            })
            .addCase(fetchToolName.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error as SerializedError;
            });
    },
});

export default toolNameSlice.reducer;
