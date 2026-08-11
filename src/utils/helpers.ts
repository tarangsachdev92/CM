 
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
    COLLAB_TYPE,
    CURRENT_USER_EMAIL,
    CURRENT_USER_FULL_NAME,
    CURRENT_USER_NAME,
    DATE_TIMEZOME_Z,
    FORMAT_COMMENT_DATE,
    DEFAULT_BREADCRUMB_LABEL,
    FORMAT_DUE_DATE,
    FORMAT_LAST_REFRESHED_DATE,
    FORMAT_LAST_REFRESHED_DATE_TODAY,
} from './constants';

import type { OptionType } from '../types/common';
import type { IPrimaryRoleData, IUser, ToolPersona } from '../types/response';
import { PermissionMatrixPersona } from '../components/molecules/permission-matrix/PermissionMatrixTable';

export const oneMiliSecond = parseInt('1000');

dayjs.extend(utc);

// Helper method to convert api data from drop down into label values
export const convertOptions = (
    array: any[],
    label: string,
    value: string,
    additionalKeyValue?: { key: string | number; value: string | number },
    extraLabel?: string,
) => {
    const optionArray: any[] = [];
    if (!!array && array.length > 0) {
        array.forEach(arrayOption => {
            if (label !== '') {
                const option: any = {
                    label: extraLabel
                        ? `${arrayOption[label]} - ${arrayOption[extraLabel]}`
                        : `${arrayOption[label]}`,
                    value: String(arrayOption[value]),
                };
                if (additionalKeyValue?.key && additionalKeyValue?.value) {
                    option[additionalKeyValue.key] = arrayOption[additionalKeyValue.value];
                }
                optionArray.push(option);
            } else {
                optionArray.push({
                    label: arrayOption,
                    value: String(arrayOption),
                });
            }
        });
    }
    return optionArray;
};

// Helper Method for tuncateStringHelper
export const turncateStringHelper = (str: string, n: number) => {
    return str?.length > n ? str?.substring(0, n) + '...' : str;
};

// Helper Method for converting object to query string
export const objectToQueryString = (params: any) => {
    const queryString = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null) // Filter out undefined and null values
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

    return queryString ? `?${queryString}` : ''; // Return an empty string if there are no valid query parameters
};

// Helper method to get current year
export const getCurrentYear = () => {
    const today = new Date();
    return Math.floor(today.getFullYear());
};

// Helper method to get current month
export const getCurrentMonth = () => {
    const today = new Date();
    return Math.floor(today.getMonth()) + 1;
};

// Helper method to check if 2 passed objects are equal or not.
export function checkDeepEqualityOfObjects<T>(x: T, y: T): boolean {
    const objectKeys = Object.keys;
    const typeOfX = typeof x;
    const typeOfY = typeof y;
    return x && y && typeOfX === 'object' && typeOfX === typeOfY
        ? objectKeys(x).length === objectKeys(y).length &&
              objectKeys(x).every((key: string) =>
                  checkDeepEqualityOfObjects(x[key as keyof T], y[key as keyof T]),
              )
        : x === y;
}

// Helper Method for getting correct dataIndex
export const getDataKey = (year: number) => {
    const CURRENT_FULL_YEAR = getCurrentYear();
    if (year === CURRENT_FULL_YEAR) {
        return 'year_Current';
    } else if (year === CURRENT_FULL_YEAR - 1) {
        return 'year_previous';
    } else {
        return 'year_Next';
    }
};

// Helper method to extract % symbol and return as a number
export const removePercentageSymbol = (value: string) => {
    const replacedValue = value.replace('%', '');
    return replacedValue;
};

// Helper method to get current logged in username from session.
export const getCurrentUserName = (): string | null => {
    return sessionStorage.getItem(CURRENT_USER_NAME);
};

// Helper method to get current logged in username from session.
export const getCurrentUserFullName = (): string | null => {
    return sessionStorage.getItem(CURRENT_USER_FULL_NAME);
};

