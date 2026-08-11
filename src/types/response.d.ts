import type { Notification_And_Alert_RuleTypes, TimeCategory } from '../utils/constants';

type IJwt = {
    given_name: string;
    unique_name: string;
    family_name: string;
};

type ILastRefreshData = {
    userId: number;
    firstName: string | null;
    lastName: string | null;
    userName: string | null;
    userEmail: string | null;
    activityTimeStamp: string | null;
};

type ISelectedCalendarData = {
    year: number | null;
    fiscalInfo: string | null;
    quarter: {
        label: string | null;
        value: string | null;
    } | null;
    month: string | null;
    week: {
        label: string | null;
        value: string | null;
    } | null;
    day: string | null;
    shift: {
        label: string | null;
        value: string | null;
    } | null;
};

type IRoleFunctionsData = {
    functionId: number;
    functionName: string | null;
};
type IIssueSubFunctionsData = {
    functionId: number;
    subFunctionId: number;
    subFunctionName: string | null;
};
type IIssueCategoriesData = {
    categoryId: number;
    categoryName: string | null;
};

type IIssuePriorityData = {
    priorityId: number;
    priorityName: string | null;
};

type IIssueForumsData = {
    forumId: number;
    forumName: string | null;
};

type IFilterHierarchiesData = {
    hierarchyId: number;
    hierarchy: string | null;
};

type IFilterFinancialCycle = {
    FinancialCycleId: number;
    FinancialTypeName: string | null;
};

type IIssueTagsData = {
    tagId: number;
    tag: string;
    isActive: boolean;
};

type IAppFeature = {
    appId?: number;
    roleId: number;
    appFeatureId?: number;
    appFeatureName: string;
};

type IToolFeature = {
    toolId?: number;
    roleId: number;
    toolFeatureId?: number;
    toolFeatureName: string;
    isActive?: boolean;
};

type IPersonaDescription = {
    PersonaName?: string;
    Description?: string;
    ADGroupId?: string;
    DataAccessId?: string;
    RoleId?: string;
};

type IPersonaPermissionMappings = {
    PersonaName?: string;
    personaId?: number;
    permissionId?: number;
    isChecked?: boolean;
};

type IRoleSubFunctionsData = {
    functionId: number;
    subFunctionId: number;
    subFunctionName: string | null;
};

type ISitesData = {
    siteId: number;
    siteName: string;
    geographyTypeId: number;
};

type IIssueRoleUser = {
    roleId: number;
    role: string;
    numberOfUsers: number;
    users: Array<{
        email: string;
        isActive: boolean;
        userName: string;
        fullName: string | null; // Allows null values for fullName
        firstName: string | null;
        LastName: string | null;
        dueDate: string | null;
    }>;
};

type IIssueOwner = {
    forumId: number;
    forumName: string;
    forumOwner1Email: string;
    forumOwner1: string;
    forumOwner2Email: string;
    forumOwner2: string;
};

// Define the type for KPI
type IIssueImpactKPI = {
    issueId: number;
    kpiId: number;
    kpiValue: number;
    kpiName: string;
    deltaDirection: string;
    units: string | null;
};

// Define the type for resolution details
type IIssueResolutionDetail = {
    issueId: number;
    resolutionId: number;
    resolutionTitle: string;
    resolutionDescription: string;
    isFinalResolution: boolean;
    createdBy: string | null;
    recommendations: string | null;
    attachments: string | null;
    resolutionComments: string | null;
    resolutionOutcome: string | null;
    resolutionType: string | null;
};

type ITagCategoryDetails = {
    tagCategoryId: number;
    tagCategoryName: string | null;
    actions: number;
};

type ITagDetails = {
    tagId: number;
    tagName: string | null;
    tagCategoryId: number;
    tagCategoryName: string | null;
    actions: number;
    instances: number;
    updatedOn: string | null;
};
// Define the type for general details
type IGeneralDetails = {
    issueId: number;
    issueTitle: string;
    situationText: string;
    decisionStatusId: number;
    decisionStatusName: string;
    impactOkr: string;
    complicationDescription: string;
    collaboratorEmail: string;
    previousIssueId: number;
    nextIssueId: number;
    issueOwner: string;
};

type IIssueDimenstion = {
    dimensionId: number;
    dimensionName: string;
    dimensionValue: string;
};
// Define the main type for the entire payload
type IIssueScrPayload = {
    statusCode: number;
    data: {
        generalDetails: IGeneralDetails;
        dimensionValue: IIssueDimenstion[]; // Assuming dimensionValue is an array of any type
        issueImpactKPI: IIssueImpactKPI[];
        issueResolutionDetails: IIssueResolutionDetail[];
    };
    message: string | null;
};

type ITagsPayload = {
    tagCategoryDetails: ITagCategoryDetails[];
    tagDetails: ITagDetails[];
    categoryName?: string;
};

type IMarketsData = {
    marketId: number;
    marketName: string;
    geographyTypeId: number;
    sites: ISitesData[];
};

type IClustersData = {
    clusterId: number;
    regionId?: number;
    clusterName: string;
    geographyTypeId: number;
    markets: IMarketsData[];
};

interface ILocationsData {
    regionId: number;
    regionName: string;
    geographyTypeId: number;
    clusters: {
        clusterId: number;
        clusterName: string;
        geographyTypeId: number;
        markets: {
            marketId: number;
            marketName: string;
            geographyTypeId: number;
            sites: {
                siteId: number;
                siteName: string;
                geographyTypeId: number;
            }[];
        }[];
    }[];
}

type ILocationRolesData = {
    roleId: number;
    role: string | null;
    region: string;
    subFunctionName: string;
    roleLevelName: string;
};

type IRoleLevelsData = {
    roleLevelId: number;
    roleLevelName: string;
};

type IDepartment = {
    id: number | string;
    name: string;
};

type IApplicationData = {
    appId: number;
    appName: string;
};

