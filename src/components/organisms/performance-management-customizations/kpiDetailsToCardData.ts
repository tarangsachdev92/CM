export interface KpiMetrics {
    kpI_ID: number;
    kpi: string;
    isChild: 'Yes' | 'No';
    parentKPI_Id: number | null;
    parentKPI: string | null;
    currentPeriodValue: number | null;
    previousPeriodValue: number | null;
    greenWhen: 'Positive' | 'Negative' | 'Neutral';
    selectedMetrics: string | null;
    date: string | null;
    target: number | null;
    tolerance: number | null;
    mtd: number | null;
    qtd: number | null;
    ytd: number | null;
    changePercentage: number | null;
    changeDirection: 'Positive' | 'Negative' | 'Neutral' | null;
}

export interface KpiDetail {
    id: number;
    kpI_ID: number;
    kpi: string;
    intervalType: 'M' | 'Q' | 'Y';
    intervalValue: string;
    value: number | null;
    forecast: number | null; // presence indicates forecast; null => not forecasted
    target: number | null;
    tolerance: number | null;
    day: number | null;
    week: number | null;
    month: number;
    year: number;
    daI_UPDT_DTTM: string | null;
}

export interface ApiItem {
    kpiMetrics: KpiMetrics[];
    kpiDetail: KpiDetail[];
}

export interface KpiDetailsApiResponse {
    statusCode: number;
    data: ApiItem[];
    message: string | null;
}

export interface KpiDetailsParams {
    kpiId: string;
    kpiName: string;
    intervals: 'Monthly' | 'Quarterly' | 'Yearly';
    level: string;
    month: number;
    year: number;
}

/**
 * Target KPICard data shape
 */
export interface KPICardMetricPoint {
    forecast: boolean;
    month: string;       // e.g., 'January'
    showInXAxis: boolean;
    target: number;
    value: number;
}

export interface KPICardData {
    currentPeriodValue: number;
    currentPeriodValueColor: 'black' | 'red' | 'green';
    date: string; // e.g., 'Dec 2025'
    deviation: 'increase' | 'decrease' | 'no-change';
    deviationString: string; // formatted delta/percent
    deviationValueColor: 'black' | 'red' | 'green';
    kpi: string; // e.g., 'Change Control Timeliness (%)'
    metricData: KPICardMetricPoint[];
    // selectedMetric?: string; // add if needed
}

/**
 * Options for formatting/behavior
 */
export interface TransformOptions {
    /**
     * Indices (0-based) that should show X-axis labels. Default: [0, 5, 11] -> Jan, Jun, Dec
     */
    axisTickIndices?: number[];
    /**
     * Fill value when the API returns null for 'value' or 'target'.
     * Default is 0 for value and 0 for target to keep charts stable.
     */
    fillNullValue?: number;
    fillNullTarget?: number;
    /**
     * Month label style in metricData.month
     */
    monthLabelStyle?: 'full' | 'short';
}

const MONTHS_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const MONTHS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function clampMonth(m: number): number {
    if (m < 1) return 1;
    if (m > 12) return 12;
    return m;
}

function monthName(m: number, style: 'full' | 'short'): string {
    const idx = clampMonth(m) - 1;
    return style === 'short' ? MONTHS_SHORT[idx]! : MONTHS_FULL[idx]!;
}

function formatMonthYearShort(m: number, y: number): string {
    const idx = clampMonth(m) - 1;
    return `${MONTHS_SHORT[idx]} ${y}`;
}

function toNumberOr<T>(v: T | null | undefined, fallback: number): number {
    return typeof v === 'number' && !Number.isNaN(v as number) ? (v as number) : fallback;
}

function findDetail(details: KpiDetail[], month: number, year: number): KpiDetail | undefined {
    return details.find(d => d.month === month && d.year === year);
}

function signedDirectionFromValues(curr: number | null, prev: number | null): 'Positive' | 'Negative' | 'Neutral' {
    if (curr == null || prev == null) return 'Neutral';
    if (curr > prev) return 'Positive';
    if (curr < prev) return 'Negative';
    return 'Neutral';
}

function mapDirectionForCard(dir: 'Positive' | 'Negative' | 'Neutral' | null): 'increase' | 'decrease' | 'no-change' {
    if (dir === 'Positive') return 'increase';
    if (dir === 'Negative') return 'decrease';
    return 'no-change';
}

/**
 * Color helper:
 * - For deviationValueColor: relies on changeDirection + greenWhen
 * - For currentPeriodValueColor: compares current vs target + greenWhen
 */
function colorByDirection(
    direction: 'Positive' | 'Negative' | 'Neutral',
    greenWhen: 'Positive' | 'Negative' | 'Neutral'
): 'black' | 'red' | 'green' {
    if (direction === 'Neutral' || greenWhen === 'Neutral') return 'black';
    const isGood = (direction === greenWhen);
    return isGood ? 'green' : 'red';
}

