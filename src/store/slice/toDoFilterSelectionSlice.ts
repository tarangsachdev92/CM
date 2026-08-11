import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AFTabType = 'Past' | 'Future' | null;

export interface Option {
    category: string; // 'Tool' | 'Priority' | 'DueDate' etc.
    label: string; // display label
    value: string; // raw value (ISO date, tool name, priority name)
}

export interface CalendarRange {
    startDate: string | null; // use YYYY-MM-DD for consistency
    endDate: string | null;
}

export interface ToDoFilterSelectionsState {
    selectedTools: Option[];
    selectedPriorities: Option[];
    selectedDueDates: Option[];
    calendarRange: CalendarRange;
    enableDateToggle: boolean;
    rangeStartDate: string | null; // YYYY-MM-DD
    rangeEndDate: string | null; // YYYY-MM-DD
}

const initialState: ToDoFilterSelectionsState = {
    selectedTools: [],
    selectedPriorities: [],
    selectedDueDates: [],
    calendarRange: { startDate: null, endDate: null },
    enableDateToggle: false,
    rangeStartDate: null,
    rangeEndDate: null,
};

const toDoFilterSelectionSlice = createSlice({
    name: 'todoFilterSelections',
    initialState,
    reducers: {
        setSelectedTools(state, action: PayloadAction<Option[]>) {
            state.selectedTools = action.payload;
        },
        setSelectedPriorities(state, action: PayloadAction<Option[]>) {
            state.selectedPriorities = action.payload;
        },
        setSelectedDueDates(state, action: PayloadAction<Option[]>) {
            state.selectedDueDates = action.payload;
        },
        setCalendarRange(state, action: PayloadAction<CalendarRange>) {
            state.calendarRange = action.payload;
            state.enableDateToggle = Boolean(action.payload.startDate || action.payload.endDate);
            state.rangeStartDate = action.payload.startDate;
            state.rangeEndDate = action.payload.endDate;
        },
        setEnableDateToggle(state, action: PayloadAction<boolean>) {
            state.enableDateToggle = action.payload;
        },
        clearAllFilters(state) {
            state.selectedTools = [];
            state.selectedPriorities = [];
            state.selectedDueDates = [];
            state.calendarRange = { startDate: null, endDate: null };
            state.enableDateToggle = false;
            state.rangeStartDate = null;
            state.rangeEndDate = null;
        },
    },
});

export const {
    setSelectedTools,
    setSelectedPriorities,
    setSelectedDueDates,
    setCalendarRange,
    setEnableDateToggle,
    clearAllFilters,
} = toDoFilterSelectionSlice.actions;

export default toDoFilterSelectionSlice.reducer;
