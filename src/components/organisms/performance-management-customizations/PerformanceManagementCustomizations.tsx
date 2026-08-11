import { useEffect, useMemo, useState, useCallback } from 'react';
import styles from './PerformanceManagementCustomisations.module.scss';
import { Flex } from 'antd';
import { Label } from '../../atoms';
import { Button, IconButton, Tab, RenameDialog } from 'konnect-react-components';
import {
    BlankBarChart,
    NoWidgetsAdded,
    BlankColumnChart,
    BlankLineChart,
    BlankAreaChart,
    BlankStackedAreaChart,
    BlankGroupedColumnChart,
    BlankStackedLineChart,
} from '../../../assets/images/images';
import AddWidgetFlyout from './AddWidgetFlyout';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../store';
import { fetchDynamicTabs, addDynamicTab } from '../../../store/thunks/dynamicTabs';
import ReportsKebabMenu from './performance-management-widgets/ReportsKebabMenu';
import MultipleKpiWidget from './kpi-overview-widgets/MultipleKpiWidget';
import SingleKpiWidget from './kpi-overview-widgets/SingleKpiWidget';

import {
    selectTabWidgetsState,
    setMultipleKpiConfig,
    setMultipleKpiSelected,
    setSingleKpiSelectedIds,
    removeFromWidgetOrder,
    ChartTypeString,
    appendToWidgetOrder,
    setChartsTemplates,
    type MultipleKpiConfigState,
} from '../../../store/slice/performanceWidgetsByTabSlice';
import { fetchTabWidgetsState } from '../../../store/thunks/performanceWidgetsByTab';
import TemplateSkeleton from './chart-widgets/TemplateSkeleton';
import ChartCustomizationPanel from './chart-widgets/ChartCustomizationPanel';
import type { ChartWidgetState } from './performance-management-widgets/SimpleColumnChartWidget';
import EmptyChartPlaceholder from './chart-widgets/EmptyChartPlaceholder';
import EmptyTableState from './table-widgets/EmptyTableSate';
import TableCustomizationPanel from './table-widgets/TableCustomizationPanel';
import TableHeader from './table-widgets/TableHeader';
import { FieldItem } from './chart-widgets/DataFieldFlyout';
import HighlightSummaryWidget from './HighlightSummaryWidget';
export type KpiOption = { label: string; value: string; category?: string };

interface TabItem {
    label: string;
    tabCode: number;
}

const REPORT_ID = 1;
const ADD_TAB_CODE = -1;

// Temporary flag to drive "Invalid Selections" state for charts.
const SHOW_INVALID_CHART_STATE = false;

// Helper to extract raw KPI id even if token has a '@<n>' suffix
const getRawSingleKpiIdFromToken = (token: string): string => {
    const prefix = 'single-kpi:';
    if (!token.startsWith(prefix)) return '';
    const after = token.slice(prefix.length);
    return after.split('@')[0] || '';
};

const nextDuplicateToken = (baseToken: string, existing: string[]): string => {
    let maxN = 0;
    const baseExact = baseToken.split('@')[0] || baseToken; // Ensure we are working with the pure base
    const pattern = new RegExp(`^${baseExact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:@(\\d+))?$`);
    for (const tok of existing) {
        const m = tok.match(pattern);
        if (!m) continue;
        const n = m[1] ? parseInt(m[1], 10) : 1;
        if (!Number.isNaN(n)) maxN = Math.max(maxN, n);
    }
    return `${baseExact}@${maxN + 1}`;
};

/** Centralized icon selection for chart types (future‑proof). */
// const getChartIconByType = (type: string): React.ReactNode => {
//     switch (type) {
//         case 'bar':
//             return <BlankBarChart />;
//         case 'column':
//             return <BlankColumnChart />;
//         // Add future chart types here:
//         // case 'line': return <BlankLineChart />;
//         // case 'pie': return <BlankPieChart />;
//         default:
//             // Sensible default to avoid rendering errors if type is unknown
//             return <BlankColumnChart />;
//     }
// };
const getChartIconByType = (type: ChartTypeString): React.ReactNode => {

    switch (type) {
        case 'bar':
            return <BlankBarChart />;
        case 'column':
            return <BlankColumnChart />;
        case 'column-3':
            return <BlankGroupedColumnChart />;
        case 'line':
            return <BlankLineChart />;
        case 'stacked-line':
            return <BlankStackedLineChart />;
        case 'area':
            return <BlankAreaChart />;
        case 'stacked-area':
            return <BlankStackedAreaChart />;
        // Add future chart types here:
        // case 'pie': return <BlankPieChart />;
        default:
            return <BlankColumnChart />;
    }
};

