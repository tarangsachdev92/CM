import React, { useRef } from 'react';
import { Card, Typography, Flex, Divider } from 'antd';
import styles from './IssueRiskOppNotificationCard.module.scss';
import {
    CloseIcon,
    ExpandArrow,
    ExpandArrowUp,
    NegativeRecommType,
    NotificationCardSeperatorLine,
} from '../../../assets/icons/icons';
import { Icon,  ToolTip2 } from 'konnect-react-components';
import {
    CompletedActionIcon,
    CriticalPriorityIcon,
    DueTodayActionIcon,
    HighPriorityIcon,
    InProgressActionIcon,
    LowPriorityIcon,
    MediumPriorityIcon,
    NotStartedActionIcon,
    OverDueActionIcon,
} from '../../../assets/images/images';
import { formatDueDate } from '../../../utils/helpers';
import { notificationMarkAsRead } from '../../../services/alertnotificationRules';
import { TrendIndicator } from '../../../utils/constants';
import EllipsisWithTooltipNotification from '../../atoms/ellipsis-with-tooltip/EllipsisWithTooltipNotification';
import { useExpandableCard } from '../../../utils/useExpandableCard';
import { tabFromType } from '../../../utils/tabUtils';
import { EllipsisWithTooltip } from '../../atoms';

const { Text } = Typography;

interface subCardTextItems {
    kpiName: string;
    value: number;
    trendIndicator: string;
    unitOfMeasure: string;
}

type IActionStatus = {
    issueId: string;
    actionTitle: string;
    actionId?: any;
    actionOwnerName: string;
    assignedTo: string;
    actionDescription: string;
    status?:string;
    statusName?: string;
    dueDate: string;
    logDate: string;
    updatedOn?: string;
    actionStatus?:string;

};

interface IssueRiskOppNotificationCardProps {
    titleIcon: JSX.Element;
    activityType: boolean;
    header: JSX.Element;
    subtitleText: string;
    bodyText: string[];
    currentUser: string;
    subCardHeaderText: string;
    subCardPrimaryText: string;
    subCardSecondaryText: string;
    subCardTextItems?: subCardTextItems[];
    actionStatus?: IActionStatus[];
    actionText: string;
    onClose: () => void;
    type?: string;
    id: number;
    removeNotificationCard: (id: number) => void;
    isGenericNotification?: boolean;
    priority?:string | "medium",
    exceptionType?:string | "Issue",
    exceptionDescription?:string|'',
    onCardClick?: () => void | Promise<void>;
}

const IssueRiskOppNotificationCard: React.FC<IssueRiskOppNotificationCardProps> = ({
    titleIcon,
    activityType,
    header,
    subtitleText,
    bodyText,
    subCardHeaderText,
    subCardPrimaryText,
    subCardSecondaryText,
    subCardTextItems,
    actionStatus,
    actionText,
    type,
    id,
    removeNotificationCard,
    isGenericNotification,
    priority,
    exceptionType,
    exceptionDescription,
    onCardClick
}) => {

    const rootRef = useRef<HTMLDivElement>(null);
    const isGeneric = isGenericNotification ?? false;
    const scrollKey = `notificationScrollTop:${tabFromType(type)}`;

    const { expanded, toggleExpand, handleCardClick } = useExpandableCard({
        id,
        type: type || 'warning',
        isGenericNotification: isGeneric,
        markAsRead: notificationMarkAsRead,
        scrollKey,
        containerSelector: '.notification-content-container',
        anchorRef: rootRef,
        tabName: tabFromType(type) as any,
    });

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeNotificationCard(id);
    };
    const GetActionIcon = ({ status }: { status: string }) => {
        switch (status) {
            case 'Overdue':
                return <OverDueActionIcon />;
            case 'Not Started':
                return <NotStartedActionIcon />;
            case 'In Progress':
                return <InProgressActionIcon />;
            case 'Completed':
                return <CompletedActionIcon />;
        }
        return <DueTodayActionIcon />;
    };
 
