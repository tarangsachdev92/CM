import { createSlice, SerializedError } from '@reduxjs/toolkit';
import { fetchOnboardingAppPermission } from '../thunks/fetchOnboardingAppPermission';

const initialState = {
    toolName: [],
    loading: false,
    error: null as SerializedError | null,
};

const onboardingAppPermissionSlice = createSlice({
    name: 'onboardingAppPermissionSlice',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchOnboardingAppPermission.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOnboardingAppPermission.fulfilled, (state, action) => {
                state.loading = false;
                state.toolName = action.payload;
            })
            .addCase(fetchOnboardingAppPermission.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error as SerializedError;
            });
    },
});

export default onboardingAppPermissionSlice.reducer;
