export interface RawActionStatus {
    issueId?: string;
    exceptionId?: string;
    actionStatus: string;
    owner: string;
    logDate: string;
    dueDate: string;
}

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

export interface RawIssueItem extends IGetExceptionsFlyoutIssuesDetails {
    actionStatus: RawActionStatus[];
}

export interface RawRiskItem extends IGetExceptionsFlyoutRiskDetails {
    actionStatus: RawActionStatus[];
}
export interface RawExceptionItem
    extends IGetExceptionsFlyoutIssuesDetails,
        IGetExceptionsFlyoutRiskDetails {} // export interface RawExceptionItem {
//     issueId: number;
//     title: string;
//     probability: number;
//     category: string;
//     priority: string;
//     decisionStatus: string;
//     issueDescription: string;
//     actionStatus: RawActionStatus[];
// }
