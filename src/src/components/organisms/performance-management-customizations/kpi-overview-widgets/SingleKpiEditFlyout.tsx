// src/components/organisms/performance-management-customizations/kpi-overview-widgets/SingleKpiEditFlyout.tsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Flex } from 'antd';
import {
    Flyout,
    Accordion,
    Icon,
    Button,
    DropDown,
    Switch,
    SegmentedControl,
    ChartTypeButton,
} from 'konnect-react-components';
import { Label } from '../../../atoms';
import styles from '../PerformanceManagementCustomisations.module.scss';
import { ClusteredColumnIcon, FilledAreaIcon, SingleLineIcon } from '../../../../assets/icons/icons';

type KpiOption = {
    label: string;
    value: string;
};

type SingleKpiEditFlyoutProps = {
    isOpen: boolean;
    onClose: () => void;
    /** Live preview content (left pane) — this will rerender when parent state changes */
    preview?: React.ReactNode;

    /** Header config props supplied by parent */
    kpiOptions: KpiOption[];
    /** The KPI id of the card being edited */
    activeKpiId?: string;
    /** Current title on the card */
    currentTitle?: string;
    /** Current show period state */
    showPeriod: boolean;

    /** KPI Card Setup initial state from parent */
    showGraph: boolean;
    chartType: 'area' | 'bar' | 'line';
    selectedPeriod: '' | 'mtd' | 'qtd' | 'ytd';
    trendPeriod: '3M' | '6M' | '1Y';
    projectionsEnabled: boolean;

    /** Fires on every change so preview updates instantly */
    onLiveHeaderUpdate: (payload: {
        title?: string;
        showPeriod?: boolean;
        kpi?: KpiOption | null;
        showGraph?: boolean;
        chartType?: 'area' | 'bar' | 'line';
        selectedPeriod?: '' | 'mtd' | 'qtd' | 'ytd';
        trendPeriod?: '3M' | '6M' | '1Y';
        projectionsEnabled?: boolean;
    }) => void;

    /** Called on Save (persist to dashboard — parent already holds latest live state) */
    onSaveHeader: (payload: {
        title?: string;
        showPeriod: boolean;
        kpi?: KpiOption | null;
        showGraph?: boolean;
        chartType?: 'area' | 'bar' | 'line';
        selectedPeriod?: '' | 'mtd' | 'qtd' | 'ytd';
        trendPeriod: '3M' | '6M' | '1Y';
        projectionsEnabled: boolean;
    }) => void;
};