// Helper method to get current logged in useremail from session.
export const getCurrentUserEmail = (): string | null => {
    return sessionStorage.getItem(CURRENT_USER_EMAIL);
};

// Helper method to get breadcrum as per pathname.

export const generateBreadcrumbArray = (
    pathname: string,
    selectedToDoId?: string,
    taskAFId?: string, // kept for compatibility if you still need it elsewhere
) => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: { label: string; link: string }[] = [
        { label: DEFAULT_BREADCRUMB_LABEL, link: '/' },
    ];

    //Inject special breadcrumbs for Digital worker
    if (pathname === '/digital-worker/troubleshooting-assistant') {
        //link is changed to avoid blank page as there no component linked with /digital-worker
        breadcrumbs.push({
            label: 'Digital Worker',
            link: '/digital-worker/troubleshooting-assistant',
        });
        breadcrumbs.push({
            label: 'Troubleshooting Assistant',
            link: '/digital-worker/troubleshooting-assistant',
        });
    }

    if (pathname.startsWith('/digital-worker/truck-inspection')) {
        breadcrumbs.push({
            label: 'Digital Worker',
            link: '/digital-worker/truck-inspection',
        });
        breadcrumbs.push({
            label: 'Truck Inspection',
            link: '/digital-worker/truck-inspection',
        });
    }

     if (pathname === '/user-profile-settings') {
        //link is changed to avoid blank page as there no component linked with /digital-worker
        breadcrumbs.push({
            label: 'Settings',
            link: '/digital-worker/troubleshooting-assistant',
        });       
    }

    // Inject special breadcrumbs ONCE when a To-Do context is active
    if (selectedToDoId) {
        // If you intended to pass the selected To-Do id to To-Do page:
        breadcrumbs.push({ label: 'To-Do', link: `/todo?selectedId=${taskAFId}` });
        // Use the correct route spelling consistently
        breadcrumbs.push({ label: 'Advance Forecasting', link: '/advanced-forecasting' });
    }

    for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        if (!segment) continue;

        // When To-Do OR Digital worker context is present, skip the AF path segment to avoid duplication
        if (
            (selectedToDoId && segment.toLowerCase() === 'advanced-forecasting') ||
            pathname === '/digital-worker/troubleshooting-assistant' ||
            pathname.startsWith('/digital-worker/truck-inspection') ||
            pathname === '/user-profile-settings'
        ) {
            continue;
        }

        let label = '';
        if (segment.toLowerCase() === 'admin-hub') {
            label = 'Admin Hub';
        } else {
            label = segment
                .split('-')
                .map(word => {
                    const w = word.toLowerCase();
                    if (w === 'todo') return "To-Do's";
                    if (w === 'ro') return 'R&O';
                    return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
        }

        // Case when Application/Report segment inside digital-tools-library links back
        // to the library with the matching category filter pre-applied via query param.
        if (
            i > 0 &&
            pathSegments[i - 1] === 'digital-tools-library' &&
            (segment === 'Application' || segment === 'Report')
        ) {
            const categoryParam = segment === 'Application' ? 'App' : 'Report';
            breadcrumbs.push({
                label: segment,
                link: `/digital-tools-library?category=${categoryParam}`,
            });
            continue;
        }

        if (i > 0 && /^\d+$/.test(segment) && pathSegments[i + 1]) {
            const name = decodeURIComponent(pathSegments[i + 1] ?? '');
            breadcrumbs.push({
                label: name,
                link: `/${pathSegments.slice(0, i).join('/')}`,
            });
            break;
        }

        const linkPath = `/${pathSegments.slice(0, i + 1).join('/')}`;
        // Avoid pushing duplicate labels (in case computed label matches earlier injected ones)
        if (!breadcrumbs.some(bc => bc.label === label && bc.link === linkPath)) {
            breadcrumbs.push({
                label,
                link: linkPath,
            });
        }
    }

    return breadcrumbs;
};

