import { Comments, IDimensionMappingDetails, IIssueTagsData, IUserData } from './response';

type IRoleRequest = {
    pageSize: number;
    pageNumber: number;
    sortColumnName: string;
    sortDirection: string;
    searchKeyword: string;
    searchTerm: string;
    filters?: IColumnFilterData[];
    gridFilters: IColumnFilterData[];
    userEmail?: string;
    forumLevel?: string;
    forumPeriod?: string;
};
export interface IUserRequest {
    pageSize: number;
    pageNumber: number;
    sortColumnName: string;
    sortDirection: 'asc' | 'desc' | 'unsort';
    searchKeyword?: string;
    searchTerm?: string;
    filters?: IColumnFilterData[];
    gridFilters?: IColumnFilterData[];
    roleId?: number | null;
}
export interface IUser {
    userId: number | string;
    name: string;
    email: string;
    function: string;
    primaryRole: string;
    primaryRoleId: string | number;
    region: string | null;
    market: string | null;
    site: string;
    isActive: boolean;
    totalRows?: number;
    totalPages?: number;
}

export interface IUserResponse {
    user: IUserData[];
    pagination: {
        totalRows: number;
        totalPages: number;
    };
}

type IApplicationRequest = {
    pageSize: number;
    pageNumber: number;
    sortColumnName: string;
    sortDirection: string;
    searchKeyword: string;
    searchTerm: string;
    gridFilters: IColumnFilterData[];
    roleId?: string;
};

export interface IGridFilter {
    ColumnName: string;
    ColumnValue: string;
}

export interface IGetForumDetailsRequest {
    pageSize: number;
    pageNumber: number;
    sortColumnName: string | null;
    sortDirection: string | null;
    searchKeyword: string | null;
    searchTerm: string | null;
    gridFilters: IGridFilter[];
}

export interface IAddForumRequest {
    forumId: number;
    forumName: string;
    forumLevelId: number | string;
    forumPeriodId: number | string;
    functionId: string;
    regionId: string;
    clusterId: string;
    marketId: string;
    siteId: string;
    forumLevel?: string;
    forumPeriod?: string;
    FunctionName?: string;
    region?: string;
    cluster?: string;
    market?: string;
    site?: string;

    forumOwner1: string;
    forumOwner2: string;
    collaborators: string;
    status: number;
}
export interface IAddForumsRequest {
    forumId?: number | null;
    forumName: string | null;

    functionId: number;
    subFunctionId: number;

    geographyLevelId: number;
    periodId: number | null;

    regionIds: string | null;
    clusterIds: string | null;
    marketIds: string | null;
    siteIds: string | null;
    status: boolean;

    isRegionAll: boolean |null;
    isClusterAll: boolean  |null;
    isMarketAll: boolean  |null;
    isSiteAll: boolean |null;

    forumOwners: ForumOwnerRequest[];
}

export type ForumOwnerRequest = {
    userEmail: string,
    roleId: number,
    geographyId: number
}

export type HierarchyDataRequest = {
    geographyTypeId: number,
      geographyId: number,
      roleId: string,
      forumOwnerCount: {
        inherited: string,
        selected: string
      }
}

export interface IUpdateTagRequest {
    tagName: string;
    tagCategoryId: number;
    tagId: number;
}

type IIssueRequest = {
    pageSize: number;
    pageNumber: number;
    sortColumnName: string;
    sortDirection: string;
    searchKeyword: string;
    searchTerm: string;
    statusFilter: string;
    gridFilters: IColumnFilterData[];
};

type IDeleteRole = {
    roleId: number;
};

type IDeleteUser = {
    primaryRoleId: int | number;
    userEmail: string;
};

type IDeleteForum = {
    forumId: number;
};

export type IForumActionRequest = {
  forumId: number;
  transferToForumId?: number | null;
  isTransferRequired?: boolean | null;
};

export type IRolePermissionsMappingPayload = {
    toolId: number;
    roleId: number;
    toolFeatureId: number;
    toolFeatureName: string;
    isActive: boolean;
};

type IUpdateRoleStatus = {
    roleId: number;
    makeActive: boolean;
};

type IssueImpactDetailsRequest = {
    issueId: number;
    impactId: number;
    impactOKR: string | null;
    complicationDescription: string | null;
    createdBy: string | null;
    impactKPI: IssueImpactKpiRequest[] | null;
    activityLogJSON?: IssueActivity;
};

