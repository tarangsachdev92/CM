export type AddWidgetItemType = 'widget' | 'metric';

export interface AddWidgetItem {
    id: string;
    name: string;
    type: AddWidgetItemType;
    description?: string;
    // future-friendly fields for real API
    tags?: string[];
    widgetKey?: string; // could map to a component later
}

export interface AddWidgetCategory {
    id: string; // stable key sent by API (example guess)
    label: string; // display label
    icon: string; // icon name used by konnect-react-components <Icon />
    items: AddWidgetItem[];
}

/**
 * Estimated mock payload for "GET /widget-categories"
 * Later you can swap this export with API response mapping.
 */
export const ADD_WIDGET_CATEGORIES: AddWidgetCategory[] = [
    {
        id: 'performanceOverview',
        label: 'Performance Overview',
        icon: 'line-chart-up-02',
        items: [
            {
                id: 'w-single-kpi',
                name: 'Single KPI',
                type: 'widget',
                description: 'Shows one KPI with trend',
            },
            {
                id: 'w-kpi-trend',
                name: 'KPI Trend',
                type: 'widget',
                description: 'Trend chart for a KPI',
            },
            {
                id: 'm-otif',
                name: 'OTIF-D',
                type: 'metric',
                description: 'On Time In Full - Delivery',
            },
            { id: 'm-fill-rate', name: 'Fill Rate', type: 'metric' },
            { id: 'm-service-level', name: 'Service Level', type: 'metric' },
        ],
    },
    {
        id: 'charts',
        label: 'Charts',
        icon: 'barr-chart-02',
        items: [
            { id: 'w-line-chart', name: 'Line Chart', type: 'widget' },
            { id: 'w-bar-chart', name: 'Bar Chart', type: 'widget' },
            { id: 'w-stacked-bar', name: 'Stacked Bar', type: 'widget' },
            { id: 'm-volume', name: 'Volume', type: 'metric' },
            { id: 'm-forecast-accuracy', name: 'Forecast Accuracy', type: 'metric' },
        ],
    },
    {
        id: 'scorecard',
        label: 'Scorecard',
        icon: 'credit-card-01',
        items: [
            { id: 'w-scorecard', name: 'Scorecard Summary', type: 'widget' },
            { id: 'm-kpi-status', name: 'KPI Status', type: 'metric' },
            { id: 'm-target-attainment', name: 'Target Attainment', type: 'metric' },
        ],
    },
    {
        id: 'table',
        label: 'Table',
        icon: 'table',
        items: [
            { id: 'w-simple-table', name: 'Simple Table', type: 'widget' },
            { id: 'w-pivot-table', name: 'Pivot Table', type: 'widget' },
            { id: 'm-sku-performance', name: 'SKU Performance', type: 'metric' },
        ],
    },
    {
        id: 'processMonitoring',
        label: 'Process Monitoring',
        icon: 'line-chart-up-02',
        items: [
            { id: 'w-process-health', name: 'Process Health', type: 'widget' },
            { id: 'm-cycle-time', name: 'Cycle Time', type: 'metric' },
            { id: 'm-backlog', name: 'Backlog', type: 'metric' },
        ],
    },
    {
        id: 'todo',
        label: 'To-Do',
        icon: 'check-done-01',
        items: [
            { id: 'w-action-list', name: 'Action List', type: 'widget' },
            { id: 'm-overdue-actions', name: 'Overdue Actions', type: 'metric' },
        ],
    },
    {
        id: 'exceptions',
        label: 'Exceptions',
        icon: 'line-chart-up-02',
        items: [
            { id: 'w-exception-list', name: 'Exception List', type: 'widget' },
            { id: 'm-critical-exceptions', name: 'Critical Exceptions', type: 'metric' },
        ],
    },
    {
        id: 'highlightSummary',
        label: 'Highlight Summary',
        icon: 'list',
        items: [
            { id: 'w-highlights', name: 'Highlights', type: 'widget' },
            { id: 'm-high-priority', name: 'High Priority Count', type: 'metric' },
        ],
    },
    {
        id: 'attachImage',
        label: 'Attach Image',
        icon: 'image-01',
        items: [{ id: 'w-image', name: 'Image Attachment', type: 'widget' }],
    },
    {
        id: 'note',
        label: 'Note',
        icon: 'file-04',
        items: [{ id: 'w-note', name: 'Note', type: 'widget' }],
    },
];

export const widgetsIcon = [
    '',
    'line-chart-up-02',
    'barr-chart-02',
    'credit-card-01',
    'table',
    'star-06',
    'check-done-01',
    'alert-hexagon',
    'list',
    'image-01',
    'file-04',
];

export type IconNames =
    | 'line-chart-up-02'
    | 'barr-chart-02'
    | 'credit-card-01'
    | 'table'
    | 'star-06'
    | 'check-done-01'
    | 'alert-hexagon'
    | 'list'
    | 'image-01'
    | 'file-04';

export enum WidgetType {
    PerformanceOverview = 1,
    Charts = 2,
    Scorecard = 3,
    Table = 4,
    ProcessMonitoring = 5,
    Todo = 6,
    Exceptions = 7,
    HighlightSummary = 8,
    AttachImage = 9,
    Note = 10,
}
