import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Flex } from 'antd';
import {
    Flyout,
    Accordion,
    Icon,
    Button,
    Switch,
    SegmentedControl,
    ChartTypeButton,
    Tab,
    IconButton,
    InputField,
    Dialog,
} from 'konnect-react-components';
import { Label } from '../../../atoms';
import styles from '../PerformanceManagementCustomisations.module.scss';
import { ClusteredColumnIcon, FilledAreaIcon, SingleLineIcon } from '../../../../assets/icons/icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../store';
import { IWidgetOption } from '../../../../types/response';
import { fetchDynamicTabs } from '../../../../store/thunks/dynamicTabs';
import { logError } from '../../../../utils/helpers';
import { fetchWidgetConfiguration } from '../../../../store/thunks/performanceManagementWidgets';
import KpiFlyout, { FieldItem, KpiCategory } from './KpiFlyout';
import KpiDropZone, { KpiItem, KpiChipSettings } from "./KpiDropzone";

type KpiData = {
    hasMTD: boolean;
    hasQTD: boolean;
    hasYTD: boolean;
};
const REPORT_ID = 1;

export type LocalKpiCategory = {
    id: string;
    title: string;
    defaultTitle: string;
    kpis: KpiItem[];
    isCustom?: boolean;
};

type MultipleKpiEditFlyoutProps = {
    isOpen: boolean;
    onClose: () => void;
    /** Live preview content (left pane) — this will rerender when parent state changes */
    preview?: React.ReactNode;

    /** Current view states */
    gridViewEnabled: boolean;
    tableViewEnabled: boolean;
    showMTDTarget: boolean;
    chartEnabled?: boolean;
    chartType?: string;
    trendPeriod?: string;
    projectionsEnabled?: boolean;
    mainValue?: string;
    showMTD?: boolean;
    showQTD?: boolean;
    showYTD?: boolean;
    availableMetrics?: Array<{ label: string; value: string; category?: string }>;

    /** KPI data availability for constraint logic */
    kpiData?: KpiData;
    tabId: number;

    /** Fires on every change so preview updates instantly */
    onLiveUpdate: (payload: {
        gridViewEnabled?: boolean;
        tableViewEnabled?: boolean;
        showMTDTarget?: boolean;
        chartEnabled?: boolean;
        chartType?: string;
        trendPeriod?: string;
        projectionsEnabled?: boolean;
        mainValue?: string;
        showMTD?: boolean;
        showQTD?: boolean;
        showYTD?: boolean;
        kpiCategories?: LocalKpiCategory[];
    }) => void;

    /** Called on Save (persist to dashboard — parent already holds latest live state) */
    onSave: (payload: {
        gridViewEnabled: boolean;
        tableViewEnabled: boolean;
        showMTDTarget: boolean;
        chartEnabled: boolean;
        chartType: string;
        trendPeriod: string;
        projectionsEnabled: boolean;
        mainValue: string;
        showMTD: boolean;
        showQTD: boolean;
        showYTD: boolean;
        kpiCategories: LocalKpiCategory[];
    }) => void;

    onReset: (payload: any) => void;
    kpiCategories?: LocalKpiCategory[];
};

export type OptionValue = string | number | boolean | string[] | number[] | null;

const DEFAULT_KPI_CATEGORIES: LocalKpiCategory[] = [
    { id: 'cat-1', title: 'Category 1', defaultTitle: 'Category 1', kpis: [] },
    { id: 'cat-2', title: 'Category 2', defaultTitle: 'Category 2', kpis: [] },
    { id: 'cat-3', title: 'Category 3', defaultTitle: 'Category 3', kpis: [] },
];

const STATIC_KPI_SOURCE_CATEGORIES: KpiCategory[] = [
    {
        id: 'cat-1',
        title: 'Category 1',
        kpis: [
            { id: 'kpi-a', label: 'KPI A' },
            { id: 'kpi-b', label: 'KPI B' },
            { id: 'kpi-c', label: 'KPI C' },
            { id: 'kpi-d', label: 'KPI D' },
        ],
    },
    {
        id: 'cat-2',
        title: 'Category 2',
        kpis: [
            { id: 'kpi-e', label: 'KPI E' },
            { id: 'kpi-f', label: 'KPI F' },
            { id: 'kpi-g', label: 'KPI G' },
            { id: 'kpi-h', label: 'KPI H' },
        ],
    },
    {
        id: 'cat-3',
        title: 'Category 3',
        kpis: [
            { id: 'kpi-i', label: 'KPI I' },
            { id: 'kpi-j', label: 'KPI J' },
            { id: 'kpi-k', label: 'KPI K' },
            { id: 'kpi-l', label: 'KPI L' },
        ],
    },
];