type IssueActionCommentRequest = {
    issueId: number | null;
    actionId: number | null;
    commentText: string | null;
    createdBy?: string | null;
    activityLogJSON?: IssueActivity;
    activityLogJSON?: IssueActivity;
};
type IssueRecommendationCommentRequest = {
    issueId: number | null;
    resolutionId: number | null;
    commentText: string | null;
    createdBy?: string | null;
    activityLogJSON?: IssueActivity;
};

type IssueRootCauseRequest = {
    rootCauseId: number | null;
    issueId: number;
    why1: string | null;
    why2: string | null;
    why3: string | null;
    why4: string | null;
    why5: string | null;
    rootCauseDescription: string | null;
};

type IssueImpactKpiRequest = {
    issueId: number | null;
    deltaDirection: string | null;
    kpiId: number | null;
    kpiName: string | null;
    kpiValue: number | null;
};
type IssueGeneralDeatilsRequest = {
    issueTitle: string | undefined;
    functionId: number | undefined;
    subFunctionId: number | undefined;
    categoryId: number | undefined;
    priorityId: number | undefined;
    //forumId: number|undefined,
    tags: IIssueTagsData[];
    collaborators: any[];
};

type ITagsRequest = {
    isActive: number;
    tagCategoryId: number | null;
    tagName: string | null;
    sortColumn: string | null;
    sortOrder: string | null;
};

type IFilterGroupItem = {
    filterId: number;
    isFilterApplied: boolean;
};

export interface IRoleBasedItem {
    roleId: number;
    isFilterApplied: boolean;
}

export interface FilterGroupRequest {
    filterGroupJson: IFilterGroupItem[];
    roleBasedJSON: IRoleBasedItem[]; // <- make it an array
}

type IssueSituationRequest = {
    issueId: number;
    situationText: string;
    attachments?: [
        {
            resolutionId: number;
            issueId: number;
            sectionId: number;
            section: string;
            saveSectionId: number;
            file: string;
            fileName: string;
            attachmentId: number;
        },
    ];
    activityLogJSON?: IssueActivity;
};

type assignUserRequest = {
    issueId: number | null;
    sectionId: nulber | null;
    collabTypeId: string | null;
    users: IUser[] | null;
};
type IUser = {
    email: string;
    isActive: boolean;
    userName: string;
    fullName: string;
    firstName: string;
    lastName: string;
};

//Notification and alerts for global filter
type IDimensionValueRequest = {
    dimensionId: number;
    gridColumnSearchJson: IDimensionMappingDetails[];
    userGlobalFilters: HierarchyDataModel | null;
    PageNumber?: number;
    PageSize?: number;
};

//Notification and alerts rule

interface INotiRuleJSONReq {
    ruleTypeId: number | null;
    functionId: number | null;
    kpiId: number | null;
}

interface INotiConditionJSONRequest {
    notificationType: string;
    whenCondition: string | null;
    kpiId: number | null;
    comparisionOperator: string | null;
    kpiValue: number | null;
    priorityId: number | null;
    priorityName: string | null;
    escalationId: number | null;
    allTrue: number;
}

interface INotiDimensionJSONRequest {
    dimensionId: number;
    value: string;
}

interface INotiRuleAddUpdateRequest {
    ruleId: number | null;
    ruleJSON: INotiRuleJSONReq;
    isUpdateRule: boolean;
    conditionsJSON: INotiConditionJSONRequest[];
    dimensionsJSON: INotiDimensionJSONRequest[];
    issueCategoryId: string | null;
    tagId: string | null;
    triggerFrequencyJson: ITriggerFrequencyPayload | null;
}

interface IEditMappingDetails {
    issueId: number | null;
    dimensionMappingJson: IDimensionMappingDetails[];
    activityLogJSON?: IssueActivity[];
}

interface IMyFavouriteItem {
    objectId: number;
    objectName: string;
    objectType: string;
    description: string;
    objectOwner: string;
    isFavourite: boolean;
    documentationLink: string | null;
}

interface MyFavouritesState {
    data: {
        favouriteItems: IMyFavouriteItem[];
        favouriteCount: {
            totalAppFavourites: number;
            totalReportFavourites: number;
        };
    };
}

