import React, { useRef } from 'react';
import { Card, Typography, Flex, Divider } from 'antd';
import styles from './IssueRiskOppNotificationCard.module.scss';
import {
    CloseIcon,
    ExpandArrow,
    ExpandArrowUp,
    NegativeRecommType,
} from '../../../assets/icons/icons';
import { ToolTip2 } from 'konnect-react-components';
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
import { formatDueDate, stripHtmlWithRegex } from '../../../utils/helpers';
import { notificationMarkAsRead } from '../../../services/alertnotificationRules';
import { useExpandableCard } from '../../../utils/useExpandableCard';
import { tabFromType } from '../../../utils/tabUtils';
import { EllipsisWithTooltip } from '../../atoms';

const { Text } = Typography;

type IActionStatus = {
    issueId: string | "";
    actionTitle: string | "";
    actionId?: any;
    actionOwnerName: string | "";
    assignedTo: string | "";
    actionDescription: string | "";
    status: string | "";
    dueDate: string | "";
    logDate: string | "";
    updatedOn?: string | "";
    statusName?:string |""
};

interface IssueRiskOppNotificationCardProps {
    titleIcon: JSX.Element | null;
    activityType: boolean | null;
    header: JSX.Element | null;
    subtitleText: string | "";
    bodyText: string[] | [];
    currentUser: string | "";
    onClose: () => void;
    type?: string | "";
    id: number;
    removeNotificationCard: (id: number) => void;
    isGenericNotification?: boolean;
    issues: IssueItem[];
    subCardHeader?: string | "";
}


interface IssueItem {
    kpiimpact: string;
    issueTitle?: string;
    issueId: string;
    description?: string | "";
    issueActions?: IActionStatus[] | [];
    actionText?: string;
    decisionStatusName?: string | "";
    priority?: string | "high";
}

const IssureRuleNotificationCard: React.FC<IssueRiskOppNotificationCardProps> = ({
    titleIcon,
    activityType,
    header,
    subtitleText,
    bodyText,
    type,
    id,
    removeNotificationCard,
    isGenericNotification,
    issues,
    subCardHeader,
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

    const MAX_VISIBLE_ACTIONS = 5;

    const GetActionStatus = ({ actionStatus }: { actionStatus: IActionStatus[] }) => {
        if (actionStatus.length === 0) return <></>;


    const sorted = [...actionStatus].sort((a, b) => {
        const statusA = a.status || a.statusName || '';
        const statusB = b.status || b.statusName || '';
        return statusA.localeCompare(statusB);
    });
        const visibleActions = sorted.slice(0, MAX_VISIBLE_ACTIONS);
        const remainingCount = sorted.length - MAX_VISIBLE_ACTIONS;

        return (
            <div className={styles['action-status-container']}>
                {visibleActions.map((item, index) => {
                    const status = item.status || item.statusName || 'In Progress';
                   return ( <ToolTip2
                        key={index}
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
                        wrapperComponent={
                            <div  >
                                <GetActionIcon status={status} />
                            </div>
                        }  
                    /> ); 
                })} 
                {remainingCount > 0 && (
                    <div className={styles['extra-action-count']}>+{remainingCount}</div>
                )} 
            </div>
        ); 
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
        <Card className="notification-card-container"
            onClick={async () => {
                await toggleExpand();
                await handleCardClick();
            }}
            hoverable ref={rootRef as any} data-notif-id={id}>
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
                            onClick={toggleExpand}
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


                        <>
                            {issues.map((issue, idx) => (
                                <Flex key={idx} className={styles['iso-card-body']}>
                                    <Flex className={styles['iso-card-body-primary']}>
                                        <div className={styles['iso-card-body-primary-title']}>
                                            {subCardHeader}
                                        </div>
                                    </Flex>

                                    <Flex className={styles['iso-card-body-secondary']}>
                                        <div className={styles['iso-card-body-secondary-s1']}>
                                            <div className={styles['iso-card-body-secondary-s1-text-grp']}>
                                                <div className={styles['iso-card-body-s1-text-t1']}>
                                                    {issue.issueTitle && (
                                                        <EllipsisWithTooltip text={String(issue.issueTitle)} />
                                                    )}
                                                </div>
                                                <div className={styles['iso-card-body-s1-text-t2']}>
                                                    Issue Id #{issue.issueId}
                                                </div>
                                            </div>

                                            {issue.priority && <GetPriorityIcon
                                                priority={issue.priority.toLowerCase() ?? ""} />}
                                        </div>

                                        <div className={styles['iso-card-body-secondary-s2']}>
                                            {issue?.description?.trim() ? (
                                                <p className={styles['truncate-text']}>{stripHtmlWithRegex(issue.description)}</p>
                                            ) : ""}
                                        </div>

                                        <span className={'iso-card-body-secondary-s2-divider'}>
                                            <Divider />
                                        </span>

                                        <div className={styles['iso-card-body-secondary-s3']}>
                                            <div className={styles['iso-card-body-secondary-s3-icon-group']}>
                                                {issue.issueActions && <GetActionStatus actionStatus={issue.issueActions} />}
                                            </div>
                                            <div className={styles['iso-card-body-secondary-s3-tag']}>
                                                {issue.decisionStatusName ? issue.decisionStatusName : ""}
                                            </div>
                                        </div>
                                    </Flex>
                                </Flex>
                            ))}
                        </>



                    </>
                )}
            </Flex>
        </Card>
    );
};

export default IssureRuleNotificationCard;
