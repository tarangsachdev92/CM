import { Flex } from 'antd';
import { DropDown, Divider } from 'konnect-react-components';
import React, { useEffect, useState, useCallback } from 'react';
import styles from '../PerformanceManagementCustomisations.module.scss';
import { Label } from '../../../atoms';
import { AppDispatch, RootState } from '../../../../store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPerformanceOverviewFilters } from '../../../../store/thunks/performanceManagementWidgets';
import MultipleKpiWidget from '../kpi-overview-widgets/MultipleKpiWidget';
import SingleKpiWidget from '../kpi-overview-widgets/SingleKpiWidget';

import {
    setChartType as setChartTypeRedux,
    setSingleKpiSelectedIds,
    setSingleKpiSelectedMetric,
    setMultipleKpiSelected,
    setMultipleKpiConfig,
    setMultipleKpiSelectedMetric,
    selectChartType as selectChartTypeRedux,
    selectSingleKpi,
    selectMultipleKpi,
    ChartTypeString,
    type MultipleKpiConfigState,
} from '../../../../store/slice/performanceWidgetsByTabSlice';
import { removeFromWidgetOrder } from '../../../../store/slice/performanceWidgetsByTabSlice';

interface IPerformanceOverviewWidget {
    widgetId: string;
    onKpiCardSelected: (kpiCount: number) => void;
    activeTabId: number;
    /** NEW: for capturing selection order in the flyout session */
    onMultipleKpiToggle?: (selected: boolean) => void;
    onMultipleKpiMetricsChange?: (metrics: KpiOption[]) => void;
}

type KpiOption = {
    label: string;
    value: string;
    category?: string;
};

const chartOptions = [
    { label: 'Area Chart', value: 'area' },
    { label: 'Bar Chart', value: 'bar' },
    { label: 'Line Chart', value: 'line' },
] as const;
type ChartType = (typeof chartOptions)[number];

type PersistPayload = {
    singleSelectedIds?: string[];
    multipleSelected?: boolean;
};