function colorByTarget(
    current: number | null,
    target: number | null,
    greenWhen: 'Positive' | 'Negative' | 'Neutral'
): 'black' | 'red' | 'green' {
    if (current == null || target == null || greenWhen === 'Neutral') return 'black';
    const meets =
        greenWhen === 'Positive' ? current >= target :
            greenWhen === 'Negative' ? current <= target :
                false;
    return meets ? 'green' : 'red';
}

/**
 * Formats deviation string:
 * - If selectedMetrics indicates percentage ('%') and prev != null -> show % change (e.g., '12.3%')
 * - Else show absolute delta (e.g., '0.15')
 * - Fallback: '0'
 */
function formatDeviationString(
    current: number | null,
    previous: number | null,
    selectedMetric: string | null
): string {
    if (current == null || previous == null) return '0';
    const delta = current - previous;

    const isPercent = selectedMetric?.trim() === '%';

    if (isPercent) {
        if (previous === 0) {
            // Avoid division by zero; if both 0 => 0%, else +/- Infinity -> cap
            if (current === 0) return '0%';
            // Cap to a readable large value
            return `${(Math.sign(delta) * 100).toFixed(0)}%`;
        }
        const pct = (delta / Math.abs(previous)) * 100;
        return `${pct.toFixed(1)}%`;
    }

    return `${delta.toFixed(3).replace(/\.?0+$/, '')}`;
}

/**
 * Main transformer func
 */
export function transformKpiDetailsToCardData(
    apiResponse: KpiDetailsApiResponse,
    request: KpiDetailsParams,
    options?: TransformOptions
): KPICardData {
    const {
        axisTickIndices = [0, 5, 11], // Jan, Jun, Dec
        fillNullValue = 0,
        fillNullTarget = 0,
        monthLabelStyle = 'full',
    } = options || {};

    const firstItem: ApiItem | undefined = apiResponse?.data?.[0];
    const metrics: KpiMetrics | undefined = firstItem?.kpiMetrics?.[0];
    const details: KpiDetail[] = firstItem?.kpiDetail ?? [];

    // Resolve KPI display name and selected metric
    const selectedMetric = metrics?.selectedMetrics ?? null;
    const kpiDisplayNameBase = metrics?.kpi || request.kpiName || 'KPI';
    const kpiDisplayName =
        selectedMetric && selectedMetric.trim().length > 0
            ? `${kpiDisplayNameBase} (${selectedMetric.trim()})`
            : kpiDisplayNameBase;

    const currDetail = findDetail(details, request.month, request.year);
    const prevMonth = request.month === 1 ? 12 : request.month - 1;
    const prevYear = request.month === 1 ? request.year - 1 : request.year;
    const prevDetail = findDetail(details, prevMonth, prevYear);

    const currentValueRaw = metrics?.currentPeriodValue ?? currDetail?.value ?? null;
    const previousValueRaw = metrics?.previousPeriodValue ?? prevDetail?.value ?? null;

    const currentTargetRaw = currDetail?.target ?? metrics?.target ?? null;

    const currentValue = toNumberOr(currentValueRaw, fillNullValue);
    // const previousValue = (previousValueRaw == null) ? null : toNumberOr(previousValueRaw, fillNullValue);
    // const currentTarget = toNumberOr(currentTargetRaw, fillNullTarget);

    // Deviation direction: prefer metrics.changeDirection; fallback to comparing values
    const changeDir: 'Positive' | 'Negative' | 'Neutral' =
        metrics?.changeDirection ??
        signedDirectionFromValues(currentValueRaw, previousValueRaw);

    const deviation = mapDirectionForCard(changeDir);

    const deviationString = formatDeviationString(
        currentValueRaw,
        previousValueRaw,
        selectedMetric
    );

    const deviationValueColor = colorByDirection(
        changeDir,
        metrics?.greenWhen ?? 'Neutral'
    );

    const currentPeriodValueColor = colorByTarget(
        currentValueRaw,
        currentTargetRaw,
        metrics?.greenWhen ?? 'Neutral'
    );

    // Build metricData for all 12 months (of 'request.year')
    const metricData = Array.from({ length: 12 }, (_, idx) => {
        const month = idx + 1;
        const d = findDetail(details, month, request.year);

        const value = toNumberOr(d?.value ?? null, fillNullValue);
        const target = toNumberOr(d?.target ?? null, fillNullTarget);

        const showInXAxis = axisTickIndices.includes(idx);

        return {
            forecast: Boolean(d?.forecast),
            month: monthName(month, monthLabelStyle),
            showInXAxis,
            target,
            value,
        } as KPICardMetricPoint;
    });

    return {
        currentPeriodValue: currentValue,
        currentPeriodValueColor,
        date: formatMonthYearShort(request.month, request.year), // e.g., 'Dec 2025'
        deviation,
        deviationString,
        deviationValueColor,
        kpi: kpiDisplayName,
        metricData,
        // selectedMetric: selectedMetric ?? undefined,
    };
}
