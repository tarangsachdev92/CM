
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchDynamicTabs, addDynamicTab, IDynamicTab, WidgetDetails, ReportDetails } from '../thunks/dynamicTabs';

interface DynamicTabsState {
    tabs: IDynamicTab[];
    widgets: WidgetDetails[];
    report: ReportDetails | null;
    isFetching: boolean;
    isSaving: boolean;
    error: string | null;
}

const initialState: DynamicTabsState = {
    tabs: [],
    widgets: [],
    report: null,
    isFetching: false,
    isSaving: false,
    error: null,
};

const dynamicTabsSlice = createSlice({
    name: 'dynamicTabs',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(fetchDynamicTabs.pending, (state) => {
            state.isFetching = true;
            state.error = null;
        });
        builder.addCase(fetchDynamicTabs.fulfilled, (state, action: PayloadAction<{ mapped: IDynamicTab[]; widgets: WidgetDetails[]; report: ReportDetails | null; }>) => {
            state.isFetching = false;
            state.tabs = action.payload.mapped;
            state.widgets = action.payload.widgets;
            state.report = action.payload.report;
            state.error = null;
        });
        builder.addCase(fetchDynamicTabs.rejected, (state, action) => {
            state.isFetching = false;
            state.error = action.payload as string;
        });

        builder.addCase(addDynamicTab.pending, (state) => {
            state.isSaving = true;
            state.error = null;
        });
        builder.addCase(addDynamicTab.fulfilled, (state, action: PayloadAction<IDynamicTab>) => {
            state.isSaving = false;
            state.error = null;

            // POST returns empty, so only append if payload is valid.
            const p: any = action.payload;
            if (p?.id != null && p?.name) {
                state.tabs = [...state.tabs, p];
            }
        });
        builder.addCase(addDynamicTab.rejected, (state, action) => {
            state.isSaving = false;
            state.error = action.payload as string;
        });
    },
});

export default dynamicTabsSlice.reducer;