const SingleKpiEditFlyout: React.FC<SingleKpiEditFlyoutProps> = ({
    isOpen,
    onClose,
    preview,
    kpiOptions,
    activeKpiId,
    currentTitle,
    showPeriod,
    showGraph,
    chartType,
    selectedPeriod,
    onLiveHeaderUpdate,
    onSaveHeader,
    trendPeriod,
    projectionsEnabled,
}) => {
    const defaultSelectedOption = useMemo(() => {
        if (activeKpiId) {
            const found = kpiOptions.find(k => k.value === activeKpiId);
            if (found) return found;
        }
        if (currentTitle) {
            const byTitle = kpiOptions.find(k => k.label === currentTitle);
            if (byTitle) return byTitle;
        }
        return kpiOptions[0];
    }, [kpiOptions, activeKpiId, currentTitle]);

    const [localSelectedKpi, setLocalSelectedKpi] = useState<KpiOption | undefined>(defaultSelectedOption);
    const [localShowPeriod, setLocalShowPeriod] = useState<boolean>(!!showPeriod);
    const [localTrendPeriod, setLocalTrendPeriod] = useState<'3M' | '6M' | '1Y'>(trendPeriod);
    const [localProjections, setLocalProjections] = useState<boolean>(projectionsEnabled);

    /** KPI Card Setup local UI states (initialized from parent) */
    const [chartEnabled, setChartEnabled] = useState<boolean>(!!showGraph);
    type ChartType = 'area' | 'bar' | 'line';
    const [localChartType, setLocalChartType] = useState<ChartType>(chartType ?? 'area');

    type TrendPeriod = '3M' | '6M' | '1Y';
    const [, setTrendPeriod] = useState<TrendPeriod>('1Y');

    type MainValue = 'MTD' | 'QTD' | 'YTD';
    const initialMainValue: MainValue =
        (selectedPeriod?.toUpperCase() as MainValue) || 'YTD';
    const [mainValue, setMainValue] = useState<MainValue>(initialMainValue);

    // Secondary toggles (dependent on main value) — UI only
    const [showMTD, setShowMTD] = useState<boolean>(false);
    const [showQTD, setShowQTD] = useState<boolean>(false);
    const [showYTD, setShowYTD] = useState<boolean>(true);

    // (Optional) Availability flags — in future these can be wired to real KPI metadata
    const [isMTDAvailable] = useState<boolean>(true);
    const [isQTDAvailable] = useState<boolean>(true);
    const [isYTDAvailable] = useState<boolean>(true);

    useEffect(() => {
        setLocalSelectedKpi(defaultSelectedOption);
        setLocalShowPeriod(!!showPeriod);

        // KPI Card Setup states from parent
        setChartEnabled(!!showGraph);
        setLocalChartType(chartType ?? 'area');
        setMainValue(((selectedPeriod?.toUpperCase() as MainValue) || 'YTD') as MainValue);

        setLocalTrendPeriod(trendPeriod);
        setLocalProjections(projectionsEnabled);
    }, [defaultSelectedOption, showPeriod, isOpen, showGraph, chartType, selectedPeriod, trendPeriod, projectionsEnabled]);

    const onKpiDropdownChange = useCallback(
        (selected: KpiOption | KpiOption[] | null) => {
            const next = Array.isArray(selected) ? selected[0] : selected ?? undefined;
            setLocalSelectedKpi(next);
            // Live update title AND selected KPI (id + label)
            onLiveHeaderUpdate({ title: next?.label, kpi: next ?? null });
        },
        [onLiveHeaderUpdate]
    );

    const onToggleShowPeriod = useCallback(
        (checked: boolean) => {
            setLocalShowPeriod(checked);
            // Live update showPeriod
            onLiveHeaderUpdate({ showPeriod: checked });
            // If turned off, also clear selectedPeriod to ''
            if (!checked) {
                onLiveHeaderUpdate({ selectedPeriod: '' });
            } else {
                // Restore mainValue as selected period
                onLiveHeaderUpdate({ selectedPeriod: (mainValue.toLowerCase() as 'mtd' | 'qtd' | 'ytd') });
            }
        },
        [onLiveHeaderUpdate, mainValue]
    );

    /** Persist header+card state; KPI Card Setup (below) now persisted as well */
    const handleSave = () => {
        onSaveHeader({
            title: localSelectedKpi?.label,
            showPeriod: localShowPeriod,
            kpi: localSelectedKpi ?? null,
            showGraph: chartEnabled,
            chartType: localChartType,
            selectedPeriod: localShowPeriod ? (mainValue.toLowerCase() as 'mtd' | 'qtd' | 'ytd') : '',
            trendPeriod: localTrendPeriod,
            projectionsEnabled: localProjections
        });
        onClose();
    };

    // Handlers
    const handleChartToggle = (checked: boolean) => {
        setChartEnabled(checked);
        onLiveHeaderUpdate({ showGraph: checked });
        // if (!checked) {
        //     setProjectionsEnabled(false);
        // }
    };

    const selectChartType = (type: ChartType) => {
        setLocalChartType(type);
        onLiveHeaderUpdate({ chartType: type });
    };

    // const handleTrendPeriodClick = (val: TrendPeriod) => {
    //     setTrendPeriod(val);
    //     // Not persisted (UI only for now)
    // };

    const handleMainValueClick = (val: MainValue) => {
        setMainValue(val);
        // When show period is on, live update selectedPeriod
        onLiveHeaderUpdate({ selectedPeriod: localShowPeriod ? (val.toLowerCase() as 'mtd' | 'qtd' | 'ytd') : '' });
    };

    // Reset should restore local UI to defaults (AND push to preview live)
    const handleReset = () => {
        const restoredKpi = defaultSelectedOption;
        const restoredShowPeriod = !!showPeriod;
        const restoredShowGraph = !!showGraph;
        const restoredChartType = chartType ?? 'area';
        const restoredMainVal: MainValue = ((selectedPeriod?.toUpperCase() as MainValue) || 'YTD');

        setLocalSelectedKpi(restoredKpi);
        setLocalShowPeriod(restoredShowPeriod);

        // Push header state to preview live
        onLiveHeaderUpdate({
            title: restoredKpi?.label,
            showPeriod: restoredShowPeriod,
            kpi: restoredKpi ?? null,
        });

        // Reset KPI Card Setup local UI + live preview
        setChartEnabled(restoredShowGraph);
        setLocalChartType(restoredChartType);
        setTrendPeriod('1Y');
        setMainValue(restoredMainVal);
        setShowMTD(false);
        setShowQTD(false);
        setShowYTD(true);

        onLiveHeaderUpdate({
            showGraph: restoredShowGraph,
            chartType: restoredChartType,
            selectedPeriod: restoredShowPeriod ? (restoredMainVal.toLowerCase() as 'mtd' | 'qtd' | 'ytd') : '',
        });

        setLocalTrendPeriod(trendPeriod);
        setLocalProjections(projectionsEnabled);

        onLiveHeaderUpdate({
            trendPeriod,
            projectionsEnabled,
        });
    };

    const handleClose = () => {
        // ✅ revert live preview back to saved props on cancel
        onLiveHeaderUpdate({
            title: defaultSelectedOption?.label,
            showPeriod: !!showPeriod,
            kpi: defaultSelectedOption ?? null,
            showGraph: !!showGraph,
            chartType: chartType ?? 'area',
            selectedPeriod: showPeriod ? ((selectedPeriod || 'ytd') as any) : '',
            trendPeriod,
            projectionsEnabled,
        });
        onClose();
    };

    // Derived visibility for dependent toggles (only show *other* two)
    const showMTDToggle = mainValue !== 'MTD' && isMTDAvailable;
    const showQTDToggle = mainValue !== 'QTD' && isQTDAvailable;
    const showYTDToggle = mainValue !== 'YTD' && isYTDAvailable;

    // Helper: lightweight selected style for chart type
    const chartBtnStyle: React.CSSProperties = {
        outline: '2px solid transparent',
        borderRadius: 8,
    };
    const chartBtnSelectedStyle: React.CSSProperties = {
        outline: '2px solid var(--green-500, #2BB673)',
        borderRadius: 8,
    };

    return (
        <Flex className={styles['single-kpi-flyout-wrapper']}>
            <Flyout
                heading="Setup your widget"
                dataTestId="single-kpi-flyout"
                flyoutOpen={isOpen}
                direction="left"
                cancelIconClick={handleClose}
                iconForCancel={{ icon: 'x-close', onClick: handleClose }}
                className={styles['flyout-container-single-kpi']}
                id="single-kpi-flyout"
                containerMaxWidth={'100%'}
                showfooter={false}
                customActions={
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '16px',
                            marginRight: '10px',
                        }}
                    >
                        <Button onClick={handleSave} variant="Primary" text="Save Chart" />
                        <Button onClick={handleReset} variant="Secondary" text="Reset" />
                    </div>
                }
                content={
                    <Flex className={styles['single-kpi-container']}>
                        {/* Left: live preview area */}
                        <Flex className={styles['single-kpi-preview-area']} align="flex-start" justify="flex-start">
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

                        {/* Right: Settings area */}
                        <Flex vertical className={styles['single-kpi-settings-area']} gap={8}>
                            {/* Header accordion (existing) */}
                            <Accordion title="Header" outlined={false} containerWidth={'320px'}>
                                <React.Fragment key=".0">
                                    <Flex vertical gap={12} style={{ backgroundColor: '#fafafa', padding: 12 }}>
                                        <Label type="body3">Select KPI</Label>
                                        <DropDown
                                            className={styles['metric-dropdown']}
                                            dataTestId="dropd-down"
                                            dropdown={{
                                                isDisabled: false,
                                                isLabelInline: false,
                                                onChange: onKpiDropdownChange,
                                                onScroll: () => { },
                                                isMultiSelect: false,
                                                options: kpiOptions,
                                                placeholder: 'Select from the list',
                                                required: false,
                                                reset: false,
                                                selectedOptions: localSelectedKpi ? [localSelectedKpi] : [],
                                                showMoreCount: false,
                                                showSelectAll: false,
                                                showtooltipcounter: false,
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

                                        <div style={{ marginTop: 8 }}>
                                            <Switch
                                                label="Show Period"
                                                onToggle={onToggleShowPeriod}
                                                position="right"
                                                checked={localShowPeriod}
                                            />
                                        </div>
                                    </Flex>
                                </React.Fragment>
                            </Accordion>

                            {/* KPI Card Setup — now live + persisted */}
                            <Accordion title="KPI Card Setup" outlined={false}>
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
                                                        {/* In this order: area, bar, line */}
                                                        <div
                                                            style={
                                                                localChartType === 'area'
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
                                                        <div
                                                            style={
                                                                localChartType === 'bar'
                                                                    ? chartBtnSelectedStyle
                                                                    : chartBtnStyle
                                                            }
                                                        >
                                                            <ChartTypeButton
                                                                icon={<ClusteredColumnIcon />}
                                                                onClick={() => selectChartType('bar')}
                                                                size={56}
                                                            />
                                                        </div>
                                                        <div
                                                            style={
                                                                localChartType === 'line'
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
                                                    </Flex>
                                                </Flex>

                                                {/* Trend Period */}
                                                <Flex gap={8} justify='space-between' align='center'>
                                                    <Label type="body2">Trend Period</Label>
                                                    <SegmentedControl
                                                        onClick={(val: '3M' | '6M' | '1Y') => {
                                                            setLocalTrendPeriod(val);
                                                            onLiveHeaderUpdate({ trendPeriod: val });
                                                        }}
                                                        options={[{ value: '3M' }, { value: '6M' }, { value: '1Y' }]}
                                                        size="S"
                                                        selected={localTrendPeriod}
                                                    />
                                                </Flex>

                                                {/* Projections (UI only) */}
                                                <Flex justify='space-between' align='center'>
                                                    <Label type="body2">Projections</Label>
                                                    <Switch
                                                        onToggle={(v) => {
                                                            setLocalProjections(v);
                                                            onLiveHeaderUpdate({ projectionsEnabled: v });
                                                        }}
                                                        position='right'
                                                        checked={localProjections}
                                                    />
                                                </Flex>

                                            </>
                                        )}

                                        {/* Main Value + dependent toggles */}
                                        <Flex justify='space-between' align='center'>
                                            <Label type="body2">Main Value</Label>
                                            <SegmentedControl
                                                onClick={(val: any) => handleMainValueClick(val)}
                                                options={[{ value: 'MTD' }, { value: 'QTD' }, { value: 'YTD' }]}
                                                size="S"
                                            />
                                        </Flex>

                                        {/* Dependent toggles (UI-only) */}
                                        {showMTDToggle && (
                                            <Flex justify='space-between' align='center'>
                                                <Label type="body2">MTD</Label>
                                                <Switch
                                                    onToggle={setShowMTD}
                                                    position="right"
                                                    checked={showMTD}
                                                />
                                            </Flex>

                                        )}
                                        {showQTDToggle && (
                                            <Flex justify='space-between' align='center'>
                                                <Label type="body2">QTD</Label>
                                                <Switch
                                                    onToggle={setShowQTD}
                                                    position="right"
                                                    checked={showQTD}
                                                />
                                            </Flex>

                                        )}
                                        {showYTDToggle && (
                                            <Flex justify='space-between' align='center'>
                                                <Label type="body2">YTD</Label>
                                                <Switch
                                                    onToggle={setShowYTD}
                                                    position="right"
                                                    checked={showYTD}
                                                />
                                            </Flex>

                                        )}
                                    </Flex>
                                </React.Fragment>
                            </Accordion>
                        </Flex>
                    </Flex>
                }
            />
        </Flex>
    );
};

export default SingleKpiEditFlyout;
