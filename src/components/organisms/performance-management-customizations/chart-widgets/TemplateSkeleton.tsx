import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from "react-dom";

import {
    Icon,
    HorizontalColumnChart,
    ColumnChartWithCustomizeHeader,
    BarChartComponent,
    DropdownSwitch,
    MultiLineChartWithTargetMarkers
} from 'konnect-react-components';
import styles from '../PerformanceManagementCustomisations.module.scss';
import EditFieldModal, { SAVED_DATA } from './EditFieldModal';
import { FieldItem } from './DataFieldFlyout';
import { chartColor, LOCAL_UNIFIED_CHART_DATA } from '../../../../utils/chartContant';

type StatusChipTone = 'success' | 'warning' | 'danger' | 'neutral';
type StatusChipKind = 'MTD' | 'QTD' | 'YTD';
export type DrilldownConfig = {
    enabled?: boolean;
    canDrillUp?: boolean;
    canDrillDown?: boolean;
    onDrillUp?: () => void;
    onDrillDown?: () => void;
    levelLabel?: string; // optional breadcrumb/current level text
};
type StatusChip = {
    id: StatusChipKind;
    value: string | number;
    target?: string | number;
    tone?: StatusChipTone;
    visible?: boolean;
    tooltip?: string;
};

type Option = {
    label: string;
    value: string;
    disabled?: boolean;
    subOption?: Option[];

};


export interface ISwitchProps {
    /** onToggle() action to change the state, it return the state of the switch  */
    onToggle?: (isOn: boolean) => void;
    /** is to set disabled state  */
    isDisable?: boolean;
    /** is to set to set state of the switch [Selected, UnSelected] */
    checked?: boolean;
    /** specify the label of the Switch */
    label?: ReactNode; // Changed from string to ReactNode
    /** unique key value */
    key?: string;
    className?: string;
    children?: ReactNode; // Added children prop
    /** position of the switch alongside label */
    position?: 'left' | 'right';
    selected_value?: string
}


type SimpleOverlayProps = {
    parentRef: React.RefObject<HTMLElement>;
    children: React.ReactNode;
};

interface MyDropdownComponentProps {
    parentRef: React.RefObject<HTMLElement>;
    isdrop: boolean;
    xaxisData: ISwitchProps[];
    setXaxischeckedData: React.Dispatch<React.SetStateAction<ISwitchProps[]>>;
    selectedItemFromXaxisFn?: (v: any) => void;
}

type LegendLabel = {
    color: string;
    value: string;
    type: 'square' | 'three-circles' | 'line';
};

type ColumnProps = {
    charts: any[];
    legendsLabels: LegendLabel[];
};

type AxisFieldItem = {
    id: string;
    label: string;
    type: string;
    display?: string;
    eyeOpen?: boolean;
};
type FilteredAxisResult = {
    data: UnifiedDataItem[];
    axisLabel: string;
};

type AxisConfig = {
    yAxis: AxisFieldItem[];
    secondaryYAxis: AxisFieldItem[];
    xAxis: AxisFieldItem[];
    target: AxisFieldItem[];
    performanceIndicatorBase?: string;
};
type PeriodType =
    | "Year"
    | "Quarter"
    | "Month"
    | "Week"
    | "Day"
    | "Shift";
export type UnifiedDataItem = {
    month: string;
    year: number | string;
    Planned: number;
    Target?: number;
    isForecast?: boolean;
    dotColor?: string;
    Tolerance?: number;
    ToleranceTooltipLabel?: string;
    metrics?: Record<string, number>;
    targets?: Record<string, number>;

};

const DEFAULT_UNIFIED_ITEM: UnifiedDataItem = {
    month: 'Jan',
    year: 2026,
    Planned: 0,
    Target: 0,
    dotColor: '#DEDEDE',
    isForecast: false,
    Tolerance: 0,
    ToleranceTooltipLabel: 'No Status',
    metrics: {
        'CAPA Aging': 0,
        'CAPA Count': 0,
        'CAPA Overdue': 0,
    },
    targets: {
        'OTIF-D Target': 0,
        'OTIF-D Tolerance': 0,

    },
};


/**
 * Props:
 * - We expose (most of) ColumnChartWithCustomizeHeader props for future-proofing,
 *   but we own the children/content to keep the template self-contained.
 * - Consumers can still override many header props; if they do, we defer to them.
 */
export type TemplateSkeletonProps = Omit<
    React.ComponentProps<typeof ColumnChartWithCustomizeHeader>,
    'children'
> & {
    /** Optional children to support any chart type (Pie, Line, Area). If omitted, falls back to default Bar chart. */
    children?: React.ReactNode;

    /** Title shown on the header; if omitted, falls back to `title` from pass-through props or 'KPI Name' */
    titleLabel?: string;

    /** Provide/override UOM options for the inline UOM selector */
    uomOptionsOverride?: Option[];
    /** Initial selected UOM */
    initialUom?: string;
    /** Called when UOM changes (in addition to DS onUomChange, which we also call if provided) */
    onUomChanged?: (uom: string) => void;

    /** Initial status chip visibility (MTD/QTD/YTD) */
    initialStatusVisibility?: Partial<Record<StatusChipKind, boolean>>;

    /** Options for the Target (radio) dropdown in the top area */
    targetDropdownOptions?: Option[];
    /** Initial selected Target value */
    initialTarget?: string;

    /** Show the Key Highlights switch on the top area */
    showKeyHighlightsSwitch?: boolean;

    /** Override the chart data/legend; if omitted, we render a sensible demo chart */
    chartProps?: ColumnProps;

    /** Width style override for the chart container */
    chartStyle?: React.CSSProperties;

    /* Enable/Disable dummy projection data */
    projectionEnabled?: boolean;

    /** Configuration for To Date Values accordion */
    toDateConfig?: {
        mtd: boolean;
        qtd: boolean;
        ytd: boolean;
        comparisons: string[];
        compareWith: string;
    };

    /** Selected chart type; controls which chart component is rendered */
    selectedChartType?: string;

    axisConfig?: AxisConfig;

    userSelections?: {
        xAxisDropdown?: boolean;
        xAxisDrilldown?: boolean;
        targetLineDropdown?: boolean;
        projectionButton?: boolean;
    };
    projectionToolTip?: React.ReactNode;
    projectionButtonText?: string;
    onProjectionClick?: () => void;

    /**  Styling Tab Props  **/
    showYAxis?: boolean;
    xAxisAngle?: 0 | 45 | 90;
    showValueLabel?: boolean;
    showTotalLabel?: boolean;
    showVerticalGridLines?: boolean;
    showHorizontalGridLines?: boolean;
    showLegend?: boolean;
    decimalPlaces?: 0 | 1 | 2 | 3;
    xaxisDataOption?: FieldItem[];
    unit?: string;
    yAxisLabel?: string;
    xAxisLabel?: string;
    showYAxisLabels?: boolean;
    showXAxisLabels?: boolean;
    setXaxisSetUp?: (value: ISwitchProps[]) => void;
};

const DEFAULT_UOM_OPTIONS: Option[] = [
    { label: '(UOM)', value: '(UOM)' },
    { label: '(kp)', value: '(kp)' },
];

