import React, { useRef } from 'react';
import { Card, Flex, Typography } from 'antd';
import {
    CloseIcon,
    ExpandArrow,
    ExpandArrowUp,
    NegativeRecommType,
} from '../../../assets/icons/icons';
import { getUserNameInitials } from '../../../utils/helpers';
import styles from './NotificationCard.module.scss';
import { notificationMarkAsRead } from '../../../services/alertnotificationRules';
import { useExpandableCard } from '../../../utils/useExpandableCard';
import { tabFromType } from '../../../utils/tabUtils';

const { Text } = Typography;

interface NotificationCardProps {
    profileImageUrl?: string;
    activityType: boolean;
    titleText: string;
    subtitleText: string;
    bodyElement: JSX.Element;
    fromUser?: string;
    showIcon?: boolean;
    showBorderToBody?: boolean;
    icon?: JSX.Element;
    type?: string;
    id: number;
    removeNotificationCard: (id: number) => void;
    showToast?: (message: string) => void;
    isGenericNotification?: boolean;
    onCardClick?: () => void | Promise<void>;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
    profileImageUrl,
    activityType,
    titleText,
    subtitleText,
    bodyElement,
    fromUser,
    showIcon,
    showBorderToBody,
    icon,
    type,
    id,
    removeNotificationCard,
    isGenericNotification,
    onCardClick,
}) => {

    const rootRef = useRef<HTMLDivElement>(null);
    const isGeneric = isGenericNotification === undefined ? true : isGenericNotification;
    const scrollKey = `notificationScrollTop:${tabFromType(type)}`;

    const { expanded, toggleExpand, handleCardClick } = useExpandableCard({
        id,
        type,
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
        <Card className="notification-card-container"
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
            <Flex className={styles['notification-card-sub-container']} gap={8}>
                <Flex className={styles['notification-card-header']} gap={8}>
                    <Flex className={styles['notification-card-avatar-container']}>
                        {showIcon && icon ? (
                            <div
                                className={`${styles['icon-background']} ${type
                                    ? `notification-icon-type-${type}`
                                    : 'notification-icon-type-notification'
                                    }`}
                            >
                                <span className={`notification-card-${type}-icon`}>{icon}</span>
                            </div>
                        ) : profileImageUrl ? (
                            <img className={styles['notification-card-avatar']} src={profileImageUrl} />
                        ) : (
                            <div className={styles['username-initials-small']}>
                                {getUserNameInitials(fromUser)}
                            </div>
                        )}

                        {!activityType && (
                            <div className={styles['notification-card-type']}>
                                <NegativeRecommType />
                            </div>
                        )}
                    </Flex>
                    <Flex className={styles['notification-card-title-container']}>
                        <Text className={styles['notification-card-title']}>{titleText}</Text>
                        <Text className={styles['notification-card-subtitle']}>{subtitleText}</Text>
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
                    <Flex className={showBorderToBody ? styles['notification-card-body'] : ''}>
                        {bodyElement}
                    </Flex>
                )}
            </Flex>
        </Card>
    );
};

export default NotificationCard;
