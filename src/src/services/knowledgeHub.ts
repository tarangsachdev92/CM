import { getAPI, postAPI } from './api';
import {
    FavoriteFilesResult,
    ApiResponseHelper,
    IMostViewedFile,
    IKnowledgeHubSearchDocument,
} from '../types/response';

export const getFavoriteFiles = async (): Promise<ApiResponseHelper<FavoriteFilesResult[]>> => {
    const response = await getAPI(
        'api/KnowledgeHub/getFileFavorite',
    );
    return response.data;
};

export const saveFavoriteFiles = async (docId : number): Promise<ApiResponseHelper<string>> => {
    const response = await postAPI(
        `api/KnowledgeHub/upsertFileFavourite?docId=${docId}`,(null)
    );
    return response.data;
};

export const getMostViewdFiles = async (totalCount : number): Promise<ApiResponseHelper<IMostViewedFile[]>> => {
    const response = await getAPI(
        `api/KnowledgeHub/getMostViewedDocument?topCount=${totalCount}`,
    );
    return response.data;
};

export const upsertDocumentView = async (docId : number): Promise<ApiResponseHelper<string>> => {
    const response = await postAPI(
        `api/KnowledgeHub/upsertDocumentView?documentId=${docId}`,(null)
    );
    return response.data;
};

export const searchKnowledgeHubDocuments = async (params: {
    searchText: string;
}): Promise<ApiResponseHelper<IKnowledgeHubSearchDocument[]>> => {
    const response = await getAPI('api/Knowledgehub/search-document', params);
    return response.data;
};

