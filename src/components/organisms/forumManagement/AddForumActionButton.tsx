import React, { useState } from 'react';
import { AnimatedButton } from 'konnect-react-components';
import styles from './AddForumActionButton.module.scss';

type Props = {
    onClick: () => void;
    placement?: 'header' | 'center'; // supports reusability (header + empty state)
    id?: string;
};

const AddForumActionButton: React.FC<Props> = ({
    onClick,
    placement = 'header',
    id = 'forum-add-forum-button',
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`${styles.container} ${
                placement === 'center' ? styles.center : styles.header
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatedButton
                icon="plus"
                id={id}
                size="M"
                onClick={onClick}
                text={isHovered ? 'Add New Forum' : ''}
            />
        </div>
    );
};

export default AddForumActionButton;