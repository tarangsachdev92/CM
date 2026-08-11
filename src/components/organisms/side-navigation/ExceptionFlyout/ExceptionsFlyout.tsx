import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Drawer, Flex, Tooltip } from 'antd';
import { Flyout, Tab, AnimatedLoaders, Counter } from 'konnect-react-components';
import { useNavigate } from 'react-router-dom';
import styles from './ExceptionsFlyout.module.scss';
import { ExternalLinkIcon, LeftArrowIcon } from '../../../../assets/icons/icons';
// import ExceptionDetailFlyout from './ExceptionDetailFlyout';
import ExceptionCard from './ExceptionCard';
import { NoMatchesFound } from '../../../../assets/images/images';
import { useDispatch, useSelector } from 'react-redux';
import { getExceptionIssuesDetails } from '../../../../store/thunks/getExceptionFlyoutIssuesDetails';
import { getExceptionRiskDetails } from '../../../../store/thunks/getExceptionRiskDetails';
import { getExceptionOpportunityDetails } from '../../../../store/thunks/getExceptionOpportunityDetails';
import { RootState } from '../../../../store';
import { AppDispatch } from '../../../../store';

import type {
    RawExceptionItem,
    RawIssueItem,
    RawRiskItem,
    RawOpportrunityItem,
} from '../../../../../src/types/response';
import LogNewIssueScreen from './LogNewIssueScreen';
import RiskAndOpportunityNew from './RiskAndOpportunityNew';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    setIsOpen: (open: boolean) => void;
}

const IssueDetailsFlyoutLazy = React.lazy(() => import('issueManagement/issueDetailsFlyout'));

const RiskAndOpportunityDetailsFlyout = React.lazy(
    () => import('riskAndOpportunity/RiskAndOpportunityDetailsFlyout'),
);