export function formatLastRefreshedDate(utcDateString: string): string {
    const inputDate = dayjs.utc(utcDateString);
    return inputDate.local().format(FORMAT_LAST_REFRESHED_DATE);
}

// helper method to get formatted last refreshed date, using "Today" format when the input is in the current UTC day.
export function formatLastRefreshedDateWithToday(utcDateString: string): string {
    const inputDate = dayjs.utc(utcDateString);
    const now = dayjs().utc().startOf('day');

    if (inputDate.isSame(now, 'day')) {
        return inputDate.local().format(FORMAT_LAST_REFRESHED_DATE_TODAY);
    } else {
        return inputDate.local().format(FORMAT_LAST_REFRESHED_DATE);
    }
}

//helper method to get formatted due Date

export function formatDueDate(utcDateString: string): string {
    const inputDate = dayjs.utc(utcDateString);
    return inputDate.local().format(FORMAT_DUE_DATE);
}

export function formatCommentDate(utcDateString: string): string {
    const inputDate = dayjs.utc(utcDateString);
    return inputDate.local().format(FORMAT_COMMENT_DATE);
}

export function formatDateAndTimeParts(utcDateString: string): {
    datePart: string;
    timePart: string;
} {
    const inputDate = dayjs.utc(utcDateString).local();
    return {
        datePart: inputDate.format('DD MMM YYYY'),
        timePart: inputDate.format('hh:mm A'),
    };
}

// Helper method to get initials from username
export function getUserNameInitials(userName?: string): string | null {
    const currentUsername = userName ? userName : getCurrentUserFullName();
    return (
        currentUsername
            ?.split(' ')
            .map(word => word[0]?.toUpperCase() || '')
            .join('') ?? ''
    );
}

export function transformResponseToLocationOptions(
    primaryRoleData: IPrimaryRoleData,
): OptionType[] {
    const locationMap = new Map<string, OptionType>();

    if (primaryRoleData.region && primaryRoleData.regionId) {
        if (!locationMap.has(primaryRoleData.regionId.toString())) {
            locationMap.set(primaryRoleData.regionId.toString(), {
                label: primaryRoleData.region,
                value: primaryRoleData.regionId.toString(),
                subOption: [],
            });
        }
        const regionNode = locationMap.get(primaryRoleData.regionId.toString())!;

        if (primaryRoleData.cluster && primaryRoleData.clusterId) {
            let clusterNode = regionNode.subOption?.find(
                c => c.value === primaryRoleData.clusterId.toString(),
            );
            if (!clusterNode) {
                clusterNode = {
                    label: primaryRoleData.cluster,
                    value: primaryRoleData.clusterId.toString(),
                    subOption: [],
                };
                regionNode.subOption?.push(clusterNode);
            }

            if (primaryRoleData.market && primaryRoleData.marketId) {
                let marketNode = clusterNode.subOption?.find(
                    m => m.value === primaryRoleData.marketId.toString(),
                );
                if (!marketNode) {
                    marketNode = {
                        label: primaryRoleData.market,
                        value: primaryRoleData.marketId.toString(),
                        subOption: [],
                    };
                    clusterNode.subOption?.push(marketNode);
                }

                if (primaryRoleData.site && primaryRoleData.siteId) {
                    let siteNode = marketNode.subOption?.find(
                        s => s.value === primaryRoleData.siteId.toString(),
                    );
                    if (!siteNode) {
                        siteNode = {
                            label: primaryRoleData.site,
                            value: primaryRoleData.siteId.toString(),
                        };
                        marketNode.subOption?.push(siteNode);
                    }
                }
            }
        }
    }

    return Array.from(locationMap.values());
}

// Function to get the last available child (or parent if no children exist)
export const getLastAvailableChild = (
    locations: OptionType[],
    typeId = 1,
): { label: string; value: string; typeId: number } => {
    let current: OptionType | undefined = locations[0];
    const labelParts: string[] = [];
    while (current) {
        labelParts.push(current.label ?? 'Unknown');
        if (current.subOption?.length) {
            current = current.subOption[current.subOption.length - 1];
            typeId++;
        } else {
            break;
        }
    }
    return {
        label: labelParts.join(' - '),
        value: current?.value ?? '0',
        typeId,
    };
};

