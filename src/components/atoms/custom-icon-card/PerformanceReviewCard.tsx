import { useState, useEffect } from 'react';
import { Card, Row, Col, Avatar, Typography, Button, Tooltip } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import styles from './PerformanceReviewCard.module.scss';
import { primaryGreenColor, primaryGreen50Color } from '../../../utils/constants';

const { Title, Text } = Typography;

const getInitials = (title: string) => {
    if (!title) return '';
    const words = title.trim().split(' ');
    const initials = words
        .slice(0, 2)
        .map((word: any) => word[0].toUpperCase())
        .join('');
    return initials;
};

type SiteButton = {
    forumId: number;
    geography: string;
    isFavorite?: boolean;
};

type PerformanceReviewCardProps = {
    title: string;
    subtitle?: string;
    siteButtons?: SiteButton[];
    showCardHeartIcon?: boolean;
    description?: string;
    isDisabled?: boolean;
    onCardClick?: () => void;
    onSiteFavoriteToggle?: (forumIds: number[], isFavorite: boolean) => void;
    onCardFavoriteToggle?: (forumIds: number[], isFavorite: boolean) => void;
    isFavorite?: boolean;
    globalForumId?: number;
    selectedId?: string;
    onSiteButtonClick?: (data?: {
        forumId: number;
        geography: string;
        forumLevel: string;
        period: string;
    }) => void;
};

const PerformanceReviewCard = ({
    title,
    subtitle = '',
    siteButtons = [],
    showCardHeartIcon = false,
    description = '',
    isDisabled = false,
    onCardClick,
    onSiteFavoriteToggle,
    onCardFavoriteToggle,
    isFavorite,
    globalForumId,
    selectedId,
    onSiteButtonClick,
}: PerformanceReviewCardProps) => {
    const [expanded, setExpanded] = useState(false);
    const [liked, setLiked] = useState<boolean[]>(siteButtons?.map(btn => btn.isFavorite ?? false));
    const [hovered, setHovered] = useState(false);

    const initials = getInitials(title);
    const visibleButtons = expanded ? siteButtons : siteButtons?.slice(0, 3);
    const isCardFullyLiked =
        siteButtons.length > 0 ? liked.every(val => val === true) : (isFavorite ?? false);

    const toggleLike = (index: number) => {
        const updated = [...liked];
        updated[index] = !updated[index];
        setLiked(updated);

        const forumId = siteButtons[index]?.forumId ?? 0;
        const isFavorite = updated[index];
        onSiteFavoriteToggle?.([forumId], isFavorite);
    };

    const getForumIds = () => {
        if (siteButtons.length > 0) {
            return siteButtons.map(btn => btn.forumId);
        }

        if (globalForumId !== undefined) {
            return [globalForumId];
        }

        return [];
    };

    useEffect(() => {
        const newLiked = siteButtons?.map(btn => btn.isFavorite ?? false);
        if (JSON.stringify(newLiked) !== JSON.stringify(liked)) {
            setLiked(newLiked);
        }
    }, [siteButtons]);

    return (
        <Card
            className={`${styles.card} ${isDisabled ? styles.disabled : ''} ${onCardClick ? styles.clickable : ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={selectedId === 'Global' ? onCardClick : undefined}
        >
            {showCardHeartIcon && hovered && (
                <div
                    className={`${styles.heartIcon} ${isCardFullyLiked ? styles.liked : ''}`}
                    onClick={e => {
                        e.stopPropagation();

                        const forumIds = getForumIds();

                        onCardFavoriteToggle?.(forumIds, !isCardFullyLiked);

                        // Optimistically update UI
                        if (siteButtons.length === 0) {
                            setLiked([!isCardFullyLiked]);
                        } else {
                            setLiked(siteButtons.map(() => !isCardFullyLiked));
                        }
                    }}
                >
                    {isCardFullyLiked ? <HeartFilled /> : <HeartOutlined />}
                </div>
            )}

            <Row align="middle">
                <Col>
                    <Avatar className={`${styles.avatar} ${isDisabled ? styles.disabled : ''}`}>
                        {initials}
                    </Avatar>
                </Col>
                <Col style={{ marginLeft: 16 }}>
                    <Tooltip title={title}>
                        <Title level={5} className={styles.title} ellipsis>
                            {title}
                        </Title>
                    </Tooltip>
                    <Text type="secondary">{subtitle}</Text>
                </Col>
            </Row>

            <div className={styles.description}>
                <Text>{description}</Text>
            </div>

            <div className={`${styles.buttons} ${expanded ? styles.expanded : ''}`}>
                {visibleButtons?.map((btn, index) => (
                    <Button
                        key={btn.forumId}
                        className={styles.button}
                        onClick={e => {
                            e.stopPropagation();
                            // Trigger navigation only for non-Global cards
                            if (selectedId !== 'Global') {
                                onSiteButtonClick?.({
                                    forumId: btn.forumId,
                                    geography: btn.geography,
                                    forumLevel: selectedId ?? '',
                                    period: subtitle?.split(' ')[1] ?? '',
                                });
                            }
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = primaryGreenColor;
                            e.currentTarget.style.backgroundColor = primaryGreen50Color;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '#d9d9d9';
                            e.currentTarget.style.backgroundColor = 'white';
                        }}
                    >
                        <Tooltip title={btn.geography}>
                            {/* Removing the MFG prefix from site names for Sept release as requested */}
                            <span className={styles['geographyText']}>
                                {/* To remove prefix like "MFG:" or "MFG :" or "MFG : " or "MFG: " */}
                                {selectedId === 'Site'
                                    ? btn.geography.replace(/^.*?:\s*/, '')
                                    : btn.geography}
                            </span>
                        </Tooltip>

                        {/* Heart icon inside button but with separate click handler */}
                        <button
                            type='button'
                            onClick={e => {
                                e.stopPropagation();
                                toggleLike(index);
                            }}
                            className={styles['heartIconButton']}
                        >
                            {liked[index] ? (
                                <HeartFilled style={{ color: '#FF6B6B' }} />
                            ) : (
                                <HeartOutlined />
                            )}
                        </button>
                    </Button>
                ))}
            </div>

            {siteButtons?.length > 3 && (
                <div className={styles.viewToggle}>
                    <button
                        type="button"
                        className={styles['heartIconButton']}
                        onClick={() => setExpanded(!expanded)}>
                        {expanded ? 'View Less' : `View All (+${siteButtons?.length - 3})`}
                    </button>
                </div>
            )}
        </Card>
    );
};

export default PerformanceReviewCard;
