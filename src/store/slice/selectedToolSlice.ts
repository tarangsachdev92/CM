import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SelectedToolState {
    level: string;
    period: string;
    toolId: number;
}

const initialState: SelectedToolState = {
    level: '',
    period: '',
    toolId: 0,
};

const selectedToolSlice = createSlice({
    name: 'selectedTool',
    initialState,
    reducers: {
        setSelectedToolData: (_state, action: PayloadAction<SelectedToolState>) => {
            return action.payload;
        },
    },
});

export const { setSelectedToolData } = selectedToolSlice.actions;
export default selectedToolSlice.reducer;
