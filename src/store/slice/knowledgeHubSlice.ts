import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IFavoriteFile, IMostViewedFile } from '../../types/response';
import {
    fetchFavoriteFiles,
    saveFavoriteFile,
    fetchMostViewedFiles,
    upsertFileView,
    searchDocuments,
} from '../thunks/fetchknowledgeHubDetails';

interface KnowledgeHubState {
  selectedSubFunctionId: string | null;
  favoriteFiles: IFavoriteFile[];
  favoriteCount: number;
  loading: boolean;
  favoriteFilesloading: boolean;
  searchDocumentsLoading: boolean;
  error: string | null;
  errorFavoriteFiles: string | null
  errorSaveFavoriteFiles: string | null
  mostViewedFilesloading: boolean;
  mostViewedFiles: IMostViewedFile[];
  searchedDocuments: IFavoriteFile[];
  errorSearchDocuments: string | null;
  errorMostViewedFiles: string | null
  errorUpsertDocumentView: string | null
  isFlyoutClose:boolean | null;
  isMFEenable: boolean;
}

const initialState: KnowledgeHubState = {
  selectedSubFunctionId: null,
  favoriteFiles: [],
  favoriteCount: 0,
  loading: false,
  favoriteFilesloading: false,
  searchDocumentsLoading: false,
  error: null,
  errorFavoriteFiles:null,
  errorSaveFavoriteFiles: null,
  mostViewedFilesloading: false,
  mostViewedFiles:[],
  searchedDocuments: [],
  errorSearchDocuments: null,
  errorMostViewedFiles: null,
  errorUpsertDocumentView: null,
  isFlyoutClose:false,
  isMFEenable:false,
};

const knowledgeHubSlice = createSlice({
    name: 'knowledgeHub',
    initialState,
    reducers: {
        setSelectedSubFunctionId: (state, action: PayloadAction<string | null>) => {
            state.selectedSubFunctionId = action.payload;
        },
        removeFavoriteLocal: (state, action: PayloadAction<string>) => {
            state.favoriteFiles = state.favoriteFiles.filter(f => f.fileId !== action.payload);
            state.favoriteCount = state.favoriteFiles.length;
        },
    setIsFlyoutClose: (state, action: PayloadAction<boolean | null>) => {
      state.isFlyoutClose = action.payload;
    },
    setIsMFEenable: (state, action: PayloadAction<boolean>) => {
      state.isMFEenable = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
        .addCase(fetchFavoriteFiles.pending, state => {
            state.favoriteFilesloading = true;
            state.errorFavoriteFiles = null;
        })

            .addCase(fetchFavoriteFiles.fulfilled, (state, action) => {
                state.favoriteFilesloading = false;
                state.favoriteFiles = action.payload.favoriteFileItems;
                state.favoriteCount = action.payload.favoriteCount;
            })

            .addCase(fetchFavoriteFiles.rejected, (state, action) => {
                state.favoriteFilesloading = false;
                state.errorFavoriteFiles = action.payload as string;
            })

            .addCase(saveFavoriteFile.fulfilled, (state, action) => {
                const id = action.meta.arg;

                const exists = state.favoriteFiles.find(f => f.fileId === String(id));

                if (exists) {
                    // REMOVE from favorites
                    state.favoriteFiles = state.favoriteFiles.filter(f => f.fileId !== String(id));
                    state.favoriteCount--;
                } else {
                    // ADD to favorites
                    // Preserve fields needed for card title/subtitle formatting.
                    const mostViewedItem = state.mostViewedFiles.find(f => f.documentID === id);
                    const searchedItem = state.searchedDocuments.find(
                        f => String((f as any).fileId ?? (f as any).documentID) === String(id),
                    );

                    if (mostViewedItem || searchedItem) {
                        const src: any = mostViewedItem ?? searchedItem;
                        const srcFileId = mostViewedItem
                            ? String(mostViewedItem.documentID)
                            : String(src.fileId ?? src.documentID ?? id);

                        state.favoriteFiles.unshift({
                            fileId: srcFileId,
                            fileName: String(src.fileName ?? ''),
                            assetId: src.assetId,
                            siteId: src.siteId != null ? String(src.siteId) : undefined,
                            siteName: src.siteName,
                            subFunctionId: src.subFunctionId,
                            subFunctionName: src.subFunctionName,
                            documentCategoryName: src.documentCategoryName,
                            fileSummary: src.fileSummary,
                            departmentId: src.departmentId,
                            docType: src.docType,
                        });
                        state.favoriteCount++;
                    }
                }
            })

            .addCase(saveFavoriteFile.rejected, (state, action) => {
                state.errorSaveFavoriteFiles = action.payload as string;
            })

            .addCase(fetchMostViewedFiles.pending, state => {
                state.mostViewedFilesloading = true;
                state.errorMostViewedFiles = null;
            })

            .addCase(fetchMostViewedFiles.fulfilled, (state, action) => {
                state.mostViewedFilesloading = false;
                state.mostViewedFiles = action.payload;
            })

            .addCase(fetchMostViewedFiles.rejected, (state, action) => {
                state.mostViewedFilesloading = false;
                state.errorMostViewedFiles = action.payload as string;
            })

            .addCase(upsertFileView.rejected, (state, action) => {
                state.errorUpsertDocumentView = action.payload as string;
            })

            .addCase(searchDocuments.pending, state => {
                state.searchDocumentsLoading = true;
                state.errorSearchDocuments = null;
            })
            .addCase(searchDocuments.fulfilled, (state, action) => {
                state.searchDocumentsLoading = false;
                state.searchedDocuments = action.payload || [];
            })
            .addCase(searchDocuments.rejected, (state, action) => {
                state.searchDocumentsLoading = false;
                state.searchedDocuments = [];
                state.errorSearchDocuments = action.payload as string;
            });
    },
});

export const { setSelectedSubFunctionId , removeFavoriteLocal, setIsFlyoutClose, setIsMFEenable } = knowledgeHubSlice.actions;
export default knowledgeHubSlice.reducer;