const GetActionStatus = ({ actionStatus }: { actionStatus: IActionStatus[] }) => {
    if (actionStatus.length > 0) {
        const sorted = [...actionStatus].sort((a, b) => {
            const statusA = a.status || a.statusName || a.actionStatus || '';
            const statusB = b.status || b.statusName || a.actionStatus || '';
            return statusA.localeCompare(statusB);
        });

        return (
            <div className={styles['action-status-container']}>
                {sorted.map((item, index) => {
                    const status = item.status || item.statusName || item.actionStatus || 'In Progress';
                    return (
                        <ToolTip2
                            key={item.actionId || index}
                            direction={index === 0 ? 'Left-Center' : 'Top-Center'}
                            type="HTML Content"
                            outerContainerClass={styles['expanded-row-tooltip-container']}
                            htmlContent={
                                <>
                                    <div className={styles['tooltip-desc-text']}>
                                        Owner:{' '}
                                        <span className={styles['tooltip-desc-text-value']}>
                                            {item.actionOwnerName}
                                        </span>
                                    </div>
                                    <div className={styles['tooltip-desc-text']}>
                                        Status:{' '}
                                        <span className={styles['tooltip-desc-text-value']}>
                                            {status}
                                            {status === 'Completed' && item.updatedOn
                                                ? ` (${formatDueDate(item.updatedOn)})`
                                                : ''}
                                        </span>
                                    </div>
                                    <div className={styles['tooltip-desc-text']}>
                                        Log Date:{' '}
                                        <span className={styles['tooltip-desc-text-value']}>
                                            {formatDueDate(item.logDate)}
                                        </span>
                                    </div>
                                    <div className={styles['tooltip-desc-text']}>
                                        Due Date:{' '}
                                        <span className={styles['tooltip-desc-text-value']}>
                                            {formatDueDate(item.dueDate)}
                                        </span>
                                    </div>
                                </>
                            }
                            wrapperComponent={<GetActionIcon status={status} />}
                        />
                    );
                })}
            </div>
        );
    } else {
        return <></>;
    }
};

  const GetPriorityIcon = ({ priority }: { priority: string }) => {
    switch (priority) {
      case "critical":
        return <CriticalPriorityIcon />;
      case "high":
        return <HighPriorityIcon />;
      case "medium":
        return <MediumPriorityIcon />;
    }
     return <LowPriorityIcon />;
  };

    return (
        <Card
            className="notification-card-container"
            onClick={async () => {
                await handleCardClick();
                if (onCardClick) {
                    await onCardClick();
                    return;
                }
                await toggleExpand();
            }}
            hoverable
            ref={rootRef as any}
            data-notif-id={id}
        >
            <Flex className={styles['iso-card-sub-container']}>
                <Flex className={styles['iso-card-header']}>
                    <Flex className={styles['iso-card-avatar-container']}>
                        <Flex
                            className={`${styles['iso-card-avatar']} ${type ? `notification-icon-type-${type}` : 'notification-icon-type-alert'}`}
                        >
                            <span className={`notification-card-${type}-icon`}>{titleIcon}</span>
                        </Flex>

                        {!activityType && (
                            <div className={styles['iso-card-type']}>
                                <NegativeRecommType />
                            </div>
                        )}
                    </Flex>
                    <Flex className={styles['iso-card-title-container']}>
                        <Flex className={styles['iso-card-title']}>{header}</Flex>
                        <Text className={styles['iso-card-subtitle']}>{subtitleText}</Text>
                    </Flex>
                    <div className={'notification-card-header-action-buttons'}>
                        <div
                            role="none"
                            className={styles['iso-card-expand-icon']}
                            onClick={e => {
                                e.stopPropagation();
                                toggleExpand();
                            }}
                        >
                            {expanded ? <ExpandArrowUp /> : <ExpandArrow />}
                        </div>
                        <div
                            role="none"
                            className={styles['iso-card-close-icon']}
                            onClick={handleClose}
                        >
                            <CloseIcon />
                        </div>
                    </div>
                </Flex>
                {expanded && (
                    <>
                        <Flex className={styles['iso-card-body-text-container']}>
                            <div className={styles['iso-card-body-text']}>
                                <Flex className={styles['iso-card-body-grp']}>
                                    {bodyText.map((text, index) => (
                                        <React.Fragment key={index}>
                                            <span className={styles['iso-card-body-grp-text']}>
                                                {text}
                                            </span>
                                            {index < bodyText.length - 1 && <>|</>}
                                        </React.Fragment>
                                    ))}
                                </Flex>
                            </div>
                        </Flex>
                        <Flex className={styles['iso-card-body']}>
                            <Flex className={styles['iso-card-body-primary']}>
                                <div className={styles['iso-card-body-primary-title']}>
                                    {subCardHeaderText}
                                </div>
                            </Flex>

                            <Flex className={styles['iso-card-body-secondary']}>
                                <div className={styles['iso-card-body-secondary-s1']}>
                                    <div className={styles['iso-card-body-secondary-s1-text-grp']}>
                                        <div className={styles['iso-card-body-s1-text-t1']}>
                                            {subCardPrimaryText && (
                                                <EllipsisWithTooltip
                                                    text={String(subCardPrimaryText)}
                                                />
                                            )}{' '}
                                        </div>
                                        <div className={styles['iso-card-body-s1-text-t2']}>
                                            {exceptionType} ID #{subCardSecondaryText}
                                        </div>
                                    </div>
                                    {priority && (
                                        <GetPriorityIcon priority={priority.toLowerCase() ?? ''} />
                                    )}
                                </div>
                                {exceptionDescription && exceptionDescription !== '' && (
                                    <div className={styles['exception-description']}>{exceptionDescription}</div>
                                )}

                                <div className={styles['iso-card-body-secondary-s2']}>
                                    {subCardTextItems?.map((item, index) => (
                                        <div
                                            key={index}
                                            className={styles['iso-card-secondary-s2-item-grp']}
                                        >
                                            <div
                                                className={
                                                    styles['iso-card-secondary-s2-item-label']
                                                }
                                            >
                                                <EllipsisWithTooltipNotification
                                                    text={String(item.kpiName)}
                                                />
                                            </div>
                                            <div>:</div>
                                            <div
                                                className={
                                                    styles['iso-card-secondary-s2-item-grp-pair']
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles['iso-card-secondary-s2-item-icon-s1']
                                                    }
                                                >
                                                    {item.trendIndicator.toLowerCase() ===
                                                        TrendIndicator.IncreasePositive && (
                                                        <Icon
                                                            name="arrow-up"
                                                            color="status-success-color"
                                                            size="xm"
                                                        />
                                                    )}
                                                    {item.trendIndicator.toLowerCase() ===
                                                        TrendIndicator.IncreaseNegative && (
                                                        <Icon
                                                            name="arrow-up"
                                                            color="status-error-color"
                                                            size="xm"
                                                        />
                                                    )}
                                                    {item.trendIndicator.toLowerCase() ===
                                                        TrendIndicator.DecreasePositive && (
                                                        <Icon
                                                            name="arrow-down"
                                                            color="status-success-color"
                                                            size="xm"
                                                        />
                                                    )}
                                                    {item.trendIndicator.toLowerCase() ===
                                                        TrendIndicator.DecreaseNegative && (
                                                        <Icon
                                                            name="arrow-down"
                                                            color="status-error-color"
                                                            size="xm"
                                                        />
                                                    )}
                                                </div>

                                                <div
                                                    className={
                                                        styles['iso-card-secondary-s2-item-value']
                                                    }
                                                >
                                                    {item.value} {item.unitOfMeasure}
                                                </div>
                                            </div>

                                            {index < subCardTextItems.length - 1 && (
                                                <NotificationCardSeperatorLine />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <span className={'iso-card-body-secondary-s2-divider'}>
                                    <Divider />
                                </span>

                                <div className={styles['iso-card-body-secondary-s3']}>
                                    <div
                                        className={styles['iso-card-body-secondary-s3-icon-group']}
                                    >
                                        {actionStatus && (
                                            <GetActionStatus actionStatus={actionStatus} />
                                        )}
                                    </div>
                                    <div className={styles['iso-card-body-secondary-s3-tag']}>
                                        {actionText}
                                    </div>
                                </div>
                            </Flex>
                        </Flex>{' '}
                    </>
                )}
            </Flex>
        </Card>
    );
};

export default IssueRiskOppNotificationCard;
