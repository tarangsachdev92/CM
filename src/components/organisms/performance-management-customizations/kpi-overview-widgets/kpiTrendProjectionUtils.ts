export type TrendProjectionMetricPoint = {
    forecast: boolean;
    month: string;
    showInXAxis: boolean;
    target: number;
    value: number;
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const monthToIndex = (label: string): number => {
    const key = (label ?? '').trim().slice(0, 3).toLowerCase();
    const idx = MONTHS_SHORT.findIndex((month) => month.toLowerCase() === key);
    return idx >= 0 ? idx : 0;
};

const indexToMonth = (idx: number): string => {
    const safe = ((idx % 12) + 12) % 12;
    return MONTHS_SHORT[safe]!;
};

const trendMonthsFromPeriod = (period: '3M' | '6M' | '1Y'): number =>
    period === '3M' ? 3 : period === '6M' ? 6 : 12;

const withXAxisTicks = (points: TrendProjectionMetricPoint[]): TrendProjectionMetricPoint[] => {
    if (points.length === 0) return points;

    const mid = Math.floor((points.length - 1) / 2);
    return points.map((point, index) => ({
        ...point,
        showInXAxis: index === 0 || index === mid || index === points.length - 1,
    }));
};

const appendProjectionMonths = (
    history: TrendProjectionMetricPoint[],
    monthsToAdd = 6,
): TrendProjectionMetricPoint[] => {
    if (history.length === 0) return history;

    const last = history[history.length - 1]!;
    const prev = history.length > 1 ? history[history.length - 2]! : last;

    const lastMonthIdx = monthToIndex(last.month);
    const slope = (last.value ?? 0) - (prev.value ?? 0);
    const baseTarget = Number.isFinite(last.target) ? last.target : 0;

    const projections: TrendProjectionMetricPoint[] = Array.from(
        { length: monthsToAdd },
        (_, index) => {
            const step = index + 1;
            const projected = (last.value ?? 0) + slope * step;

            return {
                forecast: true,
                month: indexToMonth(lastMonthIdx + step),
                showInXAxis: false,
                target: baseTarget,
                value: Number.isFinite(projected) ? Math.round(projected * 100) / 100 : 0,
            };
        },
    );

    return [...history, ...projections];
};

export const applyTrendAndProjections = (
    raw: TrendProjectionMetricPoint[],
    trendPeriod: '3M' | '6M' | '1Y',
    projectionsEnabled: boolean,
): TrendProjectionMetricPoint[] => {
    const keep = trendMonthsFromPeriod(trendPeriod);
    const trimmed = raw.length > keep ? raw.slice(raw.length - keep) : raw;
    const adjusted = projectionsEnabled
        ? appendProjectionMonths(trimmed, 6)
        : trimmed.map((point) => ({ ...point, forecast: false }));

    return withXAxisTicks(adjusted);
};