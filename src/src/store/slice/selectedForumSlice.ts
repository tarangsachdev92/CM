import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SelectedForumState {
    level: string;
    period: string;
    forums: any;
}

const initialState: SelectedForumState = {
    level: '',
    period: '',
    forums: [],
};

const selectedForumSlice = createSlice({
    name: 'selectedForum',
    initialState,
    reducers: {
        setSelectedForumData: (_state, action: PayloadAction<SelectedForumState>) => {
            return action.payload;
        },
    },
});

export const { setSelectedForumData } = selectedForumSlice.actions;
export default selectedForumSlice.reducer;