type IToolsData = {
    toolId: number;
    toolName: string;
    toolType: string;
};

type IRolesData = {
    roleId: number;
    role: string;
    region: string;
    subFunctionName: string;
    departmentName: string;
    geographyName: string;
} & IRoleLevelsData;

type IToolTypeData = {
    toolTypeId: number;
    toolTypeName: string;
};

type IRoleBasedDetails = {
    roles: IRoleFunctionsData[];
    functions: IRoleFunctionsData[];
    locations: ILocationsData[];
    apps: IApplicationData[];
};

interface IDelegateRoleProfile {
    delegatedByUser: string;
    delegationId: number;
    endDate: string | null;
    permissionCount;
    roleId: number;
    roleName: string;
    roleRegion: string;
    roleType: string;
    startDate: string | null;
    status: string;
    userEmail: string;
}

interface IDelegateRoleStatusSummary {
    roleId: number;
    status: string;
    statusCount: number;
    userEmail: string;
}

interface IUserRoleStatus {
    roleId: number;
    status: string;
    roleType: string;
    statusCount: number;
    adGroupIds: number;
    requestedOn: string;
    updatedOn: string;
}

interface IUserRole {
    subFunction?: string;
    department?: string;
    roleId: number;
    role: string;
    adgroupsList: Array<{
        adgroup: string;
        adGroupid: string;
        status: string;
        requestedOn: string;
        updatedOn: string;
    }>;
    isAnyADGroupRequested: boolean;
    isAnyADGroupPending: boolean;
    region: string;
    statusChips: {
        Approved: number;
        Pending: number;
        Requested: number;
        AutoRejected: number;
        AddFailed: number;
    };
    levelName: string;
    subFunctionName: string;
    departmentName: string;
    roleGeoName: string;

    delegatedByUser?: string;
    startDate?: string | null;
    endDate?: string | null;
}

interface IUserForumRoles {
    collabType: string;
    forumName: string;
    geography: string;
}

type IPrimaryRoleData = {
    roleId: number;
    latestRoleId: null;
    role: string;
    roleType: string;
    function: string;
    functionId: number;
    subFunction: string;
    subFunctionId: number;
    region: string;
    regionId: number;
    cluster: string;
    clusterId: number;
    market: string;
    marketId: number;
    site: string;
    siteId: number;
    roleLevel: string;
    department: string;
    levelName: string;
    subFunctionName: string;
    roleGeoName: string;
    secondaryRoles?: [];
};

type IPrimaryRoleDataNew = {
    roleId: number;
    geographyName?: string;
    subDepartment?: string;
    attributesJson?: any;
    roleStartDate: string;
    roleEndDate: string;
    geographyId: number;
    geographyTypeName: string;
    userEmail?: string;
    role: string;
    roleType: string;
    function: string;
    functionId: number;
    subFunction: string;
    subFunctionId: number;
    roleLevel: string;
    department: string;
};

// Raw row from delegated-role-view API
type DelegatedPermissionRow = {
    toolId: number;
    toolName: string;
    permissionId: number;
    permissionName: string;
    moduleName: string;
    roleId: number;
    roleName: string;
    roleRegion: string;
    hasPermissionAccess: boolean | null;
    permissionCount: number | null;
    adGroupName: string;
    adGroupId: string;
    IsActiveToolPermission: boolean | null;
    adGroupAccessStatus: string; // 'Pending' | 'Approved' | ...
};

export interface IAppDetails {
    toolId: number;
    toolName: string;
    toolType: string;
}

export interface IApplicationsAdGroupsData {
    adGroup: string;
    adGroupId: string;
    permission: Array<{
        accessTypeName: any;
        isActiveToolPermission: boolean;
        toolModuleName: any;
        toolPermissionDescription: any;
        toolPermissionId: number;
        toolPermissionName: string;
    }>;
    status: any;
}

export interface IRoleApplicationData {
    activePermissionCount: number;
    adgroups: Array<IApplicationsAdGroupsData>;
    toolDetails: IAppDetails;
    totalCount: number;
    personas?: Array<IPersona>;
}

type IPersona = {
    personaName: string;
    personaId: string;
    personaDescription: string;
    modules: Array<{
        module: string;
        moduleId: string;
        permission: IToolPermission[];
    }>;
};

type IRoleData = {
    roleId: number;
    role: string;
    function: string;
    region: string;
    roleLevel: string;
    regionId: number;
    market: string;
    site: string;
    userCount: number;
    isActive: boolean;
    totalRows: number;
    totalPages: number;
    roleType: string | null;
    roleLevelId: number;
    latestRoleId: number | null;
    functionId: number;
    subFunction: string;
    subFunctionId: number;
    fullRoleName: string;
    responsibilityLevel: string;
    roleName: string;
    subFunction: string | null;
    department: string;
    departmentId: number;
    isActive: boolean;
    region: string;
    clusterId: string;
    cluster: string;
    marketId: string;
    siteId: string;
    roleAlias: string;
    roleGeoName: string | null;
    secondaryRoles: any[] | null;
    geographyLevel: string | null;
    refreshDate?: string | null;
    geographyLevel: string | null;
    numberOfUsers: number;
    status: boolean;
};

type IUserData = {
    userId: number | string;
    name: string;
    email: string;
    function?: string;
    primaryRoleId?: string | number;
    primaryRole: string;
    region: string | null;
    market?: string | null;
    site?: string;
    isActive: boolean;
    totalRows?: number;
    totalPages?: number;
    lastActive?: string | null;
    attributes?: {
        AttributeId: number;
        AttributeName: string;
        AttributeValueIds: string;
        AttributeValueNames: string;
    }[];
    geography?: string | null;
};

export type IUserDataResponse = {
    user: IUserData[];
    filters: any[];
    distinctFilters: any | null;
    pagination: {
        totalRows: number;
        totalPages: number;
    };
    message: string | null;
    statusCode: number;
};

