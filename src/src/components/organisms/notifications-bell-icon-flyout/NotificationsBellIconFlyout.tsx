import { Flex, Popover, Skeleton } from 'antd';
import { Card, Flyout, Icon, InputField, Status, Tab, Toast } from 'konnect-react-components';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    AppDispatch,
    RootState,
    fetchUserNotifications,
    disableNotification,
    fetchDisableNotification,
    fetchNotificationTotalCount,
    fetchProfilePicture
} from '../../../store';
import {
    AlertsEmptyStateImage,
    NotificationsEmptyStateImage,
    WarningsEmptyStateImage,
} from '../../../assets/images/images';
import type { IUserNotifications } from '../../../types/response';
import {
    NOTIFICATION_ACTION_TYPE,
    NOTIFICATION_TRIGGER_TYPE,
    TimeCategory,
} from '../../../utils/constants';
import { formatMonthYear, formatNotificationDate, logError } from '../../../utils/helpers';
import { useIsGuestUser } from '../../../utils/customHooks';
import NotificationCard from '../../molecules/notification-card/NotificationCard';
import MentionNotificationCard from '../../molecules/notification-card/MentionNotificationCard';
import styles from './NotificationsBellIconFlyout.module.scss';
import {
    IApplicationNotificationJSONType,
    IIssueCommentNotificationJSONType,
    IRoleNotificationJSONType,
    KPINotificationJSONType,
    INotificationCardProps,
    NotificationData,
    IReportNotificationJSONType,
    IIssueActionOverdueJSON,
    IIssueRuleNotificationJsonType,
    NotificationToDoData,
    IExceptionAssignedNotificationJSONType,
    IForumRequestNotificationJSONType,
    IMentionNotificationJSONType
} from '../../../types/common';
import KPIDetailsNotificationCard from '../../molecules/notification-card/KPIDetailsNotificationCard';
import {
    ApplicationAccessAddedRemovedUpdatedIcon,
    ApplicationPermissionAddedIcon,
    ApplicationPermissionRemovedIcon,
    ApplicationUnavaliableIcon,
    DotSeperator,
    IRONotificationIcon,
    IssueOverDueIcon,
    KpiDeclineIcon,
    KpiIncineIcon,
    ToDoCheckDone,
} from '../../../assets/icons/icons';
import {
    deleteNotificationByIdAndType,
    manageNotifications,
} from '../../../services/alertnotificationRules';
import { useNavigate } from 'react-router-dom';
import ApplicationNotificationCardBody from './ApplicationNotificationCardBody';
import IssueRiskOppNotificationCard from '../../molecules/notification-card/IssueRiskOppNotificationCard';
import { MESSAGES } from '../../../utils/messages';
import ReportNotificationCardBody from './ReportNotificationCardBody';
import NotificationCardContent from '../../molecules/notification-card/ToDoNotificationCard';
import { safeParse } from '../../../utils/safeJson';
import IssureRuleNotificationCard from '../../molecules/notification-card/IssureRuleNotificationCard';
import ToDoActionSectionNotificationCardContent from '../../molecules/notification-card/ToDoActionSectionNotificationCard';
import { ButtonBase, IconButton } from '@mui/material';

type NotificationsBellIconFlyoutProps = {
    isFlyoutOpen: boolean;
    onClickHandlerForFlyoutCancelIcon: () => void;
    scrollRefCallback?: (ref: HTMLDivElement | null) => void;
};


const FLYOUT_TAB_ITEM_KEYS = {
    Notifications: 'Notifications',
    Warnings: 'Warnings',
    Alerts: 'Alerts',
    Notices: 'Notice',
};

const isValidTab = (v: string | null): v is keyof typeof FLYOUT_TAB_ITEM_KEYS =>
    v === FLYOUT_TAB_ITEM_KEYS.Notices ||
    v === FLYOUT_TAB_ITEM_KEYS.Warnings ||
    v === FLYOUT_TAB_ITEM_KEYS.Alerts;

type SortedNotifications = { [key in TimeCategory]: IUserNotifications[] };

function NotificationsEmptyState() {
    return (
        <div className={styles['empty-state-container']}>
            <NotificationsEmptyStateImage />
            <span className={styles['empty-state-typography-1']}>No new Notice</span>
            <span className={styles['empty-state-typography-2']}>
                You don’t have any notice at the moment.
            </span>
        </div>
    );
}

function WarningsEmptyState() {
    return (
        <div className={styles['empty-state-container']}>
            <WarningsEmptyStateImage />
            <span className={styles['empty-state-typography-1']}>No new Warnings</span>
            <span className={styles['empty-state-typography-2']}>
                You don’t have any warnings at the moment.
            </span>
        </div>
    );
}

function AlertsEmptyState() {
    return (
        <div className={styles['empty-state-container']}>
            <AlertsEmptyStateImage />
            <span className={styles['empty-state-typography-1']}>No new Alerts</span>
            <span className={styles['empty-state-typography-2']}>
                You don’t have any alerts at the moment.
            </span>
        </div>
    );
}

