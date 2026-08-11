import React, { useRef } from 'react';
import { Card, Typography, Flex } from 'antd';
import styles from './KPIDetailsNotificationCard.module.scss';
import {
    CloseIcon,
    ExpandArrow,
    ExpandArrowUp,
    KpiTargetIcon,
    KpiTrendDownIcon,
    KpiTrendUpIcon,
    NegativeRecommType,
} from '../../../assets/icons/icons';
import { notificationMarkAsRead } from '../../../services/alertnotificationRules';
import { useExpandableCard } from '../../../utils/useExpandableCard';
import { tabFromType } from '../../../utils/tabUtils';

const { Text } = Typography;

interface NotificationCardProps {
    titleIcon: JSX.Element;
    activityType: boolean;
    titleText: string;
    subtitleText: string; 
    currentUser: string;
    date: string;
    currentValue: string;
    targetText: string;
    trendType: string;
    comparsionValue: string;
    ComparisionText: string;
    type?: string;
    id: number;
    removeNotificationCard: (id: number) => void;
    isGenericNotification?: boolean,
    conditionValue:string
}

const KPIDetailsNotificationCard: React.FC<NotificationCardProps> = ({
    titleIcon,
    activityType,
    titleText,
    subtitleText,
    date,
    currentValue,    
    trendType,
    comparsionValue,
    ComparisionText,
    type,
    id,
    removeNotificationCard,
    isGenericNotification,
    conditionValue
}) => {

    const rootRef = useRef<HTMLDivElement>(null);
    const isGeneric = isGenericNotification ?? false;
    const scrollKey = `notificationScrollTop:${tabFromType(type)}`;

    const { expanded, toggleExpand, handleCardClick } = useExpandableCard({
        id,
        type: type || 'alert',
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
                await toggleExpand();
                await handleCardClick();
            }}
            hoverable ref={rootRef as any} data-notif-id={id}>
            <Flex className={styles['kpi-card-sub-container']}>
                <Flex className={styles['kpi-card-header']}>
                    <Flex className={styles['kpi-card-avatar-container']}>
                        <Flex
                            className={`${styles['kpi-card-avatar']} ${type ? `notification-icon-type-${type}` : 'notification-icon-type-warning'}`}
                        >
                            <span className={`notification-card-${type}-icon`}>{titleIcon}</span>
                        </Flex>

                        {!activityType && (
                            <div className={styles['kpi-card-type']}>
                                <NegativeRecommType />
                            </div>
                        )}
                    </Flex>
                    <Flex className={styles['kpi-card-title-container']}>
                        <Text className={styles['kpi-card-title']}>{titleText}</Text>
                        <Text className={styles['kpi-card-subtitle']}>{subtitleText}</Text>
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
                    <Flex className={styles['kpi-card-body']}>
                        <Flex className={styles['kpi-card-body-primary']}>
                            <div className={styles['kpi-card-body-primary-subtitle']}>{date}</div>
                            <div className={styles['kpi-card-body-primary-title']}>{currentValue}</div>
                        </Flex>

                        <Flex className={styles['kpi-card-body-secondary']}>
                            <div className={styles['kpi-card-body-secondary-s1']}>
                                <div className={styles['kpi-card-body-secondary-icon-s1']}>
                                    {<KpiTargetIcon />}
                                </div>
                                <div className={styles['kpi-card-body-secondary-text-s1']}>
                                    {conditionValue}
                                </div>
                            </div>

                            <div className={styles['kpi-card-body-secondary-s2']}>
                                {trendType && (
                                    <div className={styles['kpi-card-body-secondary-icon-s2']}>
                                        {trendType ==='>' && (
                                            <KpiTrendUpIcon />
                                        )}
                                        {trendType == '<' && (
                                            <KpiTrendDownIcon />
                                        )}
                                    </div>
                                )}
                                <div className={styles['kpi-card-body-secondary-text-s2']}>
                                    {comparsionValue}
                                </div>
                                <div className={styles['kpi-card-body-secondary-text-s3']}>vs </div>
                                <div className={styles['kpi-card-body-secondary-text-s4']}>
                                    {ComparisionText}
                                </div>
                            </div>
                        </Flex>
                    </Flex>
                )}
            </Flex>
        </Card>
    );
};

export default KPIDetailsNotificationCard;
