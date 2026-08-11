import React from 'react';
import styles from "./KaiMessage.module.scss";
import {IconButton } from 'konnect-react-components';
import { TypingIndicator } from './ChatbotTypingLoader';

export interface KaiMessageProps {
    message?: string | React.ReactNode;
    isBot?: boolean;
    isTyping?: boolean;
    className?: string;
    showActions?: boolean;
    onMessageClick: () => void
}

const KaiMessage: React.FC<KaiMessageProps> = ({
    message,
    isBot = false,
    isTyping = false,
    showActions = false,
    onMessageClick
}) => {
    return (
        <div style={{width: '100%'}}>
            {isTyping ? (
                <TypingIndicator />
            ) :
                <div
                    onClick={onMessageClick}
                    className={`${styles.chatMessageContainer} ${isBot ? styles.chatMessageBot : styles.chatMessageUser}`}>
                    {isBot ? (
                        <div>
                            <span className={styles['chat-message-text']}>{message}</span>
                        </div>
                    ) : (
                        <div>
                            <span className={styles['chat-message-text']}>{message}</span>
                        </div>
                    )}
                </div>}
            {showActions &&
                <div className={styles.actionIconContainer}>
                    <IconButton icon="copy-01" size="Tiny" onClick={() => alert('Copy clicked')} />
                    <IconButton icon="thumbs-up" size="Tiny" onClick={() => alert('Thumbs up clicked')} />
                    <IconButton icon="thumbs-down" size="Tiny" onClick={() => alert('Thumbs down clicked')} />
                </div>}
        </div>
    );
};

export default KaiMessage;
