export type SideNavItem = {
    id: string;
    iconName: string;
    link: string;
    label: string;
    railLabel?: string;
    dynamic?: boolean;
    isDisabled?: boolean;
    isFixed?: boolean;
    adminOnly?: boolean;
    apiMenuId?: number;
    apiMenuName?: string;
};
 
export const SIDE_NAV_ITEMS: SideNavItem[] = [
    {
        id: 'home',
        iconName: 'home-line',
        link: '/home',
        label: 'Home',
        railLabel: 'Home',
        isFixed: true,
    },
    {
        id: 'search',
        iconName: 'search-md',
        link: '/home',
        label: 'Search',
        railLabel: 'Search',
        isDisabled: true,
        isFixed: true,
    },
    {
        id: 'digital-tools-library',
        iconName: 'waterfalls-v',
        link: '',
        dynamic: true,
        label: 'Digital Tools Library',
        railLabel: 'Tools',
        isFixed: true,
    },
    {
        id: 'performance-management',
        iconName: 'file-07',
        link: '',
        dynamic: true,
        label: 'Performance Management',
        railLabel: 'PM',
        apiMenuId: 1,
        apiMenuName: 'PerformanceManagement',
    },
    {
        id: 'kpi-watchlist',
        iconName: 'trend-up-01',
        link: '/home',
        isDisabled: true,
        label: 'KPI Watchlist',
        railLabel: 'Watchlist',
        apiMenuId: 3,
        apiMenuName: 'WatchList',
    },
    {
        id: 'todo',
        iconName: 'full-selection',
        link: '',
        dynamic: true,
        label: 'To-Do',
        railLabel: 'To-Do',
        apiMenuId: 4,
        apiMenuName: 'ToDo',
    },
    {
        id: 'exceptions',
        iconName: 'alert-hexagon',
        link: '',
        dynamic: true,
        label: 'Exceptions',
        railLabel: 'IRO',
        apiMenuId: 5,
        apiMenuName: 'Exceptions',
    },
    {
        id: 'analytics',
        iconName: 'dataflow-01',
        link: '',
        dynamic: true,
        label: 'Analytics',
        railLabel: 'Analytics',
        apiMenuId: 2,
        apiMenuName: 'Analytics',
    },
    {
        id: 'admin-hub',
        iconName: 'database-02',
        link: '/admin-hub',
        label: 'Admin Hub',
        railLabel: 'Admin',
        isFixed: true,
        adminOnly: true,
    },
    {
        id: 'digital-worker',
        iconName: 'data-flow-03',
        link: '',
        dynamic: true,
        label: 'AI Digital Worker',
        railLabel: 'DW',
        apiMenuId: 6,
        apiMenuName: 'DigitalWorker',
    },
    {
        id: 'todo-testing',
        iconName: 'file-check-02',
        link: '',
        dynamic: true,
        label: 'To-Do',
        railLabel: 'To-Do-New',
        apiMenuId: 7,
        apiMenuName: 'ToDo',
    },
];
 
export const CUSTOMIZABLE_SIDE_NAV_ITEMS = SIDE_NAV_ITEMS.filter(item => !item.isFixed);
 
export type UserNavigationMenu = {
    id: number;
    name: string;
    description?: string;
};
 
export type UserNavigationPreferences = {
    allMenus?: UserNavigationMenu[];
    savedPreferences?: unknown[];
    sideNavJSON?: unknown;
};
 
export type UserNavigationPreferencePayload = {
    menuId: number;
    menuName: string;
    isPinned: boolean;
    sortOrder: number;
};
 
export const FIXED_SIDE_NAV_ITEMS = SIDE_NAV_ITEMS.filter(item => item.isFixed);
 
const normalizeMenuName = (name: string) => name.replace(/[^a-z0-9]/gi, '').toLowerCase();
 