const DEFAULT_TARGET_OPTIONS: Option[] = [
    { label: 'BP', value: 'bp' },
    { label: 'NU', value: 'nu' },
    { label: 'JNU', value: 'jnu' },
];
const defaultProjectionToolTipAi: React.ReactNode = (
    <div
        style={{
            background: chartColor.defaultProjectionToolTipAiBg,
            color: chartColor.defaultProjectionToolTipAi,
            paddingBottom: '8px',
            borderRadius: '10px',
            width: '252px',
            maxWidth: '320px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
    >
        {/* Main text */}
        <div style={{ fontSize: '12px', lineHeight: '20px', marginBottom: '12px' }}>
            Projection data is subject to a minimum of 12 months of historical data being available in the system
        </div>

        {/* Divider */}

        {/* Footer row */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#949494',
                fontSize: '10px',
                fontWeight: 400,
            }}
        >
            <span
                style={{
                    color: '#00C7BE',
                    fontSize: '20px',
                    lineHeight: 1,
                }}
            >
                ✦
            </span>

            <span>AI Generated Forecast</span>
        </div>
    </div>
);

export const staticAppliedFilterData = {
    "geography": [
        "Geography"
    ],
    "period": "Period",
    "local": [
        "UOM"
    ]
}

const TemplateSkeleton: React.FC<TemplateSkeletonProps> = props => {

    const {
        // Wrapper identity / layout
        setXaxisSetUp,
        id = 'template-skeleton',
        className,
        style,
        xaxisDataOption,
        // Header (we default/derive a few if not provided)
        mode: _mode = 'read-only',
        title,
        titleTooltip,
        metricName,
        autoTitleFromMetric = false,
        showTitle = true,

        // UOM
        uomOptions: dsUomOptions,
        selectedUom: dsSelectedUom,
        onUomChange: dsOnUomChange,

        // Chips / header info
        showStatusChips: dsShowStatusChips,
        statusChips: dsStatusChips,
        headerInfoRenderer: _dsHeaderInfoRenderer,

        // Subtitle / filters
        showSubtitle = true,
        subtitle = 'Region | Year | UOM',
        showAppliedFilters = false,
        appliedFilters = staticAppliedFilterData,

        // Controls row (we keep off by default for the template; can be enabled via props)
        showXAxisSelection = false,



        showSortButton: _showSortButton = false,
        sortOrder = null,
        onSortToggle,
        showGroupByDropdown: _showGroupByDropdown = false,
        groupByOptions = [],
        selectedGroupBy,
        onGroupByChange,
        showStackByDropdown: _showStackByDropdown = false,
        stackByOptions = [],
        selectedStackBy,
        onStackByChange,
        showTargetDropdown = false,
        targetOptions = DEFAULT_TARGET_OPTIONS,

        onTargetsChange,
        showWidgetFilterDropdown = false,
        widgetFilterRenderer,

        // Actions (view/edit/expand/table etc.) — exposed and passed through
        showLinkButton,
        linkHref,
        onLinkClick,
        showInsightsButton,
        onInsightsClick,
        insightsLoading,
        onDelete,
        deleteConfirmText,
        onDuplicate,
        onEdit,
        showTableView: _showTableView = true,
        isTableView = false,
        onToggleTableView,
        initialExpanded = false,
        onExpandChange,
        renderIcon: _renderIcon,
        renderBadge,
        renderSelect,
        renderMultiSelect,
        children,

        // ======= Extras =======
        titleLabel,
        uomOptionsOverride,
        initialUom = '(UOM)',
        onUomChanged,
        initialStatusVisibility: _initialStatusVisibility,
        targetDropdownOptions = DEFAULT_TARGET_OPTIONS,
        initialTarget: _initialTarget = 'bp',
        showKeyHighlightsSwitch: _showKeyHighlightsSwitch = true,
        chartProps: _chartProps,
        chartStyle: _chartStyle,
        projectionEnabled = false,
        selectedChartType = 'column',
        axisConfig,

        userSelections,
        showProjectionButton,
        projectionToolTip = defaultProjectionToolTipAi,

        /**  Styling Tab Props  **/
        showYAxis,
        xAxisAngle,
        showValueLabel,
        showTotalLabel,
        showVerticalGridLines,
        showHorizontalGridLines,
        showLegend,
        decimalPlaces,
        unit,
        yAxisLabel: _yAxisLabel,
        xAxisLabel,
        showYAxisLabels,
        showXAxisLabels,

        // Remainder passthrough (for any future props)
        ...rest
    } = props;

    const [selectedTargets, setSelectedtargets] = useState<any>([String(targetDropdownOptions[0]?.value)])

    const isDataProjectionDisabled = useMemo(() => {
        if (!projectionEnabled) return true;
        return false;
    }, [projectionEnabled]);

    const [projectionButtonChartHeader, setProjectionButtonChartHeader] = useState<boolean>(false)
    useEffect(() => {
        setProjectionButtonChartHeader(projectionEnabled);
    }, [projectionEnabled]);
    // ---- Local State: UOM ----
    const parentRef = useRef<HTMLDivElement>(null)
    const uomOptions = useMemo<Option[]>(
        () => uomOptionsOverride ?? dsUomOptions ?? DEFAULT_UOM_OPTIONS,
        [uomOptionsOverride, dsUomOptions],
    );
    const [selectedUom, setSelectedUom] = useState<string>(
        dsSelectedUom ?? initialUom ?? uomOptions?.[0]?.value ?? '(UOM)',
    );

    const [xaxischeckedData, setXaxischeckedData] = useState<ISwitchProps[]>([]);


    useEffect(() => {
        if (xaxisDataOption?.length) {
            const formatted = xaxisDataOption.map((item) => ({
                label: item.label,
                key: item.id,
                checked: item.eyeOpen ?? true,
                isDisable: false,
                selected_value: item.selected_value,
            }));

            setXaxischeckedData(formatted);
        }
    }, [xaxisDataOption]);

    const [dropdownOpenXaxis, setDropdownOpenXaxis] = useState<boolean>(false);
    const [selectedItemFromXaxis, setSelectedItemFromXaxis] = useState<ISwitchProps | null>(null);

    const getEditMenuOptions = (label: string) => {
        return {
            name: label === "Month" ? "Month" : label,
            select_options: ["select", "all_regions", "top", "bottom", "custom"],
        };
    };

    const updateChipDataOnEdit = (prevData: FieldItem, savedData: SAVED_DATA) => {

        setXaxischeckedData(prev => {
            const updatedData = prev.map(item => {
                if (item.label !== prevData.label) {
                    return item;
                }

                return {
                    ...item,
                    key: savedData.updatedName,
                    selected_value: savedData.selectedValues?.name,
                };
            });


            setXaxisSetUp?.(updatedData);

            return updatedData;
        });
    };
    // One unified source payload used by all chart renderers.



    const UNIFIED_CHART_DATA: UnifiedDataItem[] = LOCAL_UNIFIED_CHART_DATA;
    const targetColors = [chartColor.targetColors.color1, chartColor.targetColors.color2, chartColor.targetColors.color3, chartColor.targetColors.color4, chartColor.targetColors.color5];

    const [groupedXaxisIndex, setGroupedXaxisIndex] = useState<number>(0)





    const groupedXaxisData = useMemo(() => {
        const groupedChekedData = xaxisDataOption?.find((e: FieldItem) => e.eyeOpen && e.chip && e.chip.length)
        if (!groupedChekedData) return null;
        else return groupedChekedData?.chip;

    }, [xaxisDataOption])


    // Deterministic "random" generator based only on index (NOT based on existing Planned/Target)
    const setXaxis="month"
    const normalizePeriodType = (
        value?: string | number
    ): PeriodType | null => {
        if (value === undefined || value === null) {
            return null;
        }

        const normalizedValue = String(value)
            .trim()
            .toLowerCase();

        switch (normalizedValue) {
            case "year":
            case "years":
                return "Year";

            case "quarter":
            case "quarters":
            case "quater":
            case "queater":
                return "Quarter";

            case "month":
            case "months":
                return "Month";

            case "week":
            case "weeks":
                return "Week";

            case "day":
            case "days":
                return "Day";

            case "shift":
            case "shifts":
            case "year shift":
            case "year shifts":
                return "Shift";

            default:
                return null;
        }
    };
    const getActiveXAxisField = (xAxis: AxisFieldItem[] = []): AxisFieldItem | undefined => {
        if (!xAxis.length) return undefined;

        return xAxis.find(item => item.eyeOpen) ?? xAxis[xAxis.length - 1];
    };

    const generateXAxisLabels = (xAxis: AxisFieldItem[] = []): string[] => {
        const field = getActiveXAxisField(xAxis);
        const label = field?.label?.toLowerCase();

        switch (label) {
            case 'year':
                return ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];

            case 'month':
                return [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                ];

            case 'quarter':
                return ['24-Q2', '24-Q3', '24-Q4', '25-Q1', '25-Q2', '25-Q3', '25-Q4', '26-Q1'];

            case 'week':
                return ['13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];

            case 'day':
                return Array.from({ length: 10 }, (_, i) => `${i + 1}`);

            case 'shift':
                return [
                    'Shift 1',
                    'Shift 2',
                    'Shift 3',
                    'Shift 4',
                    'Shift 5',
                    'Shift 6',
                ];

            default:
                return [];
        }
    };
    const getComparableValue = (value: string, axis: string) => {
        const cleaned = String(value || "").trim();

        if (axis === "quarter") {
            const match = cleaned.toUpperCase().match(/Q[1-4]/);
            return match ? match[0] : cleaned.toUpperCase();
        }

        return cleaned.toLowerCase();
    };
    const PROJECTION_COUNT: Record<PeriodType, number> = {
        Year: 2,
        Quarter: 2,
        Month: 6,
        Week: 7,
        Day: 7,
        Shift: 3,
    };
    const dynamicBaseData = useMemo<UnifiedDataItem[]>(() => {
        let activeXAxisArray: AxisFieldItem[] = [];

        if (groupedXaxisData?.length) {
            const selectedXAxis = groupedXaxisData[groupedXaxisIndex];

            // If groupedXaxisData[groupedXaxisIndex] is undefined, return unified source data.
            if (!selectedXAxis) return UNIFIED_CHART_DATA;

            activeXAxisArray = [selectedXAxis as AxisFieldItem];
        } else {
            activeXAxisArray = axisConfig?.xAxis ?? [];
        }

        // If no active x-axis data, return unified source data.
        if (!activeXAxisArray.length) return UNIFIED_CHART_DATA;

        if (!UNIFIED_CHART_DATA.length) return [];

        const labels = generateXAxisLabels(activeXAxisArray);
        const field = getActiveXAxisField(activeXAxisArray);

        // If labels are empty, return unified source data.
        if (!labels.length) return UNIFIED_CHART_DATA;

        return labels.map((label, index) => {
            const source =
                UNIFIED_CHART_DATA[index % UNIFIED_CHART_DATA.length] ??
                UNIFIED_CHART_DATA[0] ??
                DEFAULT_UNIFIED_ITEM;

            return {
                ...source,
                month: label,
                year: field?.label ?? "Fallback",
            };
        });
    }, [
        axisConfig?.xAxis,
        groupedXaxisData,
        groupedXaxisIndex, 0
    ]);
    const applyProjectionsToExistingData = (
        data: UnifiedDataItem[]
    ): UnifiedDataItem[] => {
        if (!data.length) {
            return [];
        }

        const lastItem = data[data.length - 1];

        if (!lastItem) {
            return data;
        }

        const periodType = normalizePeriodType(
            lastItem.year
        );

        if (!periodType) {
            return data;
        }

        const projectionCount =
            PROJECTION_COUNT[periodType];

        const safeProjectionCount = Math.min(
            projectionCount,
            data.length
        );

        const projectionStartIndex =
            data.length - safeProjectionCount;

        return data.map((item, index) => ({
            ...item,
            metrics: item.metrics
                ? { ...item.metrics }
                : undefined,
            targets: item.targets
                ? { ...item.targets }
                : undefined,

            isForecast:
                index >= projectionStartIndex,

            dotColor:
                index >= projectionStartIndex
                    ? chartColor.projectionIndex
                    : item.dotColor,

            ToleranceTooltipLabel:
                index >= projectionStartIndex
                    ? "Projected"
                    : item.ToleranceTooltipLabel,
        }));
    };

    const DATA_WITH_OPTIONAL_PROJECTIONS =
        useMemo<UnifiedDataItem[]>(() => {
            if (!projectionEnabled) {
                return dynamicBaseData.map(item => ({
                    ...item,
                    isForecast: false,
                }));
            }

            return applyProjectionsToExistingData(
                dynamicBaseData
            );
        }, [
            dynamicBaseData,
            projectionEnabled,
        ]);


    const axisSelectedTarget = useMemo(() => {
        if (!axisConfig?.target?.length) return null;

        const label =
            axisConfig.performanceIndicatorBase ||
            axisConfig.target[0]?.display ||
            axisConfig.target[0]?.label;

        return axisConfig.target.find(
            t => t.display === label || t.label === label,
        );
    }, [axisConfig]);
    const getActiveData = ({
        axisConfig,
        groupedFilter,
        groupedXaxisIndex,
    }: {
        axisConfig: any;
        groupedFilter: FieldItem[] | null | undefined;
        groupedXaxisIndex: number;
    }) => {
        if (groupedFilter?.length) {

            return groupedFilter[groupedXaxisIndex];
        }

        return axisConfig?.xAxis?.find((x: any) => x.eyeOpen);
    };
    const selectedTargetLabel = useMemo(() => {
        return axisSelectedTarget?.display || axisSelectedTarget?.label;
    }, [axisSelectedTarget]);

    const getSeriesScale = useCallback((key: string) => {
        const normalized = key.toLowerCase();
        let hash = 0;

        for (let i = 0; i < normalized.length; i += 1) {
            hash = (hash + normalized.charCodeAt(i) * (i + 1)) % 1000;
        }

        return 0.7 + (hash % 7) * 0.1;
    }, []);

    const getMetricValue = useCallback((item: UnifiedDataItem, seriesKey: string) => {
        if (!seriesKey) return Number(item.Planned);

        const direct = item.metrics?.[seriesKey];
        if (typeof direct === 'number') return direct;

        const fallback = Number(item.Planned) * getSeriesScale(seriesKey);
        return Number(fallback.toFixed(1));
    }, [getSeriesScale]);

    const getTargetValue = useCallback((item: UnifiedDataItem) => {
        if (selectedTargetLabel) {
            const direct = item.targets?.[selectedTargetLabel];
            if (typeof direct === 'number') return direct;
        }

        return Number(item.Target);
    }, [selectedTargetLabel]);

    const normalizeTargetKey = useCallback((value?: string) => {
        return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    }, []);

    const getTargetValueByLabel = useCallback((item: UnifiedDataItem, targetLabel?: string) => {
        if (!targetLabel) {
            return getTargetValue(item);
        }

        const direct = item.targets?.[targetLabel];
        if (typeof direct === 'number') {
            return direct;
        }

        const normalizedRequested = normalizeTargetKey(targetLabel);
        const normalizedMatch = Object.entries(item.targets ?? {}).find(([key]) => {
            return normalizeTargetKey(key) === normalizedRequested;
        });

        if (normalizedMatch && typeof normalizedMatch[1] === 'number') {
            return normalizedMatch[1];
        }

        if (normalizedRequested.includes('tolerance')) {
            return Number(item.Tolerance ?? item.Target ?? 0);
        }

        return Number(item.Target ?? 0);
    }, [getTargetValue, normalizeTargetKey]);




    const getFilteredAxisData = ({
        data,
        axisConfig,
        axisSelectedTarget,
        groupedFilter,
        groupedXaxisIndex,
    }: {
        data: UnifiedDataItem[];
        axisConfig: AxisConfig | undefined;
        axisSelectedTarget: boolean;
        groupedFilter: FieldItem[] | null | undefined;
        groupedXaxisIndex: number;
    }): FilteredAxisResult => {
        if (!axisConfig) {
            return {
                data,
                axisLabel: '',
            };
        }

        if (!axisConfig.yAxis?.length) {
            return {
                data: [],
                axisLabel: '',
            };
        }

        const hasTolerance = axisConfig.target?.some((target) =>
            String(target.display || target.label)
                .toLowerCase()
                .includes('tolerance')
        );

        const activeXAxis = getActiveData({
            axisConfig,
            groupedFilter,
            groupedXaxisIndex,
        });

        let filteredData = [...data];
        let axisLabel = '';

        if (activeXAxis) {
            axisLabel = String(
                groupedFilter?.length
                    ? groupedFilter[groupedXaxisIndex]?.label ?? ''
                    : activeXAxis.display ?? activeXAxis.label ?? ''
            )
                .trim()
                .toLowerCase();

            const categoricalAxes = new Set([
                'cluster',
                'brand',
                'region',
                'market',
                'site',
                'area',
                'segment',
                'sub-segment',
                'sub-brand',
                'sku',
            ]);

            const selectedValue = String(
                activeXAxis.selected_value ?? 'All'
            ).trim();

            if (!categoricalAxes.has(axisLabel)) {
                filteredData = filteredData.filter(
                    item =>
                        String(item.year).trim().toLowerCase() === axisLabel
                );
            }

            if (selectedValue.toLowerCase() !== 'all') {
                const topMatch = selectedValue.match(/^top\s+(\d+)$/i);
                const bottomMatch = selectedValue.match(/^bottom\s+(\d+)$/i);

                if (topMatch) {
                    const limit = Number(topMatch[1]);

                    filteredData = [...filteredData]
                        .sort(
                            (a, b) =>
                                (Number(b.Planned) || 0) -
                                (Number(a.Planned) || 0)
                        )
                        .slice(0, limit);
                } else if (bottomMatch) {
                    const limit = Number(bottomMatch[1]);

                    filteredData = [...filteredData]
                        .sort(
                            (a, b) =>
                                (Number(a.Planned) || 0) -
                                (Number(b.Planned) || 0)
                        )
                        .slice(0, limit);
                } else {
                    const selectedList = selectedValue
                        .split(',')
                        .map(value => getComparableValue(value, axisLabel))
                        .filter(Boolean);

                    filteredData = filteredData.filter(item =>
                        selectedList.includes(
                            getComparableValue(item.month, axisLabel)
                        )
                    );
                }
            }
        }

        return {
            axisLabel,
            data: filteredData.map(item => ({
                ...item,
                Target: axisSelectedTarget
                    ? getTargetValue(item)
                    : undefined,
                Tolerance: hasTolerance
                    ? item.Tolerance
                    : undefined,
            })),
        };
    };

    const simpleColumnDynamicKey = useMemo(() => {
        return String(axisConfig?.yAxis?.find((e) => e.eyeOpen)?.display ?? "BRAND A");
    }, [axisConfig])
    const simpleColumnDynamicKeyForSecondary = useMemo(() => {
        return String(axisConfig?.secondaryYAxis?.find((e) => e.eyeOpen)?.display ?? null);
    }, [axisConfig])


    const GroupedColumnChartDynamicKey: string[] = useMemo(() => {
        return axisConfig?.yAxis?.filter((e) => e.eyeOpen).map(({ display }) => display as string) ?? [];
    }, [axisConfig]);

    const filteredAxisResult = useMemo<FilteredAxisResult>(() => {
        return getFilteredAxisData({
            data: DATA_WITH_OPTIONAL_PROJECTIONS,
            axisConfig,
            axisSelectedTarget: Boolean(axisSelectedTarget),
            groupedFilter: groupedXaxisData,
            groupedXaxisIndex,
        });
    }, [
        DATA_WITH_OPTIONAL_PROJECTIONS,
        axisConfig,
        axisSelectedTarget,
        groupedXaxisData,
        groupedXaxisIndex,
        getTargetValue,
    ]);

    const filteredChartData: UnifiedDataItem[] = filteredAxisResult.data;
    const xAxisLabelOptional: string = filteredAxisResult.axisLabel;


    const horizontalBarData = useMemo(() => {
        const targets = axisConfig?.target ?? [];

        return DATA_WITH_OPTIONAL_PROJECTIONS.map((item: UnifiedDataItem) => {

            let row: Record<string, any>;

            if (simpleColumnDynamicKeyForSecondary !== "null") {

                row = {
                    name: item.month,
                    [simpleColumnDynamicKey]: getMetricValue(
                        item,
                        simpleColumnDynamicKey
                    ),
                    [simpleColumnDynamicKeyForSecondary]: getMetricValue(
                        item,
                        simpleColumnDynamicKeyForSecondary
                    ),
                    isForecast: item.isForecast,
                    dotColor: item.isForecast ? chartColor.isForecast : chartColor.isForecast,
                    tooltipTitle: item.month

                };
            } else {
                row = {
                    name: item.month,
                    [simpleColumnDynamicKey]: getMetricValue(
                        item,
                        simpleColumnDynamicKey
                    ),
                    isForecast: item.isForecast,
                    tooltipTitle: item.month,
                    dotColor: item.isForecast ? chartColor.isForecast : chartColor.isForecast,
                };
            }

            targets.forEach(target => {
                const value = getTargetValueByLabel(
                    item,
                    target.label
                );

                if (target.type === "Tolerance") {
                    row[`${target.label} Upper`] = value + 3;
                    row[`${target.label} Lower`] = value - 3;
                } else {
                    row[target.label] = value;
                }
            });


            return row;
        });
    }, [
        DATA_WITH_OPTIONAL_PROJECTIONS,
        axisConfig?.target,
        simpleColumnDynamicKey,
        getTargetValueByLabel,
        projectionToolTip
    ]);


    const horizontalGrouppedBarData = useMemo(() => {
        const targets = axisConfig?.target ?? [];

        return DATA_WITH_OPTIONAL_PROJECTIONS.map((item: UnifiedDataItem) => {
            const bars: Record<string, number> = {};

            GroupedColumnChartDynamicKey.forEach(key => {
                if (key) {
                    bars[key] = getMetricValue(item, key);
                }
            });

            // Add secondary metric if configured
            if (
                simpleColumnDynamicKeyForSecondary &&
                simpleColumnDynamicKeyForSecondary !== "null"
            ) {
                bars[simpleColumnDynamicKeyForSecondary] = getMetricValue(
                    item,
                    simpleColumnDynamicKeyForSecondary
                );
            }

            const row: Record<string, any> = {
                name: item.month,
                ...bars,
                tooltipTitle: item.month,
                isForecast: item.isForecast,
                dotColor: item.isForecast ? chartColor.isForecast2 : chartColor.isForecast3
            };

            targets.forEach(target => {
                const value = getTargetValueByLabel(
                    item,
                    target.label
                );

                if (target.type === "Tolerance") {
                    row[`${target.label} Upper`] = value + 3;
                    row[`${target.label} Lower`] = value - 3;
                } else {
                    row[target.label] = value;
                }
            });

            return row;
        });
    }, [
        DATA_WITH_OPTIONAL_PROJECTIONS,
        axisConfig?.target,
        GroupedColumnChartDynamicKey,
        simpleColumnDynamicKeyForSecondary,
        getMetricValue,
        getTargetValueByLabel,
    ]);

    const areaChartData = useMemo(() => {
        const targets = axisConfig?.target ?? [];

        return filteredChartData.map(item => {
            const row: Record<string, any> = {
                month: item.month,
                [simpleColumnDynamicKey]: getMetricValue(
                    item,
                    simpleColumnDynamicKey
                ),
                forecast: item.isForecast,
                isTargetDashed: item.isForecast,
            };

            targets.forEach(target => {
                const value = getTargetValueByLabel(
                    item,
                    target.label
                );

                if (target.type === "Tolerance") {
                    row[`${target.label} Upper`] = value + 3;
                    row[`${target.label} Lower`] = value - 3;
                } else {
                    row[target.label] = value;
                }
            });

            return row;
        });
    }, [
        filteredChartData,
        axisConfig?.target,
        simpleColumnDynamicKey,
        getMetricValue,
        getTargetValueByLabel
    ]);

    const stackeddColumnChartData = useMemo(() => {
        const targets = axisConfig?.target ?? [];

        return filteredChartData.map((item) => {
            const bars: Record<string, number> = {};

            GroupedColumnChartDynamicKey.forEach((key) => {
                if (key) {
                    bars[key] = getMetricValue(item, key);
                }
            });

            const row: Record<string, any> = {
                month: item.month,
                ...bars,
                tooltipTitle: `${item.month} 2024`,
                "forecast": item.isForecast
            };

            targets.forEach(target => {
                const value = getTargetValueByLabel(
                    item,
                    target.label
                );

                if (target.type === "Tolerance") {
                    row[`${target.label} Upper`] = value + 3;
                    row[`${target.label} Lower`] = value - 3;
                } else {
                    row[target.label] = value;
                }
            });

            return row;
        });
    }, [
        filteredChartData,
        axisConfig?.target,
        GroupedColumnChartDynamicKey,
        getMetricValue,
        getTargetValueByLabel,
    ]);




    const simpleColumnChart = useMemo(() => {
        const targets = axisConfig?.target ?? [];

        return filteredChartData.map((item) => {
            let row: Record<string, any>;

            if (simpleColumnDynamicKeyForSecondary !== "null") {
                row = {
                    month: item.month,
                    [simpleColumnDynamicKey]: getMetricValue(
                        item,
                        simpleColumnDynamicKey
                    ),
                    [simpleColumnDynamicKeyForSecondary]: getMetricValue(
                        item,
                        simpleColumnDynamicKeyForSecondary
                    ),
                    tooltipTitle: item.month,
                    "forecast": item.isForecast
                };
            } else {
                row = {
                    month: item.month,
                    [simpleColumnDynamicKey]: getMetricValue(
                        item,
                        simpleColumnDynamicKey
                    ),
                    tooltipTitle: item.month,
                    "forecast": item.isForecast
                };
            }

            targets.forEach(target => {
                const value = getTargetValueByLabel(
                    item,
                    target.label
                );

                if (target.type === "Tolerance") {
                    row[`${target.label} Upper`] = value + 3;
                    row[`${target.label} Lower`] = value - 3;
                } else {
                    row[target.label] = value;
                }
            });

            return row;
        });
    }, [
        filteredChartData,
        axisConfig?.target,
        simpleColumnDynamicKey,
        simpleColumnDynamicKeyForSecondary,
        getMetricValue,
        getTargetValueByLabel
    ]);
    const simpleLineChart = useMemo(() => {
        const targets = axisConfig?.target ?? [];

        return filteredChartData.map((item) => {
            const row: Record<string, any> = {
                ...item,

                [simpleColumnDynamicKey]: getMetricValue(
                    item,
                    simpleColumnDynamicKey
                ),
                "forecast": item.isForecast,
                isTargetDashed: item.isForecast,
            };

            targets.forEach(target => {
                const value = getTargetValueByLabel(
                    item,
                    target.label
                );

                if (target.type === "Tolerance") {
                    row[`${target.label} Upper`] = value + 3;
                    row[`${target.label} Lower`] = value - 3;
                } else {
                    row[target.label] = value;
                }
            });

            return row;
        });
    }, [
        filteredChartData,
        axisConfig?.target,
        simpleColumnDynamicKey,
        getMetricValue,
        getTargetValueByLabel
    ]);

    const groupedColumnChartData = useMemo(() => {
        const targets = axisConfig?.target ?? [];

        return filteredChartData.map(item => {
            const bars: Record<string, number> = {};

            GroupedColumnChartDynamicKey.forEach(key => {
                if (key) {
                    bars[key] = getMetricValue(item, key);
                }
            });

            const row: Record<string, any> = {
                month: item.month,
                ...bars,
                "forecast": item.isForecast,
                Projection: getMetricValue(
                    item,
                    GroupedColumnChartDynamicKey[0] ??
                    simpleColumnDynamicKey
                ),

                tooltipTitle: item.month,
            };

            targets.forEach(target => {
                const value = getTargetValueByLabel(
                    item,
                    target.label
                );

                if (target.type === "Tolerance") {
                    row[`${target.label} Upper`] = value + 3;
                    row[`${target.label} Lower`] = value - 3;
                } else {
                    row[target.label] = value;
                }
            });

            return row;
        });
    }, [
        filteredChartData,
        axisConfig?.target,
        GroupedColumnChartDynamicKey,
        simpleColumnDynamicKey,
        getMetricValue,
        getTargetValueByLabel,
    ]);

    const lineStackedChartData = useMemo(() => {
        const targets = axisConfig?.target ?? [];

        return filteredChartData.map((item) => {
            const lines: Record<string, number> = {};

            GroupedColumnChartDynamicKey.forEach((key) => {
                if (key) {
                    lines[key] = getMetricValue(item, key);
                }
            });

            const row: Record<string, any> = {
                month: item.month,
                "forecast": item.isForecast,
                isTargetDashed: item.isForecast,
                ...lines,
            };

            targets.forEach(target => {
                const value = getTargetValueByLabel(
                    item,
                    target.label
                );

                if (target.type === "Tolerance") {
                    row[`${target.label} Upper`] = value + 3;
                    row[`${target.label} Lower`] = value - 3;
                } else {
                    row[target.label] = value;
                }
            });

            return row;
        });
    }, [
        filteredChartData,
        axisConfig?.target,
        GroupedColumnChartDynamicKey,
        getMetricValue,
        getTargetValueByLabel,
    ]);


    const stackedAreaChartData = useMemo(() => {
        const targets = axisConfig?.target ?? [];

        return filteredChartData.map((item) => {
            const areas: Record<string, number> = {};

            GroupedColumnChartDynamicKey.forEach((key) => {
                if (key) {
                    areas[key] = getMetricValue(item, key);
                }
            });

            const row: Record<string, any> = {
                month: item.month,
                "forecast": item.isForecast,
                isTargetDashed: item.isForecast,
                ...areas,
            };

            targets.forEach(target => {
                const value = getTargetValueByLabel(
                    item,
                    target.label
                );

                if (target.type === "Tolerance") {
                    row[`${target.label} Upper`] = value + 3;
                    row[`${target.label} Lower`] = value - 3;
                } else {
                    row[target.label] = value;
                }
            });

            return row;
        });
    }, [
        filteredChartData,
        axisConfig?.target,
        GroupedColumnChartDynamicKey,
        getMetricValue,
        getTargetValueByLabel,
    ]);

    // ---- Status Chips computed from visibility (unless consumer overrides via props) ----
    const defaultStatusChips: StatusChip[] = useMemo(() => {
        const conf = props.toDateConfig || {
            mtd: true,
            qtd: false,
            ytd: true,
            comparisons: [],
            compareWith: 'Previous',
        };

        const getQuarter = (month: string) => {
            const map: any = {
                Q1: ['Jan', 'Feb', 'Mar'],
                Q2: ['Apr', 'May', 'Jun'],
                Q3: ['Jul', 'Aug', 'Sep'],
                Q4: ['Oct', 'Nov', 'Dec'],
            };
            return Object.keys(map).find(q => map[q].includes(month));
        };

        const calculateAvg = (data: any[]) => {
            if (!data.length) return { planned: 0, target: 0 };

            const planned =
                data.reduce((sum, d) => sum + Number(d.Planned), 0) / data.length;

            const target =
                data.reduce((sum, d) => sum + Number(d.Target), 0) / data.length;

            return { planned, target };
        };

        const latestMonth = DATA_WITH_OPTIONAL_PROJECTIONS[DATA_WITH_OPTIONAL_PROJECTIONS.length - 1];
        const currentQuarter = latestMonth ? getQuarter(latestMonth.month) : null;

        const mtdSet = latestMonth ? [latestMonth] : [];

        const qtdSet = DATA_WITH_OPTIONAL_PROJECTIONS.filter(
            d => getQuarter(d.month) === currentQuarter
        );

        const ytdSet = DATA_WITH_OPTIONAL_PROJECTIONS;

        const buildData = (
            id: StatusChipKind,
            dataset: any[],
            tone: StatusChipTone
        ) => {
            const avg = calculateAvg(dataset);

            const adjustedTarget = avg.target * 1.3;

            const change =
                adjustedTarget === 0
                    ? 0
                    : ((avg.planned - adjustedTarget) / adjustedTarget) * 100;

            return {
                id,
                actual: avg.planned.toFixed(1),
                target: adjustedTarget.toFixed(1),
                changeText: `${change.toFixed(1)}%`,
                isPositive: avg.planned >= adjustedTarget,
                tone,
            };
        };

        const mockData = [
            buildData('MTD', mtdSet, 'success'),
            buildData('QTD', qtdSet, 'danger'),
            buildData('YTD', ytdSet, 'warning'),
        ];

        // 2. RENDER COMPARISON HELPER
        const renderComparison = (
            id: 'MTD' | 'QTD' | 'YTD',
            valueStr: string,
            isPositive: boolean,
        ) => {
            if (!conf.comparisons.includes(id) || conf.compareWith !== 'Previous') return null;
            const suffix = id === 'MTD' ? 'PM' : id === 'QTD' ? 'PQ' : 'PY';

            const arrowSvg = isPositive ? (
                <Icon name="double-chevron-up-green" size={'xm'} color="primary-green-color" />
            ) : (
                <Icon name="double-chevron-down-red" size={'xm'} color="status-error-color" />
            );

            return (
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{ color: chartColor.toDateValue.color1, margin: '0 3px' }}>•</span>
                    {arrowSvg}
                    <span style={{ color: chartColor.toDateValue.color2, fontSize: '13px', fontWeight: 500 }}>
                        {valueStr} vs {suffix}
                    </span>
                </span>
            );
        };

        // 3. MAP DATA TO UI: Dynamically build the array based on the API data
        return mockData.map(data => {
            // Convert 'MTD' to 'mtd' to safely check the config object
            const configKey = data.id.toLowerCase() as 'mtd' | 'qtd' | 'ytd';

            return {
                id: data.id,
                value: (
                    <span
                        style={{
                            display: 'inline-block',
                            color: chartColor.toDateValue.color3,
                            fontWeight: 'bold',
                            fontSize: '15px',
                            marginRight: '-4px',
                        }}
                    >
                        {data.actual}
                    </span>
                ) as any,
                target: (
                    <span
                        style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '-2px' }}
                    >
                        {data.target}
                        {renderComparison(data.id, data.changeText, data.isPositive)}
                    </span>
                ) as any,
                tone: data.tone,
                visible: conf[configKey],
                tooltip: `${data.id} performance`,
            };
        });
    }, [props.toDateConfig]);

    const statusChips = dsStatusChips ?? defaultStatusChips;

    const showStatusChips = dsShowStatusChips ?? true;

    // ---- Handlers ----
    const handleUomChange = (next: string) => {
        setSelectedUom(next);
        onUomChanged?.(next);
        dsOnUomChange?.(next);
    };

    // ---- Inline toggles (mirror original switches) by clicking the chip badges:
    // For now we keep visibility controlled by internal state; consumers can pass their own statusChips to override fully.

    // ---- Title compute (we prefer explicit titleLabel) ----
    const computedTitle = titleLabel ?? title ?? 'KPI Name';


    const capitalize = (str?: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : undefined;
    // Use renderIcon prop if provided, otherwise use customIcon
    // const iconRenderer = renderIcon || customIcon;

    const isAxisEmpty = axisConfig && axisConfig.yAxis.length === 0;

    const axisDrivenTargetOptions = useMemo<Option[]>(() => {
        const items = axisConfig?.target ?? [];
        return items.map(t => ({
            label: t.display || t.label,
            value: t.label,
        }));
    }, [axisConfig?.target]);

    const resolvedTargetOptions = useMemo(() => {
        return (targetDropdownOptions && targetDropdownOptions.length ? targetDropdownOptions : axisDrivenTargetOptions) as Option[];
    }, [targetOptions, axisDrivenTargetOptions]);
    const resolvedSelectedTargets =
        Array.isArray(selectedTargets) ? selectedTargets : targetDropdownOptions.slice();

    const handleTargetsChangeResolved = useCallback(
        (vals: string[]) => {
            const arr = Array.isArray(vals) ? vals : [];

            onTargetsChange?.(arr);
        },
        [onTargetsChange],
    );

    const effectiveShowXAxisSelection =
        userSelections?.xAxisDropdown !== undefined
            ? Boolean(userSelections.xAxisDropdown)
            : showXAxisSelection;

    useEffect(() => {
        const isDropdownDisabledOrMissing =
            userSelections?.xAxisDropdown === undefined ||
            userSelections?.xAxisDropdown === false;

        if (isDropdownDisabledOrMissing) {
            setDropdownOpenXaxis(false);
        }
    }, [userSelections?.xAxisDropdown]);

    const effectiveShowTargetDropdown =
        userSelections?.targetLineDropdown !== undefined
            ? Boolean(userSelections.targetLineDropdown) && resolvedTargetOptions.length > 0
            : showTargetDropdown;
    // ===== Derived visibility for Group By / Stack By based on chart type =====
    const GROUPED_CHART_TYPES = new Set(['demo']); //now its off previous column-3 Add grouped charts here in the future
    const STACKED_CHART_TYPES = new Set(['demo']);//now its off previous column-2

    const derivedShowGroupByDropdown = GROUPED_CHART_TYPES.has(selectedChartType);
    const derivedShowStackByDropdown = STACKED_CHART_TYPES.has(selectedChartType);

    const axisDrivenDimensionOptions: Option[] = useMemo(() => {
        const items = axisConfig?.xAxis ?? [];
        return items.map(x => ({ label: x.display || x.label, value: x.label }));
    }, [axisConfig?.xAxis]);

    const resolvedGroupByOptions = (groupByOptions && groupByOptions.length ? groupByOptions : axisDrivenDimensionOptions) as Option[];
    const resolvedStackByOptions = (stackByOptions && stackByOptions.length ? stackByOptions : axisDrivenDimensionOptions) as Option[];

    const effectiveShowProjectionButton =
        userSelections?.projectionButton !== undefined
            ? Boolean(userSelections.projectionButton)
            : Boolean(showProjectionButton);

    const projectionConfig = {
        limitFillOpacity: 0.28,
        lowerLimitDataKey: "lowerLimit",
        upperLimitDataKey: "upperLimit",
        strokeColor: chartColor.projectionConfig,
        strokeDasharray: "4 4"
    };
    const effectiveDrilldown = useMemo<DrilldownConfig>(
        () => ({
            enabled: Boolean(userSelections?.xAxisDrilldown),
            canDrillUp: groupedXaxisIndex > 0,
            canDrillDown:
                groupedXaxisIndex < (groupedXaxisData?.length ?? 0) - 1,
            onDrillUp: () =>
                setGroupedXaxisIndex(prev => Math.max(prev - 1, 0)),
            onDrillDown: () =>
                setGroupedXaxisIndex(prev =>
                    Math.min(prev + 1, (groupedXaxisData?.length ?? 0) - 1)
                ),
            levelLabel: selectedChartType?.includes("bar")
                ? "Y-axis"
                : "X-axis",
        }),
        [
            userSelections?.xAxisDrilldown,
            groupedXaxisIndex,
            groupedXaxisData?.length,
            selectedChartType,
        ]
    );

    // const mergedHeaderInfoRenderer = useMemo(() => headerInfoRenderer, [headerInfoRenderer]);
    const finalXAxisLabel = useMemo(() => {
        if (
            !xAxisLabel ||
            xAxisLabel === "undefined" ||
            xAxisLabel.includes(",")
        ) {
            return capitalize(String(xAxisLabelOptional));
        }

        return xAxisLabel;
    }, [xAxisLabel, xAxisLabelOptional]);

    const renderCustomizeChart = () => {
        if (children) {
            return children;
        } else if (selectedChartType === 'line') {
            return (
                <MultiLineChartWithTargetMarkers
                    chartVariant="lineWithProjection"
                    isAnimationRequired={true}
                    leftSpace={0}
                    forecast={projectionEnabled && projectionButtonChartHeader}
                    forecastFlagKey="forecast"
                    projection={projectionConfig}
                    charts={[
                        {
                            chartVariant: "lineWithProjection",

                            data: simpleLineChart,
                            height: 350,

                            forecast: projectionEnabled && projectionButtonChartHeader,
                            forecastFlagKey: "forecast",
                            projection: projectionConfig,

                            areaFillOpacity: 0.12,
                            areaShowDots: true,
                            areaStrokeWidth: 2,

                            seriesLines: [
                                {
                                    dataKey: simpleColumnDynamicKey,
                                    name: simpleColumnDynamicKey,
                                    strokeColor: chartColor.seriesColor.lineChart
                                }
                            ],

                            setXaxis:setXaxis,
                            showValueLabelsOnPoints: true,
                            showCartesianGrid: false,
                            showYAxis,

                            tooltipLabels: {
                                simpleColumnDynamicKey,

                                ...Object.fromEntries(
                                    (axisConfig?.target ?? [])
                                        .filter(
                                            item =>
                                                item.type === "Target" &&
                                                item.eyeOpen
                                        )
                                        .map(item => [
                                            item.label,
                                            item.display ?? item.label
                                        ])
                                )
                            },

                            unit: unit !== "undefined" ? unit : "",
                            yAxisIntervals: 25,
                            yAxisMax: 100,
                            yAxisMin: 0,

                            targetLines:
                                axisConfig?.target
                                    ?.filter(
                                        item =>
                                            item.type === "Target" &&
                                            item.eyeOpen
                                    )
                                    ?.map((item, index) => ({
                                        dataKey: item.label,
                                        name: item.display ?? item.label,
                                        strokeColor:
                                            targetColors[index] ?? chartColor.targetColors.color1,

                                    })) ?? [],

                            toleranceBands:
                                axisConfig?.target
                                    ?.filter(
                                        item =>
                                            item.type === "Tolerance" &&
                                            item.eyeOpen
                                    )
                                    ?.map(item => ({
                                        upperDataKey: `${item.label} Upper`,
                                        lowerDataKey: `${item.label} Lower`,
                                        fillColor: chartColor.toleranceBands.color1,
                                        fillOpacity: 0.45,
                                        showCenterLine: false
                                    })) ?? [],

                            secondaryYAxisDataKeys:
                                axisConfig?.secondaryYAxis?.map(
                                    item => item.display ?? item.label
                                ) ?? []
                        }
                    ]}
                    legendAlign="left"
                    legendsLabels={[
                        {
                            color: chartColor.legendsLabels.color1,
                            type: "square",
                            value: simpleColumnDynamicKey
                        },

                        ...(axisConfig?.target
                            ?.filter(
                                item =>
                                    item.type === "Target" &&
                                    item.eyeOpen
                            )
                            ?.map((item, index) => ({
                                color: targetColors[index] ?? chartColor.legendsLabelsTargetDefault,
                                type: "line",
                                value: item.display ?? item.label
                            })) ?? []),


                    ]}
                    showYAxis={showYAxis}
                    xAxisAngle={xAxisAngle}
                    showValueLabel={showTotalLabel}
                    showTotalLabel={showTotalLabel}
                    showVerticalGridLines={showVerticalGridLines}
                    showHorizontalGridLines={showHorizontalGridLines}
                    showLegend={showLegend}
                    decimalPlaces={decimalPlaces}
                    xAxisLabel={finalXAxisLabel}
                    yAxisLabel={simpleColumnDynamicKey}
                    showYAxisLabels={showYAxisLabels}
                    showXAxisLabels={showXAxisLabels}
                    enableSecondaryYAxis={
                        (axisConfig?.secondaryYAxis?.length ?? 0) > 0
                    }
                />

            );
        } else if (selectedChartType === 'stacked-line') {
            return (
                <MultiLineChartWithTargetMarkers
                    isAnimationRequired={true}
                    chartVariant="lineWithProjection"
                    forecast={projectionEnabled && projectionButtonChartHeader}
                    forecastFlagKey="forecast"
                    projection={projectionConfig}
                    charts={[
                        {
                            data: lineStackedChartData,
                            chartVariant: "lineWithProjection",
                            height: 350,

                            seriesLines: [
                                {
                                    dataKey: GroupedColumnChartDynamicKey[0] ?? "",
                                    name: GroupedColumnChartDynamicKey[0] ?? "",
                                    strokeColor: chartColor.seriesColor.stackedLine1
                                },
                                {
                                    dataKey: GroupedColumnChartDynamicKey[1] ?? "",
                                    name: GroupedColumnChartDynamicKey[1] ?? "",
                                    strokeColor: chartColor.seriesColor.stackedLine2
                                },
                                {
                                    dataKey: GroupedColumnChartDynamicKey[2] ?? "",
                                    name: GroupedColumnChartDynamicKey[2] ?? "",
                                    strokeColor: chartColor.seriesColor.stackedLine3
                                },

                            ],

                            setXaxis: 'month',
                            showValueLabelsOnPoints: true,
                            tooltipLabels: {
                                brandA: GroupedColumnChartDynamicKey[0] ?? "",
                                brandB: GroupedColumnChartDynamicKey[1] ?? "",
                                brandC: GroupedColumnChartDynamicKey[2] ?? "",

                                ...Object.fromEntries(
                                    (axisConfig?.target ?? [])
                                        .filter(item => item.type === "Target" && item.eyeOpen)
                                        .map((item, index) => [
                                            `target${index + 1}`,
                                            item.display ?? item.label
                                        ])
                                )
                            },

                            unit: unit !== "undefined" ? unit : '',
                            yAxisIntervals: 25,
                            yAxisMax: 100,
                            yAxisMin: 0,
                            targetLines: axisConfig?.target
                                ?.filter(item => item.type === "Target")
                                ?.map((item, index) => ({
                                    dataKey: item.label,
                                    name: item.display ?? item.label,
                                    strokeColor: targetColors[index] ?? chartColor.targetColors.color1,
                                    strokeDasharray: "4 4"
                                })) ?? [],
                            toleranceBands: axisConfig?.target
                                ?.filter(item => item.type === "Tolerance" && item.eyeOpen)
                                ?.map(item => ({
                                    upperDataKey: `${item.label} Upper`,
                                    lowerDataKey: `${item.label} Lower`,
                                    fillColor: chartColor.toleranceBands.color1,
                                    fillOpacity: 0.45,
                                    showCenterLine: false
                                })) ?? [],
                            secondaryYAxisDataKeys: axisConfig?.secondaryYAxis?.map(
                                e => e.display ?? e.label
                            ) ?? [],

                        }
                    ]}
                    enableSecondaryYAxis={axisConfig?.secondaryYAxis.length ? true : false}

                    legendsLabels={[
                        ...(GroupedColumnChartDynamicKey[0]
                            ? [{
                                color: chartColor.legendsLabels.color2,
                                type: 'square',
                                value: GroupedColumnChartDynamicKey[0],
                            }]
                            : []),

                        ...(GroupedColumnChartDynamicKey[1]
                            ? [{
                                color: chartColor.legendsLabels.color3,
                                type: 'square',
                                value: GroupedColumnChartDynamicKey[1],
                            }]
                            : []),

                        ...(GroupedColumnChartDynamicKey[2]
                            ? [{
                                color: chartColor.legendsLabels.color4,
                                type: 'square',
                                value: GroupedColumnChartDynamicKey[2],
                            }]
                            : []),

                        ...(axisConfig?.target
                            ?.filter(item => item.type === 'Target' && item.eyeOpen)
                            ?.map((item, index) => ({
                                color: targetColors[index] ?? chartColor.legendsLabelsTargetDefault,
                                type: 'dashed',
                                value: item.display ?? item.label,
                            })) ?? [])
                    ]}

                    showYAxis={showYAxis}
                    xAxisAngle={xAxisAngle}
                    showValueLabel={showTotalLabel}
                    showTotalLabel={showTotalLabel}
                    showVerticalGridLines={showVerticalGridLines}
                    showHorizontalGridLines={showHorizontalGridLines}
                    showLegend={showLegend}
                    decimalPlaces={decimalPlaces}
                    xAxisLabel={finalXAxisLabel}
                    space={-10}
                    yAxisLabel={GroupedColumnChartDynamicKey.join(" / ")}
                    showYAxisLabels={showYAxisLabels}
                    showXAxisLabels={showXAxisLabels}
                    legendSpace={20}
                />

            );
        } else if (selectedChartType === 'bar') {
            return (
                <HorizontalColumnChart
                    data={horizontalBarData}
                    dataKey={simpleColumnDynamicKey}

                    dataKey2={
                        simpleColumnDynamicKeyForSecondary !== "null"
                            ? simpleColumnDynamicKeyForSecondary
                            : undefined
                    }

                    barFillColor={chartColor.barFill.color1}

                    legendItemFillColor={chartColor.barFill.color1}

                    legendLabelColor={chartColor.legendLabelDefaultColor}
                    yAxisLabelColor={chartColor.legendLabelDefaultColor}
                    barSize={24}
                    barRadius={6}
                    yAxisIntervals={10}
                    cartesianGridColor={chartColor.cartesianGridColor}
                    isAnimationRequired={true}
                    animationDuration={800}
                    forecast={true}
                    //style


                    unit={unit !== "undefined" ? unit : ''}

                    showLegend={showLegend}
                    showYAxis={showYAxis}
                    xAxisAngle={xAxisAngle}
                    showValueLabel={showValueLabel}
                    showTotalLabel={true}
                    showBarTopDots
                    showVerticalGridLines={showVerticalGridLines}
                    showHorizontalGridLines={showHorizontalGridLines}
                    decimalPlaces={decimalPlaces}
                    xAxisLabel={finalXAxisLabel}
                    yAxisLabel={simpleColumnDynamicKey}
                    showYAxisLabels={showYAxisLabels}
                    showXAxisLabels={showXAxisLabels}
                    legendsLabels={[

                        {
                            "color": chartColor.legendsLabels.color1,
                            "value": simpleColumnDynamicKey,
                            "type": "square"
                        },
                        ...(axisConfig?.target
                            ?.filter(item => item.type === "Target" && item.eyeOpen)
                            ?.map((item, index) => ({
                                color: targetColors[index] ?? chartColor.targetColors.color1,
                                value: item.display ?? item.label,
                                type: index === 0 ? "line" : "dashed"
                            })) ?? [])
                    ]}
                    enableSecondaryXAxis={axisConfig?.secondaryYAxis.length ? true : false}
                    secondaryXAxisDataKeys={
                        axisConfig?.secondaryYAxis?.map(
                            e => e.display ?? e.label
                        ) ?? []
                    }

                    secondaryXAxisIntervals={10}
                    toleranceBands={
                        axisConfig?.target
                            ?.filter(item => item.type === "Tolerance" && item.eyeOpen)
                            ?.map(item => ({
                                upperDataKey: `${item.label} Upper`,
                                lowerDataKey: `${item.label} Lower`,
                                fillColor: chartColor.toleranceBands.color1,
                                fillOpacity: 0.45,
                                showCenterLine: false
                            })) ?? []
                    }
                    targetLines={
                        axisConfig?.target
                            ?.filter(item => item.type === "Target")
                            ?.map((item, index) => ({
                                dataKey: item.label,
                                name: item.display ?? item.label,
                                strokeColor: targetColors[index] ?? chartColor.targetColors.color1,
                                strokeDasharray: "4 4"
                            })) ?? []
                    }
                    stripedPatternColor={chartColor.stripedPatternColor}
                    stripedPatternBackgroundColor={chartColor.stripedPatternBackgroundColor}


                    projectionLimitMarkerColor={chartColor.projectionLimitMarkerColor}
                    projectionLimitMarkerWidth={18}
                    projectionLimitMarkerStrokeWidth={3}
                    projectionLimitMarkerBackgroundColor={chartColor.projectionLimitMarkerColor}
                    projectionLimitMarkerBackgroundOpacity={0.18}
                    forecastFlagKey={projectionEnabled && projectionButtonChartHeader ? "isForecast" : ''}

                    showProjectedTargetLine={true}
                    projectedTargetLineStrokeDasharray={"4 4"}
                />
            );
        }
        else if (selectedChartType === 'stacked-bar') {
            return (
                <HorizontalColumnChart
                    data={horizontalGrouppedBarData}
                    dataKey={GroupedColumnChartDynamicKey[0] ?? ""}
                    dataKey2={GroupedColumnChartDynamicKey[1] ?? ""}
                    dataKey3={GroupedColumnChartDynamicKey[2] ?? ""}
                    dataKey4={
                        simpleColumnDynamicKeyForSecondary !== "null"
                            ? simpleColumnDynamicKeyForSecondary
                            : undefined
                    }
                    xAxisSecondaryLabel={simpleColumnDynamicKeyForSecondary !== "null"
                        ? simpleColumnDynamicKeyForSecondary
                        : undefined}
                    secondaryXAxisIntervals={10}
                    isStacked={true}
                    barFillColor={chartColor.barFill.stackedBar}
                    barFillColor2={chartColor.barFill.stackedBar2}
                    barFillColor3={chartColor.barFill.stackedBar3}
                    legendItemFillColor={chartColor.legendsLabels.color5}
                    legendItemFillColor2={projectionEnabled ? chartColor.legendsLabels.color4 : undefined}
                    legendLabelColor={chartColor.legendLabelDefaultColor}
                    yAxisLabelColor={chartColor.legendLabelDefaultColor}
                    barSize={24}
                    barRadius={6}
                    yAxisIntervals={10}
                    cartesianGridColor={chartColor.cartesianGridColor}
                    isAnimationRequired={true}
                    animationDuration={800}
                    //style



                    unit={unit !== "undefined" ? unit : ''}

                    showLegend={showLegend}
                    showYAxis={showYAxis}
                    xAxisAngle={xAxisAngle}
                    showValueLabel={showValueLabel}
                    showTotalLabel={true}
                    showBarTopDots
                    showVerticalGridLines={showVerticalGridLines}
                    showHorizontalGridLines={showHorizontalGridLines}
                    decimalPlaces={decimalPlaces}
                    xAxisLabel={finalXAxisLabel}
                    yAxisLabel={simpleColumnDynamicKey}
                    showYAxisLabels={showYAxisLabels}
                    showXAxisLabels={showXAxisLabels}
                    legendsLabels={[
                        ...GroupedColumnChartDynamicKey
                            .filter(Boolean)
                            .map((key, index) => ({
                                color:
                                    [chartColor.legendsLabels.color5, chartColor.legendsLabels.color6, chartColor.legendsLabels.color7][index] ??
                                    chartColor.legendsLabels.color8,
                                value: key,
                                type: "square"
                            })),

                        ...(axisConfig?.target
                            ?.filter(item => item.type === "Target" && item.eyeOpen)
                            ?.map((item, index) => ({
                                color: targetColors[index] ?? chartColor.targetColors.color1,
                                value: item.display ?? item.label,
                                type: index === 0 ? "line" : "dashed"
                            })) ?? [])
                    ]}
                    enableSecondaryXAxis={axisConfig?.secondaryYAxis.length ? true : false}
                    secondaryXAxisDataKeys={
                        axisConfig?.secondaryYAxis?.map(
                            e => e.display ?? e.label
                        ) ?? []
                    }

                    toleranceBands={
                        axisConfig?.target
                            ?.filter(item => item.type === "Tolerance" && item.eyeOpen)
                            ?.map(item => ({
                                upperDataKey: `${item.label} Upper`,
                                lowerDataKey: `${item.label} Lower`,
                                fillColor: chartColor.toleranceBands.color1,
                                fillOpacity: 0.45,
                                showCenterLine: false
                            })) ?? []
                    }
                    targetLines={
                        axisConfig?.target
                            ?.filter(item => item.type === "Target")
                            ?.map((item, index) => ({
                                dataKey: item.label,
                                name: item.display ?? item.label,
                                strokeColor: targetColors[index] ?? chartColor.targetColors.color1,
                                strokeDasharray: "4 4"
                            })) ?? []
                    }
                    stripedPatternColor={chartColor.stripedPatternColor}
                    stripedPatternBackgroundColor={chartColor.stripedPatternBackgroundColor}


                    projectionLimitMarkerColor={chartColor.projectionLimitMarkerColor}
                    projectionLimitMarkerWidth={18}
                    projectionLimitMarkerStrokeWidth={3}
                    projectionLimitMarkerBackgroundColor={chartColor.projectionLimitMarkerBackgroundColor1}
                    projectionLimitMarkerBackgroundOpacity={0.18}

                    forecastFlagKey={projectionEnabled && projectionButtonChartHeader ? "isForecast" : ''}

                    showProjectedTargetLine={true}
                    projectedTargetLineStrokeDasharray={"4 4"}
                />
            );
        }
        else if (selectedChartType === 'grouped-bar') {
            return (
                <HorizontalColumnChart
                    data={horizontalGrouppedBarData}
                    dataKey={GroupedColumnChartDynamicKey[0] ?? ""}
                    dataKey2={GroupedColumnChartDynamicKey[1] ?? ""}
                    dataKey3={GroupedColumnChartDynamicKey[2] ?? ""}
                    dataKey4={simpleColumnDynamicKeyForSecondary !== "null"
                        ? simpleColumnDynamicKeyForSecondary
                        : undefined}
                    barFillColor={chartColor.barFill.groupBar1}
                    barFillColor2={chartColor.barFill.groupBar2}
                    barFillColor3={chartColor.barFill.groupBar3}
                    legendItemFillColor={chartColor.legendsLabels.color8}
                    legendItemFillColor2={projectionEnabled ? chartColor.legendItemFillColor2 : undefined}
                    legendLabelColor={chartColor.legendLabelDefaultColor}
                    yAxisLabelColor={chartColor.legendLabelDefaultColor}
                    barSize={24}
                    barRadius={6}
                    yAxisIntervals={10}
                    cartesianGridColor={chartColor.cartesianGridColor}
                    isAnimationRequired={true}
                    animationDuration={800}

                    //style



                    unit={unit !== "undefined" ? unit : ''}

                    showLegend={showLegend}
                    showYAxis={showYAxis}
                    xAxisAngle={xAxisAngle}
                    showValueLabel={showValueLabel}
                    showTotalLabel={true}
                    showBarTopDots
                    showVerticalGridLines={showVerticalGridLines}
                    showHorizontalGridLines={showHorizontalGridLines}
                    decimalPlaces={decimalPlaces}
                    xAxisLabel={finalXAxisLabel}
                    yAxisLabel={simpleColumnDynamicKey}
                    showYAxisLabels={showYAxisLabels}
                    showXAxisLabels={showXAxisLabels}
                    legendsLabels={[

                        ...GroupedColumnChartDynamicKey
                            .filter(Boolean)
                            .map((key, index) => ({
                                color:
                                    [chartColor.legendsLabels.color5, chartColor.legendsLabels.color8, chartColor.legendsLabels.color7][index] ??
                                    chartColor.legendsLabels.color8,
                                value: key,
                                type: "square"
                            })),

                        ...(axisConfig?.target
                            ?.filter(item => item.type === "Target" && item.eyeOpen)
                            ?.map((item, index) => ({
                                color: targetColors[index] ?? chartColor.targetColors.color1,
                                value: item.display ?? item.label,
                                type: index === 0 ? "line" : "dashed"
                            })) ?? [])
                    ]}

                    enableSecondaryXAxis={axisConfig?.secondaryYAxis.length ? true : false}
                    secondaryXAxisDataKeys={
                        axisConfig?.secondaryYAxis?.map(
                            e => e.display ?? e.label
                        ) ?? []
                    }
                    secondaryXAxisIntervals={10}
                    toleranceBands={
                        axisConfig?.target
                            ?.filter(item => item.type === "Tolerance" && item.eyeOpen)
                            ?.map(item => ({
                                upperDataKey: `${item.label} Upper`,
                                lowerDataKey: `${item.label} Lower`,
                                fillColor: chartColor.toleranceBands.color1,
                                fillOpacity: 0.45,
                                showCenterLine: false
                            })) ?? []
                    }
                    targetLines={
                        axisConfig?.target
                            ?.filter(item => item.type === "Target")
                            ?.map((item, index) => ({
                                dataKey: item.label,
                                name: item.display ?? item.label,
                                strokeColor: targetColors[index] ?? chartColor.targetColors.color1,
                                strokeDasharray: "4 4"
                            })) ?? []
                    }
                    stripedPatternColor={chartColor.stripedPatternColor}
                    stripedPatternColor2={chartColor.stripedPatternColor2}
                    stripedPatternColor3={chartColor.stripedPatternColor3}
                    stripedPatternBackgroundColor={chartColor.stripedPatternBackgroundColor}


                    projectionLimitMarkerColor={chartColor.projectionLimitMarkerBackgroundColor1}
                    projectionLimitMarkerWidth={18}
                    projectionLimitMarkerStrokeWidth={3}
                    projectionLimitMarkerBackgroundColor={chartColor.projectionLimitMarkerBackgroundColor1}
                    projectionLimitMarkerBackgroundOpacity={0.18}

                    forecastFlagKey={projectionEnabled && projectionButtonChartHeader ? "isForecast" : ''}

                    showProjectedTargetLine={true}
                    projectedTargetLineStrokeDasharray={"4 4"}

                />
            );
        }

        else if (selectedChartType === 'area') {

            return (

                <MultiLineChartWithTargetMarkers
                    chartVariant="areaWithProjection"
                    forecast={projectionEnabled && projectionButtonChartHeader}
                    forecastFlagKey="forecast"
                    projection={projectionConfig}
                    charts={[
                        {
                            chartVariant: "areaWithProjection",
                            data: areaChartData,

                            forecast: projectionEnabled && projectionButtonChartHeader,
                            forecastFlagKey: "forecast",
                            projection: projectionConfig,

                            areaFillOpacity: 0.12,
                            areaShowTopStroke: true,
                            areaStrokeWidth: 1.5,

                            seriesLines: [
                                {
                                    dataKey: simpleColumnDynamicKey,
                                    name: simpleColumnDynamicKey,
                                    strokeColor: chartColor.seriesColor.area
                                }
                            ],

                            setXaxis:setXaxis,
                            showCartesianGrid: false,
                            showYAxis: true,

                            tooltipLabels: {
                                simpleColumnDynamicKey,

                                ...Object.fromEntries(
                                    (axisConfig?.target ?? [])
                                        .filter(
                                            item =>
                                                item.type === "Target" &&
                                                item.eyeOpen
                                        )
                                        .map((item, index) => [
                                            `target${index + 1}`,
                                            item.display ?? item.label
                                        ])
                                )
                            },

                            unit: unit !== "undefined" ? unit : "",
                            yAxisIntervals: 10,
                            yAxisMax: 60,
                            yAxisMin: 0,

                            targetLines:
                                axisConfig?.target
                                    ?.filter(item => item.type === "Target")
                                    ?.map((item, index) => ({
                                        dataKey: item.label,
                                        name: item.display ?? item.label,
                                        strokeColor:
                                            targetColors[index] ?? chartColor.targetColors.color1,
                                        strokeDasharray: "4 4"
                                    })) ?? [],

                            toleranceBands:
                                axisConfig?.target
                                    ?.filter(
                                        item =>
                                            item.type === "Tolerance" &&
                                            item.eyeOpen
                                    )
                                    ?.map(item => ({
                                        upperDataKey: `${item.label} Upper`,
                                        lowerDataKey: `${item.label} Lower`,
                                        fillColor: chartColor.toleranceBands.color1,
                                        fillOpacity: 0.45,
                                        showCenterLine: false
                                    })) ?? [],

                            secondaryYAxisDataKeys:
                                axisConfig?.secondaryYAxis?.map(
                                    item => item.display ?? item.label
                                ) ?? []
                        }
                    ]}
                    legendAlign="left"
                    legendsLabels={[
                        {
                            color: chartColor.legendsLabels.color1,
                            type: "square",
                            value: simpleColumnDynamicKey
                        },

                        ...(axisConfig?.target
                            ?.filter(
                                item =>
                                    item.type === "Target" &&
                                    item.eyeOpen
                            )
                            ?.map((item, index) => ({
                                color: targetColors[index] ?? chartColor.targetColors.color1,
                                type: "dashed",
                                value: item.display ?? item.label
                            })) ?? [])
                    ]}
                    showLegend={showLegend}
                    showYAxis={showYAxis}
                    xAxisAngle={xAxisAngle}
                    showValueLabel={showTotalLabel}
                    showTotalLabel={showTotalLabel}
                    showVerticalGridLines={showVerticalGridLines}
                    showHorizontalGridLines={showHorizontalGridLines}
                    decimalPlaces={decimalPlaces}
                    xAxisLabel={finalXAxisLabel}
                    yAxisLabel={simpleColumnDynamicKey}
                    showYAxisLabels={showYAxisLabels}
                    showXAxisLabels={showXAxisLabels}
                    enableSecondaryYAxis={
                        (axisConfig?.secondaryYAxis?.length ?? 0) > 0
                    }

                />
            );
        } else if (selectedChartType === 'stacked-area') {
            return (
                <MultiLineChartWithTargetMarkers
                    chartVariant="areaWithProjection"
                    isAnimationRequired={true}
                    leftSpace={24}
                    forecast={projectionEnabled && projectionButtonChartHeader}
                    forecastFlagKey="forecast"
                    projection={projectionConfig}
                    charts={[
                        {
                            chartVariant: "areaWithProjection",
                            data: stackedAreaChartData,
                            height: 350,

                            forecast: projectionEnabled && projectionButtonChartHeader,
                            forecastFlagKey: "forecast",
                            projection: projectionConfig,

                            areaFillOpacity: 0.12,
                            areaShowTopStroke: true,
                            areaStrokeWidth: 1.5,
                            areaUseGradient: false,

                            seriesLines: [
                                {
                                    dataKey: GroupedColumnChartDynamicKey[0] ?? "",
                                    name: GroupedColumnChartDynamicKey[0] ?? "",
                                    strokeColor: chartColor.seriesColor.stackedArea
                                },
                                {
                                    dataKey: GroupedColumnChartDynamicKey[1] ?? "",
                                    name: GroupedColumnChartDynamicKey[1] ?? "",
                                    strokeColor: chartColor.seriesColor.stackedArea2
                                },
                                {
                                    dataKey: GroupedColumnChartDynamicKey[2] ?? "",
                                    name: GroupedColumnChartDynamicKey[2] ?? "",
                                    strokeColor: chartColor.seriesColor.stackedArea3
                                }
                            ],

                            setXaxis: setXaxis,
                            showCartesianGrid: false,
                            showYAxis: true,

                            tooltipLabels: {
                                [GroupedColumnChartDynamicKey[0] ?? "brandA"]:
                                    GroupedColumnChartDynamicKey[0] ?? "",
                                [GroupedColumnChartDynamicKey[1] ?? "brandB"]:
                                    GroupedColumnChartDynamicKey[1] ?? "",
                                [GroupedColumnChartDynamicKey[2] ?? "brandC"]:
                                    GroupedColumnChartDynamicKey[2] ?? "",

                                ...Object.fromEntries(
                                    (axisConfig?.target ?? [])
                                        .filter(
                                            item =>
                                                item.type === "Target" &&
                                                item.eyeOpen
                                        )
                                        .map(item => [
                                            item.label,
                                            item.display ?? item.label
                                        ])
                                )
                            },

                            unit: unit !== "undefined" ? unit : "",

                            yAxisIntervals: 10,
                            yAxisMax: 60,
                            yAxisMin: 0,

                            targetLines:
                                axisConfig?.target
                                    ?.filter(item => item.type === "Target")
                                    ?.map((item, index) => ({
                                        dataKey: item.label,
                                        name: item.display ?? item.label,
                                        strokeColor:
                                            targetColors[index] ?? chartColor.targetColors.color1,
                                        strokeDasharray: "4 4"
                                    })) ?? [],

                            toleranceBands:
                                axisConfig?.target
                                    ?.filter(
                                        item =>
                                            item.type === "Tolerance" &&
                                            item.eyeOpen
                                    )
                                    ?.map(item => ({
                                        upperDataKey: `${item.label} Upper`,
                                        lowerDataKey: `${item.label} Lower`,
                                        fillColor: chartColor.toleranceBands.color1,
                                        fillOpacity: 0.45,
                                        showCenterLine: false
                                    })) ?? [],

                            secondaryYAxisDataKeys:
                                axisConfig?.secondaryYAxis?.map(
                                    item => item.display ?? item.label
                                ) ?? []
                        }
                    ]}
                    legendAlign="left"
                    legendsLabels={[
                        ...(GroupedColumnChartDynamicKey[0]
                            ? [
                                {
                                    color: chartColor.legendsLabels.color8,
                                    type: "square",
                                    value: GroupedColumnChartDynamicKey[0]
                                }
                            ]
                            : []),

                        ...(GroupedColumnChartDynamicKey[1]
                            ? [
                                {
                                    color: chartColor.legendsLabels.color9,
                                    type: "square",
                                    value: GroupedColumnChartDynamicKey[1]
                                }
                            ]
                            : []),

                        ...(GroupedColumnChartDynamicKey[2]
                            ? [
                                {
                                    color: chartColor.legendsLabels.color10,
                                    type: "square",
                                    value: GroupedColumnChartDynamicKey[2]
                                }
                            ]
                            : []),

                        ...(axisConfig?.target
                            ?.filter(
                                item =>
                                    item.type === "Target" &&
                                    item.eyeOpen
                            )
                            ?.map((item, index) => ({
                                color: targetColors[index] ?? chartColor.targetColors.color1,
                                type: "dashed",
                                value: item.display ?? item.label
                            })) ?? []),
                    ]}
                    showLegend={showLegend}
                    showYAxis={showYAxis}
                    xAxisAngle={xAxisAngle}
                    showValueLabel={showTotalLabel}
                    showTotalLabel={showTotalLabel}
                    showVerticalGridLines={showVerticalGridLines}
                    showHorizontalGridLines={showHorizontalGridLines}
                    decimalPlaces={decimalPlaces}
                    xAxisLabel={finalXAxisLabel}
                    yAxisLabel={GroupedColumnChartDynamicKey.join(" / ")}
                    showYAxisLabels={showYAxisLabels}
                    showXAxisLabels={showXAxisLabels}
                    enableSecondaryYAxis={
                        (axisConfig?.secondaryYAxis?.length ?? 0) > 0
                    }
                />
            );
        } else if (selectedChartType === 'column-2') {
            return (

                <BarChartComponent
                    /* Data and layout */
                    data={stackeddColumnChartData}
                    secondaryYAxisDataKeys={
                        axisConfig?.secondaryYAxis?.map(
                            item => item.display ?? item.label
                        ) ?? []}
                    graphHeight={350}
                    animationDuration={1200}
                    isAnimationRequired
                    margin={{ bottom: 30 }}

                    /* Stacked bar configuration */
                    isStacked
                    dataKey1={GroupedColumnChartDynamicKey[0] ?? ""}
                    dataKey2={GroupedColumnChartDynamicKey[1] ?? ""}
                    dataKey3={GroupedColumnChartDynamicKey[2] ?? ""}

                    /* Normal bar colors */
                    bar1FillColor={chartColor.barFill.stackedColumn1}
                    bar2FillColor={chartColor.barFill.stackedColumn2}
                    bar3FillColor={chartColor.barFill.stackedColumn3}

                    /* Forecast/striped bar colors */
                    stripedPatternColor={chartColor.stripedPatternColor}

                    bar2StripedPatternColor={chartColor.bar2StripedPatternColor}


                    /* Forecast activation */
                    forecast={projectionEnabled && projectionButtonChartHeader}
                    forecastFlagKey="forecast"

                    /* Bar appearance */
                    bar1Radius={[0, 0, 0, 0]}
                    bar2Radius={[0, 0, 0, 0]}
                    bar3Radius={[4, 4, 0, 0]}
                    barSize={38}

                    /* Projection limit marker */
                    projectionLimitBarDataKey="stackedTotal"
                    projectionLowerLimitDataKey="lowerLimit"
                    projectionUpperLimitDataKey="upperLimit"
                    showProjectionLimitMarkerWithBackground={projectionEnabled && projectionButtonChartHeader}
                    projectionLimitMarkerBackgroundColor={chartColor.projectionLimitMarkerBackgroundColor}
                    projectionLimitMarkerBackgroundHorizontalPadding={4}
                    projectionLimitMarkerBackgroundVerticalPadding={4}
                    projectionLimitMarkerBackgroundOpacity={0.22}
                    projectionLimitMarkerBackgroundRadius={6}
                    projectionLimitMarkerStrokeWidth={2}
                    projectionLimitMarkerWidth={10}
                    showBarTopDots
                    /* Axis and tooltip */
                    setXaxis="month"
                    tooltipTitleDataKey="tooltipTitle"
                    showLineInTooltip
                    unit={unit !== "undefined" ? unit : ""}
                    yXaxisLineIntervals={50}

                    /* Optional line styling */
                    line1StrokeColor={chartColor.lineStrockColor}
                    line2StrokeColor={chartColor.lineStrockColor}
                    line3StrokeColor={chartColor.lineStrockColor}

                    /* Chart controls */
                    showLegend={showLegend}
                    showYAxis={showYAxis}
                    xAxisAngle={xAxisAngle}
                    showVerticalGridLines={showVerticalGridLines}
                    showHorizontalGridLines={showHorizontalGridLines}
                    decimalPlaces={decimalPlaces}
                    xAxisLabel={finalXAxisLabel}
                    yAxisLabel={GroupedColumnChartDynamicKey
                        .filter(Boolean)
                        .join(" / ")}
                    showYAxisLabels={showYAxisLabels}
                    showXAxisLabels={showXAxisLabels}

                    /* Value labels */
                    showValueLabel={showValueLabel}
                    showTotalLabel={showTotalLabel}

                    /* Secondary Y-axis */
                    enableSecondaryYAxis={
                        (axisConfig?.secondaryYAxis?.length ?? 0) > 0
                    }
                    showSecondaryYAxisLabels={
                        (axisConfig?.secondaryYAxis?.length ?? 0) > 0
                    }

                    /* Tolerance bands */
                    toleranceBands={
                        axisConfig?.target
                            ?.filter(
                                item =>
                                    item.type === "Tolerance" &&
                                    item.eyeOpen
                            )
                            ?.map(item => ({
                                upperDataKey: `${item.label} Upper`,
                                lowerDataKey: `${item.label} Lower`,
                                fillColor: chartColor.toleranceBands.color1,
                                fillOpacity: 0.45,
                                showCenterLine: false
                            })) ?? []
                    }

                    /* Target lines */
                    targetLines={
                        axisConfig?.target
                            ?.filter(
                                item =>
                                    item.type === "Target" &&
                                    item.eyeOpen
                            )
                            ?.map((item, index) => ({
                                lineDataKey: item.label,
                                name: item.display ?? item.label,
                                lineStrokeColor:
                                    targetColors[index] ?? chartColor.targetColors.color1,
                                strokeDasharray: "4 4"
                            })) ?? []
                    }
                />
            );
        } else if (selectedChartType === 'column-3') {
            return (

                <BarChartComponent
                    data={groupedColumnChartData}
                    secondaryYAxisDataKeys={
                        axisConfig?.secondaryYAxis?.map(
                            item => item.display ?? item.label
                        ) ?? []}
                    /* Animation and layout */
                    animationDuration={1200}
                    isAnimationRequired
                    margin={{ bottom: 30 }}
                    graphHeight={350}
                    graphWidth={800}
                    /* X-axis and tooltip */
                    setXaxis="month"
                    tooltipTitleDataKey="tooltipTitle"
                    showLineInTooltip
                    showBarTopDots
                    /* Grouped bar data keys */
                    dataKey1={GroupedColumnChartDynamicKey[0] ?? ""}
                    dataKey2={GroupedColumnChartDynamicKey[1] ?? ""}
                    dataKey3={GroupedColumnChartDynamicKey[2] ?? ""}

                    /* Normal bar colors */
                    bar1FillColor={chartColor.barFill.groupBar1}
                    bar2FillColor={chartColor.barFill.groupBar2}
                    bar3FillColor={chartColor.barFill.groupBar3}

                    /* Projected bar pattern colors */
                    stripedPatternColor={chartColor.stripedPatternColor}
                    bar2StripedPatternColor={chartColor.bar2StripedPatternColorGrouped}

                    /* Projection mode */
                    forecast={projectionEnabled && projectionButtonChartHeader}
                    forecastFlagKey="forecast"

                    /*
                     * Projection limit marker
                     * The marker is currently attached to the first bar series.
                     */
                    projectionLimitBarDataKey={
                        GroupedColumnChartDynamicKey[0] ?? ""
                    }
                    projectionLowerLimitDataKey="lowerLimit"
                    projectionUpperLimitDataKey="upperLimit"
                    showProjectionLimitMarkerWithBackground={
                        projectionEnabled
                    }
                    projectionLimitMarkerBackgroundColor={chartColor.projectionLimitMarkerBackgroundColor}
                    projectionLimitMarkerBackgroundHorizontalPadding={4}
                    projectionLimitMarkerBackgroundVerticalPadding={4}
                    projectionLimitMarkerBackgroundOpacity={0.22}
                    projectionLimitMarkerBackgroundRadius={6}
                    projectionLimitMarkerStrokeWidth={2}
                    projectionLimitMarkerWidth={10}

                    /* Bar appearance */
                    bar1Radius={[4, 4, 0, 0]}
                    bar2Radius={[4, 4, 0, 0]}
                    bar3Radius={[4, 4, 0, 0]}
                    barSize={30}
                    spaceBetweenBars={50}
                    isStacked={false}

                    /* Optional line appearance */
                    line1StrokeColor={chartColor.lineStrockColor}
                    line2StrokeColor={chartColor.lineStrockColor}
                    line3StrokeColor={chartColor.lineStrockColor2}

                    /* Axis configuration */
                    unit={unit !== "undefined" ? unit : ""}
                    yXaxisLineIntervals={50}
                    showLegend={showLegend}
                    showYAxis={showYAxis}
                    xAxisAngle={xAxisAngle}
                    showVerticalGridLines={showVerticalGridLines}
                    showHorizontalGridLines={showHorizontalGridLines}
                    decimalPlaces={decimalPlaces}
                    xAxisLabel={finalXAxisLabel}
                    yAxisLabel={GroupedColumnChartDynamicKey
                        .filter(Boolean)
                        .join(" / ")}
                    showYAxisLabels={showYAxisLabels}
                    showXAxisLabels={showXAxisLabels}

                    /* Labels */
                    showValueLabel={showValueLabel}
                    showTotalLabel={showTotalLabel}

                    /* Secondary Y-axis */
                    enableSecondaryYAxis={
                        (axisConfig?.secondaryYAxis?.length ?? 0) > 0
                    }
                    showSecondaryYAxisLabels={
                        (axisConfig?.secondaryYAxis?.length ?? 0) > 0
                    }

                    /* Tolerance bands */
                    toleranceBands={
                        axisConfig?.target
                            ?.filter(
                                item =>
                                    item.type === "Tolerance" &&
                                    item.eyeOpen
                            )
                            ?.map(item => ({
                                upperDataKey: `${item.label} Upper`,
                                lowerDataKey: `${item.label} Lower`,
                                fillColor: chartColor.toleranceBands.color1,
                                fillOpacity: 0.45,
                                showCenterLine: false
                            })) ?? []
                    }

                    /* Target lines */
                    targetLines={
                        axisConfig?.target
                            ?.filter(
                                item =>
                                    item.type === "Target" &&
                                    item.eyeOpen
                            )
                            ?.map((item, index) => ({
                                lineDataKey: item.label,
                                name: item.display ?? item.label,
                                lineStrokeColor:
                                    targetColors[index] ?? chartColor.targetColors.color1,
                                strokeDasharray: "4 4"
                            })) ?? []
                    }
                />






            );
        } else {
            return (
                <BarChartComponent
                    data={simpleColumnChart}
                    dataKey1={simpleColumnDynamicKey}
                    showBarTopDots
                    /* Projection mode */
                    forecast={projectionEnabled && projectionButtonChartHeader}
                    forecastFlagKey="forecast"
                    secondaryYAxisDataKeys={
                        axisConfig?.secondaryYAxis?.map(
                            item => item.display ?? item.label
                        ) ?? []}
                    /* Projected bar styling */

                    stripedPatternColor={chartColor.stripedPatternColor}

                    /* Main bar styling */
                    bar1FillColor={chartColor.barFill.simpleBar}
                    bar1Radius={[4, 4, 0, 0]}
                    barSize={30}
                    spaceBetweenBars={50}
                    isStacked={false}

                    /* Axis and tooltip */
                    setXaxis="month"
                    tooltipTitleDataKey="tooltipTitle"
                    showLineInTooltip
                    unit={unit !== "undefined" ? unit : ""}
                    yXaxisLineIntervals={20}
                    rightYXaxisLineIntervals={20}

                    /* Layout and animation */
                    margin={{ bottom: 30 }}
                    graphHeight={450}
                    animationDuration={1200}
                    isAnimationRequired

                    /* Hide unused bars */
                    bar2FillColor="transparent"
                    bar3FillColor="transparent"
                    bar4FillColor="transparent"

                    /* Hide unused lines */
                    line1StrokeColor="transparent"
                    line2StrokeColor="transparent"
                    line3StrokeColor="transparent"

                    /* Display configuration */
                    showLegend={showLegend}
                    showYAxis={showYAxis}
                    xAxisAngle={xAxisAngle}
                    showValueLabel={showValueLabel}
                    showTotalLabel={showTotalLabel}
                    showVerticalGridLines={showVerticalGridLines}
                    showHorizontalGridLines={showHorizontalGridLines}
                    decimalPlaces={decimalPlaces}
                    xAxisLabel={finalXAxisLabel}
                    yAxisLabel={simpleColumnDynamicKey}
                    showYAxisLabels={showYAxisLabels}
                    showXAxisLabels={showXAxisLabels}
                    projectionLimitMarkerBackgroundColor={chartColor.projectionLimitMarkerBackgroundColor}

                    /* Secondary Y-axis */
                    enableSecondaryYAxis={
                        (axisConfig?.secondaryYAxis?.length ?? 0) > 0
                    }
                    showSecondaryYAxisLabels={
                        (axisConfig?.secondaryYAxis?.length ?? 0) > 0
                    }

                    /* Tolerance bands */
                    toleranceBands={
                        axisConfig?.target
                            ?.filter(
                                item =>
                                    item.type === "Tolerance" &&
                                    item.eyeOpen
                            )
                            ?.map(item => ({
                                upperDataKey: `${item.label} Upper`,
                                lowerDataKey: `${item.label} Lower`,
                                fillColor: chartColor.toleranceBands.color1,
                                fillOpacity: 0.45,
                                showCenterLine: false
                            })) ?? []
                    }

                    /* Target lines */
                    targetLines={
                        axisConfig?.target
                            ?.filter(
                                item =>
                                    item.type === "Target" &&
                                    item.eyeOpen
                            )
                            ?.map((item, index) => ({
                                lineDataKey: item.label,
                                name: item.display ?? item.label,
                                lineStrokeColor:
                                    targetColors[index] ?? chartColor.targetColors.color1,
                                strokeDasharray: "4 4"
                            })) ?? []
                    }
                />
            );
        }
    };
    const formatSavedDataBeforeUpdate = (savedData: SAVED_DATA): SAVED_DATA => {
        const updatedName = savedData?.updatedName?.toLowerCase();
        const selectedValues = savedData?.selectedValues;

        if (!selectedValues) return savedData;

        const currentName = String(selectedValues.name || "").trim().toLowerCase();

        //  if Top / Bottom / All => do not format
        if (
            currentName === "all" ||
            /^top\s+\d+$/i.test(currentName) ||
            /^bottom\s+\d+$/i.test(currentName)
        ) {
            return savedData;
        }

        let formattedName = selectedValues.name;

        //  Day custom => "2026-06-03,2026-06-04" -> "3,4"
        if (updatedName === "day") {
            const values = Array.isArray(selectedValues.values)
                ? selectedValues.values
                : String(selectedValues.name || "")
                    .split(",")
                    .map(v => v.trim());

            formattedName = values
                .map(val => {
                    const lastPart = String(val).split("-").pop()?.trim() || "";
                    return String(Number(lastPart)); // 03 -> 3
                })
                .filter(Boolean)
                .join(",");
        }

        //  Quarter custom => "Quarter 2(...),Quarter 3(...)" -> "Q2,Q3"
        else if (updatedName === "quarter") {
            const values = Array.isArray(selectedValues.values)
                ? selectedValues.values
                : String(selectedValues.name || "")
                    .split(",")
                    .map(v => v.trim());

            formattedName = values
                .map(val => {
                    const str = String(val).trim();

                    if (/^q[1-4]$/i.test(str)) {
                        return str.toUpperCase();
                    }

                    const match = str.match(/quarter\s*([1-4])/i);
                    return match ? `Q${match[1]}` : "";
                })
                .filter(Boolean)
                .join(",");
        }

        return {
            ...savedData,
            selectedValues: {
                ...selectedValues,
                name: formattedName
            }
        };
    };


    return (
        <ColumnChartWithCustomizeHeader
            id={id}
            className={[styles['template-skeleton'], className].filter(Boolean).join(' ')}
            style={style}
            parentRef={parentRef}
            mode={"view"}


            // Title / subtitle / filters
            title={computedTitle}
            metricName={metricName}
            autoTitleFromMetric={autoTitleFromMetric}
            titleTooltip={titleTooltip ?? computedTitle}
            showTitle={showTitle}
            showSubtitle={showSubtitle}
            subtitle={subtitle}
            appliedFilters={showAppliedFilters ? appliedFilters : {}}
            // UOM
            uomOptions={uomOptions}
            selectedUom={selectedUom}
            onUomChange={handleUomChange}
            uomAriaLabel="Metric UOM"
            // Chips / header info
            showStatusChips={showStatusChips}
            statusChips={statusChips}
            headerInfoRenderer={""}
            showXAxisSelection={effectiveShowXAxisSelection}
            // xAxisOptions={resolvedXAxisOptions}
            onToggleXAxisDropdown={() => setDropdownOpenXaxis(!dropdownOpenXaxis)}
            showProjectionButton={effectiveShowProjectionButton}
            activeDataProjection={projectionButtonChartHeader}
            onProjectionClick={() => { setProjectionButtonChartHeader(!projectionButtonChartHeader); }}
            isDataProjectionDisabled={isDataProjectionDisabled}
            showSortButton={true}
            sortOrder={sortOrder}
            onSortToggle={onSortToggle}
            showGroupByDropdown={derivedShowGroupByDropdown}
            groupByOptions={resolvedGroupByOptions}
            selectedGroupBy={selectedGroupBy}
            onGroupByChange={onGroupByChange}
            showStackByDropdown={derivedShowStackByDropdown}
            stackByOptions={resolvedStackByOptions}
            selectedStackBy={selectedStackBy}
            onStackByChange={onStackByChange}
            showTargetDropdown={effectiveShowTargetDropdown}
            targetOptions={resolvedTargetOptions}
            selectedTargets={resolvedSelectedTargets}
            onTargetsChange={handleTargetsChangeResolved}
            onTargetsApply={(v: string[]) => {
                setSelectedtargets(v)
            }}
            showWidgetFilterDropdown={showWidgetFilterDropdown}
            widgetFilterRenderer={widgetFilterRenderer}
            // Actions
            showLinkButton={showLinkButton}
            linkHref={linkHref}
            onLinkClick={onLinkClick}
            showInsightsButton={showInsightsButton}
            onInsightsClick={onInsightsClick}
            insightsLoading={insightsLoading}
            onDelete={onDelete}
            deleteConfirmText={deleteConfirmText}
            onDuplicate={onDuplicate}
            onEdit={onEdit}
            // showTableView={showTableView}
            isTableView={isTableView}
            onToggleTableView={onToggleTableView}
            initialExpanded={initialExpanded}
            onExpandChange={onExpandChange}
            // renderIcon={iconRenderer}
            renderBadge={renderBadge}
            renderSelect={renderSelect}
            renderMultiSelect={renderMultiSelect}
            // Drilldown
            drilldown={effectiveDrilldown}

            projectionToolTip={projectionToolTip}
            // Any other future props
            {...rest}
            showTableView={showAppliedFilters}
        >

            {/* === BODY CONTENT === */}
            {/* {topControls} */}
            <div className="space-v-16" />

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                {isAxisEmpty ? (
                    <div className={styles['empty-chart-preview-state']}>
                        <div className={styles['empty-chart-preview-title']}>
                            No data available
                        </div>
                        <div className={styles['empty-chart-preview-description']}>
                            Add a metric to Y-Axis to preview chart
                        </div>
                    </div>
                ) : (
                    <>

                        {selectedItemFromXaxis && <SimpleOverlay parentRef={parentRef} >
                            <EditFieldModal
                                chartHeader={true}
                                onClose={() => setSelectedItemFromXaxis(null)}
                                category={selectedItemFromXaxis?.label as string}
                                options={getEditMenuOptions(selectedItemFromXaxis?.label as string)}
                                selectedOptions={selectedItemFromXaxis.selected_value?.split(" ")[0]?.toLowerCase()?.toString() === "all" ? 'all_regions' : selectedItemFromXaxis.selected_value?.split(" ")[0]?.toLowerCase()?.toString() ?? "all_regions"}
                                label={selectedItemFromXaxis?.label?.toLocaleString().toLocaleLowerCase() as string}
                                onSave={(savedData: SAVED_DATA) => {

                                    const formattedSavedData = formatSavedDataBeforeUpdate(savedData);

                                    setSelectedItemFromXaxis(null)
                                    if (selectedItemFromXaxis) updateChipDataOnEdit(selectedItemFromXaxis as FieldItem, formattedSavedData)

                                }} />
                        </SimpleOverlay>}

                        {selectedItemFromXaxis === null &&

                            <MyDropdownComponent
                                parentRef={parentRef}
                                showXaxis={effectiveShowXAxisSelection}
                                xaxisData={xaxischeckedData}
                                setXaxischeckedData={setXaxischeckedData}
                                setXaxisSetUp={setXaxisSetUp}
                                isdrop={dropdownOpenXaxis}
                                selectedItemFromXaxisFn={(v: any) => {

                                    setSelectedItemFromXaxis(v);
                                }}
                            />
                        }
                        {renderCustomizeChart()}
                    </>
                )}

            </div>
        </ColumnChartWithCustomizeHeader>

    );
};



