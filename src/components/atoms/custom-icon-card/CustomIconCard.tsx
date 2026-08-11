import React, { useState } from 'react';
import { Card } from 'antd';
import CircleIcon from './CircleIcon';
import { Counter } from 'konnect-react-components';
import Title from 'antd/es/typography/Title';
import styles from './CircleIconCard.module.scss';

type CircleIconCardProps = {
    iconName?: string;
    size?: number;
    circleBackgroundColor?: string;
    cardBackgroundColor?: string;
    cardBorderColor?: string;
    label?: string;
    count: number;
    onClick: (cardId: string) => void;
    isSelected?: boolean;
};

const CircleIconCard = ({
    iconName = 'globe-01',
    size = 50,
    circleBackgroundColor = '#00b097',
    cardBackgroundColor = '#e6f7ff',
    cardBorderColor = '#00b097',
    label = 'Global',
    count = 0,
    isSelected = false,
    onClick,
}: CircleIconCardProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const cardClassNames = [
        styles.cardContainer,
        isHovered ? styles.hovered : '',
        isSelected ? styles.selected : '',
    ].join(' ');

    return (
        <Card
            className={cardClassNames}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={e => {
                e.stopPropagation();
                onClick(label);
            }}
            style={{
                ...({
                    '--card-bg-color': cardBackgroundColor,
                    '--card-border-color': cardBorderColor,
                } as React.CSSProperties),
            }}
            bodyStyle={{ padding: 0 }}
        >
            <CircleIcon
                iconName={iconName}
                givenSize={size}
                givenBackgroundColor={circleBackgroundColor}
            />
            <div className={styles.flexRow}>
                <Title level={5} className={styles.title}>
                    {label}
                </Title>
                <Counter value={String(count)} colorVariant="Neutral-1" />
            </div>
        </Card>
    );
};

export default CircleIconCard;
