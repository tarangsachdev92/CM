import { createSlice, SerializedError } from '@reduxjs/toolkit';
import { fetchForumPersonaMappings } from '../thunks/fetchForumPersonaMappings';

export interface ForumPersonaType {
    forumPersonaTypeId: number;
    forumPersonaTypeName: string;
}

export interface ForumPersonaMappingToolPersona {
    personaId: number;
    personaName: string;
}

interface ForumPersonaMappingsState {
    forumPersonaTypes: ForumPersonaType[];
    toolPersonas: ForumPersonaMappingToolPersona[];
    loading: boolean;
    error: SerializedError | null;
}

const initialState: ForumPersonaMappingsState = {
    forumPersonaTypes: [],
    toolPersonas: [],
    loading: false,
    error: null,
};

const forumPersonaMappingsSlice = createSlice({
    name: 'forumPersonaMappings',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchForumPersonaMappings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchForumPersonaMappings.fulfilled, (state, action) => {
                state.loading = false;
                state.forumPersonaTypes = action.payload?.forumPersonaTypes ?? [];
                state.toolPersonas = action.payload?.toolPersonas ?? [];
            })
            .addCase(fetchForumPersonaMappings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error as SerializedError;
            });
    },
});

export default forumPersonaMappingsSlice.reducer;