const PerformanceOverviewWidget: React.FC<IPerformanceOverviewWidget> = ({
    widgetId,
    onKpiCardSelected,
    activeTabId,
    onMultipleKpiToggle,
    onMultipleKpiMetricsChange,
}) => {
    const dispatch = useDispatch<AppDispatch>();

    const [kpiOptionsData, setKpiOptionsData] = useState<KpiOption[]>([]);
    const [selectedKpiValues, setSelectedKpiValues] = useState<KpiOption[]>([]);

    // chartType from Redux, default to 'area'
    const chartTypeFromRedux = useSelector((s: RootState) => selectChartTypeRedux(s, activeTabId));
    const [chartType, setChartType] = useState<ChartType>(
        chartOptions.find(o => o.value === chartTypeFromRedux) ?? chartOptions[0],
    );

    // Previous selections to compute removals
    const prevSingle = useSelector((s: RootState) => selectSingleKpi(s, activeTabId));
    const prevSingleIds = prevSingle?.selectedIds ?? [];
    const prevMultiple = useSelector((s: RootState) => selectMultipleKpi(s, activeTabId));
    const prevMultipleSelected = !!prevMultiple?.selected;

    const [singleSelectedCount, setSingleSelectedCount] = useState(0);
    const [multipleSelectedCount, setMultipleSelectedCount] = useState(0);

    const performanceOverviewFilters = useSelector(
        (state: RootState) => state.performanceOverviewFilter.performanceOverviewFilters,
    );

    useEffect(() => {
        dispatch(fetchPerformanceOverviewFilters({ performanceOverviewWidgetId: widgetId }));
    }, [dispatch, widgetId]);

    useEffect(() => {
        if (performanceOverviewFilters?.length && performanceOverviewFilters[0]?.kpIs) {
            const transformData = performanceOverviewFilters[0].kpIs.map(item => ({
                label: item.kpiName,
                value: String(item.kpiId),
            }));
            setKpiOptionsData(transformData);
        }
    }, [performanceOverviewFilters]);

    useEffect(() => {
        const merged = new Map<string, KpiOption>();

        for (const item of prevSingle?.selectedMetric ?? []) {
            merged.set(item.value, item);
        }

        for (const item of prevMultiple?.selectedMetric ?? []) {
            merged.set(item.value, item);
        }

        setSelectedKpiValues(Array.from(merged.values()));
    }, [activeTabId, prevMultiple?.selectedMetric, prevSingle?.selectedMetric]);

    // Keep local chartType aligned to Redux whenever tab/chartType changes
    useEffect(() => {
        const option = chartOptions.find(o => o.value === chartTypeFromRedux) ?? chartOptions[0];
        setChartType(option);
         
    }, [activeTabId, chartTypeFromRedux]);

    const selectAllValue = 'all';
    const isSelectAll = (opt: KpiOption | { value: string }) => opt.value === selectAllValue;
    const isSelected = (opt: KpiOption, selected: KpiOption[]) =>
        selected.some(s => s.value === opt.value);
    const toggleOption = (opt: KpiOption, selected: KpiOption[]) =>
        isSelected(opt, selected)
            ? selected.filter(s => s.value !== opt.value)
            : [...selected, opt];

    const handleSelectAll = (selected: KpiOption[], allOptions: KpiOption[]): KpiOption[] => {
        const nonAllOptions = allOptions.filter(o => !isSelectAll(o));
        const allSelected =
            nonAllOptions.length > 0 && nonAllOptions.every(o => isSelected(o, selected));
        return allSelected ? ([] as KpiOption[]) : nonAllOptions;
    };

    const onKpiDropdownChange = (selectedOption: { label: string; value: string }) => {
        const option: KpiOption = { label: selectedOption.label, value: selectedOption.value };
        setSelectedKpiValues(prev => {
            if (isSelectAll(option)) return handleSelectAll(prev, kpiOptionsData);
            const next = toggleOption(option, prev);
            return next.length > 0 ? next : ([] as KpiOption[]);
        });
    };

    /** Persist helper — stores detailed selections in Redux (per tab)
     *  AND removes tokens from order when deselecting.
     *  Also emits selection-order callbacks to flyout session.
     */
    const persistKpiCard = useCallback(
        (tabId: number, _selected: boolean, payload?: PersistPayload) => {
            // Always sync chart type
            dispatch(
                setChartTypeRedux({
                    tabId,
                    chartType: chartType.value as ChartTypeString,
                }),
            );

            // ----- Single KPI -----
            if (Array.isArray(payload?.singleSelectedIds)) {
                const newIds = payload.singleSelectedIds;

                // Save to Redux
                dispatch(setSingleKpiSelectedIds({ tabId, selectedIds: newIds }));
                dispatch(setSingleKpiSelectedMetric({ tabId, selectedMetric: selectedKpiValues }));

                // Emit metrics order to parent (flyout) to capture session-order
                if (typeof onMultipleKpiMetricsChange === 'function') {
                    onMultipleKpiMetricsChange(selectedKpiValues);
                }

                // Remove from order: any IDs that existed previously but not anymore
                const removedIds = prevSingleIds.filter(id => !newIds.includes(id));
                if (removedIds.length > 0) {
                    dispatch(
                        removeFromWidgetOrder({
                            tabId,
                            items: removedIds.map(id => `single-kpi:${id}`),
                        }),
                    );
                }
            }

            // ----- Multiple KPI -----
            if (typeof payload?.multipleSelected === 'boolean') {
                const nextSelected = payload.multipleSelected;
                // Save to Redux
                dispatch(setMultipleKpiSelected({ tabId, selected: nextSelected }));
                dispatch(
                    setMultipleKpiSelectedMetric({
                        tabId,
                        selectedMetric: nextSelected ? selectedKpiValues : [],
                    }),
                );

                // Emit toggle to parent (flyout) to capture session-order
                if (typeof onMultipleKpiToggle === 'function') {
                    onMultipleKpiToggle(nextSelected);
                }

                // If it was selected before but now turned OFF, remove from order
                if (prevMultipleSelected && !nextSelected) {
                    dispatch(removeFromWidgetOrder({ tabId, items: ['multiple-kpi'] }));
                }
            }
        },
        [
            dispatch,
            selectedKpiValues,
            chartType,
            prevSingleIds,
            prevMultipleSelected,
            onMultipleKpiMetricsChange,
            onMultipleKpiToggle,
        ],
    );

    // Update combined count reporting to parent
    const handleSingleKpiCountChange = useCallback(
        (count: number) => {
            setSingleSelectedCount(count);
            onKpiCardSelected(count + multipleSelectedCount);
        },
        [multipleSelectedCount, onKpiCardSelected],
    );

    const handleMultipleKpiCountChange = useCallback(
        (count: number) => {
            setMultipleSelectedCount(count);
            onKpiCardSelected(count + singleSelectedCount);
        },
        [singleSelectedCount, onKpiCardSelected],
    );

    const persistMultipleKpiConfig = useCallback(
        (tabId: number, config: MultipleKpiConfigState) => {
            dispatch(setMultipleKpiConfig({ tabId, config }));
        },
        [dispatch],
    );

    // Optional: reset combined count when metrics list is cleared
    useEffect(() => {
        if (!selectedKpiValues.length) {
            setSingleSelectedCount(0);
            onKpiCardSelected(0 + multipleSelectedCount);
        }
    }, [selectedKpiValues.length, multipleSelectedCount, onKpiCardSelected]);

    // Persist chart type immediately when changed by user
    const onChartTypeChange = (val: unknown) => {
        const option = val as ChartType;
        setChartType(option);
        dispatch(
            setChartTypeRedux({
                tabId: activeTabId,
                chartType: option.value as ChartTypeString,
            }),
        );
    };

    return (
        <>
            <Flex gap={24}>
                <DropDown
                    className={styles['metric-dropdown']}
                    dataTestId="dropd-down"
                    dropdown={{
                        isDisabled: false,
                        isLabelInline: false,
                        label: 'Select Metric',
                        onChange: onKpiDropdownChange,
                        onScroll: () => { },
                        isMultiSelect: true,
                        options: kpiOptionsData,
                        placeholder: 'Select',
                        required: false,
                        reset: false,
                        selectAllOption: { label: 'Select All', value: 'all' },
                        selectedOptions: selectedKpiValues,
                        showMoreCount: false,
                        showSelectAll: true,
                        showtooltipcounter: true,
                        size: 'L',
                        type: 'checkbox',
                    }}
                    dropdownOptionsClassName="dropdown-options-custom"
                    searchInput={{
                        searchCharLimit: 3,
                        searchPlaceholder: 'Search',
                        searchSize: 'L',
                    }}
                    id="drop-down"
                />

                <DropDown
                    className={styles['metric-dropdown']}
                    dataTestId="dropd-down"
                    dropdown={{
                        excludeSelectAllOnFilter: false,
                        isDisabled: false,
                        isLabelInline: false,
                        label: 'Select Chart type',
                        onChange: onChartTypeChange,
                        onScroll: () => { },
                        options: chartOptions as unknown as { label: string; value: string }[],
                        placeholder: 'Select',
                        required: false,
                        reset: false,
                        selectedOptions: [chartType],
                        showMoreCount: false,
                        showtooltipcounter: true,
                        size: 'L',
                        type: 'radio',
                    }}
                    dropdownOptionsClassName="dropdown-options-custom"
                    searchInput={{
                        searchCharLimit: 3,
                        searchPlaceholder: 'Search',
                        searchSize: 'L',
                    }}
                    id="drop-down"
                />
            </Flex>

            <Divider size="thin" className={styles['performance-overview-divider']} />

            <div className={styles['performance-overview-widget-kpi']}>
                <div className={styles['performance-overview-label-container']}>
                    <Label type="body2">
                        <span>Available Widgets</span>
                    </Label>
                    <Label type="body3">
                        <span className={styles['performance-overview-kpi-label']}>
                            Select metric to preview data
                        </span>
                    </Label>
                </div>

                {/* Single KPI */}
                <SingleKpiWidget
                    widgetId={widgetId}
                    selectedChartType={chartType?.value}
                    selectedMetric={selectedKpiValues}
                    activeTabId={activeTabId}
                    onKpiCardSelected={handleSingleKpiCountChange}
                    persistKpiCard={persistKpiCard} trendPeriod={'3M'} projectionsEnabled={false} />
            </div>

            {/* Multiple KPI */}
            <MultipleKpiWidget
                widgetId={widgetId}
                activeTabId={activeTabId}
                selectedChartType={chartType?.value}
                selectedMetric={selectedKpiValues}
                onKpiCardSelected={handleMultipleKpiCountChange}
                persistKpiCard={persistKpiCard}
                initialConfig={prevMultiple?.config}
                persistMultipleKpiConfig={persistMultipleKpiConfig}
            />
        </>
    );
};

export default PerformanceOverviewWidget;
