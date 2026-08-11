import React, { useEffect, useMemo, useState } from 'react';
import styles from './ChatbotGreetingsView.module.scss';
import { Icon } from 'konnect-react-components';
import { getCurrentUserFullName } from '../../../utils/helpers';
import PromptChip from '../../atoms/kai-chatbot/PromptChip';
import animationData from "../../../assets/animate-icon/happy-kai.json";
import Lottie from 'react-lottie';
import { getSuggestedPromptForUser } from '../../../services/kaiChatbotService';
import { ISuggestedPrompt } from '../../../types/response';
import ChatBotChatView from './ChatBotChatView';
import { setUiLibraryProvider, type UiComponentNode, type UiLibraryProvider } from '../../../ui-kit/src';

type Props = {
    onPromptClick: (prompt: string) => void;
    onPromptGuideClick: () => void;
    onSuggestionSelect?: (text: string) => void;
    messagesProps: ChatMessage[];
    loadingProps: boolean;
    fullScreen: boolean;
    kaiResponse: ResponseHint;
};

enum ResponseHint {
    FOLLOW_UP = "follow-up",
    SUGGESTION = "suggestion",
    RESOLUTION = "resolution",
    FINAL_RESPONSE = "final-response",
}

type TurnDebug = {
  supervisorMode?: boolean;
  agentId?: string;
  intent?: { label?: string };
  supervisorSteps?: Array<{ agentId?: string; goal?: string }>;
  toolCallsCount?: number;
};

export type ChatMessage = {
    role: "user" | "assistant";
    markdown?: string;
    ui?: UiComponentNode[];
    debug?: TurnDebug;
    responseHint?: ResponseHint;
};


const ChatbotGreetingsView: React.FC<Props> = ({
    messagesProps,
    loadingProps,
    fullScreen,
    onPromptClick,
    onPromptGuideClick,
    onSuggestionSelect,
    kaiResponse
}) => {
    const provider = useMemo(() => readProvider(), []);
    setUiLibraryProvider(provider);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        setMessages(messagesProps)
    }, [messagesProps])

    const defaultOptionsKaiLogo = {
        loop: true,
        autoplay: true,
        animationData,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };

    const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([])

    useEffect(() => {
        getSuggestedPromptForUser().then((resp: ISuggestedPrompt[]) => {
            if (resp.length > 0) {
                setSuggestedPrompts(resp.map(m => m.prompt));
            }
        });
    }, []);

    function readProvider(): UiLibraryProvider {
        const env = import.meta.env.VITE_UI_LIBRARY_PROVIDER as UiLibraryProvider | undefined;
        return env === "command-center-ui" ? "command-center-ui" : "material-ui";
    }


    return (
        <div className={styles.greetingsView}>
           {!messages.length && <div className={styles.contentSection}>
                <div className={styles.logoWrapper}>
                    <Lottie options={defaultOptionsKaiLogo} height={100} width={100} />
                </div>

                <h1 className={styles.heading}>Hi, {getCurrentUserFullName()?.split(' ')[0]}!</h1>

                <p className={styles.description}>
                    I am <span>KAI</span>, your command centre assistant, Select a prompt below or
                    just ask away!
                </p>

                <div className={styles.promptList}>
                    {suggestedPrompts.slice(0, 5).map(prompt => (
                        <PromptChip prompt={prompt} onPromptClick={onPromptClick} />
                    ))}
                </div>
            </div>}

            {!messages.length && <div className={styles.bottomSection}>
                <button className={styles.promptGuide} onClick={onPromptGuideClick}>
                    <Icon name="ReUse-Icon" size="m" /> View Prompt Guide
                </button>
            </div>}
            <ChatBotChatView
                kaiResponse={kaiResponse}
                messagesProps={messagesProps}
                loadingProps={loadingProps}
                fullScreen={fullScreen}
                onSuggestionSelect={onSuggestionSelect}
            />
        </div>
    );
};

export default ChatbotGreetingsView;