import { Flex } from 'antd';
import { AnimatedLoaders, Icon, KpiCards, SideMenu } from 'konnect-react-components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../PerformanceManagementCustomisations.module.scss';
import { Label } from '../../../atoms';
// ❌ Removed: import { getKpiDetails } from '../../../../services/performanceManagementWidgets';
import {
    type KpiDetailsParams,
    type KPICardData as APIKpiCardData,
    transformKpiDetailsToCardData,
} from '../kpiDetailsToCardData';
import KpiCardActions from './KpiCardActions';
import { applyTrendAndProjections } from './kpiTrendProjectionUtils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
type KpiOption = {
    label: string;
    value: string;
    category?: string;
};

/** ---- Local Types ---- */
type Color = 'green' | 'black' | 'yellow' | 'red';
type Deviation = 'increase' | 'decrease';

type MetricPoint = {
    forecast: boolean;
    month: string;
    showInXAxis: boolean;
    target: number;
    value: number;
};

type KpiCardData = {
    currentPeriodValue: number;
    currentPeriodValueColor?: Color;
    date: string;
    deviation?: Deviation;
    deviationString: string;
    deviationValueColor?: Color;
    kpi: string;
    metricData: MetricPoint[];
};

interface ISingleKpiWidget {
    widgetId: string;
    activeTabId: number;
    selectedMetric: KpiOption[] | undefined;
    selectedChartType: string | undefined;
    onKpiCardSelected: (count: number) => void; // number of selected KPI cards in this widget
    persistKpiCard: (
        tabId: number,
        selected: boolean,
        payload?: { singleSelectedIds?: string[]; multipleSelected?: never },
    ) => void; // persist selected ids per tab
    initialSelectedIds?: string[];
    trendPeriod: '3M' | '6M' | '1Y';
    projectionsEnabled: boolean;
    readOnly?: boolean;

    /**
     * ONLY for read-only usage on dashboard (renderByOrder path).
     * Token representing this widget instance in widgetOrder (e.g., 'single-kpi:<id>')
     * Enables delete/duplicate actions to correctly target Redux state.
     */
    widgetToken?: string;
}

/** ----------------------------------------------------------------
 *  ✅ Dummy API Response (your payload)
 *  ---------------------------------------------------------------- */
interface DummyKpiMetric {
    kpI_ID: number;
    kpi: string;
    isChild: 'Yes' | 'No';
    parentKPI_Id: number | null;
    parentKPI: string | null;
    currentPeriodValue: number;
    previousPeriodValue: number;
    greenWhen: string; // will be coerced later
    selectedMetrics: string;
    date: string; // ISO
    target: number | null;
    tolerance: number | null;
    mtd: number;
    qtd: number;
    ytd: number;
    changePercentage: number;
    changeDirection: string;
}

interface DummyKpiDetail {
    id: number;
    kpI_ID: number;
    kpi: string;
    intervalType: string; // 'M' | 'W' | 'D' etc.
    intervalValue: string; // e.g., "Dec"
    value: number;
    forecast: number | null;
    target: number | null;
    tolerance: number | null;
    day: number | null;
    week: number | null;
    month: number;
    year: number;
    daI_UPDT_DTTM: string; // ISO
}

interface DummySection {
    kpiMetrics: DummyKpiMetric[];
    kpiDetail: DummyKpiDetail[];
}

interface DummyApiResponse {
    statusCode: number;
    data: DummySection[];
    message: string | null;
}

