import { createSlice } from '@reduxjs/toolkit';
import { fetchToDoWidgetDetails } from '../thunks/fetchToDoWidgetDetails';
import { IToDoWidgetDetails } from '../../types/response';

interface IToDoState {
    data: IToDoWidgetDetails;
    loading: boolean;
    error: string | null;
}

const initialState: IToDoState = {
    data: {
        id: 0,
        sourceSystemUniqueIdentifier: 0,
        title: null,
        status: '',
        completedOn: '',
        dueDate: '',
        priority: '',
        assignedTo: '',
        assignee: '',
        source: '',
        sectionId: '',
        issueSectionName: '',
        description: '',
        subtitle: '',
        readmorelink: '',
        sourceSystemId: 0,
        firstName: '',
        totalTodo: 0,
        completedOnTimeRatio: 0,
    },
    loading: false,
    error: null,
};

const todoWidgetSlice = createSlice({
    name: 'todoWidgetData',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchToDoWidgetDetails.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchToDoWidgetDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchToDoWidgetDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default todoWidgetSlice.reducer;