/** Extracts chart type from an empty-chart token e.g. 'chart-empty:bar' -> 'bar'. */
// const getChartTypeFromToken = (token: string): string => token.replace('chart-empty:', '');
const getChartTypeFromToken = (token: string): ChartTypeString =>
    token.replace('chart-empty:', '') as ChartTypeString;

/** Builds the EmptyChartPlaceholder with optional handlers (used for both list + preview). */
export const buildEmptyChartPlaceholder = (
    type: ChartTypeString,
    state: 'empty' | 'invalid',
    isLoadedInPreview?: boolean,
    handlers?: { onDelete?: () => void; onEdit?: () => void },
) => {
    const icon = getChartIconByType(type);
    return (
        <EmptyChartPlaceholder
            state={state}
            icon={icon}
            isLoadedInPreview={isLoadedInPreview}
            {...handlers}
        />
    );
};

const PerformanceManagementCustomisations = () => {
    const dispatch = useDispatch<AppDispatch>();
    const dynamicTabs = useSelector((s: RootState) => s.dynamicTabs.tabs);
    const isFetching = useSelector((s: RootState) => s.dynamicTabs.isFetching);
    const report = useSelector((state: RootState) => state.dynamicTabs.report);
    const canEdit = !report || report.isEditor;

    const [activeTab, setActiveTab] = useState<TabItem>({ label: 'Overview', tabCode: 1 });
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [showWidgetButton, setShowWidgetButton] = useState(false);
    const [addWidgetFlyoutOpen, setAddWidgetFlyoutOpen] = useState(false);
    const [isChartPanelOpen, setIsChartPanelOpen] = useState(false);
    const [activeChartWidgetToken, setActiveChartWidgetToken] = useState<string | null>(null);
    const [activeChartWidgetState, setActiveChartWidgetState] = useState<ChartWidgetState>('empty');
    const [activeChartTitle, setActiveChartTitle] = useState<string>('');

    const [chartPreviewGraphic, setChartPreviewGraphic] = useState<React.ReactNode>(null);
    const [chartWidgetConfigs, setChartWidgetConfigs] = useState<
        Record<string, Record<string, unknown>>
    >({});

    const [isTablePanelOpen, setIsTablePanelOpen] = useState(false);
    const [activeTableWidgetToken, setActiveTableWidgetToken] = useState<string | null>(null);
    const [activeTableWidgetState, setActiveTableWidgetState] = useState<ChartWidgetState>('empty');
    const [tablePreviewGraphic, setTablePreviewGraphic] = useState<React.ReactNode>(null);

    const [, setTargetAxisSetUp] = useState<FieldItem[]>([]);

    useEffect(() => {
        dispatch(fetchDynamicTabs({ reportId: REPORT_ID }));
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchTabWidgetsState({ tabId: activeTab.tabCode }));
    }, [dispatch, activeTab.tabCode]);

    const tabItems = useMemo<TabItem[]>(() => {
        const overview = { label: 'Overview', tabCode: 1 };
        const addTab = { label: 'Add Tab', tabCode: ADD_TAB_CODE };
        const mapped = (dynamicTabs ?? []).map(t => ({ label: t.name, tabCode: t.id }));
        return showWidgetButton ? [overview, ...mapped, addTab] : [overview, ...mapped];
    }, [dynamicTabs, showWidgetButton]);

    const handleTabClick = (item: TabItem) => {
        if (item.tabCode === ADD_TAB_CODE) {
            setIsAddDialogOpen(true);
            return;
        }
        setActiveTab(item);
    };

    const validateTabName = (name: string) => {
        const trimmed = name.trim().toLowerCase();
        if (!trimmed) return 'Please enter a tab name.';
        const exists = tabItems.some(
            t => t.tabCode !== ADD_TAB_CODE && t.label.toLowerCase() === trimmed,
        );
        if (exists) return 'A tab with this name already exists.';
        return null;
    };

    const handleAddTab = async (newName: string) => {
        await dispatch(
            addDynamicTab({ tabName: newName, reportId: REPORT_ID, isPublished: true }),
        ).unwrap();
        setIsAddDialogOpen(false);
        dispatch(fetchDynamicTabs({ reportId: REPORT_ID }));
    };

    const activeSaved = useSelector((s: RootState) => selectTabWidgetsState(s, activeTab.tabCode));

    const widgetOrder = activeSaved.widgetOrder ?? [];
    const multipleSelected = !!activeSaved.multipleKpi?.selected;
    const selectedMetricMultiple = activeSaved.multipleKpi?.selectedMetric ?? [];
    const singleSelectedIds = activeSaved.singleKpi?.selectedIds ?? [];
    const singleSelectedMetric: KpiOption[] = activeSaved.singleKpi?.selectedMetric ?? [];
    // const selectedChartType: ChartTypeString = activeSaved.chartType ?? 'area';
    const selectedChartType: ChartTypeString = activeSaved.chartType ?? 'column';
    const savedChartsTemplates: KpiOption[] = activeSaved.chartsTemplates ?? [];

    const hasAnyWidgets =
        widgetOrder.length > 0 ||
        multipleSelected ||
        singleSelectedIds.length > 0 ||
        (savedChartsTemplates && savedChartsTemplates.length > 0);

    const persistMultipleKpi = useCallback(
        (tabId: number, selected: boolean) => {
            dispatch(setMultipleKpiSelected({ tabId, selected }));
        },
        [dispatch],
    );

    const persistMultipleKpiConfig = useCallback(
        (tabId: number, config: MultipleKpiConfigState) => {
            dispatch(setMultipleKpiConfig({ tabId, config }));
        },
        [dispatch],
    );

    const persistSingleKpi = useCallback(
        (tabId: number, _selected: boolean, payload?: { singleSelectedIds?: string[] }) => {
            if (Array.isArray(payload?.singleSelectedIds)) {
                dispatch(
                    setSingleKpiSelectedIds({ tabId, selectedIds: payload!.singleSelectedIds }),
                );
            }
        },
        [dispatch],
    );

    const onKpiCardSelected = useCallback(() => { }, []);

    const handleEmptyChartDelete = useCallback(
        (token: string) => {
            dispatch(removeFromWidgetOrder({ tabId: activeTab.tabCode, items: [token] }));
        },
        [dispatch, activeTab.tabCode],
    );

    /** When editing, open panel and pass FULL EmptyChartPlaceholder as preview **without** actions. */
    const handleEmptyChartEdit = useCallback((token: string) => {


        setActiveChartWidgetToken(token);
        const state: ChartWidgetState = SHOW_INVALID_CHART_STATE ? 'invalid' : 'empty';
        setActiveChartWidgetState(state);

        const type = getChartTypeFromToken(token);
        const preview = buildEmptyChartPlaceholder(type, state, true);

        // setActiveChartTitle(`${type.charAt(0).toUpperCase() + type.slice(1)} `);
        // setActiveChartTitle(`${type.charAt(0).toUpperCase()}${type.slice(1)} Chart`);

        const formatted =
            type.includes("-")
                ? type.split("-")[0]
                : type;

        const title =
            `${formatted?.charAt(0).toUpperCase()}${formatted?.slice(1)} Chart`
        console.log("title", title)
        setActiveChartTitle(title);

        setIsChartPanelOpen(true);
        setChartPreviewGraphic(preview);
    }, []);

    const handleEmptyTableDelete = useCallback(
        (token: string) => {
            dispatch(removeFromWidgetOrder({ tabId: activeTab.tabCode, items: [token] }));
        },
        [dispatch, activeTab.tabCode],
    );

    const handleEmptyTableEdit = useCallback((token: string) => {
        setActiveTableWidgetToken(token);
        const state: ChartWidgetState = SHOW_INVALID_CHART_STATE ? 'invalid' : 'empty';
        setActiveTableWidgetState('ready');

        // Build a preview with no actions for the panel
        const preview = (
            <EmptyTableState
                state={state}
            // Do NOT pass onDelete/onEdit inside the panel preview
            />
        );

        setTablePreviewGraphic(preview);
        setIsTablePanelOpen(true);
    }, []);

    const handleTablePanelClose = useCallback(() => {
        setIsTablePanelOpen(false);
    }, []);

    const handleTablePanelSave = useCallback((config: Record<string, unknown>) => {
        // You can persist `config` to store if required
        void config;
        setActiveTableWidgetState('ready');
        setIsTablePanelOpen(false);
    }, []);
    const handleChartPanelClose = useCallback(() => {
        setIsChartPanelOpen(false);
        setActiveChartWidgetToken(null);
    }, []);

    const handleChartPanelSave = useCallback(
        (config: Record<string, unknown>) => {
            if (!activeChartWidgetToken) return;

            // Check if we're saving a previously empty chart
            if (activeChartWidgetToken.startsWith('chart-empty:')) {
                const chartType = getChartTypeFromToken(activeChartWidgetToken);

                dispatch(
                    removeFromWidgetOrder({
                        tabId: activeTab.tabCode,
                        items: [activeChartWidgetToken],
                    }),
                );

                const timestamp = Date.now();
                const newTemplateValue = `configured-${chartType}-${timestamp}`;
                const newTemplateToken = `chart-template:${newTemplateValue}`;

                // const templateLabel =
                //     typeof config.titleLabel === 'string' && config.titleLabel.trim()
                //         ? config.titleLabel.trim()
                //         : `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`;
                const templateLabel =
                    typeof config.titleLabel === 'string' && config.titleLabel.trim()
                        ? config.titleLabel.trim()
                        : `${chartType.charAt(0).toUpperCase()}${chartType.slice(1)} Chart`;

                const updatedTemplates = [
                    ...savedChartsTemplates,
                    { label: templateLabel, value: newTemplateValue, category: 'custom' },
                ];
                dispatch(
                    setChartsTemplates({ tabId: activeTab.tabCode, templates: updatedTemplates }),
                );
                dispatch(
                    appendToWidgetOrder({ tabId: activeTab.tabCode, items: [newTemplateToken] }),
                );

                setChartWidgetConfigs(prev => ({ ...prev, [newTemplateToken]: config }));
            } else {
                setChartWidgetConfigs(prev => ({ ...prev, [activeChartWidgetToken]: config }));
            }

            setActiveChartWidgetState('ready');
            setIsChartPanelOpen(false);
            setActiveChartWidgetToken(null);
        },
        [dispatch, activeTab.tabCode, activeChartWidgetToken, savedChartsTemplates],
    );

    const handleTemplateDelete = useCallback(
        (token: string) => {
            dispatch(removeFromWidgetOrder({ tabId: activeTab.tabCode, items: [token] }));

            setChartWidgetConfigs(prev => {
                const next = { ...prev };
                delete next[token];
                return next;
            });
        },
        [dispatch, activeTab.tabCode],
    );

    const handleTemplateDuplicate = useCallback(
        (token: string) => {
            const newToken = nextDuplicateToken(token, widgetOrder);

            dispatch(
                appendToWidgetOrder({
                    tabId: activeTab.tabCode,
                    items: [newToken],
                })
            );

            setChartWidgetConfigs(prev => ({
                ...prev,
                [newToken]: prev[token] ? { ...prev[token] } : {},
            }));
        },
        [dispatch, activeTab.tabCode, widgetOrder],
    );

    const handleChartTemplateEdit = useCallback(

        (token: string, tpl: KpiOption) => {
            setActiveChartWidgetToken(token);
            setActiveChartWidgetState('ready');
            const storedCfg = chartWidgetConfigs[token] ?? {
                titleLabel: tpl.label,
                showAppliedFilters: true,
                showInsightsButton: true,
            };
            const preview = (
                <TemplateSkeleton
                    titleLabel={
                        typeof storedCfg.titleLabel === 'string' ? storedCfg.titleLabel : tpl.label
                    }
                    mode="view"
                    showSubtitle={Boolean(storedCfg.showSubtitle)}
                    subtitle={
                        typeof storedCfg.subtitle === 'string' ? storedCfg.subtitle : undefined
                    }
                    showAppliedFilters={Boolean(storedCfg.showAppliedFilters ?? true)}
                    showInsightsButton={Boolean(storedCfg.showInsightsButton ?? true)}
                    showLinkButton={Boolean(storedCfg.showLinkButton)}
                    linkHref={
                        typeof storedCfg.linkHref === 'string' ? storedCfg.linkHref : undefined
                    }
                    appliedFilters={{
                        geography: ['US', 'CA'],
                        period: 'FY2026 Q1',
                        local: ['NYC'],
                    }}
                    selectedChartType={(storedCfg.chartType as string) || 'column'}
                    toDateConfig={storedCfg.toDateConfig as any}
                />
            );

            setActiveChartTitle(`${tpl.label}`);
            setChartPreviewGraphic(preview);
            setIsChartPanelOpen(true);
        },
        [chartWidgetConfigs],
    );

    // Map for Single KPI rendering by id
    const singleIdToMetric: Record<string, KpiOption> = useMemo(() => {
        const map: Record<string, KpiOption> = {};
        for (const m of singleSelectedMetric) {
            map[m.value] = m;
        }
        return map;
    }, [singleSelectedMetric]);

    /* ===== Ordered rendering helpers ===== */
    const renderByOrder = () => {
        if (!widgetOrder.length) return null;

        return (
            <Flex vertical gap={16}>
                {widgetOrder.map(token => {
                    // single-kpi:<id> or single-kpi:<id>@<n>
                    if (token.startsWith('single-kpi:')) {
                        const rawId = getRawSingleKpiIdFromToken(token);
                        if (!rawId) return null;
                        if (!singleSelectedIds.includes(rawId)) return null; // skip if unselected
                        const metric = singleIdToMetric[rawId];
                        if (!metric) return null;
                        return (
                            <div key={token} className={styles['overview-area-kpi-cards']}>
                                <SingleKpiWidget
                                    widgetId="single-kpi"
                                    activeTabId={activeTab.tabCode}
                                    selectedMetric={[metric]}
                                    selectedChartType={selectedChartType}
                                    onKpiCardSelected={() => { }}
                                    persistKpiCard={persistSingleKpi}
                                    initialSelectedIds={[metric.value]}
                                    widgetToken={token}
                                    trendPeriod={activeSaved.singleKpi?.trendPeriod ?? '1Y'}
                                    projectionsEnabled={
                                        activeSaved.singleKpi?.projectionsEnabled ?? false
                                    }
                                    readOnly
                                />
                            </div>
                        );
                    }

                    // multiple-kpi
                    if (token === 'multiple-kpi') {
                        if (!multipleSelected) return null; // skip if turned off
                        return (
                            <div key={token} className={styles['overview-multiple-kpi-card']}>
                                <MultipleKpiWidget
                                    widgetId="multiple-kpi"
                                    activeTabId={activeTab.tabCode}
                                    selectedMetric={selectedMetricMultiple}
                                    selectedChartType={selectedChartType}
                                    onKpiCardSelected={onKpiCardSelected}
                                    persistKpiCard={persistMultipleKpi}
                                    initialConfig={activeSaved.multipleKpi?.config}
                                    persistMultipleKpiConfig={persistMultipleKpiConfig}
                                    initialSelected={multipleSelected}
                                    selectingFromTabs
                                    showPinIcon
                                    showHoverOverIcon
                                />
                            </div>
                        );
                    }

                    // chart-template:<value>
                    if (token.startsWith('chart-template:')) {
                        const valueWithSuffix = token.split(':')[1];
                        if (!valueWithSuffix) return null;
                        const baseValue = valueWithSuffix.split('@')[0];

                        const tpl = savedChartsTemplates.find(t => t.value === baseValue);
                        if (!tpl) return null; // skip if removed
                        const storedCfg = chartWidgetConfigs[token] ?? {};
                        console.log(storedCfg)
                        console.log('rendering template with config:', storedCfg.appliedFilters);
                        return (
                            <div key={token} className={styles['overview-chart-template']}>
                                <TemplateSkeleton
                                    titleLabel={
                                        typeof storedCfg.titleLabel === 'string'
                                            ? storedCfg.titleLabel
                                            : tpl.label
                                    }
                                    mode="edit"
                                    showSubtitle={Boolean(storedCfg.showSubtitle)}
                                    subtitle={
                                        typeof storedCfg.subtitle === 'string'
                                            ? storedCfg.subtitle
                                            : undefined
                                    }
                                    showAppliedFilters={Boolean(storedCfg.showAppliedFilters)}
                                    appliedFilters={{
                                        geography: ['US', 'CA'],
                                        period: 'FY2026 Q1',
                                        local: ['NYC'],
                                    }}
                                    showInsightsButton={Boolean(storedCfg.showInsightsButton)}
                                    showLinkButton={Boolean(storedCfg.showLinkButton)}
                                    linkHref={
                                        typeof storedCfg.linkHref === 'string'
                                            ? storedCfg.linkHref
                                            : undefined
                                    }
                                    onInsightsClick={() => {
                                        // TODO: replace with real insights handler (e.g. open a drawer/modal)
                                        alert(`Insights for ${tpl.label}`);
                                    }}
                                    onEdit={() => handleChartTemplateEdit(token, tpl)}
                                    onDelete={() => handleTemplateDelete(token)}
                                    onDuplicate={() => handleTemplateDuplicate(token)}
                                    selectedChartType={(storedCfg.chartType as string) || 'column'}
                                    axisConfig={storedCfg.axisConfig as any}
                                    userSelections={storedCfg.userSelections as any}
                                    toDateConfig={storedCfg.toDateConfig as any}
                                    projectionEnabled={Boolean(storedCfg.projectionEnabled)}
                                    unit={typeof storedCfg.unit === 'string' ? storedCfg.unit : undefined}
                                    decimalPlaces={storedCfg.decimalPlaces as any}
                                    xAxisLabel={typeof storedCfg.xAxisLabel === 'string' ? storedCfg.xAxisLabel : undefined}
                                    yAxisLabel={typeof storedCfg.yAxisLabel === 'string' ? storedCfg.yAxisLabel : undefined}
                                    showYAxis={storedCfg.showYAxis as any}
                                    xAxisAngle={storedCfg.xAxisAngle as any}
                                    showValueLabel={storedCfg.showValueLabel as any}
                                    showTotalLabel={storedCfg.showTotalLabel as any}
                                    showLegend={storedCfg.showLegend as any}
                                    showVerticalGridLines={storedCfg.showVerticalGridLines as any}
                                    showHorizontalGridLines={storedCfg.showHorizontalGridLines as any}
                                    showYAxisLabels={storedCfg.showYAxisLabels as any}
                                    showXAxisLabels={storedCfg.showXAxisLabels as any}
                                    xaxisDataOption={(storedCfg.axisConfig as any)?.xAxis}
                                />
                            </div>
                        );
                    }

                    // chart-empty:<type>  -> now uses helpers and passes icon via switch-case
                    if (token.startsWith('chart-empty:')) {
                        const type = getChartTypeFromToken(token);
                        const state = SHOW_INVALID_CHART_STATE ? 'invalid' : 'empty';

                        return (
                            <div key={token} className={styles['overview-chart-template']}>
                                {buildEmptyChartPlaceholder(type, state, false, {
                                    onDelete: () => handleEmptyChartDelete(token),
                                    onEdit: () => handleEmptyChartEdit(token),
                                })}
                            </div>
                        );
                    }

                    if (token.startsWith('table-empty:')) {
                        return (
                            <div key={token} className={styles['overview-chart-template']}>
                                {SHOW_INVALID_CHART_STATE ? null : (
                                    <EmptyTableState
                                        state="empty"
                                        onDelete={() => handleEmptyTableDelete(token)}
                                        onEdit={() => handleEmptyTableEdit(token)}
                                    />
                                )}
                            </div>
                        );
                    }

                    if (token.startsWith('highlight-summary')) {
                        return (
                            <div key={token} className={styles['overview-highlight-summary']}>
                                <HighlightSummaryWidget
                                    activeTabId={activeTab.tabCode}
                                    widgetToken={token}
                                />
                            </div>
                        );
                    }

                    return null;
                })}
            </Flex>
        );
    };

    // Fallback (legacy grouping) — shown only when order is empty
    const renderLegacy = () => (
        <>
            {/* Single KPI */}
            {singleSelectedIds.length > 0 && singleSelectedMetric.length > 0 && (
                <Flex vertical gap={12}>
                    <Label type="body3">Selected Single KPI(s)</Label>
                    <Flex gap={16} wrap="wrap">
                        {singleSelectedIds
                            .map(id => singleIdToMetric[id])
                            .filter(Boolean)
                            .map(metric => (
                                <div
                                    key={metric!.value}
                                    className={styles['overview-area-kpi-cards']}
                                >
                                    <SingleKpiWidget
                                        widgetId="single-kpi"
                                        activeTabId={activeTab.tabCode}
                                        selectedMetric={[metric!]}
                                        selectedChartType={selectedChartType}
                                        onKpiCardSelected={() => { }}
                                        persistKpiCard={persistSingleKpi}
                                        initialSelectedIds={[metric!.value]}
                                        trendPeriod={activeSaved.singleKpi?.trendPeriod ?? '1Y'}
                                        projectionsEnabled={
                                            activeSaved.singleKpi?.projectionsEnabled ?? false
                                        }
                                        readOnly
                                    />
                                </div>
                            ))}
                    </Flex>
                </Flex>
            )}

            {/* Multiple KPI */}
            {multipleSelected && (
                <div className={styles['overview-multiple-kpi-card']}>
                    <MultipleKpiWidget
                        widgetId="multiple-kpi"
                        activeTabId={activeTab.tabCode}
                        selectedMetric={selectedMetricMultiple}
                        selectedChartType={selectedChartType}
                        onKpiCardSelected={onKpiCardSelected}
                        persistKpiCard={persistMultipleKpi}
                        initialConfig={activeSaved.multipleKpi?.config}
                        persistMultipleKpiConfig={persistMultipleKpiConfig}
                        initialSelected={multipleSelected}
                        selectingFromTabs
                        showPinIcon
                        showHoverOverIcon
                    />
                </div>
            )}

            {/* Chart Templates */}
            {savedChartsTemplates && savedChartsTemplates.length > 0 && (
                <Flex vertical gap={12}>
                    <Label type="body3">Selected Chart Template(s)</Label>
                    <Flex gap={16} wrap="wrap">
                        {savedChartsTemplates.map(tpl => (
                            <div key={tpl.value} className={styles['overview-chart-template']}>
                                <TemplateSkeleton
                                    titleLabel={tpl.label}
                                />
                            </div>
                        ))}
                    </Flex>
                </Flex>
            )}
        </>
    );

    return (
        <>
            {/* Header */}
            <Flex vertical gap={8} className={styles['custom-reports-title']}>
                <Flex align="center" gap={8} justify="space-between">
                    <Flex align="flex-start" gap={16}>
                        <Flex justify="flex-start" vertical gap={8}>
                            <Label type="h2">
                                <span className={styles['custom-reports-heading']}>
                                    Report1 <div className={styles['ellipse']} /> Site{' '}
                                    <div className={styles['ellipse']} /> Daily
                                </span>
                            </Label>
                            <Label type="body2">
                                <span className={styles['custom-reports-description']}>
                                    Analyze the daily performance of your site
                                </span>
                            </Label>
                        </Flex>
                    </Flex>

                    <Flex justify="flex-end" gap={8}>
                        {showWidgetButton && canEdit && (
                            <>
                                <Button
                                    text="Local Filters"
                                    icon="plus"
                                    variant="Secondary"
                                    onClick={() => null}
                                />
                                <Button
                                    text="Widgets"
                                    icon="plus"
                                    variant="Secondary"
                                    onClick={() => setAddWidgetFlyoutOpen(true)}
                                />
                            </>
                        )}
                        <IconButton
                            onClick={() => setShowWidgetButton(p => !p)}
                            icon="layout-alt-04"
                            size="Medium"
                            backgroundColor={`${showWidgetButton ? '#b0e7df' : ''}`}
                        />
                        <ReportsKebabMenu />
                    </Flex>
                </Flex>

                <Flex align="flex-start">
                    {isFetching ? (
                        <div className={styles['loading-state']}>
                            <Label type="body3">
                                <span className={styles['muted']}>Loading tabs…</span>
                            </Label>
                        </div>
                    ) : (
                        <Tab
                            DefaultSelected={{ label: activeTab.label }}
                            items={tabItems}
                            onClick={handleTabClick}
                        />
                    )}
                </Flex>
            </Flex>

            {/* ✅ Table Header (renders ONLY when a Table widget is selected) */}
            {activeTableWidgetToken && (
                <TableHeader
                    title="KPI Name"
                    subtitle="(UOM)"
                    showInsightButton
                    appliedFilters={['MTD', 'QTD', 'YTD']}
                    performanceStatus={[
                        { label: 'MTD', value: 120, target: 150, type: 'Warning' },
                        { label: 'QTD', value: 360, target: 400, type: 'Success' },
                        { label: 'YTD', value: 980, target: 1100, type: 'Alert' },
                    ]}
                    activeTabId={activeTab.tabCode}
                    widgetTabId="table-widget"
                />
            )}

            {/* Widgets Area */}
            <Flex vertical className={styles['main-container']} gap={24}>
                {hasAnyWidgets ? (
                    widgetOrder.length > 0 ? (
                        renderByOrder()
                    ) : (
                        renderLegacy()
                    )
                ) : (
                    <Flex vertical flex={1} justify="center" align="center">
                        {NoWidgetsAdded()}
                        <Label type="body2">No Widgets Added Yet</Label>
                        <div className={styles['space-v-8']} />
                        <Label type="body3">
                            <span className={styles['no-widgets-desc']}>
                                Click on "Add Widgets" to begin the process.
                            </span>
                        </Label>
                    </Flex>
                )}
            </Flex>

            {/* Flyout & Dialog */}
            <AddWidgetFlyout
                isOpen={addWidgetFlyoutOpen}
                onClose={() => setAddWidgetFlyoutOpen(false)}
                setIsOpen={setAddWidgetFlyoutOpen}
                activeTabId={activeTab.tabCode}
            />

            <RenameDialog
                isOpen={isAddDialogOpen}
                currentName=""
                onClose={() => setIsAddDialogOpen(false)}
                onSave={handleAddTab}
                title="Add New Tab"
                label="Tab Name"
                placeholder="Enter tab name"
                primaryButtonText="Add Tab"
                secondaryButtonText="Cancel"
                size="Small"
                validate={validateTabName}
                autoFocus
                captionIcon="alert-circle"
            />

            {activeTableWidgetToken && (
                <TableCustomizationPanel
                    isOpen={isTablePanelOpen}
                    onClose={handleTablePanelClose}
                    tableState={activeTableWidgetState}
                    titleLabel="Table Preview"
                    widgetToken={activeTableWidgetToken}
                    activeTabId={activeTab.tabCode}
                    onSave={handleTablePanelSave}
                    previewGraphic={tablePreviewGraphic}
                    TabId={activeTab.tabCode}
                />
            )}

            {activeChartWidgetToken && (
                <ChartCustomizationPanel
                    isOpen={isChartPanelOpen}
                    onClose={handleChartPanelClose}
                    chartState={activeChartWidgetState}
                    titleLabel={activeChartTitle}
                    widgetToken={activeChartWidgetToken}
                    activeTabId={activeTab.tabCode}
                    onSave={handleChartPanelSave}
                    previewGraphic={chartPreviewGraphic}
                    TabId={activeTab.tabCode}
                    setTargetAxisSetUp={setTargetAxisSetUp}
                    initialConfig={chartWidgetConfigs[activeChartWidgetToken]}
                />
            )}
        </>
    );
};

export default PerformanceManagementCustomisations;
