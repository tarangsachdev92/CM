import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchTabWidgetsState, saveTabWidgetsState } from '../thunks/performanceWidgetsByTab';
import { RootState } from '../../store';

const HIGHLIGHT_SUMMARY_WIDGET_TOKEN = 'highlight-summary';

/* ====== Types ====== */
export type KpiOption = { label: string; value: string; category?: string };
export type MultipleKpiChartTypeString = 'bar-clustered' | 'area' | 'line';
export type MultipleKpiTrendPeriodString = '3M' | '6M' | '1Y';
export type MultipleKpiMainValueString = 'MTD' | 'QTD' | 'YTD';
export type ChartTypeString = 'area' | 'stacked-area' | 'bar' | 'stacked-bar' | 'grouped-bar' | 'line' | 'stacked-line' | 'column' | 'column-2' | 'column-3' | 'pie' | 'other';
export type ChartIndexString =
    | 'column-1'
    | 'column-2'
    | 'column-3'
    | 'bar-1'
    | 'stacked-bar'
    | 'grouped-bar'
    | 'line-1'
    | 'stacked-line'
    | 'area-1'
    | 'stacked-area'
    | 'pie-1'
    | 'pie-2'
    | 'pie-3'
    | 'other-1'
    | 'other-2';

/**
 * TODO: tighten this union once we confirm all supported table types used by Tables.tsx.
 */
export type TableTypeString = string;

export interface MultipleKpiChipSettingsState {
    chartEnabled: boolean;
    chartType: MultipleKpiChartTypeString;
    trendPeriod: MultipleKpiTrendPeriodString;
    projectionsEnabled: boolean;
    mainValue: MultipleKpiMainValueString;
    showMTD: boolean;
    showQTD: boolean;
    showYTD: boolean;
}

export interface MultipleKpiCategoryItemState {
    id: string;
    label: string;
    unitLabel?: string;
    customSettings?: MultipleKpiChipSettingsState;
}

export interface MultipleKpiCategoryState {
    id: string;
    title: string;
    defaultTitle: string;
    kpis: MultipleKpiCategoryItemState[];
    isCustom?: boolean;
}

export interface MultipleKpiConfigState {
    gridViewEnabled: boolean;
    tableViewEnabled: boolean;
    showMTDTarget: boolean;
    chartEnabled: boolean;
    chartType: MultipleKpiChartTypeString;
    trendPeriod: MultipleKpiTrendPeriodString;
    projectionsEnabled: boolean;
    mainValue: MultipleKpiMainValueString;
    showMTD: boolean;
    showQTD: boolean;
    showYTD: boolean;
    showExceptions: boolean;
    kpiCategories: MultipleKpiCategoryState[];
    pinnedIds: string[];
}


export interface MultipleKpiState {
    selected?: boolean;
    selectedMetric?: KpiOption[];
    config?: MultipleKpiConfigState;
}

export interface SingleKpiState {
    selectedIds?: string[];
    selectedMetric?: KpiOption[];
    trendPeriod?: '3M' | '6M' | '1Y';
    projectionsEnabled?: boolean;

}

export type HighlightSummarySectionStatus = 'ai' | 'draft' | 'submitted';

export interface HighlightSummarySectionState {
    id: string;
    title: string;
    points: string[];
    status: HighlightSummarySectionStatus;
    editedAt?: string;
    editedBy?: string;
}

export interface HighlightSummaryState {
    sections?: HighlightSummarySectionState[];
    showSectionTitles?: boolean;
    sectionsPerRow?: number;
}

export interface TabWidgetsState {
    multipleKpi?: MultipleKpiState;
    singleKpi?: SingleKpiState;
    chartType?: ChartTypeString;
    chartsTemplates?: KpiOption[];
    highlightSummary?: HighlightSummaryState;
    highlightSummaryByToken?: Record<string, HighlightSummaryState>;
    widgetOrder?: string[]; // <-- NEW: ordered tokens
    updatedAt?: string;
}

const getBaseToken = (token: string) => token.split('@')[0] || token;

const normalizeWidgetOrder = (widgetOrder?: string[]) => {
    if (!widgetOrder?.length) {
        return widgetOrder ?? [];
    }

    let hasChanges = false;
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const token of widgetOrder) {
        if (seen.has(token)) {
            hasChanges = true;
            continue;
        }

        seen.add(token);
        normalized.push(token);
    }

    return hasChanges ? normalized : widgetOrder;
};