export const SimpleOverlay = ({ parentRef, children }: SimpleOverlayProps) => {
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    useLayoutEffect(() => {
        let frameId: number;

        const updatePosition = () => {
            if (parentRef?.current) {
                const rect = parentRef.current.getBoundingClientRect();

                setPosition({
                    top: rect.bottom + window.scrollY + 10,
                    left: rect.left + window.scrollX,
                });
            }

            frameId = requestAnimationFrame(updatePosition);
        };

        updatePosition();

        return () => cancelAnimationFrame(frameId);
    }, [parentRef]);

    //  Don't render until we have correct position
    if (!parentRef?.current || !position) return null;

    return createPortal(
        <div
            style={{
                position: "absolute",
                top: position.top,
                left: position.left,
                zIndex: 9999,
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                minWidth: "200px"
            }}
        >
            {children}
        </div>,
        document.body
    );
};





interface MyDropdownComponentProps {
    parentRef: React.RefObject<HTMLElement>;
    isdrop: boolean;
    xaxisData: ISwitchProps[];
    showXaxis: boolean;
    setXaxisSetUp?: (value: ISwitchProps[]) => void;
    setXaxischeckedData: React.Dispatch<React.SetStateAction<ISwitchProps[]>>;
    selectedItemFromXaxisFn?: (v: any) => void;
}