export interface IForumData {
    forumId: number;
    forumName: string;
    function: string;
    region: string;
    cluster: string;
    market: string;
    site: string;
    forumOwner1: string;
    forumOwner2: string;
    collaborators?: string;
    forumLevel: string;
    forumPeriod: string;
    functionIds?: string;
    functionName?: string;
    subFunctionName?: string;
    regionId?: string;
    clusterId?: string;
    marketId?: string;
    siteId?: string;
    forumLevelId?: string;
    forumPeriodId?: string;
    repeatsEveryNumber: number;
    repeatsEveryType: string;
    shiftStarting: string;
    dayStarting: string;
    weekStarting: string;
    weekOnDays: string;
    startingMonth: string;
    calendarType: string;
    calendarValue: string;
    status: number;
    actions?: any;
}

type IToolData = {
    toolId: number;
    tool: string;
    toolType: string;
    toolIdAlias: string;
    function: string;
    team: string;
    version: number;
    toolOwner: string;
    region: string;
    market: string;
    site: string;
    totalRows: number;
    totalPages: number;
};

type IIssueData = {
    issueId: string;
    issueIdAlias: string;
    issueTitle: string;
    product: string | null;
    material: string | null;
    brand: string | null;
    subBrand: string | null;
    segment: string | null;
    category: string | null;
    geography: string | null;
    customer: string | null;
    channel: string | null;
    line: string | null;
    shift: string | null;
    week: string | null;
    month: string | null;
    forum: string | null;
    issueOwner: string;
    issueOwnerEmail: string;
    actionStatus: IActionStatus[];
    priority: string;
    recurrence: string | null;
    issueCategory: string | null;
    tags: string | null;
    totalRows: number;
    totalPages: number;
    decisionStatus: string;
    dueDate: string;
    collabType: string;
};

type IActionStatus = {
    issueId: string;
    actionTitle: string;
    actionOwnerName: string;
    assignedTo: string;
    actionDescription: string;
    status: string;
    dueDate: string;
    logDate: string;
    updatedOn?: string;
};

type IRoleGeneralInformation = {
    roleId: number;
    latestRoleId: number | null;
    role: string;
    roleType: string | null;
    responsibilityLevelId: number;
    responsibilityLevel: string;
    function: string;
    functionId: string;
    subFunction: string;
    subFunctionId: string;
    isActive: boolean | null;
    regionId: string;
    region: string;
    clusterId: string;
    cluster: string;
    marketId: string;
    market: string;
    siteId: string;
    site: string;
    userCount: number | null;
    totalRows: number;
    totalPages: number;
    department: string;
    departmentId: string;
    subDepartment?: string;
    subDepartmentId?: strig;
    geographyLevel?: string;
    geographyLevelId?: number;
};

type IRoleDetails = {
    generalInformation: IRoleGeneralInformation;
    accessAndPermission: IAccessPermissionsRowData[];
    pagination: IPaginationData;
    userAttributes: IUserAttributes[];
};

type IColumnFilterData = {
    columnName: string;
    columnValue: string;
    id: string | null;
};

type IRoleFiltersData = {
    function: IColumnFilterData[];
    role: IColumnFilterData[];
    roleLevel: IColumnFilterData[];
    subfunction: IColumnFilterData[];
    region: IColumnFilterData[];
    isactive: IColumnFilterData[];
    usercount: IColumnFilterData[];
    department: IColumnFilterData[];
    subdepartment:  IColumnFilterData[];
};
type IUserFiltersData = {
    function: IColumnFilterData[];
    name: IColumnFilterData[];
    UserName: IColumnFilterData[];
    email: IColumnFilterData[];
    primaryRoleId: IColumnFilterData[];
    primaryRole: IColumnFilterData[];
    rolelevel: IColumnFilterData[];
    region: IColumnFilterData[];
    market: IColumnFilterData[];
    site: IColumnFilterData[];
    isactive: IColumnFilterData[];
    usercount: IColumnFilterData[];
    attribute: IColumnFilterData[];
    geography: IColumnFilterData[];
};

type IForumFiltersData = {
    forumName: IColumnFilterData[];
    function: IColumnFilterData[];
    functionName: IColumnFilterData[];
    subFunctionName: IColumnFilterData[];
    Region: IColumnFilterData[];
    Cluster: IColumnFilterData[];
    Market: IColumnFilterData[];
    Site: IColumnFilterData[];
    forumOwner: IColumnFilterData[];
    repeatsEveryType: IColumnFilterData[];
    forumLevel: IColumnFilterData[];
    forumPeriod: IColumnFilterData[];
};

type IApplicationFiltersData = {
    'Tool Name': IColumnFilterData[];
    'Sub-Function': IColumnFilterData[];
    Owner: IColumnFilterData[];
    Tool: IColumnFilterData[];
    ToolType: IColumnFilterData[];
    Type: IColumnFilterData[];
    ToolOwner: IColumnFilterData[];
    Function: IColumnFilterData[];
    SubFunction: IColumnFilterData[];
    Market: IColumnFilterData[];
    Region: IColumnFilterData[];
    Site: IColumnFilterData[];
    Team: IColumnFilterData[];
    Version: IColumnFilterData[];
    Status: IColumnFilterData[];
    'Geography Level': IColumnFilterData[];
};

type IRolePaginationData = {
    totalRows: number;
    totalPages: number;
};
type IUserPaginationData = {
    totalRows: number;
    totalPages: number;
};

type IADGroupPermissionData = {
    toolPermissionId: number;
    toolPermissionName: string;
    toolPermissionDescription: string | null;
    toolModuleName: string | null;
    accessTypeName: string | null;
    isActiveToolPermission: boolean | null;
    userSelected?: boolean;
};

type IADGroupDATA = {
    adGroup: string;
    adGroupId: string;
    permission: Array<IADGroupPermissionData>;
};