const normalizeTabWidgetsState = (tabState?: TabWidgetsState): TabWidgetsState => {
    if (!tabState) {
        return {};
    }

    const normalizedWidgetOrder = normalizeWidgetOrder(tabState.widgetOrder);
    const baseSummary = tabState.highlightSummary;
    const existingByToken = tabState.highlightSummaryByToken;
    const hasBaseSummaryInMap =
        !!existingByToken?.[HIGHLIGHT_SUMMARY_WIDGET_TOKEN];

    const normalizedHighlightSummaryByToken =
        baseSummary && !hasBaseSummaryInMap
            ? {
                ...(existingByToken ?? {}),
                [HIGHLIGHT_SUMMARY_WIDGET_TOKEN]: baseSummary,
            }
            : existingByToken;

    if (
        normalizedWidgetOrder === tabState.widgetOrder &&
        normalizedHighlightSummaryByToken === tabState.highlightSummaryByToken
    ) {
        return tabState;
    }

    return {
        ...tabState,
        widgetOrder: normalizedWidgetOrder,
        highlightSummaryByToken: normalizedHighlightSummaryByToken,
    };
};

interface WidgetsByTabSliceState {
    byTab: Record<string, TabWidgetsState>;
    isFetching: boolean;
    isSaving: boolean;
    error: string | null;
}

const initialState: WidgetsByTabSliceState = {
    byTab: {},
    isFetching: false,
    isSaving: false,
    error: null,
};

const keyOf = (tabId: number | string) => String(tabId);
const now = () => new Date().toISOString();