interface IRecentlyOpenedItem {
    objectId: number;
    objectName: string;
    objectType: string;
    description: string;
    objectOwner: string;
    isFavourite: boolean;
    documentationURL?: string;
    applicationURL?: string;
}

interface AppReport {
    objectId: string;
    objectName: string;
    objectOwner?: string;
    description?: string;
    isFavourite: boolean;
    documentationURL?: string;
    applicationURL?: string;
    objectType: string;
}

interface IAddRecentlyOpenedItem {
    objectId: number;
    objectType: string;
}

export interface IFavouriteItem {
    objectId: number;
    objectName: string;
    objectType: string;
    isFavourite: boolean;
}

interface IAppSReportItem {
    objectId: number;
    objectType?: string | null;
    objectName?: string | null;
    isFavourite: boolean;
    pageNumber: number;
    pageSize: number;
    pagination: IPagination | any;
    documentationURL?: string;
    applicationURL?: string;
}

interface IPagination {
    totalRows: number;
    totalPages: number;
}
interface IAppSReportFavourite {
    objectId: number;
    objectType?: string | null;
    isFavourite: boolean;
}
interface FilterGroup {
    filterId: string;
    filterGroupName: string;
    financialCycle: { year: string; quarter: string };
    geographicalFilter: {
        regions: Record<string, number>[];
        clusters: Record<string, number>[];
        markets: Record<string, number>[];
        sites: string[];
        siteCodes: string[];
        salesOrganizations: Record<string, number>[];
    };
    ProductHierarchy: {
        segments: Record<string, number>[];
        categories: Record<string, number>[];
        brands: Record<string, number>[];
        subBrands: Record<string, number>[];
        SKUs: Record<string, number>[];
    };
    CustomerHierarchy: {
        channels: Record<string, number>[];
        customers: Record<string, number>[];
    };
}

interface IAppSReportFavourite {
    objectId: number;
    objectType?: string | null;
    isFavourite: boolean;
}

//inteface for add Resolution
interface AddResolutionOutcomeDetails {
    resolutionId: number;
    outcomeId: number;
    issueId: number;
    resolutionOutcome: string;
    resolutionType: string;
    createdBy: string;
}

interface AddResolutionAttachment {
    resolutionId: number;
    issueId: number;
    sectionId: number;
    section: string;
    saveSectionId: number;
    file: string;
    fileName: string;
    attachmentId: number;
}

interface AddResolutionCommentData {
    issueId: number;
    resolutionId: number;
    commentId: number;
    comment: string;
    createdBy: string;
}

interface AddResolutionRequest {
    issueId: number;
    resolutionId: number;
    resolutionTitle: string;
    resolutionDescription: string;
    isFinalResolution: boolean;
    createdBy: string;
    recommendations: AddResolutionOutcomeDetails[];
    attachments: AddResolutionAttachment[];
    resolutionComments: Comments[];
    activityLogJSON?: IssueActivity;
}

type AddIssueActionCommentRequest = {
    issueId: number | null;
    actionId: number | null;
    commentText: string | null;
    createdBy?: string | null;
    commentId: number | null;
    taggedUser: string | null;
    activityLogJSON?: IssueActivity;
};

interface IssueActivity {
    activityLog: string;
    comment: string | null;
}

export interface Site {
    siteId: string;
    site: string;
    manufacturingSite: string;
}

export interface SiteCode {
    siteId: string;
    siteCodes: string;
}

export interface SiteType {
    siteType: string;
}

export interface Market {
    marketId: string;
    market: string;
    // sites: Site[];
}

export interface Cluster {
    clusterId: string;
    cluster: string;
    //markets: Market[];
}

export interface Region {
    regionId: string;
    region: string;
    // clusters: Cluster[];
}

export interface Geography {
    regions: Region[];
    clusters: Cluster[];
    markets: Market[];
    sites: Site[];
    siteCode: SiteCode[];
    siteType: SiteType[];
}

export interface sku {
    skuId: string;
    sku: string;
}

export interface SubBrand {
    subBrandId: string;
    subBrand: string;
    //sku: string[];
}

export interface Brand {
    brandId: string;
    brand: string;
    //subBrands: SubBrand[];
}

export interface Category {
    categoryId: string;
    category: string;
    //brands: Brand[];
}

