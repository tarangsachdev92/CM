import React from 'react';
import styles from './GoToTaskButton.module.scss';

type ButtonSize = 'small' | 'medium' | 'large';

interface GoToTaskButtonProps {
    size?: ButtonSize;
    href?: string;
    label?: string;
    onClick?: () => void;
}

const LaunchIcon: React.FC<{ className?: string }> = ({ className }) => (
    // Your original "open in new/launch" icon
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={className}
        aria-hidden="true"
    >
        <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42L17.59 5H14V3z" />
        <path d="M5 5h4V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4h-2v4H5V5z" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    // Your original checkmark icon
    <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M13.8047 3.52925C14.0651 3.7896 14.0651 4.21171 13.8047 4.47206L6.4714 11.8054C6.21106 12.0657 5.78894 12.0657 5.5286 11.8054L2.19526 8.47206C1.93491 8.21171 1.93491 7.7896 2.19526 7.52925C2.45561 7.2689 2.87772 7.2689 3.13807 7.52925L6 10.3912L12.8619 3.52925C13.1223 3.2689 13.5444 3.2689 13.8047 3.52925Z"
            fill="currentColor"
        />
    </svg>
);

const GoToTaskButton: React.FC<GoToTaskButtonProps> = ({
    size = 'small',
    href = '#',
    label = 'Go to Task',
    onClick,
}) => {
    const isGoToTask = label === 'Go to Task';

    return (
        <a
            href={href}
            className={styles[`custom-button-${size}`]}
            onClick={e => {
                if (onClick) {
                    e.preventDefault(); // Prevent default navigation if needed
                    onClick();
                }
            }}
            aria-label={label}
        >
            {isGoToTask ? (
                <LaunchIcon className={styles['button-icon']} />
            ) : (
                <>
                    <CheckIcon className={styles['button-icon-secondary']} />
                    &nbsp;
                </>
            )}

            {label}
        </a>
    );
};

export default GoToTaskButton;