const performanceWidgetsByTabSlice = createSlice({
    name: 'widgetsByTab',
    initialState,
    reducers: {
        resetTabState: (state, action: PayloadAction<{ tabId: number | string }>) => {
            const k = keyOf(action.payload.tabId);
            delete state.byTab[k];
        },
        clearAllTabs: state => {
            state.byTab = {};
            state.error = null;
        },
        initializeTab: (state, action: PayloadAction<{ tabId: number | string }>) => {
            const k = keyOf(action.payload.tabId);
            state.byTab[k] = state.byTab[k] ?? {};
        },

        setChartType: (
            state,
            action: PayloadAction<{ tabId: number | string; chartType: ChartTypeString }>,
        ) => {
            const k = keyOf(action.payload.tabId);
            state.byTab[k] = state.byTab[k] ?? {};
            state.byTab[k].chartType = action.payload.chartType;
            state.byTab[k].updatedAt = now();
        },

        setSingleKpiSelectedIds: (
            state,
            action: PayloadAction<{ tabId: number | string; selectedIds: string[] }>,
        ) => {
            const k = keyOf(action.payload.tabId);
            state.byTab[k] = state.byTab[k] ?? {};
            state.byTab[k].singleKpi = state.byTab[k].singleKpi ?? {};
            state.byTab[k].singleKpi!.selectedIds = action.payload.selectedIds ?? [];
            state.byTab[k].updatedAt = now();
        },
        setSingleKpiSelectedMetric: (
            state,
            action: PayloadAction<{ tabId: number | string; selectedMetric: KpiOption[] }>,
        ) => {
            const k = keyOf(action.payload.tabId);
            state.byTab[k] = state.byTab[k] ?? {};
            state.byTab[k].singleKpi = state.byTab[k].singleKpi ?? {};
            state.byTab[k].singleKpi!.selectedMetric = action.payload.selectedMetric ?? [];
            state.byTab[k].updatedAt = now();
        },

        setMultipleKpiSelected: (
            state,
            action: PayloadAction<{ tabId: number | string; selected: boolean }>,
        ) => {
            const k = keyOf(action.payload.tabId);
            state.byTab[k] = state.byTab[k] ?? {};
            state.byTab[k].multipleKpi = state.byTab[k].multipleKpi ?? {};
            state.byTab[k].multipleKpi!.selected = action.payload.selected;
            state.byTab[k].updatedAt = now();
        },
        setMultipleKpiSelectedMetric: (
            state,
            action: PayloadAction<{ tabId: number | string; selectedMetric: KpiOption[] }>,
        ) => {
            const k = keyOf(action.payload.tabId);
            state.byTab[k] = state.byTab[k] ?? {};
            state.byTab[k].multipleKpi = state.byTab[k].multipleKpi ?? {};
            state.byTab[k].multipleKpi!.selectedMetric = action.payload.selectedMetric ?? [];
            state.byTab[k].updatedAt = now();
        },
        setMultipleKpiConfig: (
            state,
            action: PayloadAction<{ tabId: number | string; config: MultipleKpiConfigState }>,
        ) => {
            const k = keyOf(action.payload.tabId);
            state.byTab[k] = state.byTab[k] ?? {};
            state.byTab[k].multipleKpi = state.byTab[k].multipleKpi ?? {};
            state.byTab[k].multipleKpi!.config = action.payload.config;
            state.byTab[k].updatedAt = now();
        },

        setChartsTemplates: (
            state,
            action: PayloadAction<{ tabId: number | string; templates: KpiOption[] }>,
        ) => {
            const k = keyOf(action.payload.tabId);
            state.byTab[k] = state.byTab[k] ?? {};
            state.byTab[k].chartsTemplates = action.payload.templates ?? [];
            state.byTab[k].updatedAt = now();
        },

        setHighlightSummaryState: (
            state,
            action: PayloadAction<{
                tabId: number | string;
                token: string;
                summary: HighlightSummaryState;
            }>,
        ) => {
            const k = keyOf(action.payload.tabId);
            state.byTab[k] = state.byTab[k] ?? {};
            const token = action.payload.token;
            state.byTab[k].highlightSummaryByToken = {
                ...(state.byTab[k].highlightSummaryByToken ?? {}),
                [token]: action.payload.summary,
            };

            // Keep legacy field for base widget token compatibility.
            if (getBaseToken(token) === HIGHLIGHT_SUMMARY_WIDGET_TOKEN && token === HIGHLIGHT_SUMMARY_WIDGET_TOKEN) {
                state.byTab[k].highlightSummary = action.payload.summary;
            }

            state.byTab[k].updatedAt = now();
        },

        /** ---------- ORDER ACTIONS ---------- */
        appendToWidgetOrder: (
            state,
            action: PayloadAction<{ tabId: number | string; items: string[] }>,
        ) => {
            const k = keyOf(action.payload.tabId);
            state.byTab[k] = state.byTab[k] ?? {};
            const prev = state.byTab[k].widgetOrder ?? [];
            const set = new Set(prev);
            const merged = [...prev];

            for (const token of action.payload.items) {
                if (!set.has(token)) {
                    merged.push(token);
                    set.add(token);
                }
            }
            state.byTab[k].widgetOrder = normalizeWidgetOrder(merged);
            state.byTab[k].updatedAt = now();
        },

        // removeFromWidgetOrder: (
        //     state,
        //     action: PayloadAction<{ tabId: number | string; items: string[] }>,
        // ) => {
        //     const k = keyOf(action.payload.tabId);
        //     state.byTab[k] = state.byTab[k] ?? {};
        //     const prev = state.byTab[k].widgetOrder ?? [];
        //     const toRemove = new Set(action.payload.items);
        //     state.byTab[k].widgetOrder = prev.filter(t => !toRemove.has(t));
        //     state.byTab[k].updatedAt = now();
        // },
        // ...inside createSlice({ reducers: { ... } })
        removeFromWidgetOrder: (
            state,
            action: PayloadAction<{ tabId: number | string; items: string[] }>,
        ) => {
            const k = String(action.payload.tabId);
            state.byTab[k] = state.byTab[k] ?? {};
            const prev = state.byTab[k].widgetOrder ?? [];
            const toRemove = new Set(action.payload.items);

            state.byTab[k].widgetOrder = normalizeWidgetOrder(
                prev.filter(token => !toRemove.has(token)),
            );

            if (state.byTab[k].highlightSummaryByToken) {
                const nextSummaryByToken = { ...state.byTab[k].highlightSummaryByToken };

                for (const token of action.payload.items) {
                    delete nextSummaryByToken[token];
                }

                state.byTab[k].highlightSummaryByToken = nextSummaryByToken;
            }

            if (action.payload.items.includes(HIGHLIGHT_SUMMARY_WIDGET_TOKEN)) {
                delete state.byTab[k].highlightSummary;
            }

            state.byTab[k].updatedAt = new Date().toISOString();
        },

        setSingleKpiTrendPeriod: (
            state,
            action: PayloadAction<{ tabId: number | string; trendPeriod: '3M' | '6M' | '1Y' }>
        ) => {
            const k = keyOf(action.payload.tabId);
            state.byTab[k] = state.byTab[k] ?? {};
            state.byTab[k].singleKpi = state.byTab[k].singleKpi ?? {};
            state.byTab[k].singleKpi!.trendPeriod = action.payload.trendPeriod;
            state.byTab[k].updatedAt = now();
        },

        setSingleKpiProjectionsEnabled: (
            state,
            action: PayloadAction<{ tabId: number | string; enabled: boolean }>
        ) => {
            const k = keyOf(action.payload.tabId);
            state.byTab[k] = state.byTab[k] ?? {};
            state.byTab[k].singleKpi = state.byTab[k].singleKpi ?? {};
            state.byTab[k].singleKpi!.projectionsEnabled = action.payload.enabled;
            state.byTab[k].updatedAt = now();
        },
    },

    extraReducers(builder) {
        builder.addCase(fetchTabWidgetsState.pending, state => {
            state.isFetching = true;
            state.error = null;
        });
        builder.addCase(
            fetchTabWidgetsState.fulfilled,
            (state, action: PayloadAction<{ tabId: number | string; data: TabWidgetsState }>) => {
                state.isFetching = false;
                const { tabId, data } = action.payload;
                state.byTab[keyOf(tabId)] = normalizeTabWidgetsState(data);
                state.error = null;
            },
        );
        builder.addCase(fetchTabWidgetsState.rejected, (state, action) => {
            state.isFetching = false;
            state.error = (action.payload as string) ?? 'Failed to fetch tab widgets state';
        });

        builder.addCase(saveTabWidgetsState.pending, state => {
            state.isSaving = true;
            state.error = null;
        });
        builder.addCase(
            saveTabWidgetsState.fulfilled,
            (state, action: PayloadAction<{ tabId: number | string; data: TabWidgetsState }>) => {
                state.isSaving = false;
                const { tabId, data } = action.payload;
                state.byTab[keyOf(tabId)] = normalizeTabWidgetsState(data);
                state.error = null;
            },
        );
        builder.addCase(saveTabWidgetsState.rejected, (state, action) => {
            state.isSaving = false;
            state.error = (action.payload as string) ?? 'Failed to save tab widgets state';
        });
    },
});

