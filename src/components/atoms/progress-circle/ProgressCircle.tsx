import React from 'react';
import styles from './ProgressCircle.module.scss';
import { SparkleLeft, SparkleRight } from '../../../assets/images/images';

type ProgressCircleProps = {
    percentage: number;
};
const ProgressCircle: React.FC<ProgressCircleProps> = ({ percentage }) => {
    const radius = 50;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg viewBox="0 0 200 200" className={styles['progress-circle']}>
            <defs>
                <linearGradient id="progressGradient" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#058673" />
                    <stop offset="50%" stopColor="#01B097" />
                    <stop offset="100%" stopColor="#E8FFFB" />
                </linearGradient>
            </defs>
            <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#DEDEDE"
                strokeWidth={strokeWidth}
                fill="none"
            />
            <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="url(#progressGradient)"
                strokeWidth={strokeWidth + 2}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 60 60)"
                strokeLinecap="round"
            />
            <text
                className={styles['percentage-font']}
                x="30%"
                y={percentage == 100 ? '35%' : '38%'}
                textAnchor="middle"
                style={{ fontSize: percentage === 100 ? '22px' : '35px' }}
                // dy=".3em"
            >
                {percentage}%
            </text>

            {percentage === 100 && (
                <>
                    {/* Top-right star */}
                    <SparkleRight />

                    {/* Bottom-left star */}
                    <SparkleLeft />
                </>
            )}
        </svg>
    );
};

export default ProgressCircle;
