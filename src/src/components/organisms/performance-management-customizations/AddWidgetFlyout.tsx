import styles from './PerformanceManagementCustomisations.module.scss';
import { Flex } from 'antd';
import { Label } from '../../atoms';
import { Flyout, Icon, SearchInput } from 'konnect-react-components';
import { useRef, useState, useEffect, useMemo, useCallback, useRef as useRefHook } from 'react';
import PerformanceOverviewWidget from './performance-management-widgets/PerformanceOverviewWidget';
import WidgetSearchResults from './performance-management-widgets/WidgetSearchResults';
import { NoWidgetsAdded } from '../../../assets/images/images';
import ProcessMonitoringIcon from '../../../assets/images/process_monitoring_icon.svg';

import {
    ADD_WIDGET_CATEGORIES,
    AddWidgetCategory,
    widgetsIcon,
    IconNames,
    WidgetType,
} from './performanceWidget';
import { AppDispatch, RootState } from '../../../store';
import { fetchWidgetTypes } from '../../../store/thunks/performanceManagementWidgets';
import { useDispatch, useSelector } from 'react-redux';
import Charts, { KpiOption as ChartKpiOption } from './performance-management-widgets/Charts';
import type { ChartsHandle } from './performance-management-widgets/Charts';

import {
    selectTabWidgetsState,
    setChartsTemplates,
    appendToWidgetOrder,
    removeFromWidgetOrder,
    ChartTypeString,
    TableTypeString,
    ChartIndexString,
} from '../../../store/slice/performanceWidgetsByTabSlice';
import { saveTabWidgetsState } from '../../../store/thunks/performanceWidgetsByTab';
import Tables from './table-widgets/Tables';
import HighlightSummaryWidget from './HighlightSummaryWidget';

interface AddWidgetFlyoutInterface {
    isOpen: boolean;
    onClose: () => void;
    setIsOpen: (open: boolean) => void;
    activeTabId: number;
}

const ADD_WIDGET_FLYOUT_ID = 'performance-management-add-widget-flyout';

