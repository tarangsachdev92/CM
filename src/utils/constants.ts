export enum StatusCodes {
    NotFound = 404,
    Success = 200,
    Accepted = 202,
    BadRequest = 400,
}

export const DEFAULT_PAGE_SIZE = 10;
export const ROLE_SELECTION_PAGE_NUMBER = 1;
export const ROLE_SELECTION_PAGE_SIZE = 50;
export const SCROLL_THRESHOLD = 30;
export const ROLE_SELECTION_DEFAULT_PAGE_SIZE = 20;

export const RESOLUTION_SECTION_ID = 10;

export const DEFAULT_PAGES = [10, 20, 30, 40, 50];

export const CURRENT_USER_NAME = '>currentUserName';
export const CURRENT_USER_FULL_NAME = 'currentUserFullName';
export const ACCCESS_TOKEN = 'accessToken';
export const ACCCESS_TOKEN_GRAPH = 'accessTokenGraph';
export const ACCCESS_TOKEN_POWERBI = 'accessTokenPowerBI';
export const CURRENT_USER_EMAIL = 'currentUserEmail';

export const NAVBAR_ITEMS = [
    {
        id: 1,
        label: 'Home',
        link: '/home',
        value: 'nav.home',
    },
    {
        id: 2,
        label: 'My Dashboard',
        link: '/my-dashboard',
        value: 'nav.myDashboard',
    },
    { id: 3, label: 'To-Do', link: '/todo', value: 'nav.todo' },
    { id: 4, label: 'Issues', link: '/issues', value: 'nav.issues' },
    { id: 5, label: 'R&O', link: '/ro', value: 'nav.rno' },
    // { id: 6, label: EditLayoutIcon, link: '/editlayout',value:'' },
];

export const DEFAULT_BREADCRUMB_LABEL = 'CC';
export const GEOGRAPHY = 'Geography';

export const FORMAT_LAST_REFRESHED_DATE_TODAY = '[Today] hh:mm A';
export const FORMAT_LAST_REFRESHED_DATE = 'DD MMM YYYY h:mm A';
export const FORMAT_DUE_DATE = 'DD MMM YYYY';
export const DUE_DATE_FORMAT = 'DD MMM YY';
export const FORMAT_COMMENT_DATE = 'hh:mm A, DD/MM/YYYY';
export const FORMAT_DATE_HEADER = 'D MMM YYYY';
export const FORMAT_MONTH = 'MMM';
export const FORMAT_MONTH_YEAR = 'MMM-YYYY';

export const DUPLICATE_ROLE_ERROR_MESSAGE =
    'Please select different parameters or role name to set up new role.';
export const DUPLICATE_APPLICATION_ERROR_MESSAGE =
    'This application already exists. Please modify the details to continue adding.';

export const ROLE_TYPE = {
    PRIMARY: 'Primary',
    SECONDARY: 'Secondary',
    DELEGATED: 'Delegated',
    GUEST: 'Guest',
};

export enum CountryCode {
    CL = 'CL',
    BR = 'BR',
}
export const GEO = {
    REGION: 'region',
    CLUSTER: 'cluster',
    MARKET: 'market',
    SITE: 'site',
} as const;

export const COLLAB_TYPE = {
    ISSUE_OWNER: 'Issue Owner',
    DECISION_OWNER: 'Decision Owner',
    ADVISOR: 'Advisor',
    VIEW_ONLY: 'View Only',
    REPORTER: 'Reporter',
};

export const PINNED_COLUMNS = [
    { key: 'issueTitle', sticky: 'left' },
    { key: 'product', sticky: '' },
    { key: 'forum', sticky: '' },
    { key: 'issueOwner', sticky: '' },
    { key: 'decisionStatus', sticky: '' },
    { key: 'actionStatus', sticky: '' },
    { key: 'dueDate', sticky: '' },
    { key: 'priority', sticky: 'right' },
];

export const ALL_COLUMNS = [
    { key: 'issueTitle' },
    { key: 'product' },
    { key: 'forum' },
    { key: 'issueOwner' },
    { key: 'decisionStatus' },
    { key: 'actionStatus' },
    { key: 'dueDate' },
    { key: 'priority' },
];

export enum ISSUE_DETAILS {
    AssignUser = 'AssignUser',
    ShowAssignUser = 'ShowAssignUser',
    EditComplications = 'EditComplications',
    EditKpi = 'EditKpi',
    ViewKpi = 'ViewKpi',
    EditImpactedOkr = 'EditImpactedOkr',
    ViewImpactedOkr = 'ViewImpactedOkr',
    EditFiveWhy = 'EditFiveWhy',
    ViewFiveWhy = 'ViewFiveWhy',
    ViewRootCauseDesc = 'ViewRootCauseDesc',
    ViewComplications = 'ViewComplications',
    EditRootCauseDesc = 'EditRootCauseDesc',
    EditSituationDesc = 'EditSituation',
    ViewSituationDesc = 'ViewSituation',
    ViewResolutionDetails = 'ViewResolution',
    EditResolutionDetails = 'EditResolution',
    AddResolutionRecomendation = 'AddResolutionRecomendation',
    IssueSituation = 'issueSituation',
    IssueResolutionRecommendations = 'issueResolutionRecommendations',

