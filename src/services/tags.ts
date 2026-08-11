import { postAPI, deleteAPI } from './api';
import type { ITagsRequest } from '../types/request';
import type { ITagsPayload } from '../types/response';

export const addNewTagService = async (payload: {
    tagName: string;
    tagCategoryId: number;
}): Promise<{ data: ITagsPayload; statusCode: number; message: string }> => {
    try {
        const response = await postAPI('/api/tag/add-new-tag', payload);
        return {
            data: response.data.data,
            statusCode: response.data.statusCode,
            message: response.data.message,
        };
    } catch (error: any) {
        return {
            data: {
                tagCategoryDetails: [],
                tagDetails: [],
                categoryName: error.response?.data?.data || '',
            },
            statusCode: error.response?.status ?? 500,
            message: error.response?.data?.message ?? 'Something went wrong',
        };
    }
};

export const editTagService = async (payload: {
    tagName: string;
    tagCategoryId: number;
    tagId: number;
}): Promise<{ data: ITagsPayload; statusCode: number; message: string }> => {
    try {
        const response = await postAPI('api/tag/update-tag', payload);
        return {
            data: response.data.data,
            statusCode: response.data.statusCode,
            message: response.data.message,
        };
    } catch (error: any) {
        return {
            data: error.response?.data?.data,
            statusCode: error.response?.status ?? 500,
            message: error.response?.data?.message ?? 'Something went wrong',
        };
    }
};

export const searchTagService = async (payload: ITagsRequest): Promise<ITagsPayload> => {
    const response = await postAPI('/api/tag/tag-details', payload);
    return response.data.data;
};

export const deleteTagsById = async (
    tagId: number,
    loggedInUser: string,
): Promise<{ data: string; statusCode: number; message: null | string }> => {
    const response = await deleteAPI(
        `api/tag/Tags?tagId=${tagId}&loggedInUser=${loggedInUser}`,
        {},
    );
    return response?.data;
};