export const removeElementByKey = (jsonArray: any[], key: string, value: any) => {
    return jsonArray.filter(item => item[key] !== value);
};

export const trimTextAndAppendTrail = (text: string, defaultTrimIndex = 50) => {
    return text.length >= 50 ? `${text.slice(0, defaultTrimIndex)}...` : text;
};

export function extractOnlyRoleName(inputRoleName: string, levelName?: string): string {
    if (!inputRoleName) return '';
    let cleaned = inputRoleName.trim();
    // Remove level name if present anywhere in the string (case-insensitive, whole word match)
    if (levelName) {
        const levelRegex = new RegExp(`\\b${levelName}\\b`, 'gi');
        cleaned = cleaned.replace(levelRegex, '');
    }
    // Remove everything after the first hyphen
    const hyphenIndex = cleaned.indexOf('-');
    if (hyphenIndex !== -1) {
        cleaned = cleaned.slice(0, hyphenIndex);
    }
    // Final cleanup: remove extra spaces
    return cleaned.trim().replace(/\s+/g, ' ');
}

export const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const isIssueOwnerOrDecisionOwner = (collabType: string) => {
    return collabType == COLLAB_TYPE.DECISION_OWNER || collabType == COLLAB_TYPE.ISSUE_OWNER;
};

export const isActionAllowedForUser = (collabType: string, users: IUser[] | null) => {
    if (collabType == COLLAB_TYPE.DECISION_OWNER || collabType == COLLAB_TYPE.ISSUE_OWNER) {
        return true;
    }
    if (collabType == COLLAB_TYPE.ADVISOR) {
        const currentUser = sessionStorage.getItem(CURRENT_USER_EMAIL);
        if (users && users.length > 0) {
            return users.findIndex(user => user.email == currentUser) > -1;
        }
        return false;
    }
    return false;
};

export const formatNotificationDate = (utcString?: string) => {
    const date = new Date(utcString + DATE_TIMEZOME_Z);
    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    };

    let formattedTime = date.toLocaleString('en-GB', timeOptions);
    formattedTime = formattedTime.replace(/\bam\b/i, 'AM').replace(/\bpm\b/i, 'PM');

    const dateOptions: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };

    const formattedDate = date.toLocaleString('en-GB', dateOptions);
    return `${formattedTime}, ${formattedDate}`;
};

// Helper method to get initials from username
export function getInitialsForUserName(userName: string | null) {
    return (
        userName
            ?.split(' ')
            .map(word => word[0]?.toUpperCase() || '')
            .join('') ?? ''
    );
}

// Helper method to get Screen Resolution and Browser Performance
export const getClientDiagnostics = () => {
    return {
        resolution: `${window.innerWidth}x${window.innerHeight}`,
        performanceTime: performance.now().toFixed(2), // milliseconds since page load
    };
};

export function getLastMonth(monthName: string, year: number): string {
    // Parse month name to number (0 = Jan, 11 = Dec)
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();

    // Create a date for the previous month
    const date = new Date(year, monthIndex - 1, 1);

    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '-');
}

//  Removes all leading zeros from a string.

export const removeLeadingZeros = (str: string) => {
    return str.replace(/^0+/, '');
};

export const stripHtmlWithRegex = (html: any) => {
    if (typeof html !== 'string') {
        logWarning('Invalid input: Expected a string.');
        return '';
    }

    try {
        const decoded = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        return decoded.replace(/<[^>]+>/g, '');
    } catch (error) {
        logError('Error while stripping HTML:', error);
        return '';
    }
};