type IAccessPermissionsRowData = {
    toolDetails: {
        toolId: number;
        toolName: string;
        toolType: string;
    };
    activePermissionCount: number;
    adgroups: Array<IADGroupDATA>;
    selectedAdGroups?: Array<{ label: string; value: string; desc?: string }>;
    expandedRowData: Array<IADGroupPermissionData>;
};

type IPaginationData = {
    totalRows: number;
    totalPages: number;
};

type AppRole = {
    role: string;
    roleId?: number;
    roleRegion?: string;
    hasIncremented: boolean;
    permissionCount: number;
    isActivePermission?: boolean;
};

type AppPermission = {
    toolModuleName: string;
    toolPermissionId: number;
    toolPermissionName: string;
    adGroup?: string;
    adGroupId?: string;
    toolPermissionDescription: string;
    roles: AppRole[];
    isEditMode?: boolean;
};

type AppRolePermission = {
    toolId: number;
    toolName: string;
    toolType: string;
    noOfRolesTagged: number;
    roles: AppRole[];
    expandedRowData: AppPermission[];
    rowIndex: number;
    roleId: number;
};

type AppRolePermissionRowData = {
    toolRolePermissionData: AppRolePermission[];
    pagination: IPaginationData;
    totalRoles: number;
    isRoleNotMapped: boolean;
    isToolNotMapped: boolean;
    roleToolNotMapped: boolean;
    totalPermissionCount: number;
};

interface IApplicationDetailsGeography {
    geographyId: number;
    geographyName: string;
    name: string;
    showAll: string;
}

interface IToolDetails {
    toolDetail: {
        toolId: number;
        tool: string;
        toolType: string;
        toolIdAlias: string | null;
        version: string;
        toolOwner: string;
        team: string;
        adGroup: string;
        description: string;
        toolURL: string;
        toolDocumentationURL: string;
        toolThumbnailURL: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        geographyLevelId?: string;
        geographyLevel?: string;
        status?: string;
        lastRefresh?:string;
    };
    geography: {
        region: Array<IApplicationDetailsGeography>;
        cluster: Array<IApplicationDetailsGeography>;
        market: Array<IApplicationDetailsGeography>;
        site: Array<IApplicationDetailsGeography>;
    };
    functions: {
        functionId: number;
        functionName: string;
        showAll: string;
    }[];
    subFunctions: {
        subFunctionId: number;
        subFunctionName: string;
        functionId: number;
        showAll: string;
    }[];
}

type PermissionsColumnData = {
    appFeatureName: string;
    appModuleName: string;
};
type ToolPermissionsColumnData = {
    toolFeatureName: string;
    toolModuleName: string;
    toolModuleId: number;
};
type PermissionDetails = {
    appId: number;
    appFeatureId: number;
    appFeatureName: string;
    appFeatureDescription: string | null;
    appModuleName: string;
    accessTypeName: string;
    isActivePermission: boolean;
};
type ToolPermissionDetails = {
    toolId: number;
    toolFeatureId: number;
    toolFeatureName: string;
    toolFeatureDescription: string | null;
    toolModuleName: string;
    accessTypeName: string;
    isActivePermission: boolean;
};
type ApplicationAdGroup = {
    adGroup: string;
    adGroupId: string;
    appFeature: PermissionDetails[];
};

type ToolAdGroup = {
    adGroup: string;
    adGroupId: string;
    toolFeature: ToolPermissionDetails[];
};

type IGeographyData = {
    geographyId: number;
    geography: string;
};

interface IRoleToolPermissions {
    roleId: number;
    role: string;
    activePermissionCount: number;
    totalCount: number;
    toolAdGroups: ToolAdGroup[];
}

type IIssueFiltersData = {
    issueTitle: IColumnFilterData[];
    product: IColumnFilterData[];
    forum: IColumnFilterData[];
    issueOwner: IColumnFilterData[];
    decisionStatus: IColumnFilterData[];
    actionStatus: IColumnFilterData[];
    dueDate: IColumnFilterData[];
    priority: IColumnFilterData[];
    lane: IColumnFilterData[];
};

type IIssueDimensionData = {
    dimensionName: string;
    dimensionId: number;
};

type IIssueDimensionValueData = {
    dimensionName: string;
    dimensionValues: string[];
    dimensionId: number;
};

type IssueImpactDetailsData = {
    issueId: number;
    impactId: number;
    impactOKR: string | null;
    complicationDescription: string | null;
    createdBy: string | null;
    impactKPI: impactedKpiData[] | null;
};

type IRoleUser = {
    roleId: number;
    role: string;
    numberOfUsers: number;
    users: IUser[];
};

type IUser = {
    email: string;
    isActive: boolean;
    userName: string;
    fullName: string;
    firstName: string;
    lastName: string;
    dueDate: string;
};

type ResolutionrecommendationDetailsData = {
    issueId: number;
    resolutionId: number;
    resolutionTitle: string;
    resolutionDescription: string;
    isFinalResolution: boolean;
    createdBy: string;
    recommendations: RecommendationsObject[];
    resolutionComments: Comments[];
    attachments: AddResolutionAttachment[];
    isEditing: boolean;
    showAddComment: boolean;
    isExpanded: boolean;
    isActionAvailable: boolean;
    activityLogJSON?: IssueActivity;
};

type RecommendationsObject = {
    resolutionId: number;
    outcomeId: number;
    issueId: number;
    resolutionOutcome: string;
    resolutionType: string;
    createdBy: string;
};

type ResolutionComments = {
    issueId: number;
    resolutionId: number;
    commentId: number;
    comment: string;
    createdBy: string;
};
type Comments = {
    issueId: number;
    resolutionId?: number;
    commentId: number;
    commentText: string;
    createdBy: string;
    actionId?: number;
    commentAddedDate: string | null;
    firstName: string;
    lastName: string;
};

