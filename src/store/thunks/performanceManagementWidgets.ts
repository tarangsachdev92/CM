import { createAsyncThunk } from '@reduxjs/toolkit';
import {
    getWidgetTypes,
    performanceOverviewFilters,
    searchWidgets,
    getWidgetsByKpiIdsandVisualType,
    saveWidgetsConfiguration,
    resetWidgetsConfigurationAPI,
} from '../../services/performanceManagementWidgets';

import type{ ApiResponseHelper, IWidgetConfiguration } from '../../types/response';

export interface IWidgetType {
    id: number;
    widgetTypeName: string;
}

export interface ISearchWidgetItem {
    widgetId: number;
    widgetName: string;
    tabIdId: number;
    widgetTypeId: number;
    widgetSizeId: number;
    widgetVisualTypeId: number;
    kpiId: number;
    kpiName: string;
    createdBy: string;
    createdOn: string;
    updatedBy: string;
    updatedOn: string;
    isActive: boolean;
}

export interface IPerformanceOverviewFilters {
    kpIs: KpI[];
    visualTypes: VisualType[];
}

export interface KpI {
    kpiId: number;
    kpiName: string;
    isActive: any;
}

export interface VisualType {
    visualTypeId: number;
    visualTypeName: string;
    visualSubTypeName: any;
    widgetTypeId: number;
}

export interface SearchWidgetsRequest {
    searchTerm: string;
}

export interface PerformanceOverviewIdRequest {
    performanceOverviewWidgetId: string;
}

export interface WidgetConfigurationRequest {
  kpiIdsCsv: number;
  visualTypeId: number;
  widgetId: number | null;
}

export const fetchWidgetTypes = createAsyncThunk<IWidgetType[], void, { rejectValue: string }>(
    'performanceManagementWidgets/fetchWidgetTypes',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getWidgetTypes();
            return response.data.data as IWidgetType[];
        } catch (err: any) {
            const msg =
                err?.response?.data?.message || err?.message || 'Failed to fetch widget types';
            return rejectWithValue(msg);
        }
    },
);

export const fetchWidgetsBySearchTerm = createAsyncThunk<
    ISearchWidgetItem[],
    SearchWidgetsRequest,
    { rejectValue: string }
>(
    'performanceManagementWidgets/fetchWidgetsBySearchTerm',
    async ({ searchTerm }, { rejectWithValue }) => {
        try {
            const response = await searchWidgets({ searchTerm });
            return response.data.data as ISearchWidgetItem[];
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to search widgets';
            return rejectWithValue(msg);
        }
    },
);

export const fetchPerformanceOverviewFilters = createAsyncThunk<
    IPerformanceOverviewFilters[],
    PerformanceOverviewIdRequest,
    { rejectValue: string }
>(
    'PerformanceManagementCustomization/widget-kpi-visual-types',
    async ({ performanceOverviewWidgetId }, { rejectWithValue }) => {
        try {
            const response = await performanceOverviewFilters({ performanceOverviewWidgetId });
            return response.data.data as IPerformanceOverviewFilters[];
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to fetch performance overview filters';
            return rejectWithValue(msg);
        }
    },
);

export const fetchWidgetConfiguration = createAsyncThunk<
  IWidgetConfiguration[],
  WidgetConfigurationRequest,
  { rejectValue: string }
>(
  'PerformanceManagementCustomization/widget-configuration',
  async ({ kpiIdsCsv, visualTypeId, widgetId }, { rejectWithValue }) => {
    try {
      const response = await getWidgetsByKpiIdsandVisualType({
        kpiIdsCsv,
        visualTypeId,
        widgetId
      });

      const apiResponse =
        response.data as ApiResponseHelper<IWidgetConfiguration[]>;
    
      return apiResponse.data ?? [];
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch widget configuration';

      return rejectWithValue(msg);
    }
  }
);

export const saveWidgetConfiguration = createAsyncThunk(
  'PerformanceManagementCustomization/edit-widget-configuration',
  async ( payload:any , { rejectWithValue }) => {
    try {
      const response = await saveWidgetsConfiguration(payload);

      const apiResponse =
        response.data as ApiResponseHelper<string>;

      if (apiResponse.statusCode === 200) {
          return apiResponse.data as string;
      } else {
          return rejectWithValue(apiResponse.message || 'Operation failed');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save widget configuration';

      return rejectWithValue(msg);
    }
  }
);

export const resetWidgetConfiguration = createAsyncThunk(
  'PerformanceManagementCustomization/reset-performanceManagement-widgets',
  async ( payload:any , { rejectWithValue }) => {
    try {
      const response = await resetWidgetsConfigurationAPI(payload);

      const apiResponse =
        response.data as ApiResponseHelper<string>;

      if (apiResponse.statusCode === 200) {
          return apiResponse.data as string;
      } else {
          return rejectWithValue(apiResponse.message || 'Operation failed');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save widget configuration';

      return rejectWithValue(msg);
    }
  }
);
