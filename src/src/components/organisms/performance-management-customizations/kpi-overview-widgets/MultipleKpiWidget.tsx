import { Flex } from 'antd';
import {
    Accordion,
    AnimatedLoaders,
    Icon,
    IconButton,
    KpiCards,
    SegmentedControl,
    SideMenu,
    Switch,
    Tag,
    Dialog,
    Table,
} from 'konnect-react-components';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import styles from '../PerformanceManagementCustomisations.module.scss';
import { Label } from '../../../atoms';

// ❌ Removed: getKpiDetails API usage
import { type KpiDetailsParams, transformKpiDetailsToCardData } from '../kpiDetailsToCardData';
import { applyTrendAndProjections } from './kpiTrendProjectionUtils';
import MultipleKpiActions from './MultipleKpiActions';
import type { MultipleKpiConfigState } from '../../../../store/slice/performanceWidgetsByTabSlice';

export type KpiOption = { label: string; value: string; category?: string };
type KpiChartType = 'bar-clustered' | 'area' | 'line';
type KpiChipSettings = {
    chartEnabled: boolean;
    chartType: KpiChartType;
    trendPeriod: '3M' | '6M' | '1Y';
    projectionsEnabled: boolean;
    mainValue: 'MTD' | 'QTD' | 'YTD';
    showMTD: boolean;
    showQTD: boolean;
    showYTD: boolean;
};

type LocalKpiCategory = {
    id: string;
    title: string;
    defaultTitle: string;
    kpis: Array<{ id: string; label: string; unitLabel?: string; customSettings?: KpiChipSettings }>;
    isCustom?: boolean;
};

const DEFAULT_KPI_CATEGORIES: LocalKpiCategory[] = [
    { id: 'cat-1', title: 'Category 1', defaultTitle: 'Category 1', kpis: [] },
    { id: 'cat-2', title: 'Category 2', defaultTitle: 'Category 2', kpis: [] },
    { id: 'cat-3', title: 'Category 3', defaultTitle: 'Category 3', kpis: [] },
];

const DEFAULT_WIDGET_CONFIG: MultipleKpiConfigState = {
    gridViewEnabled: true,
    tableViewEnabled: false,
    showMTDTarget: true,
    chartEnabled: true,
    chartType: 'area',
    trendPeriod: '1Y',
    projectionsEnabled: false,
    mainValue: 'MTD',
    showMTD: false,
    showQTD: false,
    showYTD: true,
    showExceptions: false,
    kpiCategories: DEFAULT_KPI_CATEGORIES,
    pinnedIds: [],
};

interface IMultipleKpiWidget {
    widgetId: string;
    activeTabId: number;
    selectedMetric: KpiOption[] | undefined;
    selectedChartType?: string;
    onKpiCardSelected: (count: number) => void;
    persistKpiCard: (
        tabId: number,
        selected: boolean,
        payload?: { multipleSelected?: boolean; singleSelectedIds?: never },
    ) => void;
    initialSelected?: boolean;
    selectingFromTabs?: boolean;
    showPinIcon?: boolean;
    /** Controls showing the hover action icons (Edit/Delete) on the widget wrapper */
    showHoverOverIcon?: boolean;
    initialConfig?: MultipleKpiConfigState;
    persistMultipleKpiConfig?: (tabId: number, config: MultipleKpiConfigState) => void;
}

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

const buildCardData = (color: Color = 'red'): KpiCardData => ({
    currentPeriodValue: 4,
    currentPeriodValueColor: color,
    date: 'Jul 2024',
    deviation: 'decrease',
    deviationString: '2.4% vs PM',
    deviationValueColor: color,
    kpi: 'OTIF-D (%)',
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
});