type RoleBasedFilterRole = {
    roleId: number;
    roleName: string;
    roleType: string;
    region: string[];
    cluster: string[];
    market: string[];
    site: string[];
    isOpen: boolean;
    isFilterApplied: boolean;
    levelName: string;
    subFunctionName: string;
    departmentName: string;
    roleGeoName: string;
};
export interface Site {
    market: string;
    site: string;
    siteCode: string;
    salesOrg: string | null;
}

export interface Market {
    cluster: string;
    market: string;
    sites: Site[];
}

export interface Cluster {
    region: string;
    cluster: string;
    markets: Market[];
}

export interface Region {
    region: string;
    clusters: Cluster[];
}

export interface Geography {
    regions: Region[];
}

export interface SKU {
    subBrand: string;
    sku: string[];
}

export interface Brand {
    category: string;
    brand: string;
    subBrands: SKU[];
}

export interface Category {
    segment: string;
    category: string;
    brands: Brand[];
}

export interface Segment {
    segment: string | null;
    categories: Category[];
}

export interface Product {
    segments: Segment[];
}

export interface ChannelCustomer {
    channel: string;
    customers: string[];
}

export interface Customer {
    channelCustomers: ChannelCustomer[];
}
export interface HierarchyDataModel {
    geographies: Geography;
    products: Product;
    customerChannels: Customer;
}

// export interface FilterGroupDataModelRes {
//     filterId: number;
//     filterName: string;
//     financialCycle: string;
//     hierarchy: HierarchyDataModel;
//     isFilterApplied: string;
// }
type IssueRootCauseData = {
    rootCauseId: number | null;
    issueId: number;
    why1: string | null;
    why2: string | null;
    why3: string | null;
    why4: string | null;
    why5: string | null;
    rootCauseDescription: string | null;
};

type IssueImpactDetailsData = {
    issueId: number;
    impactId: number;
    impactOkr: string | null;
    complicationDescription: string | null;
    createdBy: string | null;
};

type impactedKpiData = {
    issueId: number | null;
    deltaDirection: string | null;
    kpiId: number | null;
    kpiName: string | null;
    kpiValue: number | null;
    units: string | null;
};

type assignUserData = {
    issueId: number | null;
    sectionId: number | null;
    collabTypeId: string | null;
    users: IUser[] | null;
};

type IssueGeneralDetails = {
    categoryId: number;
    category: string;
    dueDate: string;
    escalationId: number;
    escalation: string;
    forumId: number;
    forum: string;
    functionId: number;
    function: string;
    subFunctionId: number;
    subFunction: string;
    issueId: number;
    issueList: string;
    issueTitle: string;
    priorityId: number;
    priority: string;
    recurrence: string;
    tags: IIssueTagsData[];
    collaborators: collaborator[];
    situationText: string;
    decisionStatus: string;
    decisionStatusId: number;
    blockedByIssueIds: string;
    activityLogJSON?: IssueActivity[];
};

type IDimensionMappingDetails = {
    dimensionId: number;
    dimensionName: string;
    dimensionValue: string;
};

type ruleTypes = keyof typeof Notification_And_Alert_RuleTypes;

type TNotificationAlertRules = {
    kpiId?: number;
    kpiName?: string;
    ruleId: number;
    dimensionId?: number;
    dimensionName?: string;
    dimensions?: any;
    notificationsCount: number;
    warningsCount: number;
    alertsCount: number;
    notificationType: null;
    value?: null;
    isEnabled: boolean;
};

interface INotificationsAndAlerts {
    ruleCount: number;
    ruleType: ruleTypes;
    ruleTypeId: (typeof Notification_And_Alert_RuleTypes)[ruleTypes];
    kpiRule: null | TNotificationAlertRules[];
    otherTypeRule: null | TNotificationAlertRules[];
}

//Notification Rules

interface INotificationAltertRuleData {
    ruleDetail: INotiRuleDetail;
    dimensionMapping: INotiDimensionMapping[];
    conditionDetail: INotiConditionDetail[];
    triggerFrequencyDetails: ITriggerFrequency;
}

interface INotiRuleDetail {
    ruleTypeId: number;
    ruleTypeName: string;
    functionId: number | null;
    functionName: string | null;
    kpiId: number | null;
    kpiName: string | null;
    categoryId: string | null;
    tagId: string | null;
}

interface INotiDimensionMapping {
    id?: string;
    dimensionName: string;
    value: string;
    dimensionId: number;
    selectedValues?: Array<{
        label: string;
        value: string;
        originalLabel?: string;
        originalValue?;
    }>;
    availableValues?: Array<{ label: string; value: string; desc: string }>;
    isLoading?: boolean;
}

interface INotiConditionDetail {
    id: string;
    conditionId: number | null;
    notificationType: string;
    whenCondition: string | null;
    kpiId: number | null;
    kpiName: string | null;
    comparisonOperator: string | null;
    kpiValue: number | null;
    priorityId: number | null;
    priorityName: string | null;
    escalationId: number | null;
    escalationName: string | null;
    allTrue: boolean | null;
}

interface IIssueActivities {
    issueId: number;
    activityLog: string;
    comment: string;
    firstName: string;
    lastName: string;
    createdBy: string;
    createdOn: string;
}

interface ISection {
    id: number;
    issueManagementSection: string;
}

type ToDoTaskData = {
    title: string;
    source: string;
    dueDate: string;
    priority: string;
};

// Define the overall structure for the task data
// type ToDoTaskData = {
//   dueInDays: number;
//   datetime: string;
//   fullName: string;
//   titletasks: Task[];
// };

type IUserNotifications = {
    id: number;
    ruleId?: number;
    NotificationType: string;
    notificationText?: any;
    timeCategory: keyof typeof TimeCategory;
    status: boolean;
    createdOn?: string;
    createdBy?: string;
    totalUnread?: number;
    triggerType: string;
    isSent?: boolean;
    userEmail?: string;
    isGenericNotification: boolean;
    dueInDays: number;
    datetime: string;
    fullName: string;
    tasks: ToDoTaskData[];
};