export const MyDropdownComponent = ({
    parentRef,
    isdrop,
    xaxisData = [],
    setXaxischeckedData,
    selectedItemFromXaxisFn,
    setXaxisSetUp,
    showXaxis
}: MyDropdownComponentProps) => {
    //  Hooks must be before conditional return
    const [refreshTick, setRefreshTick] = useState<number>(0);

    //  always derive latest options from parent data
    const mappedOptions = useMemo(() => {
        return (xaxisData ?? []).map((item) => ({
            key: String(item.key ?? ""),
            value: String(item.key ?? ""),
            label: item.label ?? "",
            checked: !!item.checked,
            isDisable: !!item.isDisable,
            selected_value: item.selected_value,
        }));
    }, [xaxisData]);

    //  force rerender/remount if options change dynamically
    const dropdownKey = useMemo(() => {
        return (
            mappedOptions
                .map(
                    (item) =>
                        `${item.key}-${item.checked}-${"ggg"}-${String(
                            item.label ?? ""
                        )}`
                )
                .join("|") + `-${refreshTick}`
        );
    }, [mappedOptions, refreshTick]);

    const createProps = useCallback(() => {
        return {
            id: "drop-down-with-custom-placeholder",
            dataTestId: "dropd-down",
            className: "column-chart-customize-header__X-dropdown dropdown-hover-wrapper",
            checkbox: true,
            style: {
                margin: 0,
                zIndex: 9,
                left: "13%",
            },
            parentRef,

            //  live options
            options: mappedOptions,

            onToggle: (option: { key?: string }, _checked?: boolean) => {
                setXaxischeckedData((prev) => {
                    const current = prev ?? [];

                    // find clicked item
                    const selectedItem = current.find((item) => item.key === option.key);

                    //  if same checked item clicked again,
                    // keep it checked but return NEW array to force refresh
                    let updated: ISwitchProps[];

                    if (selectedItem?.checked) {
                        updated = current.map((item) => ({
                            ...item,
                            checked: item.key === option.key,
                        }));
                    } else {
                        //  different item clicked → make only that item checked
                        updated = current.map((item) => ({
                            ...item,
                            checked: item.key === option.key,
                        }));
                    }

                    //  sync optional parent setup
                    setXaxisSetUp?.(updated);

                    //  force remount / refresh
                    setRefreshTick((prevTick) => prevTick + 1);

                    //  return new array always
                    return [...updated];
                });
            },

            iconClick: (v: any) => selectedItemFromXaxisFn?.(v),

            isDropdownOpen: isdrop,
            filterIcon: true,
            setDropdownOpen: () => { },

            useReactPortal: false,
            enableDrag: true,

            //  if DropdownSwitch depends on defaultOptions for initial load
            // keep this, but options will control live updates
            defaultOptions: mappedOptions,

            onOrderChange: (updated: ISwitchProps[]) => {

                const mappedBack: ISwitchProps[] = updated.map((item) => ({
                    key: String(item.key ?? ""),
                    label: item.label,
                    checked: !!item.checked,
                    isDisable: !!item.isDisable,
                    selected_value: item.selected_value,
                }));

                setXaxischeckedData(mappedBack);
                setXaxisSetUp?.(mappedBack);

                setRefreshTick((prevTick) => prevTick + 1);
            },

            switchClassName: "reason-code-switch",
        };
    }, [
        parentRef,
        mappedOptions,
        isdrop,
        setXaxischeckedData,
        selectedItemFromXaxisFn,
        setXaxisSetUp,
    ]);

    if (!showXaxis) {
        return null;
    }

    return (
        <div className="my-dropdown-root">
            <DropdownSwitch key={dropdownKey} {...(createProps() as any)} />
        </div>
    );
};
export default TemplateSkeleton;
