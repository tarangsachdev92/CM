import type { ComponentType } from "react";
import type { UiComponentNode, UiLibraryProvider } from "../types";

export type NodeRendererProps = {
  node: UiComponentNode;
  renderChild: (child: UiComponentNode) => React.ReactNode;
  onAction?: (payload: Record<string, unknown>) => void;
};

export type NodeRenderer = ComponentType<NodeRendererProps>;

export interface UiLibraryAdapter {
  provider: UiLibraryProvider;
  displayName: string;
  getRenderer(type: string): NodeRenderer | undefined;
}

export type AdapterFactory = () => UiLibraryAdapter;

type Color = 'green' | 'black' | 'yellow' | 'red';
type Deviation = 'increase' | 'decrease';

type MetricPoint = {
    forecast: boolean;
    month: string;
    showInXAxis: boolean;
    target: number;
    value: number;
};

export type KpiCardData = {
    currentPeriodValue: string;
    currentPeriodValueColor?: Color;
    date: string;
    deviation?: Deviation;
    deviationString: string;
    deviationValueColor?: Color;
    kpi: string;
    data: MetricPoint[];
    measurementPeriodValue: string | undefined;
    measurementPeriod: string;
    targetValue: string;
    greenWhen: string | undefined;
};
