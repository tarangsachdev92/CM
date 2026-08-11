// src/store/slices/todoFiltersSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { fetchToDoFilters } from '../thunks/fetchToDoFilters';

export interface ToolName {
    toolName: string;
}
export interface PriorityName {
    priorityName: string;
}
export interface DueDate {
    dueDate: string;
    status: string;
}

export interface ToDoFiltersState {
    toolNames: ToolName[];
    priorityNames: PriorityName[];
    dueDates: DueDate[];
    loading: boolean;
    error: string | null;
}

const initialState: ToDoFiltersState = {
    toolNames: [],
    priorityNames: [],
    dueDates: [],
    loading: false,
    error: null,
};

const todoFiltersSlice = createSlice({
    name: 'todoFilters',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchToDoFilters.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchToDoFilters.fulfilled, (state, action) => {
                state.loading = false;
                state.toolNames = action.payload.toolNames || [];
                state.priorityNames = action.payload.priorityNames || [];
                state.dueDates = action.payload.dueDates || [];
            })
            .addCase(fetchToDoFilters.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch filters';
            });
    },
});

export default todoFiltersSlice.reducer;
