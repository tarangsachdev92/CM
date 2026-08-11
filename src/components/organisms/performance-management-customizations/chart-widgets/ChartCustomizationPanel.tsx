import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Col, Flex, Row } from 'antd';
import {
    Flyout,
    Button,
    Accordion,
    Switch,
    CheckBox,
    DropDown,
    InputField,
    ChartTypeButton,
    AnimatedLoaders,
    Radio,
    SegmentedControl,
    ColumnChartWithCustomizeHeader,
} from 'konnect-react-components';
import { Label } from '../../../atoms';
import TemplateSkeleton, { ISwitchProps, staticAppliedFilterData } from './TemplateSkeleton';
import type { ChartWidgetState } from '../performance-management-widgets/SimpleColumnChartWidget';
import styles from './ChartCustomizationPanel.module.scss';
import { ChartTypeString } from '../../../../store/slice/performanceWidgetsByTabSlice';
import {
    OverlayAreaIcon,
    ClusteredColumnIcon,
    MultiLineIcon,
    SingleLineIcon,
    FilledAreaIcon,
    Stacked100ColumnIcon,
    StackedColumnIcon,
    StackedBarIcon,
    Stacked100BarIcon,
    ClusteredBarIcon,
} from '../../../../assets/icons/icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../store';
import { fetchWidgetConfiguration, resetWidgetConfiguration, saveWidgetConfiguration } from '../../../../store/thunks/performanceManagementWidgets';
import { fetchDynamicTabs } from '../../../../store/thunks/dynamicTabs';
import type { IWidgetOption } from '../../../../types/response';
import { logError } from '../../../../utils/helpers';
import DataFields, { FieldItem } from './DataFieldFlyout';
import DropZone from './DropZone';
import { buildEmptyChartPlaceholder } from '../PerformanceManagementCustomizations';

const SETUP_TAB = 'Setup';
const STYLING_TAB = 'Styling';
const FILTER_TAB = 'Filter';
const PANEL_TABS = [SETUP_TAB, STYLING_TAB, FILTER_TAB] as const;
const REPORT_ID = 1;

const fields: FieldItem[] = [
    {
        "id": "11",
        "label": "Year",
        "type": "Time",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'Year',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "12",
        "label": "Quarter",
        "type": "Time",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'Quarter',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "13",
        "label": "Month",
        "type": "Time",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'Month',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "14",
        "label": "Week",
        "type": "Time",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'Week',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "15",
        "label": "Day",
        "type": "Time",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'Day',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "211",
        "label": "Shift",
        "type": "Time",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'Shift',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },

    {
        "id": "17",
        "label": "OTIF-D-Target",
        "type": "Target",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'OTIF-D Target',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "18",
        "label": "OTIF-D-Tolerance",
        "type": "Tolerance",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'OTIF-D Tolerance',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "108",
        "label": "CAPA-A1-Target",
        "type": "Target",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'CAPA-A1 Target',
        "selected_value": 'All',
        "source": "DATA_FIELD",
        "parentId": "19"
    },
    {
        "id": "110",
        "label": "CAPA-A2-Target",
        "type": "Target",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'CAPA-A2 Target',
        "selected_value": 'All',
        "source": "DATA_FIELD",
        "parentId": "19"
    },
    {
        "id": "111",
        "label": "CAPA-A3-Target",
        "type": "Target",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'CAPA-A3 Target',
        "selected_value": 'All',
        "source": "DATA_FIELD",
        "parentId": "19"
    },
    {
        "id": "209",
        "label": "CAPA-A1-Tolerance",
        "type": "Tolerance",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'CAPA-A1 Tolerance',
        "selected_value": 'All',
        "source": "DATA_FIELD",
        "parentId": "108"
    },
    {
        "id": "210",
        "label": "CAPA-A2-Tolerance",
        "type": "Tolerance",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'CAPA-A2 Tolerance',
        "selected_value": 'All',
        "source": "DATA_FIELD",
        "parentId": "110"
    },
    {
        "id": "211",
        "label": "CAPA-A3-Tolerance",
        "type": "Tolerance",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'CAPA-A3 Tolerance',
        "selected_value": 'All',
        "source": "DATA_FIELD",
        "parentId": "111"
    },
    {
        "id": "19",
        "label": "CAPA-Aging",
        "type": "Measure",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'CAPA-Aging',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "20",
        "label": "CAPA-Count",
        "type": "Measure",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": "CAPA-Count",
        "selected_value": "All",
        "source": "DATA_FIELD"
    },
    {
        "id": "21",
        "label": "CAPA-Overdue",
        "type": "Measure",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": "CAPA-Overdue",
        "selected_value": "All",
        "source": "DATA_FIELD"
    },
    {
        "id": "1",
        "label": "Region",
        "type": "Geography",
        "allowed": ["Cluster", "Market", "Area"],
        "display": 'Region',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "2",
        "label": "Cluster",
        "type": "Geography",
        "allowed": ["Market"],
        "display": 'Cluster',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "3",
        "label": "Market",
        "type": "Geography",
        "allowed": ["Site", "Area"],
        "display": 'Market',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "4",
        "label": "Site",
        "type": "Geography",
        "allowed": ["Region", "Cluster"],
        "display": 'Site',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "5",
        "label": "Area",
        "type": "Geography",
        "allowed": ["Region", "Cluster", "Market", "Site"],
        "display": 'Area',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "6",
        "label": "Segment",
        "type": "Dimension",
        "allowed": ["Region", "Cluster", "Market", "Site"],
        "display": 'Segment',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "7",
        "label": "Sub-Segment",
        "type": "Dimension",
        "allowed": ["Segment", "Cluster", "Market", "Site"],
        "display": 'Sub-Segment',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "8",
        "label": "Brand",
        "type": "Dimension",
        "allowed": ["Region", "Cluster", "Market", "Site"],
        "display": 'Brand',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "9",
        "label": "Sub-Brand",
        "type": "Dimension",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'Sub-Brand',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    },
    {
        "id": "10",
        "label": "SKU",
        "type": "Dimension",
        "allowed": ["Region", "Cluster", "Market", "Brand"],
        "display": 'SKU',
        "selected_value": 'All',
        "source": "DATA_FIELD"
    }

];

const SETUP_ACCORDIONS = [
    { key: 'chart-type', title: 'Chart Type' },
    { key: 'header', title: 'Header' },
    { key: 'to-date-values', title: 'To Date Values' },
    { key: 'axis-Setup', title: 'Axis Setup' },
    { key: 'projection', title: 'Projection' },
    { key: 'user-selections', title: 'User Selections' },
] as const;

const STYLING_ACCORDIONS = [
    { key: 'styling-unit-format', title: 'Unit Format' },
    { key: 'styling-y-axis', title: 'Y-Axis' },
    { key: 'styling-x-axis', title: 'X-Axis' },
    { key: 'styling-data-labels', title: 'Data Labels' },
    { key: 'styling-others', title: 'Others' },
] as const;

const defaultDecimalOptions = [
    { value: '0' },
    { value: '1' },
    { value: '2' },
];

const defaultUnitOptions = [
    'Auto',
    'Percentage (%)',
    'Thousand (K)',
    'Millions (M)',
    'Billions (B)',
];

const defaultShowAxisOptions = [
    { value: 'All' },
    { value: '1st' },
    { value: 'None' },
];
const defaultXAxisAngleOptions = [
    { value: '0' },
    { value: '45' },
    { value: '90' },
];

const defaultGridlineOptions = [
    'H',
    'V',
];

const VALUE_LABEL_CHART_TYPES = new Set<ChartTypeString>([
    "column",
    "column-2",
    "column-3",
    "bar",
]);

export type OptionValue = string | number | boolean | string[] | number[] | null;

interface ExtendedOptionItem {
    path: string;
    title?: string;
    value: OptionValue; // bindable value
    options?: OptionValue[] | null;
    visible: boolean;
    disabled: boolean;
    error: string | null;
    raw: IWidgetOption;
}

type OptionState = Record<string, ExtendedOptionItem>;

export interface ChartCustomizationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    chartState: ChartWidgetState;
    titleLabel: string;
    widgetToken: string;
    activeTabId: number;
    onSave?: (config: Record<string, unknown>) => void;
    previewGraphic: React.ReactNode;
    TabId: number;

    initialConfig?: Record<string, unknown>;
    setXaxisSetUpParent?: React.Dispatch<React.SetStateAction<FieldItem[]>>;
    setTargetAxisSetUp?: React.Dispatch<React.SetStateAction<FieldItem[]>>;
}

