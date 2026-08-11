import React from 'react';
import styles from './ChatbotInputTextbox.module.scss';
import { IconButton } from 'konnect-react-components';

type Props = {
  value: string;
  isFreshConv?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onMicClick: () => void;
  onKeyDown?: (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => void;
  onSendMessage: () => void;
};

const ChatbotInputTextbox: React.FC<Props> = ({
  value,
  onChange,
  onMicClick,
  onKeyDown,
  disabled,
  isFreshConv = false,
  placeholder = 'Ask me anything...',
  onSendMessage
}) => {
  const textareaRef =
    React.useRef<HTMLTextAreaElement | null>(null); 
  
  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';

    const nextHeight = Math.min(
      textarea.scrollHeight,
      96,
    );

    textarea.style.height = `${nextHeight}px`;
  }, []);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <div
      className={`${styles.chatInputContainer} ${isFreshConv ? styles.freshConversation : ''}`}
    >
      <textarea
        id="txtFormInput"
        ref={textareaRef}
        value={value}
        disabled={disabled}
        rows={1}
        placeholder={placeholder}
        className={styles.chatInput}
        onKeyDown={onKeyDown}
        onChange={e => onChange(e.target.value)}
        maxLength={5000}
      />

      {value.length > 0 && (
        <IconButton
          onClick={() => {
            onSendMessage()
          }}
          icon="send-01"
          size="Small"
        />
      )}

      {
        value.length === 0 &&
        <IconButton
          onClick={() => {
            onMicClick();
          }}
          icon="microphone-01"
          size="Small"
        />
      }

    </div>
  );
};

export default ChatbotInputTextbox;