const DUMMY_API_RESPONSE: DummyApiResponse = {
    statusCode: 200,
    data: [
        {
            kpiMetrics: [
                {
                    kpI_ID: 57,
                    kpi: 'Average Release Lead Time- as shown for may month in agility',
                    isChild: 'No',
                    parentKPI_Id: null,
                    parentKPI: null,
                    currentPeriodValue: 4.17,
                    previousPeriodValue: 3.97,
                    greenWhen: 'Negative',
                    selectedMetrics: 'Days',
                    date: '2026-12-25T00:00:00',
                    target: null,
                    tolerance: null,
                    mtd: 4.17,
                    qtd: 4.22,
                    ytd: 4.05,
                    changePercentage: 5.04,
                    changeDirection: 'Positive',
                },
            ],
            kpiDetail: [
                {
                    id: 0,
                    kpI_ID: 57,
                    kpi: 'Average Release Lead Time- as shown for may month in agility',
                    intervalType: 'M',
                    intervalValue: 'Dec',
                    value: 4.17,
                    forecast: null,
                    target: 21.83,
                    tolerance: null,
                    day: null,
                    week: null,
                    month: 12,
                    year: 2025,
                    daI_UPDT_DTTM: '2026-02-02T00:00:00',
                },
                {
                    id: 0,
                    kpI_ID: 57,
                    kpi: 'Average Release Lead Time- as shown for may month in agility',
                    intervalType: 'M',
                    intervalValue: 'Nov',
                    value: 3.97,
                    forecast: null,
                    target: 3.35,
                    tolerance: null,
                    day: null,
                    week: null,
                    month: 11,
                    year: 2025,
                    daI_UPDT_DTTM: '2026-02-02T00:00:00',
                },
                {
                    id: 0,
                    kpI_ID: 57,
                    kpi: 'Average Release Lead Time- as shown for may month in agility',
                    intervalType: 'M',
                    intervalValue: 'Oct',
                    value: 4.48,
                    forecast: null,
                    target: 3.44,
                    tolerance: null,
                    day: null,
                    week: null,
                    month: 10,
                    year: 2025,
                    daI_UPDT_DTTM: '2026-02-02T00:00:00',
                },
                {
                    id: 0,
                    kpI_ID: 57,
                    kpi: 'Average Release Lead Time- as shown for may month in agility',
                    intervalType: 'M',
                    intervalValue: 'Sep',
                    value: 3.78,
                    forecast: null,
                    target: 3.32,
                    tolerance: null,
                    day: null,
                    week: null,
                    month: 9,
                    year: 2025,
                    daI_UPDT_DTTM: '2026-02-02T00:00:00',
                },
                {
                    id: 0,
                    kpI_ID: 57,
                    kpi: 'Average Release Lead Time- as shown for may month in agility',
                    intervalType: 'M',
                    intervalValue: 'Aug',
                    value: 3.84,
                    forecast: null,
                    target: 3.56,
                    tolerance: null,
                    day: null,
                    week: null,
                    month: 8,
                    year: 2025,
                    daI_UPDT_DTTM: '2026-02-02T00:00:00',
                },
                {
                    id: 0,
                    kpI_ID: 57,
                    kpi: 'Average Release Lead Time- as shown for may month in agility',
                    intervalType: 'M',
                    intervalValue: 'Jul',
                    value: 3.5,
                    forecast: null,
                    target: 3.31,
                    tolerance: null,
                    day: null,
                    week: null,
                    month: 7,
                    year: 2025,
                    daI_UPDT_DTTM: '2026-02-02T00:00:00',
                },
                {
                    id: 0,
                    kpI_ID: 57,
                    kpi: 'Average Release Lead Time- as shown for may month in agility',
                    intervalType: 'M',
                    intervalValue: 'Jun',
                    value: 4.38,
                    forecast: null,
                    target: 3.31,
                    tolerance: null,
                    day: null,
                    week: null,
                    month: 6,
                    year: 2025,
                    daI_UPDT_DTTM: '2026-02-02T00:00:00',
                },
                {
                    id: 0,
                    kpI_ID: 57,
                    kpi: 'Average Release Lead Time- as shown for may month in agility',
                    intervalType: 'M',
                    intervalValue: 'May',
                    value: 4.55,
                    forecast: null,
                    target: 3.29,
                    tolerance: null,
                    day: null,
                    week: null,
                    month: 5,
                    year: 2025,
                    daI_UPDT_DTTM: '2026-02-02T00:00:00',
                },
                {
                    id: 0,
                    kpI_ID: 57,
                    kpi: 'Average Release Lead Time- as shown for may month in agility',
                    intervalType: 'M',
                    intervalValue: 'Apr',
                    value: 4.09,
                    forecast: null,
                    target: 3.34,
                    tolerance: null,
                    day: null,
                    week: null,
                    month: 4,
                    year: 2025,
                    daI_UPDT_DTTM: '2026-02-02T00:00:00',
                },
                {
                    id: 0,
                    kpI_ID: 57,
                    kpi: 'Average Release Lead Time- as shown for may month in agility',
                    intervalType: 'M',
                    intervalValue: 'Mar',
                    value: 4.01,
                    forecast: null,
                    target: 3.16,
                    tolerance: null,
                    day: null,
                    week: null,
                    month: 3,
                    year: 2025,
                    daI_UPDT_DTTM: '2026-02-02T00:00:00',
                },
                {
                    id: 0,
                    kpI_ID: 57,
                    kpi: 'Average Release Lead Time- as shown for may month in agility',
                    intervalType: 'M',
                    intervalValue: 'Feb',
                    value: 4.04,
                    forecast: null,
                    target: 3.53,
                    tolerance: null,
                    day: null,
                    week: null,
                    month: 2,
                    year: 2025,
                    daI_UPDT_DTTM: '2026-02-02T00:00:00',
                },
                {
                    id: 0,
                    kpI_ID: 57,
                    kpi: 'Average Release Lead Time- as shown for may month in agility',
                    intervalType: 'M',
                    intervalValue: 'Jan',
                    value: 3.79,
                    forecast: null,
                    target: 3.4,
                    tolerance: null,
                    day: null,
                    week: null,
                    month: 1,
                    year: 2025,
                    daI_UPDT_DTTM: '2026-02-02T00:00:00',
                },
            ],
        },
    ],
    message: null,
} as const;

