import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserNavigationMenu } from '../../services/users';
import {
    fetchUserNavigationPreferences,
    saveSideNavigationPinnedItems,
} from '../thunks/userNavigationPreferences';
 
type SideNavigationState = {
    pinnedItemIds: string[];
    allMenus: UserNavigationMenu[];
    isLoading: boolean;
    isSaving: boolean;
    hasLoaded: boolean;
    error: string | null;
};
 
const initialState: SideNavigationState = {
    pinnedItemIds: [],
    allMenus: [],
    isLoading: false,
    isSaving: false,
    hasLoaded: false,
    error: null,
};
 
const sideNavigationSlice = createSlice({
    name: 'sideNavigation',
    initialState,
    reducers: {
        togglePinnedSideNavItem: (state, action: PayloadAction<string>) => {
            const itemId = action.payload;
            state.pinnedItemIds = state.pinnedItemIds.includes(itemId)
                ? state.pinnedItemIds.filter(id => id !== itemId)
                : [...state.pinnedItemIds, itemId];
        },
    },
    extraReducers: builder => {
        builder
            .addCase(fetchUserNavigationPreferences.pending, state => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUserNavigationPreferences.fulfilled, (state, action) => {
                state.isLoading = false;
                state.hasLoaded = true;
                state.allMenus = action.payload.allMenus;
                state.pinnedItemIds = action.payload.pinnedItemIds;
            })
            .addCase(fetchUserNavigationPreferences.rejected, (state, action) => {
                state.isLoading = false;
                state.hasLoaded = true;
                state.error = action.error.message ?? 'Failed to fetch side navigation preferences';
            })
            .addCase(saveSideNavigationPinnedItems.pending, (state, action) => {
                state.isSaving = true;
                state.error = null;
                state.pinnedItemIds = action.meta.arg.nextPinnedItemIds;
            })
            .addCase(saveSideNavigationPinnedItems.fulfilled, (state, action) => {
                state.isSaving = false;
                state.allMenus = action.payload.allMenus;
                state.pinnedItemIds = action.meta.arg.nextPinnedItemIds;
            })
            .addCase(saveSideNavigationPinnedItems.rejected, (state, action) => {
                state.isSaving = false;
                state.pinnedItemIds = action.meta.arg.previousPinnedItemIds;
                state.error = action.error.message ?? 'Failed to save side navigation preferences';
            });
    },
});
 
export const { togglePinnedSideNavItem } = sideNavigationSlice.actions;
export default sideNavigationSlice.reducer;
 
 
 
 