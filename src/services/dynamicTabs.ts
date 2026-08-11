import { getAPI, postAPI } from './api';

export const getDynamicTabs = async (reportId: number, tabId?: number): Promise<any> => {
    return await getAPI('/api/PerformanceManagementCustomization/performanceManagement-customDetails', {
        reportId,
        tabId
    });
};

export const createDynamicTab = async (payload: {
    tabName: string;
    reportId: number;
    isPublished: boolean;
}): Promise<any> => {
    return await postAPI('/api/PerformanceManagementCustomization/save-performanceManagement-customeDetails', payload);
};
