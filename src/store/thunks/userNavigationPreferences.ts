import { createAsyncThunk } from '@reduxjs/toolkit';
import {
    getUserNavigationPreferences,
    saveUserNavigationPreferences,
} from '../../services/users';
import type {
    UserNavigationMenu,
    UserNavigationPreference,
    UserNavigationPreferencesData,
} from '../../services/users';
import { CUSTOMIZABLE_SIDE_NAV_ITEMS } from '../../utils/sideNavItems';
import type { RootState } from '..';
 
const parseSideNavJSON = (
    sideNavJSON: UserNavigationPreferencesData['sideNavJSON'],
): UserNavigationPreference[] => {
    if (!sideNavJSON) return [];
    if (Array.isArray(sideNavJSON)) return sideNavJSON;
 
    try {
        const parsed = JSON.parse(sideNavJSON) as unknown;
        if (Array.isArray(parsed)) {
            return parsed as UserNavigationPreference[];
        }
 
        if (parsed && typeof parsed === 'object') {
            const candidate = parsed as Record<string, unknown>;
            const preferences =
                candidate.savedPreferences ??
                candidate.preferences ??
                candidate.sideNavPreferences ??
                candidate.sideNavJSON;
 
            return Array.isArray(preferences)
                ? (preferences as UserNavigationPreference[])
                : [];
        }
 
        return [];
    } catch {
        return [];
    }
};
 
const getPreferencesFromResponse = (
    data: UserNavigationPreferencesData,
): UserNavigationPreference[] => {
    if (Array.isArray(data.savedPreferences) && data.savedPreferences.length > 0) {
        return data.savedPreferences;
    }
 
    return parseSideNavJSON(data.sideNavJSON);
};
 
const getPreferenceSortOrder = (preference: UserNavigationPreference, fallback: number) => {
    const sortOrder = Number(preference.sortOrder);
    return Number.isFinite(sortOrder) && sortOrder > 0 ? sortOrder : fallback;
};
 
const normalizePreference = (
    preference: UserNavigationPreference,
    fallbackSortOrder: number,
): UserNavigationPreference => ({
    ...preference,
    sortOrder: getPreferenceSortOrder(preference, fallbackSortOrder),
});

const normalizeMenuKey = (value: string) => value.replace(/[^a-z0-9]/gi, '').toLowerCase();

const toFiniteMenuId = (menuId: unknown) => {
    const value = Number(menuId);
    return Number.isFinite(value) ? value : null;
};

const getMenuIdFromPreference = (preference: UserNavigationPreference) =>
    toFiniteMenuId((preference as unknown as { menuId?: unknown }).menuId);
 
const menuNameToItemId = CUSTOMIZABLE_SIDE_NAV_ITEMS.reduce<Record<string, string>>(
    (acc, item) => {
        if (item.apiMenuName) {
            acc[normalizeMenuKey(item.apiMenuName)] = item.id;
        }
        return acc;
    },
    {},
);

const menuIdToItemId = CUSTOMIZABLE_SIDE_NAV_ITEMS.reduce<Record<number, string>>((acc, item) => {
    if (typeof item.apiMenuId === 'number') {
        acc[item.apiMenuId] = item.id;
    }
    return acc;
}, {});
 
const itemIdToMenuName = CUSTOMIZABLE_SIDE_NAV_ITEMS.reduce<Record<string, string>>(
    (acc, item) => {
        if (item.apiMenuName) {
            acc[item.id] = item.apiMenuName;
        }
        return acc;
    },
    {},
);

const getSideNavItemIdForMenu = (menuId: unknown, menuName: string) => {
    const resolvedMenuId = toFiniteMenuId(menuId);

    if (resolvedMenuId !== null) {
        const mappedById = menuIdToItemId[resolvedMenuId];
        if (mappedById) {
            return mappedById;
        }
    }

    return menuNameToItemId[normalizeMenuKey(menuName)];
};
 