type IUserNotificationsAlertsWarnings = {
    totalUnread: number;
    notificationUnreadCount: number;
    alertUnreadCount: number;
    warningUnreadCount: number;
    notifications: IUserNotifications[];
    alerts: IUserNotifications[];
    warnings: IUserNotifications[];
};

type INotificationType = 'Alert' | 'Notification' | 'Warning';

type IForumMember = {
    firstName: string;
    forumId: number;
    forumName: string;
    lastName: string;
    memberEmail: string;
};

interface BaseExceptionDetails {
    id: number;
    title: string;
    probability: number;
    category: string;
    priority: string;
    decisionStatus: string;
    actionStatus: Array<{
        actionStatus: string;
        owner: string;
        logDate: string;
        dueDate: string;
    }>;
}

export interface IGetExceptionsFlyoutIssuesDetails extends BaseExceptionDetails {
    exceptionId: number; // This could be the same as id
    riskDescription: string;
}
export interface IGetExceptionsFlyoutRiskDetails extends BaseExceptionDetails {
    exceptionId: number; // This could be the same as id
    riskDescription: string;
}

export interface IGetExceptionsFlyoutOpportunityDetails extends BaseExceptionDetails {
    exceptionId: number; // This could be the same as id
    riskDescription: string;
}
export type RawExceptionItem = IGetExceptionsFlyoutRiskDetails;

export interface RawActionStatus {
    issueId?: string;
    exceptionId?: string;
    actionStatus: string;
    owner: string;
    logDate: string;
    dueDate: string;
}
export interface RawIssueItem extends IGetExceptionsFlyoutIssuesDetails {
    actionStatus: RawActionStatus[];
}

export interface RawRiskItem extends IGetExceptionsFlyoutRiskDetails {
    actionStatus: RawActionStatus[];
}

export interface RawOpportrunityItem extends IGetExceptionsFlyoutOpportunityDetails {
    actionStatus: RawActionStatus[];
}
interface IFunctionSubFunctionLocationRole {
    functions: IRoleFunctionsData[];
    subFunctions: IRoleSubFunctionsData[];
    locations: ILocationsData[];
    roles: IRolesData[];
}

interface IPermissionManagementFiltersResponse {
    toolTypes: IToolTypeData[];
    tools: IToolsData[];
    functions: IRoleFunctionsData[];
    locations: ILocationsData[];
    roles: IRolesData[];
}

type ToDoComments = {
    toDoId: number;
    commentText: string;
    fullName: string;
    updatedOn: string;
};

type IToDoDetails = {
    id: number;
    //issueId: number;
    sourceSystemUniqueIdentifier: number;
    title: string | null;
    status: string;
    completedOn: string;
    dueDate: string;
    priority: string;
    assignedTo: string;
    assignee: string;
    source: string;
    moduleName: string;
    sectionId: string;
    //todoTypeName: string;
    issueSectionName: string;
    exceptionSectionName: string;
    description: string | null;
    //isCompleted: boolean;
    subtitle: string | null;
    readmorelink: string | null;
    isIncorrectAssignment?: boolean;
    isreccuring?: boolean;
    attributes?: IAttributes;
    nextRecurrenceDate?: string | null;
    executionfrequency?: string | null;
    recurrenceText?: string | null;
};

type IAttributes = {
    type: string;
    id: string;
    displayName: string;
};
export interface IToDoWidgetDetails {
    id: number;
    sourceSystemUniqueIdentifier: number;
    title: string | null;
    status: string;
    completedOn: string;
    dueDate: string;
    priority: string;
    assignedTo: string;
    assignee: string;
    source: string;
    sectionId: string;
    issueSectionName: string;
    description: string | null;
    subtitle: string | null;
    readmorelink: string | null;
    sourceSystemId: number | null;
    firstName: string;
    totalTodo: number;
    completedOnTimeRatio: number;
}
export interface IToDoList {
    todos: IToDoDetails[];
}

export interface IUserAppDetails {
    toolId: number;
    toolName: string;
    toolType: string;
}
export interface IUserToolPermission {
    toolId: number;
    toolIdAlias: string;
    toolName: string;
    toolType: string;
    adgroupsList: {
        permissionCount: number;
        adGroup: string;
        adGroupId: string;
        permission: {
            appPermissionId: number;
            appPermissionName: string;
            appPermissionDescription: string;
            appModuleName: string;
            accessTypeName: string;
            isActiveAppPermission: boolean | null;
        }[];
        status: string;
        requestedOn: string;
        updatedOn: string;
    }[];
    statusChips: {
        CancelInitiated: number;
        Pending: number;
    };
    permissionCount: number;
}

export interface IUserToolsApiResponse {
    roleId: number;
    role: string;
    tools: IUserToolPermission[];
    totalRows: number;
    totalPages: number;
    totalPermissionCount: number;
}

interface IRegion {
    regionId: number;
    region: string;
}

interface ICluster {
    clusterId: number;
    cluster: string;
}

interface IMarket {
    marketId: number;
    market: string;
}

interface ISite {
    siteId: number;
    manufacturingSite: string | null;
    siteCode: string | null;
}

interface IGeographies {
    regions: IRegion[];
    clusters: ICluster[];
    markets: IMarket[];
    sites: ISite[];
    siteCode: any[];
}

interface ISegment {
    segmentId: number;
    segment: string;
}

interface ICategory {
    // Define fields if categories are populated later
}

interface IBrand {
    brandId: number;
    brand: string;
}

interface ISubBrand {
    // Define fields if subBrands are populated later
}

interface ISKU {
    skuId: number;
    sku: string;
}

interface IProducts {
    segments: ISegment[];
    categories: ICategory[];
    brands: IBrand[];
}

interface IUserGlobalFilter {
    geographies: IGeographies;
    products: IProducts;
    customers: ICustomers;
}

interface IAFRoleGeneralInformation {
    role: string;
    roleLevel: string;
    market: string;
}

