import { createAsyncThunk } from '@reduxjs/toolkit';
import {
    getFavoriteFiles,
    saveFavoriteFiles,
    getMostViewdFiles,
    upsertDocumentView,
    searchKnowledgeHubDocuments,
} from '../../services/knowledgeHub';
import {
    FavoriteFilesResult,
    IFavoriteFile,
    IKnowledgeHubSearchDocument,
    IMostViewedFile,
} from '../../types/response';
import { getKnowledgeHubCreatedDate, getKnowledgeHubDocTitle } from '../../utils/helpers';

const mapSearchDocumentToCard = (doc: IKnowledgeHubSearchDocument): IFavoriteFile => {
    const fileId = String(doc.fileId ?? doc.documentID ?? doc.id ?? '');
    const titleSource = {
        docTitle: doc.docTitle,
        fileName: doc.fileName,
        documentCategoryName: doc.documentCategoryName,
        id: doc.id,
        documentID: doc.documentID,
        fileId,
    };

    return {
        fileId,
        fileName: doc.fileName ?? '',
        assetId: doc.assetId,
        siteId: doc.siteId != null ? String(doc.siteId) : undefined,
        siteName: doc.siteName,
        createdBy: doc.createdBy,
        fileSummary: doc.fileSummary,
        fileLink: doc.fileLink,
        documentCategoryId: doc.documentCategoryId,
        documentCategoryName: doc.documentCategoryName,
        departmentId: doc.departmentId,
        regionId: doc.regionId,
        subFunctionId: doc.subFunctionId,
        subFunctionName: doc.subFunctionName,
        docTitle: getKnowledgeHubDocTitle(titleSource),
        createdDate: getKnowledgeHubCreatedDate(doc),
        docType: doc.docType,
    };
};

export const fetchFavoriteFiles = createAsyncThunk<
    FavoriteFilesResult,
    void,
    { rejectValue: string }
>('knowledgeHub/fetchFavoriteFiles', async (_, { rejectWithValue }) => {
    try {
        const response = await getFavoriteFiles();

        if (!response || response.statusCode !== 200 || !response.data) {
            return rejectWithValue(response?.message || 'Favorite files not found');
        }

        return (
            response.data[0] || {
                favoriteFileItems: [],
                favoriteCount: 0,
            }
        );
    } catch (error: any) {
        return rejectWithValue(error?.message || 'Failed to fetch favorite files');
    }
});

export const saveFavoriteFile = createAsyncThunk<boolean, number, { rejectValue: string }>(
    'knowledgeHub/saveFavoriteFiles',
    async (docId, { rejectWithValue }) => {
        try {
            const response = await saveFavoriteFiles(docId);

            if (!response || response.statusCode !== 200) {
                return rejectWithValue(response?.message || 'Failed to update favorite');
            }

            return true;
        } catch (error: any) {
            return rejectWithValue(error?.message);
        }
    },
);

export const fetchMostViewedFiles = createAsyncThunk<
    IMostViewedFile[],
    number,
    { rejectValue: string }
>('knowledgeHub/fetchMostViewedFiles', async (totalCount, { rejectWithValue }) => {
    try {
        const response = await getMostViewdFiles(totalCount);

        if (!response || response.statusCode !== 200 || !response.data) {
            return rejectWithValue(response?.message || 'Favorite files not found');
        }

        return response.data;
    } catch (error: any) {
        return rejectWithValue(error?.message || 'Failed to fetch favorite files');
    }
});

export const upsertFileView = createAsyncThunk<boolean, number, { rejectValue: string }>(
    'knowledgeHub/upsertFileView',
    async (docId, { rejectWithValue }) => {
        try {
            const response = await upsertDocumentView(docId);

            if (!response || response.statusCode !== 200) {
                return rejectWithValue(response?.message || 'Failed to update favorite');
            }

            return true;
        } catch (error: any) {
            return rejectWithValue(error?.message);
        }
    },
);

export const searchDocuments = createAsyncThunk<
    IFavoriteFile[],
    { searchTerm: string },
    { rejectValue: string }
>('knowledgeHub/searchDocuments', async (args, thunkApi) => {
    try {
        const response = await searchKnowledgeHubDocuments({ searchText: args.searchTerm });

        if (!response || response.statusCode !== 200 || !response.data) {
            return thunkApi.rejectWithValue(response?.message || 'No documents found');
        }

        return (response.data ?? []).map(mapSearchDocumentToCard);
    } catch (error: any) {
        return thunkApi.rejectWithValue(error?.message || 'Failed to search documents');
    }
});