    RootCauseDescription = 'rootCauseDescription',
    TheFiveWhys = 'theFiveWhys',
    ViewOnly = '2',
    Advisor = '4',
}

export enum RESOLUTION_DETAILS {
    FinalResolutionView = 'FinalResolutionView',
    ResolutionRecomendationView = 'ResolutionRecomendationView',
    PositiveOutcome = 'Positive',
    NegativeOutcome = 'Negative',
}

export enum KPI_DELTA_DIRECTIONS {
    IncreasePositive = 'increase positive',
    DecreasePositive = 'decrease positive',
    IncreaseNegative = 'increase negative',
    DecreaseNegative = 'decrease negative',
}

export enum PAGE_NAME_ID {
    PERMISSION_MANAGEMENT = 1,
    ROLE_MANAGEMENT = 2,
    APPLICATION_MANAGEMENT = 3,
    ISSUE_MANAGEMENT = 4,
}

export enum DropDownStatusFilter {
    OpenIssues = 'Open Issues',
    OverdueIssues = 'Overdue Issues',
    ResolvedOrNotRelevant = 'Resolved / Not Relevant',
}

export const Notification_And_Alert_RuleTypes = {
    KPI: 1,
    ISSUE: 2,
    RISK: 3,
    OPPORTUNITY: 4,
} as const;

export const MS_TEAMS_URL = 'msteams://teams.microsoft.com/l/chat/0/0?topicName=';

export enum RESOLUTION_OUTCOME_TYPE {
    PositiveOutcome = 'Positive',
    NegativeOutcome = 'Negative',
}

export enum NotificationRuleTypes {
    KPIs = `KPI's`,
    Issue = 'Issue',
    Risk = 'Risk',
    Opportunities = 'Opportunities',
}

export enum NotificationType {
    Warn = 'Warning',
    Notify = 'Notification',
    Alert = 'Alert',
}

export enum NotiRuleWhenCondition {
    PositiveImpactOn = 'Positive Impact On',
    NegativeImapctOn = 'Negative Impact On',
    PriorityIs = 'Priority is',
    SharedTo = 'Shared To',
}

export const IMPACTED_OKR_SECTION_NAME = 'impactedOKR';
export const IMPACTED_KPI_SECTION_NAME = 'impactedKPIs';
export const IMPACTED_COMPLICATIONS_SECTION_NAME = 'issueComplication';
export const CALANDER_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]';

export const TOAST_MESSAGES = {
    USER_ASSIGNMENT_SAVE_SUCCESS: 'User assignment saved successfully',
};

export enum TimeCategory {
    'Today' = 'Today',
    'Yesterday' = 'Yesterday',
    'Past' = 'Past',
}

export enum NOTIFICATION_TRIGGER_TYPE {
    ROLE_ASSIGNED = 'Role Assigned',
    ROLE_UNAVAILABLE = 'Role Unavailable',
    ROLE_REVOKED = 'Role Revoked',
    ISSUE_COMMENT = 'Issue Comment',
    KPI = 'KPI',
    Application_ACCESS_REMOVED = 'Application Access Removed',
    Application_ACCESS_ADDED = 'Application Access Added',
    APPLICATION_UPDATE = 'Application Updated',
    APPLICATION_PERMISSION_ADD = 'Application Permission Added',
    APPLICATION_PERMISSION_REMOVE = 'Application Permission Removed',
    APPLICATION_UNAVALIABLE = 'Application Unavailable',
    EXCEPTION_ASSIGNED = 'Exception Assigned',
    ROLE_DETACTIVATE = 'Role Deactivated',
    TOOL_PERMISSION_REMOVED = 'Tool Permission Removed',

    REPORT_ACCESS_ADDED = 'Report Access Added',
    REPORT_ACCESS_REMOVED = 'Report Access Removed',
    REPORT_UPDATE = 'Report Updated',
    REPORT_PERMISSION_ADDED = 'Report Permission Added',
    REPORT_PERMISSION_REMOVED = 'Report Permission Removed',
    REPORT_UNAVALIABLE = 'Report Unavailable',

    APPLICATION_PERMISSION_UPDATE = 'Application Permission Updated',
    REPORT_PERMISSION_UPDATE = 'Report Permission Updated',
    ISSUE_OVERDUE = 'Issue Action Overdue',
    TODO_OVERDUE = 'Task Due or Overdue',
    TODO_SECTION = 'Exception Section Assigned',
    TODO_ACTION = 'Exception Action Assigned',
    ISSUE_DECISION = 'Decision Status updated',

    ISSUE_RULE = 'Issue',
    ACTION_STATUS_UPDATED = 'Action Status updated',
    ALL_ACTIONS_COMPLETED = 'All Actions Completed',

    FORUM_REQUEST = "New Forum Request",
    FORUM_REQUEST_UPDATE = "Forum Request Approve/Reject",

    MENTION_NOTIFICATION = 'Resolution Comment Tagged',
}

export enum GeographyTypeLabel {
    Region = 1,
    Cluster = 2,
    Market = 3,
    Site = 4,
}