const AddWidgetFlyout: React.FC<AddWidgetFlyoutInterface> = ({
    isOpen,
    setIsOpen,
    onClose,
    activeTabId,
}) => {
    const flyoutRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch<AppDispatch>();

    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [searchText, setSearchText] = useState<string>('');
    const [sideOptionValue, setSideOptionValue] = useState<WidgetType | null>(null);
    const [selectedWidgetTypeId, setSelectedWidgetTypeId] = useState<number | null>(null);

    // Drives primary button enabled state (set by child widgets)
    const [kpiCountValue, setKpiCountValue] = useState<number>(0);

    // Charts selection + templates
    const [chartsCountValue, setChartsCountValue] = useState<number>(0);
    const [selectedChartsTemplates, setSelectedChartsTemplates] = useState<ChartKpiOption[]>([]);
    const [selectedChartType, setSelectedChartType] = useState<ChartTypeString | null>(null);
    const [selectedChartIndex, setSelectedChartIndex] = useState<ChartIndexString | null>(null);
    const totalSelected = kpiCountValue + chartsCountValue + (selectedChartType ? 1 : 0);

    // Table selection + templates
    const [tablesCountValue, setTablesCountValue] = useState<number>(0);
    const [selectedTablesTemplates, setSelectedTablesTemplates] = useState<ChartKpiOption[]>([]);
    const [selectedTableType, setSelectedTableType] = useState<TableTypeString | null>(null);
    const totalTableSelected = kpiCountValue + tablesCountValue + (selectedTableType ? 1 : 0);
    const [isHighlightSummaryChosen, setIsHighlightSummaryChosen] = useState(false);

    const widgetsTypeList = useSelector(
        (state: RootState) => state.performanceManagementWidgets.widgetTypes,
    );

    // Pull current tab widgets state from Redux
    const currentTabState = useSelector((s: RootState) => selectTabWidgetsState(s, activeTabId));

    /** Ref to control Charts child (for Reset) */
    const chartsRef = useRef<ChartsHandle | null>(null);

    const onSideOptionMenuClick = (key: number) => {
        setSideOptionValue(key as WidgetType);
        setSelectedWidgetTypeId(key);
    };

    useEffect(() => {
        dispatch(fetchWidgetTypes());
    }, [dispatch]);

    const onKpiCardSelected = (kpiCount: number) => {
        setKpiCountValue(kpiCount);
    };

    const onChartsSelectedCountChange = useCallback((count: number) => {
        setChartsCountValue(count);
    }, []);

    const onChartTemplatesSelected = useCallback((templates: ChartKpiOption[]) => {
        setSelectedChartsTemplates(templates);
    }, []);

    const onChartTypeSelected = useCallback((type: ChartTypeString | null) => {
        setSelectedChartType(type);
    }, []);
    const onChartIndexSelected = useCallback((index: ChartIndexString | null) => {
        setSelectedChartIndex(index)
    }, []);

    const onTablesSelectedCountChange = useCallback((count: number) => {
        setTablesCountValue(count);
    }, []);

    const onTableTemplatesSelected = useCallback((templates: ChartKpiOption[]) => {
        setSelectedTablesTemplates(templates);
    }, []);

    const onTableTypeSelected = useCallback((type: TableTypeString | null) => {
        setSelectedTableType(type);
    }, []);

    const [sessionOrder, setSessionOrder] = useState<string[]>([]);
    const pushOnce = useCallback((token: string) => {
        setSessionOrder(prev => (prev.includes(token) ? prev : [...prev, token]));
    }, []);

    // Track previous single ids to detect newly added ones (for order)
    const prevSingleIdsRef = useRefHook<string[]>([]);
    useEffect(() => {
        prevSingleIdsRef.current = currentTabState.singleKpi?.selectedIds ?? [];
    }, [currentTabState.singleKpi?.selectedIds]);

    // callbacks passed into PerformanceOverviewWidget to capture actual selection order
    type MetricLike = { value: string; label?: string };
    const handleMultipleToggle = useCallback(
        (selected: boolean) => {
            if (selected) {
                pushOnce('multiple-kpi');
            }
            // Note: removal token is handled at deselect time inside PerformanceOverviewWidget
        },
        [pushOnce],
    );

    const handleSingleMetricsChange = useCallback(
        (metrics: MetricLike[]) => {
            const newIds = (metrics ?? []).map(m => m.value);
            const prevIds = prevSingleIdsRef.current;
            const newlyAdded = newIds.filter(id => !prevIds.includes(id));
            for (const id of newlyAdded) {
                pushOnce(`single-kpi:${id}`);
            }
            prevSingleIdsRef.current = newIds;
        },
        [pushOnce],
    );

    const renderWidgets = () => {
        if (sideOptionValue === WidgetType.PerformanceOverview) {
            return (
                <PerformanceOverviewWidget
                    widgetId={String(sideOptionValue)}
                    onKpiCardSelected={onKpiCardSelected}
                    activeTabId={activeTabId}
                    onMultipleKpiToggle={handleMultipleToggle}
                    onMultipleKpiMetricsChange={handleSingleMetricsChange}
                />
            );
        } else if (sideOptionValue === WidgetType.Charts) {
            return (
                <Charts
                    ref={chartsRef}
                    widgetId={String(sideOptionValue)}
                    onChartsSelectedCountChange={onChartsSelectedCountChange}
                    onChartTemplatesSelected={onChartTemplatesSelected}
                    onChartTypeSelected={onChartTypeSelected}
                    onChartIndexSelected={onChartIndexSelected}
                />
            );
        } else if (sideOptionValue == WidgetType.Table) {
            return (
                <Tables
                    ref={chartsRef}
                    widgetId={String(sideOptionValue)}
                    onTablesSelectedCountChange={onTablesSelectedCountChange}
                    onTableTemplatesSelected={onTableTemplatesSelected}
                    onTableTypeSelected={onTableTypeSelected}
                />
            );
        } else if (sideOptionValue === WidgetType.HighlightSummary) {
            return (
                <HighlightSummaryWidget
                    mode="preview"
                    isSelected={isHighlightSummaryChosen}
                    onSelect={() => setIsHighlightSummaryChosen(true)}
                />
            );
        } else {
            return (
                <Flex vertical flex={2} justify="center" align="center">
                    {NoWidgetsAdded()}
                    <Label type="body2">Select a Category to see available Widgets</Label>
                    <div className={styles['space-v-8']} />
                </Flex>
            );
        }
    };

    const handleSearchChange = (value: string | string[]) => {
        const next = Array.isArray(value) ? (value[0] ?? '') : value;
        setSearchText(next);
    };

    const filteredCategories: AddWidgetCategory[] = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        if (!q) return ADD_WIDGET_CATEGORIES;

        return ADD_WIDGET_CATEGORIES.map(cat => {
            const items = cat.items.filter(item => item.name.toLowerCase().includes(q));
            return { ...cat, items };
        }).filter(cat => cat.items.length > 0);
    }, [searchText]);

    useEffect(() => {
        if (!filteredCategories.length) {
            setSelectedCategoryId('');
            return;
        }
        const stillExists = filteredCategories.some(c => c.id === selectedCategoryId);
        if (!stillExists) setSelectedCategoryId('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredCategories]);

    const closeFlyout = () => {
        setIsOpen(false);
        onClose();
        setSelectedCategoryId('');
        setSearchText('');
        setSideOptionValue(null);
        setSelectedWidgetTypeId(null);

        // reset local trackers on close
        setKpiCountValue(0);
        setChartsCountValue(0);
        setSelectedChartsTemplates([]);
        setSessionOrder([]);
        setSelectedChartType(null);
        setIsHighlightSummaryChosen(false);
    };

    const isSearching = !!searchText.trim();
    const isHighlightSummarySelected =
        sideOptionValue === WidgetType.HighlightSummary && isHighlightSummaryChosen;

    useEffect(() => {
        if (sideOptionValue !== WidgetType.HighlightSummary) {
            setIsHighlightSummaryChosen(false);
        }
    }, [sideOptionValue]);

    const onPrimaryClick = async () => {
        const existingOrder = currentTabState.widgetOrder ?? [];

        // --- Remove chart-template tokens first for any deselected templates
        const prevTemplates = currentTabState.chartsTemplates ?? [];
        const nextTemplateValues = new Set(selectedChartsTemplates.map(t => t.value));

        const removedTemplateTokens: string[] = [];
        for (const prev of prevTemplates) {
            if (!nextTemplateValues.has(prev.value)) {
                removedTemplateTokens.push(`chart-template:${prev.value}`);
            }
        }
        if (removedTemplateTokens.length > 0) {
            dispatch(removeFromWidgetOrder({ tabId: activeTabId, items: removedTemplateTokens }));
        }

        // 1) Persist chart templates list to Redux
        if (selectedChartsTemplates.length > 0 || prevTemplates.length > 0) {
            dispatch(
                setChartsTemplates({
                    tabId: activeTabId,
                    templates: selectedChartsTemplates,
                }),
            );
        }

        // 2) Build tokens to append based on sessionOrder (actual selection sequence)
        const tokensToAppend: string[] = [];
        for (const token of sessionOrder) {
            if (!existingOrder.includes(token)) {
                tokensToAppend.push(token);
            }
        }

        // Also append newly added chart templates that may not be in sessionOrder
        for (const tpl of selectedChartsTemplates) {
            const token = `chart-template:${tpl.value}`;
            if (!existingOrder.includes(token) && !tokensToAppend.includes(token)) {
                tokensToAppend.push(token);
            }
        }

        if (isHighlightSummarySelected) {
            const token = 'highlight-summary';
            if (!existingOrder.includes(token) && !tokensToAppend.includes(token)) {
                tokensToAppend.push(token);
            }
        }

        if (selectedChartType && selectedChartsTemplates.length === 0) {
            let emptyToken = `chart-empty:${selectedChartType}`;
            if (selectedChartIndex === "column-3") emptyToken = `chart-empty:${selectedChartType}@${selectedChartIndex}`;
            const existingEmpty = existingOrder.filter(t => t.startsWith('chart-empty:'));
            if (existingEmpty.length > 0) {
                dispatch(removeFromWidgetOrder({ tabId: activeTabId, items: existingEmpty }));
            }
            if (!existingOrder.includes(emptyToken) && !tokensToAppend.includes(emptyToken)) {
                tokensToAppend.push(emptyToken);
            }
        }
        // ---- TABLE EMPTY STATE HANDLING ----
        if (selectedTableType && selectedTablesTemplates.length === 0) {
            const emptyToken = `table-empty:${selectedTableType}`;

            // Remove existing table-empty tokens (only one empty table allowed)
            const existingEmpty = existingOrder.filter(t => t.startsWith('table-empty:'));

            if (existingEmpty.length > 0) {
                dispatch(
                    removeFromWidgetOrder({
                        tabId: activeTabId,
                        items: existingEmpty,
                    }),
                );
            }

            if (!existingOrder.includes(emptyToken) && !tokensToAppend.includes(emptyToken)) {
                tokensToAppend.push(emptyToken);
            }
        }

        if (tokensToAppend.length > 0) {
            dispatch(appendToWidgetOrder({ tabId: activeTabId, items: tokensToAppend }));
        }

        // 3) Optional save to API
        try {
            await dispatch(
                saveTabWidgetsState({
                    tabId: activeTabId,
                    data: {
                        ...currentTabState,
                        chartsTemplates: selectedChartsTemplates,
                        chartType: selectedChartType ?? currentTabState.chartType,
                        widgetOrder: [
                            ...(existingOrder.filter(t => !removedTemplateTokens.includes(t)) ??
                                []),
                            ...tokensToAppend,
                        ],
                        updatedAt: new Date().toISOString(),
                    },
                }),
            ).unwrap();
        } catch {
            // Preserve UX even if save fails
        }

        closeFlyout();
    };

    /** Reset only the Charts area (local state in Charts + parent trackers). */
    const onResetClick = () => {
        chartsRef.current?.reset?.();

        // Clear parent trackers as well
        setChartsCountValue(0);
        setSelectedChartsTemplates([]);
        setSelectedChartType(null);

        //Clear Table widget selections
        setTablesCountValue(0);
        setSelectedTablesTemplates([]);
        setSelectedTableType(null);

        // Remove any chart-related tokens captured during this session
        setSessionOrder(prev =>
            prev.filter(t => !t.startsWith('chart-template:') && !t.startsWith('chart-empty:')),
        );
    };

    const showReset =
        !isSearching &&
        (sideOptionValue === WidgetType.Charts || sideOptionValue == WidgetType.Table); // Only when Charts is selected and charts panel is visible

    const disablePrimary =
        !isHighlightSummarySelected && totalSelected <= 0 && totalTableSelected <= 0;

    return (
        <Flex ref={flyoutRef} className={styles['add-widget-flyout-wrapper']}>
            <Flyout
                content={
                    <Flex className={styles['add-widget-container']} gap={24}>
                        <Flex vertical className={styles['add-widget-left-side']} gap={32}>
                            <SearchInput
                                placeholder="Search by metric or widget"
                                onChange={handleSearchChange}
                            />

                            {widgetsTypeList &&
                                widgetsTypeList?.length > 0 &&
                                widgetsTypeList?.map(widget => {
                                    const iconName = widgetsIcon[widget?.id];
                                    return (
                                        <Flex
                                            key={widget?.id}
                                            align="center"
                                            justify="space-between"
                                            className={
                                                styles[
                                                `${sideOptionValue === widget?.id
                                                    ? 'add-widget-body-wrapper-active'
                                                    : 'add-widget-body-wrapper'
                                                }`
                                                ]
                                            }
                                            onClick={() => onSideOptionMenuClick(widget?.id)}
                                        >
                                            <Flex gap={12} align="center">
                                                {widget?.widgetTypeName === 'Process Monitoring' ? (
                                                    <img
                                                        src={ProcessMonitoringIcon}
                                                        alt="process_monitoring"
                                                    />
                                                ) : (
                                                    <Icon
                                                        color="neutrals-B800"
                                                        name={iconName as IconNames}
                                                        size="m"
                                                    />
                                                )}
                                                <span
                                                    className={styles['add-widget-list-key-name']}
                                                >
                                                    {widget?.widgetTypeName}
                                                </span>
                                            </Flex>
                                            <Icon
                                                color="neutrals-B800"
                                                name="chevron-right"
                                                size="m"
                                            />
                                        </Flex>
                                    );
                                })}
                        </Flex>

                        <Flex
                            className={
                                styles[
                                sideOptionValue
                                    ? 'add-widget-right-side'
                                    : 'add-widget-right-side-no-selection'
                                ]
                            }
                        >
                            {isSearching ? (
                                <WidgetSearchResults
                                    searchTerm={searchText}
                                    selectedWidgetTypeId={selectedWidgetTypeId}
                                />
                            ) : (
                                renderWidgets()
                            )}
                        </Flex>
                    </Flex>
                }
                dataTestId={ADD_WIDGET_FLYOUT_ID}
                flyoutOpen={isOpen}
                direction="left"
                cancelIconClick={closeFlyout}
                heading="Select Widget"
                className={styles['flyout-container-add-widget']}
                flyoutBgColor={'#F4F6F7'}
                id={ADD_WIDGET_FLYOUT_ID}
                containerMaxWidth={'100%'}
                primaryBtnProps={{
                    disabled: disablePrimary,
                    onClick: onPrimaryClick,
                    text: 'Add Widget',
                    variant: 'Primary',
                }}
                /** Show Reset only for Charts */
                secondaryBtnProps={
                    showReset
                        ? {
                            disabled: false,
                            onClick: onResetClick,
                            text: 'Reset',
                            variant: 'Secondary',
                        }
                        : undefined
                }
                iconForCancel={{ icon: 'x-close', onClick: closeFlyout }}
                customFooterText={
                    (totalSelected > 0 && (
                        <Label type="body2">
                            <span>Selected items: {totalSelected}</span>
                        </Label>
                    )) ||
                    (totalTableSelected > 0 && (
                        <Label type="body2">
                            <span>Selected items: {totalTableSelected}</span>
                        </Label>
                    ))
                }
            />
        </Flex>
    );
};

export default AddWidgetFlyout;
