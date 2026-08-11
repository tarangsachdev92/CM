import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    fetchIssueCategories,
    fetchIssueForums,
    fetchIssueTags,
    fetchIssuePriority,
    fetchIssueFunctions,
    fetchIssueSubFunctions,
    fetchDimensionData,
    fetchDimensionValue,
    fetchDimension,
    fetchIssueActionDetails,
    fetchIssueRoleUser,
    fetchIssueOwner,
    fetchIssueScrDetails,
    fetchOtherDimensionValues,
} from '../thunks/fetchIssue';

import {
    IRoleFunctionsData,
    IIssueSubFunctionsData,
    IIssueCategoriesData,
    IIssueForumsData,
    IIssueTagsData,
    IIssuePriorityData,
    IIssueDimensionData,
    IIssueDimensionValueData,
    IActionStatus,
    IIssueOwner,
    IIssueRoleUser,
    IIssueScrPayload,
} from '../../types/response';

type IssueState = {
    categories: IIssueCategoriesData[]; // Array of categories
    forums: IIssueForumsData[]; // Array of forums
    tags: IIssueTagsData[]; // Array of tags
    priority: IIssuePriorityData[]; // Array of priorities
    functions: IRoleFunctionsData[]; // Fixed to match array type
    subFunctions: IIssueSubFunctionsData[]; // Fixed to match array type
    dimensions: IIssueDimensionData[];
    dimensionValues: IIssueDimensionValueData[];
    actionDetails: IActionStatus[];
    owner: IIssueOwner[];
    roleuser: IIssueRoleUser[];
    ScrDetails: IIssueScrPayload[];
    otherDimensionValues: IIssueDimensionValueData[];
    issueOwnerDecisionOwner: string[];
    loading: boolean; // Indicates whether any fetch action is in progress
    error: string | null; // Stores error messages if any actions fail
};

const initialState: IssueState = {
    categories: [],
    forums: [],
    tags: [],
    priority: [],
    functions: [], // Initialize as an empty array
    subFunctions: [], // Initialize as an empty array
    dimensions: [],
    dimensionValues: [],
    actionDetails: [],
    owner: [],
    roleuser: [],
    ScrDetails: [],
    otherDimensionValues: [],
    issueOwnerDecisionOwner: [],
    loading: false,
    error: null,
};

const IssueSlice = createSlice({
    name: 'issue',
    initialState,
    reducers: {
        setIssueOwnerDecisionOwner(state, action: PayloadAction<string[]>) {
            state.issueOwnerDecisionOwner = action.payload;
        },
    },
    extraReducers: builder => {
        builder
            // Categories
            .addCase(fetchIssueCategories.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIssueCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload as IIssueCategoriesData[];
            })
            .addCase(fetchIssueCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch categories';
            })
            // Forums
            .addCase(fetchIssueForums.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIssueForums.fulfilled, (state, action) => {
                state.loading = false;
                state.forums = action.payload as IIssueForumsData[];
            })
            .addCase(fetchIssueForums.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch forums';
            })
            // Tags
            .addCase(fetchIssueTags.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIssueTags.fulfilled, (state, action) => {
                state.loading = false;
                state.tags = action.payload as IIssueTagsData[];
            })
            .addCase(fetchIssueTags.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch tags';
            })
            // Priority
            .addCase(fetchIssuePriority.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIssuePriority.fulfilled, (state, action) => {
                state.loading = false;
                state.priority = action.payload as IIssuePriorityData[];
            })
            .addCase(fetchIssuePriority.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch priority';
            })
            // Functions
            .addCase(fetchIssueFunctions.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIssueFunctions.fulfilled, (state, action) => {
                state.loading = false;
                state.functions = action.payload as IRoleFunctionsData[]; // Explicit typing for payload
            })
            .addCase(fetchIssueFunctions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch functions';
            })
            // SubFunctions
            .addCase(fetchIssueSubFunctions.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIssueSubFunctions.fulfilled, (state, action) => {
                state.loading = false;
                state.subFunctions = action.payload as IIssueSubFunctionsData[]; // Explicit typing for payload
            })
            .addCase(fetchIssueSubFunctions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch sub-functions';
            });

        // dimensions
        builder
            .addCase(fetchDimensionData.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDimensionData.fulfilled, (state, action) => {
                state.dimensions = action.payload;
                state.loading = false;
            })
            .addCase(fetchDimensionData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Failed to fetch dimension data';
            });

        builder
            .addCase(fetchDimensionValue.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDimensionValue.fulfilled, (state, action) => {
                state.dimensionValues = action.payload;
                state.loading = false;
            })
            .addCase(fetchDimensionValue.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Failed to fetch dimension Values';
            });

        builder
            .addCase(fetchDimension.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDimension.fulfilled, (state, action) => {
                state.dimensions = action.payload;
                state.loading = false;
            })
            .addCase(fetchDimension.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Failed to fetch dimension Values';
            });
        builder
            .addCase(fetchIssueActionDetails.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIssueActionDetails.fulfilled, (state, action) => {
                state.dimensions = action.payload ?? [];
                state.loading = false;
            })
            .addCase(fetchIssueActionDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Failed to fetch Action data';
            });
        builder
            .addCase(fetchIssueOwner.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIssueOwner.fulfilled, (state, action) => {
                state.loading = false;
                state.owner = action.payload as IIssueOwner[];
            })
            .addCase(fetchIssueOwner.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch owner';
            });
        builder
            .addCase(fetchIssueRoleUser.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIssueRoleUser.fulfilled, (state, action) => {
                state.loading = false;
                state.roleuser = action.payload as IIssueRoleUser[];
            })
            .addCase(fetchIssueRoleUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch role user';
            });
        builder
            .addCase(fetchIssueScrDetails.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchIssueScrDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.ScrDetails = action.payload as IIssueScrPayload[];
            })
            .addCase(fetchIssueScrDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch Scr Details';
            });

        builder
            .addCase(fetchOtherDimensionValues.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOtherDimensionValues.fulfilled, (state, action) => {
                state.otherDimensionValues = action.payload;
                state.loading = false;
            })
            .addCase(fetchOtherDimensionValues.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Failed to fetch dimension data';
            });
    },
});

export const { setIssueOwnerDecisionOwner } = IssueSlice.actions;
export default IssueSlice.reducer;