export interface Segment {
    segmentId: string;
    segment: string;
    //categories: Category[];
}

export interface Category {
    categoryId: string;
    category: string;
    //brands: Brand[];
}

export interface subSegements {
    subSegmentId: string;
    subSegment: string;
}

export interface needStates {
    needStateId: string;
    state: string;
}

export interface subCategorys {
    subCategoryId: string;
    subCategory: string;
}

export interface masterCodes {
    masterCodeId: string;
    masterCode: string;
}

export interface rootCodes {
    rootCodeId: string;
    rootCode: string;
}

export interface variants {
    variantId: string;
    variant: string;
}

export interface Product {
    segments: Segment[];
    categories: Category[];
    brands: Brand[];
    subBrands: SubBrand[];
    skUs: sku[];
    subSegements: subSegements[];
    needStates: needStates[];
    subCategorys: subCategorys[];
    masterCodes: masterCodes[];
    rootCodes: rootCodes[];
    variants: variants[];
}

export interface Channel {
    channelId: string;
    channel: string;
    //customers: Option[];
}

export interface Customer {
    customerId: string;
    customer: string;
}

export interface customerChannel {
    customers: Customer[];
    channels: Channel[];
    shipCustomers?: { shippedToId: string; shipToCustName: string }[];
    soldCustomers?: { soldToId: string; soldToCustName: string }[];
}

export interface Hierarchy {
    geographies: Geography;
    products: Product;
    customers: customerChannel;
}
export interface FilterGroupDataModel {
    filterId: number;
    filterName: string;
    financialCycle?: string | null;
    financialCycleId: string;
    hierarchy: Hierarchy;
    userGlobalFilters: Hierarchy;
    isFilterApplied: boolean;
}

export interface IToolFunctionLocationRoleFiltersPayload {
    toolIds: string;
    roleIds: string;
    geographyIds: string;
    functionIds: string;
    toolTypeIds: string;
}

interface IGridFilters {
    columnName: string;
    columnValue: string;
    id: number;
}

export interface IForumPayload {
    pageSize?: number;
    pageNumber?: number;
    sortColumnName?: string;
    sortDirection?: string;
    searchKeyword?: string;
    searchTerm?: string;
    gridFilters?: IGridFilters[];
    userEmail?: string;
    forumLevel?: string;
    forumPeriod?: string;
}

export interface ITriggerFrequencyPayload {
    frequencyType: string;
    every: number;
    on: string | null;
    starting: string | null;
    selectedValues: string[] | null;
    calendarType: string;
    fiscalValue: string | null;
}

export interface ToolFeature {
    toolId: number;
    toolFeatureId: number;
    toolFeatureName: string;
    toolFeatureDescription: string;
    toolModuleName: string;
    accessTypeName: string;
    isActivePermission: boolean;
}

// AD group with features
export interface AdGroup {
    adGroup: string;
    adGroupId: string;
    toolFeature: ToolFeature[];
}

// Tool (under a role)
export interface IamTool {
    toolId: number;
    adGroups: AdGroup[];
}

// Role within iamRoles
export interface IamRole {
    roleId: number;
    role: string;
    roleLevelName: string;
    subFunctionName: string;
    functionID: number;
    subFunctionID: number;
    department: string;
    region: string;
    regionID: number;
    clusterID: number;
    marketID: number;
    siteID: number;
    roleType: string;
    tools: IamTool[];
}

// Full request payload
export interface DelegationRequestPayload {
    delegatedToUser?: string;
    delegatedByUser?: string;
    loggedInUser?: string;
    startDate: Date | string;
    endDate: Date | string;
    requestComment: string;
    roleIds?: string;
    toolIds: string;
    iamRoles: IamRole[];
    delegationId: number;
}

export interface IRoleAttributes {
    attributeId:number,
    attributeName:string,
    attributeValue?:string,
    options?:any
}


//save new role request
export interface INewRoleRequest{
    location:number|null,
    function:number|null,
    subFunction:number|null,
    department:number|null,
    subDepartment:number|null,
    responsibilityLevel:number|null,
    roleId:number,
    roleType:'primary' | 'secondary',
    requestComment:string,
    accessRequestId:null,
    roleAttributes:IROleAttributeRequest[]
}

export interface IROleAttributeRequest{
    attributeId:number, 
    attributeValue:string
}