const normalizeUserNavigationPreferences = (data: UserNavigationPreferencesData) => {
    const safeData = data ?? { allMenus: [], savedPreferences: [], sideNavJSON: null };
    const preferences = getPreferencesFromResponse(safeData).map((preference, index) =>
        normalizePreference(preference, index + 1),
    );
    const pinnedItemIds = preferences
        .map((preference, index) => ({
            preference,
            fallbackSortOrder: index + 1,
        }))
        .filter(({ preference }) => preference.isPinned)
        .sort(
            (left, right) =>
                getPreferenceSortOrder(left.preference, left.fallbackSortOrder) -
                getPreferenceSortOrder(right.preference, right.fallbackSortOrder),
        )
        .map(({ preference }) => preference)
        .map(preference =>
            getSideNavItemIdForMenu(getMenuIdFromPreference(preference), preference.menuName),
        )
        .filter((itemId): itemId is string => Boolean(itemId));
 
    return {
        allMenus: Array.isArray(safeData.allMenus) ? safeData.allMenus : [],
        pinnedItemIds,
    };
};
 
const buildOrderedUserNavigationPreferencesPayload = (
    allMenus: UserNavigationMenu[],
    pinnedItemIds: string[],
): UserNavigationPreference[] => {
    const menus = allMenus.length
        ? allMenus
        : CUSTOMIZABLE_SIDE_NAV_ITEMS.filter(item => item.apiMenuName).map(item => ({
              id: item.apiMenuId ?? 0,
              name: item.apiMenuName ?? item.id,
              description: item.label,
          }));
 
    const preferenceByItemId = menus.reduce<Record<string, UserNavigationPreference>>((acc, menu) => {
        const itemId = getSideNavItemIdForMenu(menu.id, menu.name);
        if (!itemId) {
            return acc;
        }
 
        acc[itemId] = {
            menuId: menu.id,
            menuName: itemIdToMenuName[itemId] ?? menu.name,
            isPinned: pinnedItemIds.includes(itemId),
            sortOrder: pinnedItemIds.indexOf(itemId) + 1,
        };
        return acc;
    }, {});
 
    const pinnedPreferences = pinnedItemIds
        .map(itemId => preferenceByItemId[itemId])
        .filter((preference): preference is UserNavigationPreference => Boolean(preference));
 
    const hiddenPreferences = menus.reduce<UserNavigationPreference[]>((preferences, menu) => {
        const itemId = getSideNavItemIdForMenu(menu.id, menu.name);
        if (itemId && pinnedItemIds.includes(itemId)) {
            return preferences;
        }
 
        preferences.push({
            menuId: menu.id,
            menuName: itemId ? itemIdToMenuName[itemId] ?? menu.name : menu.name,
            isPinned: false,
            sortOrder: pinnedItemIds.length + preferences.length + 1,
        });
        return preferences;
    }, []);
 
    return [...pinnedPreferences, ...hiddenPreferences];
};
 
export const fetchUserNavigationPreferences = createAsyncThunk(
    'sideNavigation/fetchUserNavigationPreferences',
    async () => {
        const response = await getUserNavigationPreferences();
        return normalizeUserNavigationPreferences(
            response.data.data as UserNavigationPreferencesData,
        );
    },
);
 
export const saveSideNavigationPinnedItems = createAsyncThunk(
    'sideNavigation/saveSideNavigationPinnedItems',
    async (
        params: {
            nextPinnedItemIds: string[];
            previousPinnedItemIds: string[];
        },
        { getState },
    ) => {
        const state = getState() as RootState;
        const payload = buildOrderedUserNavigationPreferencesPayload(
            state.sideNavigation.allMenus,
            params.nextPinnedItemIds,
        );
        await saveUserNavigationPreferences(payload);
        const response = await getUserNavigationPreferences();
        return normalizeUserNavigationPreferences(
            response.data.data as UserNavigationPreferencesData,
        );
    },
);
 
 