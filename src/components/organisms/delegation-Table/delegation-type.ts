export interface IDelegation {
    delegationId: string;
    delegator: string;
    delegatee: string;
    role: string;
    startDate: string;
    endDate: string;
    status: string;
    createdBy: string;
    createdOn: string;
    totalRows?: number;
    totalPages?: number;
}

export interface DelegationState {
    data: IDelegation[];
    totalRows: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    loading: boolean;
}

export type DelegationItem = {
    delegationId: number;
    userName: string;
    toolName: string[] | null;
    delegationStartDate: string; // ISO
    delegationEndDate: string; // ISO
    status: string; // "Active" | "Expired" etc.
};

export type DelegationFetchResult = {
    items: DelegationItem[];
    totalRows: number;
    totalPages: number;
};

export interface DelegationRow {
    id: string;
    roleName: string;
    delegatedBy: string;
    startDate: string;
    endDate: string;
    status: string;
}

export interface DelegatedPermission {
    roleId: number;
    roleName: string;
    roleRegion: string;
    toolPermissionName: string;
    toolPermissionId: number;
    adGroup: string;
    toolModuleName: string;
    toolPermissionDescription: string;
    toolId: number;
    toolName: string;
    toolType: string;
    isActiveRole: boolean;
    isActiveToolPermission: boolean;
    isActiveTool: boolean;
    toolNum: number;
    totalRoles: number;
    totalCount: number;
}

export type DelegatedRoleViewRow = {
    roleId: number;
    roleName: string;
    roleRegion: string;
    toolId: number;
    toolName: string;
    toolType: string;
    toolPermissionId: number;
    toolPermissionName: string;
    toolModuleName: string;
    adGroup: string | null;
    isActiveToolPermission: boolean;
};

// Backend API Models
export interface DelegatedPermissionAPI {
    toolId: number;
    toolName: string;
    permissionId: number;
    permissionName: string;
    moduleName: string;
    roleId: number;
}

export interface UserToolsAPI {
    toolId: number;
    toolName: string;
    permissionCount: number;
    adgroupsList: AdGroupAPI[];
}

export interface AdGroupAPI {
    adGroup: string;
    adGroupId: string;
    permission: AppPermissionAPI[];
}

export interface AppPermissionAPI {
    appPermissionId: number;
    appPermissionName: string;
    appModuleName: string;
    accessTypeName: string;
}

// UI Models
export interface ToolItemUI {
    toolId: number;
    toolName: string;
    permissionCount: number;
    permissions: PermissionUI[];
}

export interface PermissionUI {
    id: number;
    name: string;
    moduleName: string;
    accessType: string;
}
export interface UserToolsResponse {
    data: {
        tools: ToolItem[];
    };
}

export interface ToolItem {
    toolId: number;
    toolName: string;
    permissionCount: number;
    adgroupsList: ADGroup[];
}

export interface ADGroup {
    adGroup: string;
    adGroupId: string;
    permission: PermissionItem[];
}

export interface PermissionItem {
    appPermissionId: number;
    appPermissionName: string;
    appModuleName: string;
    accessTypeName: string;
    isActiveAppPermission: boolean;
}
