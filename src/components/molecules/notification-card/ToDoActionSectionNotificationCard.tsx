import { Card, Flex, Typography } from 'antd';
import React, { useRef } from 'react';
import styles from './ToDoNotificationCard.module.scss';
const { Text } = Typography;
import { notificationMarkAsRead } from '../../../services/alertnotificationRules';
import {
    CloseIcon,
    ExpandArrow,
    ExpandArrowUp,
    NegativeRecommType,
} from '../../../assets/icons/icons';
import { AppReportCard } from 'konnect-react-components';
import { DotView } from '../../../assets/images/images';
//import ToDoFlyout from '../../organisms/todo/ToDoFlyoutCard/ToDoFlyout';
import { useExpandableCard } from '../../../utils/useExpandableCard';
import { tabFromType } from '../../../utils/tabUtils';
interface Task {
    title: string;
    source: string;
    dueDate: string;
    priority: string;
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
}

interface Props {
    data: NotificationToDoData;
    isGenericNotification?: boolean;
    id: number;
    activityType: boolean;
    type?: string;
    titleIcon: JSX.Element;
    header: JSX.Element;
    removeNotificationCard: (id: number) => void;
    subtitleText: string;
    exceptionType:string | "Issue";
}

const ToDoActionSectionNotificationCardContent: React.FC<Props> = ({
    data,
    isGenericNotification,
    activityType,
    id,
    type,
    titleIcon,
    header,
    removeNotificationCard,
    subtitleText,
    exceptionType
}) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const isGeneric = isGenericNotification ?? false;
    const scrollKey = `notificationScrollTop:${tabFromType(type)}`;

    const { expanded, toggleExpand, handleCardClick } = useExpandableCard({
        id,
        type: type || 'notification',
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

    return (
        <>
            <Card
                className="notification-card-container"
                onClick={async e => {
                    e.preventDefault();
                    await toggleExpand();
                    await handleCardClick();
                }}
                hoverable
                ref={rootRef as any}
                data-notif-id={id}
            >
                <Flex className={styles['iso-card-sub-container']}>
                    <Flex className={styles['iso-card-header']}>
                        <Flex className={styles['iso-card-avatar-container']}>
                            <Flex
                                className={`${styles['iso-card-avatar']} ${type ? `notification-icon-type-${type}` : 'notification-icon-type-notification'}`}
                            >
                                <span className={`notification-card-${type}-icon`}>
                                    {titleIcon}
                                </span>
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
                            {/* {data.tasks.map(task => {
                                const isValidTitle = task.title && task.title.trim() !== '';
                                const trimmedTitle = isValidTitle
                                    ? task.title.length > 30
                                        ? task.title.slice(0, 17) + '...'
                                        : task.title
                                    : 'issue name'; */}
                            <AppReportCard
                                defaultIcon="circle"
                                description={
                                    <div style={{ color: '#575757' }}>
                                        &nbsp;
                                        {/* {task.source} <Icon color="neutrals-B70" name="circle" size="s" />&nbsp; */}
                                        {exceptionType} ID #{data.exceptionId}{' '}
                                        <span>
                                            <DotView />
                                        </span>
                                        <span>
                                            {' '}
                                            Due:{' '}
                                            {new Date(data.dueDate).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                }
                                fillColor
                                // onCardClick={() => {}}
                                //onCardClick={() => OpenFlyout()}
                                selectedIcon={data.priority === 'Critical' ? 'flag' : 'flag-02'}
                                selectedIconColor={
                                    data.priority === 'Critical'
                                        ? 'feedback-error-color'
                                        : data.priority === 'High'
                                          ? 'feedback-error-color'
                                          : data.priority === 'Medium'
                                            ? 'feedback-warning-color'
                                            : data.priority === 'Low'
                                              ? 'secondary-blue-300-color'
                                              : 'secondary-blue-300-color'
                                }
                                size="Medium"
                                title={data.todoTitle || data.actionTitle}
                                type="App"
                                className={`${styles.mt10}`}
                                width="100%"
                                showTopLeftLogo={false}
                            />
                            {/* })} */}
                        </>
                    )}
                </Flex>
            </Card>
        </>
    );
};

export default ToDoActionSectionNotificationCardContent;
