import { Card } from 'antd';

import styles from './WidgetThumbnailCard.module.scss';

type WidgetThumbnailCardProps = {
    title: string;
    thumbnailUrl: string;
    selected?: boolean;
    onClick: () => void;
    disabled?: boolean;
};

export const WidgetThumbnailCard = ({
    title,
    thumbnailUrl,
    selected = false,
    disabled = false,
    onClick,
}: WidgetThumbnailCardProps) => {
    return (
        <Card
            className={`
                ${styles['widget-select-card']} 
                ${selected ? styles.selected : ''}
                ${disabled ? styles.disabled : ''}
            `}
            bodyStyle={{ padding: 12 }}
            onClick={onClick}
        >
            <div className={styles['card-header']}>
                <span className={styles['card-title']}>{title}</span>
            </div>

            <div className={styles['card-thumbnail']}>
                {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={title} />
                ) : (
                    <div className={styles['thumbnail-placeholder']} />
                )}
            </div>
        </Card>
    );
};
