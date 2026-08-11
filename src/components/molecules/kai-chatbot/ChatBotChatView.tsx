import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ChatbotGreetingsView.module.scss';
import { IconButton } from 'konnect-react-components';
import Lottie from 'react-lottie';
import { UiRenderer,
    MarkdownContent,
    setUiLibraryProvider,
    type UiComponentNode,
    type UiLibraryProvider } from '../../../ui-kit/src';
import { Box, Paper, Stack } from '@mui/material';
import kai_follow_up_smiling from "../../../assets/animate-icon/kai_follow_up_smiling.json";
import kai_typing from "../../../assets/animate-icon/kai_response_typing.json";
import kai_suggesting from "../../../assets/animate-icon/kai_suggesting.json";
import kai_wink from "../../../assets/animate-icon/kai_wink.json";
import kai_happy_wave from "../../../assets/animate-icon/kai_happy_wave.json";
import { TypingIndicator } from './ChatbotTypingLoader';

type Props = {
    messagesProps: ChatMessage[];
    loadingProps: boolean;
    fullScreen: boolean;
    kaiResponse: ResponseHint;
    onSuggestionSelect?: (text: string) => void;
};

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

const ChatBotChatView: React.FC<Props> = ({
    messagesProps,
    loadingProps,
    fullScreen,
    kaiResponse,
    onSuggestionSelect,
}) => {
    const chatScrollRef = useRef<HTMLDivElement | null>(null);
    const provider = useMemo(() => readProvider(), []);
    setUiLibraryProvider(provider);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

    const kaiResponseJsonImg = () => {
        switch (kaiResponse) {
            case ResponseHint.FOLLOW_UP:
                return kai_follow_up_smiling;
            case ResponseHint.SUGGESTION:
                return kai_suggesting;
            case ResponseHint.RESOLUTION:
                return kai_happy_wave;
            case ResponseHint.FINAL_RESPONSE:
                return kai_wink;
            default:
                return kai_typing;
        }
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
        animationData: kaiResponseJsonImg(),
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };
    useEffect(() => {
        setMessages(messagesProps)
    }, [messagesProps])

    useEffect(() => {
        setLoading(loadingProps)
    }, [loadingProps])

    useEffect(() => {
        if (!chatScrollRef.current) return;
        chatScrollRef.current.scrollTo({
            top: chatScrollRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, loading]);   

    const handleUiAction = React.useCallback(
        (payload: Record<string, unknown>) => {
            if (payload.type === "suggestion" && typeof payload.text === "string") {
                onSuggestionSelect?.(payload.text);
            }
        },
        [onSuggestionSelect],
    );

    function readProvider(): UiLibraryProvider {
        const env = import.meta.env.VITE_UI_LIBRARY_PROVIDER as UiLibraryProvider | undefined;
        return env === "command-center-ui" ? "command-center-ui" : "material-ui";
    }

    return (      
            <Box ref={chatScrollRef} sx={{ flex: 1, overflowY: "auto", p: 2 }}>
                <Stack spacing={2} gap={1}>                   
                    {messages.map((msg, i) => (
                        (() => {
                            const isLastMessage = i === messages.length - 1;
                            const isStreamingAssistantMessage = loading && isLastMessage && msg.role === 'assistant';
                            const uiNodes = msg.ui ?? [];
                            const messageUiNodes = uiNodes.filter((node) => node.type !== "Suggestions");
                            const suggestionUiNodes = uiNodes.filter((node) => node.type === "Suggestions");

                            return (
                        <React.Fragment key={i}>
                            <Paper
                                elevation={0}
                                sx={{
                                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                                    maxWidth: fullScreen ? "40%" : "80%",
                                    display: 'flex',
                                    flexDirection: 'column',
                                    bgcolor: msg.role === "user" ? "#33C0AC" : "background.paper",
                                    border: 1,
                                    borderColor: "divider",
                                    borderTopLeftRadius: 10,
                                    borderTopRightRadius: 10,
                                    borderBottomLeftRadius: msg.role === "user" ? 10 : 0,
                                    borderBottomRightRadius: msg.role === "assistant" ? 10 : 0,
                                    p: 2,
                                }}
                            >
                                {msg.markdown ? (
                                    <Box sx={{ display: 'inline-flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
                                        <MarkdownContent content={msg.markdown} />
                                        {(isStreamingAssistantMessage && loading) ? (
                                            <span className={styles.streamingDots} aria-label="streaming response">
                                                <span className={styles.dot}>.</span>
                                                <span className={styles.dot}>.</span>
                                                <span className={styles.dot}>.</span>
                                            </span>
                                        ) : null}
                                    </Box>
                                ) : null}
                                {messageUiNodes.length ? (
                                    <Box>
                                        <UiRenderer nodes={messageUiNodes} provider={provider} onAction={handleUiAction} />
                                    </Box>
                                ) : null}
                                {msg.debug ? (
                                    <Box component="details" sx={{ mt: 1, fontSize: "0.75rem" }}>
                                        <Box component="summary" sx={{ cursor: "pointer", color: "text.secondary" }}>
                                            Orchestration debug
                                        </Box>
                                        <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: "grey.100", borderRadius: 1, overflow: "auto" }}>
                                            {JSON.stringify(msg.debug, null, 2)}
                                        </Box>
                                    </Box>
                                ) : null}
                            </Paper>

                            {suggestionUiNodes.length ? (
                                <Box
                                    sx={{
                                        alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                                        maxWidth: fullScreen ? "40%" : "80%",
                                        mt: 0.5,
                                    }}
                                >
                                    <UiRenderer nodes={suggestionUiNodes} provider={provider} onAction={handleUiAction} />
                                </Box>
                            ) : null}
                        </React.Fragment>
                            );
                        })()
                    ))}
                    {(messages.length > 0 && !loading) ? <div className={styles.actionIconContainer}>
                        <IconButton icon="copy-01" size="Tiny" onClick={() => {
                            // handle copy click
                        }} />
                        <IconButton icon="thumbs-up" size="Tiny" onClick={() => {
                            // handle thumbs-up    
                        }} />
                        <IconButton icon="thumbs-down" size="Tiny" onClick={() => {
                            // handle thumbs-down
                        }} />
                    </div>: <></>}
                    {messages.length > 0 && <div className={styles.kaiTyping}>
                        {loading && <TypingIndicator />}
                        <Lottie options={loading ? defaultOptionsKaiTyping : defaultOptionsKaiReplied} height={94} width={94} />
                    </div>}
                </Stack>
            </Box>

    );
};

export default ChatBotChatView;