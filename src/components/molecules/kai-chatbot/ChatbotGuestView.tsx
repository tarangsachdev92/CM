import React, { useEffect, useState } from 'react';
import styles from './ChatbotGreetingsView.module.scss';
import PromptChip from '../../atoms/kai-chatbot/PromptChip';
import animationData from "../../../assets/animate-icon/happy-kai.json";
import kai_follow_up_smiling from "../../../assets/animate-icon/kai_follow_up_smiling.json";
import kai_typing from "../../../assets/animate-icon/kai_response_typing.json";

import Lottie from 'react-lottie';
import { ChatBotMessages, ChatMessageType, GuestUserRoleSetupSuggestions } from './ChatUtils';
import './KaiMessage.module.scss'
import ChatBotChatView from './ChatBotChatView';
import { UiComponentNode } from '../../../ui-kit/src';

type ChatBotGuestViewProps = {
    closeChatPanel: () => void
    setIsChatDisplayed: (data: boolean) => void,
    messagesProps: ChatMessage[];
    loadingProps: boolean;
    fullScreen: boolean;
}

type TurnDebug = {
  supervisorMode?: boolean;
  agentId?: string;
  intent?: { label?: string };
  supervisorSteps?: Array<{ agentId?: string; goal?: string }>;
  toolCallsCount?: number;
};

enum ResponseHint {
    FOLLOW_UP = "follow-up",
    SUGGESTION = "suggestion",
    RESOLUTION = "resolution",
    FINAL_RESPONSE = "final-response",
}

type ChatMessage = {
    role: "user" | "assistant";
    markdown?: string;
    ui?: UiComponentNode[];
    debug?: TurnDebug;
    responseHint?: ResponseHint;
};

const ChatBotGuestView: React.FC<ChatBotGuestViewProps> = ({
    messagesProps,
    loadingProps,
    fullScreen,
    setIsChatDisplayed }) => {
    const defaultOptionsKaiLogo = {
        loop: true,
        autoplay: true,
        animationData,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };

    const defaultOptionsKaiTyping = {
        loop: true,
        autoplay: true,
        animationData: kai_typing,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };

    const defaultOptionsKaiReplied = {
        loop: true,
        autoplay: true,
        animationData: kai_follow_up_smiling,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };

    const [isTyping, setIsTyping] = useState<boolean>(true)
    const [chatMessage, setChatMessage] = useState<ChatMessageType[]>([])
    const [suggestions, setSuggestions] = useState<{ id: number | undefined, text: string }[]>([])

    useEffect(() => {
        setChatMessage([{ id: 0, sender: "", text: "", showActions: false, isTyping: true }])
        setTimeout(() => {
            setIsChatDisplayed(true)
            setIsTyping(false)
            setChatMessage([ChatBotMessages[0]!])
            setSuggestions(GuestUserRoleSetupSuggestions)
        }, 2000);
    }, [])

    const addNavigationMessage = (messages: any) => {
        setIsTyping(true)
        setTimeout(() => {
            const msgs = [...messages]
            msgs[msgs.length - 1] = ChatBotMessages[4]
            setChatMessage(msgs)
            setIsTyping(false)
        }, 2000);
    }

    const addMessageForNo = (messages: any) => {
        setIsTyping(true)
        setTimeout(() => {
            const msgs = [...messages]
            msgs[msgs.length - 1] = ChatBotMessages[5]
            setChatMessage(msgs)
            setIsTyping(false)
        }, 2000);
    }

    const addMessageForHelpSomethingElse = (messages: any) => {
        setIsTyping(true)
        setTimeout(() => {
            const msgs = [...messages]
            msgs[msgs.length - 1] = ChatBotMessages[6]
            setChatMessage(msgs)
            setIsTyping(false)
        }, 2000);
    }

    const renderKaiChat = () => {
        return (<div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            paddingTop: 20
        }}>
            {suggestions.length ? suggestions.slice(0, 5).map(prompt => (
                <PromptChip key={prompt.id} prompt={prompt.text} customStyle={styles.suggestionMessageContainer} onPromptClick={() => {
                    setSuggestions([])
                    if (prompt.id === 1) {
                        setChatMessage([...chatMessage, {
                            id: 1,
                            isTyping: false,
                            showActions: false,
                            sender: 'user',
                            text: prompt.text
                        }, { id: 101, text: '', showActions: false, sender: 'bot', isTyping: true }])
                        addNavigationMessage([...chatMessage, { ...ChatBotMessages[1], sender: 'user' }, { sender: 'bot', isTyping: true }])
                    } else if (prompt.id === 2) {
                        setChatMessage([chatMessage[0]!, {
                            id: 2,
                            isTyping: false,
                            showActions: false,
                            sender: 'user',
                            text: prompt.text
                        }, { id: 101, text: '', showActions: false, sender: 'bot', isTyping: true }])
                        addMessageForNo([...chatMessage, { ...ChatBotMessages[2], sender: 'user' }, { sender: 'bot', isTyping: true }])
                    } else if (prompt.id === 3) {
                        setChatMessage([chatMessage[0]!, {
                            id: 3,
                            isTyping: false,
                            showActions: false,
                            sender: 'user',
                            text: prompt.text
                        }, { id: 101, text: '', showActions: false, sender: 'bot', isTyping: true }])
                        addMessageForHelpSomethingElse([chatMessage[0], { ...ChatBotMessages[3], sender: 'user' }, { sender: 'bot', isTyping: true }])
                    }
                }} />
            )) : <></>}
            <div className={styles.kaiTyping}>
                <Lottie options={isTyping ? defaultOptionsKaiTyping : defaultOptionsKaiReplied} height={94} width={94} />
            </div>
        </div>)
    }

    return (
        <div className={styles.greetingsGuestView}>
            <div>
                <div className={styles.contentSection}>
                    <div className={styles.logoWrapper}>
                        <Lottie options={defaultOptionsKaiLogo} height={100} width={100} />
                    </div>

                    <h1 className={styles.heading}>Hi, Guest User</h1>

                </div>
                <ChatBotChatView kaiResponse={ResponseHint.FOLLOW_UP} messagesProps={messagesProps} loadingProps={loadingProps} fullScreen={fullScreen} />
                {renderKaiChat()}
            </div>
        </div>
    );
};

export default ChatBotGuestView;