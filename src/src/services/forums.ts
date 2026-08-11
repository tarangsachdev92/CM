import { postAPI, getAPI } from './api';
import { IForumPayload, IToolsSideNavigationPayload } from '../types/request';
import { logError } from '../utils/helpers';

export const getSideNavigationForums = async (payload: IForumPayload): Promise<any> => {
    const response = await postAPI(`api/forum/get-forum-side-navigation`, payload);
    return response?.data?.data;
};

export const getSideNavigationTools = async (payload: IToolsSideNavigationPayload): Promise<any> => {
    const response = await postAPI(`api/PerformanceManagementCustomization/pm-tool-side-navigation`, payload);
    return response?.data?.data;
};

export const updateFavoriteForums = async (payload: {
    forumIds: number[];
    isFavorite: boolean;
}): Promise<any> => {
    const response = await postAPI(`api/forum/update-favourite-forums`, payload);
    return response?.data?.data;
};

export const getForumPersonaMappings = async (payload: { toolId: number }): Promise<any> => {
    const response = await getAPI(`api/forum/forum-persona-mappings`, payload);
    return response?.data?.data;
};

export const getForumSelectionFlyout = async (payload: {
    functionId?: string;
    subFunctionId?: string;
    geographyLevelId?: string;
    periodId?: string;
    searchText?: string;
    pageNumber?: number;
    pageSize?: number;
}): Promise<any> => {
    const response = await postAPI(`api/forum/forum-selection-flyout`, payload);
    return response?.data?.data;
};

export const getForumDetialsById = async (forumId: number) => {
    try {
        const response = await getAPI(`api/forum/forum-basic-and-geographic-detail?forumId=${forumId}`);
        return response.data.data;
    } catch (error) {
        logError('Error getting forum details:', error);
        throw error;
    }
};

export const getForumAccessDetailsbyId = async (forumId: number) => {
    try {
        const response = await getAPI(`api/forum/forum-access-details_V1?forumId=${forumId}`);
        return response.data.data;
    } catch (error) {
        logError('Error getting forum details:', error);
        throw error;
    }
};