export const {
    resetTabState,
    clearAllTabs,
    initializeTab,
    setChartType,
    setSingleKpiSelectedIds,
    setSingleKpiSelectedMetric,
    setMultipleKpiSelected,
    setMultipleKpiSelectedMetric,
    setMultipleKpiConfig,
    setChartsTemplates,
    setHighlightSummaryState,
    appendToWidgetOrder,
    removeFromWidgetOrder,
    setSingleKpiTrendPeriod,
    setSingleKpiProjectionsEnabled
} = performanceWidgetsByTabSlice.actions;

export default performanceWidgetsByTabSlice.reducer;

/* ============ Selectors ============ */
export const selectTabWidgetsState = (state: RootState, tabId: number | string): TabWidgetsState =>
    state.performanceWidgetsByTabSlice.byTab[String(tabId)] ?? {};

export const selectChartType = (state: RootState, tabId: number | string): ChartTypeString =>
    selectTabWidgetsState(state, tabId).chartType ?? 'area';

export const selectSingleKpi = (state: RootState, tabId: number | string): SingleKpiState =>
    selectTabWidgetsState(state, tabId).singleKpi ?? {};

export const selectMultipleKpi = (state: RootState, tabId: number | string): MultipleKpiState =>
    selectTabWidgetsState(state, tabId).multipleKpi ?? {};

export const selectChartsTemplates = (state: RootState, tabId: number | string): KpiOption[] =>
    selectTabWidgetsState(state, tabId).chartsTemplates ?? [];

export const selectHighlightSummary = (
    state: RootState,
    tabId: number | string,
): HighlightSummaryState => selectTabWidgetsState(state, tabId).highlightSummary ?? {};

export const selectWidgetOrder = (state: RootState, tabId: number | string): string[] =>
    selectTabWidgetsState(state, tabId).widgetOrder ?? [];

export const selectWidgetsByTabIsFetching = (state: RootState) =>
    state.performanceWidgetsByTabSlice.isFetching;
export const selectWidgetsByTabIsSaving = (state: RootState) =>
    state.performanceWidgetsByTabSlice.isSaving;
export const selectWidgetsByTabError = (state: RootState) =>
    state.performanceWidgetsByTabSlice.error;