/* ----------------------------------------------------------------
   ✅ SAME DUMMY RESPONSE AS SingleKpiWidget
------------------------------------------------------------------*/
interface DummyKpiMetric {
    kpI_ID: number;
    kpi: string;
    isChild: 'Yes' | 'No';
    parentKPI_Id: number | null;
    parentKPI: string | null;
    currentPeriodValue: number;
    previousPeriodValue: number;
    greenWhen: string;
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

/* ----------------------------------------------------------------
   ✅ Adapter types to match the transform's expected wire shape
------------------------------------------------------------------*/
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

function coerceGreenWhen(val: string): GreenWhen {
    if (val === 'Positive' || val === 'Negative' || val === 'Neutral') return val;
    return 'Neutral';
}

function toWireResponse(dummy: DummyApiResponse): KpiDetailsApiResponse {
    const wireSections: WireSection[] = (dummy.data ?? []).map(section => ({
        kpiMetrics: (section.kpiMetrics ?? []).map(
            (m): WireKpiMetric => ({
                kpI_ID: m.kpI_ID,
                kpi: m.kpi,
                isChild: m.isChild,
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
                changeDirection: m.changeDirection,
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

/* ----------------------------------------------------------------
   🔷 Component
------------------------------------------------------------------*/
const MultipleKpiWidget: React.FC<IMultipleKpiWidget> = ({
    activeTabId,
    selectedMetric,
    onKpiCardSelected,
    persistKpiCard,
    initialSelected = false,
    selectingFromTabs,
    showPinIcon = false,
    showHoverOverIcon = false,
    initialConfig,
    persistMultipleKpiConfig,
}) => {
    const [isSelected, setIsSelected] = useState<boolean>(!!initialSelected);
    const [remoteCardDataById, setRemoteCardDataById] = useState<Record<string, KpiCardData>>({});
    const [loading, setLoading] = useState(false);

    // Track pinned KPI ids (order represents the order in the Pinned accordion)
    const [pinnedIds, setPinnedIds] = useState<string[]>(initialConfig?.pinnedIds ?? []);

    // Local order for Category accordion (doesn't mutate parent selectedMetric)
    const [categoryOrder, setCategoryOrder] = useState<string[]>([]);

    // 🔹 Hover action visibility state (Edit/Delete for the wrapper)
    const [showWidgetActions, setShowWidgetActions] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const resolvedInitialConfig = useMemo<MultipleKpiConfigState>(
        () => ({
            ...DEFAULT_WIDGET_CONFIG,
            ...initialConfig,
            kpiCategories:
                initialConfig?.kpiCategories && initialConfig.kpiCategories.length > 0
                    ? initialConfig.kpiCategories
                    : DEFAULT_WIDGET_CONFIG.kpiCategories,
            pinnedIds: initialConfig?.pinnedIds ?? [],
        }),
        [initialConfig],
    );

    // 1. Saved config is what the actual widget displays
    const [savedConfig, setSavedConfig] = useState<MultipleKpiConfigState>(resolvedInitialConfig);

    // 2. Draft config is what the settings menu and preview display
    const [draftConfig, setDraftConfig] = useState<MultipleKpiConfigState>(resolvedInitialConfig);

    // --- Selection sync ---
    useEffect(() => {
        setIsSelected(!!initialSelected);
    }, [initialSelected, activeTabId]);

    useEffect(() => {
        setSavedConfig(resolvedInitialConfig);
        setDraftConfig(resolvedInitialConfig);
        setPinnedIds(resolvedInitialConfig.pinnedIds);
    }, [resolvedInitialConfig, activeTabId]);

    const isPinnedExpanded = false;
    const isCategoryExpanded = true;

    useEffect(() => {
        onKpiCardSelected(isSelected ? 1 : 0);
    }, [isSelected, onKpiCardSelected]);

    const onWrapperToggle = useCallback(() => {
        setIsSelected(prev => {
            const next = !prev;
            onKpiCardSelected(next ? 1 : 0);
            persistKpiCard(activeTabId, next, { multipleSelected: next });
            return next;
        });
    }, [activeTabId, onKpiCardSelected, persistKpiCard]);

    const stop = useCallback((e: React.SyntheticEvent) => e.stopPropagation(), []);

    const hasKpis = (selectedMetric && selectedMetric.length > 0) || isSelected;

    // --- Fetch KPI details for each selected metric (using dummy response) ---
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
                // Build "wire" response once and reuse
                const wire = toWireResponse(DUMMY_API_RESPONSE);
                type TransformInput = Parameters<typeof transformKpiDetailsToCardData>[0];
                type TransformResult = ReturnType<typeof transformKpiDetailsToCardData>;

                const calls = selectedMetric.map(sel => {
                    const params: KpiDetailsParams = {
                        kpiId: sel.value,
                        kpiName: sel.label,
                        intervals: 'Monthly',
                        level: 'R',
                        month: 12,
                        year: 2025,
                    };

                    // Check if this KPI id exists in dummy response
                    const found = wire.data.some(section =>
                        section.kpiMetrics.some(m => String(m.kpI_ID) === sel.value),
                    );

                    if (!found) {
                        // Fallback identical to previous behavior
                        return Promise.resolve<{ id: string; data: KpiCardData }>({
                            id: sel.value,
                            data: buildCardData('red'),
                        });
                    }

                    // Transform and return in same shape as before
                    const transformed = transformKpiDetailsToCardData(
                        wire as TransformInput,
                        params,
                        {
                            axisTickIndices: [0, 5, 11],
                            monthLabelStyle: 'full',
                        },
                    );

                    return Promise.resolve<{ id: string; data: TransformResult }>({
                        id: sel.value,
                        data: transformed,
                    });
                });

                const results = await Promise.allSettled(calls);
                if (cancelled) return;

                const nextMap: Record<string, KpiCardData> = {};
                results.forEach(r => {
                    if (r.status === 'fulfilled') {
                        const { id, data } = r.value as {
                            id: string;
                            data: TransformResult | KpiCardData;
                        };
                        // Normalize to KpiCardData
                        nextMap[id] = {
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
                        };
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
    }, [selectedMetric]);

    const pinnedFallback = useMemo(() => buildCardData('red'), []);
    const categoryFallback = useMemo(() => buildCardData('red'), []);
    const getCardDataForLabel = useCallback((id: string, label: string, fallback: KpiCardData) => {
        const data = remoteCardDataById[id] ?? fallback;
        return { ...data, kpi: label };
    }, [remoteCardDataById]);
    const mapChartTypeForCard = useCallback((chartType: KpiChartType | string): 'area' | 'bar' | 'line' => {
        if (chartType.includes('bar')) return 'bar';
        if (chartType === 'line') return 'line';
        return 'area';
    }, []);
    const getChipSettings = useCallback(
        (
            item: LocalKpiCategory['kpis'][number],
            config: {
                chartEnabled: boolean;
                chartType: string;
                mainValue: string;
                trendPeriod: string;
                projectionsEnabled: boolean;
            },
        ) => ({
            chartEnabled: item.customSettings?.chartEnabled ?? config.chartEnabled,
            chartType: item.customSettings?.chartType ?? config.chartType,
            mainValue: item.customSettings?.mainValue ?? config.mainValue,
            trendPeriod:
                item.customSettings?.trendPeriod ??
                ((config.trendPeriod === '3M' || config.trendPeriod === '6M'
                    ? config.trendPeriod
                    : '1Y') as '3M' | '6M' | '1Y'),
            projectionsEnabled:
                item.customSettings?.projectionsEnabled ?? config.projectionsEnabled,
        }),
        [],
    );

    // --- Order helpers ---
    const reorderByIds = useCallback((ids: string[], fromId: string, toId: string) => {
        if (fromId === toId) return ids;

        const fromIndex = ids.indexOf(fromId);
        const toIndex = ids.indexOf(toId);
        if (fromIndex === -1 || toIndex === -1) return ids;

        const next = [...ids];
        const [moved] = next.splice(fromIndex, 1);

        // Narrow the type from string | undefined to string
        if (moved === undefined) return ids;

        next.splice(toIndex, 0, moved);
        return next;
    }, []);

    // --- Build pinnedItems using pinnedIds order (so DnD reflects immediately) ---
    const pinnedItems = useMemo(() => {
        const map = new Map((selectedMetric ?? []).map(k => [k.value, k]));
        return pinnedIds.map(id => map.get(id)).filter(Boolean) as KpiOption[];
    }, [selectedMetric, pinnedIds]);

    // --- Keep pinnedIds valid when selectedMetric changes ---
    useEffect(() => {
        const valid = new Set((selectedMetric ?? []).map(k => k.value));
        setPinnedIds(prev => {
            const next = prev.filter(id => valid.has(id));
            if (next.length !== prev.length) {
                persistMultipleKpiConfig?.(activeTabId, {
                    ...savedConfig,
                    pinnedIds: next,
                });
            }
            return next;
        });
    }, [activeTabId, persistMultipleKpiConfig, savedConfig, selectedMetric]);

    // --- Maintain local category order (preserve existing, add new at end, remove stale) ---
    useEffect(() => {
        const incoming = (selectedMetric ?? []).map(k => k.value);
        setCategoryOrder(prev => {
            const kept = prev.filter(id => incoming.includes(id));
            const added = incoming.filter(id => !kept.includes(id));
            return [...kept, ...added];
        });
    }, [selectedMetric]);

    // Category items in local order
    const categoryItems = useMemo(() => {
        const map = new Map((selectedMetric ?? []).map(k => [k.value, k]));
        return categoryOrder.map(id => map.get(id)).filter(Boolean) as KpiOption[];
    }, [selectedMetric, categoryOrder]);

    const persistNextConfig = useCallback(
        (nextConfig: MultipleKpiConfigState, nextPinnedIds: string[] = pinnedIds) => {
            persistMultipleKpiConfig?.(activeTabId, {
                ...nextConfig,
                pinnedIds: nextPinnedIds,
            });
        },
        [activeTabId, persistMultipleKpiConfig, pinnedIds],
    );

    const updateSavedConfig = useCallback(
        (updater: (prev: MultipleKpiConfigState) => MultipleKpiConfigState) => {
            setSavedConfig(prev => {
                const next = updater(prev);
                persistNextConfig(next);
                return next;
            });
        },
        [persistNextConfig],
    );

    const updatePinnedIds = useCallback(
        (updater: (prev: string[]) => string[]) => {
            setPinnedIds(prev => {
                const next = updater(prev);
                persistNextConfig(savedConfig, next);
                return next;
            });
        },
        [persistNextConfig, savedConfig],
    );

    const draftRenderableCategories = useMemo(() => {
        const configured = draftConfig.kpiCategories.filter(category => category.kpis.length > 0);
        if (configured.length > 0) return configured;

        return categoryItems.length > 0
            ? [{ ...DEFAULT_KPI_CATEGORIES[0], kpis: categoryItems.map(item => ({ id: item.value, label: item.label })) }]
            : [];
    }, [draftConfig.kpiCategories, categoryItems]);

    const savedRenderableCategories = useMemo(() => {
        const configured = savedConfig.kpiCategories.filter(category => category.kpis.length > 0);
        if (configured.length > 0) return configured;

        return categoryItems.length > 0
            ? [{ ...DEFAULT_KPI_CATEGORIES[0], kpis: categoryItems.map(item => ({ id: item.value, label: item.label })) }]
            : [];
    }, [savedConfig.kpiCategories, categoryItems]);

    // --- Pin/unpin ---
    const togglePin = useCallback((id: string) => {
        updatePinnedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    }, [updatePinnedIds]);

    const getStatusSummary = useCallback(
        (category: { kpis: Array<{ id: string; label: string }> }) => {
            const summary = { onTrack: 0, withinTolerance: 0, offTrack: 0 };

            category.kpis.forEach(item => {
                const cardData = getCardDataForLabel(item.id, item.label, categoryFallback);
                const currentValue = cardData?.currentPeriodValue;
                const currentTarget = cardData?.metricData?.find(point => typeof point.target === 'number')?.target;

                if (typeof currentValue !== 'number' || typeof currentTarget !== 'number') {
                    return;
                }

                if (currentValue >= currentTarget) {
                    summary.onTrack += 1;
                    return;
                }

                const tolerance = Math.abs(currentTarget) * 0.05;
                if (Math.abs(currentTarget - currentValue) <= tolerance) {
                    summary.withinTolerance += 1;
                    return;
                }

                summary.offTrack += 1;
            });

            return summary;
        },
        [categoryFallback, getCardDataForLabel],
    );

    // --- Actions (no class/style on IconButton) ---
    const renderActions = useCallback(
        (kpiId: string, isPinned?: boolean) => (
            <div className={styles['kpi-card-actions']} onClick={stop} onKeyDown={stop}>
                {showPinIcon && (
                    <span className={styles['pin-trigger']}>
                        <IconButton
                            icon="pin-02"
                            size="Medium"
                            aria-label={isPinned ? 'Unpin KPI' : 'Pin KPI'}
                            onClick={() => togglePin(kpiId)}
                        />
                    </span>
                )}
                <SideMenu
                    action={
                        !showPinIcon && (
                            <Icon color="neutrals-B600" name="horizontal-dot-grey" size="xm" />
                        )
                    }
                    onOptionSelect={() => { }}
                    options={[
                        { label: 'Test1', value: 'options1' },
                        { label: 'Test2', value: 'options2' },
                    ]}
                />
            </div>
        ),
        [showPinIcon, stop, togglePin],
    );

    // Use 'selected' card class when widget is selected OR KPI is pinned (keeps pin icon visible)
    const getCardClass = (isCardSelected: boolean, isPinned: boolean) =>
        styles[
        isCardSelected || isPinned ? 'performance-kpi-cards-selected' : 'performance-kpi-cards'
        ];

    /** --------------------------
     *  Drag & Drop (native HTML5)
     *  - Within Pinned accordion: reorders pinnedIds
     *  - Within Category accordion: reorders categoryOrder
     *  - No cross-list dragging
     * -------------------------- */

    const DRAG_TYPE_PINNED = 'kpi/pinned';
    const DRAG_TYPE_CATEGORY = 'kpi/category';

    // Common helpers
    const setDragData = (e: React.DragEvent, type: string, id: string) => {
        e.dataTransfer.setData('type', type);
        e.dataTransfer.setData('id', id);
        // Optional: customize drag effect
        e.dataTransfer.effectAllowed = 'move';
    };
    const getDragData = (e: React.DragEvent) => {
        return {
            type: e.dataTransfer.getData('type'),
            id: e.dataTransfer.getData('id'),
        };
    };

    // Allow drop handler
    const allowDrop = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // --- Pinned DnD ---
    const onDragStartPinned = (id: string) => (e: React.DragEvent) => {
        stop(e);
        setDragData(e, DRAG_TYPE_PINNED, id);
    };
    const onDropPinnedOver = (targetId: string) => (e: React.DragEvent) => {
        stop(e);
        e.preventDefault();
        const { type, id: draggedId } = getDragData(e);
        if (type !== DRAG_TYPE_PINNED || !draggedId) return;
        setPinnedIds(prev => reorderByIds(prev, draggedId, targetId));
    };

    // --- Category DnD ---
    const onDragStartCategory = (id: string) => (e: React.DragEvent) => {
        stop(e);
        setDragData(e, DRAG_TYPE_CATEGORY, id);
    };
    const onDropCategoryOver = (targetId: string) => (e: React.DragEvent) => {
        stop(e);
        e.preventDefault();
        const { type, id: draggedId } = getDragData(e);
        if (type !== DRAG_TYPE_CATEGORY || !draggedId) return;
        setCategoryOrder(prev => reorderByIds(prev, draggedId, targetId));
    };

    const onDialogClose = useCallback(() => setIsDeleteOpen(false), []);

    const onConfirmDelete = useCallback(() => {
        // Non-destructive to parent ordering; clear local state and deselect
        setIsSelected(false);
        setPinnedIds([]);
        persistKpiCard(activeTabId, false, { multipleSelected: false });
        setIsDeleteOpen(false);
    }, [activeTabId, persistKpiCard]);

    // ---- TABLE VIEW helpers ----
    type TableKpiRow = {
        dimension: string;
        [kpiId: string]: unknown;
        expandedRowData?: TableKpiRow[];
    };

    const MOCK_METRICS = [
        { value: 'cfr', label: 'Case Fill Rate (%)' },
        { value: 'fbb', label: 'FBB Capital VAR to Target (#)' },
        { value: 'gm', label: 'GM AM Program Risk (%)' },
        { value: 'human', label: 'Human Element (#)' },
        { value: 'otif', label: 'OTIF-D (%)' },
        { value: 'arl', label: 'Average Release Lead Time- as shown for may month in agility' },
    ];

    type KpiCellValue = {
        value: number;
        target: number;
        color: string;
    };

    // Build columns: first col = Dimension, then one col per selected KPI
    const tableColumns = [
        {
            key: 'dimension',
            dataIndex: 'dimension',
            title: 'Dimension',
            width: '240px',
            resizable: true,
            sticky: 'left' as const,
        },
        ...(MOCK_METRICS ?? []).map(kpi => ({
            key: kpi.value,
            dataIndex: kpi.value,
            title: kpi.label,
            width: '240px',
            resizable: true,
            render: (value: unknown) => {
                const val = value as KpiCellValue | undefined;
                if (!val) return null;

                const dotColor: Record<string, string> = {
                    green: '#2BB673',
                    red: '#FF6B6B',
                    yellow: '#FFB000',
                    black: '#374151',
                };
                return (
                    // ✅ Update justify so it aligns left when target is hidden
                    <Flex
                        align="center"
                        justify={draftConfig.showMTDTarget ? 'space-between' : 'flex-start'}
                        style={{ width: '100%', paddingRight: '12px' }}
                    >
                        {/* Left side: Dot and Value */}
                        <Flex align="center" gap={6}>
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: dotColor[val.color] ?? dotColor.red,
                                    flexShrink: 0,
                                }}
                            />
                            <span style={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                                {val.value}
                            </span>
                        </Flex>

                        {/* ✅ Right side: Icon and Target (Now wrapped in a condition!) */}
                        {draftConfig.showMTDTarget && (
                            <Flex align="center" gap={6}>
                                <Icon name="target-04" size="xm" color="neutrals-B400" />
                                <span style={{ color: '#6B7280', fontSize: '0.8125rem' }}>
                                    {val.target}
                                </span>
                            </Flex>
                        )}
                    </Flex>
                );
            },
        })),
    ];

    // Build mock expandable rows (L1 → L2 structure)
    const buildKpiCell = (value: number, target: number, color: Color) => ({
        value,
        target,
        color,
    });

    const tableData: TableKpiRow[] = [
        {
            dimension: 'L1 Dimension',
            otif: buildKpiCell(68, 80, 'red'),
            cfr: buildKpiCell(64, 80, 'red'),
            fbb: buildKpiCell(64, 80, 'red'),
            gm: buildKpiCell(64, 80, 'red'),
            human: buildKpiCell(64, 80, 'red'),
            arl: buildKpiCell(64, 80, 'red'),
            expandedRowData: [
                {
                    dimension: 'L2 Dimension',
                    otif: buildKpiCell(30, 80, 'green'),
                    cfr: buildKpiCell(65, 80, 'red'),
                    fbb: buildKpiCell(64, 80, 'red'),
                    gm: buildKpiCell(64, 80, 'red'),
                    human: buildKpiCell(64, 80, 'red'),
                    arl: buildKpiCell(64, 80, 'red'),
                },
                {
                    dimension: 'L2 Dimension',
                    otif: buildKpiCell(38, 80, 'yellow'),
                    cfr: buildKpiCell(89, 80, 'green'),
                    fbb: buildKpiCell(64, 80, 'red'),
                    gm: buildKpiCell(64, 80, 'red'),
                    human: buildKpiCell(64, 80, 'red'),
                    arl: buildKpiCell(64, 80, 'red'),
                },
            ],
        },
        {
            dimension: 'L1 Dimension',
            otif: buildKpiCell(30, 80, 'green'),
            cfr: buildKpiCell(65, 80, 'red'),
            fbb: buildKpiCell(64, 80, 'red'),
            gm: buildKpiCell(64, 80, 'red'),
            human: buildKpiCell(64, 80, 'red'),
            arl: buildKpiCell(64, 80, 'red'),
            expandedRowData: [
                {
                    dimension: 'L2 Dimension',
                    otif: buildKpiCell(30, 80, 'green'),
                    cfr: buildKpiCell(65, 80, 'red'),
                    fbb: buildKpiCell(64, 80, 'red'),
                    gm: buildKpiCell(64, 80, 'red'),
                    human: buildKpiCell(64, 80, 'red'),
                    arl: buildKpiCell(64, 80, 'red'),
                },
            ],
        },
        {
            dimension: 'L1 Dimension',
            otif: buildKpiCell(30, 80, 'green'),
            cfr: buildKpiCell(65, 80, 'red'),
            fbb: buildKpiCell(64, 80, 'red'),
            gm: buildKpiCell(64, 80, 'red'),
            human: buildKpiCell(64, 80, 'red'),
            arl: buildKpiCell(64, 80, 'red'),
            expandedRowData: [
                {
                    dimension: 'L2 Dimension',
                    otif: buildKpiCell(30, 80, 'green'),
                    cfr: buildKpiCell(65, 80, 'red'),
                    fbb: buildKpiCell(64, 80, 'red'),
                    gm: buildKpiCell(64, 80, 'red'),
                    human: buildKpiCell(64, 80, 'red'),
                    arl: buildKpiCell(64, 80, 'red'),
                },
            ],
        },
        {
            dimension: 'L1 Dimension',
            otif: buildKpiCell(30, 80, 'green'),
            cfr: buildKpiCell(65, 80, 'red'),
            fbb: buildKpiCell(64, 80, 'red'),
            gm: buildKpiCell(64, 80, 'red'),
            human: buildKpiCell(64, 80, 'red'),
            arl: buildKpiCell(64, 80, 'red'),
            expandedRowData: [
                {
                    dimension: 'L2 Dimension',
                    otif: buildKpiCell(30, 80, 'green'),
                    cfr: buildKpiCell(65, 80, 'red'),
                    fbb: buildKpiCell(64, 80, 'red'),
                    gm: buildKpiCell(64, 80, 'red'),
                    human: buildKpiCell(64, 80, 'red'),
                    arl: buildKpiCell(64, 80, 'red'),
                },
                {
                    dimension: 'L2 Dimension',
                    otif: buildKpiCell(30, 80, 'green'),
                    cfr: buildKpiCell(65, 80, 'red'),
                    fbb: buildKpiCell(64, 80, 'red'),
                    gm: buildKpiCell(64, 80, 'red'),
                    human: buildKpiCell(64, 80, 'red'),
                    arl: buildKpiCell(64, 80, 'red'),
                },
            ],
        },
        {
            dimension: 'L1 Dimension',
            otif: buildKpiCell(68, 80, 'red'),
            cfr: buildKpiCell(64, 80, 'red'),
            fbb: buildKpiCell(64, 80, 'red'),
            gm: buildKpiCell(64, 80, 'red'),
            human: buildKpiCell(64, 80, 'red'),
            arl: buildKpiCell(64, 80, 'red'),
            expandedRowData: [
                {
                    dimension: 'L2 Dimension',
                    otif: buildKpiCell(30, 80, 'green'),
                    cfr: buildKpiCell(65, 80, 'red'),
                    fbb: buildKpiCell(64, 80, 'red'),
                    gm: buildKpiCell(64, 80, 'red'),
                    human: buildKpiCell(64, 80, 'red'),
                    arl: buildKpiCell(64, 80, 'red'),
                },
                {
                    dimension: 'L2 Dimension',
                    otif: buildKpiCell(38, 80, 'yellow'),
                    cfr: buildKpiCell(89, 80, 'green'),
                    fbb: buildKpiCell(64, 80, 'red'),
                    gm: buildKpiCell(64, 80, 'red'),
                    human: buildKpiCell(64, 80, 'red'),
                    arl: buildKpiCell(64, 80, 'red'),
                },
            ],
        },
        {
            dimension: 'L1 Dimension',
            otif: buildKpiCell(30, 80, 'green'),
            cfr: buildKpiCell(65, 80, 'red'),
            fbb: buildKpiCell(64, 80, 'red'),
            gm: buildKpiCell(64, 80, 'red'),
            human: buildKpiCell(64, 80, 'red'),
            arl: buildKpiCell(64, 80, 'red'),
            expandedRowData: [
                {
                    dimension: 'L2 Dimension',
                    otif: buildKpiCell(30, 80, 'green'),
                    cfr: buildKpiCell(65, 80, 'red'),
                    fbb: buildKpiCell(64, 80, 'red'),
                    gm: buildKpiCell(64, 80, 'red'),
                    human: buildKpiCell(64, 80, 'red'),
                    arl: buildKpiCell(64, 80, 'red'),
                },
            ],
        },
        {
            dimension: 'L1 Dimension',
            otif: buildKpiCell(30, 80, 'green'),
            cfr: buildKpiCell(65, 80, 'red'),
            fbb: buildKpiCell(64, 80, 'red'),
            gm: buildKpiCell(64, 80, 'red'),
            human: buildKpiCell(64, 80, 'red'),
            arl: buildKpiCell(64, 80, 'red'),
            expandedRowData: [
                {
                    dimension: 'L2 Dimension',
                    otif: buildKpiCell(30, 80, 'green'),
                    cfr: buildKpiCell(65, 80, 'red'),
                    fbb: buildKpiCell(64, 80, 'red'),
                    gm: buildKpiCell(64, 80, 'red'),
                    human: buildKpiCell(64, 80, 'red'),
                    arl: buildKpiCell(64, 80, 'red'),
                },
            ],
        },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const paginatedData = tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const paginationConfig = {
        totalItems: tableData.length,
        pageSize: pageSize,
        currentPage: currentPage,
        onPageChange: (page: number) => setCurrentPage(page),
        onPageSizeChange: (size: number) => {
            setPageSize(size);
            setCurrentPage(1);
        },
        hidePageSizeChange: true,
    };

    // 3. BUILD THE PREVIEW NODE
    const previewNode = (
        <div
            style={{
                width: '100%',
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '16px',
            }}
        >
            {/* --- MOCK HEADER --- */}
            <Flex align="center" justify="space-between" style={{ marginBottom: '16px' }}>
                <Label type="body2-b">
                    <span>Performance Overview</span>
                </Label>
                <Flex align="center" gap={12}>
                    <Switch
                        label="Show Exceptions"
                        className={styles['multiple-kpi-switch']}
                        checked={draftConfig.showExceptions}
                    />
                </Flex>
            </Flex>

            {!draftConfig.tableViewEnabled && (
                <Flex gap={16} align="center" style={{ marginBottom: '12px' }}>
                    <Flex gap={6} align="center">
                        <span className={styles['multiple-kpi-legend-dot']} />
                        <Label type="body3">
                            <span className={styles['multiple-kpi-legend-text']}>Actuals</span>
                        </Label>
                    </Flex>
                    <Flex gap={6} align="center">
                        <span className={styles['multiple-kpi-target-pill']}>--</span>
                        <Label type="body3">
                            <span className={styles['multiple-kpi-legend-text']}>Target</span>
                        </Label>
                    </Flex>
                </Flex>
            )}

            {hasKpis ? (
                draftConfig.tableViewEnabled ? (
                    <div style={{ overflowX: 'auto', width: '100%' }}>
                        <Table
                            columns={tableColumns}
                            data={paginatedData}
                            expandableRows={true}
                            scrollBarHeight={2}
                            pagination={paginationConfig}
                        />
                    </div>
                ) : (
                    <>
                        {/* --- CATEGORY ACCORDION PREVIEW --- */}
                        {draftRenderableCategories.map((category) => (
                            <Accordion
                                key={`preview-category-${category.id}`}
                                rightActions={[
                                    <span key="summary" className={styles['multiple-kpi-summary']}>
                                        {(() => {
                                            const summary = getStatusSummary(category);
                                            return (
                                                <>
                                                    <span className={styles['multiple-kpi-summary-text']}>
                                                        On Track
                                                        <span className={styles['multiple-kpi-summary-ontrack']}>
                                                            {String(summary.onTrack).padStart(2, '0')}
                                                        </span>
                                                    </span>
                                                    <span className={styles['multiple-kpi-summary-text']}>
                                                        Within Tolerance
                                                        <span className={styles['multiple-kpi-summary-tolerance']}>
                                                            {String(summary.withinTolerance).padStart(2, '0')}
                                                        </span>
                                                    </span>
                                                    <span className={styles['multiple-kpi-summary-text']}>
                                                        Off Track
                                                        <span className={styles['multiple-kpi-summary-offtrack']}>
                                                            {String(summary.offTrack).padStart(2, '0')}
                                                        </span>
                                                    </span>
                                                </>
                                            );
                                        })()}
                                    </span>,
                                ]}
                                fullWidth
                                outlined={false}
                                title={category.title ? category.title : ""}
                                isExpanded={true}
                                className={styles['performance-overview-accordion']}
                            >
                                <Flex gap={24} align="center" wrap="wrap" style={{ paddingTop: '16px' }}>
                                    {category.kpis.length === 0 ? (
                                        <div style={{ minHeight: '100px' }} />
                                    ) : (
                                        category.kpis.map((item) => {
                                            const chipSettings = getChipSettings(item, {
                                                chartEnabled: draftConfig.chartEnabled,
                                                chartType: draftConfig.chartType,
                                                mainValue: draftConfig.mainValue,
                                                trendPeriod: draftConfig.trendPeriod,
                                                projectionsEnabled: draftConfig.projectionsEnabled,
                                            });
                                            const rawCardData = getCardDataForLabel(item.id, item.label, categoryFallback);
                                            const finalCardData: KpiCardData = {
                                                ...rawCardData,
                                                metricData: applyTrendAndProjections(
                                                    rawCardData.metricData,
                                                    chipSettings.trendPeriod,
                                                    chipSettings.projectionsEnabled,
                                                ),
                                            };
                                            return (
                                                <div key={`preview-category-${category.id}-${item.id}`} style={{ pointerEvents: 'none' }}>
                                                    <KpiCards
                                                        data={finalCardData}
                                                        selectedPeriod={chipSettings.mainValue.toLowerCase()}
                                                        selectedPeriodValue="12"
                                                        targetToshowOnCard="3.5"
                                                        selected={true}
                                                        className={styles['performance-kpi-cards-selected']}
                                                        chartType={mapChartTypeForCard(chipSettings.chartType)}
                                                        showGraph={chipSettings.chartEnabled}
                                                        showLegend={false}
                                                    />
                                                </div>
                                            );
                                        })
                                    )}
                                </Flex>
                            </Accordion>
                        ))}
                    </>
                )
            ) : (
                <Flex
                    gap={24}
                    align="center"
                    justify="center"
                    style={{ padding: '30px', background: '#F9FAFB', borderRadius: '4px' }}
                >
                    <Label type="body2">
                        <span style={{ color: '#6B7280' }}>No KPI's added yet</span>
                    </Label>
                </Flex>
            )}
        </div>
    );

    let savedMappedChartType: 'area' | 'bar' | 'line' = 'area';
    if (savedConfig.chartType.includes('bar')) {
        savedMappedChartType = 'bar';
    } else if (savedConfig.chartType === 'line') {
        savedMappedChartType = 'line';
    } else if (savedConfig.chartType === 'area') {
        savedMappedChartType = 'area';
    }

    const showSelectionPreview = !selectingFromTabs && !showHoverOverIcon;

    const widgetBody = (
        <div
            className={styles['multiple-kpi-accordion-wrapper']}
            style={{ position: 'relative' }}
            onMouseEnter={() => setShowWidgetActions(true)}
            onMouseLeave={() => setShowWidgetActions(false)}
            onClick={selectingFromTabs ? () => { } : onWrapperToggle}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') onWrapperToggle();
            }}
        >
            {/* --------- Hover Action Strip (Delete, Edit) --------- */}
            {showHoverOverIcon && (
                <div
                    onClick={stop}
                    onMouseDown={stop}
                    onKeyDown={stop}
                    style={{ position: 'absolute', top: 16, right: 0, zIndex: 100 }}
                >
                    <MultipleKpiActions
                        showButtons={showWidgetActions && showHoverOverIcon}
                        preview={previewNode}
                        availableMetrics={selectedMetric ?? []}
                        gridViewEnabled={draftConfig.gridViewEnabled}
                        tableViewEnabled={draftConfig.tableViewEnabled}
                        showMTDTarget={draftConfig.showMTDTarget}
                        chartEnabled={draftConfig.chartEnabled}
                        chartType={draftConfig.chartType}
                        trendPeriod={draftConfig.trendPeriod}
                        projectionsEnabled={draftConfig.projectionsEnabled}
                        mainValue={draftConfig.mainValue}
                        showMTD={draftConfig.showMTD}
                        showQTD={draftConfig.showQTD}
                        showYTD={draftConfig.showYTD}
                        kpiCategories={draftConfig.kpiCategories}
                        tabId={activeTabId}
                        // Handle live updates
                        onLiveUpdate={payload => {
                            setDraftConfig(prev => {
                                const next = { ...prev, ...payload };

                                // If Table View is turned ON, turn OFF Grid View
                                if (payload.tableViewEnabled === true) {
                                    next.gridViewEnabled = false;
                                }
                                // If Grid View is turned ON, turn OFF Table View
                                if (payload.gridViewEnabled === true) {
                                    next.tableViewEnabled = false;
                                }

                                // Prevent both from being turned OFF at the same time
                                if (!next.tableViewEnabled && !next.gridViewEnabled) {
                                    if (payload.tableViewEnabled === false)
                                        next.gridViewEnabled = true;
                                    if (payload.gridViewEnabled === false)
                                        next.tableViewEnabled = true;
                                }

                                return next;
                            });
                        }}
                        // Handle saves
                        onSaveConfig={payload => {
                            setDraftConfig(prev => {
                                const next = { ...prev, ...payload };

                                if (payload.tableViewEnabled === true) {
                                    next.gridViewEnabled = false;
                                }
                                if (payload.gridViewEnabled === true) {
                                    next.tableViewEnabled = false;
                                }

                                if (!next.tableViewEnabled && !next.gridViewEnabled) {
                                    if (payload.tableViewEnabled === false)
                                        next.gridViewEnabled = true;
                                    if (payload.gridViewEnabled === false)
                                        next.tableViewEnabled = true;
                                }

                                updateSavedConfig(() => ({
                                    ...next,
                                    showExceptions: savedConfig.showExceptions,
                                    pinnedIds,
                                }));
                                return next;
                            });
                            // Optional: Dispatch Redux save here
                        }}
                        onResetConfig={() => {
                            setDraftConfig(savedConfig);
                        }}
                        // Handle Delete (You can wire Redux dispatch here if needed)
                        onDeleteConfirm={() => {
                            setIsSelected(false);
                            setPinnedIds([]);
                            persistKpiCard(activeTabId, false, { multipleSelected: false });
                        }}
                    />
                </div>
            )}

            <Flex align="center" justify="space-between" style={{ marginBottom: '16px', marginRight: '16px' }}>
                <Label type="body2-b">
                    <span>Performance Overview</span>
                </Label>

                <Flex gap={12} align="center">
                    <span onClick={stop} onMouseDown={stop} onKeyDown={stop}>
                        <Switch
                            label="Show Exceptions"
                            key="show_exceptions"
                            className={styles['multiple-kpi-switch']}
                            checked={savedConfig.showExceptions}
                            onToggle={checked =>
                                updateSavedConfig(prev => ({ ...prev, showExceptions: checked }))
                            }
                        />
                    </span>

                    <Flex gap={8} align="center">
                        {savedConfig.chartEnabled && (
                            <Tag
                                size="L"
                                text=""
                                icon="forecast"
                                active={savedConfig.projectionsEnabled}
                                className={styles['projection-tag']}
                                onClick={() => {
                                    updateSavedConfig(prev => ({
                                        ...prev,
                                        projectionsEnabled: !prev.projectionsEnabled,
                                    }));
                                }}
                            />
                        )}

                        <SegmentedControl
                            size="S"
                            iconOnly
                            selected={savedConfig.tableViewEnabled ? 'table' : 'grid'}
                            onClick={(value: 'grid' | 'table') => {
                                updateSavedConfig(prev => ({
                                    ...prev,
                                    gridViewEnabled: value === 'grid',
                                    tableViewEnabled: value === 'table',
                                }));
                            }}
                            options={[
                                { value: 'grid', icon: 'list' },
                                { value: 'table', icon: 'table' },
                            ]}
                        />
                    </Flex>
                </Flex>
            </Flex>

            {!savedConfig.tableViewEnabled && (
                <Flex gap={16} align="center" style={{ marginBottom: '12px' }}>
                    <Flex gap={6} align="center">
                        <span className={styles['multiple-kpi-legend-dot']} />
                        <Label type="body3">
                            <span className={styles['multiple-kpi-legend-text']}>Actuals</span>
                        </Label>
                    </Flex>
                    <Flex gap={6} align="center">
                        <span className={styles['multiple-kpi-target-pill']}>--</span>
                        <Label type="body3">
                            <span className={styles['multiple-kpi-legend-text']}>Target</span>
                        </Label>
                    </Flex>
                </Flex>
            )}

            {/* {showTable && <Table columns={columns} data={kpiTableData} />} */}

            {hasKpis ? (
                loading ? (
                    <AnimatedLoaders id="lazy-loader" type="lazy" />
                ) : savedConfig.tableViewEnabled ? (
                    <div
                        onClick={stop}
                        onMouseDown={stop}
                        style={{ overflowX: 'auto', width: '100%' }}
                    >
                        <Table
                            columns={tableColumns}
                            data={paginatedData}
                            expandableRows={true}
                            scrollBarHeight={2}
                            pagination={paginationConfig}
                        />
                    </div>
                ) : (
                    <>
                        {/* ---------- PINNED (reorder within accordion) ---------- */}
                        <Accordion
                            rightActions={[
                                <span
                                    key="count"
                                    style={{
                                        alignItems: 'center',
                                        background: '#E6E7EB',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '9999px',
                                        color: '#000',
                                        display: 'inline-flex',
                                        fontSize: '0.625rem',
                                        fontWeight: 600,
                                        height: '1.25rem',
                                        justifyContent: 'center',
                                        width: '1.25rem',
                                    }}
                                    title="Pinned KPI count"
                                >
                                    {pinnedItems.length}
                                </span>,
                            ]}
                            fullWidth
                            outlined={false}
                            title="Pinned KPI's"
                            isExpanded={isPinnedExpanded}
                            className={styles['performance-overview-accordion']}
                        >
                            <Flex
                                gap={24}
                                align="center"
                                wrap="wrap"
                                onClick={stop}
                                onDragOver={allowDrop}
                            >
                                {pinnedItems.length === 0 ? (
                                    <Label type="body2">
                                        <span style={{ color: '#6B7280' }}>
                                            No pinned KPI&apos;s yet
                                        </span>
                                    </Label>
                                ) : (
                                    pinnedItems.map(item => {
                                        const data =
                                            remoteCardDataById[item.value] ?? pinnedFallback;
                                        const isCardSelected = isSelected;
                                        const isPinned = true;
                                        return (
                                            <div
                                                key={`pinned-wrap-${item.value}`}
                                                draggable
                                                onDragStart={onDragStartPinned(item.value)}
                                                onDragOver={allowDrop}
                                                onDrop={onDropPinnedOver(item.value)}
                                            >
                                                <KpiCards
                                                    key={`pinned-${item.value}`}
                                                    data={data}
                                                    selectedPeriod={savedConfig.mainValue.toLowerCase()}
                                                    selectedPeriodValue={
                                                        isCardSelected ? '12' : '0'
                                                    }
                                                    targetToshowOnCard={
                                                        isCardSelected ? '3.5' : ''
                                                    }
                                                    verticalDotsDropdown={renderActions(
                                                        item.value,
                                                        isPinned,
                                                    )}
                                                    className={getCardClass(
                                                        isCardSelected,
                                                        isPinned,
                                                    )}
                                                    selected={isCardSelected}
                                                    chartType={savedMappedChartType}
                                                    showGraph={savedConfig.chartEnabled}
                                                    showRightPlaceholderOnlyOnHover={false}
                                                    showLegend={false}
                                                />
                                            </div>
                                        );
                                    })
                                )}
                            </Flex>
                        </Accordion>

                        {/* ---------- CATEGORY (reorder within accordion) ---------- */}
                        {savedRenderableCategories.map((category) => (
                            <Accordion
                                key={`saved-category-${category.id}`}
                                rightActions={[
                                    <span key="summary" className={styles['multiple-kpi-summary']}>
                                        {(() => {
                                            const summary = getStatusSummary(category);
                                            return (
                                                <>
                                                    <span className={styles['multiple-kpi-summary-text']}>
                                                        On Track
                                                        <span className={styles['multiple-kpi-summary-ontrack']}>
                                                            {String(summary.onTrack).padStart(2, '0')}
                                                        </span>
                                                    </span>
                                                    <span className={styles['multiple-kpi-summary-text']}>
                                                        Within Tolerance
                                                        <span className={styles['multiple-kpi-summary-tolerance']}>
                                                            {String(summary.withinTolerance).padStart(2, '0')}
                                                        </span>
                                                    </span>
                                                    <span className={styles['multiple-kpi-summary-text']}>
                                                        Off Track
                                                        <span className={styles['multiple-kpi-summary-offtrack']}>
                                                            {String(summary.offTrack).padStart(2, '0')}
                                                        </span>
                                                    </span>
                                                </>
                                            );
                                        })()}
                                    </span>,
                                ]}
                                fullWidth
                                outlined={false}
                                title={category.title ? category.title : ""}
                                isExpanded={isCategoryExpanded}
                                className={styles['performance-overview-accordion']}
                            >
                                <div onClick={stop} onDragOver={allowDrop}>
                                    <Flex gap={24} align="center" wrap="wrap">
                                        {category.kpis.map(item => {
                                            const isCardSelected = isSelected;
                                            const isPinned = pinnedIds.includes(item.id);
                                            const chipSettings = getChipSettings(item, {
                                                chartEnabled: savedConfig.chartEnabled,
                                                chartType: savedConfig.chartType,
                                                mainValue: savedConfig.mainValue,
                                                trendPeriod: savedConfig.trendPeriod,
                                                projectionsEnabled: savedConfig.projectionsEnabled,
                                            });
                                            const rawCardData = getCardDataForLabel(item.id, item.label, categoryFallback);
                                            const finalCardData: KpiCardData = {
                                                ...rawCardData,
                                                metricData: applyTrendAndProjections(
                                                    rawCardData.metricData,
                                                    chipSettings.trendPeriod,
                                                    chipSettings.projectionsEnabled,
                                                ),
                                            };
                                            return (
                                                <div
                                                    key={`category-wrap-${category.id}-${item.id}`}
                                                    draggable
                                                    onDragStart={onDragStartCategory(item.id)}
                                                    onDragOver={allowDrop}
                                                    onDrop={onDropCategoryOver(item.id)}
                                                >
                                                    <KpiCards
                                                        key={`${category.id}-${item.id}`}
                                                        data={finalCardData}
                                                        selectedPeriod={chipSettings.mainValue.toLowerCase()}
                                                        selectedPeriodValue={
                                                            isCardSelected ? '12' : '0'
                                                        }
                                                        targetToshowOnCard={
                                                            isCardSelected ? '3.5' : ''
                                                        }
                                                        verticalDotsDropdown={renderActions(
                                                            item.id,
                                                            isPinned,
                                                        )}
                                                        className={getCardClass(
                                                            isCardSelected,
                                                            isPinned,
                                                        )}
                                                        selected={isCardSelected}
                                                        chartType={mapChartTypeForCard(chipSettings.chartType)}
                                                        showGraph={chipSettings.chartEnabled}
                                                        showLegend={false}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </Flex>
                                </div>
                            </Accordion>
                        ))}
                    </>
                )
            ) : (
                <Flex gap={24} align="center" className={styles['multiple-no-kpi']}>
                    <Label type="body2">
                        <span className={styles['multiple-no-kpi-text']}>
                            No KPI&apos;s added yet
                        </span>
                    </Label>
                </Flex>
            )}
        </div>
    );

    return (
        <>
            {showSelectionPreview ? (
                <div
                    className={
                        styles[
                        isSelected
                            ? 'performance-overview-multiple-kpi-container-selected'
                            : 'performance-overview-multiple-kpi-container'
                        ]
                    }
                >
                    <Label type="body3">
                        <span>Multiple KPI&apos;s</span>
                    </Label>
                    {widgetBody}
                </div>
            ) : (
                widgetBody
            )}

            {/* -------- Delete Confirmation Dialog (same as KpiCardActions) -------- */}
            {isDeleteOpen && (
                <Dialog
                    title="Delete Widget"
                    content="Are you sure you want to delete the selected widget from your report ?"
                    isOpen
                    onClose={onDialogClose}
                    onPrimaryButtonClick={onConfirmDelete}
                    onSecondaryButtonClick={onDialogClose}
                    primaryButtonText="Delete"
                    secondaryButtonText="Continue to edit report"
                />
            )}
        </>
    );
};

export default MultipleKpiWidget;
