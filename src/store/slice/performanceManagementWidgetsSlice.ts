
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    fetchWidgetTypes,
    fetchWidgetsBySearchTerm,
    IWidgetType,
    ISearchWidgetItem,
    fetchWidgetConfiguration,
} from '../thunks/performanceManagementWidgets';

import type{ IWidgetConfiguration } from '../../types/response';

interface PerformanceManagementWidgetsState {
    widgetTypes: IWidgetType[];
    searchResults: ISearchWidgetItem[];
    widgetConfiguration: IWidgetConfiguration[];

    isFromScratch: boolean,

    isFetching: boolean;
    isSearching: boolean;
    isSaving: boolean;
    isWidgetConfigLoading: boolean;

    error: string | null;
    errorWidgetConfiguration: string | null;
}

const initialState: PerformanceManagementWidgetsState = {
    widgetTypes: [],
    searchResults: [],
    widgetConfiguration: [],
    isFromScratch: false,
    isFetching: false,
    isSearching: false,
    isSaving: false,
    isWidgetConfigLoading: false,
    error: null,
    errorWidgetConfiguration:null,
};

const performanceManagementWidgetsSlice = createSlice({
    name: 'performanceManagementWidgets',
    initialState,
    reducers: {
        clearSearchResults: (state) => {
            state.searchResults = [];
            state.error = null;
            state.isSearching = false;
        },
        setIsFromScratch: (state, action: PayloadAction<boolean>) => {
            state.isFromScratch = action.payload;
        },
    },
    extraReducers(builder) {
        builder.addCase(fetchWidgetTypes.pending, (state) => {
            state.isFetching = true;
            state.error = null;
        });
        builder.addCase(
            fetchWidgetTypes.fulfilled,
            (state, action: PayloadAction<IWidgetType[]>) => {
                state.isFetching = false;
                state.widgetTypes = action.payload;
                state.error = null;
            },
        );
        builder.addCase(fetchWidgetTypes.rejected, (state, action) => {
            state.isFetching = false;
            state.error = action.payload as string;
        });

        builder.addCase(fetchWidgetsBySearchTerm.pending, (state) => {
            state.isSearching = true;
            state.error = null;
        });
        builder.addCase(
            fetchWidgetsBySearchTerm.fulfilled,
            (state, action: PayloadAction<ISearchWidgetItem[]>) => {
                state.isSearching = false;
                state.searchResults = action.payload;
                state.error = null;
            },
        );
        builder.addCase(fetchWidgetsBySearchTerm.rejected, (state, action) => {
            state.isSearching = false;
            state.error = action.payload as string;
        });
        builder.addCase(fetchWidgetConfiguration.pending, (state) => {
            state.isWidgetConfigLoading = true;
            state.error = null;
        });
        builder.addCase(
            fetchWidgetConfiguration.fulfilled,
            (state, action: PayloadAction<IWidgetConfiguration[]>) => {
                state.isWidgetConfigLoading = false;
                state.widgetConfiguration = action.payload;
                state.errorWidgetConfiguration = null;
            },
        );
        builder.addCase(fetchWidgetConfiguration.rejected, (state, action) => {
            state.isWidgetConfigLoading = false;
            state.errorWidgetConfiguration =
                (action.payload as string) ?? 'Failed to load widget configuration';
        });
    },
});

export const { clearSearchResults, setIsFromScratch } = performanceManagementWidgetsSlice.actions;
export default performanceManagementWidgetsSlice.reducer;