const MENU_NAME_TO_SIDE_NAV_ID: Record<string, string> = {
    performancemanagement: 'performance-management',
    analytics: 'analytics',
    watchlist: 'kpi-watchlist',
    kpiwatchlist: 'kpi-watchlist',
    todo: 'todo',
    exceptions: 'exceptions',
    digitalworker: 'digital-worker',
};
 
const MENU_API_ID_TO_SIDE_NAV_ID: Record<number, string> = {
    1: 'performance-management',
    2: 'analytics',
    3: 'kpi-watchlist',
    4: 'todo',
    5: 'exceptions',
    6: 'digital-worker',
};
 
const findConfiguredItem = (menu: UserNavigationMenu) => {
    const sideNavItemId =
        MENU_API_ID_TO_SIDE_NAV_ID[menu.id] ?? MENU_NAME_TO_SIDE_NAV_ID[normalizeMenuName(menu.name)];
 
    if (!sideNavItemId) {
        return undefined;
    }
 
    return CUSTOMIZABLE_SIDE_NAV_ITEMS.find(item => item.id === sideNavItemId);
};
 
const getSideNavItemIdFromMenu = (menu: UserNavigationMenu) => {
    return MENU_API_ID_TO_SIDE_NAV_ID[menu.id] ?? MENU_NAME_TO_SIDE_NAV_ID[normalizeMenuName(menu.name)];
};
 
const toNavigationMenu = (menu: unknown): UserNavigationMenu | null => {
    if (!menu || typeof menu !== 'object') {
        return null;
    }
 
    const candidate = menu as Record<string, unknown>;
    const id = Number(candidate.id ?? candidate.menuId ?? candidate.menuID);
    const name =
        typeof candidate.name === 'string'
            ? candidate.name
            : typeof candidate.menuName === 'string'
              ? candidate.menuName
              : '';
 
    if (!Number.isFinite(id) && !name) {
        return null;
    }
 
    return {
        id,
        name,
        description:
            typeof candidate.description === 'string' ? candidate.description : undefined,
    };
};
 
const normalizeMenus = (menus: unknown[]): UserNavigationMenu[] => {
    return menus
        .map(toNavigationMenu)
        .filter((menu): menu is UserNavigationMenu => Boolean(menu));
};
 
const getMenusFromValue = (value: unknown): UserNavigationMenu[] => {
    if (Array.isArray(value)) {
        return normalizeMenus(value);
    }
 
    return [];
};
 
const extractSideNavMenus = (sideNavJSON: unknown): UserNavigationMenu[] => {
    const parsed =
        typeof sideNavJSON === 'string'
            ? (() => {
                  try {
                      return JSON.parse(sideNavJSON);
                  } catch {
                      return null;
                  }
              })()
            : sideNavJSON;
 
    if (Array.isArray(parsed)) {
        return normalizeMenus(parsed);
    }
 
    if (parsed && typeof parsed === 'object') {
        const candidate = parsed as Record<string, unknown>;
        const menus =
            candidate.allMenus ??
            candidate.menus ??
            candidate.menuItems ??
            candidate.sideNavigation ??
            candidate.sideNav;
 
        return getMenusFromValue(menus);
    }
 
    return [];
};
 
export const getSideNavItemsFromPreferences = (
    preferences?: UserNavigationPreferences | null,
): SideNavItem[] => {
    const apiMenus = extractSideNavMenus(preferences?.sideNavJSON);
    const menus = apiMenus.length ? apiMenus : preferences?.allMenus ?? [];
    const seenItemIds = new Set<string>();
 
    const mappedItems = menus.reduce<SideNavItem[]>((items, menu) => {
        const configuredItem = findConfiguredItem(menu);
 
        if (!configuredItem || seenItemIds.has(configuredItem.id)) {
            return items;
        }
 
        seenItemIds.add(configuredItem.id);
        items.push({
            ...configuredItem,
            apiMenuId: menu.id,
            apiMenuName: menu.name,
        });
        return items;
    }, []);
 
    return mappedItems.length ? mappedItems : CUSTOMIZABLE_SIDE_NAV_ITEMS;
};
 