interface IAFToolPermission {
    toolPermissionId: number;
    toolPermissionName: string;
    toolPermissionDescription: string;
    toolModuleName: string;
    accessTypeName: string | null;
    isActiveToolPermission: boolean;
}

interface IAFAdGroup {
    adGroup: string | null;
    adGroupId: string | null;
    permission: IToolPermission[];
    status: string | null;
    requestedOn: string | null;
    updatedOn: string | null;
}

interface IAFToolDetails {
    toolId: number;
    toolName: string;
    toolType: string;
}

interface IAFAccessPermissionsRowData {
    toolDetails: IAFToolDetails;
    activePermissionCount: number;
    adgroups: IAFAdGroup[];
    totalCount: number;
}

interface IAFPaginationData {
    totalRows: number;
    totalPages: number;
}

interface IAFRoleDetails {
    generalInformation: IAFRoleGeneralInformation;
    accessAndPermission: IAFAccessPermissionsRowData[];
    pagination: IAFPaginationData;
}

interface IAPIResponse {
    statusCode: number | null;
    data: {
        data: {
            filterGroup: {
                userGlobalFilters: any; // Adjust as needed based on actual structure
                hierarchy: any; // Adjust as needed based on actual structure
            };
            roleDetail: IAFRoleDetails; // Correctly reference IAFRoleDetails
        };
    };
    message: string | null;
}
export interface IUserActiveGlobalFilter {
    financialCycle: string;
    userGlobalFilters: IUserGlobalFilter;
}

export interface IForum {
    forumId: string;
    forumName: string;
    forumLevelName: string;
    forumPeriodName: string;
    isAccessible: boolean;
    isFavorite: boolean;
    hierarchy: string | null;
    region: string | null;
    cluster: string | null;
    market: string | null;
    site: string | null;
}

export interface IForumDetail {
    basicInformation: {
        forumId: string;
        forumName: string;
        function: string;
        subFunction: string;
        geographyLevel: string;
        period: string;
        status: string;
    };
    geographicalInformation: {
        region: Array<IApplicationDetailsGeography>;
        cluster: Array<IApplicationDetailsGeography>;
        market: Array<IApplicationDetailsGeography>;
        sites: Array<IApplicationDetailsGeography>;
        allRegion: boolean,
        allCluster:boolean,
        allMarket:boolean,
        allSite:bolean
    };
}

export interface IForumPeriod {
    forumPeriodId: number;
    forumPeriodName: string;
}

export interface DowntimeData {
    header: string;
    description: string;
}

export interface toolNames {
    toolName: string;
}
export interface priorityNames {
    priorityName: string;
}
export interface ToDoFilters {
    dueDate: string;
}
export interface dueDates {
    toolNames: toolNames[];
    priorityNames: priorityName[];
    dueDates: dueDate[];
}

export interface ITriggerFrequency {
    frequencyType: string;
    every: number;
    on: string | null;
    starting: string | null;
    selectedValues: string | null;
    calendarType: string;
}
export interface IDelegationUser {
    userEmail: string;
    firstName: string;
    lastName: string;
    roleType: string | null;
}

export interface IDelegationRole {
    roleId: string;
    role: string;
    roleLevelName: string;
    subFunctionName: string;
    department: string;
    region: string;
}

export type DelegationRole = {
    roleId: number | string;
    role: string;
    roleLevelName: string;
    region?: string;
    department?: string;
    subFunctionName?: string;
    functionID?: number;
    subFunctionID?: number;
    regionID: number;
    clusterID: number;
    marketID: number;
    siteID: number;
};

export interface ApiResponseHelper<T> {
    statusCode: number;
    data: T;
    message: string | null;
}

export interface IWidgetOption {
    optionName: string;
    optionKey: string;
    optionType: string;
    defaultValue?: any;
    availableValues?: any[];
    children?: IWidgetOption[];
}

export interface IWidgetConfiguration {
    widgetId: number;
    widgetName: string;
    tabIdId: number;
    widgetTypeId: number;
    widgetSizeId: number;
    widgetVisualTypeId: number;
    kpiId: number;
    kpiName: string;
    createdBy: string;
    createdOn: string;
    updatedBy: string;
    updatedOn: string;
    isActive: boolean;
    widgetOptions: IWidgetOption[];
}

type IDimensionData = {
    dimensionName: string;
    dimensionId: number;
};

/** Search-document API payload (`api/Knowledgehub/search-document`). */
export interface IKnowledgeHubSearchDocument {
    id?: number;
    fileId?: string;
    documentID?: number;
    fileName?: string;
    assetId?: number;
    siteId?: number | string;
    siteName?: string;
    createdBy?: string;
    createdon?: string;
    createdDate?: string;
    departmentId?: number;
    documentCategoryId?: number;
    documentCategoryName?: string;
    regionId?: number;
    subFunctionId?: number;
    subFunctionName?: string;
    fileLink?: string;
    fileSummary?: string;
    fileAlias?: string;
    isFavorite?: boolean;
    uploadStatus?: string;
    docType?: string;
    docTitle?: string;
}

export interface IFavoriteFile {
    fileId: string;
    fileName: string;
    assetId?: number;
    siteId?: string;
    siteName?: string;
    active?: boolean;
    createdBy?: string;
    fileSummary?: string;
    fileLink?: string;
    documentCategoryId?: number;
    documentCategoryName?: string;
    departmentId?: number;
    regionId?: number;
    subFunctionId?: number;
    subFunctionName?: string;
    favoritedOn?: string;
    createdDate?: string;
    docTitle?: string;
    docType?: string;
}

export interface FavoriteFilesResult {
    favoriteFileItems: IFavoriteFile[];
    favoriteCount: number;
}
type IKpi = {
    kpiId: number;
    kpiName: string;
};