const buildEditableCategories = (
    categories: LocalKpiCategory[] | undefined,
    availableMetrics: Array<{ label: string; value: string; category?: string }>,
): LocalKpiCategory[] => {
    const baseCategories = (categories?.length ? categories : DEFAULT_KPI_CATEGORIES).map(category => ({
        ...category,
        kpis: [...category.kpis],
    }));
    const hasAssignedKpis = baseCategories.some(category => category.kpis.length > 0);

    if (hasAssignedKpis || availableMetrics.length === 0) {
        return baseCategories;
    }

    return baseCategories.map(category =>
        category.id === 'cat-1'
            ? {
                ...category,
                kpis: availableMetrics.map(metric => ({
                    id: metric.value,
                    label: metric.label,
                    unitLabel: undefined,
                })),
            }
            : category,
    );
};

const MultipleKpiEditFlyout: React.FC<MultipleKpiEditFlyoutProps> = ({
    isOpen,
    onClose,
    preview,
    gridViewEnabled,
    tableViewEnabled,
    showMTDTarget,
    chartEnabled: propChartEnabled = true,
    chartType: propChartType = 'area',
    trendPeriod: propTrendPeriod = '1Y',
    projectionsEnabled: propProjectionsEnabled = false,
    mainValue: propMainValue = 'MTD',
    showMTD: propShowMTD = false,
    showQTD: propShowQTD = false,
    showYTD: propShowYTD = true,
    availableMetrics = [],
    kpiData,
    onLiveUpdate,
    onSave,
    onReset,
    tabId,
    kpiCategories: propKpiCategories,
}) => {
    // Header section state
    const [localGridViewEnabled, setLocalGridViewEnabled] = useState<boolean>(gridViewEnabled);
    const [localTableViewEnabled, setLocalTableViewEnabled] = useState<boolean>(tableViewEnabled);

    // Table View section state
    const [localShowMTDTarget, setLocalShowMTDTarget] = useState<boolean>(showMTDTarget);

    // KPI Card Setup state (same as SingleKpiEditFlyout)
    const [chartEnabled, setChartEnabled] = useState<boolean>(true);

    type ChartType = 'bar-clustered' | 'area' | 'line';
    const [chartType, setChartType] = useState<ChartType>('bar-clustered');

    type TrendPeriod = '3M' | '6M' | '1Y';
    const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('1Y');

    const [projectionsEnabled, setProjectionsEnabled] = useState<boolean>(false);

    type MainValue = 'MTD' | 'QTD' | 'YTD';
    const [mainValue, setMainValue] = useState<MainValue>('MTD');

    const [showMTD, setShowMTD] = useState<boolean>(false);
    const [showQTD, setShowQTD] = useState<boolean>(false);
    const [showYTD, setShowYTD] = useState<boolean>(true);

    const [activeTabLabel, setActiveTabLabel] = useState('Setup');

    const [isKpiFlyoutOpen, setIsKpiFlyoutOpen] = useState(false)

    const [kpiCategories, setKpiCategories] = useState<LocalKpiCategory[]>(DEFAULT_KPI_CATEGORIES);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryValue, setEditingCategoryValue] = useState('');
    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
    const [revertingCategoryId, setRevertingCategoryId] = useState<string | null>(null);

    const dispatch = useDispatch<AppDispatch>();
    const widgetConfigurations = useSelector(
        (state: RootState) => state.performanceManagementWidgets.widgetConfiguration
    );

    const isLoadingWidgetConfigurations = useSelector(
        (state: RootState) => state.performanceManagementWidgets.isWidgetConfigLoading
    );

    const isTabLoading = useSelector(
        (state: RootState) => state.dynamicTabs.isFetching
    );

    const [expandedById, setExpandedById] = useState<Record<string, boolean>>({
        "cat-1": true,
        "cat-2": true,
        "cat-3": true,
    });

    const toggleExpanded = (id: string) => {
        setExpandedById((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Add Custom Category flow
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [customCategoryName, setCustomCategoryName] = useState("");

    // Category reorder (drag n drop)
    const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);

    // const widgetConfigurationsError = useSelector(
    //     (state: RootState) => state.performanceManagementWidgets.errorWidgetConfiguration
    // );

    // const dynamicTabError = useSelector(
    //     (state: RootState) => state.dynamicTabs.error
    // );

    const widgetConfig = widgetConfigurations?.[0];
    // const error = widgetConfigurationsError || dynamicTabError;
    const isLoading = isLoadingWidgetConfigurations || isTabLoading;

    const [, setDataFieldsValue] = useState<
        FieldItem[] | OptionValue[] | null | undefined
    >(null);

    type ExtendedOptionItem = {
        path: string;
        title?: string;
        value: OptionValue;
        options?: OptionValue[] | null;
        visible: boolean;
        disabled: boolean;
        error: string | null;
        raw?: IWidgetOption;
    };
    type OptionState = Record<string, ExtendedOptionItem>;

    const buildOptionStateWithPaths = (
        options: IWidgetOption[],
        parentPath = '',
        state: OptionState = {}
    ): OptionState => {
        const getNodeKey = (option: IWidgetOption, parent: string) =>
            parent
                ? `${parent}.${option.optionKey || option.optionName}`
                : option.optionKey || option.optionName;

        options.forEach(option => {
            const path = getNodeKey(option, parentPath);
            const value: OptionValue = (option.defaultValue as OptionValue) ?? null;

            state[path] = {
                path,
                title: option.optionName ?? undefined,
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

    const getFirstWidget = async (tabId: number) => {
        const { widgets } = await dispatch(
            fetchDynamicTabs({ reportId: REPORT_ID, tabId })
        ).unwrap();
        return widgets?.[0] ?? null;
    };

    const loadWidgetConfiguration = async () => {
        if (!tabId) {
            logError('Tab is not Selected');
            return;
        }
        try {
            const widget = await getFirstWidget(tabId);
            if (!widget) return;

            await dispatch(
                fetchWidgetConfiguration({
                    kpiIdsCsv: widget.kpiId,
                    visualTypeId: widget.widgetVisualTypeId,
                    widgetId: widget.widgetId,
                })
            );
        } catch (e) {
            logError(e);
        }
    };

    const tabItems = [
        { label: 'Setup', tabCode: 'setup' },
        { label: 'KPI’s', tabCode: 'kpis' }
    ];

    const handleTabClick = (item: any) => {
        setActiveTabLabel(item.label);
    };

    const editableCategories = useMemo(
        () => buildEditableCategories(propKpiCategories, availableMetrics),
        [availableMetrics, propKpiCategories],
    );

    /** Sync with external props or when flyout opens */
    useEffect(() => {
        setLocalGridViewEnabled(gridViewEnabled);
        setLocalTableViewEnabled(tableViewEnabled);
        setLocalShowMTDTarget(showMTDTarget);
        setChartEnabled(propChartEnabled);
        setChartType(propChartType as ChartType);
        setTrendPeriod(propTrendPeriod as TrendPeriod);
        setProjectionsEnabled(propProjectionsEnabled);
        setMainValue(propMainValue as MainValue);
        setShowMTD(propShowMTD);
        setShowQTD(propShowQTD);
        setShowYTD(propShowYTD);
        setKpiCategories(editableCategories);
    }, [
        editableCategories,
        gridViewEnabled,
        tableViewEnabled,
        showMTDTarget,
        propChartEnabled,
        propChartType,
        propTrendPeriod,
        propProjectionsEnabled,
        propMainValue,
        propShowMTD,
        propShowQTD,
        propShowYTD,
        isOpen,
    ]);

    useEffect(() => {
        if (!isOpen) return;
        loadWidgetConfiguration();
    }, [isOpen, dispatch]);

    useEffect(() => {
        if (isLoading || !widgetConfig) return;

        const state: Record<string, any> = widgetConfig.widgetOptions
            ? buildOptionStateWithPaths(widgetConfig.widgetOptions)
            : {};

        setDataFieldsValue(state['Data Fields']?.options);
    }, [isLoading, widgetConfig]);

    // No disable constraint needed — toggles are mutually exclusive
    const isGridDisabled = false;
    const isTableDisabled = false;

    // KPI data availability constraints
    const isMTDDisabled = !kpiData?.hasMTD;
    const isQTDDisabled = !kpiData?.hasQTD;
    const isYTDDisabled = !kpiData?.hasYTD;

    // Header section handlers
    const onToggleGridView = useCallback(
        (checked: boolean) => {
            setLocalGridViewEnabled(checked);
            if (checked) {
                setLocalTableViewEnabled(false);
                onLiveUpdate({ gridViewEnabled: true, tableViewEnabled: false });
            } else {
                onLiveUpdate({ gridViewEnabled: false });
            }
        },
        [onLiveUpdate]
    );

    const onToggleTableView = useCallback(
        (checked: boolean) => {
            setLocalTableViewEnabled(checked);
            if (checked) {
                setLocalGridViewEnabled(false);
                onLiveUpdate({ tableViewEnabled: true, gridViewEnabled: false });
            } else {
                onLiveUpdate({ tableViewEnabled: false });
            }
        },
        [onLiveUpdate]
    );

    // Table View section handlers
    const onToggleShowMTDTarget = useCallback(
        (checked: boolean) => {
            setLocalShowMTDTarget(checked);
            onLiveUpdate({ showMTDTarget: checked });
        },
        [onLiveUpdate]
    );

    // KPI Card Setup handlers (same pattern as SingleKpiEditFlyout)
    const handleChartToggle = useCallback(
        (checked: boolean) => {
            setChartEnabled(checked);
            onLiveUpdate({ chartEnabled: checked });
        },
        [onLiveUpdate]
    );

    const selectChartType = useCallback(
        (type: ChartType) => {
            setChartType(type);
            onLiveUpdate({ chartType: type });
        },
        [onLiveUpdate]
    );

    const handleTrendPeriodClick = useCallback(
        (val: TrendPeriod) => {
            setTrendPeriod(val);
            onLiveUpdate({ trendPeriod: val });
        },
        [onLiveUpdate]
    );

    const handleProjectionsToggle = useCallback(
        (checked: boolean) => {
            setProjectionsEnabled(checked);
            onLiveUpdate({ projectionsEnabled: checked });
        },
        [onLiveUpdate]
    );

    const handleMainValueClick = useCallback(
        (val: MainValue) => {
            setMainValue(val);
            onLiveUpdate({ mainValue: val });
        },
        [onLiveUpdate]
    );

    const handleMTDToggle = useCallback(
        (checked: boolean) => {
            setShowMTD(checked);
            onLiveUpdate({ showMTD: checked });
        },
        [onLiveUpdate]
    );

    const handleQTDToggle = useCallback(
        (checked: boolean) => {
            setShowQTD(checked);
            onLiveUpdate({ showQTD: checked });
        },
        [onLiveUpdate]
    );

    const handleYTDToggle = useCallback(
        (checked: boolean) => {
            setShowYTD(checked);
            onLiveUpdate({ showYTD: checked });
        },
        [onLiveUpdate]
    );

    const updateKpiCategories = useCallback((updater: (prev: LocalKpiCategory[]) => LocalKpiCategory[]) => {
        setKpiCategories((prev) => {
            const next = updater(prev);
            onLiveUpdate({ kpiCategories: next });
            return next;
        });
    }, [onLiveUpdate]);

    const defaultChipSettings: KpiChipSettings = {
        chartEnabled,
        chartType,
        trendPeriod,
        projectionsEnabled,
        mainValue,
        showMTD,
        showQTD,
        showYTD,
    };

    const addKpiToCategory = (categoryId: string, item: KpiItem) => {
        updateKpiCategories(prev =>
            prev.map(c =>
                c.id === categoryId && !c.kpis.some((k) => k.id === item.id)
                    ? { ...c, kpis: [...c.kpis, item] }
                    : c
            )
        );
    };

    const removeKpiFromCategory = (categoryId: string, itemId: string) => {
        updateKpiCategories(prev =>
            prev.map(c =>
                c.id === categoryId ? { ...c, kpis: c.kpis.filter(k => k.id !== itemId) } : c
            )
        );
    };

    const updateKpiChip = (categoryId: string, itemId: string, customSettings?: KpiChipSettings) => {
        updateKpiCategories((prev) =>
            prev.map((category) =>
                category.id !== categoryId
                    ? category
                    : {
                        ...category,
                        kpis: category.kpis.map((kpi) =>
                            kpi.id === itemId
                                ? {
                                    ...kpi,
                                    customSettings,
                                }
                                : kpi,
                        ),
                    },
            ),
        );
    };

    const moveKpi = (fromCategoryId: string, toCategoryId: string, fromIndex: number, toIndex: number) => {
        updateKpiCategories(prev => {
            const clone = prev.map(c => ({ ...c, kpis: [...c.kpis] }));
            const from = clone.find(c => c.id === fromCategoryId);
            const to = clone.find(c => c.id === toCategoryId);
            if (!from || !to) return prev;

            const [moved] = from.kpis.splice(fromIndex, 1);
            const insertAt = Math.min(Math.max(toIndex, 0), to.kpis.length);
            to.kpis.splice(insertAt, 0, moved as KpiItem);

            return clone;
        });
    };

    const removeCategory = (categoryId: string) => {
        updateKpiCategories((prev) => prev.filter((c) => c.id !== categoryId));
        setExpandedById((prev) => {
            const clone = { ...prev };
            delete clone[categoryId];
            return clone;
        });
    };

    const openEditCategoryDialog = (categoryId: string) => {
        const category = kpiCategories.find((item) => item.id === categoryId);
        if (!category) return;

        setEditingCategoryId(categoryId);
        setEditingCategoryValue(category.title);
    };

    const saveCategoryTitle = () => {
        if (!editingCategoryId) return;

        const nextTitle = editingCategoryValue.trim();
        if (!nextTitle) return;

        updateKpiCategories((prev) =>
            prev.map((category) =>
                category.id === editingCategoryId ? { ...category, title: nextTitle } : category,
            ),
        );
        setEditingCategoryId(null);
        setEditingCategoryValue('');
    };

    const revertCategoryTitle = (categoryId: string) => {
        updateKpiCategories((prev) =>
            prev.map((category) =>
                category.id === categoryId
                    ? { ...category, title: category.defaultTitle }
                    : category,
            ),
        );
        setRevertingCategoryId(null);
    };

    const startAddCustom = () => {
        setIsAddingCustom(true);
        setCustomCategoryName("");
    };

    const cancelAddCustom = () => {
        setIsAddingCustom(false);
        setCustomCategoryName("");
    };

    const confirmAddCustom = () => {
        const name = customCategoryName.trim();
        if (!name) return;

        const id = `custom-${Date.now()}`;

        updateKpiCategories((prev) => [
            ...prev,
            {
                id,
                title: name,
                defaultTitle: name,
                kpis: [],
                isCustom: true,
            },
        ]);

        setExpandedById((prev) => ({ ...prev, [id]: true })); // optional; safe to omit
        setIsAddingCustom(false);
        setCustomCategoryName("");
    };

    const reorderCategories = (fromId: string, toId: string) => {
        updateKpiCategories((prev) => {
            const fromIndex = prev.findIndex((c) => c.id === fromId);
            const toIndex = prev.findIndex((c) => c.id === toId);
            if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;

            const clone = [...prev];
            const [moved] = clone.splice(fromIndex, 1);
            clone.splice(toIndex, 0, moved as LocalKpiCategory);
            return clone;
        });
    };

    /** Persist all state */
    const handleSave = () => {
        onSave({
            gridViewEnabled: localGridViewEnabled,
            tableViewEnabled: localTableViewEnabled,
            showMTDTarget: localShowMTDTarget,
            chartEnabled,
            chartType,
            trendPeriod,
            projectionsEnabled,
            mainValue,
            showMTD,
            showQTD,
            showYTD,
            kpiCategories,
        });
        onClose();
    };

    // Reset all local state to defaults
    // const handleReset = () => {
    //     setLocalGridViewEnabled(true);
    //     setLocalTableViewEnabled(true);
    //     setLocalShowMTDTarget(true);
    //     setChartEnabled(true);
    //     setChartType('bar-clustered');
    //     setTrendPeriod('1Y');
    //     setProjectionsEnabled(false);
    //     setMainValue('MTD');
    //     setShowMTD(false);
    //     setShowQTD(false);
    //     setShowYTD(true);

    //     // Push reset state to preview live
    //     onLiveUpdate({
    //         gridViewEnabled: true,
    //         tableViewEnabled: true,
    //         showMTDTarget: true,
    //         chartEnabled: true,
    //         chartType: 'bar-clustered',
    //         trendPeriod: '1Y',
    //         projectionsEnabled: false,
    //         mainValue: 'MTD',
    //         showMTD: false,
    //         showQTD: false,
    //         showYTD: true,
    //     });
    // };

    const handleClose = () => {
        onClose();
    };

    // Derived visibility for dependent toggles
    const showMTDToggle = (mainValue === 'QTD' || mainValue === 'YTD') && !isMTDDisabled;
    const showQTDToggle = (mainValue === 'MTD' || mainValue === 'YTD') && !isQTDDisabled;
    const showYTDToggle = (mainValue === 'MTD' || mainValue === 'QTD') && !isYTDDisabled;

    // Helper: lightweight selected style for chart type
    const chartBtnStyle: React.CSSProperties = {
        outline: '2px solid transparent',
        borderRadius: 8,
    };
    const chartBtnSelectedStyle: React.CSSProperties = {
        outline: '2px solid var(--green-500, #2BB673)',
        borderRadius: 8,
    };

    const customActions = (
        <div
            style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '16px',
                marginRight: '10px',
            }}
        >
            <Button
                icon="database-02"
                text="KPI's"
                variant="Secondary"
                onClick={() => setIsKpiFlyoutOpen(!isKpiFlyoutOpen)}
            />
            <Button onClick={onReset} variant="Secondary" text="Reset" />
            <Button onClick={handleSave} variant="Primary" text="Save Widget" />
        </div>
    );

    const renderDataFieldFlyout = () => {
        return (
            <KpiFlyout
                fields={STATIC_KPI_SOURCE_CATEGORIES}
                onSelect={() => { }}
            />)
    }

    const editingCategory = editingCategoryId
        ? kpiCategories.find((category) => category.id === editingCategoryId) ?? null
        : null;
    const deletingCategory = deletingCategoryId
        ? kpiCategories.find((category) => category.id === deletingCategoryId) ?? null
        : null;
    const isCategoryTitleDirty = Boolean(
        editingCategory && editingCategoryValue.trim() && editingCategoryValue.trim() !== editingCategory.title,
    );

    return (
        <Flex className={styles['multiple-kpi-flyout-wrapper']}>
            <Flyout
                heading="Setup your widget"
                dataTestId="multiple-kpi-flyout"
                flyoutOpen={isOpen}
                direction="left"
                cancelIconClick={handleClose}
                iconForCancel={{ icon: 'x-close', onClick: handleClose }}
                className={styles['flyout-container-multiple-kpi']}
                id="multiple-kpi-flyout"
                containerMaxWidth={'100%'}
                showfooter={false}
                customActions={customActions}
                content={
                    <Flex className={styles['multiple-kpi-container']}>
                        {/* Left: live preview area */}
                        <Flex className={styles['multiple-kpi-preview-area']} align="flex-start" justify="flex-start">
                            {preview ?? (
                                <Flex vertical align="center" justify="center" style={{ width: '100%', minHeight: 240 }}>
                                    <Icon name="info-circle" size="m" color="neutrals-B500" />
                                    <div className={styles['space-v-8']} />
                                    <Label type="body2">
                                        <span>Card preview will appear here.</span>
                                    </Label>
                                </Flex>
                            )}
                        </Flex>

                        {/* KPI Flyout */}
                        {isKpiFlyoutOpen && <div className={styles['datafield-area']}>{renderDataFieldFlyout()}</div>}

                        {/* Right: Settings area */}
                        <Flex vertical className={styles['multiple-kpi-settings-area']} gap={8}>


                            <Tab
                                items={tabItems}
                                onClick={handleTabClick}
                                fullWidthTabs={true} //
                                DefaultSelected={tabItems[0]}
                            >
                                {/* Content area below the tabs */}
                                <div style={{ padding: '1rem' }}>
                                    {activeTabLabel === 'Setup' ? (
                                        <>
                                            {/* Header accordion */}
                                            <Accordion title="Header" outlined={false} containerWidth={'320px'}>
                                                <React.Fragment key=".0">
                                                    <Flex vertical gap={12} style={{ backgroundColor: '#fafafa', padding: 12 }}>
                                                        <Flex justify='space-between' align='center'>
                                                            <Label type="body2">Grid View</Label>
                                                            <Switch
                                                                onToggle={onToggleGridView}
                                                                position="right"
                                                                checked={localGridViewEnabled}
                                                                isDisable={isGridDisabled}
                                                            />
                                                        </Flex>

                                                        <Flex justify='space-between' align='center'>
                                                            <Label type="body2">Table View</Label>
                                                            <Switch
                                                                onToggle={onToggleTableView}
                                                                position="right"
                                                                checked={localTableViewEnabled}
                                                                isDisable={isTableDisabled}
                                                            />
                                                        </Flex>
                                                    </Flex>
                                                </React.Fragment>
                                            </Accordion>

                                            {/* Table View accordion */}
                                            <Accordion title="Table View" outlined={false} containerWidth={'320px'}>
                                                <React.Fragment key=".0">
                                                    <Flex vertical gap={12} style={{ backgroundColor: '#fafafa', padding: 12 }}>
                                                        <Flex justify='space-between' align='center'>
                                                            <Label type="body2">Show MTD Target</Label>
                                                            <Switch
                                                                onToggle={onToggleShowMTDTarget}
                                                                position="right"
                                                                checked={localShowMTDTarget}
                                                            />
                                                        </Flex>
                                                    </Flex>
                                                </React.Fragment>
                                            </Accordion>

                                            {/* KPI Card Setup accordion */}
                                            <Accordion title="KPI Card Setup" outlined={false} containerWidth={'320px'}>
                                                <React.Fragment key=".0">
                                                    <Flex vertical gap={12} style={{ backgroundColor: '#fafafa', padding: 12 }}>
                                                        {/* Chart master toggle */}
                                                        <Flex justify='space-between' align='center'>
                                                            <Label type="body2">Chart</Label>
                                                            <Switch
                                                                onToggle={handleChartToggle}
                                                                position="right"
                                                                checked={chartEnabled}
                                                            />
                                                        </Flex>

                                                        {/* Conditionally render chart-related controls */}
                                                        {chartEnabled && (
                                                            <>
                                                                {/* Chart Type */}
                                                                <Flex gap={8} justify='space-between' align='center'>
                                                                    <Label type="body2">Chart Type</Label>
                                                                    <Flex gap={12}>
                                                                        <div
                                                                            style={
                                                                                chartType === 'bar-clustered'
                                                                                    ? chartBtnSelectedStyle
                                                                                    : chartBtnStyle
                                                                            }
                                                                        >
                                                                            <ChartTypeButton
                                                                                icon={<ClusteredColumnIcon />}
                                                                                onClick={() => selectChartType('bar-clustered')}
                                                                                size={56}
                                                                            />
                                                                        </div>
                                                                        <div
                                                                            style={
                                                                                chartType === 'line'
                                                                                    ? chartBtnSelectedStyle
                                                                                    : chartBtnStyle
                                                                            }
                                                                        >
                                                                            <ChartTypeButton
                                                                                icon={<SingleLineIcon />}
                                                                                onClick={() => selectChartType('line')}
                                                                                size={56}
                                                                            />
                                                                        </div>
                                                                        <div
                                                                            style={
                                                                                chartType === 'area'
                                                                                    ? chartBtnSelectedStyle
                                                                                    : chartBtnStyle
                                                                            }
                                                                        >
                                                                            <ChartTypeButton
                                                                                icon={<FilledAreaIcon />}
                                                                                onClick={() => selectChartType('area')}
                                                                                size={56}
                                                                            />
                                                                        </div>
                                                                    </Flex>
                                                                </Flex>

                                                                {/* Trend Period */}
                                                                <Flex gap={8} justify='space-between' align='center'>
                                                                    <Label type="body2">Trend Period</Label>
                                                                    <SegmentedControl
                                                                        onClick={(val: any) => handleTrendPeriodClick(val)}
                                                                        options={[{ value: '3M' }, { value: '6M' }, { value: '1Y' }]}
                                                                        size="S"
                                                                    />
                                                                </Flex>

                                                                {/* Projections */}
                                                                <Flex justify='space-between' align='center'>
                                                                    <Label type="body2">Projections</Label>
                                                                    <Switch
                                                                        onToggle={handleProjectionsToggle}
                                                                        position="right"
                                                                        checked={projectionsEnabled}
                                                                    />
                                                                </Flex>

                                                            </>
                                                        )}

                                                        {/* Main Value + dependent toggles */}
                                                        <Flex justify='space-between' align='center'>
                                                            <Label type="body2">Main Value</Label>
                                                            <SegmentedControl
                                                                onClick={(val: any) => handleMainValueClick(val)}
                                                                options={[
                                                                    { value: 'MTD', disabled: isMTDDisabled },
                                                                    { value: 'QTD', disabled: isQTDDisabled },
                                                                    { value: 'YTD', disabled: isYTDDisabled }
                                                                ]}
                                                                size="S"
                                                            />
                                                        </Flex>

                                                        {/* Dependent toggles (show/hide the other two based on main selection and availability) */}
                                                        {showMTDToggle && (
                                                            <Flex justify='space-between' align='center'>
                                                                <Label type="body2">MTD</Label>
                                                                <Switch
                                                                    onToggle={handleMTDToggle}
                                                                    position="right"
                                                                    checked={showMTD}
                                                                />
                                                            </Flex>
                                                        )}
                                                        {showQTDToggle && (
                                                            <Flex justify='space-between' align='center'>
                                                                <Label type="body2">QTD</Label>
                                                                <Switch
                                                                    onToggle={handleQTDToggle}
                                                                    position="right"
                                                                    checked={showQTD}
                                                                />
                                                            </Flex>
                                                        )}
                                                        {showYTDToggle && (
                                                            <Flex justify='space-between' align='center'>
                                                                <Label type="body2">YTD</Label>
                                                                <Switch
                                                                    onToggle={handleYTDToggle}
                                                                    position="right"
                                                                    checked={showYTD}
                                                                />
                                                            </Flex>
                                                        )}
                                                    </Flex>
                                                </React.Fragment>
                                            </Accordion>
                                        </>
                                    ) : (
                                        <Flex vertical gap={12} style={{ width: "100%" }}>
                                            {/* Add Custom Category flow */}
                                            {!isAddingCustom ? (
                                                <Button
                                                    text="Add Custom Category"
                                                    variant="Subtle"
                                                    icon="plus"
                                                    onClick={startAddCustom}
                                                />
                                            ) : (
                                                <Flex align="center" gap={8}>
                                                    <InputField
                                                        value={customCategoryName}
                                                        onChange={(e: any) => setCustomCategoryName(e?.target?.value ?? "")}
                                                        placeholder="Enter custom category name"
                                                    />
                                                    <IconButton
                                                        icon="check"
                                                        size="Tiny"
                                                        onClick={confirmAddCustom}
                                                        disabled={!customCategoryName.trim()}
                                                    />
                                                    <IconButton
                                                        icon="x-close"
                                                        size="Tiny"
                                                        onClick={cancelAddCustom}
                                                    />
                                                </Flex>
                                            )}

                                            {/* Dropzone container */}
                                            <div className={styles["kpi-category-list"]}>
                                                {kpiCategories.map((cat) => {
                                                    const expanded = expandedById[cat.id] ?? true;

                                                    return (
                                                        <div
                                                            key={cat.id}
                                                            className={styles["kpi-category-card"]}
                                                            draggable
                                                            onDragStart={() => setDraggingCategoryId(cat.id)}
                                                            onDragOver={(e) => e.preventDefault()}
                                                            onDrop={() => {
                                                                if (draggingCategoryId && draggingCategoryId !== cat.id) {
                                                                    reorderCategories(draggingCategoryId, cat.id);
                                                                }
                                                                setDraggingCategoryId(null);
                                                            }}
                                                        >
                                                            <div
                                                                className={styles["kpi-category-header"]}
                                                                onClick={() => toggleExpanded(cat.id)}
                                                            >
                                                                <div className={styles["kpi-category-title-block"]}>
                                                                    <div className={styles["kpi-category-title"]}>
                                                                        <Icon name={expanded ? "chevron-down" : "chevron-right"} size="xm" color='black-color' />

                                                                        <span>{cat.title}</span>
                                                                    </div>
                                                                    {cat.title !== cat.defaultTitle && (
                                                                        <span className={styles["kpi-category-subtitle"]}>Name Changed</span>
                                                                    )}
                                                                </div>

                                                                <div className={styles["kpi-category-actions"]}>
                                                                    {cat.title !== cat.defaultTitle && (
                                                                        <button
                                                                            type="button"
                                                                            className={styles["kpi-category-action-button"]}
                                                                            onClick={(e: any) => {
                                                                                e?.stopPropagation?.();
                                                                                setRevertingCategoryId(cat.id);
                                                                            }}
                                                                            aria-label="Revert category name"
                                                                        >
                                                                            <Icon name="refresh-ccw-01" size="xm" color="neutrals-B400" />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        className={styles["kpi-category-action-button"]}
                                                                        onClick={(e: any) => {
                                                                            e?.stopPropagation?.();
                                                                            openEditCategoryDialog(cat.id);
                                                                        }}
                                                                        aria-label="Edit category name"
                                                                    >
                                                                        <Icon name="edit-01" size="xm" color="neutrals-B400" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className={styles["kpi-category-action-button"]}
                                                                        onClick={(e: any) => {
                                                                            e?.stopPropagation?.();
                                                                            setDeletingCategoryId(cat.id);
                                                                        }}
                                                                        aria-label="Remove category"
                                                                    >
                                                                        <Icon name="x-close" size="xm" color="neutrals-B400" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Show dropzone only when expanded */}
                                                            {expanded && (
                                                                <KpiDropZone
                                                                    categoryId={cat.id}
                                                                    items={cat.kpis}
                                                                    onAddFromFlyout={addKpiToCategory}
                                                                    onMoveChip={moveKpi}
                                                                    onRemoveChip={removeKpiFromCategory}
                                                                    onUpdateChip={updateKpiChip}
                                                                    defaultChipSettings={defaultChipSettings}
                                                                    isCustomCategory={!!cat.isCustom}
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </Flex>
                                    )}
                                </div>
                            </Tab>
                        </Flex>
                    </Flex>
                }
            />
            <Dialog
                title="Edit Field"
                content={
                    <div className={styles['edit-category-dialog-content']}>
                        <Label type="body3">Category Name</Label>
                        <InputField
                            value={editingCategoryValue}
                            onChange={(e: any) => setEditingCategoryValue(e?.target?.value ?? '')}
                        />
                        <div className={styles['edit-category-default-label']}>
                            <Label type="body2">
                                {`Default Name : ${editingCategory?.defaultTitle ?? ''}`}
                            </Label>
                        </div>
                    </div>
                }
                isOpen={Boolean(editingCategory)}
                onClose={() => {
                    setEditingCategoryId(null);
                    setEditingCategoryValue('');
                }}
                onPrimaryButtonClick={() => saveCategoryTitle()}
                onSecondaryButtonClick={() => { }}
                primaryButtonText="Save"
                isPrimaryDisabled={!isCategoryTitleDirty}
                secondaryButtonText=""
            />
            <Dialog
                title="Delete Category"
                content={`Are you sure you want to remove the KPI category "${deletingCategory?.title ?? ''}"?`}
                isOpen={Boolean(deletingCategory)}
                onClose={() => setDeletingCategoryId(null)}
                onPrimaryButtonClick={() => {
                    if (deletingCategoryId) {
                        removeCategory(deletingCategoryId);
                    }
                    setDeletingCategoryId(null);
                }}
                onSecondaryButtonClick={() => setDeletingCategoryId(null)}
                primaryButtonText="Remove"
                secondaryButtonText="Don't Remove"
                variant="HeaderTitleIcon"
                iconName="x-close"
                color="neutrals-B800"
            />
            <Dialog
                title="Revert to Default Name"
                content="Are you sure you want to revert the KPI category name back to default?"
                isOpen={Boolean(revertingCategoryId)}
                onClose={() => setRevertingCategoryId(null)}
                onPrimaryButtonClick={() => {
                    if (revertingCategoryId) {
                        revertCategoryTitle(revertingCategoryId);
                    }
                }}
                onSecondaryButtonClick={() => setRevertingCategoryId(null)}
                primaryButtonText="Revert"
                secondaryButtonText="Don't Revert"
                color="neutrals-B800"
            />
        </Flex>
    );
};

export default MultipleKpiEditFlyout;