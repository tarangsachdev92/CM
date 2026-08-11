// src/features/forum/forumSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { addForumOwner } from '../thunks/addForumOwner';

type PersonOption = { id: number; name: string; email?: string };

type ForumOwnerData = {
    forumOwner1?: PersonOption[];
    forumOwner2?: PersonOption[];
    collaborator?: PersonOption[];
};

const initialState: {
    forumOwners: ForumOwnerData;
    loading: boolean;
    error: string | null;
} = {
    forumOwners: {},
    loading: false,
    error: null,
};

const forumSlice = createSlice({
    name: 'forum',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(addForumOwner.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addForumOwner.fulfilled, (state, action) => {
                state.loading = false;
                state.forumOwners = action.payload;
            })
            .addCase(addForumOwner.rejected, state => {
                state.loading = false;
            });
    },
});

export default forumSlice.reducer;
