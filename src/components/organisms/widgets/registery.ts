import { ComponentType, memo, useMemo } from "react";
import { WidgetFive, WidgetFour, WidgetOne, WidgetSix, WidgetThree, WidgetTwo } from "./DummyWidgets";
import { FavouriteWidgetComponent } from "./favourite-widget/FavouriteWidget";
import {
  CalendarIcon,
  ChartsIcon,
  ExceptionsIcon,
  FavouriteIcon,
  HighlightSummaryIcon,
  KpiIcon,
  PerformanceOverviewIcon,
  ProcessMonitorIcon,
  QuickLinksIcon,
  ScorecardIcon,
  TableIcon,
  TodoIcon,
} from "../../../assets/icons/widget-menu";

export type WidgetDefinition = {
  type: string;
  title: string;
  component?: ComponentType;
  defaultSize: { w: number; h: number };
  group: string;
  thumbnail: string;
  disabled?: boolean;
  menuIcon?: ComponentType;
};
export enum WIDGET_TYPE {
  KPI_STATUS_OVERVIEW = 'kpi_status_overview',
  KPI_PERFORMANCE_SUMMARY = 'kpi_performance_summary',
  KPI_DETAILED_INSIGHTS = 'kpi_detailed_insights',
  CALENDAR = 'calendar',
  ISSUE_STATUS = 'issue_status',
  R_AND_O = 'r_and_o',
  FAVOURITES = 'favourites',
  TODO = 'to_Do',
  QUICK_LINKS = "quick_links",
  CHARTS = 'charts',
  TABLE = 'table',
  PROCESS_MONITORING = 'process_monitoring',
  HIGHLIGHT_SUMMARY = 'highlight_summary',
}
export const widgetRegistry: Record<string, WidgetDefinition> = {
  [WIDGET_TYPE.FAVOURITES]: {
    type: WIDGET_TYPE.FAVOURITES,
    title: 'Favourites',
    component: memo(FavouriteWidgetComponent),
    defaultSize: { w: 4, h: 6 },
    group: 'Favourites',
    thumbnail: '/layout-widget-thumbnails/widget-favourites.svg',
    menuIcon: FavouriteIcon,
  },
  [WIDGET_TYPE.CALENDAR]: {
    type: WIDGET_TYPE.CALENDAR,
    title: 'Calendar',
    component: memo(WidgetFour),
    defaultSize: { w: 4, h: 10 },
    group: 'Calendar',
    thumbnail: '/layout-widget-thumbnails/widget-04.png',
    menuIcon: CalendarIcon,
  },
  [WIDGET_TYPE.KPI_STATUS_OVERVIEW]: {
    type: WIDGET_TYPE.KPI_STATUS_OVERVIEW,
    title: 'KPI Status Overview',
    component: memo(WidgetOne),
    defaultSize: { w: 4, h: 6 },
    group: 'My KPIs',
    thumbnail: '/layout-widget-thumbnails/widget-01.png',
    menuIcon: KpiIcon,

  },

  [WIDGET_TYPE.KPI_PERFORMANCE_SUMMARY]: {
    type: WIDGET_TYPE.KPI_PERFORMANCE_SUMMARY,
    title: 'KPI Performance Summary',
    component: memo(WidgetTwo),
    defaultSize: { w: 4, h: 6 },
    group: 'My KPIs',
    thumbnail: '/layout-widget-thumbnails/widget-02.png',
    menuIcon: KpiIcon,
  },

  [WIDGET_TYPE.KPI_DETAILED_INSIGHTS]: {
    type: WIDGET_TYPE.KPI_DETAILED_INSIGHTS,
    title: 'KPI Detailed Insights',
    component: memo(WidgetThree),
    defaultSize: { w: 4, h: 6 },
    group: 'Performance Overview',
    thumbnail: '/layout-widget-thumbnails/widget-03.png',
    menuIcon: PerformanceOverviewIcon,
  },

  [WIDGET_TYPE.ISSUE_STATUS]: {
    type: WIDGET_TYPE.ISSUE_STATUS,
    title: 'Issue Status',
    component: memo(WidgetFive),
    defaultSize: { w: 4, h: 16 },
    group: 'Scorecard',
    thumbnail: '/layout-widget-thumbnails/widget-05.png',
    menuIcon: ScorecardIcon,
  },

  [WIDGET_TYPE.R_AND_O]: {
    type: WIDGET_TYPE.R_AND_O,
    title: 'R&O',
    component: memo(WidgetSix),
    defaultSize: { w: 4, h: 6 },
    group: 'Exceptions',
    thumbnail: '/layout-widget-thumbnails/widget-06.png',
    menuIcon: ExceptionsIcon,
  },
  [WIDGET_TYPE.TODO]: {
    type: WIDGET_TYPE.TODO,
    title: 'To-Do',
    defaultSize: { w: 4, h: 6 },
    group: 'To-Do',
    thumbnail: '/layout-widget-thumbnails/widget-todo.svg',
    disabled: true,
    menuIcon: TodoIcon,
  },

  [WIDGET_TYPE.QUICK_LINKS]: {
    type: WIDGET_TYPE.QUICK_LINKS,
    title: 'Quick Links',
    defaultSize: { w: 4, h: 6 },
    group: 'Quick Links',
    thumbnail: '/layout-widget-thumbnails/widget-quick-links.svg',
    disabled: true,
    menuIcon: QuickLinksIcon,
  },

  [WIDGET_TYPE.CHARTS]: {
    type: WIDGET_TYPE.CHARTS,
    title: 'Charts',
    defaultSize: { w: 4, h: 6 },
    group: 'Charts',
    thumbnail: '/layout-widget-thumbnails/widget-charts.svg',
    disabled: true,
    menuIcon: ChartsIcon,
  },

  [WIDGET_TYPE.TABLE]: {
    type: WIDGET_TYPE.TABLE,
    title: 'Table',
    defaultSize: { w: 4, h: 6 },
    group: 'Table',
    thumbnail: '/layout-widget-thumbnails/widget-table.svg',
    disabled: true,
    menuIcon: TableIcon,
  },

  [WIDGET_TYPE.PROCESS_MONITORING]: {
    type: WIDGET_TYPE.PROCESS_MONITORING,
    title: 'Process Monitoring',
    defaultSize: { w: 4, h: 6 },
    group: 'Process Monitoring',
    thumbnail: '/layout-widget-thumbnails/widget-process-monitoring.svg',
    disabled: true,
    menuIcon: ProcessMonitorIcon,
  },

  [WIDGET_TYPE.HIGHLIGHT_SUMMARY]: {
    type: WIDGET_TYPE.HIGHLIGHT_SUMMARY,
    title: 'Highlight Summary',
    defaultSize: { w: 4, h: 6 },
    group: 'Highlight Summary',
    thumbnail: '/layout-widget-thumbnails/widget-highlight-summary.svg',
    disabled: true,
    menuIcon: HighlightSummaryIcon,
  },


};


type Registry = Record<string, WidgetDefinition>;
export function useGroupedWidgets(widgetRegistry: Registry) {
  return useMemo(() => {
    const items = Object.values(widgetRegistry);

    items.sort((a, b) => {
      // sort by group name first, then by widget title
      const g = a.group.localeCompare(b.group);
      if (g !== 0) return g;
      return a.title.localeCompare(b.title);
    });

    const grouped = items.reduce<Record<string, WidgetDefinition[]>>((acc, w) => {
      const key = w.group || "Ungrouped";
      (acc[key] ||= []).push(w);
      return acc;
    }, {});

    const entries = Object.entries(grouped);
    return entries;
  }, [widgetRegistry]);
}