const toNavigationPreference = (preference: unknown): UserNavigationPreferencePayload | null => {
    if (!preference || typeof preference !== 'object') {
        return null;
    }
 
    const candidate = preference as Record<string, unknown>;
    const menuId = Number(candidate.menuId ?? candidate.id);
    const menuName =
        typeof candidate.menuName === 'string'
            ? candidate.menuName
            : typeof candidate.name === 'string'
              ? candidate.name
              : '';
 
    if (!Number.isFinite(menuId) && !menuName) {
        return null;
    }
 
    return {
        menuId,
        menuName,
        isPinned: Boolean(candidate.isPinned),
        sortOrder: Number(candidate.sortOrder ?? 0),
    };
};
 
const getNavigationPreferencesFromValue = (value: unknown): unknown[] => {
    if (Array.isArray(value)) {
        return value;
    }
 
    const parsed =
        typeof value === 'string'
            ? (() => {
                  try {
                      return JSON.parse(value) as unknown;
                  } catch {
                      return null;
                  }
              })()
            : value;
 
    if (Array.isArray(parsed)) {
        return parsed;
    }
 
    if (parsed && typeof parsed === 'object') {
        const candidate = parsed as Record<string, unknown>;
        const preferences =
            candidate.savedPreferences ??
            candidate.preferences ??
            candidate.sideNavPreferences ??
            candidate.sideNavJSON;
 
        return Array.isArray(preferences) ? preferences : [];
    }
 
    return [];
};
 
export const getPinnedSideNavItemIdsFromPreferences = (
    preferences?: UserNavigationPreferences | null,
): string[] => {
    const savedPreferences =
        Array.isArray(preferences?.savedPreferences) && preferences.savedPreferences.length > 0
            ? preferences.savedPreferences
            : getNavigationPreferencesFromValue(preferences?.sideNavJSON);
 
    return savedPreferences
        .map((preference, index) => ({
            preference: toNavigationPreference(preference),
            fallbackSortOrder: index + 1,
        }))
        .filter(({ preference }) => Boolean(preference?.isPinned))
        .sort((left, right) => {
            const leftSortOrder = Number(left.preference?.sortOrder);
            const rightSortOrder = Number(right.preference?.sortOrder);
 
            return (
                (Number.isFinite(leftSortOrder) && leftSortOrder > 0
                    ? leftSortOrder
                    : left.fallbackSortOrder) -
                (Number.isFinite(rightSortOrder) && rightSortOrder > 0
                    ? rightSortOrder
                    : right.fallbackSortOrder)
            );
        })
        .reduce<string[]>((itemIds, { preference }) => {
            if (!preference) {
                return itemIds;
            }
 
            const itemId = getSideNavItemIdFromMenu({
                id: preference.menuId,
                name: preference.menuName,
            });
 
            if (itemId && !itemIds.includes(itemId)) {
                itemIds.push(itemId);
            }
 
            return itemIds;
        }, []);
};
 
export const getNavigationPreferencePayload = (
    items: SideNavItem[],
    pinnedItemIds: string[],
): UserNavigationPreferencePayload[] => {
    return items
        .map((item, index) => ({
            menuId: item.apiMenuId,
            menuName: item.apiMenuName,
            isPinned: pinnedItemIds.includes(item.id),
            sortOrder: pinnedItemIds.includes(item.id)
                ? pinnedItemIds.indexOf(item.id) + 1
                : pinnedItemIds.length + index + 1,
        }))
        .filter(
            (
                preference,
            ): preference is UserNavigationPreferencePayload =>
                typeof preference.menuId === 'number' &&
                Number.isFinite(preference.menuId) &&
                typeof preference.menuName === 'string' &&
                preference.menuName.length > 0,
        );
};
 
 