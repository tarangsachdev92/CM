import { Flex } from 'antd';
import { DropDown, ChartTypeButton, AccordionGroup, Counter } from 'konnect-react-components';
import { useEffect, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import styles from '../PerformanceManagementCustomisations.module.scss';
import { Label } from '../../../atoms';
import { AppDispatch, RootState } from '../../../../store';
import { useDispatch, useSelector } from 'react-redux';
import {
    ClusteredBarIcon,
    ClusteredColumnIcon,
    ColumnTargetIcon,
    DonutIcon,
    FilledAreaIcon,
    MultiLineIcon,
    OverlayAreaIcon,
    PieIcon,
    RingIcon,
    ScatterIcon,
    SingleLineIcon,
    Stacked100BarIcon,
    Stacked100ColumnIcon,
    StackedBarIcon,
    StackedColumnIcon,
} from '../../../../assets/icons/icons';
import { fetchPerformanceOverviewFilters } from '../../../../store/thunks/performanceManagementWidgets';
import { ChartIndexString, ChartTypeString } from '../../../../store/slice/performanceWidgetsByTabSlice';
import { setIsFromScratch } from '../../../../store/slice/performanceManagementWidgetsSlice';
import TemplateSkeleton from '../chart-widgets/TemplateSkeleton';

interface ICharts {
    widgetId: string;

    /** Fired whenever the number of templates “marked for add” changes */
    onChartsSelectedCountChange?: (count: number) => void;

    /** Gives the parent the full selected templates (to persist on Add) */
    onChartTemplatesSelected?: (templates: KpiOption[]) => void;
    onChartTypeSelected?: (chartType: ChartTypeString | null) => void;

    onChartIndexSelected?: (index: ChartIndexString | null) => void;
}

export type KpiOption = {
    label: string;
    value: string;
    category?: string;
};

export const DemoKpiCard: React.FC<{ titleLabel: string; projectionEnabled?: boolean }> = ({ titleLabel, projectionEnabled }) => {
    return (
        <TemplateSkeleton
            id="chart-customization-preview"
            mode="view"
            titleLabel={titleLabel}
            projectionEnabled={projectionEnabled}
            initialStatusVisibility={{ MTD: true, QTD: true, YTD: true }}
            showXAxisSelection={false}
            showSortButton={false}
            showGroupByDropdown={false}
            showStackByDropdown={false}
            showTargetDropdown={false}
            showWidgetFilterDropdown={false}
            showTableView={false}
            isTableView={false}
        />
    );
};

/** Expose a reset handle to parent */
export type ChartsHandle = {
    /** Clears all local selection state and notifies parent to reset counts */
    reset: () => void;
};

const Charts = forwardRef<ChartsHandle, ICharts>(
    (
        { widgetId, onChartsSelectedCountChange, onChartTemplatesSelected, onChartTypeSelected, onChartIndexSelected },
        ref,
    ) => {
        const dispatch = useDispatch<AppDispatch>();
        const [kpiOptionsData, setKpiOptionsData] = useState<KpiOption[]>([]);
        const [selectedKpiValues, setSelectedKpiValues] = useState<KpiOption[]>([]);

        /** templates the user has “marked to add” by clicking the section */
        const [, setSelectedTemplatesToAdd] = useState<KpiOption[]>([]);

        /** local selected state for selected styling on the preview block */
        const [isExistingTemplateMarked, setIsExistingTemplateMarked] = useState<boolean>(false);

        const performanceOverviewFilters = useSelector(
            (state: RootState) => state.performanceOverviewFilter.performanceOverviewFilters,
        );

        useEffect(() => {
            dispatch(fetchPerformanceOverviewFilters({ performanceOverviewWidgetId: widgetId }));
        }, [dispatch, widgetId]);

        useEffect(() => {
            if (performanceOverviewFilters?.length && performanceOverviewFilters[0]?.kpIs) {
                const transformData = performanceOverviewFilters[0].kpIs.map((item: any) => ({
                    label: item.kpiName,
                    value: String(item.kpiId),
                }));
                setKpiOptionsData(transformData);
            }
        }, [performanceOverviewFilters]);

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

        /** Add current selected templates (from dropdown) into the “to add” list + mark selected style */
        const addCurrentSelectionToTemplates = useCallback(() => {
            if (!selectedKpiValues.length) return;

            dispatch(setIsFromScratch(false));

            setSelectedTemplatesToAdd(prev => {
                const prevMap = new Map(prev.map(p => [p.value, p]));
                selectedKpiValues.forEach(t => prevMap.set(t.value, t));
                const merged = Array.from(prevMap.values());

                // Notify parent (flyout) for count and list
                onChartsSelectedCountChange?.(merged.length);
                onChartTemplatesSelected?.(merged);

                return merged;
            });

            // Visually mark as selected
            setIsExistingTemplateMarked(true);
        }, [selectedKpiValues, onChartsSelectedCountChange, onChartTemplatesSelected]);

        // If the dropdown gets cleared, remove the visual selection
        useEffect(() => {
            if (selectedKpiValues.length === 0) {
                setIsExistingTemplateMarked(false);
            }
        }, [selectedKpiValues.length]);

        const previewWrapperClass = isExistingTemplateMarked
            ? `${styles['chart-category']} ${styles['chart-category-selected']}`
            : styles['chart-category'];

        const selectChartType = (t: ChartTypeString) => {
            onChartTypeSelected?.(t);

        };

        /** Expose reset() to parent to clear local state and notify parent */
        const reset = useCallback(() => {
            setSelectedKpiValues([]);
            setSelectedTemplatesToAdd([]);
            setIsExistingTemplateMarked(false);

            // Inform parent so footer & button states update
            onChartsSelectedCountChange?.(0);
            onChartTemplatesSelected?.([]);
            onChartTypeSelected?.(null);
            onChartIndexSelected?.(null);

        }, [onChartsSelectedCountChange, onChartTemplatesSelected, onChartTypeSelected, onChartIndexSelected]);

        useImperativeHandle(ref, () => ({ reset }), [reset]);

        // Define chart types data structure
        const chartTypesData = useMemo(() => [
            {
                category: 'Column Chart',
                charts: [
                    { icon: <ClusteredColumnIcon />, type: 'column-1' as ChartTypeString, index: 'column-1' },
                    { icon: <StackedColumnIcon />, type: 'column-2' as ChartTypeString, index: 'column-2' },
                    { icon: <Stacked100ColumnIcon />, type: 'column-3' as ChartTypeString, index: 'column-3' },
                ],
            },
            {
                category: 'Bar Chart',
                charts: [
                    { icon: <ClusteredBarIcon />, type: 'bar' as ChartTypeString, index: 'bar' },
                    { icon: <StackedBarIcon />, type: 'stacked-bar' as ChartTypeString, index: 'stacked-bar' },
                    { icon: <Stacked100BarIcon />, type: 'grouped-bar' as ChartTypeString, index: 'grouped-bar' },
                ],
            },
            {
                category: 'Line Chart',
                charts: [
                    { icon: <SingleLineIcon />, type: 'line' as ChartTypeString, index: 'line' },
                    { icon: <MultiLineIcon />, type: 'stacked-line' as ChartTypeString, index: 'stacked-line' },
                ],
            },
            {
                category: 'Area Chart',
                charts: [
                    { icon: <FilledAreaIcon />, type: 'area' as ChartTypeString, index: 'area-1' },
                    { icon: <OverlayAreaIcon />, type: 'stacked-area' as ChartTypeString, index: 'stacked-area' }
                ],
            },
            {
                category: 'Pie Chart',
                charts: [
                    { icon: <PieIcon />, type: 'pie-1' as ChartTypeString, index: 'pie-1' },
                    { icon: <DonutIcon />, type: 'pie-2' as ChartTypeString, index: 'pie-2' },
                    { icon: <RingIcon />, type: 'pie-3' as ChartTypeString, index: 'pie-3' },
                ],
            },
            {
                category: 'Others',
                charts: [
                    { icon: <ScatterIcon />, type: 'other-1' as ChartTypeString, index: 'other-1' },
                    { icon: <ColumnTargetIcon />, type: 'other-2' as ChartTypeString, index: 'other-2' },
                ],
            },
        ], []);

        // Calculate total chart types dynamically from the data structure
        const totalChartTypes = useMemo(() => {
            return chartTypesData.reduce((sum, category) => sum + category.charts.length, 0);
        }, [chartTypesData]);

        // Accordion item 1: Existing Templates
        const existingTemplatesContent = (
            <Flex gap={16} className={styles['existing-templates-content']} vertical>
                <DropDown
                    className={styles['metric-dropdown']}
                    dataTestId="dropd-down"
                    dropdown={{
                        isDisabled: false,
                        isLabelInline: false,
                        onChange: onKpiDropdownChange,
                        onScroll: () => { },
                        isMultiSelect: true,
                        options: kpiOptionsData,
                        placeholder: 'Select from the list',
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

                {selectedKpiValues.length > 0 ? (
                    <Flex
                        className={`${previewWrapperClass} ${styles['chart-preview-wrapper']}`}
                        vertical
                        gap={16}
                        onClick={addCurrentSelectionToTemplates}
                        title="Click to add this chart template to your selection"
                    >
                        <Label type="body2">Single Column Chart</Label>

                        <TemplateSkeleton
                            id="existing-template-preview"
                            mode="view"
                            titleLabel="KPI Name"
                            initialUom="(UOM)"
                            initialStatusVisibility={{ MTD: true, QTD: true, YTD: true }}
                            showXAxisSelection={false}
                            showSortButton={false}
                            showGroupByDropdown={false}
                            showStackByDropdown={false}
                            showTargetDropdown={false}
                            showWidgetFilterDropdown={false}
                            showTableView={true}
                            isTableView={false}
                        />
                    </Flex>
                ) : null}
            </Flex>
        );

        // Accordion item 2: All Chart Types - Render dynamically from data structure
        const allChartTypesContent = (
            <Flex gap={12} className={styles['all-chart-types-content']} wrap>
                {chartTypesData.map((categoryData) => (
                    <Flex key={categoryData.category} vertical gap={12} className={styles['chart-category']}>
                        <Label type="body2">{categoryData.category}</Label>
                        <Flex gap={12}>
                            {categoryData.charts.map((chart) => (
                                <ChartTypeButton
                                    key={chart.index}
                                    icon={chart.icon}
                                    onClick={() => {
                                        dispatch(setIsFromScratch(true));
                                        selectChartType(chart.type);
                                        if (chart.index === "column-3") selectChartType("column-3")
                                        else selectChartType(chart.type)
                                    }}
                                    size={56}
                                />
                            ))}
                        </Flex>
                    </Flex>
                ))}
            </Flex>
        );

        const accordions = [
            {
                title: (
                    <Flex vertical gap={4}>
                        <Label type="body2">
                            <span>Existing Templates</span>
                        </Label>
                        <Label type="body3">
                            <span className={styles['performance-overview-kpi-label']}>
                                Select a metric to preview existing charts used across command
                                center.
                            </span>
                        </Label>
                    </Flex>
                ) as any,
                children: existingTemplatesContent,
                outlined: false,
                isExpanded: false,
            },
            {
                title: (
                    <Flex vertical>
                        <Label type="body2">
                            <span>All Chart Types</span>
                        </Label>
                        <Label type="body3">
                            <span className={styles['performance-overview-kpi-label']}>
                                Select a chart type to customize from scratch.
                            </span>
                        </Label>
                    </Flex>
                ) as any,
                customActions: (
                    <Counter value={totalChartTypes} size="Small" colorVariant="Neutral-2" />
                ),
                children: allChartTypesContent,
                outlined: false,
                isExpanded: true,
            },
        ];

        return (
            <Flex className={styles['charts-main-container']} vertical>
                <AccordionGroup
                    accordions={accordions}
                    allowMultiple={true}
                    gap={0}
                />
            </Flex>
        );
    },
);

export default Charts;