const ChartCustomizationPanel: React.FC<ChartCustomizationPanelProps> = ({
    isOpen,
    onClose,
    chartState,
    titleLabel,
    widgetToken,
    onSave,
    previewGraphic,
    TabId,
    initialConfig


}) => {
    const dispatch = useDispatch<AppDispatch>();
    // const fieldsRef = useRef(fields)
    const widgetConfigurations = useSelector(
        (state: RootState) => state.performanceManagementWidgets.widgetConfiguration,
    );
    const isLoadingWidgetConfigurations = useSelector(
        (state: RootState) => state.performanceManagementWidgets.isWidgetConfigLoading,
    );
    const isTabLoading = useSelector((state: RootState) => state.dynamicTabs.isFetching);
    const widgetConfigurationsError = useSelector(
        (state: RootState) => state.performanceManagementWidgets.errorWidgetConfiguration,
    );

    const isFromScratch = useSelector(
        (state: RootState) =>
            state.performanceManagementWidgets.isFromScratch
    );

    const dynamicTabError = useSelector((state: RootState) => state.dynamicTabs.error);

    const widgetConfig = widgetConfigurations?.[0];

    const error = widgetConfigurationsError || dynamicTabError;
    const isLoading = isLoadingWidgetConfigurations || isTabLoading;
    const [activePanelTab, setActivePanelTab] = useState<(typeof PANEL_TABS)[number]>(SETUP_TAB);
    const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());
    const [projectionEnabled, setProjectionEnabled] = useState(false);
    const [openDataFieldFlyOut, setOpenDataFieldFlyOut] = useState(false);
    const [optionState, setOptionState] = useState<OptionState>({});

    const [dataFieldsValue, setDataFieldsValue] = useState<FieldItem[] | OptionValue[] | null | undefined>(fields)

    const [, setSelectedChartType] = useState<ChartTypeString | null>(null);
    const [selectedChartType, setSelectedChartTypeStr] = useState<string>((initialConfig?.chartType as string) || 'column');
    const [mockLinks] = useState([
        { label: 'Example Dashboard', value: 'https://example.com' }
    ]);

    const [axisSetup, setAxisSetup] = useState({
        yAxis: [] as FieldItem[],
        secondaryYAxis: [] as FieldItem[],
        xAxis: [] as FieldItem[],
        target: [] as FieldItem[],
        performanceIndicatorBase: '',
    });
    // Derived flags for User Selections prerequisites
    const hasMultipleXAxis = useMemo(
        () => axisSetup.xAxis.length > 1,
        [axisSetup.xAxis]
    );
    const hasXAxis = axisSetup.xAxis.length > 0;
    // const hasDrilldown = axisSetup.xAxis.some(x => Array.isArray((x as any).allowed) && (x as any).allowed.length > 0);
    const hasTargets = axisSetup.target.length > 1;

    const selectedChartTypeValue = selectedChartType as ChartTypeString;

    const showValueLabel = VALUE_LABEL_CHART_TYPES.has(selectedChartTypeValue);

    // Keep toggle state consistent when prerequisites become unavailable
    useEffect(() => {
        const key = 'Setup.UserSelections.XAxisDropdown';
        if (!hasXAxis && Boolean(optionState[key]?.value)) {
            handleOptionChange(key, false);
        }
    }, [hasXAxis]);


    useEffect(() => {
        const key = 'Setup.UserSelections.TargetLineDropdown';
        if (!hasTargets && Boolean(optionState[key]?.value)) {
            handleOptionChange(key, false);
        }
    }, [hasTargets]);


    const selectChartType = (t: ChartTypeString) => {
        setSelectedChartType(t);
        setSelectedChartTypeStr(t);
    };

    const savedConfigRef = useRef<Record<string, unknown>>({});
    const editingConfigRef = useRef<Record<string, unknown>>({});
    const hasInitializedRef = useRef<boolean>(false);

    const widgetConfigRef = useRef(widgetConfig);
    const optionStateRef = useRef(optionState);

    const buildOptionStateWithPaths = (
        options: IWidgetOption[],
        parentPath = '',
        state: OptionState = {},
    ): OptionState => {
        const getNodeKey = (option: IWidgetOption, parentPath: string) =>
            parentPath
                ? `${parentPath}.${option.optionKey || option.optionName}`
                : option.optionKey || option.optionName;

        options.forEach(option => {
            const path = getNodeKey(option, parentPath);
            let value: OptionValue = (option.defaultValue as OptionValue) ?? null;
            if ((path === 'Setup.Header.AppliedFilters' || path === 'Setup.Header.Insights') && value === null) {
                value = true;
            }

            state[path] = {
                path,
                title: option.optionName ?? null,
                value,
                options: (option.availableValues as OptionValue[]) ?? null,
                visible: true,
                disabled: false,
                error: null,
                raw: option,
            };

            if (option.children?.length) {
                buildOptionStateWithPaths(option.children, path, state);
            }
        });

        return state;
    };

    const updateWidgetOptionsWithValues = (
        options: IWidgetOption[],
        state: OptionState,
        parentPath = '',
    ): IWidgetOption[] => {
        const getNodeKey = (option: IWidgetOption, parentPath: string) =>
            parentPath
                ? `${parentPath}.${option.optionKey || option.optionName}`
                : option.optionKey || option.optionName;

        return options.map(option => {
            const path = getNodeKey(option, parentPath);
            const currentState = state[path];

            const resolvedValue =
                currentState?.value !== undefined
                    ? currentState.value
                    : (option.defaultValue ?? null);

            return {
                ...option, // keep everything same

                // overwrite defaultValue with updated value
                defaultValue: resolvedValue,

                // recursive update
                children: option.children?.length
                    ? updateWidgetOptionsWithValues(option.children, state, path)
                    : option.children,
            };
        });
    };

    const saveConfiguration = async () => {
        try {
            if (!widgetConfigRef.current) {
                return;
            }
            const updatedWidgetOptions = updateWidgetOptionsWithValues(
                widgetConfigRef.current.widgetOptions,
                optionStateRef.current,
            );

            const payload = {
                WidgetId: widgetConfigRef.current?.widgetId,
                widgetOptions: updatedWidgetOptions,
            };



            await dispatch(saveWidgetConfiguration(payload)).unwrap();
        } catch (error: any) {
            logError(error);
        }
    };

    const getFirstWidget = async (tabId: number) => {
        const { widgets } = await dispatch(
            fetchDynamicTabs({ reportId: REPORT_ID, tabId }),
        ).unwrap();
        return widgets?.[0] ?? null;
    };

    const loadWidgetConfiguration = async () => {
        if (!TabId) {
            logError("Tab is not Selected");
            return;
        }

        try {
            const widget = await getFirstWidget(TabId);
            if (!widget) return;
            await dispatch(
                fetchWidgetConfiguration({
                    kpiIdsCsv: widget.kpiId,
                    visualTypeId: widget.widgetVisualTypeId,
                    widgetId: isFromScratch ? null : widget.widgetId,
                }),
            );

        } catch (error) {
            logError(error);
        }
    };

    useEffect(() => {
        setOptionState({});
        setExpandedAccordions(new Set());
        setProjectionEnabled(false);
        setActivePanelTab(SETUP_TAB);
        hasInitializedRef.current = false;

        if (widgetToken?.startsWith('chart-empty:')) {
            setSelectedChartTypeStr(widgetToken.replace('chart-empty:', ''));
        } else {
            setSelectedChartTypeStr((initialConfig?.chartType as string) || 'column');
        }
    }, [widgetToken]);

    useEffect(() => {
        loadWidgetConfiguration();
    }, [isOpen, dispatch]);

    useEffect(() => {
        if (widgetConfig?.widgetOptions) {
            hasInitializedRef.current = false;
        }
    }, [widgetConfig]);

    useEffect(() => {
        optionStateRef.current = optionState;
        widgetConfigRef.current = widgetConfig;
    }, [optionState]);

    useEffect(() => {
        if (isLoading || hasInitializedRef.current) return;

        const state: Record<string, any> = widgetConfig?.widgetOptions
            ? buildOptionStateWithPaths(widgetConfig.widgetOptions)
            : {};


        const defaultTitleValue = titleLabel !== 'KPI Name' ? titleLabel : '';
        const isDefaultState = chartState === 'empty' || chartState === 'invalid';

        const ensureNode = (path: string, title: string, value: any, extraProps: Record<string, any> = {}) => {
            state[path] ??= { path, title, value, visible: true, disabled: false, error: null, ...extraProps };
        };

        ensureNode('Setup.Header.Title', 'Title', defaultTitleValue);
        ensureNode('Setup.Header.Sub-title', 'Sub-title', false);
        ensureNode('Setup.Header.Sub-title.Sub-title Text', 'Sub-title Text', '');
        ensureNode('Setup.Header.AppliedFilters', 'AppliedFilters', isDefaultState);
        ensureNode('Setup.Header.Insights', 'Insights', isDefaultState);
        ensureNode('Setup.Header.Link', 'Link', false);
        ensureNode('Setup.Header.Link.Link Text', 'Link Text', '', { options: [] });
        ensureNode('Setup.Projections', 'Projections', false);

        // To Date Values
        ensureNode('Setup.To Date Values.MTD', 'MTD', true);
        ensureNode('Setup.To Date Values.QTD', 'QTD', false);
        ensureNode('Setup.To Date Values.YTD', 'YTD', true);
        ensureNode('Setup.To Date Values.Comparison of', 'Comparison of', [], { options: ['MTD', 'QTD', 'YTD'] });
        ensureNode('Setup.To Date Values.Compare with', 'Compare with', 'Previous', { options: ['Previous', 'Target BP'] });

        // USER SELECTIONS DEFAULTS (ALL OFF)
        ensureNode('Setup.UserSelections.XAxisDropdown', 'X-Axis Dropdown', false);
        ensureNode('Setup.UserSelections.XAxisDrilldown', 'X-Axis Drilldown', false);
        ensureNode('Setup.UserSelections.TargetLineDropdown', 'Target Line Dropdown', false);
        ensureNode('Setup.UserSelections.Projection', 'Projection Button', false);

        state['Setup.Header.AppliedFilters']!.value = isDefaultState;
        state['Setup.Header.Insights']!.value = isDefaultState;

        const config: Record<string, any> = initialConfig || {};
        const parsedTitle = config.titleLabel === 'KPI Name' ? '' : config.titleLabel;

        const hasOnlyTitle =
            config.titleLabel !== undefined &&
            config.titleLabel !== 'KPI Name' &&
            !config.showSubtitle &&
            !config.showLinkButton &&
            config.showAppliedFilters === undefined &&
            config.showInsightsButton === undefined;

        if (initialConfig) {
            state['Setup.Header.Title']!.value = config.titleLabel !== undefined
                ? parsedTitle
                : state['Setup.Header.Title']!.value;

            if (!hasOnlyTitle) {
                const configMapping: Array<{ key: string; path: string }> = [
                    { key: 'showSubtitle', path: 'Setup.Header.Sub-title' },
                    { key: 'subtitle', path: 'Setup.Header.Sub-title.Sub-title Text' },
                    { key: 'showAppliedFilters', path: 'Setup.Header.AppliedFilters' },
                    { key: 'showInsightsButton', path: 'Setup.Header.Insights' },
                    { key: 'showLinkButton', path: 'Setup.Header.Link' },
                    { key: 'linkHref', path: 'Setup.Header.Link.Link Text' },
                ];

                configMapping.forEach(({ key, path }) => {
                    if (config[key] !== undefined && state[path]) {
                        state[path]!.value = config[key];
                    }
                });
            }

            const projVal = config.projectionEnabled;
            if (projVal !== undefined) {
                setProjectionEnabled(Boolean(projVal));
            }

            if (config.chartType) {
                setSelectedChartTypeStr(config.chartType as string);
            }

            state['Setup.Projections']!.value = projVal !== undefined
                ? Boolean(projVal)
                : state['Setup.Projections']!.value;

            if (config.toDateConfig) {
                const tdc = config.toDateConfig as any;
                if (state['Setup.To Date Values.MTD']) state['Setup.To Date Values.MTD'].value = Boolean(tdc.mtd);
                if (state['Setup.To Date Values.QTD']) state['Setup.To Date Values.QTD'].value = Boolean(tdc.qtd);
                if (state['Setup.To Date Values.YTD']) state['Setup.To Date Values.YTD'].value = Boolean(tdc.ytd);
                if (state['Setup.To Date Values.Comparison of']) state['Setup.To Date Values.Comparison of'].value = tdc.comparisons || [];
                if (state['Setup.To Date Values.Compare with']) state['Setup.To Date Values.Compare with'].value = tdc.compareWith || 'Previous';
            }
        }

        setOptionState(state);
        hasInitializedRef.current = true;

    }, [isLoading, widgetConfig, initialConfig, titleLabel, chartState]);



    const handleOptionChange = (key: string, value: any) => {

        if (value === undefined) return;

        setOptionState(prev => {
            const existing = prev[key];

            const safeItem: ExtendedOptionItem = existing ?? {
                path: key,
                title: key.split('.').pop() || '',
                value,
                options: [],
                visible: true,
                disabled: false,
                error: null,
                raw: {
                    defaultValue: value,
                } as IWidgetOption,
            };

            return {
                ...prev,
                [key]: {
                    ...safeItem,
                    value,
                    raw: {
                        ...safeItem.raw,
                        defaultValue: value,
                    },
                },
            };
        });
    };

    useEffect(() => {
        const labels = axisSetup.target
            .map(t => t.label)
            .filter((l): l is string => typeof l === 'string' && l.length > 0);

        if (labels.length > 0) {
            setOptionState(prev => {
                const key = 'Setup.axisSetup.performanceIndicatorBase';
                const prevItem = prev[key];

                const prevVal = prevItem?.value;
                const nextVal: OptionValue =
                    typeof prevVal === 'string' && labels.includes(prevVal)
                        ? prevVal
                        : (labels[0] ?? null);

                return {
                    ...prev,
                    [key]: {
                        ...(prevItem ?? {
                            path: key,
                            title: 'Show Performance Indicators Based On',
                            visible: true,
                            disabled: false,
                            error: null,
                            raw: { defaultValue: nextVal } as any,
                        }),
                        options: labels,
                        value: nextVal,
                        raw: {
                            ...(prevItem?.raw ?? ({} as any)),
                            defaultValue: nextVal,
                        },
                    },
                };
            });
        } else {
            setOptionState(prev => {
                const updated = { ...prev };
                delete updated['Setup.axisSetup.performanceIndicatorBase'];
                return updated;
            });
        }
    }, [axisSetup.target]);

    const toggleAccordion = useCallback((key: string) => {
        setExpandedAccordions(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);



    const resetWidgetConfigApi = async () => {
        try {
            const widget = await getFirstWidget(TabId);

            if (widget === null)
                return

            const response = await dispatch(resetWidgetConfiguration({
                kpiIdsCsv: String(`${widget.kpiId}`),
                visualTypeId: widget.widgetVisualTypeId,
                widgetId: String(`${widget.widgetId}`)
            })).unwrap();
            if (response === "Success") {
                handleReset(true)
            }
        } catch (error: any) {
            logError(error);
        }
    }

    const handleReset = useCallback((resetInParentClass: boolean = false) => {
        editingConfigRef.current = { ...savedConfigRef.current };
        setProjectionEnabled((savedConfigRef.current.projectionEnabled as boolean) ?? false);

        const state: Record<string, any> = widgetConfig?.widgetOptions
            ? buildOptionStateWithPaths(widgetConfig.widgetOptions)
            : {};

        const defaultTitleValue = optionState['Setup.Header.Title'] ? optionState['Setup.Header.Title'].raw.defaultValue : titleLabel;
        const isDefaultState = chartState === 'empty' || chartState === 'invalid';

        const ensureNode = (path: string, title: string, value: any, extraProps: Record<string, any> = {}) => {
            state[path] ??= { path, title, value, visible: true, disabled: false, error: null, ...extraProps };
        };

        ensureNode('Setup.Header.Title', 'Title', defaultTitleValue);
        ensureNode('Setup.Header.Sub-title', 'Sub-title', false);
        ensureNode('Setup.Header.Sub-title.Sub-title Text', 'Sub-title Text', '');
        ensureNode('Setup.Header.AppliedFilters', 'AppliedFilters', isDefaultState);
        ensureNode('Setup.Header.Insights', 'Insights', isDefaultState);
        ensureNode('Setup.Header.Link', 'Link', false);
        ensureNode('Setup.Header.Link.Link Text', 'Link Text', '', { options: [] });
        ensureNode('Setup.Projections', 'Projections', false);
        ensureNode('Setup.To Date Values.MTD', 'MTD', true);
        ensureNode('Setup.To Date Values.QTD', 'QTD', false);
        ensureNode('Setup.To Date Values.YTD', 'YTD', true);
        ensureNode('Setup.To Date Values.Comparison of', 'Comparison of', [], { options: ['MTD', 'QTD', 'YTD'] });
        ensureNode('Setup.To Date Values.Compare with', 'Compare with', 'Previous', { options: ['Previous', 'Target BP'] });

        const config = savedConfigRef.current;
        if (Object.keys(config).length > 0) {

            state['Setup.Header.Title'].value =
                config.titleLabel === 'KPI Name' ? 'this is demo' : (config.titleLabel ?? defaultTitleValue);

            state['Setup.Header.Sub-title'].value = config.showSubtitle ?? false;
            state['Setup.Header.Sub-title.Sub-title Text'].value = config.subtitle ?? '';
            state['Setup.Header.AppliedFilters'].value = config.showAppliedFilters ?? isDefaultState;
            state['Setup.Header.Insights'].value = config.showInsightsButton ?? isDefaultState;
            state['Setup.Header.Link'].value = config.showLinkButton ?? false;
            state['Setup.Header.Link.Link Text'].value = config.linkHref ?? '';
            state['Setup.Projections'].value = config.projectionEnabled ?? false;

            const toDateConfig = config.toDateConfig as any;
            if (toDateConfig) {
                state['Setup.To Date Values.MTD'].value = Boolean(toDateConfig.mtd ?? true);
                state['Setup.To Date Values.QTD'].value = Boolean(toDateConfig.qtd ?? false);
                state['Setup.To Date Values.YTD'].value = Boolean(toDateConfig.ytd ?? true);
                state['Setup.To Date Values.Comparison of'].value = toDateConfig.comparisons || [];
                state['Setup.To Date Values.Compare with'].value = toDateConfig.compareWith || 'Previous';
            }
        }

        // Restore chart type to the last saved/initial value
        const resetChartType = (savedConfigRef.current.chartType as string)
            || (initialConfig?.chartType as string)
            || 'column';
        setSelectedChartTypeStr(resetChartType);

        setOptionState(state);
        setAxisSetup({
            yAxis: [],
            secondaryYAxis: [],
            xAxis: [],
            target: [],
            performanceIndicatorBase: '',
        });

        setExpandedAccordions(new Set());
        setActivePanelTab(SETUP_TAB);
        setDataFieldsValue(widgetConfig ? (state['Data Fields']?.options || fields) : fields);
        setOpenDataFieldFlyOut(false);
        if (resetInParentClass) {
            onSave?.(state);
        }
    }, [widgetConfig, titleLabel, chartState]);

    const buildChartConfig = (): Record<string, unknown> => {
        const selectedTargetBaseRaw =
            optionState['Setup.axisSetup.performanceIndicatorBase']?.value;

        const selectedTargetBase =
            typeof selectedTargetBaseRaw === 'string' ? selectedTargetBaseRaw : undefined;

        const titleValue = String(optionState['Setup.Header.Title']?.value || '');
        const subtitleToggle = Boolean(optionState['Setup.Header.Sub-title']?.value);
        const rawSubtitle = optionState['Setup.Header.Sub-title.Sub-title Text']?.value;
        const subtitleText = rawSubtitle != null ? String(rawSubtitle) : '';

        const linkToggle = Boolean(optionState['Setup.Header.Link']?.value);
        const linkUrl = String(optionState['Setup.Header.Link.Link Text']?.value || '');

        let unit = String(optionState['Styling.Unit Format.Available Units']?.value ?? 'Auto');

        if (unit.toLowerCase() === 'auto') {
            unit = '';
        } else {
            const unitMap: Record<string, string> = {
                'Percentage (%)': '%',
                'Thousand (K)': 'K',
                'Millions (M)': 'M',
                'Billions (B)': 'B',
            };

            unit = unitMap[unit] ?? unit;
        }

        const gridLinesRaw = optionState['Styling.Others.Gridlines']?.value ?? ['V'];
        const selectedGridlines = Array.isArray(gridLinesRaw)
            ? gridLinesRaw.map(String)
            : typeof gridLinesRaw === 'string'
                ? [gridLinesRaw]
                : [];

        const xAxisValue = optionState['Setup.axisSetup.xAxis']?.value;
        const yAxisValue = optionState['Setup.axisSetup.yAxis']?.value;

        return {
            titleLabel: titleValue.trim() || titleLabel,
            showSubtitle: subtitleToggle,
            subtitle: subtitleText,
            showAppliedFilters: Boolean(optionState['Setup.Header.AppliedFilters']?.value ?? true),
            showInsightsButton: Boolean(optionState['Setup.Header.Insights']?.value ?? true),
            showLinkButton: linkToggle && Boolean(linkUrl),
            linkHref: linkUrl || undefined,

            projectionEnabled,
            chartType: selectedChartType,

            axisConfig: {
                yAxis: axisSetup.yAxis,
                secondaryYAxis: axisSetup.secondaryYAxis,
                xAxis: axisSetup.xAxis,
                target: axisSetup.target,
                performanceIndicatorBase: selectedTargetBase,
            },

            userSelections: {
                xAxisDropdown: Boolean(optionState['Setup.UserSelections.XAxisDropdown']?.value),
                xAxisDrilldown: Boolean(optionState['Setup.UserSelections.XAxisDrilldown']?.value),
                targetLineDropdown: Boolean(optionState['Setup.UserSelections.TargetLineDropdown']?.value),
                projectionButton: Boolean(optionState['Setup.UserSelections.Projection']?.value),
            },

            toDateConfig: {
                mtd: Boolean(optionState['Setup.To Date Values.MTD']?.value ?? true),
                qtd: Boolean(optionState['Setup.To Date Values.QTD']?.value ?? false),
                ytd: Boolean(optionState['Setup.To Date Values.YTD']?.value ?? true),
                comparisons:
                    (optionState['Setup.To Date Values.Comparison of']?.value as string[]) || [],
                compareWith: String(
                    optionState['Setup.To Date Values.Compare with']?.value || 'Previous',
                ),
            },

            unit,
            decimalPlaces: Number(optionState['Styling.Unit Format.Decimal Places']?.value ?? 0),
            xAxisLabel: Array.isArray(xAxisValue) ? xAxisValue.join(', ') : String(xAxisValue ?? ''),
            yAxisLabel: Array.isArray(yAxisValue) ? yAxisValue.join(', ') : String(yAxisValue ?? ''),
            showYAxis: Boolean(optionState['Styling.Y-Axis.Show Axis']?.value ?? true),
            xAxisAngle: Number(optionState['Styling.X-Axis.X-Axis Angle']?.value ?? 0),
            showValueLabel: Boolean(optionState['Styling.Data Labels.Value Label']?.value ?? false),
            showTotalLabel: Boolean(optionState['Styling.Data Labels.Total Label']?.value ?? true),
            showLegend: Boolean(optionState['Styling.Others.Legend']?.value ?? true),
            showVerticalGridLines: selectedGridlines.includes('V'),
            showHorizontalGridLines: selectedGridlines.includes('H'),
            showYAxisLabels: Boolean(optionState['Styling.Y-Axis.Axis Lable']?.value ?? false),
            showXAxisLabels: Boolean(optionState['Styling.X-Axis.Axis Label']?.value ?? false),
        };
    };
    const handleSaveChart = useCallback(async () => {
        const config = buildChartConfig();

        savedConfigRef.current = config;

        await saveConfiguration();

        onSave?.(config);
        onClose();
    }, [
        optionState,
        axisSetup,
        projectionEnabled,
        selectedChartType,
        titleLabel,
        onSave,
        onClose,
    ]);

    const handleClose = useCallback(() => {
        handleReset();
        onClose();
    }, [handleReset, onClose]);
    const renderPreview = () => {
        if (Object.keys(optionState).length === 0) {
            return <>{previewGraphic}</>;
        }

        const selectedTargetBaseRaw =
            optionState['Setup.axisSetup.performanceIndicatorBase']?.value;

        const selectedTargetBase: string | undefined =
            typeof selectedTargetBaseRaw === 'string' ? selectedTargetBaseRaw : undefined;

        const axisConfig = {
            yAxis: axisSetup.yAxis,
            secondaryYAxis: axisSetup.secondaryYAxis,
            xAxis: axisSetup.xAxis,
            target: axisSetup.target,
            performanceIndicatorBase: selectedTargetBase,
        };

        const isAxisEmpty = axisConfig && (axisConfig.yAxis.length === 0 || axisConfig.xAxis.length === 0);

        const titleValue = String(optionState['Setup.Header.Title']?.value ?? '');
        const subtitleToggle = Boolean(optionState['Setup.Header.Sub-title']?.value);
        const rawSubtitleValue =
            optionState['Setup.Header.Sub-title.Sub-title Text']?.value;
        const subtitleText =
            rawSubtitleValue != null ? String(rawSubtitleValue) : '';


        let unit = String(optionState[`Styling.Unit Format.Available Units`]?.value);
        if (unit.toLowerCase() === "auto") {
            unit = "";
        } else {
            const unitMap: Record<string, string> = {
                "Percentage (%)": "%",
                "Thousand (K)": "K",
                "Millions (M)": "M",
                "Billions (B)": "B",
            };

            unit = unitMap[unit] ?? unit;
        }
        const decimalPlaces = Number(optionState['Styling.Unit Format.Decimal Places']?.value ?? 0) as 0 | 1 | 2 | 3;
        const xAxisLabel = String(optionState[`Setup.axisSetup.xAxis`]?.value);
        const yAxisLabel = String(optionState[`Setup.axisSetup.yAxis`]?.value);
        const showXAxisLabels = Boolean(optionState[`Styling.X-Axis.Axis Label`]?.value ?? false);
        const showYAxisLabels = Boolean(optionState[`Styling.Y-Axis.Axis Lable`]?.value ?? false);
        const showYaxisValue = Boolean(optionState[`Styling.Y-Axis.Show Axis`]?.value ?? true)
        const xAxisAngleValue = Number(optionState['Styling.X-Axis.X-Axis Angle']?.value ?? 0) as 0 | 45 | 90;
        const valueLabelsValue = Boolean(optionState[`Styling.Data Labels.Value Label`]?.value ?? false);
        const totalLabelsValue = Boolean(optionState[`Styling.Data Labels.Total Label`]?.value ?? true);
        const legendValue = Boolean(optionState[`Styling.Others.Legend`]?.value ?? true)
        const gridLinesValue = String(
            optionState['Styling.Others.Gridlines']?.value ?? 'V'
        );

        const showVerticalGridLines = gridLinesValue.includes('V');
        const showHorizontalGridLines = gridLinesValue.includes('H');

        return (
            <div className={styles['preview-chart']}>

                {isAxisEmpty ? <>







                    <ColumnChartWithCustomizeHeader
                        // Title / subtitle / filters
                        title={titleValue.trim() || titleLabel}
                        showTitle={true}
                        showSubtitle={subtitleToggle}
                        subtitle={subtitleToggle ? subtitleText : undefined}
                        appliedFilters={optionState?.["Setup.Header.AppliedFilters"]?.value as boolean ? staticAppliedFilterData : {}}
                        showInsightsButton={optionState?.["Setup.Header.Insights"]?.value as boolean}
                        showLinkButton={optionState?.["Setup.Header.Link"]?.value as boolean}
                    >
                        {buildEmptyChartPlaceholder(selectedChartType as ChartTypeString, 'empty', true)}
                    </ColumnChartWithCustomizeHeader>

                </> : <TemplateSkeleton
                    titleLabel={titleValue.trim() || titleLabel}
                    showSubtitle={subtitleToggle}
                    subtitle={subtitleToggle ? subtitleText : undefined}
                    showAppliedFilters={optionState?.["Setup.Header.AppliedFilters"]?.value as boolean}
                    showInsightsButton={optionState?.["Setup.Header.Insights"]?.value as boolean}
                    showLinkButton={optionState?.["Setup.Header.Link"]?.value as boolean}
                    linkHref={optionState?.["Setup.Header.Link.Link Text"]?.value as string}
                    setXaxisSetUp={(v: ISwitchProps[]) => {

                        setAxisSetup(prev => ({
                            ...prev,
                            xAxis: v
                                .map((x): FieldItem | null => {
                                    const existingItem = prev.xAxis.find(
                                        item => item.id === x.key || item.label === x.key || item.label === x.label
                                    );

                                    if (!existingItem) return null;

                                    return {
                                        ...existingItem,
                                        eyeOpen: x.checked,
                                        selected_value: x.selected_value?.toString() ?? existingItem.selected_value
                                    };
                                })
                                .filter((item): item is FieldItem => item !== null),
                        }));
                    }}
                    targetDropdownOptions={
                        axisSetup?.target?.map((e: FieldItem) => ({
                            label: String(e.label ?? ''),
                            value: String(e.id ?? ''),
                            disabled: false,
                        })) ?? []
                    }
                    projectionEnabled={projectionEnabled}
                    axisConfig={axisConfig}
                    selectedChartType={selectedChartType}

                    xaxisDataOption={axisSetup.xAxis}
                    userSelections={{
                        xAxisDropdown: Boolean(optionState['Setup.UserSelections.XAxisDropdown']?.value),
                        xAxisDrilldown: Boolean(optionState['Setup.UserSelections.XAxisDrilldown']?.value),
                        targetLineDropdown: Boolean(optionState['Setup.UserSelections.TargetLineDropdown']?.value),
                        projectionButton: Boolean(optionState['Setup.UserSelections.Projection']?.value),
                    }}

                    toDateConfig={{
                        mtd: Boolean(optionState['Setup.To Date Values.MTD']?.value),
                        qtd: Boolean(optionState['Setup.To Date Values.QTD']?.value),
                        ytd: Boolean(optionState['Setup.To Date Values.YTD']?.value),
                        comparisons:
                            (optionState['Setup.To Date Values.Comparison of']?.value as string[]) ?? [],
                        compareWith: String(
                            optionState['Setup.To Date Values.Compare with']?.value ?? 'Previous',
                        ),
                    }}
                    xAxisLabel={xAxisLabel}
                    yAxisLabel={yAxisLabel}

                    showYAxis={showYaxisValue}
                    xAxisAngle={xAxisAngleValue}
                    showValueLabel={valueLabelsValue}
                    showTotalLabel={totalLabelsValue}
                    showLegend={legendValue}
                    showVerticalGridLines={showVerticalGridLines}
                    showHorizontalGridLines={showHorizontalGridLines}
                    showYAxisLabels={showYAxisLabels}
                    showXAxisLabels={showXAxisLabels}
                    unit={unit}
                    decimalPlaces={decimalPlaces}
                />}
            </div>
        );
    };

    const dropItemOnXAxis = (item: FieldItem) => {

        setAxisSetup(prev => {
            // keep only ONE "eyeOpen" true at a time
            const previous = prev.xAxis.map(x => ({ ...x, eyeOpen: false }));
            const updated = [...previous, { ...item, eyeOpen: true }];

            handleOptionChange('Setup.axisSetup.xAxis', updated.map(i => i.label));
            return { ...prev, xAxis: updated };
        });
    };
    const normalizeXAxis = (items: FieldItem[], prevXAxis: FieldItem[] = []) => {


        let updated = items.map((item) => {
            const existingItem = prevXAxis.find(x => x.id === item.id);

            return {
                ...item,
                source:
                    item.source === "DATA_FIELD" || !item.source || item.source === ""
                        ? "xAxis"
                        : item.source,
                display: item.label, // important: no Target/Tolerance for xAxis
                eyeOpen: existingItem ? existingItem.eyeOpen : false,
            };
        });

        const hasOpen = updated.some(item => item.eyeOpen);

        // If no item is open, make first item open
        if (!hasOpen && updated.length > 0) {
            updated = updated.map((item, index) => ({
                ...item,
                eyeOpen: index === 0,
            }));
        }

        return updated;
    };
    const handleYaxisEye = () => {
        setAxisSetup(prev => {
            const firstOpenIndex = prev.yAxis.findIndex(
                item => item.eyeOpen
            );

            const activeIndex =
                firstOpenIndex === -1 ? 0 : firstOpenIndex;

            return {
                ...prev,
                yAxis: prev.yAxis.map((item, index) => ({
                    ...item,
                    eyeOpen: index === activeIndex,
                })),
            };
        });
    };
    const renderSetupContent = () => (
        <Flex vertical gap={0} className={styles['setup-accordions']}>
            {SETUP_ACCORDIONS.map(({ key, title }) => {
                if (key === 'header') {
                    return (
                        <div key={key} className={styles['']}>
                            <Accordion
                                title="Header"
                                outlined={false}
                                isExpanded={expandedAccordions.has(key)}
                                leftRightSpaceZero
                                onToggle={() => toggleAccordion(key)}
                                className={styles['setup-accordion']}
                            >
                                <Flex vertical gap={14} className={styles['setup-flex']}>
                                    {/* Title */}

                                    <Label type="body3">
                                        {String(optionState['Setup.Header.Title']?.title ?? 'Title')}
                                    </Label>
                                    <InputField
                                        value={String(optionState['Setup.Header.Title']?.value || '')}
                                        placeholder="Enter title"
                                        onChange={e =>
                                            handleOptionChange('Setup.Header.Title', e.target.value)
                                        }
                                        className="input-field"
                                    />

                                    {/* Sub Title */}

                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(
                                                optionState['Setup.Header.Sub-title']?.title ?? 'Sub-title',
                                            )}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.Header.Sub-title']?.value,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.Header.Sub-title', v)
                                            }
                                        />
                                    </Flex>

                                    {Boolean(optionState['Setup.Header.Sub-title']?.value) && (
                                        <InputField
                                            placeholder="Enter Subtitle"
                                            value={String(
                                                optionState['Setup.Header.Sub-title.Sub-title Text']?.value || '',
                                            )}
                                            onChange={e =>
                                                handleOptionChange(
                                                    'Setup.Header.Sub-title.Sub-title Text',
                                                    e.target.value,
                                                )
                                            }
                                            className="input-field"
                                        />
                                    )}

                                    {/* Applied Filters */}

                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(
                                                optionState['Setup.Header.AppliedFilters']?.title ??
                                                'AppliedFilters',
                                            )}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.Header.AppliedFilters']?.value ?? true,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.Header.AppliedFilters', v)
                                            }
                                        />
                                    </Flex>

                                    {/* Insights */}

                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(
                                                optionState['Setup.Header.Insights']?.title ?? 'Insights',
                                            )}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.Header.Insights']?.value ?? true,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.Header.Insights', v)
                                            }
                                        />
                                    </Flex>

                                    {/* Link */}

                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(optionState['Setup.Header.Link']?.title ?? 'Link')}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.Header.Link']?.value,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.Header.Link', v)
                                            }
                                        />
                                    </Flex>

                                    {Boolean(optionState['Setup.Header.Link']?.value) && (
                                        <>
                                            <Label type="body2">
                                                {String(
                                                    optionState['Setup.Header.Link.Link Text']
                                                        ?.title ?? 'Link Text',
                                                )}
                                            </Label>

                                            <DropDown
                                                id="link-url-dropdown"
                                                dataTestId="link-url-dropdown"
                                                dropdown={{
                                                    selectedOptions: [
                                                        {
                                                            label: String(optionState['Setup.Header.Link.Link Text']?.value || ''),
                                                            value: String(optionState['Setup.Header.Link.Link Text']?.value || '')
                                                        }
                                                    ].filter(opt => opt.value !== ''),
                                                    placeholder: 'Select',
                                                    isDisabled: false,
                                                    isLabelInline: false,
                                                    size: 'L',
                                                    type: 'radio',
                                                    options: mockLinks,
                                                    onChange: option =>
                                                        handleOptionChange(
                                                            'Setup.Header.Link.Link Text',
                                                            option.value,
                                                        ),
                                                }}
                                                dropdownOptionsClassName="link-url-dropdown-options"
                                            />
                                        </>
                                    )}
                                </Flex>
                            </Accordion>
                        </div>
                    );
                }

                if (key === 'to-date-values') {
                    return (
                        <div key={key} className={styles['']}>
                            <Accordion
                                title="To Date Values"
                                outlined={false}
                                isExpanded={expandedAccordions.has(key)}
                                leftRightSpaceZero
                                onToggle={() => toggleAccordion(key)}
                                className={styles['setup-accordion']}
                            >
                                <Flex vertical gap={12} className={styles['setup-flex']}>
                                    {/* MTD */}
                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(
                                                optionState['Setup.To Date Values.MTD']?.title ??
                                                'MTD',
                                            )}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.To Date Values.MTD']?.value,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.To Date Values.MTD', v)
                                            }
                                        />
                                    </Flex>

                                    {/* QTD */}
                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(
                                                optionState['Setup.To Date Values.QTD']?.title ??
                                                'QTD',
                                            )}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.To Date Values.QTD']?.value,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.To Date Values.QTD', v)
                                            }
                                        />
                                    </Flex>

                                    {/* YTD */}
                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(
                                                optionState['Setup.To Date Values.YTD']?.title ??
                                                'YTD',
                                            )}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.To Date Values.YTD']?.value,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.To Date Values.YTD', v)
                                            }
                                        />
                                    </Flex>

                                    {/* Comparison Section */}

                                    <Label type="body3">
                                        {String(
                                            optionState['Setup.To Date Values.Comparison of']
                                                ?.title ?? 'Comparison of',
                                        )}
                                    </Label>

                                    <Flex gap={12}>
                                        {(
                                            optionState['Setup.To Date Values.Comparison of']
                                                ?.options || []
                                        ).map(opt => {
                                            const selectedValues =
                                                (optionState['Setup.To Date Values.Comparison of']
                                                    ?.value as string[]) || [];

                                            return (
                                                <CheckBox
                                                    key={String(opt)}
                                                    label={String(opt)}
                                                    checked={selectedValues.includes(String(opt))}
                                                    onChange={checked => {
                                                        let updatedValues = [...selectedValues];

                                                        if (checked) {
                                                            updatedValues.push(String(opt));
                                                        } else {
                                                            updatedValues = updatedValues.filter(
                                                                v => v !== opt,
                                                            );
                                                        }

                                                        handleOptionChange(
                                                            'Setup.To Date Values.Comparison of',
                                                            updatedValues,
                                                        );
                                                    }}
                                                />
                                            );
                                        })}
                                    </Flex>

                                    {/* Compare With */}
                                    <Label type="body3">
                                        {String(
                                            optionState['Setup.To Date Values.Compare with']
                                                ?.title ?? 'Compare with',
                                        )}
                                    </Label>
                                    <DropDown
                                        className="drop-down"
                                        id="compare-with-dropdown"
                                        dataTestId="compare-with-dropdown"
                                        dropdown={{
                                            placeholder: 'Select',
                                            selectedOptions: (
                                                optionState['Setup.To Date Values.Compare with']
                                                    ?.options || []
                                            )
                                                .filter(
                                                    opt =>
                                                        opt ===
                                                        optionState[
                                                            'Setup.To Date Values.Compare with'
                                                        ]?.value,
                                                )
                                                .map(opt => ({
                                                    label: String(opt),
                                                    value: String(opt),
                                                })),
                                            isDisabled: false,
                                            isLabelInline: false,
                                            size: 'L',
                                            type: 'radio',
                                            options: (
                                                optionState['Setup.To Date Values.Compare with']
                                                    ?.options || []
                                            ).map(opt => ({
                                                label: String(opt),
                                                value: String(opt),
                                            })),
                                            onChange: option =>
                                                handleOptionChange(
                                                    'Setup.To Date Values.Compare with',
                                                    option.value,
                                                ),
                                        }}
                                        dropdownOptionsClassName="compare-with-dropdown-options"
                                    />
                                </Flex>
                            </Accordion>
                        </div>
                    );
                }

                if (key === 'projection') {
                    return (
                        <div className={styles['projection-accordion']}>
                            <Flex
                                align="center"
                                justify="space-between"
                                className={styles['accordion-header-with-switch']}
                            >
                                <span className={styles['projection-label']}>
                                    {String(optionState['Setup.Projections']?.title ?? 'Projections')}
                                </span>
                                <Flex
                                    align="center"
                                    gap={8}
                                    className={styles['projection-controls']}
                                >
                                    <div
                                        className={`${styles['projection-switch-wrapper']} ${projectionEnabled ? styles['projection-switch-active'] : ''}`}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Switch
                                            label=""
                                            isDisable={false}
                                            checked={Boolean(
                                                optionState['Setup.Projections']?.value,
                                            )}
                                            onToggle={(checked: boolean) => {
                                                handleOptionChange('Setup.Projections', checked);
                                                setProjectionEnabled(checked);
                                            }}
                                        />
                                    </div>
                                </Flex>
                            </Flex>
                        </div>
                    );
                }

                if (key === 'chart-type') {
                    return (
                        <div key={key} className={styles['']}>
                            <Accordion
                                title="Chart Type"
                                outlined={false}
                                isExpanded={expandedAccordions.has(key)}
                                leftRightSpaceZero
                                onToggle={() => toggleAccordion(key)}
                                className={styles['setup-accordion']}
                            >
                                <div key={key} className={styles['setup-flex']}>
                                    <Flex vertical gap={12} wrap>
                                        <Label type="body3">
                                            Select a chart type to customize as per your needs:
                                        </Label>
                                        <Flex
                                            vertical
                                            gap={12}
                                            className={styles['chart-category']}
                                        >
                                            <Label type="body2">Column Chart</Label>
                                            <Flex gap={12}>
                                                <ChartTypeButton
                                                    icon={<ClusteredColumnIcon />}
                                                    onClick={() => { selectChartType('column'); handleYaxisEye() }}
                                                    isSelected={selectedChartType === 'column'}
                                                    size={56}
                                                />
                                                <ChartTypeButton
                                                    icon={<StackedColumnIcon />}
                                                    onClick={() => selectChartType('column-2')}
                                                    isSelected={selectedChartType === 'column-2'}
                                                    size={56}
                                                />
                                                <ChartTypeButton
                                                    icon={<Stacked100ColumnIcon />}
                                                    onClick={() => selectChartType('column-3')}
                                                    isSelected={selectedChartType === 'column-3'}
                                                    size={56}
                                                />
                                            </Flex>
                                        </Flex>

                                        <Flex
                                            vertical
                                            gap={12}
                                            className={styles['chart-category']}
                                        >
                                            <Label type="body2">Bar Chart</Label>
                                            <Flex gap={12}>
                                                <ChartTypeButton
                                                    icon={<ClusteredBarIcon />}
                                                    onClick={() => { selectChartType('bar'); handleYaxisEye() }}
                                                    isSelected={selectedChartType === 'bar'}
                                                    size={56}
                                                />
                                                <ChartTypeButton
                                                    icon={<StackedBarIcon />}
                                                    onClick={() => selectChartType('stacked-bar')}
                                                    isSelected={selectedChartType === 'stacked-bar'}
                                                    size={56}
                                                />
                                                <ChartTypeButton
                                                    icon={<Stacked100BarIcon />}
                                                    onClick={() => { selectChartType('grouped-bar') }}
                                                    isSelected={selectedChartType === 'grouped-bar'}
                                                    size={56}
                                                />
                                            </Flex>
                                        </Flex>

                                        <Flex
                                            vertical
                                            gap={12}
                                            className={styles['chart-category']}
                                        >
                                            <Label type="body2">Line Chart</Label>
                                            <Flex gap={12}>
                                                <ChartTypeButton
                                                    icon={<SingleLineIcon />}
                                                    onClick={() => selectChartType('line')}
                                                    isSelected={selectedChartType === 'line'}
                                                    size={56}
                                                />
                                                <ChartTypeButton
                                                    icon={<MultiLineIcon />}
                                                    onClick={() => { selectChartType('stacked-line'); handleYaxisEye() }}
                                                    isSelected={selectedChartType === 'stacked-line'}
                                                    size={56}
                                                />
                                            </Flex>
                                        </Flex>

                                        <Flex
                                            vertical
                                            gap={12}
                                            className={styles['chart-category']}
                                        >
                                            <Label type="body2">Area Chart</Label>
                                            <Flex gap={12}>
                                                <ChartTypeButton
                                                    icon={<FilledAreaIcon />}
                                                    onClick={() => { selectChartType('area'); handleYaxisEye() }}
                                                    isSelected={selectedChartType === 'area'}
                                                    size={56}
                                                />
                                                <ChartTypeButton
                                                    icon={<OverlayAreaIcon />}
                                                    onClick={() => selectChartType('stacked-area')}
                                                    isSelected={selectedChartType === 'stacked-area'}
                                                    size={56}
                                                />
                                            </Flex>
                                        </Flex>
                                    </Flex>
                                </div>
                            </Accordion>
                        </div>
                    );
                }

                if (key === 'axis-Setup') {
                    return (
                        <div key={key} className={styles['']}>
                            <Accordion
                                title="Axis Setup"
                                outlined={false}
                                isExpanded={expandedAccordions.has(key)}
                                leftRightSpaceZero
                                onToggle={() => toggleAccordion(key)}
                                className={styles['setup-accordion']}
                            >
                                <Flex vertical gap={16} className={styles['setup-flex']}>
                                    {/* Y Axis */}
                                    <div className={styles.axisBlock}>
                                        <span className={styles.axisLabel}>{selectedChartType.includes("bar") ? "X-Axis" : "Y-Axis"}</span>
                                        <DropZone
                                            xAxis={selectedChartType === "area" ||
                                                selectedChartType === "column" ||
                                                selectedChartType === "line" || axisSetup.yAxis.filter(e => e.eyeOpen).length === 1}
                                            setIsEyeOpenInParent={(isEyeOpen: boolean, label: string) => {
                                                if (
                                                    selectedChartType === "area" ||
                                                    selectedChartType === "column" ||
                                                    selectedChartType === "line" ||
                                                    selectedChartType === "bar"
                                                ) {
                                                    // Single select
                                                    setAxisSetup(prev => ({
                                                        ...prev,
                                                        yAxis: prev.yAxis.map(item => ({
                                                            ...item,
                                                            eyeOpen: item.label === label,
                                                        })),
                                                    }));
                                                } else {
                                                    // Multi select but at least one must remain true
                                                    setAxisSetup(prev => {
                                                        const currentItem = prev.yAxis.find(
                                                            item => item.label === label
                                                        );

                                                        const activeCount = prev.yAxis.filter(
                                                            item => item.eyeOpen
                                                        ).length;

                                                        return {
                                                            ...prev,
                                                            yAxis: prev.yAxis.map(item => {
                                                                if (item.label !== label) {
                                                                    return item;
                                                                }

                                                                // Don't allow turning off the last active item
                                                                if (
                                                                    currentItem?.eyeOpen &&
                                                                    activeCount === 1 &&
                                                                    !isEyeOpen
                                                                ) {
                                                                    return item;
                                                                }

                                                                return {
                                                                    ...item,
                                                                    eyeOpen: isEyeOpen,
                                                                };
                                                            }),
                                                        };
                                                    });
                                                }
                                            }
                                            }
                                            dataFieldType={["Measure"]}

                                            setAxisSetup={(e) => {

                                                setAxisSetup(prev => {
                                                    const updated = normalizeXAxis(e, prev.yAxis || []);

                                                    return {
                                                        ...prev,
                                                        yAxis: updated,
                                                    };
                                                });
                                            }}
                                            onBtnClick={() => setOpenDataFieldFlyOut(true)}
                                            axisSetup={axisSetup}
                                            items={axisSetup.yAxis}
                                            onDropItem={(item) => {
                                                setAxisSetup(prev => {
                                                    if (prev.yAxis.length >= 1) {
                                                        return prev;
                                                    }
                                                    const updated = [...prev.yAxis, item];

                                                    handleOptionChange(
                                                        'Setup.axisSetup.yAxis',
                                                        updated.map(i => i.label)
                                                    );

                                                    return {
                                                        ...prev,
                                                        yAxis: updated,
                                                    };
                                                });
                                            }

                                            }
                                            optionKey="Setup.axisSetup.yAxis"
                                            handleOptionChange={handleOptionChange}
                                        />
                                    </div>

                                    {/* Secondary Y Axis */}
                                    <div className={styles.axisBlock}>
                                        <span className={styles.axisLabel}>{selectedChartType.includes("bar") ? "Secondary X-Axis" : "Secondary Y-Axis"}</span>

                                        {axisSetup.yAxis.length === 0 ? (
                                            <p className={styles.dualAxisDisabled}>
                                                Dual axis set up is disabled as primary y-axis is not selected
                                            </p>
                                        ) : (
                                            <DropZone

                                                setIsEyeOpenInParent={() => { }}
                                                dataFieldType={["Measure"]}

                                                setAxisSetup={(e) => {
                                                    setAxisSetup(prev => ({
                                                        ...prev,
                                                        secondaryYAxis: e,

                                                    }));
                                                }}
                                                onBtnClick={() => setOpenDataFieldFlyOut(true)}
                                                axisSetup={axisSetup}
                                                items={axisSetup.secondaryYAxis}
                                                onDropItem={(item) => {
                                                    setAxisSetup(prev => {
                                                        const updated = [...prev.secondaryYAxis, item];

                                                        handleOptionChange(
                                                            'Setup.axisSetup.secondaryYAxis',
                                                            updated.map(i => i.label)
                                                        );

                                                        return {
                                                            ...prev,
                                                            secondaryYAxis: updated,
                                                        };
                                                    });
                                                }

                                                }
                                                optionKey="Setup.axisSetup.secondaryYAxis"
                                                handleOptionChange={handleOptionChange}
                                            />
                                        )}
                                    </div>

                                    {/* X Axis */}
                                    <div className={styles.axisBlock}>
                                        <span className={styles.axisLabel}>{selectedChartType.includes("bar") ? "Y-Axis" : "X-Axis"}</span>

                                        <DropZone
                                            setIsEyeOpenInParent={(isEyeOpen: boolean, label: string) => {

                                                setAxisSetup(prev => ({
                                                    ...prev,
                                                    xAxis: prev.xAxis.map(item => ({
                                                        ...item,
                                                        eyeOpen: item.label === label ? isEyeOpen : false,
                                                    })),
                                                }));
                                            }}
                                            xAxis={true}
                                            dataFieldType={["Geography", "Time", "Dimension"]}

                                            setAxisSetup={(e) => {
                                                setAxisSetup(prev => {
                                                    const updated = normalizeXAxis(e, prev.xAxis || []);

                                                    return {
                                                        ...prev,
                                                        xAxis: updated,
                                                    };
                                                });
                                            }}

                                            onBtnClick={() => setOpenDataFieldFlyOut(true)}
                                            axisSetup={axisSetup}
                                            items={axisSetup.xAxis}
                                            onDropItem={(item) => {

                                                setAxisSetup(prev => ({
                                                    ...prev,
                                                    xAxis: [
                                                        ...prev.xAxis,
                                                        {
                                                            ...item,
                                                            source: "xAxis",
                                                        }
                                                    ]
                                                }));
                                            }}
                                            optionKey="Setup.axisSetup.xAxis"
                                            handleOptionChange={handleOptionChange}

                                        />
                                    </div>

                                    {/* Target */}
                                    <div className={styles.axisBlock}>
                                        <span className={styles.axisLabel}>Target</span>

                                        <DropZone
                                            setIsEyeOpenInParent={() => { }}
                                            dataFieldType={["Target", "Tolerance"]}
                                            dataFieldId={[
                                                ...axisSetup.yAxis.map(e => e.id),
                                                ...axisSetup.target
                                                    .filter(e => e.type === "Target")
                                                    .map(e => e.id)
                                            ]}
                                            setAxisSetup={(e) => {
                                                setAxisSetup(prev => ({
                                                    ...prev,
                                                    target: e
                                                }));

                                            }}
                                            hideIcon={true}
                                            onBtnClick={() => setOpenDataFieldFlyOut(true)}
                                            axisSetup={axisSetup}
                                            items={axisSetup.target}
                                            onDropItem={(item) => {
                                                setAxisSetup(prev => {
                                                    let updated = [...prev.target, item];
                                                    updated = updated.map((t, idx) => ({
                                                        ...t,
                                                        display:
                                                            idx % 2 === 0
                                                                ? `${t.label}`
                                                                : `${t.label}`,
                                                    }));

                                                    handleOptionChange(
                                                        'Setup.axisSetup.target',
                                                        updated.map(i => i.label),
                                                    );

                                                    return {
                                                        ...prev,
                                                        target: updated,
                                                    };
                                                });
                                            }}
                                            optionKey="Setup.axisSetup.target"
                                            handleOptionChange={handleOptionChange}
                                        />
                                    </div>

                                    {/* Performance Indicator */}
                                    <div>
                                        <Label type="body3">
                                            {
                                                optionState[
                                                    'Setup.axisSetup.performanceIndicatorBase'
                                                ]?.title ?? 'Show Performance Indicators Based On'
                                            }
                                        </Label>

                                        <DropDown
                                            id="performance-indicator-dropdown"
                                            dataTestId="performance-indicator-dropdown"
                                            dropdown={{
                                                selectedOptions: (
                                                    optionState[
                                                        'Setup.axisSetup.performanceIndicatorBase'
                                                    ]?.options || []
                                                )
                                                    .filter(
                                                        opt =>
                                                            opt ===
                                                            optionState[
                                                                'Setup.axisSetup.performanceIndicatorBase'
                                                            ]
                                                                ?.value,
                                                    )
                                                    .map(opt => ({
                                                        label: String(opt),
                                                        value: String(opt),
                                                    })),
                                                isDisabled: false,
                                                isLabelInline: false,
                                                placeholder: 'Select',
                                                size: 'L',
                                                type: 'radio',
                                                options: (
                                                    optionState[
                                                        'Setup.axisSetup.performanceIndicatorBase'
                                                    ]?.options || []
                                                ).map(opt => ({
                                                    label: String(opt),
                                                    value: String(opt),
                                                })),
                                                onChange: option =>
                                                    handleOptionChange(
                                                        'Setup.axisSetup.performanceIndicatorBase',
                                                        option.value,
                                                    ),
                                            }}
                                            dropdownOptionsClassName="performance-indicator-dropdown-options"
                                        />
                                    </div>
                                </Flex>
                            </Accordion>
                        </div>
                    );
                }


                if (key === 'user-selections') {
                    return (
                        <div key={key}>
                            <Accordion
                                title="User Selections"
                                outlined={false}
                                isExpanded={expandedAccordions.has(key)}
                                leftRightSpaceZero
                                onToggle={() => toggleAccordion(key)}
                                className={styles['setup-accordion']}
                            >
                                <div className={styles['setup-flex']}>

                                    {/* X-Axis Dropdown */}
                                    <div className={styles.userSelectiontoggleRow}>
                                        <span className={styles.switchlabel}>{selectedChartType.includes("bar") ? 'Y-Axis Dropdown' : 'X-Axis Dropdown'}  </span>
                                        <Switch
                                            checked={Boolean(optionState['Setup.UserSelections.XAxisDropdown']?.value ?? false)}
                                            isDisable={!hasMultipleXAxis}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.UserSelections.XAxisDropdown', v)
                                            }
                                        />
                                    </div>

                                    {/* X-Axis Drilldown */}
                                    {!selectedChartType.includes("bar") && <div className={styles.userSelectiontoggleRow}>
                                        <span className={styles.switchlabel}>X-Axis Drilldown</span>
                                        <Switch
                                            checked={Boolean(optionState['Setup.UserSelections.XAxisDrilldown']?.value ?? false)}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.UserSelections.XAxisDrilldown', v)
                                            }
                                        />
                                    </div>}

                                    {/* Target Line Dropdown */}
                                    <div className={styles.userSelectiontoggleRow}>
                                        <span className={styles.switchlabel}>Target Line Dropdown</span>
                                        <Switch
                                            checked={Boolean(optionState['Setup.UserSelections.TargetLineDropdown']?.value ?? false)}
                                            isDisable={!hasTargets}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.UserSelections.TargetLineDropdown', v)
                                            }
                                        />
                                    </div>

                                    {/* Projection Button */}
                                    <div className={styles.userSelectiontoggleRow}>
                                        <span className={styles.switchlabel}>Projection Button</span>
                                        <Switch
                                            checked={Boolean(optionState['Setup.UserSelections.Projection']?.value ?? false)}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.UserSelections.Projection', v)
                                            }
                                        />
                                    </div>

                                </div>
                            </Accordion>
                        </div>
                    );
                }


                return (
                    <div key={key} className={styles['accordion-item']}>
                        <Accordion
                            title={title}
                            outlined={false}
                            isExpanded={expandedAccordions.has(key)}
                            leftRightSpaceZero
                            onToggle={() => toggleAccordion(key)}
                            className={styles['setup-accordion']}
                        >
                            <div className={styles['accordion-placeholder']}>
                                <Label type="body3">
                                    <span className={styles['placeholder-text']}>
                                        {title} configuration options
                                    </span>
                                </Label>
                            </div>
                        </Accordion>
                    </div>
                );
            })}
        </Flex>
    );

    const renderStylingContent = () => (
        <Flex vertical gap={0} className={styles['styling-accordions']}>
            {STYLING_ACCORDIONS.map(({ key, title }) => {
                if (key === 'styling-unit-format') {
                    const baseKey = 'Styling.Unit Format';

                    const apiUnitOptions =
                        optionState[`${baseKey}.Available Units`]?.options?.filter(
                            (opt): opt is string => typeof opt === 'string',
                        );

                    const unitOptions =
                        apiUnitOptions?.length
                            ? apiUnitOptions
                            : defaultUnitOptions;

                    const apiDecimalOptions =
                        optionState[`${baseKey}.Decimal Places`]?.options;

                    const decimalOptions =
                        apiDecimalOptions?.length
                            ? apiDecimalOptions.map(opt => ({
                                value: String(opt),
                            }))
                            : defaultDecimalOptions;

                    return (
                        <div key={key}>
                            <Accordion
                                title={title}
                                outlined={false}
                                isExpanded={expandedAccordions.has(key)}
                                leftRightSpaceZero
                                onToggle={() => toggleAccordion(key)}
                                className={styles['setup-accordion']}
                            >
                                <Flex vertical gap={12}>
                                    {/* Available Units */}
                                    <Label type="body3">
                                        {optionState[`${baseKey}.Available Units`]?.title ?? "Available Units"}
                                    </Label>

                                    {unitOptions.map(
                                        opt => (
                                            <Radio
                                                key={opt}
                                                label={opt}
                                                value={opt}
                                                checked={
                                                    (optionState[`${baseKey}.Available Units`]?.value ?? "Auto") === opt
                                                }
                                                onChange={() =>
                                                    handleOptionChange(
                                                        `${baseKey}.Available Units`,
                                                        opt,
                                                    )
                                                }
                                            />
                                        ),
                                    )}

                                    {/* Decimal Places */}
                                    <Row align="middle">
                                        <Col span={16}>
                                            <span className={styles.switchlabel}>
                                                {optionState[`${baseKey}.Decimal Places`]?.title ?? "Decimal Places"}
                                            </span>
                                        </Col>
                                        <Col span={8}>
                                            <SegmentedControl
                                                options={decimalOptions}
                                                onClick={(v: any) =>
                                                    handleOptionChange(
                                                        `${baseKey}.Decimal Places`,
                                                        v,
                                                    )
                                                }
                                                selected={String(optionState[`${baseKey}.Decimal Places`]?.value ?? 0)}
                                                size="S"
                                            />
                                        </Col>
                                    </Row>
                                </Flex>
                            </Accordion>
                        </div>
                    );
                }

                if (key === 'styling-x-axis') {
                    const baseKey = 'Styling.X-Axis';

                    const showAxisApiOptions =
                        optionState[`${baseKey}.Show Axis`]?.options;

                    const showAxisOptions =
                        showAxisApiOptions?.length
                            ? showAxisApiOptions.map(opt => ({
                                value: String(opt),
                            }))
                            : defaultShowAxisOptions;

                    const xAxisAngleApiOptions =
                        optionState[`${baseKey}.X-Axis Angle`]?.options;

                    const xAxisAngleOptions =
                        xAxisAngleApiOptions?.length
                            ? xAxisAngleApiOptions.map(opt => ({
                                value: String(opt),
                            }))
                            : defaultXAxisAngleOptions;

                    return (
                        <div key={key}>
                            <Accordion
                                title={title}
                                outlined={false}
                                isExpanded={expandedAccordions.has(key)}
                                leftRightSpaceZero
                                onToggle={() => toggleAccordion(key)}
                                className={styles['setup-accordion']}
                            >
                                <Flex vertical gap={12}>
                                    {/* Axis Label toggle */}
                                    <div className={styles['setup-flex']}>
                                        <Flex justify="space-between">
                                            <span className={styles.switchlabel}>
                                                {optionState[`${baseKey}.Axis Label`]?.title ?? "Axis Label"}
                                            </span>

                                            <Switch
                                                checked={Boolean(
                                                    optionState[`${baseKey}.Axis Label`]?.value ?? false,
                                                )}
                                                onToggle={(v: boolean) =>
                                                    handleOptionChange(`${baseKey}.Axis Label`, v)
                                                }
                                            />
                                        </Flex>
                                    </div>

                                    {/* Show Axis (SegmentedControl) */}
                                    <div className={styles['setup-flex']}>
                                        <Row align="middle">
                                            <Col span={12}>
                                                <span className={styles.switchlabel}>
                                                    {optionState[`${baseKey}.Show Axis`]?.title ?? "Show Axis"}
                                                </span>
                                            </Col>

                                            <Col span={12}>
                                                <SegmentedControl
                                                    size="S"
                                                    selected={String(
                                                        optionState[`${baseKey}.Show Axis`]?.value ?? "1st",
                                                    )}
                                                    options={showAxisOptions}
                                                    onClick={(value: any) =>
                                                        handleOptionChange(
                                                            `${baseKey}.Show Axis`,
                                                            value,
                                                        )
                                                    }
                                                />
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* X-Axis Angle (SegmentedControl) */}
                                    <div className={styles['setup-flex']}>
                                        <Row align="middle">
                                            <Col span={12}>
                                                <span className={styles.switchlabel}>
                                                    {optionState[`${baseKey}.X-Axis Angle`]?.title ?? "X-Axis Angle"}
                                                </span>
                                            </Col>

                                            <Col span={12}>
                                                <SegmentedControl
                                                    size="S"
                                                    selected={String(
                                                        optionState[`${baseKey}.X-Axis Angle`]
                                                            ?.value ?? "0",
                                                    )}
                                                    options={xAxisAngleOptions}
                                                    onClick={(value: any) =>
                                                        handleOptionChange(
                                                            `${baseKey}.X-Axis Angle`,
                                                            value,
                                                        )
                                                    }
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                </Flex>
                            </Accordion>
                        </div>
                    );
                }

                if (key === 'styling-data-labels') {
                    const baseKey = 'Styling.Data Labels';

                    return (
                        <div key={key}>
                            <Accordion
                                title={title}
                                outlined={false}
                                isExpanded={expandedAccordions.has(key)}
                                leftRightSpaceZero
                                onToggle={() => toggleAccordion(key)}
                                className={styles['setup-accordion']}
                            >
                                <Flex vertical gap={12}>
                                    {/* Value Label */}
                                    {showValueLabel && <div className={styles['setup-flex']}>
                                        <Flex justify="space-between">
                                            <span className={styles.switchlabel}>
                                                {optionState[`${baseKey}.Value Label`]?.title ?? "Value Label"}
                                            </span>

                                            <Switch
                                                checked={Boolean(
                                                    optionState[`${baseKey}.Value Label`]?.value ?? false,
                                                )}
                                                onToggle={(v: boolean) =>
                                                    handleOptionChange(`${baseKey}.Value Label`, v)
                                                }
                                            />
                                        </Flex>
                                    </div>}

                                    {/* Total Label */}
                                    {<div className={styles['setup-flex']}>
                                        <Flex justify="space-between">
                                            <span className={styles.switchlabel}>
                                                {optionState[`${baseKey}.Total Label`]?.title ?? "Total Label"}
                                            </span>

                                            <Switch
                                                checked={Boolean(
                                                    optionState[`${baseKey}.Total Label`]?.value ?? true,
                                                )}
                                                onToggle={(v: boolean) =>
                                                    handleOptionChange(`${baseKey}.Total Label`, v)
                                                }
                                            />
                                        </Flex>
                                    </div>}
                                </Flex>
                            </Accordion>
                        </div>
                    );
                }

                if (key === 'styling-others') {
                    const baseKey = 'Styling.Others';

                    const apiGridlineOptions =
                        optionState[`${baseKey}.Gridlines`]?.options?.filter(
                            (opt): opt is string => typeof opt === 'string',
                        );

                    const gridlineOptions =
                        apiGridlineOptions?.length
                            ? apiGridlineOptions
                            : defaultGridlineOptions;

                    const selectedGridlinesRaw =
                        optionState[`${baseKey}.Gridlines`]?.value ?? ["V"];

                    const selectedGridlines: string[] = Array.isArray(
                        selectedGridlinesRaw,
                    )
                        ? selectedGridlinesRaw.filter(
                            (v): v is string => typeof v === 'string',
                        )
                        : [];

                    return (
                        <div key={key}>
                            <Accordion
                                title={title}
                                outlined={false}
                                isExpanded={expandedAccordions.has(key)}
                                leftRightSpaceZero
                                onToggle={() => toggleAccordion(key)}
                                className={styles['setup-accordion']}
                            >
                                <Flex vertical gap={12}>
                                    {/* ----- Legend Toggle ----- */}
                                    <div className={styles['setup-flex']}>
                                        <Flex justify="space-between">
                                            <span className={styles.switchlabel}>
                                                {optionState[`${baseKey}.Legend`]?.title ?? "Legend"}
                                            </span>

                                            <Switch
                                                checked={Boolean(
                                                    optionState[`${baseKey}.Legend`]?.value ?? true,
                                                )}
                                                onToggle={(v: boolean) =>
                                                    handleOptionChange(`${baseKey}.Legend`, v)
                                                }
                                            />
                                        </Flex>
                                    </div>

                                    {/* ----- Gridlines Checkboxes ----- */}
                                    <div className={styles['setup-flex']}>
                                        <Row align="middle">
                                            <Col span={16}>
                                                <span className={styles.switchlabel}>
                                                    {optionState[`${baseKey}.Gridlines`]?.title ?? "Gridlines"}
                                                </span>
                                            </Col>

                                            <Col span={8}>
                                                <div className={styles.customcheckbox}>
                                                    {gridlineOptions.map(opt => {
                                                        const isChecked =
                                                            selectedGridlines.includes(opt);

                                                        return (
                                                            <CheckBox
                                                                key={opt}
                                                                label={opt}
                                                                checked={isChecked}
                                                                onChange={(
                                                                    checked: boolean,
                                                                ) => {
                                                                    const updated = checked
                                                                        ? [
                                                                            ...selectedGridlines,
                                                                            opt,
                                                                        ]
                                                                        : selectedGridlines.filter(
                                                                            value =>
                                                                                value !==
                                                                                opt,
                                                                        );

                                                                    handleOptionChange(
                                                                        `${baseKey}.Gridlines`,
                                                                        updated,
                                                                    );
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                </Flex>
                            </Accordion>
                        </div>
                    );
                }

                return (
                    <div key={key}>
                        <Accordion
                            title={title}
                            outlined={false}
                            isExpanded={expandedAccordions.has(key)}
                            leftRightSpaceZero
                            onToggle={() => toggleAccordion(key)}
                            className={styles['setup-accordion']}
                        >
                            <Flex vertical gap={12}>
                                <div className={styles['accordion-placeholder']}>
                                    {/* Axis Label */}
                                    <div className={styles['setup-flex']}>
                                        <Flex justify="space-between">
                                            <span className={styles.switchlabel}>
                                                Axis Label
                                            </span>

                                            <Switch
                                                checked={Boolean(
                                                    optionState[`Styling.${title}.Axis Lable`]
                                                        ?.value ?? false,
                                                )}
                                                onToggle={(v: boolean) =>
                                                    handleOptionChange(
                                                        `Styling.${title}.Axis Lable`,
                                                        v,
                                                    )
                                                }
                                            />
                                        </Flex>
                                    </div>

                                    {/* Show Axis */}
                                    <div className={styles['setup-flex']}>
                                        <Flex justify="space-between">
                                            <span className={styles.switchlabel}>
                                                {optionState[`Styling.${title}.Show Axis`]?.title ??
                                                    'Show Axis'}
                                            </span>

                                            <Switch
                                                checked={Boolean(
                                                    optionState[`Styling.${title}.Show Axis`]
                                                        ?.value ?? true,
                                                )}
                                                onToggle={(v: boolean) =>
                                                    handleOptionChange(
                                                        `Styling.${title}.Show Axis`,
                                                        v,
                                                    )
                                                }
                                            />
                                        </Flex>
                                    </div>
                                </div>
                            </Flex>
                        </Accordion>
                    </div>
                );
            })}
        </Flex>
    );

    const renderFilterContent = () => (
        <div  >
            <p className={styles["filter-title"]}>Filter Setup</p>


            <div className={styles["filter-wrapper"]}>
                {/* Header */}
                <div>
                    <h4 className={styles["filter-title"]}>Values</h4>
                    <p className={styles["filter-subtext"]}>
                        Add dimension chip within another to create a group
                    </p>


                    <DropZone
                        setIsEyeOpenInParent={(isEyeOpen: boolean, label: string) => {
                            setAxisSetup(prev => ({
                                ...prev,
                                xAxis: prev.xAxis.map(item => ({
                                    ...item,
                                    eyeOpen: item.label === label ? isEyeOpen : false,
                                })),
                            }));
                        }}
                        dataFieldType={["Geography", "Time", "Dimension"]}
                        setAxisSetup={(e) => {
                            setAxisSetup((prev) => {
                                const prevXAxis = prev?.xAxis || [];

                                const updated = e.map((item, index) => {
                                    const existingItem = prevXAxis.find((x) => x.id === item.id);

                                    return {
                                        ...item,
                                        source:
                                            item.source === "DATA_FIELD" || !item.source || item.source === ""
                                                ? "filter"
                                                : item.source,
                                        eyeOpen: existingItem
                                            ? existingItem.eyeOpen   // keep old eyeOpen if item already exists
                                            : prevXAxis.length === 0 && index === 0, // only first item true when initially empty
                                    };
                                });

                                return {
                                    ...prev,
                                    xAxis: updated,
                                };
                            });
                        }}
                        onBtnClick={() => setOpenDataFieldFlyOut(true)}
                        axisSetup={axisSetup}
                        items={axisSetup.xAxis}
                        onDropItem={(item) => {
                            setAxisSetup(prev => ({
                                ...prev,
                                xAxis: [
                                    ...prev.xAxis,
                                    {
                                        ...item,
                                        source: "filter",
                                    }
                                ]
                            }));
                        }}


                        optionKey="Setup.axisSetup.xAxis"
                        handleOptionChange={handleOptionChange}
                        filtertab={true}
                    />









                </div>

            </div>

        </div >
    );

    const renderPanelContent = () => {
        if (activePanelTab === SETUP_TAB) return renderSetupContent();
        if (activePanelTab === STYLING_TAB) return renderStylingContent();
        if (activePanelTab === FILTER_TAB) return renderFilterContent();
        return null;
    };

    const customActions = (
        <Flex
            justify="flex-end"
            gap={8}
            align="center"
            className={styles['custom-actions-wrapper']}
        >
            <Button
                icon="database-02"
                text="Data Fields"
                variant="Secondary"
                onClick={() => setOpenDataFieldFlyOut(!openDataFieldFlyOut)}
            />
            <Button text="Reset" variant="Secondary" onClick={() => resetWidgetConfigApi()} />
            <Button text="Save Chart" variant="Primary" onClick={handleSaveChart} />
        </Flex>
    );

    const renderDataFieldFlyout = () => {
        return (
            <DataFields
                axisSetup={axisSetup}
                fields={dataFieldsValue}
                onSelect={(item, option) => {
                    if (option.value === 'y_axis_add' && axisSetup.yAxis.length >= 1) {
                        return;
                    }

                    if (option.value === 'y_axis_add') {
                        setAxisSetup(prev => {
                            const updated = [...prev.yAxis, { ...item, source: 'yAxis' }];
                            handleOptionChange(
                                'Setup.axisSetup.yAxis',
                                updated.map(i => i.label),
                            );
                            return { ...prev, yAxis: updated };
                        });
                    } else if (option.value === 'x_axis_add') {
                        dropItemOnXAxis(item);
                    } else if (option.value === 'target_add') {
                        setAxisSetup(prev => {
                            const updated = [...prev.target, { ...item, source: 'target' }];
                            handleOptionChange(
                                'Setup.axisSetup.target',
                                updated.map(i => i.label),
                            );
                            return { ...prev, target: updated };
                        });
                    }
                }}
            />)
    }

    return (
        <Flyout
            id="chart-customization-panel"
            flyoutOpen={isOpen}
            direction="right"
            containerMaxWidth="100%"
            heading={'Setup\u00a0your\u00a0widget'}
            content={
                <Flex className={styles['customization-layout']} gap={0}>
                    <div className={styles['preview-area']}>
                        {isLoading ? (
                            <Flex className={styles['initial-loader-container']}>
                                <AnimatedLoaders id="initial-loader" type="page" />
                            </Flex>
                        ) : (
                            renderPreview()
                        )}
                    </div>
                    {openDataFieldFlyOut && (
                        <div className={styles['datafield-area']}>{renderDataFieldFlyout()}</div>
                    )}
                    <div className={styles['panel-area']}>
                        <Flex className={styles['panel-tabs']} gap={0}>
                            {PANEL_TABS.map(tab => (
                                <button
                                    key={tab}
                                    type="button"
                                    className={`${styles['panel-tab']} ${activePanelTab === tab ? styles['panel-tab-active'] : ''}`}
                                    onClick={() => setActivePanelTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </Flex>
                        {isLoading ? (
                            <Flex className={styles['initial-loader-container']}>
                                <AnimatedLoaders id="initial-loader" type="page" />
                            </Flex>
                        ) : error ? (
                            <div className={styles['empty-state-container']}>
                                <span className={styles['empty-text']}>Error</span>
                                <span>
                                    {typeof error === 'string'
                                        ? error
                                        : (error as { message?: string })?.message ||
                                        'Something went wrong'}
                                </span>
                            </div>
                        ) : (
                            <div className={styles['panel-content']}>{renderPanelContent()}</div>
                        )}
                    </div>
                    {/* </div> */}
                </Flex>
            }
            customActions={customActions}
            iconForCancel={{ icon: 'x-close', onClick: handleClose }}
            cancelIconClick={handleClose}
        />
    );
};

export default ChartCustomizationPanel;