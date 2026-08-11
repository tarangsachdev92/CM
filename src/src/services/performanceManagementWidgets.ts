import { KpiDetailsParams } from '../components/organisms/performance-management-customizations/kpiDetailsToCardData';
import { getAPI, postAPI, putAPI } from './api';
import type {
    FetchTabWidgetsStateRequest,
    SaveTabWidgetsStateRequest,
} from '../store/thunks/performanceWidgetsByTab';

export const getWidgetTypes = async () => {
    return await getAPI(
        '/api/PerformanceManagementCustomization/performanceManagement-widget-types',
    );
};

export const searchWidgets = async (params: { searchTerm: string }) => {
    return await getAPI('/api/PerformanceManagementCustomization/search-widget', params);
};

export const performanceOverviewFilters = async (params: {
    performanceOverviewWidgetId: string;
}) => {
    return await getAPI('/api/PerformanceManagementCustomization/widget-kpi-visual-types', params);
};

export const getKpiDetails = async (params: KpiDetailsParams) => {
    return await postAPI(`/api/PerformanceManagementCustomization/kpi-details`, params);
};

// Replace with your actual HTTP client and endpoint paths
// This is only to illustrate expected shapes based on your thunk references.

export const getTabWidgetsState = ({ tabId }: FetchTabWidgetsStateRequest) => {
    // Example GET: /api/widgets/by-tab/:tabId
    return getAPI(`/api/widgets/by-tab/${tabId}`);
};

export const saveTabWidgetsStateApi = ({ tabId, data }: SaveTabWidgetsStateRequest) => {
    // Example PUT: /api/widgets/by-tab/:tabId
    return putAPI(`/api/widgets/by-tab/${tabId}`, { ...data });
};

export const getWidgetsByKpiIdsandVisualType = async (params: {
  kpiIdsCsv: number;
  visualTypeId: number;
  widgetId: number | null;
}) => {
  return await getAPI(
    '/api/PerformanceManagementCustomization/WidgetsByKpiIdsandVisualType',
    params
  );
};

export const saveWidgetsConfiguration = async (data:any) => {
  return await putAPI(
    '/api/PerformanceManagementCustomization/edit-custom-widget',
    data
  );
};


export const resetWidgetsConfigurationAPI = async (params: {
  kpiIdsCsv: string;
  visualTypeId: number;
  widgetId: string;
}) => {
  return await postAPI(
    `/api/PerformanceManagementCustomization/reset-performanceManagement-widgets?kpiIdsCsv=${params.kpiIdsCsv}&visualTypeId=${params.visualTypeId}&widgetId=${params.widgetId}`,
    params
  );
};
