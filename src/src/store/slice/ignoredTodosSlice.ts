// src/store/slices/ignoredTodosSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { fetchIgnoredTodos } from '../thunks/fetchIgnoredTodos';

export interface IgnoredTodo {
    id: number;
    sourceSystemUniqueIdentifier: string;
    sectionId: number;
    title: string | null;
    subtitle: string | null;
    status: string | null;
    dueDate: string | null;
    priority: string | null;
    assignedTo: string | null;
    assignee: string | null;
    source: string | null;
    issueSectionId: number;
    description: string | null;
    completedOn: string | null;
    issueSectionName: string | null;
    readmorelink: string | null;
    sourcesystemid: number;
    isIncorrectAssignment: boolean;
    isreccuring: boolean;
    executionfrequency: string | null;
    ignoreTill: string | null;
    ignorenumber: string | null;
    attributes?: any[];
    moduleName: string | null;
}

export interface IgnoredTodosState {
    todos: IgnoredTodo[];
    loading: boolean;
    error: string | null;
}

const initialState: IgnoredTodosState = {
    todos: [],
    loading: false,
    error: null,
};

const ignoredTodosSlice = createSlice({
    name: 'ignoredTodos',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchIgnoredTodos.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIgnoredTodos.fulfilled, (state, action) => {
                state.loading = false;
                state.todos = action.payload || [];
            })
            .addCase(fetchIgnoredTodos.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch ignored todos';
            });
    },
});

export default ignoredTodosSlice.reducer;