/** ----------------------------------------------------------------
 *  ✅ Adapter types that match what transformKpiDetailsToCardData expects
 *  ---------------------------------------------------------------- */
type GreenWhen = 'Positive' | 'Negative' | 'Neutral';

interface WireKpiMetric {
    kpI_ID: number;
    kpi: string;
    isChild: 'Yes' | 'No';
    parentKPI_Id: number | null;
    parentKPI: string | null;
    currentPeriodValue: number;
    previousPeriodValue: number;
    greenWhen: GreenWhen;
    selectedMetrics: string;
    date: string;
    target: number | null;
    tolerance: number | null;
    mtd: number;
    qtd: number;
    ytd: number;
    changePercentage: number;
    changeDirection: 'Positive' | 'Negative' | 'Neutral' | string;
}

interface WireKpiDetail {
    id: number;
    kpI_ID: number;
    kpi: string;
    intervalType: string;
    intervalValue: string;
    value: number;
    forecast: number | null;
    target: number | null;
    tolerance: number | null;
    day: number | null;
    week: number | null;
    month: number;
    year: number;
    daI_UPDT_DTTM: string;
}

interface WireSection {
    kpiMetrics: WireKpiMetric[];
    kpiDetail: WireKpiDetail[];
}

interface KpiDetailsApiResponse {
    statusCode: number;
    data: WireSection[];
    message: string | null;
}

/** Coerce arbitrary string to allowed GreenWhen union */
function coerceGreenWhen(val: string): GreenWhen {
    if (val === 'Positive' || val === 'Negative' || val === 'Neutral') return val;
    // If backend sends other values, pick a sensible default
    return 'Neutral';
}

/** Adapter: DummyApiResponse → KpiDetailsApiResponse (no `any`) */
function toWireResponse(dummy: DummyApiResponse): KpiDetailsApiResponse {
    const wireSections: WireSection[] = (dummy.data ?? []).map(section => ({
        kpiMetrics: (section.kpiMetrics ?? []).map(
            (m): WireKpiMetric => ({
                kpI_ID: m.kpI_ID,
                kpi: m.kpi,
                isChild: m.isChild === 'Yes' ? 'Yes' : 'No',
                parentKPI_Id: m.parentKPI_Id,
                parentKPI: m.parentKPI,
                currentPeriodValue: m.currentPeriodValue,
                previousPeriodValue: m.previousPeriodValue,
                greenWhen: coerceGreenWhen(m.greenWhen),
                selectedMetrics: m.selectedMetrics,
                date: m.date,
                target: m.target,
                tolerance: m.tolerance,
                mtd: m.mtd,
                qtd: m.qtd,
                ytd: m.ytd,
                changePercentage: m.changePercentage,
                changeDirection: m.changeDirection as WireKpiMetric['changeDirection'],
            }),
        ),
        kpiDetail: (section.kpiDetail ?? []).map(
            (d): WireKpiDetail => ({
                id: d.id,
                kpI_ID: d.kpI_ID,
                kpi: d.kpi,
                intervalType: d.intervalType,
                intervalValue: d.intervalValue,
                value: d.value,
                forecast: d.forecast,
                target: d.target,
                tolerance: d.tolerance,
                day: d.day,
                week: d.week,
                month: d.month,
                year: d.year,
                daI_UPDT_DTTM: d.daI_UPDT_DTTM,
            }),
        ),
    }));

    return {
        statusCode: dummy.statusCode,
        data: wireSections,
        message: dummy.message,
    };
}