function NotificationsBellIconFlyout({
    isFlyoutOpen,
    onClickHandlerForFlyoutCancelIcon,
    scrollRefCallback,
}: Readonly<NotificationsBellIconFlyoutProps>) {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const userNotifications = useSelector(
        (state: RootState) => state.notificationsAndAlerts.userNotifications,
    );
    const isUserNotificationsLoaded = useSelector(
        (state: RootState) => state.notificationsAndAlerts.isLoading,
    );
    const isDisableNotification = useSelector(
        (state: RootState) => state.notificationsAndAlerts.isDisableNotification,
    );

    const { images } = useSelector(
        (state: RootState) => state.profilePicture
    );

    const token = sessionStorage.getItem("accessTokenGraph");

    const {
        notifications,
        notificationUnreadCount,
        warnings,
        warningUnreadCount,
        alerts,
        alertUnreadCount,
    } = userNotifications;

    const [selectedTabName, setSelectedTabName] = useState(() => {
        const saved = sessionStorage.getItem('notificationSelectedTab');
        return isValidTab(saved) ? saved : FLYOUT_TAB_ITEM_KEYS.Notices;
    });

    const [sortedNotifications, setSortedNotifications] = useState<SortedNotifications>({
        //Today: TaskData[] = [taskData],
        Today: [],
        Yesterday: [],
        Past: [],
    });
    const [sortedWarnings, setSortedWarnings] = useState<SortedNotifications>({
        Today: [],
        Yesterday: [],
        Past: [],
    });
    const [sortedAlerts, setSortedAlerts] = useState<SortedNotifications>({
        Today: [],
        Yesterday: [],
        Past: [],
    });
    const [showLoader, setShowLoader] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState<string>('');

    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [showNotificationActionpopup, setshowNotificationActionpopup] = useState<boolean>(false);
    const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
    const [toastConfig, setToastConfig] = useState<{
        visible: boolean;
        message: string;
        type: 'Default' | 'Success' | 'Error';
    }>({ visible: false, message: '', type: 'Default' });

    useEffect(() => {
        if (!isUserNotificationsLoaded && isInitialLoad) {
            setIsInitialLoad(false);
        }
    }, [isUserNotificationsLoaded, isInitialLoad]);

    const isGuestUser = useIsGuestUser();
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const handleNotificationToggle = async () => {
        const newValue = !isDisableNotification;

        try {
            await dispatch(disableNotification(newValue)).unwrap();
        } catch (error) {
            setToastConfig({
                visible: true,
                message: (error as string) || 'Failed to update notification settings',
                type: 'Error',
            });
        }
    };

    const openRiskOpportunityFromNotification = useCallback(
        (exceptionId?: string | number | null) => {
            if (!exceptionId) return;
            navigate(`/ro?exceptionId=${encodeURIComponent(String(exceptionId))}`);
            onClickHandlerForFlyoutCancelIcon();
        },
        [navigate, onClickHandlerForFlyoutCancelIcon],
    );

    const openApprovalsFromNotifications = useCallback(() => {
        navigate('/user-profile-settings?tab=Approvals');
       onClickHandlerForFlyoutCancelIcon();
        console.log('called');
    }, [navigate, onClickHandlerForFlyoutCancelIcon]);

    useEffect(() => {
        setShowUnreadOnly(false);
        dispatch(fetchDisableNotification());
    }, []);

    useEffect(() => {
  notifications
    ?.filter(
      n => n.triggerType === NOTIFICATION_TRIGGER_TYPE.MENTION_NOTIFICATION
    )
    .forEach(notification => {
      if (
        notification.createdBy &&
        !images[notification.createdBy]
      ) {
        dispatch(
          fetchProfilePicture({
            graphAccessToken: token || "",
            userEmail: notification.createdBy,
          })
        );
      }
    });
}, [notifications, dispatch, token, isFlyoutOpen]);

    useEffect(() => {
        if (isFlyoutOpen) {
            dispatch(fetchUserNotifications(showUnreadOnly));
        }
    }, [isFlyoutOpen, showUnreadOnly, dispatch]);

    useEffect(() => {
        if (notifications?.length) {
            const _sortedNotifications = {} as SortedNotifications;
            notifications.forEach(notification => {
                const category = notification.timeCategory;
                _sortedNotifications[category] ??= [];
                _sortedNotifications[category].push(notification);
            });
            setSortedNotifications(_sortedNotifications);
        }

        if (warnings?.length) {
            const _sortedWarnings = {} as SortedNotifications;
            warnings.forEach(warning => {
                const category = warning.timeCategory;
                _sortedWarnings[category] ??= [];
                _sortedWarnings[category].push(warning);
            });
            setSortedWarnings(_sortedWarnings);
        }

        if (alerts?.length) {
            const _sortedAlerts = {} as SortedNotifications;
            alerts.forEach(alert => {
                const category = alert.timeCategory;
                _sortedAlerts[category] ??= [];
                _sortedAlerts[category].push(alert);
            });
            setSortedAlerts(_sortedAlerts);
        }

        const perTabKey = `notificationScrollTop:${selectedTabName}`;
        const scrollTop = sessionStorage.getItem(perTabKey);
        if (scrollTop && scrollContainerRef.current) {
            const target = scrollContainerRef.current;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    target.scrollTop = Number.parseInt(scrollTop, 10);
                    sessionStorage.removeItem(perTabKey);
                });
            });
        }
    }, [notifications, warnings, alerts, selectedTabName]);

    useEffect(() => {
        if (!isFlyoutOpen) return;

        const style = document.createElement('style');
        style.setAttribute('data-type', 'notification-flyout-style');
        style.innerHTML = `
    .flyout-overlay .flyout-container .flyout-body {
      padding: 1.5rem 0rem 1.5rem 1.5rem !important;
    }
      #todo-fly-out .flyout-body{
        padding: 1.5rem 1.5rem 1.5rem 1.5rem !important;
      }
  `;
        document.head.appendChild(style);

        return () => {
            const existing = document.querySelector('[data-type="notification-flyout-style"]');
            if (existing) {
                existing.remove();
            }
        };
    }, [isFlyoutOpen]);

    const FLYOUT_TAB_ITEMS = [
        {
            label: FLYOUT_TAB_ITEM_KEYS.Notices,
            count: isGuestUser ? 0 : notificationUnreadCount,
        },
        {
            label: FLYOUT_TAB_ITEM_KEYS.Warnings,
            count: isGuestUser ? 0 : warningUnreadCount,
        },
        {
            label: FLYOUT_TAB_ITEM_KEYS.Alerts,
            count: isGuestUser ? 0 : alertUnreadCount,
        },
    ];

    const manageNotificationActions = async (action: NOTIFICATION_ACTION_TYPE) => {
        let message = '';
        const isMarkRead = action === NOTIFICATION_ACTION_TYPE.MarkRead;

        try {
            const res = await manageNotifications(
                isMarkRead ? true : null,
                isMarkRead ? null : true,
            );

            if (isMarkRead) {
                setShowUnreadOnly(false);
            }
            if (res.statusCode === 200) {
                dispatch(fetchUserNotifications(showUnreadOnly));
                setshowNotificationActionpopup(false);
                message = isMarkRead
                    ? MESSAGES.MARK_ALL_READ_SUCCESS_MESSAGE()
                    : MESSAGES.CLEAR_ALL_READ_SUCCESS_MESSAGE();
                setToastConfig({ message, type: 'Success', visible: true });
            } else {
                message = isMarkRead
                    ? MESSAGES.MARK_ALL_READ_ERROR_MESSAGE()
                    : MESSAGES.CLEAR_ALL_READ_ERROR_MESSAGE();
                setToastConfig({ message, type: 'Error', visible: true });
            }
        } catch {
            message = isMarkRead
                ? MESSAGES.MARK_ALL_READ_ERROR_MESSAGE()
                : MESSAGES.CLEAR_ALL_READ_ERROR_MESSAGE();
            setToastConfig({ message, type: 'Error', visible: true });
        }
    };

    const getFlyoutContent = () => {
        const showMask = isUserNotificationsLoaded || showLoader;
        const disableClearAllRead =
            userNotifications.notifications.length +
                userNotifications.alerts.length +
                userNotifications.warnings.length <=
            userNotifications.totalUnread;
        const disableMarkAllRead = userNotifications.totalUnread == 0;
        let disableShowAll = false;

        if (showUnreadOnly) {
            disableShowAll =
                userNotifications.notifications.length +
                    userNotifications.alerts.length +
                    userNotifications.warnings.length ===
                    userNotifications.totalUnread && userNotifications.totalUnread === 0;
        } else {
            disableShowAll =
                userNotifications.totalUnread === 0 ||
                userNotifications.notifications.length +
                    userNotifications.alerts.length +
                    userNotifications.warnings.length ===
                    userNotifications.totalUnread;
        }

        return (
            <div
                ref={ref => {
                    scrollContainerRef.current = ref;
                    scrollRefCallback?.(ref);
                }}
                className={`${styles['notification-content-container']} notification-content-container`}
                style={{ position: 'relative' }}
            >
                <div
                    aria-hidden={showMask}
                    style={{
                        visibility: showMask ? 'hidden' : 'visible',
                        width: '100%',
                    }}
                >
                    <div className={styles['notification-flyout-header-container']}>
                        <div>
                            <strong>Notifications</strong>
                        </div>
                        <Flex>
                            <IconButton
                                onClick={handleNotificationToggle}
                                className={
                                    isDisableNotification ? '' : styles['notification-disabled']
                                }
                            >
                                {isDisableNotification ? (
                                    <Icon name="bell-02" size="xm" color="black-color" />
                                ) : (
                                    <Icon name="bell-off-02" size="xm" color="status-error-color" />
                                )}
                            </IconButton>
                            <IconButton
                                onClick={() => {
                                    navigate('user-profile-settings?tab=Notifications');
                                    onClickHandlerForFlyoutCancelIcon();
                                }}
                            >
                                <Icon name="settings-01" size="xm" color="black-color" />
                            </IconButton>
                            <Popover
                                onOpenChange={() => {
                                    setshowNotificationActionpopup(false);
                                }}
                                open={showNotificationActionpopup}
                                content={
                                    <Flex vertical>
                                        <ButtonBase
                                            onClick={() => {
                                                manageNotificationActions(
                                                    NOTIFICATION_ACTION_TYPE.MarkRead,
                                                );
                                            }}
                                            disabled={disableMarkAllRead}
                                        >
                                            <div
                                                className={
                                                    disableMarkAllRead
                                                        ? styles[
                                                              'notification-actions-popover-items-disabled'
                                                          ]
                                                        : styles[
                                                              'notification-actions-popover-items'
                                                          ]
                                                }
                                            >
                                                <Icon
                                                    name="check-tick"
                                                    color={
                                                        disableMarkAllRead
                                                            ? 'graph-grey-1-color'
                                                            : 'black-color'
                                                    }
                                                    size="xm"
                                                />
                                                <span> Mark all as read</span>
                                            </div>
                                        </ButtonBase>
                                        <ButtonBase
                                            onClick={() => {
                                                setShowUnreadOnly(!showUnreadOnly);
                                                setshowNotificationActionpopup(false);
                                            }}
                                            disabled={disableShowAll}
                                        >
                                            <div
                                                className={
                                                    disableShowAll
                                                        ? styles[
                                                              'notification-actions-popover-items-disabled'
                                                          ]
                                                        : styles[
                                                              'notification-actions-popover-items'
                                                          ]
                                                }
                                            >
                                                <Icon
                                                    name="eye"
                                                    color={
                                                        disableShowAll
                                                            ? 'graph-grey-1-color'
                                                            : 'black-color'
                                                    }
                                                    size="xm"
                                                />
                                                <span>
                                                    {' '}
                                                    {showUnreadOnly ? 'Show All' : 'Show Unread'}
                                                </span>
                                            </div>
                                        </ButtonBase>
                                        <ButtonBase
                                            onClick={() => {
                                                manageNotificationActions(
                                                    NOTIFICATION_ACTION_TYPE.ClearAllRead,
                                                );
                                            }}
                                            disabled={disableClearAllRead}
                                        >
                                            <div
                                                className={
                                                    disableClearAllRead
                                                        ? styles[
                                                              'notification-actions-popover-items-disabled'
                                                          ]
                                                        : styles[
                                                              'notification-actions-popover-items'
                                                          ]
                                                }
                                            >
                                                <Icon
                                                    name="x-close"
                                                    color={
                                                        disableClearAllRead
                                                            ? 'graph-grey-1-color'
                                                            : 'black-color'
                                                    }
                                                    size="xm"
                                                />
                                                <span> Clear all Read</span>
                                            </div>
                                        </ButtonBase>
                                    </Flex>
                                }
                                trigger="click"
                            >
                                <IconButton
                                    onClick={() => {
                                        setshowNotificationActionpopup(
                                            !showNotificationActionpopup,
                                        );
                                    }}
                                >
                                    <Icon name="dots-vertical" size="xm" color="black-color" />
                                </IconButton>
                            </Popover>
                        </Flex>
                    </div>

                    <Tab
                        items={FLYOUT_TAB_ITEMS}
                        onClick={(data: { label: string; count: number }) => {
                            setSelectedTabName(data.label);
                            sessionStorage.setItem('notificationSelectedTab', data.label);
                        }}
                        className={'flyout-tab-items'}
                    />
                    {!isDisableNotification && (
                        <div className={styles['notification-disabled-message']}>
                            <Icon name="bell-off-02" color="graph-grey-1-color" />
                            <span>
                                Notifications are disabled. Click on bell icon to enable them.
                            </span>

                        </div>
                    )}
                    {renderSelectedTabContainer()}
                </div>
                {showMask && (
                    <div
                        aria-busy="true"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: '#fff',
                            zIndex: 1,
                            pointerEvents: 'auto',
                        }}
                    >
                        <div
                            style={{ padding: '1rem 1rem 1.5rem 0', height: '100%', width: '100%' }}
                        >
                            <Skeleton active paragraph={{ rows: 22, width: '100%' }} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSelectedTabContainer = () => {
        switch (selectedTabName) {
            case FLYOUT_TAB_ITEM_KEYS.Notices:
                return isGuestUser || !notifications.length
                    ? renderEmptyState(selectedTabName)
                    : renderSortedNotifications(
                          sortedNotifications[TimeCategory.Today],
                          sortedNotifications[TimeCategory.Yesterday],
                          sortedNotifications[TimeCategory.Past],
                      );
            case FLYOUT_TAB_ITEM_KEYS.Warnings:
                return isGuestUser || !warnings.length
                    ? renderEmptyState(selectedTabName)
                    : renderSortedNotifications(
                          sortedWarnings[TimeCategory.Today],
                          sortedWarnings[TimeCategory.Yesterday],
                          sortedWarnings[TimeCategory.Past],
                      );
            case FLYOUT_TAB_ITEM_KEYS.Alerts:
                return isGuestUser || !alerts.length
                    ? renderEmptyState(selectedTabName)
                    : renderSortedNotifications(
                          sortedAlerts[TimeCategory.Today],
                          sortedAlerts[TimeCategory.Yesterday],
                          sortedAlerts[TimeCategory.Past],
                      );
            default:
                return <></>;
        }
    };

    // Function to render empty states for the section
    const renderEmptyState = useCallback(
        (selectedTab: string) => {
            switch (selectedTab) {
                case FLYOUT_TAB_ITEM_KEYS.Notices:
                    return <NotificationsEmptyState />;
                case FLYOUT_TAB_ITEM_KEYS.Warnings:
                    return <WarningsEmptyState />;
                case FLYOUT_TAB_ITEM_KEYS.Alerts:
                    return <AlertsEmptyState />;
                default:
                    return <></>;
            }
        },
        [selectedTabName],
    );

    // This function will actually render the notifications in the sorted manner (Today, Yesterday, Last 7 days).
    const renderSortedNotifications = (
        todayData: IUserNotifications[],
        yesterdayData: IUserNotifications[],
        pastData: IUserNotifications[],
    ) => {
        const isValidNotification = (notification: IUserNotifications) =>
            notification.notificationText !== undefined &&
            notification.notificationText !== null &&
            notification.notificationText.trim().toLowerCase() !== 'null'; // allow empty string

        const filteredToday = todayData?.filter(isValidNotification);
        const filteredYesterday = yesterdayData?.filter(isValidNotification);
        const filteredPast = pastData?.filter(isValidNotification);

        return (
            <div className={styles['tab-content-container']}>
                {filteredToday?.length > 0 && (
                    <div className={styles['tab-content-sort-container']}>
                        <div className={styles['tab-content-sort-title-typography']}>Today</div>
                        {renderCards(todayData)}
                    </div>
                )}
                {filteredYesterday?.length > 0 && (
                    <div className={styles['tab-content-sort-container']}>
                        <div className={styles['tab-content-sort-title-typography']}>Yesterday</div>
                        {renderCards(yesterdayData)}
                    </div>
                )}
                {filteredPast?.length > 0 && (
                    <div className={styles['tab-content-sort-container']}>
                        <div className={styles['tab-content-sort-title-typography']}>
                            Last 7 days
                        </div>
        
                        {renderCards(pastData)}
                    </div>
                )}
            </div>
        );
    };

    const getToolPermissionRemovedCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        let parsedText: { Message?: string; Datetime?: string } = {};

        try {
            parsedText = JSON.parse(json || '{}');
        } catch (error) {
            logError(
                ' Failed to parse notificationText in getToolPermissionRemovedCard:',
                json,
                error,
            );
        }

        return (
            <NotificationCard
                activityType={status}
                titleText={parsedText?.Message ?? 'Tool permission removed'}
                subtitleText={formatNotificationDate(parsedText?.Datetime ?? '')}
                bodyElement={
                    <Flex className={'role-notification-card-body-text'}>
                        <div>{parsedText?.Message ?? 'Tool permission update'}</div>
                    </Flex>
                }
                showIcon={true}
                icon={
                    <div className={styles['icon-background']}>
                        <Icon size="xm" color="graph-blue-color" name="user-01" />
                    </div>
                }
                type={notificationType}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
            />
        );
    };

    const getRoleAssignedCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        const data = safeParse<IRoleNotificationJSONType>(json, 'getRoleAssignedCard');
        if (!data) return <></>;

        return (
            <NotificationCard
                activityType={status}
                showToast={msg => setShowSuccessToast(msg)}
                titleText={`${data.type} role request approved`}
                subtitleText={formatNotificationDate(data.datetime)}
                bodyElement={
                    <Flex className={'role-notification-card-body-text'}>
                        {data.approvalStatus && data.approvalStatus == 'Complete' && (
                            <div>
                                Your request for{' '}
                                <span className="bold-title"> {data.roleName} </span> has been
                                approved.
                            </div>
                        )}
                        {data.approvalStatus && data.approvalStatus == 'Partial' && (
                            <div>
                                Your request for{' '}
                                <span className="bold-title"> {data.roleName} </span> has been
                                partially approved. Check the status of the pending AD groups in
                                your role settings.
                            </div>
                        )}
                    </Flex>
                }
                showIcon={true}
                icon={
                    <div className={styles['icon-background']}>
                        <Icon size="xm" color="graph-blue-color" name="user-left-02" />
                    </div>
                }
                type={notificationType}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
            />
        );
    };

    const getRoleDeactivatedCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        const data: IRoleNotificationJSONType = JSON.parse(json);

        return (
            <NotificationCard
                activityType={status}
                titleText={`${data.type} Role Unavailable`}
                subtitleText={formatNotificationDate(data.datetime)}
                bodyElement={
                    <Flex className={'role-notification-card-body-text'}>
                        <div>
                            Your {data.type} role{' '}
                            <span className="bold-title"> {data.roleName} </span> is no longer
                            available in command centre. Access to all related permissions have been
                            removed. You can request for a new related role from your role settings.
                        </div>
                    </Flex>
                }
                showIcon={true}
                icon={
                    <div className={styles['icon-background']}>
                        <Icon size="xm" color="graph-blue-color" name="user-left-02" />
                    </div>
                }
                type={notificationType}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
            />
        );
    };
    const getRoleUnavailableCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        const data: IRoleNotificationJSONType = JSON.parse(json);
        return (
            <NotificationCard
                activityType={status}
                titleText="Role Unavailable"
                subtitleText={formatNotificationDate(data.datetime)}
                bodyElement={
                    <Flex className={'role-notification-card-body-text'}>
                        <div>
                            Your role <span className="bold-title"> {data.roleName} </span> is no
                            longer available in command centre. Access to all permissions related to
                            the secondary role have been removed. You can request for a new related
                            role from your role settings.
                        </div>
                    </Flex>
                }
                showIcon={true}
                icon={
                    <div className={styles['icon-background']}>
                        <Icon size="xm" color="graph-blue-color" name="user-01" />
                    </div>
                }
                type={notificationType.toLowerCase()}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
            />
        );
    };

    const getRevokedCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        const data: IRoleNotificationJSONType = JSON.parse(json);
        return (
            <NotificationCard
                activityType={status}
                titleText={`${data.type} role permissions revoked`}
                subtitleText={formatNotificationDate(data.datetime)}
                bodyElement={
                    <Flex className={'role-notification-card-body-text'}>
                        <div>
                            Your secondary role permissions have been revoked from{' '}
                            <span className="bold-title"> {data.roleName}. </span> All permissions
                            related will be deleted.
                        </div>
                    </Flex>
                }
                showIcon={true}
                icon={
                    <div className={styles['icon-background']}>
                        <Icon size="xm" color="graph-blue-color" name="user-plus-01" />
                    </div>
                }
                type={notificationType.toLowerCase()}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
            />
        );
    };

    const getIssueCommentCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        const data = safeParse<IIssueCommentNotificationJSONType>(json, 'getIssueCommentCard');
        if (!data) return <></>;
        return (
            <NotificationCard
                activityType={status}
                titleText={`${data.CreatedBy} Mentioned you in a comment`}
                subtitleText={formatNotificationDate(data.Datetime)}
                bodyElement={
                    <Flex className={'issue-comment-notification-card-body'}>
                        <Flex className={'notification-card-body-text'}>
                            <div>{data.Comment}</div>
                        </Flex>
                        <Flex className={'notification-card-body-input'}>
                            <InputField
                                onChange={() => {}}
                                className={'notification-card-input'}
                                placeholder={`Reply`}
                            />
                        </Flex>
                    </Flex>
                }
                type={notificationType}
                showIcon={false}
                fromUser={data.FirstName}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
            />
        );
    };

    const getKpiCardTitle = (data: KPINotificationJSONType) => {
        let title = '';
        if (data.Conditionvalue < data.current_value) {
            title = `${data.KPI_name} above ${data.Conditionvalue}`;
        } else {
            title = `${data.KPI_name} below ${data.Conditionvalue}`;
        }

        return title === '' ? 'KPI' : title;
    };

    const getKPIDetailCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        const data = safeParse<KPINotificationJSONType>(json, 'getKPIDetailCard');
        if (!data) return <></>;
        const formattedDate = formatMonthYear(data?.month ?? null, data?.year ?? null);
        const conditionalPropertyDate = data.datetime
            ? data.datetime
            : data.CurrentDatetime
              ? data.CurrentDatetime
              : null;

        return (
            <KPIDetailsNotificationCard
                titleIcon={
                    data.comparisionOperator === '>' ? <KpiIncineIcon /> : <KpiDeclineIcon />
                }
                activityType={status}
                titleText={getKpiCardTitle(data)}
                subtitleText={
                    conditionalPropertyDate ? formatNotificationDate(conditionalPropertyDate) : ''
                }
                currentUser="Current User"
                date={formattedDate}
                currentValue={data?.current_value ? data?.current_value : '0'}
                targetText={data.target ? data.target : data.delta ? data.delta : '0'}
                trendType={data.comparisionOperator ?? '>'}
                type={notificationType.toLowerCase()}
                comparsionValue={data?.ValueLastMonth ? data?.ValueLastMonth : '0'}
                ComparisionText={'PM'}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
                conditionValue={data.Conditionvalue}
            />
        );
    };

const getForumRequestCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        const data = safeParse<IForumRequestNotificationJSONType>(json, 'getForumRequestCard');
        if (!data) return <></>;

        return (
            <NotificationCard
                activityType={status}
                showToast={msg => setShowSuccessToast(msg)}
                titleText={`New Forum Access Request`}
                subtitleText={formatNotificationDate(data.datetime)}
                bodyElement={
                    <Flex className={'role-notification-card-body-text'}>
                        {data.status && data.status == 'Pending' && (
                            <div>
                                {data.fullName } has requested access for the forum below.<br/>
                                Take action on the request by clicking on the forum.
                                <div>
                                <Card 
                               variant='status'
  title={`${data.forumName} | `}
  description={`${data.level} | ${data.period} | ${data.geography}`}
/>
                            </div>
                            </div>
                            
                        )}
                    </Flex>
                }
                showIcon={true}
                icon={
                    <div className={styles['icon-background']}>
                        <Icon size="xm" color="graph-blue-color" name="user-left-02" />
                    </div>
                }
                type={notificationType}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
                onCardClick={() => {
                 
                    openApprovalsFromNotifications();
                }}
            />
        );
    };

 const getForumRequestStatusUpdateCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        const data = safeParse<IForumRequestNotificationJSONType>(json, 'getForumRequestStatusUpdateCard');
        if (!data) return <></>;

        return (
            <NotificationCard
                activityType={status}
                showToast={msg => setShowSuccessToast(msg)}
                titleText={`Forum Access request ${data.status}`}
                subtitleText={formatNotificationDate(data.datetime)}
                bodyElement={
                    <Flex className={'role-notification-card-body-text'}>
                        {data.status &&  (
                            <div>
                               Your access request for forum 
                                <span className="bold-title"> {data.forumName} | {data.level} | {data.period} | {data.geography} </span> 
                                has been {data.status}.
                            </div>
                        )}
                    </Flex>
                }
                showIcon={true}
                icon={
                    <div className={styles['icon-background']}>
                        <Icon size="xm" color="graph-blue-color" name="user-left-02" />
                    </div>
                }
                type={notificationType}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
            />
        );
    };



    function getApplicationNotificationCardTitle(type: NOTIFICATION_TRIGGER_TYPE): string {
        switch (type) {
            case NOTIFICATION_TRIGGER_TYPE.Application_ACCESS_ADDED:
                return 'Application Access Added';
            case NOTIFICATION_TRIGGER_TYPE.Application_ACCESS_REMOVED:
                return 'Application Access Removed';
            case NOTIFICATION_TRIGGER_TYPE.APPLICATION_UPDATE:
                return 'Application Updated.';
            case NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_ADD:
                return 'Application Permission Added.';
            case NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_REMOVE:
                return 'Application Permission Removed.';
            case NOTIFICATION_TRIGGER_TYPE.APPLICATION_UNAVALIABLE:
                return 'Application Unavailable.';
            case NOTIFICATION_TRIGGER_TYPE.TOOL_PERMISSION_REMOVED:
                return 'Tool Permission Removed.';
            case NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_UPDATE:
                return 'Application Permission Updated.';
            default:
                return 'You have a new notification.';
        }
    }

    function getReportNotificationCardTitle(type: NOTIFICATION_TRIGGER_TYPE): string {
        switch (type) {
            case NOTIFICATION_TRIGGER_TYPE.REPORT_ACCESS_ADDED:
                return 'Report Access Added.';
            case NOTIFICATION_TRIGGER_TYPE.REPORT_ACCESS_REMOVED:
                return 'Report Access Removed.';
            case NOTIFICATION_TRIGGER_TYPE.REPORT_UPDATE:
                return 'Report Updated.';
            case NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_ADDED:
                return 'Report Permission Added.';
            case NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_REMOVED:
                return 'Report Permission Removed.';
            case NOTIFICATION_TRIGGER_TYPE.REPORT_UNAVALIABLE:
                return 'Report Unavailable.';
            case NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_UPDATE:
                return 'Report Permission Updated.';
            default:
                return 'You have a new notification.';
        }
    }

    function getApplicationNotificationCardIcon(type: NOTIFICATION_TRIGGER_TYPE): JSX.Element {
        switch (type) {
            case NOTIFICATION_TRIGGER_TYPE.Application_ACCESS_ADDED:
                return <ApplicationAccessAddedRemovedUpdatedIcon />;
            case NOTIFICATION_TRIGGER_TYPE.Application_ACCESS_REMOVED:
                return <ApplicationAccessAddedRemovedUpdatedIcon />;
            case NOTIFICATION_TRIGGER_TYPE.APPLICATION_UPDATE:
                return <ApplicationAccessAddedRemovedUpdatedIcon />;
            case NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_ADD:
                return <ApplicationPermissionAddedIcon />;
            case NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_REMOVE:
                return <ApplicationPermissionRemovedIcon />;
            case NOTIFICATION_TRIGGER_TYPE.APPLICATION_UNAVALIABLE:
                return <ApplicationUnavaliableIcon />;
            default:
                return <ApplicationAccessAddedRemovedUpdatedIcon />;
        }
    }

    function getReportNotificationCardIcon(type: NOTIFICATION_TRIGGER_TYPE): JSX.Element {
        switch (type) {
            case NOTIFICATION_TRIGGER_TYPE.REPORT_ACCESS_ADDED:
                return <ApplicationAccessAddedRemovedUpdatedIcon />;
            case NOTIFICATION_TRIGGER_TYPE.REPORT_ACCESS_REMOVED:
                return <ApplicationAccessAddedRemovedUpdatedIcon />;
            case NOTIFICATION_TRIGGER_TYPE.REPORT_UPDATE:
                return <ApplicationAccessAddedRemovedUpdatedIcon />;
            case NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_ADDED:
                return <ApplicationPermissionAddedIcon />;
            case NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_REMOVED:
                return <ApplicationPermissionRemovedIcon />;
            case NOTIFICATION_TRIGGER_TYPE.REPORT_UNAVALIABLE:
                return <ApplicationUnavaliableIcon />;
            default:
                return <ApplicationAccessAddedRemovedUpdatedIcon />;
        }
    }
    const getNotificationCardsByType = (
        json: string,
        id: number,
        notificationTriggerType: NOTIFICATION_TRIGGER_TYPE,
        notificationType: string,
        status: boolean,
        isGenericNotification?: boolean,
    ): JSX.Element => {
        const data = safeParse<IApplicationNotificationJSONType>(
            json,
            'getNotificationCardsByType',
        );
        if (!data) return <></>;

        const handleViewApplication = () => {};

        return (
            <NotificationCard
                activityType={status}
                titleText={getApplicationNotificationCardTitle(notificationTriggerType)}
                subtitleText={formatNotificationDate(data.datetime)}
                bodyElement={
                    <Flex
                        className={
                            'role-notification-card-body-text application-notification-card-body-jsx'
                        }
                    >
                        <ApplicationNotificationCardBody
                            type={notificationTriggerType}
                            appName={data.appName}
                            roleType={data.roleName}
                        />

                        {notificationTriggerType ===
                            NOTIFICATION_TRIGGER_TYPE.APPLICATION_UPDATE && (
                            <button
                                className="application-notification-view-app-button"
                                onClick={handleViewApplication}
                            >
                                <span className="application-notification-view-app-button-text">
                                    View Application
                                </span>
                            </button>
                        )}
                    </Flex>
                }
                showIcon={true}
                icon={
                    <div className={styles['icon-background']}>
                        {getApplicationNotificationCardIcon(notificationTriggerType)}
                    </div>
                }
                type={notificationType}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
            />
        );
    };

    const getExceptionAssignedCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        const data = safeParse<IExceptionAssignedNotificationJSONType>(
            json,
            'getIssueAssignedCard',
        );
        if (!data) return <></>;
        const checkSubCardTextItems =
            Array.isArray(data.impactedKpis) && data.impactedKpis.length > 0
                ? data.impactedKpis.map(item => ({
                      kpiName: item.kpiName ?? 'N/A',
                      trendIndicator: item.trendIndicator ?? 'N/A',
                      value: item.value ?? 0,
                      unitOfMeasure: item.unitOfMeasure ?? '',
                  }))
                : [];

        const bodyText = [data.region, data.product, data.brand].filter(Boolean);
        const dateText = data.datetime ? formatNotificationDate(data.datetime) : '';
        const getWordArticle = (word: string): string => {
            if (!word) return '';
            const vowels = ['a', 'e', 'i', 'o', 'u'];
            return vowels.includes(word.trim().charAt(0).toLowerCase()) ? 'an' : 'a';
        };

        const collaboratorType =
            data.collaboratorType &&
            data.collaboratorType !== 'null' &&
            data.collaboratorType !== 'undefined'
                ? data.collaboratorType
                : 'collaborator';

        const article = getWordArticle(collaboratorType);
        const statusName =
            data.decisionStatusName && data.decisionStatusName.trim() !== ''
                ? data.decisionStatusName
                : data.DecisionStatusName && data.DecisionStatusName.trim() !== ''
                  ? data.DecisionStatusName
                  : null;
        return (
            <IssueRiskOppNotificationCard
                titleIcon={<IRONotificationIcon />}
                activityType={status}
                header={
                    <Flex className={'role-notification-card-body-text'}>
                        <div>
                            {data?.status === 'Decision Status updated' ? (
                                <>
                                    <span className="bold-title">{data.status}</span> for the
                                    following {data.exceptionType}
                                </>
                            ) : data?.sectionTitle ? (
                                <>
                                    <span className="bold-title">{data.sectionTitle}</span> section
                                    assigned for issue : {data.exceptionTitle}
                                </>
                            ) : (
                                <>
                                    You have been added as {article}
                                    <span className="bold-title"> {collaboratorType} </span> in the
                                    following {data.exceptionType}
                                </>
                            )}
                        </div>
                    </Flex>
                }
                subtitleText={dateText || ''}
                bodyText={bodyText || ''}
                currentUser="ABC"
                subCardHeaderText={data.kpiImpact || ''}
                subCardPrimaryText={data.exceptionTitle || ''}
                subCardSecondaryText={data.exceptionId || ''}
                subCardTextItems={checkSubCardTextItems}
                actionStatus={data.actionStatus}
                actionText={statusName || 'Action Implementation'}
                onClose={() => {}}
                type={notificationType.toLowerCase()}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
                priority={data.priority ? data.priority : 'medium'}
                exceptionType={data.exceptionType}
                exceptionDescription={data.exceptionDescription}
                onCardClick={
                    data.exceptionId
                        ? () => openRiskOpportunityFromNotification(data.exceptionId)
                        : undefined
                }
            />
        );
    };

    const getIssueRuleCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        const data = safeParse<IIssueRuleNotificationJsonType>(json, 'getIssueRuleCard');
        if (!data) return <></>;
        const bodyText = [data.region, data.product, data.brand].filter(Boolean);
        const dateText = data.datetime ? formatNotificationDate(data.datetime) : '';

        const hasValidIssues =
            Array.isArray(data.issues) &&
            data.issues.length > 0 &&
            data.issues.every(issue => issue && typeof issue === 'object');
        const issueCount = hasValidIssues ? data.issues.length : 0;
        const issueLabel = issueCount > 1 ? 'issues' : 'issue';
        const issueDisplay =
            issueCount && issueCount > 0 ? `${issueCount} ${issueLabel}` : '? issue';

        return (
            <IssureRuleNotificationCard
                titleIcon={<IRONotificationIcon />}
                activityType={status}
                header={
                    <Flex className={'role-notification-card-body-text'}>
                        <div>
                            <span className="bold-title">
                                {' '}
                                {issueDisplay} : {data.kpiimpact}{' '}
                            </span>
                        </div>
                    </Flex>
                }
                subtitleText={dateText || ''}
                bodyText={bodyText || ''}
                currentUser="ABC"
                issues={hasValidIssues ? data.issues : []}
                onClose={() => {}}
                type={notificationType.toLowerCase()}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
                subCardHeader={data.kpiimpact}
            />
        );
    };

    const isValidData = (data: string | null | undefined): boolean =>
        data !== null &&
        data !== undefined &&
        data.trim() !== '' &&
        data.trim().toLowerCase() !== 'null';

    const getReportNotificationCardsByType = (
        json: string,
        id: number,
        notificationTriggerType: NOTIFICATION_TRIGGER_TYPE,
        notificationType: string,
        status: boolean,
        isGenericNotification?: boolean,
    ): JSX.Element => {
        const data = safeParse<IReportNotificationJSONType>(
            json,
            'getReportNotificationCardsByType',
        );
        if (!data) return <></>;
        const handleViewApplication = () => {
            navigate(
                `/digital-tools-library/${data.reportId}/${encodeURIComponent(data.reportName)}`,
            );
        };

        return (
            <NotificationCard
                activityType={status}
                titleText={getReportNotificationCardTitle(notificationTriggerType)}
                subtitleText={formatNotificationDate(data.datetime)}
                bodyElement={
                    <Flex
                        className={
                            'role-notification-card-body-text application-notification-card-body-jsx'
                        }
                    >
                        <ReportNotificationCardBody
                            type={notificationTriggerType}
                            reportName={data.reportName}
                            roleType={data.roleName}
                        />

                        {notificationTriggerType === NOTIFICATION_TRIGGER_TYPE.REPORT_UPDATE && (
                            <button
                                className="application-notification-view-app-button"
                                onClick={handleViewApplication}
                            >
                                <span className="application-notification-view-app-button-text">
                                    View Report
                                </span>
                            </button>
                        )}
                    </Flex>
                }
                showIcon={true}
                icon={
                    <div className={styles['icon-background']}>
                        {getReportNotificationCardIcon(notificationTriggerType)}
                    </div>
                }
                type={notificationType.toLowerCase()}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
            />
        );
    };

    const getIssueActionOverdueCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        const data = safeParse<IIssueActionOverdueJSON>(json, 'getIssueActionOverdueCard');
        if (!data) return <></>;

        return (
            <NotificationCard
                activityType={status}
                titleText={`Issue Action(s) Overdue`}
                subtitleText={formatNotificationDate(data.datetime)}
                bodyElement={
                    <Flex className={'role-notification-card-body-text issue-overdue-container'}>
                        <div className="overdue-action-issueid">
                            Issue Id # {data.issueId || 0}{' '}
                        </div>

                        {data.overdueActions &&
                            data.overdueActions.map((action, index) => (
                                <div key={index} className="overdue-action-container">
                                    <div className="overdue-action-item">
                                        <div className="overdue-action-title">
                                            {action.actionTitle || ' '}
                                        </div>
                                        <div className="overdue-action-subtitle">
                                            <div className="overdue-action-subtitle-assigned-to">
                                                Assigned to {action.assignedTo || ' '}
                                            </div>
                                            <div>{<DotSeperator />}</div>
                                            <div className="overdue-action-subtitle-duedate">
                                                Due by {action.dueDate || ' '}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="overdue-status"> Overdue </div>
                                </div>
                            ))}
                    </Flex>
                }
                showIcon={true}
                icon={
                    <div className={styles['icon-background']}>
                        <IssueOverDueIcon />
                    </div>
                }
                type={notificationType.toLowerCase()}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
            />
        );
    };

    const getToDoOverdueCard = (
        json: string,
        id: number,
        status: boolean,
        isGenericNotification: boolean | undefined,
        notificationType: string,
    ): JSX.Element => {
        const data = safeParse<NotificationData>(json, 'getToDoOverdueCard');
        if (!data) return <></>;

        const dateText = data.datetime ? formatNotificationDate(data.datetime) : '';
        return (
            <NotificationCardContent
                data={data}
                titleIcon={<ToDoCheckDone />}
                id={id}
                activityType={status}
                header={
                    <Flex className={'role-notification-card-body-text'}>
                        <div>
                            {data.type === 'Due' ? (
                                <span>
                                    <strong>
                                        To-Do due in {data.dueInDays} day
                                        {data.dueInDays > 1 ? 's' : ''}
                                    </strong>
                                </span>
                            ) : (
                                <span>
                                    <strong>
                                        To-Do {Math.abs(data.dueInDays)} day
                                        {data.dueInDays > 1 ? 's' : ''} overdue
                                    </strong>
                                </span>
                            )}
                        </div>
                    </Flex>
                }
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
                type={notificationType.toLowerCase()}
                subtitleText={dateText || ''}
                onFilterChange={() => {}}
            />
        );
    };

    const getSectionActionNotificationCard = (
        json: string,
        id: number,
        status: boolean,
        isGenericNotification: boolean | undefined,
        notificationType: string,
        triggerType: string,
    ): JSX.Element => {
        const data = safeParse<NotificationToDoData>(json, 'getSectionActionNotificationCard');
        if (!data) return <></>;
        const dateText = data.datetime ? formatNotificationDate(data.datetime) : '';
        return (
            <ToDoActionSectionNotificationCardContent
                data={data}
                titleIcon={<ToDoCheckDone />}
                id={id}
                activityType={status}
                header={
                    <Flex className={'role-notification-card-body-text'}>
                        <div>
                            {' '}
                            {triggerType === 'Exception Action Assigned' ? (
                                <span>
                                    <strong>Action</strong> assigned for {data.exceptionType}:{' '}
                                    <strong>{data.exceptionTitle}</strong>
                                </span>
                            ) : triggerType === 'Exception Section Assigned' ? (
                                <span>
                                    <strong>{data.sectionName}</strong> section assigned for{' '}
                                    {data.exceptionType}: <strong>{data.exceptionTitle}</strong>
                                </span>
                            ) : (
                                <></>
                            )}
                        </div>
                    </Flex>
                }
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
                type={notificationType.toLowerCase()}
                subtitleText={dateText || ''}
                //onFilterChange={() => {}}
                exceptionType={data.exceptionType}
            />
        );
    };

    const getActionStatusUpdatedCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        const data = safeParse<IExceptionAssignedNotificationJSONType>(
            json,
            'getActionStatusUpdatedCard',
        );
        if (!data) return <></>;

        return (
            <NotificationCard
                activityType={status}
                titleText={`Action Status Updated`}
                subtitleText={formatNotificationDate(data.datetime)}
                bodyElement={
                    <Flex className={'role-notification-card-body-text issue-overdue-container'}>
                        <div className="action-status-updated-title">
                            The status of following actions has been updated for{' '}
                            <strong>
                                {' '}
                                {data.exceptionType}: #{data.exceptionId} |{' '}
                                {data.exceptionTitle}{' '}
                            </strong>
                        </div>

                        {data.actionStatus &&
                            data.actionStatus.map((action, index) => (
                                <div key={index} className="overdue-action-container">
                                    <div className={styles['action-status-update-item']}>
                                        <Flex justify="space-between" align="center">
                                            <div className="overdue-action-title">
                                                {action.actionTitle || ' '}
                                            </div>
                                            {action.actionStatus === 'Overdue' && (
                                                <Status size="S" text="Overdue" type="Warning" />
                                            )}
                                            {action.actionStatus === 'Not Started' && (
                                                <Status
                                                    size="S"
                                                    text="Not Started"
                                                    type="Neutral2"
                                                />
                                            )}
                                            {action.actionStatus === 'In Progress' && (
                                                <Status
                                                    size="S"
                                                    text="In Progress"
                                                    type="Neutral3"
                                                />
                                            )}
                                            {action.actionStatus === 'Completed' && (
                                                <Status
                                                    size="S"
                                                    text="Completed"
                                                    type="Success"
                                                    icon="check"
                                                />
                                            )}
                                        </Flex>

                                        <Flex
                                            justify="flex-start"
                                            gap={6}
                                            className={styles['action-status-update-subtitle']}
                                        >
                                            <div>Assigned to {action.actionOwnerName || ' '}</div>
                                            <div>{<DotSeperator />}</div>
                                            <div>Due by {action.dueDate || ' '}</div>
                                        </Flex>
                                    </div>
                                </div>
                            ))}
                    </Flex>
                }
                showIcon={true}
                icon={
                    <div className={styles['icon-background']}>
                        <IssueOverDueIcon />
                    </div>
                }
                type={notificationType.toLowerCase()}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
                onCardClick={
                    data.exceptionId
                        ? () => openRiskOpportunityFromNotification(data.exceptionId)
                        : undefined
                }
            />
        );
    };

    const getAllActionsCompleteCard = ({
        json,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
        const data = safeParse<IExceptionAssignedNotificationJSONType>(
            json,
            'getAllActionsCompleteCard',
        );
        if (!data) return <></>;
        const checkSubCardTextItems =
            Array.isArray(data.impactedKpis) && data.impactedKpis.length > 0
                ? data.impactedKpis.map(item => ({
                      kpiName: item.kpiName ?? 'N/A',
                      trendIndicator: item.trendIndicator ?? 'N/A',
                      value: item.value ?? 0,
                      unitOfMeasure: item.unitOfMeasure ?? '',
                  }))
                : [];

        const bodyText = [
            `All actions are completed for the ${data.exceptionType} below. Assign more actions if required or close the ${data.exceptionType} by changing the decision status to resolved.`,
        ];
        const dateText = data.datetime ? formatNotificationDate(data.datetime) : '';
        const statusName =
            data.decisionStatusName && data.decisionStatusName.trim() !== ''
                ? data.decisionStatusName
                : data.DecisionStatusName && data.DecisionStatusName.trim() !== ''
                  ? data.DecisionStatusName
                  : null;
        return (
            <IssueRiskOppNotificationCard
                titleIcon={<IRONotificationIcon />}
                activityType={status}
                header={
                    <Flex className={'role-notification-card-body-text'}>
                        <div>
                            <>
                                <span className="bold-title">All actions completed</span>
                            </>
                        </div>
                    </Flex>
                }
                subtitleText={dateText || ''}
                bodyText={bodyText || ''}
                currentUser="ABC"
                subCardHeaderText={data.kpiImpact || ''}
                subCardPrimaryText={data.exceptionTitle || ''}
                subCardSecondaryText={data.exceptionId || ''}
                subCardTextItems={checkSubCardTextItems}
                actionStatus={data.actionStatus}
                actionText={statusName || 'Action Implementation'}
                onClose={() => {}}
                type={notificationType.toLowerCase()}
                id={id}
                removeNotificationCard={removeNotificationCard}
                isGenericNotification={isGenericNotification}
                priority={data.priority ? data.priority : 'medium'}
                exceptionType={data.exceptionType}
                exceptionDescription={data.exceptionDescription}
                onCardClick={
                    data.exceptionId
                        ? () => openRiskOpportunityFromNotification(data.exceptionId)
                        : undefined
                }
            />
        );
    };

    const getMentionNotificationCard = ({
        json,
        createdBy,
        id,
        notificationType,
        isGenericNotification,
        status,
    }: INotificationCardProps): JSX.Element => {
      const data = safeParse<IMentionNotificationJSONType>(
        json,
        "getMentionNotificationCard"
      ); 
  
      if (!data) return <></>;

      return (
        <MentionNotificationCard
            firstName={data.taggedByFirstName}
            lastName={data.taggedByLastName}
            imageUrl={createdBy ? images[createdBy.toLowerCase()] : ""}
            createdDate={formatNotificationDate(data.taggedOn)}
            comment={data.commentText}
            taggedUsers={data.taggedUsers}
            id={id}
            removeNotificationCard={removeNotificationCard}
            isGenericNotification={isGenericNotification}
            type={notificationType.toLowerCase()}
            activityType={status}
        />
      );
    };

    const triggerTypeMap: Record<string, (props: INotificationCardProps) => JSX.Element> = {
        [NOTIFICATION_TRIGGER_TYPE.ROLE_ASSIGNED]: props =>
            isValidData(props.json) ? getRoleAssignedCard(props) : <></>,
        [NOTIFICATION_TRIGGER_TYPE.ROLE_UNAVAILABLE]: props =>
            isValidData(props.json) ? getRoleUnavailableCard(props) : <></>,
        [NOTIFICATION_TRIGGER_TYPE.ROLE_REVOKED]: props =>
            isValidData(props.json) ? getRevokedCard(props) : <></>,
        [NOTIFICATION_TRIGGER_TYPE.ISSUE_COMMENT]: props =>
            isValidData(props.json) ? getIssueCommentCard(props) : <></>,
        [NOTIFICATION_TRIGGER_TYPE.KPI]: props =>
            isValidData(props.json) ? getKPIDetailCard(props) : <></>,
        [NOTIFICATION_TRIGGER_TYPE.FORUM_REQUEST] : props =>
            isValidData(props.json) ? getForumRequestCard(props) : <></>,
        [NOTIFICATION_TRIGGER_TYPE.FORUM_REQUEST_UPDATE] : props =>
            isValidData(props.json) ? getForumRequestStatusUpdateCard(props) : <></>,
        
        [NOTIFICATION_TRIGGER_TYPE.MENTION_NOTIFICATION]: props =>
        isValidData(props.json)? getMentionNotificationCard(props): <></>,

        [NOTIFICATION_TRIGGER_TYPE.Application_ACCESS_ADDED]: props =>
            isValidData(props.json) ? (
                getNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.Application_ACCESS_ADDED,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.Application_ACCESS_REMOVED]: props =>
            isValidData(props.json) ? (
                getNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.Application_ACCESS_REMOVED,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.APPLICATION_UPDATE]: props =>
            isValidData(props.json) ? (
                getNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.APPLICATION_UPDATE,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_ADD]: props =>
            isValidData(props.json) ? (
                getNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_ADD,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_REMOVE]: props =>
            isValidData(props.json) ? (
                getNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_REMOVE,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.APPLICATION_UNAVALIABLE]: props =>
            isValidData(props.json) ? (
                getNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.APPLICATION_UNAVALIABLE,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),

        [NOTIFICATION_TRIGGER_TYPE.EXCEPTION_ASSIGNED]: props =>
            isValidData(props.json) ? getExceptionAssignedCard(props) : <></>,

        [NOTIFICATION_TRIGGER_TYPE.ISSUE_DECISION]: props =>
            isValidData(props.json) ? getExceptionAssignedCard(props) : <></>,
        [NOTIFICATION_TRIGGER_TYPE.ROLE_DETACTIVATE]: props =>
            isValidData(props.json) ? getRoleDeactivatedCard(props) : <></>,
        [NOTIFICATION_TRIGGER_TYPE.TOOL_PERMISSION_REMOVED]: props =>
            isValidData(props.json) ? getToolPermissionRemovedCard(props) : <></>,

        //  [NOTIFICATION_TRIGGER_TYPE.TODO_OVERDUE]: props =>
        //     isValidData(props.json) ? getToDoOverdueCard(props) : <></>,

        [NOTIFICATION_TRIGGER_TYPE.TODO_OVERDUE]: props =>
            isValidData(props.json) ? (
                getToDoOverdueCard(
                    props.json,
                    props.id,
                    props.status,
                    props.isGenericNotification,
                    props.notificationType,
                )
            ) : (
                <></>
            ),

        [NOTIFICATION_TRIGGER_TYPE.TODO_SECTION]: props =>
            isValidData(props.json) ? (
                getSectionActionNotificationCard(
                    props.json,
                    props.id,
                    props.status,
                    props.isGenericNotification,
                    props.notificationType,
                    NOTIFICATION_TRIGGER_TYPE.TODO_SECTION,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.TODO_ACTION]: props =>
            isValidData(props.json) ? (
                getSectionActionNotificationCard(
                    props.json,
                    props.id,
                    props.status,
                    props.isGenericNotification,
                    props.notificationType,
                    NOTIFICATION_TRIGGER_TYPE.TODO_ACTION,
                )
            ) : (
                <></>
            ),

        [NOTIFICATION_TRIGGER_TYPE.REPORT_ACCESS_ADDED]: props =>
            isValidData(props.json) ? (
                getReportNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.REPORT_ACCESS_ADDED,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.REPORT_ACCESS_REMOVED]: props =>
            isValidData(props.json) ? (
                getReportNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.REPORT_ACCESS_REMOVED,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.REPORT_UPDATE]: props =>
            isValidData(props.json) ? (
                getReportNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.REPORT_UPDATE,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_ADDED]: props =>
            isValidData(props.json) ? (
                getReportNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_ADDED,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_REMOVED]: props =>
            isValidData(props.json) ? (
                getReportNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_REMOVED,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.REPORT_UNAVALIABLE]: props =>
            isValidData(props.json) ? (
                getReportNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.REPORT_UNAVALIABLE,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_UPDATE]: props =>
            isValidData(props.json) ? (
                getNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_UPDATE,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_UPDATE]: props =>
            isValidData(props.json) ? (
                getReportNotificationCardsByType(
                    props.json,
                    props.id,
                    NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_UPDATE,
                    props.notificationType,
                    props.status,
                    props.isGenericNotification,
                )
            ) : (
                <></>
            ),
        [NOTIFICATION_TRIGGER_TYPE.ISSUE_OVERDUE]: props =>
            isValidData(props.json) ? getIssueActionOverdueCard(props) : <></>,
        [NOTIFICATION_TRIGGER_TYPE.ISSUE_RULE]: props =>
            isValidData(props.json) ? getIssueRuleCard(props) : <></>,
        [NOTIFICATION_TRIGGER_TYPE.ACTION_STATUS_UPDATED]: props =>
            isValidData(props.json) ? getActionStatusUpdatedCard(props) : <></>,
        [NOTIFICATION_TRIGGER_TYPE.ALL_ACTIONS_COMPLETED]: props =>
            isValidData(props.json) ? getAllActionsCompleteCard(props) : <></>,
    };

    const renderCards = (data: IUserNotifications[]): JSX.Element => {
        if (!data || data.length === 0) return <></>;
        return (
            <>
                {data.map(item => {
                    const props: INotificationCardProps = {
                        json: item?.notificationText,
                        id: item.id,
                        notificationType: item.NotificationType,
                        isGenericNotification: item.isGenericNotification,
                        status: item.status,
                        createdBy: item.createdBy,
                        createdOn: item.createdOn,
                    };

                    return (
                        <React.Fragment key={item.id}>
                            {triggerTypeMap[item.triggerType]?.(props)}
                        </React.Fragment>
                    );
                })}
            </>
        );
    };

    const getPayloadForDeletingNotification = (id: number) => {
        const result = {
            isGenericNotification: false,
            notificationType: '',
        };
        let dataToFilter: IUserNotifications[] = [];
        if (selectedTabName === FLYOUT_TAB_ITEM_KEYS.Notices) {
            dataToFilter = notifications;
        } else if (selectedTabName === FLYOUT_TAB_ITEM_KEYS.Alerts) {
            dataToFilter = alerts;
        } else {
            dataToFilter = warnings;
        }
        dataToFilter
            .filter(data => data.id === id)
            .forEach(data => {
                result.isGenericNotification = data.isGenericNotification;
                result.notificationType = data.NotificationType;
            });
        return result;
    };

    const removeNotificationCard = async (id: number) => {
        let removedType: 'Notification' | 'Alert' | 'Warning' = 'Notification';

        if (selectedTabName === FLYOUT_TAB_ITEM_KEYS.Alerts) {
            removedType = 'Alert';
        } else if (selectedTabName === FLYOUT_TAB_ITEM_KEYS.Warnings) {
            removedType = 'Warning';
        }

        try {
            setShowLoader(true);

            const { isGenericNotification, notificationType } =
                getPayloadForDeletingNotification(id);

            const response = await deleteNotificationByIdAndType(
                id,
                notificationType,
                isGenericNotification,
            );

            if (response.statusCode === 200) {
                setShowSuccessToast(MESSAGES.REMOVAL_SUCCESS_MESSAGE(removedType));
                dispatch(fetchUserNotifications(showUnreadOnly));
                dispatch(fetchNotificationTotalCount());
            } else {
                setShowSuccessToast(MESSAGES.REMOVAL_ERROR_MESSAGE(removedType));
            }
        } catch {
            setShowSuccessToast(MESSAGES.REMOVAL_ERROR_MESSAGE(removedType));
        } finally {
            setShowLoader(false);
        }
    };

    return (
        <>
            <Flyout
                dataTestId="notification-flyout"
                id="notifications-bell-icon-flyout"
                flyoutOpen={isFlyoutOpen}
                direction={'right'}
                heading=""
                content={getFlyoutContent()}
                cancelIconClick={onClickHandlerForFlyoutCancelIcon}
                className={styles['notifications-bell-icon-flyout']}
                containerMaxWidth="475px"
                onBackDropClick={() => {
                    !showNotificationActionpopup && onClickHandlerForFlyoutCancelIcon();
                }}
            />

            <Toast
                toggle={!!showSuccessToast}
                type="Delete"
                message={showSuccessToast}
                mode="Top Right"
                distance="x5l"
                onCloseToast={() => setShowSuccessToast('')}
                timer={5000}
                className={styles['toast-container-notification-panel']}
            />
            {toastConfig.visible && (
                <Toast
                    distance="x5l"
                    message={toastConfig.message}
                    mode="Top Right"
                    onCloseToast={() => setToastConfig({ ...toastConfig, visible: false })}
                    toggle
                    type={toastConfig.type}
                    timer={5000}
                    title={''}
                />
            )}
        </>
    );
}

export default NotificationsBellIconFlyout;
