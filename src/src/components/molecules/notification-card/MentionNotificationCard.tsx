import React, { useRef } from 'react';
import { Avatar } from 'antd';
import { Card, Flex, Typography } from 'antd';
import styles from './MentionNotificationCard.module.scss';
import {
    ExpandArrow,
    ExpandArrowUp,
    CloseIcon,
    NegativeRecommType,
} from '../../../assets/icons/icons';
import { tabFromType } from '../../../utils/tabUtils';
import { notificationMarkAsRead } from '../../../services/alertnotificationRules';
import { useExpandableCard } from '../../../utils/useExpandableCard';

const { Text } = Typography;

interface MentionNotificationCardProps {
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    comment?: React.ReactNode;
    createdDate?: string;
    taggedUsers?: {
        email: string;
        userName: string;
        fullName: string;
    }[];
    id: number;
    removeNotificationCard: (id: number) => void;
    isGenericNotification?: boolean;
    type?: string;
    onCardClick?: () => void | Promise<void>;
    activityType: boolean;
}

const MentionNotificationCard: React.FC<MentionNotificationCardProps> = ({
    firstName,
    lastName,
    imageUrl,
    comment,
    createdDate,
    taggedUsers,
    id,
    removeNotificationCard,
    isGenericNotification,
    type,
    onCardClick,
    activityType,
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
    const getInitials = (first?: string, last?: string) =>
        `${first?.charAt(0) ?? ''}${last?.charAt(0) ?? ''}`.toUpperCase();

    const renderComment = () => {
        if (typeof comment !== 'string') {
            return comment;
        }

        let content: (string | JSX.Element)[] = [comment];

        taggedUsers?.forEach(user => {
            const mention = `@${user.fullName}`;

            content = content.flatMap(part => {
                if (typeof part !== 'string') {
                    return [part];
                }

                return part.split(mention).flatMap((text, index, arr) =>
                    index === arr.length - 1
                        ? [text]
                        : [
                              text,
                              <span
                                  key={`${user.email}-${index}`}
                                  className={styles['tagged-user']}
                              >
                                  {mention}
                              </span>,
                          ],
                );
            });
        });

        return content;
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeNotificationCard(id);
    };

    return (
        <Card
            className={styles['notification-card-container']}
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
                        {imageUrl ? (
                            <Avatar
                                src={imageUrl}
                                className={styles['notification-card-avatar']}
                                size={48}
                            />
                        ) : (
                            <div className={styles['username-initials-small']}>
                                {getInitials(firstName, lastName)}
                            </div>
                        )}
                        {!activityType && (
                            <div className={styles['notification-card-type']}>
                                <NegativeRecommType />
                            </div>
                        )}
                    </Flex>

                    <Flex className={styles['notification-card-title-container']} vertical>
                        <Text className={styles['notification-card-title']}>
                            <strong>{firstName}</strong> mentioned you in a comment
                        </Text>

                        <Text className={styles['notification-card-subtitle']}>{createdDate}</Text>
                    </Flex>
                    <div className={styles['notification-card-header-action-buttons']}>
                        <div
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
                    <Flex className={styles['notification-card-body']} vertical>
                        <div className={styles['mention-comment']}>{renderComment()}</div>
                    </Flex>
                )}
            </Flex>
        </Card>
    );
};

export default MentionNotificationCard;
