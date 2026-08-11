import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SelectedToDo {
    title: string;
    subtitle: string;
    selectedToDoId?: string;
    taskAFId?: string;
}

const initialState: SelectedToDo | null = null;

const selectedAFToDoSlice = createSlice({
    name: 'selectedAFToDo',
    initialState: initialState as SelectedToDo | null,
    reducers: {
        setSelectedAFToDo: (_state, action: PayloadAction<SelectedToDo>) => {
            return action.payload;
        },
        resetSelectedAFToDo: () => {
            return null;
        },
    },
});

export const { setSelectedAFToDo, resetSelectedAFToDo } = selectedAFToDoSlice.actions;
export default selectedAFToDoSlice.reducer;
