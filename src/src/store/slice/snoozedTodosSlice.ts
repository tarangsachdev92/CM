import { createSlice } from '@reduxjs/toolkit';
import { fetchSnoozedTodos } from '../thunks/fetchSnoozedTodos';

export interface SnoozedTodo {
  id: number;
  issueId: number | null;
  title: string | null;
  status: string | null;
  completedOn: string | null;
  dueDate: string | null;
  priority: string | null;
  assignedTo: string | null;
  assignee: string | null;
  source: string | null;     
  sectionid: number | null;
  todoTypeName: string | null;
  description: string | null;
  isCompleted: boolean | null;
  subtitle: string | null;
  updatedBy: string | null;
  updatedOn: string | null;
  snoozeTill: string | null;      
  lastSnoozedOn: string | null;   
  snoozeCount: number | null;     
  moduleName: string | null;
  attributes?: IAttributes;
}

type IAttributes = {
    type: string;
    id: string;
    displayName: string;
}

export interface SnoozedTodosState {
  todos: SnoozedTodo[];
  loading: boolean;
  error: string | null;
}

const initialState: SnoozedTodosState = {
  todos: [],
  loading: false,
  error: null,
};

const snoozedTodosSlice = createSlice({
  name: 'snoozedTodos',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchSnoozedTodos.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSnoozedTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = action.payload || [];
      })
      .addCase(fetchSnoozedTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch snoozed todos';
      });
  },
});

export default snoozedTodosSlice.reducer;