const ExceptionsFlyout: React.FC<Props> = ({ isOpen, onClose, setIsOpen }) => {
    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();

    const issuesState = useSelector((state: RootState) => state.exceptionFlyoutIssuesDetails);
    const risksState = useSelector((state: RootState) => state.exceptionFlyoutRiskDetails);
    const opportunitiesState = useSelector(
        (state: RootState) => state.exceptionFlyoutOpportunityDetails,
    );

    useEffect(() => {
        if (isOpen) {
            dispatch(getExceptionIssuesDetails());
            dispatch(getExceptionRiskDetails());
            dispatch(getExceptionOpportunityDetails());
        }
    }, [dispatch, isOpen]);

    const [selectedTabName, setSelectedTabName] = useState<'Issues' | 'Risks' | 'Opportunities'>(
        'Issues',
    );
    const [selectedException, setSelectedException] = useState<RawExceptionItem | null>(null);
    const [isExpanded, setExpand] = useState(false);
    const [showLogNewIssue, setShowLogNewIssue] = useState(false);

    const handlePopOutClick = () => {
        const path = selectedTabName === 'Issues' ? '/issues' : '/ro';
        navigate(path);
        setIsOpen(false);
    };

    const handleCardClick = (exception: RawExceptionItem & { collabType?: string }) => {
        // If Issues AND collabType is absent, open via the issues table (it knows how to handle it)
        if (selectedTabName === 'Issues' && !exception?.collabType) {
            const exceptionId = (exception as any).exceptionId; // <-- force exceptionId
            const section = detailsTab; // optional: preserve tab context

            navigate(
                `/issues?issueId=${encodeURIComponent(String(exceptionId))}${
                    section ? `&section=${encodeURIComponent(section)}` : ''
                }`,
            );
            setIsOpen(false);
            return;
        }

        // Else open the remote details flyout directly
        setSelectedException(exception);
    };
    const handleSubmit = () => {
        setTimeout(() => {
            handlePopOutClick();
        }, 2000);
    };

    const [detailsTab, setDetailsTab] = useState<
        'About' | 'Root Cause' | 'Impact' | 'Resolution' | 'Actions' | 'Activity'
    >('About');

    const getCustomActionsForFlyout = () => (
        <Flex justify="space-between" align="center" className={styles['custom-action-container']}>
            <span className={styles['header']}>Exceptions</span>
            <Flex justify="flex-end" gap="16px">
                <Tooltip
                    title="Open in full view"
                    getPopupContainer={() => document.body}
                    zIndex={5000}
                >
                    <div
                        className={styles['button']}
                        onMouseDown={e => {
                            e.stopPropagation();
                            handlePopOutClick();
                        }}
                    >
                        {ExternalLinkIcon()}
                    </div>
                </Tooltip>
                <Tooltip
                    title="Collapse flyout"
                    getPopupContainer={() => document.body}
                    zIndex={5000}
                >
                    <div className={styles['button']} onClick={() => setIsOpen(false)}>
                        {LeftArrowIcon()}
                    </div>
                </Tooltip>
            </Flex>
        </Flex>
    );

    const filteredItems = useMemo(() => {
        let data;
        if (selectedTabName === 'Opportunities') {
            data = opportunitiesState.data.map(item => ({
                ...item,
                description: item.riskDescription, // Adjust according to your data structure
                id: item.exceptionId,
                actionStatus: item.actionStatus.map(action => ({
                    ...action,
                    actionStatus: action.actionStatus || 'Unknown',
                })),
            })) as RawOpportrunityItem[];
        } else if (selectedTabName === 'Risks') {
            data = risksState.data.map(item => ({
                ...item,
                description: item.riskDescription,
                id: item.exceptionId,
                actionStatus: item.actionStatus.map(action => ({
                    ...action,
                    actionStatus: action.actionStatus || 'Unknown',
                })),
            })) as RawRiskItem[];
            // ExceptionsFlyout.tsx (inside filteredItems useMemo, Issues branch)
        } else {
            data = issuesState.data.map(item => ({
                ...item,
                description: item.riskDescription,
                id: item.exceptionId,
                collabType: (item as any).collabType, // <-- keep collabType if available
                actionStatus: item.actionStatus.map(action => ({
                    ...action,
                    actionStatus: action.actionStatus || 'Unknown',
                })),
            })) as (RawIssueItem & { collabType?: string })[];
        }

        return data;
    }, [issuesState.data, risksState.data, opportunitiesState.data, selectedTabName]);

    type Counts = {
        Issues: number;
        Risks: number;
        Opportunities: number;
    };
    const tabItems = useMemo(() => {
        const counts = { Issues: 0, Risks: 0, Opportunities: 0 };

        // Count issues
        counts.Issues = issuesState.data.length;

        // Count risks
        counts.Risks = risksState.data.length;

        counts.Opportunities = opportunitiesState.data.length;

        return Object.entries(counts)
            .filter(([, count]) => count > 0) // Include only those with count > 0
            .map(([label]) => ({
                label,
                count: counts[label as keyof Counts], // Use type assertion for indexing
            }));
    }, [issuesState.data, risksState.data, opportunitiesState.data]);

    useEffect(() => {
        if (!tabItems.find(tab => tab.label === selectedTabName)) {
            setSelectedTabName(tabItems[0]?.label as 'Issues' | 'Risks' | 'Opportunities');
        }
    }, [tabItems, selectedTabName]);

    const handleClose = () => {
        setShowLogNewIssue(false);
    };

    const isAnyLoading = issuesState.loading || risksState.loading || opportunitiesState.loading;

    const currentError =
        selectedTabName === 'Issues'
            ? issuesState.error
            : selectedTabName === 'Risks'
              ? risksState.error
              : opportunitiesState.error;

    return (
        <>
            <Flyout
                key="flyout"
                id="app-exceptions-flyout"
                flyoutOpen={isOpen && !selectedException}
                direction="left"
                cancelIconClick={onClose}
                heading=""
                containerMaxWidth="28rem"
                className={styles['flyout-container-main']}
                onBackDropClick={showLogNewIssue ? () => {} : onClose}
                customActions={getCustomActionsForFlyout()}
                content={
                    <div className={styles['content-container']}>
                        {/* Sticky Tabs */}
                        <div className={styles['tab-sticky']}>
                            <Tab
                                items={tabItems.map(tab => ({
                                    label: (
                                        <span>
                                            {tab.label}
                                            <Counter colorVariant="Neutral-2" value={tab.count} />
                                        </span>
                                    ),
                                    key: tab.label,
                                }))}
                                onClick={tab =>
                                    setSelectedTabName(
                                        tab.key as 'Issues' | 'Risks' | 'Opportunities',
                                    )
                                }
                                className="tab-items"
                            />
                        </div>

                        {/* Scrollable content area (non-elastic) */}
                        <div className={styles['cards-scroll']}>
                            {isAnyLoading ? (
                                <Flex className={styles['initial-loader-container']}>
                                    <AnimatedLoaders id="initial-loader" type="page" />
                                </Flex>
                            ) : currentError ? (
                                <div className={styles['empty-state-container']}>
                                    <span className={styles['empty-text']}>Error</span>
                                    <span>{currentError}</span>
                                </div>
                            ) : filteredItems.length > 0 ? (
                                <>
                                    {/* Only the list gets horizontal padding */}
                                    <div className={styles['cards-gutter']}>
                                        {filteredItems.map(item => {
                                            const resolvedId =
                                                selectedTabName === 'Issues'
                                                    ? // Prefer issueId if present, fallback to exceptionId
                                                      'issueId' in item
                                                        ? item.issueId
                                                        : (item as any).exceptionId
                                                    : selectedTabName === 'Risks'
                                                      ? // Prefer riskId if present, fallback to exceptionId
                                                        'riskId' in item
                                                          ? (item as any).riskId
                                                          : (item as any).exceptionId
                                                      : // Opportunities
                                                        'opportunityId' in item
                                                        ? (item as any).opportunityId
                                                        : (item as any).exceptionId;

                                            const key = `${selectedTabName}-${resolvedId}-${item.title}`;
                                            return (
                                                <ExceptionCard
                                                    key={key}
                                                    exception={item}
                                                    onCardClick={() => handleCardClick(item)}
                                                    contextType={selectedTabName}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Keep sticky button aligned with the gutter */}
                                    <div className={styles['sticky-button-container']}>
                                        <button
                                            className={styles['sticky-button']}
                                            onClick={() => setShowLogNewIssue(true)}
                                            onMouseEnter={() => setExpand(true)}
                                            onMouseLeave={() => setExpand(false)}
                                        >
                                            <span className={styles['plus-icon']}>+</span>
                                            {isExpanded && (
                                                <span className={styles['button-text']}>
                                                    {`Log ${selectedTabName.slice(0, -1)}`}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className={styles['empty-state-container']}>
                                    <NoMatchesFound />
                                    <span className={styles['empty-text']}>All Clear!</span>
                                    <span>Everything looks good! No issues to report.</span>
                                </div>
                            )}
                        </div>
                    </div>
                }
            />
            {showLogNewIssue && (
                <Drawer
                    open={showLogNewIssue}
                    width={760}
                    style={{ padding: '0px !important' }}
                    rootStyle={{ zIndex: 999 }}
                    styles={{ body: { padding: 0 }, wrapper: { marginTop: '6vh' } }}
                    closable={false}
                    mask={true}
                    maskClosable={true}
                    onClose={() => {
                        setShowLogNewIssue(false);
                    }}
                    zIndex={2000}
                >
                    {selectedTabName === 'Issues' ? (
                        <LogNewIssueScreen handleClose={handleClose} onSubmit={handleSubmit} />
                    ) : (
                        <RiskAndOpportunityNew handleClose={handleClose} onSubmit={handleSubmit} />
                    )}
                </Drawer>
            )}
            {/* {selectedException && (
                <ExceptionDetailFlyout
                    exception={selectedException}
                    onClose={() => setSelectedException(null)}
                />
            )} */}
            {selectedException && (
                <div
                    className={styles['overlay']}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                >
                    <Suspense fallback={<AnimatedLoaders id="lazy-loader" type="page" />}>
                        {selectedTabName === 'Issues' ? (
                            (() => {
                                const exIssueId = Number(
                                    ('issueId' in selectedException
                                        ? (selectedException as any).issueId
                                        : (selectedException as any).exceptionId) ?? 0,
                                );

                                return (
                                    <IssueDetailsFlyoutLazy
                                        isOpen={true}
                                        exIssueId={exIssueId}
                                        handleClose={() => setSelectedException(null)}
                                        collabType={(selectedException as any)?.collabType ?? ''} // ✅ pass real collabType
                                        API_URL={import.meta.env.VITE_ISSUE_MANAGEMENT_BASE_URL}
                                        defaultTab={detailsTab} // optional but recommended for consistency
                                    />
                                );
                            })()
                        ) : (
                            <RiskAndOpportunityDetailsFlyout
                                key={selectedException.id}
                                isOpen={true}
                                handleClose={() => setSelectedException(null)}
                                exceptionId={selectedException.id}
                                exceptionTitle={selectedException.title}
                                exceptionType={selectedTabName === 'Risks' ? 'R' : 'O'}
                                selectedTab={detailsTab}
                                setSelectedTab={setDetailsTab}
                                API_URL={import.meta.env.VITE_RISK_AND_OPPORTUNITY_BASE_URL}
                            />
                        )}
                    </Suspense>
                </div>
            )}{' '}
        </>
    );
};

export default ExceptionsFlyout;