export interface IMostViewedFile {
    fileName: string;
    documentID: number;
    totalViews?: number;
    TotalViews?: number;
    docTitle?: string;
    assetId?: number;
    siteId?: number | string;
    siteName?: string;
    subFunctionId?: number;
    subFunctionName?: string;
    documentCategoryName?: string;
    createdDate?: string;
    fileLink?: string;
    fileSummary?: string;
    docType?: string;
}

type IUserAttributes = {
    userAttributeId: number;
    userAttributeName: string;
    userAttribute: string;
};

//New Tool Persona response types

export interface IToolPermission {
    permissionId: number;
    permissionName: string;
    toolPermissionDescription: string | null;
    isActiveToolPermission: boolean;
}

// Module inside a persona
export interface IToolModule {
    moduleId: number | null;
    module: string;
    permission: IToolPermission[];
}
// Persona (can be null / default)
export interface IToolPersona {
    personaId: number | null;
    personaName: string | null;
    personaDescription: string | null;
    modules: IToolModule[];
}
// Application / Tool
export interface IToolDetails {
    toolId: number;
    toolName: string;
    toolType: 'Application' | '' | string;
}
export interface ToolPersona {
    personaId: number;
    personaName: string;
    description: string;
    adGroup?: string | null;
    dataAccess?: string | null;
    adGroupId?: number | null;
    dataAccessId?: number | null;
    roleIds?: number[];
    rolesCount?: number;
    isActive?: boolean;
    isNew?: boolean;
}
type IForumMapping = {
    reportCombinationTempKey: number;
    forumId: number;
    forumPersonaTypeId: number;
    personaTempKey: number;
};
type IPersonaRoleMapping = {
    reportCombinationTempKey: number;
    personaTempKey: number;
    roleIds: string;
};
export interface IReportCombinationDetails {
    tempKey: number;
    reportLevelId: number;
    reportPeriodId: number;
    reportGeographyId: string;
    isAllReportGeography: boolean;
}
export interface IReportCombinationSetup {
    forumMappings: IForumMapping[];
    personaRoleMappings: IPersonaRoleMapping[];
}
// Top-level
export interface IToolPersonaPermission {
    toolDetails: IToolDetails;
    personas: IToolPersona[];
    totalCount: number;
}

//chatbot

export interface ISuggestedPrompt {
    prompt: string;
}

export interface PermissionDetail {
    roleId: number;
    roleName: string;
    roleType: string;
    toolId: number;
    toolName: string;
    toolType: string;
    personaId: number;
    personaName: string;
    moduleId: number;
    module: string;
    subModuleId: number;
    subModule: string;
    permissionId: number;
    permissionName: string;
    adGroupId: number | null;
    adGroupName: string | null;
    adGroupStatus: string;
    userPermissionStatus: string;
    isCheckedPermission: boolean;
}

export interface StatusChip {
    roleId: number;
    userEmail: string;
    status: string;
    statusCount: number;
}

export interface Pagination {
    totalRows: number;
    totalPages: number;
}

export interface RolePermissionsState {
    tools: ToolPermission[];
    pagination: Pagination | null;
    loading: boolean;
    error: string | null;
}

export interface UserRoleDetails {
    roleId: number;
    roleName?: string;
    roleType?: string;
    geographyId?: number;
    geographyName?: string;
    functionId?: number;
    functionName?: string;
    subFunctionId?: number;
    subFunctionName?: string;
    departmentId?: number;
    departmentName?: string;
    subDepartmentId?: number;
    subDepartmentName?: string;
    responsibilityLevelId?: number;
    responsibilityLevelName?: string;
    statusCounts: IUserRoleStatus[];
    assignedByUser: string;
    delegationStartDate: string;
    delegationEndDate: string;
}

export interface UserRoleStatus {
    roleId: number;
    status?: string;
    statusCount: number;
}

export interface UserRoleAttribute {
    roleId: number;
    userEmail?: string;
    attributeId: number;
    attributeName?: string;
    attributeValueIds?: string;
    attributeValueNames?: string;
}

export interface UserRolesWithDetailsResponse {
    roles: UserRoleDetails[];
    statusCounts: UserRoleStatus[];
    attributes: UserRoleAttribute[];
}
export interface ToolPermission {
    toolId: number;
    toolName: string;
    permissionDetails: PermissionDetail[];
    statusChips: StatusChip[];
}

//New Role request
export type RoleResponse = {
    roleId: number;
    role: string;
    responsibilityLevel: string;
    roleLevel: string | null;
    function: string;
    subFunction: string;
    department: string;
    subDepartment: string;
    isActive: boolean;
    roleGeoName: string | null;
};

export type RoleAttributeOptions = {
    attributeId: number;
    attributeName: string;
    valueId: string;
    valueName: string;
};

export interface IRequestApproval{
    requestId: number,
      forumId: number,
      forumName: string,
      requestedPersona: string,
      requestedVia: string | null,
      reasonForRequest: string,
      requestType: string,
      requesterEmail: string,
      requesterFullName: string,
      roleName: string,
      requestedOn: Date,
      status: string,
      decisionComment: string| null,
}


export interface IRoleRequestResponse {
  roleId: number;
  roleType: string;
  userEmail: string;
  departmentId: number;
  subDepartmentId: number;
  functionId: number;
  subFunctionId: number;
  roleMappingId: number | null;
  responsibilityLevelId: number | null;
  roleLocation: number;
  roleAttributes: any[];
  createdBy: string | null;
  updatedBy: string | null;
  updatedByWWID: string | null;
  createdByWWID: string | null;
};
export type RoleForumDetails = {
    forumId: number;
    forumName: string;
    geographyTypeName: string;
    forumPeriodName: string;
    geographyName: string;
    forumType: string;
    roleName: string;
    forumOwner: string;
    decisionOwner: string;
    viewer: string;
    status: string;
    decisionOwnerList: {id: number, userEmail: string}[];
    forumOwnerList: {id: number, userEmail: string}[];
    viewerList: {id: number, userEmail: string}[];
    isCommentOpen?: boolean
    approversComment: string;
}
