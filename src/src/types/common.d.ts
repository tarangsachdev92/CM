import React from 'react';
import { IToolData } from '../../../types/response';
import { FilterType } from '../applied-filters/AppliedFilters';
import { INotiConditionDetail, IToolData } from './response';

export type LabelType = {
    children: React.ReactNode;
    type:
        | 'h1'
        | 'h2'
        | 'h3'
        | 'h4'
        | 'h5'
        | 'body1'
        | 'body1-n'
        | 'body2'
        | 'body2-b'
        | 'body3'
        | 'body4';
};

type RoleSelectionPopupType = {
    isOpen: boolean;
    isEditModeOn?: boolean;
    selectedRowId?: string;
    isPrimaryRoleAdded?: boolean;
    onCancelClick: () => void;
    isAddingSecondaryRole?: boolean;
};

type ApplicationFilterPopupType = {
    isOpen: boolean;
    onCancelClick: () => void;
    setFilters: (filters: Record<string, FilterOption[]>) => void;
    filters: Record<string, { label: string; value: number }[]>;
};

type OptionType = {
    label: string;
    value: string;
    subOption?: OptionType[];
    desc?: string;
    category?: string;
    persona?: string;
};

type IssueActionPropsType = {
    HeaderIcon?: React.ReactNode;
    Title: string;
    Subtitle: string;
    BodyContent: React.ReactNode;
    ShowActionButtons?: boolean;
    ActionButtons?: React.ReactNode;
    IsCardEditing: boolean;
    HandleIsCardEditing: () => void;
    IsSaveDisabled: boolean;
    HandleSaveChanges?: () => void;
    ShowDefaultBody?: boolean;
    DefaultBodyContent?: React.ReactNode;
    BodyWithNoPadding?: boolean;
    FooterContent?: React.ReactNode;
    CommentContent?: React.ReactNode;
    IsCommentSectionVisible?: boolean;
    EditContent?: React.ReactNode;
    IsEditSectionVisible?: boolean;
};

type TreeDropDownOptionType = {
    label: string;
    value: string;
    typeId?: string;
    type?: string;
    subOption?: OptionType[];
    disabled?: boolean;
    hideCheckbox?: boolean;
};

type Props = {
    toolDetails: any;
    geographicalRegion: any;
    ownerNames: any;
    applicationData: IToolData[];
    pageSize: number;
    pageNumber: number;
    totalRows: number;
    loading: boolean;
    handleSorting: (columnName: string, order: string) => void;
    handlePageChange: (page: number) => void;
    handlePageSizeChange: (size: number) => void;
    searchText: string;
    defaultFilters: any;
    filtersData: any;
    existingFilters: Array<FilterType>;
    setNewFilters: (
        filterName: string,
        filterTitle: string,
        filterArray: Array<{ label: string; value: number }>,
        existingData: Array<FilterType>,
        defaultExistingFilters?: Array<FilterType['selectedFilters']>,
    ) => void;
    renderButtons: (buttons: React.ReactNode) => void;
    setAppNamesString: (value: string) => void;
    setIsAppDetailsUpdated: (isSelected: boolean) => void;
    onSelectedAppsChange: (selectedApps: { label: string; value: number }[]) => void;   
    openDialog?: ({type: string, appName: string, toolId: number, status: string}) => void 
};

type IssueCardActionPropsType = {
    HeaderIcon?: React.ReactNode;
    Title: string;
    Subtitle?: string;
    BodyContent?: React.ReactNode;
    ShowActionButtons?: boolean;
    ActionButtons?: React.ReactNode;
    IsCardEditing?: boolean;
    HandleIsCardEditing?: (state: boolean) => void;
    IsSaveDisabled?: boolean;
    HandleSaveChanges?: () => void;
    HandleClose: () => void;
    ShowDefaultBody?: boolean;
    DefaultBodyContent?: React.ReactNode;
    BodyWithNoPadding?: boolean;
    CustomButtonOnEdit?: boolean;
    CustomEditButtonElement?: React.ReactNode;
};