export const formatMonthYear = (month?: number | null, year?: number | null): string => {
    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    if (
        typeof month !== 'number' ||
        typeof year !== 'number' ||
        isNaN(month) ||
        isNaN(year) ||
        month < 1 ||
        month > 12
    ) {
        return 'Invalid Date';
    }

    return `${monthNames[month - 1]} ${year}`;
};
export const toDelegationData = (api: any) => ({
    delegationId: api.delegationId,
    delegator: api.delegatorName,
    delegatee: api.delegateeName,
    role: api.roleName,
    startDate: api.startDate,
    endDate: api.endDate,
    status: api.status,
    createdBy: api.createdBy,
    createdOn: api.createdOn,
});

export const toLocalMidnight = (input: any): Date | null => {
    if (!input) return null;
    const d = input instanceof Date ? new Date(input) : new Date(String(input));
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
};

const isDev = () => {
    const env = (process.env.NODE_ENV || process.env.APP_ENV || '').toLowerCase();
    return env === 'development' || env === 'local';
};

export const logError = (...args: any[]) => {
    if (!isDev()) return;
    console.error('[ERROR]', ...args);
};

export const logWarning = (...args: any[]) => {
    if (!isDev()) return;
    console.warn('[WARNING]', ...args);
};

export const getFormattedRefreshDate = (rolesData: any) => {
    const firstRole = rolesData?.roles?.[0];

    const date = firstRole?.refreshDate ? new Date(firstRole.refreshDate) : new Date();

    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    });
};

export const formatRefreshText = (date: Date | null) => {
    if (!date) return '';

    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    if (isToday) return `Last refreshed: Today ${time}`;
    if (isYesterday) return `Last refreshed: Yesterday ${time}`;

    return `Last refreshed: ${date.toLocaleDateString()} ${time}`;
};

export const getIdOrZero = (value?: string | number) => {
    return value === 'ALL' || value === undefined || value === null ? 0 : Number(value);
};

export type KnowledgeHubDocTitleSource = {
    docTitle?: string;
    fileName?: string;
    documentCategoryName?: string;
    id?: number;
    documentID?: number;
    fileId?: string | number;
};

/** Card title for Knowledge Hub flyout: documentCategoryName_fileName_documentId. */
export const getKnowledgeHubDocTitle = (file: KnowledgeHubDocTitleSource): string => {
    const category = file?.documentCategoryName?.trim() ?? '';
    const fileName = file?.fileName?.trim() ?? '';
    const docId = file?.id ?? file?.documentID ?? file?.fileId;

    if (category && fileName && docId != null && docId !== '') {
        return `${category}_${fileName}_${docId}`;
    }

    const existing = file?.docTitle?.trim();
    if (existing) return existing;

    if (fileName && docId != null && docId !== '') {
        return `${fileName}_${docId}`;
    }

    if (fileName) return fileName;

    return docId != null ? String(docId) : '';
};

/** Normalize created date field from search vs favorites/most-viewed APIs. */
export const getKnowledgeHubCreatedDate = (file: {
    createdDate?: string;
    createdon?: string;
}): string | undefined => file?.createdDate ?? file?.createdon;

export const formatKnowledgeHubDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

/** Card subtitle for Knowledge Hub flyout: subFunctionName | created date (DD/MM/YYYY). */
export const getKnowledgeHubDocSubtitle = (file: {
    subFunctionName?: string;
    createdDate?: string;
    createdon?: string;
}): string | undefined => {
    const subFunction = file?.subFunctionName?.trim() ?? '';
    const date = formatKnowledgeHubDate(getKnowledgeHubCreatedDate(file));

    if (subFunction && date) return `${subFunction} | ${date}`;
    if (subFunction) return subFunction;
    if (date) return date;
    return undefined;
};

export type DocumentIconName =
    | 'file-pdf'
    | 'file-png'
    | 'file-jpeg'
    | 'file-csv'
    | 'file-xlsx'
    | 'file-mp4'
    | 'file-07';

