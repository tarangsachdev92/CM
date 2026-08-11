import { createSlice } from '@reduxjs/toolkit';
import { getTagDetails } from '../thunks/getTagDetails';
import type { ITagsPayload } from '../../types/response';

export interface ITagsState {
    data: ITagsPayload;
    loading: boolean;
    error: string | null;
}

const initialState: ITagsState = {
    data: {
        tagCategoryDetails: [],
        tagDetails: [],
    },
    loading: false,
    error: null,
};

const tagsSlice = createSlice({
    name: 'tags',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(getTagDetails.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getTagDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload || initialState.data;
            })
            .addCase(getTagDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default tagsSlice.reducer;
