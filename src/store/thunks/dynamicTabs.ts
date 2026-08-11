import { createAsyncThunk } from '@reduxjs/toolkit';
import { getDynamicTabs, createDynamicTab } from '../../services/dynamicTabs';

export interface IDynamicTab {
    id: number;
    name: string;
}

export interface AddDynamicTabRequest {
    tabName: string;
    reportId: number;
    isPublished: boolean;
}

export interface AddDynamicTabResponse extends IDynamicTab { }

type ApiTab = {
    tabId: number;
    tabName: string;
    reportId: number;
    isPublished: boolean;
    createdOn: string;
    isActive: boolean;
};

export interface WidgetDetails {
  widgetId: number;
  widgetVisualTypeId: number;
  kpiId: number;
  widgetName: string;
  widgetTypeName: string;
}

export interface ReportDetails {
  reportId: number;
  reportName: string;
  reportOwner: string;
  isEditor: boolean;
  isViewer: boolean;
}


// --- GET: fetch all dynamic tabs ---
export const fetchDynamicTabs = createAsyncThunk<
    { mapped: IDynamicTab[]; widgets: WidgetDetails[];  report: ReportDetails | null; },
    { reportId: number; tabId?: number  },
    { rejectValue: string }
>('dynamicTabs/fetchDynamicTabs', async ({ reportId, tabId }, { rejectWithValue }) => {

    try {
        const response = await getDynamicTabs(reportId, tabId);
        const payload = response.data;
        const reportData = payload?.data?.[0]?.report;

        // Safely pick the first item and map tabs
        const apiTabs = payload?.data?.[0]?.tabs ?? [];
        const mapped: IDynamicTab[] = apiTabs.map((t: ApiTab) => ({
            id: t.tabId,
            name: t.tabName,
        }));
        
        const apiWidgets = payload?.data?.[0]?.widgets ?? [];
        const widgets = apiWidgets.map((w:WidgetDetails) => ({
            widgetId: w.widgetId,
            widgetVisualTypeId: w.widgetVisualTypeId,
            kpiId: w.kpiId,
            widgetName: w.widgetName,
            widgetTypeName: w.widgetTypeName,
        }));

        const report: ReportDetails | null = reportData
  ? {
      reportId: reportData.reportId,
      reportName: reportData.reportName,
      reportOwner: reportData.reportOwner,
      isEditor: Boolean(reportData.isEditor),
      isViewer: Boolean(reportData.isViewer),
    }
  : null;

        return {mapped, widgets, report};
    }
    catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to fetch dynamic tabs';
        return rejectWithValue(msg);
    }
});

// --- POST: add a new tab (with tabName, reportId, isPublished) ---
export const addDynamicTab = createAsyncThunk<
    AddDynamicTabResponse,
    AddDynamicTabRequest,
    { rejectValue: string }
>('dynamicTabs/addDynamicTab', async (payload, { rejectWithValue }) => {
    try {
        const response = await createDynamicTab(payload);
        return response.data.data as IDynamicTab;
    } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to add tab';
        return rejectWithValue(msg);
    }
});