type IssueCardPropsType = {
    HeaderIcon?: React.ReactNode;
    Title: string;
    Subtitle?: string;
    BodyContent?: React.ReactNode;
    ShowActionButtons?: boolean;
    ActionButtons?: React.ReactNode;
    IsCardEditing?: boolean;
    HandleIsCardEditing?: (state: boolean) => void;
    IsSaveDisabled?: boolean;
    HandleSaveChanges?: () => void;
    ShowDefaultBody?: boolean;
    DefaultBodyContent?: React.ReactNode;
    BodyWithNoPadding?: boolean;
    CustomButtonOnEdit?: boolean;
    CustomEditButtonElement?: React.ReactNode;
};

type LocationHierarchy = {
    regionId?: string;
    clusterId?: string;
    marketId?: string;
    siteId?: string;
};

type IssueEditorModalType = {
    HeaderIcon?: React.ReactNode;
    Title: string;
    Subtitle?: string;
    IsOpen: boolean;
    HandleClose: (state: boolean) => void;
    HandleSaveChanges?: (editorHtml: string) => void;
    ExHtmlDesc: string | null;
    UpdateParentHtml: (content: string) => void;
};

type IRuleConditionCardPropsType = {
    RuleType: string;
    ConditionType: string;
    ConditionIcon: React.ReactNode;
    data: INotiConditionDetail[];
    handleDataChange: (condition: INotiConditionDetail) => void;
    handleDeleteCondition: (id: string) => void;
    handleTriggerIfRadioChange: (type: string, value: string) => void;
};

type IRoleNotificationJSONType = {
    roleName: string;
    type: string;
    datetime: string;
    approvalStatus: string;
};

type IForumRequestNotificationJSONType = {
    forumName: string;
    level: string;
    period : string;
    geography: string;
    status: string;
    datetime: string;
    fullName: string;
    triggeredBy:string;
};

type IIssueCommentNotificationJSONType = {
    CreatedBy: string;
    TaggedUser: string;
    CommentText: string;
    Datetime: string;
    FirstName: string;
    Comment: string;
};

type KPINotificationJSONType = {
    KPI_name: string;
    Conditionvalue: string;
    datetime: string;
    CurrentDatetime: string;
    month: number;
    year: number;
    current_value: string;
    ValueLastMonth: string;
    delta: string;
    target?: string;
    comparisionOperator?: string;
};

type SelectOption = {
    label: string;
    value: string;
    originalLabel?: string;
};

type IApplicationNotificationJSONType = {
    appName: string;
    appId: string;
    roleName: string;
    roleType: string;
    datetime: string;
};

interface IIssueRuleKPI {
    [key: string]: string;
}

type IIssueRuleActionStatus = {
    issueId: string;
    actionTitle: string;
    actionOwnerName: string;
    assignedTo: string;
    actionDescription: string;
    status: string;
    dueDate: string;
    logDate: string;
    updatedOn?: string;
    statusName?: string;
    actionStatus?: string;
};

export interface IImpactedKpi {
    kpiName: string;
    trendIndicator: TrendIndicator;
    value: number;
    unitOfMeasure: string;
}

type IExceptionAssignedNotificationJSONType = {
    datetime: string;
    region: string;
    product: string;
    brand: string;
    kpiImpact: string;
    exceptionTitle: string;
    exceptionId: string;
    priority?: string;
    impactedKpis: IImpactedKpi[];
    actionStatus: IIssueRuleActionStatus[];
    status: string;
    collaboratorType: string;
    fullName: string;
    decisionStatusName: string;
    sectionTitle?: string;
    DecisionStatusName?: string;
    exceptionType: string;
    exceptionDescription: string;
};

