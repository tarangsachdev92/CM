import  { Suspense } from 'react';
import { Flex, Skeleton } from 'antd';
import { AnimatedLoaders, Button, Tab } from 'konnect-react-components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { Label } from '../../components/atoms';
import PowerBIReport from '../../components/organisms/reports/PowerBIReport';
import { getApplicationDetailsById, checkUserAccessForReport } from '../../services/application';
import { IReportFilterJSONType } from '../../types/common';
import styles from './PerformanceManagementScreen.module.scss';
import {
    ToolType,
    ROLE_TYPE,
    IPM_TOOL_NAMES,
    IPM_ISSUE_SOURCE_TYPE_MAP,
} from '../../utils/constants';
import { resolveApplicationMfe } from '../../utils/applicationMfeRegistry';
import { RootState } from '../../store';
import IssuesScreen from '../../screens/issue-management/IssueManagementScreen';
import { ReportAccessDeniedState } from '../../assets/images/images';

enum TabNamesEnum {
    Overview = 'Overview',
    IssueAction = 'Issues & Actions',
    History = 'History',
}

type ToolNavigationState = {
    description?: string;
};

const PerformanceManagementScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [toolDetails, setToolDetails] = useState<any>();
    const params = useParams<{ toolType: string; toolId: string; toolName: string; tabName?: string }>();
    const appsAndReportsCards = useSelector((state: RootState) => state.appReportsCardsData?.data);
    const userLanguage = useSelector((state: RootState) => state.userLanguage.data);

    const [selectedTab, setSelectedTab] = useState<string>(TabNamesEnum.Overview);
    const [filters, setFilters] = useState<IReportFilterJSONType[]>([]);

    const [isLoadingToolDetails, setIsLoadingToolDetails] = useState(true);
    const [isCheckingAccess, setIsCheckingAccess] = useState(false);
    const [hasToolAccess, setHasToolAccess] = useState<boolean | null>(null);

    const roleType = useSelector((state: RootState) => state.primaryRole.data?.roleType);

    const allowedIssueTools = new Set<string>(Object.values(IPM_TOOL_NAMES));

    const toolNameFromUrl = useMemo(() => {
        const rawName = params.toolName ?? '';
        if (!rawName) {
            return '';
        }
        try {
            return decodeURIComponent(rawName).trim();
        } catch {
            return rawName.trim();
        }
    }, [params.toolName]);

    const toolIdFromParams = useMemo(() => {
        const fromParams = Number(params.toolId);
        if (Number.isFinite(fromParams) && fromParams > 0) {
            return fromParams;
        }
        return undefined;
    }, [params.toolId]);

    const toolIdForAccessCheck = toolIdFromParams ?? toolDetails?.toolId;

    const isReportRoute =
        params.toolType?.toLowerCase() === ToolType.Report.toLowerCase();

    const ApplicationMfe = useMemo(
        () => resolveApplicationMfe(toolNameFromUrl),
        [toolNameFromUrl],
    );
    const isRegisteredApplication = ApplicationMfe !== null;
    const shouldFetchToolDetails = Boolean(params.toolId) && !isRegisteredApplication;

    const isReport =
        isReportRoute ||
        toolDetails?.toolType?.toLowerCase() === ToolType.Report.toLowerCase();

    useEffect(() => {
        const fetchToolDetails = async () => {
            if (!shouldFetchToolDetails) {
                setIsLoadingToolDetails(false);
                return;
            }
            setIsLoadingToolDetails(true);
            setToolDetails(undefined);
            try {
                const response = await getApplicationDetailsById(String(params.toolId));
                if (response) {
                    const detail = Array.isArray(response.toolDetail)
                        ? response.toolDetail[0]
                        : response.toolDetail;

                    if (detail) {
                        setToolDetails(detail);

                        try {
                            if (detail.filterMapping) {
                                const jsonArrayString = JSON.parse(detail.filterMapping);
                                const parsedFilters = JSON.parse(jsonArrayString);
                                setFilters(parsedFilters);
                            }
                        } catch {
                            setFilters([]);
                        }
                    }
                }
            } finally {
                setIsLoadingToolDetails(false);
            }
        };
        fetchToolDetails();
    }, [params.toolId, shouldFetchToolDetails]);

    const resolvedToolName = toolNameFromUrl || toolDetails?.tool || '';

    const descriptionFromNavigation = useMemo(() => {
        const description = (location.state as ToolNavigationState | null)?.description;
        return typeof description === 'string' ? description.trim() : '';
    }, [location.state]);

    const descriptionFromLibrary = useMemo(() => {
        const libraryData = appsAndReportsCards as
            | { data?: { data?: Array<{ objectId?: number | string; description?: string }> } }
            | undefined;
        const items = Array.isArray(libraryData?.data?.data) ? libraryData.data.data : [];
        const match = items.find(item => String(item.objectId) === String(params.toolId));
        return typeof match?.description === 'string' ? match.description.trim() : '';
    }, [appsAndReportsCards, params.toolId]);

    const resolvedDescription = descriptionFromNavigation || descriptionFromLibrary;

    const issueSourceType = useMemo<number | null>(() => {
        const name = resolvedToolName.trim().toLowerCase();

        return (
            IPM_ISSUE_SOURCE_TYPE_MAP[name as keyof typeof IPM_ISSUE_SOURCE_TYPE_MAP] ?? null
        );
    }, [resolvedToolName]);

    const isIssuesNameAllowed = useMemo(() => {
        const name = resolvedToolName.trim().toLowerCase();
        return allowedIssueTools.has(name);
    }, [resolvedToolName]);

    useEffect(() => {
        const runAccessCheck = async () => {
            if (!toolIdForAccessCheck) {
                setHasToolAccess(false);
                return;
            }
            setIsCheckingAccess(true);
            setHasToolAccess(null);
            try {
                const res = await checkUserAccessForReport(toolIdForAccessCheck);
                const allowed = Boolean(res?.hasAccess) && roleType !== ROLE_TYPE.GUEST;
                setHasToolAccess(allowed);
            } catch {
                setHasToolAccess(false);
            } finally {
                setIsCheckingAccess(false);
            }
        };

        runAccessCheck();
    }, [toolIdForAccessCheck, roleType]);

    const isIssuesEnabled = isIssuesNameAllowed && hasToolAccess === true;

    const renderApplicationAccessDenied = () => (
        <Flex
            className={styles['access-denied-container']}
            vertical
            align="center"
            justify="center"
            gap={4}
        >
            <ReportAccessDeniedState />
            <Label type="body1">
                <span className={styles['access-denied-title']}>
                    You don&apos;t have access to this application.
                </span>
            </Label>
            <Label type="body2">
                <span className={styles['access-denied-description']}>
                    Go to{' '}
                    <Button
                        onClick={() => navigate('/user-profile-settings')}
                        text="User Role Settings"
                        variant="Link"
                    />{' '}
                    to raise an access request.
                </span>
            </Label>
        </Flex>
    );

    const renderLoading = () => (
        <Flex align="center" justify="center" className={styles['access-denied-container']}>
            <AnimatedLoaders id="lazy-loader" type="page" />
        </Flex>
    );

    function RenderTabContent() {
        switch (selectedTab) {
            case TabNamesEnum.Overview:
                return (
                    isReport &&
                    toolIdForAccessCheck && (
                        <PowerBIReport toolId={toolIdForAccessCheck} filters={filters} />
                    )
                );

            case TabNamesEnum.IssueAction: {
                if (isCheckingAccess) {
                    return (
                        <Label type="body2">
                            <span>Checking access…</span>
                        </Label>
                    );
                }

                return isIssuesEnabled && issueSourceType !== null ? (
                    <IssuesScreen issueSourceType={issueSourceType} />
                ) : (
                    <Label type="body2">
                        <span>
                            This tool doesn’t support Issues & Actions or you don’t have access.
                        </span>
                    </Label>
                );
            }

            case TabNamesEnum.History:
            default:
                return selectedTab;
        }
    }

    const onUserSelectTab = useCallback(
        ({ label, isDisabledTab }: any) => {
            if (isDisabledTab) return;

            if (label === TabNamesEnum.IssueAction && !isIssuesEnabled) return;

            setSelectedTab(label);
        },
        [isIssuesEnabled],
    );

    if (isRegisteredApplication) {
        if (isCheckingAccess) {
            return renderLoading();
        }

        if (!hasToolAccess) {
            return renderApplicationAccessDenied();
        }

        return (
            <Suspense
                fallback={
                    <div className={styles['overlay']}>
                        <AnimatedLoaders id="lazy-loader" type="page" />
                    </div>
                }
            >
                <ApplicationMfe
                    hostMode
                    language={userLanguage.languageCode ?? 'EN'}
                />
            </Suspense>
        );
    }

    return (
        <Flex vertical gap={24}>
            <Flex vertical gap={8} className={styles['pm-management-title']}>
                <Flex align="center" gap={8} justify="space-between">
                    <Flex align="flex-start" gap={16}>
                        <Flex justify="flex-start" vertical gap={8}>
                            <Label type="h2">
                                <span className={styles['pm-management-heading']}>
                                    {isLoadingToolDetails && !resolvedToolName ? (
                                        <Skeleton.Node
                                            active
                                            style={{ width: '300px', height: '1.75rem' }}
                                        />
                                    ) : (
                                        resolvedToolName
                                    )}
                                </span>
                            </Label>
                            {resolvedDescription ? (
                                <Label type="body2">
                                    <span className={styles['pm-management-description']}>
                                        {resolvedDescription}
                                    </span>
                                </Label>
                            ) : null}
                        </Flex>
                    </Flex>
                </Flex>

                <Flex className={styles['tabs-wrapper']}>
                    <Tab
                        items={[
                            {
                                label: TabNamesEnum.Overview,
                                icon: 'file-07',
                            },
                            {
                                label: TabNamesEnum.IssueAction,
                                icon: 'alert-circle',
                                isDisabledTab: !isIssuesEnabled,
                            },
                            {
                                label: TabNamesEnum.History,
                                icon: 'clock-rewind',
                                isDisabledTab: true,
                            },
                        ]}
                        onClick={onUserSelectTab}
                    />
                </Flex>
            </Flex>

            <div>{RenderTabContent()}</div>
        </Flex>
    );
};

export default PerformanceManagementScreen;