const getFileExtension = (value: string): string => {
    const path = value.split(/[?#]/)[0] ?? '';
    const dot = path.lastIndexOf('.');
    if (dot < 0) return '';
    return path.slice(dot + 1).toLowerCase();
};

const getIconFromMimeType = (mimeType: string): DocumentIconName | null => {
    if (mimeType === 'application/pdf') return 'file-pdf';
    if (mimeType === 'image/png') return 'file-png';
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'file-jpeg';
    if (mimeType === 'text/csv') return 'file-csv';
    if (
        mimeType === 'application/vnd.ms-excel' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
        return 'file-xlsx';
    }
    if (
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
        return 'file-07';
    }
    if (mimeType === 'video/mp4') return 'file-mp4';
    return null;
};

const getIconFromExtension = (extension: string): DocumentIconName | null => {
    switch (extension) {
        case 'doc':
        case 'docx':
            return 'file-07';
        case 'pdf':
            return 'file-pdf';
        case 'png':
            return 'file-png';
        case 'jpg':
        case 'jpeg':
            return 'file-jpeg';
        case 'csv':
            return 'file-csv';
        case 'xls':
        case 'xlsx':
            return 'file-xlsx';
        case 'mp4':
            return 'file-mp4';
        default:
            return null;
    }
};

const getIconFromFriendlyType = (value: string): DocumentIconName | null => {
    if (
        value === 'word' ||
        value === 'msword' ||
        value.includes('microsoft word') ||
        value.includes('word document') ||
        value.includes('wordprocessingml') ||
        value.includes('msword')
    ) {
        return 'file-07';
    }
    if (
        value === 'excel' ||
        value === 'spreadsheet' ||
        value.includes('microsoft excel') ||
        value.includes('spreadsheetml') ||
        value.includes('ms-excel')
    ) {
        return 'file-xlsx';
    }
    if (value === 'pdf') return 'file-pdf';
    if (value === 'png') return 'file-png';
    if (value === 'jpg' || value === 'jpeg') return 'file-jpeg';
    if (value === 'csv') return 'file-csv';
    if (value === 'mp4') return 'file-mp4';
    return null;
};

/** Map API docType, file name, and/or MIME type to a Konnect Icon name. */
export const getDocumentIcon = (docType?: string, mimeType?: string): DocumentIconName => {
    const mime = String(mimeType ?? '')
        .trim()
        .toLowerCase();
    const fromMime = mime ? getIconFromMimeType(mime) : null;
    if (fromMime) return fromMime;

    const t = String(docType ?? '')
        .trim()
        .toLowerCase();
    if (!t) return 'file-pdf';

    const extension = getFileExtension(t);
    const fromExtension = extension ? getIconFromExtension(extension) : null;
    if (fromExtension) return fromExtension;

    const fromBareExtension = getIconFromExtension(t);
    if (fromBareExtension) return fromBareExtension;

    const fromFriendly = getIconFromFriendlyType(t);
    if (fromFriendly) return fromFriendly;

    if (t.includes('docx') || t.endsWith('.doc')) return 'file-07';
    if (t.endsWith('.pdf')) return 'file-pdf';
    if (t.endsWith('.png')) return 'file-png';
    if (t.endsWith('.jpg') || t.endsWith('.jpeg')) return 'file-jpeg';
    if (t.endsWith('.csv')) return 'file-csv';
    if (t.endsWith('.xlsx') || t.endsWith('.xls')) return 'file-xlsx';
    if (t.endsWith('.mp4')) return 'file-mp4';

    return 'file-pdf';
};

/** File icon for Knowledge Hub flyout cards (prefers API docType over display fileName). */
export const getKnowledgeHubFileIcon = (file: {
    docType?: string;
    fileName?: string;
}): DocumentIconName => getDocumentIcon(file.docType ?? file.fileName);

export const toCommaSeparated = (list: any[] = []) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.map(item => item.value).join(',');
};

export const normalizePersonaName = (name?: string) => (name ?? '').trim().toLowerCase();
export const isViewerPersona = (persona?: ToolPersona) => normalizePersonaName(persona?.personaName) === 'viewer';
export const isLeadershipPersona = (persona?: ToolPersona | PermissionMatrixPersona) => normalizePersonaName(persona?.personaName) === 'leadership';