export enum ISSUE_DETAILS_SECTIONS_NAMES {
    SITUATION = 'Situation',
    FIVE_WHY = "The Five Why's",
    ROOT_CAUSE_DESC = 'Root Cause Description',
    IMPACTED_OKR = 'Impacted OKR',
    IMAPCTED_KPIS = "Impacted KPI's",
    COMPLICATION = 'Complication',
    RESOLUTION_RECOMMENDATION = 'Resolution Recommendations',
}

export const IAM_KENVUE_URL = 'https://iam.kenvue.com/';

export const enum ToolType {
    Application = 'Application',
    Report = 'Report',
    Analytics = 'Analytics',
}

export const TOOL_TYPE_OPTIONS = [
    { label: ToolType.Application, value: '1' },
    { label: ToolType.Report, value: '2' },
    // { label: EToolType.Analytics, value: '3' },
];

export const DATE_TIMEZOME_Z = 'z';

export const TOOL = 'tool';

export const TRAINING_MATERIAL_LINK =
    'https://kenvue.sharepoint.com/:p:/r/teams/DTOChangeManagementandDigitalAdoption-kv/_layouts/15/Doc.aspx?sourcedoc=%7B987CC9B4-E12E-46B6-826E-26447F841769%7D&file=OCC%20Training%20Manual%20R1%20July%202025.pptx&wdOrigin=TEAMS-MAGLEV.p2p_ns.rwc&action=edit&mobileredirect=true';

export const KARE_INCIDENT_LINK =
    'https://kare.kenvue.com/';

export enum TrendIndicator {
    IncreasePositive = 'increase positive',
    DecreasePositive = 'decrease positive',
    IncreaseNegative = 'increase negative',
    DecreaseNegative = 'decrease negative',
}

export const primaryGreenColor = '#00b097';
export const primaryGreen50Color = '#E6F7F5';
export const primaryGreen100Color = '#B0E7DF';
export const secondaryYellowColor = '#FFB000';
export const secondaryYellow50Color = '#FFF7E6';
export const secondaryYellow100Color = '#FFE7B0';
export const secondaryPurpleColor = '#D3BDF2';
export const secondaryPurpleIntermediateColor = '#E2D3F6';
export const secondaryPurple100Color = '#F1EBFB';
export const primaryOrangeColor = '#FF782B';
export const primaryOrange50Color = '#FFF2EA';
export const primaryOrange100Color = '#FFD5BD';
export const graphBlueColor = '#3774B1';
export const graphBlue4Color = '#EBF1F7';
export const secondaryBlue100Color = '#c1d4e7';
export const neutralsB80Color = '#949494';
export const neutralsB300Color = '#575757';

export enum To_DO_SOURCE {
    CommandCenter = 'Command Center',
    AdvancedForecasting = 'Advance Forecasting',
}

export const criticalFlagValue = 'Critical';
export const highFlagValue = 'High';
export const mediumFlagValue = 'Medium';
export const lowFlagValue = 'Low';

export const overdueType = 'Overdue';
export const dueType = 'Due';
export const completedType = 'Completed';
export const openType = 'Open';

export enum NOTI_FREQ_CAT {
    Shift = 'Shift',
    Day = 'Day',
    Week = 'Week',
    Month = 'Month',
    Year = 'Year',
}

export const NOTI_FREQ_DAYS = [
    { index: 1, dayLetter: 'S', day: 'Sunday' },
    { index: 2, dayLetter: 'M', day: 'Monday' },
    { index: 3, dayLetter: 'T', day: 'Tuesday' },
    { index: 4, dayLetter: 'W', day: 'Wednesday' },
    { index: 5, dayLetter: 'T', day: 'Thursday' },
    { index: 6, dayLetter: 'F', day: 'Friday' },
    { index: 7, dayLetter: 'S', day: 'Saturday' },
];

export const DELEGATION_STATUS = {
    ACTIVE: 'Active',
    EXPIRED: 'Expired',
};

export enum NOTIFICATION_ACTION_TYPE {
    MarkRead,
    ClearAllRead,
}

export const IPM_TOOL_NAMES = {
    INTEGRATED_IPM: 'integrated performance management dashboard',
    EBS_IPM: 'ebs ipm dashboard',
} as const;

export type IPMToolName = (typeof IPM_TOOL_NAMES)[keyof typeof IPM_TOOL_NAMES];

export const IPM_ISSUE_SOURCE_TYPE_MAP: Record<IPMToolName, number> = {
    [IPM_TOOL_NAMES.INTEGRATED_IPM]: 1,
    [IPM_TOOL_NAMES.EBS_IPM]: 2,
};

export enum PermissionStatus {
    Approved = 'Approved',
    Pending = 'Pending',
    AutoRejected = 'AutoRejected',
}

// Display order
export const CHIP_ORDER: PermissionStatus[] = [
    PermissionStatus.Approved,
    PermissionStatus.Pending,
    PermissionStatus.AutoRejected,
];

export enum ModuleTypeForIssueAndExceptionManagement {
    IssueManagement = 'IssueManagement',
    ExceptionManagement = 'ExceptionManagement',
}
