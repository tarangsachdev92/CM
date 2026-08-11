import { Language } from '../types/common';
import { postAPI, putAPI, deleteAPI, getAPI } from './api';

interface FilterPayload {
    filterId: number | null;
    filterName: string | null;
    financialCycle?: string | null;
    hierarchy: {
        geographies: {
            regions: {
                region: string;
                clusters: {
                    region: string;
                    cluster: string;
                    markets: {
                        cluster: string;
                        market: string;
                        sites: {
                            market: string;
                            site: string;
                            siteCode: string;
                            salesOrg?: string;
                        }[];
                    }[];
                }[];
            }[];
        };
        products: {
            segments: {
                segment: string;
                categories: {
                    segment: string;
                    category: string;
                    brands: {
                        category: string;
                        brand: string;
                        subBrands: {
                            subBrand: string;
                            sku: string[];
                        }[];
                    }[];
                }[];
            }[];
        };
        customers: {
            channelCustomers: {
                channel: string;
                customers: string[];
            }[];
        };
    };
}

interface FilterGroupPayload {
    filterId: number;
    filterName: string;
    financialCycle?: string | null;
    filterJSON: string;
    hierarchy: {
        geographies: {
            regions: Region[];
        };
        products: {
            segments: Segment[];
        };
        customers: {
            channelCustomers: ChannelCustomer[];
        };
    };
    isFilterApplied: boolean;
}

interface Region {
    region: string;
    clusters: Cluster[];
}

interface Cluster {
    region: string;
    cluster: string;
    markets: Market[];
}

interface Market {
    cluster: string;
    market: string;
    sites: Site[];
}

interface Site {
    market: string;
    site: string;
    siteCode: string;
    salesOrg?: string;
}

interface Segment {
    segment: string;
    categories: Category[];
}

interface Category {
    segment: string;
    category: string;
    brands: Brand[];
}

interface Brand {
    category: string;
    brand: string;
    subBrands: SubBrand[];
}

interface SubBrand {
    subBrand: string;
    sku: string[];
}

interface ChannelCustomer {
    channel: string;
    customers: string[];
}

export const createPrimaryRole = async (payload: {
    functionId: number;
    subFunctionId: number;
    regionId: number;
    clusterId: number;
    marketId: number;
    siteId: number;
    roleId: number;
    roleType: string;
    RequestComment?: string;
}) => {
    return await postAPI('api/users/create-role', payload);
};

export const editPrimaryRole = async (payload: {
    functionId: number;
    subFunctionId: number;
    regionId: number;
    clusterId: number;
    marketId: number;
    siteId: number;
    roleId: number;
    roleType: string;
    RequestComment?: string;
}) => {
    return await putAPI('api/users/edit-primary-role', payload);
};

export const deleteUserSecondaryRole = async (payload: {
    roleId: number;
}): Promise<{ data: boolean; statusCode: number; message: string }> => {
    return await deleteAPI(`api/users/delete-role?roleId=${payload.roleId}`, {});
};

export const deleteUserSecondaryRoleNew = async (payload: {
    roleId: number;
}): Promise<{ data: boolean; statusCode: number; message: string }> => {
    return await deleteAPI(`api/users/delete-user-role-by-id?roleId=${payload.roleId}`, {});
};

export const checkDuplicateFilterGroup = async (payload: FilterGroupPayload) => {
    return await postAPI('api/globalFilter/check-duplicate-filter-groups', payload);
};

export const upsertFilterGroup = async (payload: FilterPayload) => {
    return await postAPI('api/globalFilter/upsert-filter-groups', payload);
};

export const getFilterGroupDropdowns = async () => {
    return await getAPI('api/globalFilter/filter-dropdown-gmc');
};

export const getFilterHierarchies = async () => {
    const response = await getAPI(`api/globalFilter/filter-group-hierarchies`, {});
    return response?.data?.data;
};

export const deleteFilterGroup = async (
    filterGroupId: number,
): Promise<{ data: boolean; statusCode: number; message: string }> => {
    return await deleteAPI(
        `api/globalFilter/delete-filter-group?filterGroupId=${filterGroupId}`,
        {},
    );
};

export const applySelectedFilterGroup = async (payload: {
    filterGroupJson: {
        filterId: number;
        isFilterApplied: boolean;
    }[];
    roleBasedJSON: {
        roleId: number;
        isFilterApplied: boolean;
    }[];
}) => {
    return await postAPI('api/globalFilter/apply-filter-group', payload);
};

export const getUserToolPermissions = async (payload: {
    roleId: number;
    roleType: string;
    pageSize: number;
    pageNumber: number;
}) => {
    return await postAPI('api/users/user-tools', payload);
};

export const getProductHeirarchy = async (payload: {
    segmentId: string | null;
    categoryId: string | null;
    brandId: string | null;
    subBrandId: string | null;
    skuId: string | null;
    pageSize: number;
    pageNumber: number;
    searchKeyword?: string | null;
    subSegmentId: string | null;
    stateId: string | null;
    subCategoryId: string | null;
    masterCodeId: string | null;
    rootCodeId: string | null;
    variantId: string | null;
    searchColumn?: string | null;
}) => {
    const response = await postAPI(`api/common/product-hierarchy`, payload);
    return response?.data?.data;
};

export const getGeographyHeirarchy = async (payload: {
    regionId: string | null;
    clusterId: string | null;
    marketId: string | null;
    siteId: string | null;
}) => {
    const response = await postAPI(`api/common/geography-hierarchy`, payload);
    return response?.data?.data;
};

export const getChannelHeirarchy = async (payload: {
    channelId: string | null;
    customerId: string | null;
    shippedToId: string | null;
    soldToId: string | null;
    pageSize: number;
    pageNumber: number;
    searchColumn?: string | null;
    searchKeyword?: string | null;
}) => {
    const response = await postAPI(`api/common/channel-hierarchy?channelId`, payload);
    return response?.data?.data;
};

export const getUserToolAccess = async (toolName: string) => {
    return await getAPI(`api/common/check-user-tool-access?toolName=${toolName}`);
};

export const getLanguageList = async () => {
    return await getAPI(`api/common/languages`);
};

export const SaveUserLanguage = async (language: Language) => {
    return await postAPI(`api/common/save-language`, language);
};

export const SaveUserTimezoneOffset = async (offset: number) => {
    return await postAPI(`api/common/save-user-timezoneoffset`, { userTimeOffset: offset });
};
 
export type UserNavigationMenu = {
    id: number;
    name: string;
    description: string;
};
 
export type UserNavigationPreference = {
    menuId: number;
    menuName: string;
    isPinned: boolean;
    sortOrder: number;
};
 
export type UserNavigationPreferencesData = {
    allMenus: UserNavigationMenu[];
    savedPreferences: UserNavigationPreference[];
    sideNavJSON: string | UserNavigationPreference[] | null;
};
 
export const getUserNavigationPreferences = async () => {
    return await getAPI('api/users/get-user-navigation-preferences');
};
 
export const saveUserNavigationPreferences = async (
    preferences: UserNavigationPreference[],
) => {
    return await postAPI('api/users/save-user-navigation-preferences', preferences);
};
 
 