const SingleKpiWidget: React.FC<ISingleKpiWidget> = ({
    activeTabId,
    selectedMetric,
    selectedChartType,
    onKpiCardSelected,
    persistKpiCard,
    initialSelectedIds,
    trendPeriod,
    projectionsEnabled,
    readOnly = false,
    widgetToken,
}) => {
    // Track multi-selection for single KPI cards
    const [selectedKpiIds, setSelectedKpiIds] = useState<Set<string>>(
        new Set(initialSelectedIds ?? []),
    );
    const [loading, setLoading] = useState(false);
    const [remoteCardDataById, setRemoteCardDataById] = useState<Record<string, KpiCardData>>({});

    // KPI options from Redux
    const performanceOverviewFilters = useSelector(
        (state: RootState) => state.performanceOverviewFilter.performanceOverviewFilters,
    );

    const [liveTrendPeriod, setLiveTrendPeriod] = useState<'3M' | '6M' | '1Y'>(trendPeriod);
    const [liveProjectionsEnabled, setLiveProjectionsEnabled] = useState<boolean>(projectionsEnabled);

    useEffect(() => {
        // keep in sync when Redux-saved props change (e.g., after Save)
        setLiveTrendPeriod(trendPeriod);
        setLiveProjectionsEnabled(projectionsEnabled);
    }, [trendPeriod, projectionsEnabled, activeTabId]);

    // If you have a typed store model for kpIs, you can import and use it here instead of this helper.
    type StoreKpi = { kpiName: string; kpiId: number | string };

    const kpiOptionsFromRedux: KpiOption[] = useMemo(() => {
        if (performanceOverviewFilters?.length && performanceOverviewFilters[0]?.kpIs) {
            return performanceOverviewFilters[0].kpIs.map((item: StoreKpi) => ({
                label: item.kpiName,
                value: String(item.kpiId),
            }));
        }
        return [];
    }, [performanceOverviewFilters]);

    // Header config lightweight state
    const [showPeriod, setShowPeriod] = useState<boolean>(true); // widget-scope
    const [titleById, setTitleById] = useState<Record<string, string>>({}); // per-card title override

    // NEW: KPI Card Setup lightweight state (per-card)
    const [showGraphById, setShowGraphById] = useState<Record<string, boolean>>({});
    const [chartTypeById, setChartTypeById] = useState<Record<string, 'area' | 'bar' | 'line'>>({});
    const [selectedPeriodById, setSelectedPeriodById] = useState<
        Record<string, '' | 'mtd' | 'qtd' | 'ytd'>
    >({});

    // Hydrate/Sync when tab changes or initial ids change
    useEffect(() => {
        setSelectedKpiIds(new Set(initialSelectedIds ?? []));
    }, [initialSelectedIds, activeTabId]);

    const hasSelectedMetrics = Array.isArray(selectedMetric) && selectedMetric.length > 0;

    const mapToLocalCardData = useCallback(
        (data: APIKpiCardData): KpiCardData => ({
            currentPeriodValue: data.currentPeriodValue,
            currentPeriodValueColor: data.currentPeriodValueColor as Color,
            date: data.date,
            deviation:
                data.deviation === 'increase'
                    ? 'increase'
                    : data.deviation === 'decrease'
                        ? 'decrease'
                        : undefined,
            deviationString: data.deviationString,
            deviationValueColor: data.deviationValueColor as Color,
            kpi: data.kpi,
            metricData: data.metricData,
        }),
        [],
    );

    const fallbackCard = useMemo<KpiCardData>(() => {
        const color: Color = hasSelectedMetrics ? 'green' : 'black';
        const devColor: Color = hasSelectedMetrics ? 'green' : 'black';
        const deviation: Deviation = 'decrease';
        return {
            currentPeriodValue: 4,
            currentPeriodValueColor: color,
            date: 'Jul 2024',
            deviation,
            deviationString: hasSelectedMetrics ? '2.4% vs PM' : '0',
            deviationValueColor: devColor,
            kpi:
                hasSelectedMetrics && selectedMetric && selectedMetric[0]
                    ? selectedMetric[0].label
                    : 'Name (%)',
            metricData: [
                { forecast: false, month: 'January', showInXAxis: true, target: 3, value: 1 },
                { forecast: false, month: 'February', showInXAxis: false, target: 3, value: 6 },
                { forecast: false, month: 'March', showInXAxis: false, target: 3, value: 4 },
                { forecast: false, month: 'April', showInXAxis: false, target: 3, value: 3 },
                { forecast: false, month: 'May', showInXAxis: false, target: 3, value: 4 },
                { forecast: false, month: 'Jun', showInXAxis: true, target: 3, value: 12 },
                { forecast: false, month: 'July', showInXAxis: false, target: 3, value: 2 },
                { forecast: false, month: 'August', showInXAxis: false, target: 3, value: 10 },
                { forecast: false, month: 'September', showInXAxis: false, target: 3, value: 12 },
                { forecast: false, month: 'October', showInXAxis: false, target: 3, value: 2 },
                { forecast: false, month: 'November', showInXAxis: false, target: 3, value: 12 },
                { forecast: false, month: 'December', showInXAxis: true, target: 3, value: 3 },
            ],
        };
    }, [hasSelectedMetrics, selectedMetric]);

    useEffect(() => {
        let cancelled = false;

        if (!selectedMetric || selectedMetric.length === 0) {
            setRemoteCardDataById({});
            setLoading(false);
            return;
        }

        setLoading(true);

        const run = async () => {
            try {
                const calls = selectedMetric.map(sel => {
                    const params: KpiDetailsParams = {
                        kpiId: sel.value,
                        kpiName: sel.label,
                        intervals: 'Monthly',
                        level: 'R',
                        month: 12,
                        year: 2025,
                    };

                    // ✅ Check if the dummy has a matching KPI
                    const hasMatchInDummy =
                        Array.isArray(DUMMY_API_RESPONSE.data) &&
                        DUMMY_API_RESPONSE.data.some(
                            section =>
                                Array.isArray(section.kpiMetrics) &&
                                section.kpiMetrics.some(m => String(m.kpI_ID) === sel.value),
                        );

                    if (!hasMatchInDummy) {
                        // Keep previous fallback behavior if KPI id isn't in dummy
                        return Promise.resolve({ id: sel.value, data: fallbackCard });
                    }

                    // ✅ Convert dummy response to the wire type expected by the transform
                    const wire = toWireResponse(DUMMY_API_RESPONSE);

                    // Keep existing transform + mapping for consistent UI behavior

                    type TransformInput = Parameters<typeof transformKpiDetailsToCardData>[0];

                    const transformed = transformKpiDetailsToCardData(
                        wire as TransformInput,
                        params,
                        {
                            axisTickIndices: [0, 5, 11],
                            monthLabelStyle: 'full',
                        },
                    );

                    const local = mapToLocalCardData(transformed);
                    return Promise.resolve({ id: sel.value, data: local });
                });

                const results = await Promise.allSettled(calls);
                if (cancelled) return;

                const nextMap: Record<string, KpiCardData> = {};
                results.forEach(r => {
                    if (r.status === 'fulfilled') {
                        nextMap[r.value.id] = r.value.data;
                    }
                });
                setRemoteCardDataById(nextMap);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [selectedMetric, mapToLocalCardData, fallbackCard]);

    const onCardClick = useCallback(
        (kpiId: string) => {
            if (readOnly) return;

            if (!hasSelectedMetrics) {
                setSelectedKpiIds(new Set());
                onKpiCardSelected(0);
                persistKpiCard(activeTabId, false, { singleSelectedIds: [] });
                return;
            }

            setSelectedKpiIds(prev => {
                const next = new Set(prev);
                if (next.has(kpiId)) next.delete(kpiId);
                else next.add(kpiId);

                const count = next.size;
                onKpiCardSelected(count);
                // Persist selected ids per tab
                persistKpiCard(activeTabId, count > 0, { singleSelectedIds: Array.from(next) });
                return next;
            });
        },
        [readOnly, hasSelectedMetrics, activeTabId, onKpiCardSelected, persistKpiCard],
    );

    useEffect(() => {
        if (!hasSelectedMetrics && selectedKpiIds.size > 0) {
            setSelectedKpiIds(new Set());
            onKpiCardSelected(0);
            persistKpiCard(activeTabId, false, { singleSelectedIds: [] });
        }
    }, [hasSelectedMetrics, selectedKpiIds, activeTabId, onKpiCardSelected, persistKpiCard]);

    // Helpers to read overrides with sensible fallbacks
    const getShowGraph = (id: string) => showGraphById[id] ?? true;
    const getChartType = (id: string) =>
        chartTypeById[id] ?? (selectedChartType as 'area' | 'bar' | 'line') ?? 'area';
    const getSelectedPeriod = (id: string) => (showPeriod ? (selectedPeriodById[id] ?? 'ytd') : '');

    return (
        <>
            {hasSelectedMetrics ? (
                <>
                    {loading ? (
                        <AnimatedLoaders id="lazy-loader" type="lazy" />
                    ) : (
                        <Flex gap={24} align="center" wrap="wrap">
                            {selectedMetric!.map(item => {
                                const isSelected = selectedKpiIds.has(item.value);
                                const cardData = remoteCardDataById[item.value] ?? fallbackCard;

                                // Apply header title override if any
                                const displayCardData: KpiCardData = {
                                    ...cardData,
                                    kpi: titleById[item.value] ?? cardData.kpi,
                                };

                                const finalMetricData = applyTrendAndProjections(
                                    displayCardData.metricData,
                                    liveTrendPeriod,
                                    liveProjectionsEnabled,
                                );

                                const finalCardData: KpiCardData = {
                                    ...displayCardData,
                                    metricData: finalMetricData,
                                };

                                // Period controls
                                const period = getSelectedPeriod(item.value);
                                const periodValue = showPeriod ? (isSelected ? '12' : '0') : '';

                                // console.log('metric points:', finalCardData.metricData.length, 'proj:', liveProjectionsEnabled);

                                if (readOnly) {
                                    return (
                                        <KpiCards
                                            key={item.value}
                                            data={finalCardData}
                                            selectedPeriod={period}
                                            selectedPeriodValue={periodValue}
                                            targetToshowOnCard={isSelected ? '3.5' : ''}
                                            selected={isSelected}
                                            className={`
                                                ${styles[isSelected ? 'performance-kpi-cards-selected' : 'performance-kpi-cards']}
                                                ${styles['mt-1rem']}
                                            `}
                                            chartType={getChartType(item.value)}
                                            showGraph={getShowGraph(item.value)}
                                            verticalDotsDropdown={
                                                widgetToken ? (
                                                    <KpiCardActions
                                                        token={widgetToken}
                                                        tabId={activeTabId}
                                                        preview={
                                                            <div
                                                                className={
                                                                    styles[
                                                                    'single-kpi-preview-card-holder'
                                                                    ]
                                                                }
                                                            >
                                                                <KpiCards
                                                                    data={finalCardData}
                                                                    selectedPeriod={period}
                                                                    selectedPeriodValue={
                                                                        periodValue
                                                                    }
                                                                    targetToshowOnCard={
                                                                        isSelected ? '3.5' : ''
                                                                    }
                                                                    selected={isSelected}
                                                                    className={
                                                                        styles[
                                                                        'performance-kpi-cards'
                                                                        ]
                                                                    }
                                                                    chartType={getChartType(
                                                                        item.value,
                                                                    )}
                                                                    showGraph={getShowGraph(
                                                                        item.value,
                                                                    )}
                                                                    showLegend={false}
                                                                />
                                                            </div>
                                                        }
                                                        kpiOptions={kpiOptionsFromRedux}
                                                        activeKpiId={item.value}
                                                        currentTitle={finalCardData.kpi}
                                                        showPeriod={showPeriod}
                                                        /** NEW: pass current KPI Card Setup overrides */
                                                        showGraph={getShowGraph(item.value)}
                                                        chartType={getChartType(item.value)}
                                                        selectedPeriod={
                                                            getSelectedPeriod(item.value) as
                                                            | 'mtd'
                                                            | 'qtd'
                                                            | 'ytd'
                                                            | ''
                                                        }
                                                        onLiveHeaderUpdate={cfg => {
                                                            if (
                                                                typeof cfg.showPeriod === 'boolean'
                                                            ) {
                                                                setShowPeriod(cfg.showPeriod);
                                                            }
                                                            if (cfg.title) {
                                                                setTitleById(prev => ({
                                                                    ...prev,
                                                                    [item.value]:
                                                                        cfg.title as string,
                                                                }));
                                                            }
                                                            // ----- KPI Card Setup (live) -----
                                                            if (
                                                                typeof cfg.showGraph === 'boolean'
                                                            ) {
                                                                setShowGraphById(prev => ({
                                                                    ...prev,
                                                                    [item.value]:
                                                                        cfg.showGraph as boolean,
                                                                }));
                                                            }
                                                            if (cfg.chartType) {
                                                                setChartTypeById(prev => ({
                                                                    ...prev,
                                                                    [item.value]: cfg.chartType as
                                                                        | 'area'
                                                                        | 'bar'
                                                                        | 'line',
                                                                }));
                                                            }
                                                            if (cfg.selectedPeriod !== undefined) {
                                                                setSelectedPeriodById(prev => ({
                                                                    ...prev,
                                                                    [item.value]:
                                                                        (cfg.selectedPeriod ||
                                                                            '') as
                                                                        | ''
                                                                        | 'mtd'
                                                                        | 'qtd'
                                                                        | 'ytd',
                                                                }));
                                                            }
                                                            if (cfg.trendPeriod) {
                                                                setLiveTrendPeriod(cfg.trendPeriod);
                                                            }
                                                            if (typeof cfg.projectionsEnabled === 'boolean') {
                                                                setLiveProjectionsEnabled(cfg.projectionsEnabled);
                                                            }
                                                        }}
                                                        onApplyHeaderConfig={cfg => {
                                                            // Save confirms the live state; update local overrides immediately
                                                            if (
                                                                typeof cfg.showPeriod === 'boolean'
                                                            ) {
                                                                setShowPeriod(cfg.showPeriod);
                                                            }

                                                            // If KPI changed, migrate all per-id overrides
                                                            if (
                                                                cfg.kpi &&
                                                                cfg.kpi.value !== item.value
                                                            ) {
                                                                const newId = cfg.kpi.value;
                                                                const currentTitle =
                                                                    cfg.title ??
                                                                    titleById[item.value] ??
                                                                    finalCardData.kpi;

                                                                setTitleById(prev => {
                                                                    const next = { ...prev };
                                                                    delete next[item.value];
                                                                    next[newId] =
                                                                        String(currentTitle);
                                                                    return next;
                                                                });

                                                                setShowGraphById(prev => {
                                                                    const next = { ...prev };
                                                                    const val = prev[item.value];
                                                                    delete next[item.value];
                                                                    if (val !== undefined)
                                                                        next[newId] = val;
                                                                    return next;
                                                                });

                                                                setChartTypeById(prev => {
                                                                    const next = { ...prev };
                                                                    const val = prev[item.value];
                                                                    delete next[item.value];
                                                                    if (val !== undefined)
                                                                        next[newId] = val;
                                                                    return next;
                                                                });

                                                                setSelectedPeriodById(prev => {
                                                                    const next = { ...prev };
                                                                    const val = prev[item.value];
                                                                    delete next[item.value];
                                                                    if (val !== undefined)
                                                                        next[newId] = val;
                                                                    return next;
                                                                });
                                                            } else if (cfg.title) {
                                                                setTitleById(prev => ({
                                                                    ...prev,
                                                                    [item.value]:
                                                                        cfg.title as string,
                                                                }));
                                                            }

                                                            // Persist latest KPI Card Setup on Save (for the current id or new id already migrated)
                                                            const targetId =
                                                                cfg.kpi &&
                                                                    cfg.kpi.value !== item.value
                                                                    ? cfg.kpi.value
                                                                    : item.value;

                                                            if (
                                                                typeof cfg.showGraph === 'boolean'
                                                            ) {
                                                                setShowGraphById(prev => ({
                                                                    ...prev,
                                                                    [targetId]:
                                                                        cfg.showGraph as boolean,
                                                                }));
                                                            }
                                                            if (cfg.chartType) {
                                                                setChartTypeById(prev => ({
                                                                    ...prev,
                                                                    [targetId]: cfg.chartType as
                                                                        | 'area'
                                                                        | 'bar'
                                                                        | 'line',
                                                                }));
                                                            }
                                                            if (cfg.selectedPeriod !== undefined) {
                                                                setSelectedPeriodById(prev => ({
                                                                    ...prev,
                                                                    [targetId]:
                                                                        (cfg.selectedPeriod ||
                                                                            '') as
                                                                        | ''
                                                                        | 'mtd'
                                                                        | 'qtd'
                                                                        | 'ytd',
                                                                }));
                                                            }
                                                        }}
                                                    />
                                                ) : undefined
                                            }
                                            showLegend={false}
                                        />
                                    );
                                }

                                return (
                                    <div
                                        key={item.value}
                                        className={
                                            styles[
                                            isSelected
                                                ? 'performance-overview-kpi-container-selected'
                                                : 'performance-overview-kpi-container'
                                            ]
                                        }
                                    >
                                        <Label type="body2">
                                            <span>Single KPI</span>
                                        </Label>

                                        <KpiCards
                                            data={displayCardData}
                                            selectedPeriod={period}
                                            selectedPeriodValue={periodValue}
                                            targetToshowOnCard={isSelected ? '3.5' : ''}
                                            selected={isSelected}
                                            className={
                                                styles[
                                                isSelected
                                                    ? 'performance-kpi-cards-selected'
                                                    : 'performance-kpi-cards'
                                                ]
                                            }
                                            chartType={getChartType(item.value)}
                                            showGraph={getShowGraph(item.value)}
                                            onClick={
                                                readOnly ? undefined : () => onCardClick(item.value)
                                            }
                                            verticalDotsDropdown={
                                                <SideMenu
                                                    action={
                                                        <Icon
                                                            color="neutrals-B600"
                                                            name="horizontal-dot-grey"
                                                            size="xm"
                                                        />
                                                    }
                                                    onOptionSelect={() => { }}
                                                    options={[
                                                        { label: 'Test1', value: 'options1' },
                                                        { label: 'Test2', value: 'options2' },
                                                    ]}
                                                />
                                            }
                                            showLegend={false}
                                        />
                                    </div>
                                );
                            })}
                        </Flex>
                    )}
                </>
            ) : (
                <div className={styles['performance-overview-kpi-container']}>
                    <Label type="body2">
                        <span>Single KPI</span>
                    </Label>
                    <KpiCards
                        data={{
                            ...fallbackCard,
                            currentPeriodValue: 0,
                            currentPeriodValueColor: 'black',
                            deviationString: '0',
                            kpi: 'Name (%)',
                        }}
                        selectedPeriod={showPeriod ? 'ytd' : ''}
                        selectedPeriodValue={showPeriod ? '0' : ''}
                        targetToshowOnCard=""
                        className={styles['performance-kpi-cards']}
                        chartType={(selectedChartType as 'area' | 'bar' | 'line') ?? 'area'}
                        showGraph={true}
                    />
                </div>
            )}
        </>
    );
};

export default SingleKpiWidget;
