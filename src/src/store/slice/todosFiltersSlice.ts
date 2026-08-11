// src/store/slices/todosFiltersSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TodoFiltersState {
    selectedTool: string[];
    selectedPriority: string[];
    selectedDueDate: string[];
}

const initialState: TodoFiltersState = {
    selectedTool: [],
    selectedPriority: [],
    selectedDueDate: [],
};

const todosFiltersSlice = createSlice({
    name: 'todosFilters',
    initialState,
    reducers: {
        setSelectedTool(state, action: PayloadAction<string[]>) {
            state.selectedTool = action.payload;
        },
        setSelectedPriority(state, action: PayloadAction<string[]>) {
            state.selectedPriority = action.payload;
        },
        setSelectedDueDate(state, action: PayloadAction<string[]>) {
            state.selectedDueDate = action.payload;
        },
        resetFilters(state) {
            state.selectedTool = [];
            state.selectedPriority = [];
            state.selectedDueDate = [];
        },
    },
});

export const { setSelectedTool, setSelectedPriority, setSelectedDueDate, resetFilters } =
    todosFiltersSlice.actions;
export default todosFiltersSlice.reducer;