type IIssueRuleNotificationJsonType = {
    datetime: string;
    region: string;
    status: number;
    product: string;
    brand: string;
    issues: any;
    kpiimpact: string;
    region: string;
    decisionStatusName?: string | '';
    description?: string | '';
};

interface Task {
    title: string;
    source: string;
    dueDate: string;
    priority: string;
}

interface NotificationData {
    type: 'Due' | 'Overdue';
    dueInDays: number;
    datetime: string;
    fullName: string;
    tasks: Task[];
}

interface NotificationToDoData {
    type: string;
    dueDate: number;
    exceptionId: number;
    exceptionTitle: string;
    sectionName: string;
    datetime: string;
    todoTitle: string;
    actionTitle: string;
    fullName: string;
    priority: string;
    tasks: Task[];
    exceptionType: string;
}

interface NotificationCardProps {
    json: string;
    id: number;
    notificationType: string;
    status: boolean;
    isGenericNotification?: boolean;
}

interface INotificationCardProps {
    json: string;
    id: number;
    notificationType: string;
    isGenericNotification?: boolean;
    status: boolean;
    notificationtext?: NotificationText[];

    createdBy?: string;
    createdOn?: string;
}

type NotificationText = {
    type: string;
    dueInDays: number;
    datetime: string;
    fullName: string;
    tasks: Task[];
};

type Task = {
    title: string;
    source: string;
    dueDate: string;
    priority: string;
};

type IReportNotificationJSONType = {
    reportName: string;
    reportId: string;
    roleName: string;
    roleType: string;
    datetime: string;
};

interface ICustomOptionType extends OptionType {
    toolType?: string;
}

type IReportFilterJSONType = {
    tableName: string;
    columnName: string;
    filterType: string;
    slicerName: string;
    dateFormat: string;
    propertyKey: string;
};

export interface IOverdueActionJSON {
    actionTitle: string;
    assignedTo: string;
    dueDate: string;
}

export interface IIssueActionOverdueJSON {
    datetime: string;
    issueId: number;
    fullName: string;
    overdueActions: IOverdueActionJSON[];
}

type Language = {
    languageCode: string;
    languageName: string;
};

export type DashboardItem = {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    widgetType: string;
};

type TimeZoneOffset = {
    userTimeOffset: number | null;
};

export interface PerformanceComparison {
  type: 'Previous' | 'Target' | string; 
  percentage: number | null;
}

export interface PerformanceStatus {
    label: 'MTD' | 'QTD' | 'YTD';
    value: number;
    type: 'Success' | 'Alert' | 'Warning';
    target?: number;
    delta?: number;
    comparison?: PerformanceComparison | null;
}

// Header component props
export interface TableHeaderProps {
    title: string;
    subtitle?: string | null;
    linkButton?: {
        visible: boolean;
        label: string;
        href: string;
    };
    showInsightButton?: boolean;
    showWidgetFilter?: boolean;
    appliedFilters?: string[];
    performanceStatus?: PerformanceStatus[];
    columnDrillDown?: null;
    rowHierarchy?: null;
    onDeleteWidget?: () => void;
    onDuplicateWidget?: () => void;
    onEditWidget?: () => void;
    activeTabId?: number;
    widgetTabId?: string;
    enableColumnDrilldown?: boolean;
    columnDrilldownOptions?: {
        label: string;
        value: string;
    }[];

    enableDrilldownButtons?: boolean;

    enableRowHierarchy?: boolean;
    rowHierarchyOptions?: {
        label: string;
        value: string;
    }[];

    enableWidgetFilters?: boolean;
    widgetFilterOptions?: {
        label: string;
        value: string;
    }[];
}

type IMentionNotificationJSONType = {
  status: string;
  triggeredBy: string;
  taggedByFirstName: string;
  taggedByLastName: string;
  taggedOn: string;
  resolutionId: number;
  commentText: string;
  taggedUsers: {
    email: string;
    userName: string;
    fullName: string;
  }[];
}

