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
import { TypingIndicator } from './ChatbotTypingLoader';

type Props = {
    messagesProps: ChatMessage[];
    loadingProps: boolean;
    fullScreen: boolean;
};

type TurnDebug = {
  supervisorMode?: boolean;
  agentId?: string;
  intent?: { label?: string };
  supervisorSteps?: Array<{ agentId?: string; goal?: string }>;
  toolCallsCount?: number;
};

type ChatMessage = {
    role: "user" | "assistant";
    markdown?: string;
    ui?: UiComponentNode[];
    debug?: TurnDebug;
};


const ChatBotChatView: React.FC<Props> = ({
    messagesProps,
    loadingProps,
    fullScreen,
}) => {
    const chatScrollRef = useRef<HTMLDivElement | null>(null);
    const provider = useMemo(() => readProvider(), []);
    setUiLibraryProvider(provider);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

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

    function readProvider(): UiLibraryProvider {
        const env = import.meta.env.VITE_UI_LIBRARY_PROVIDER as UiLibraryProvider | undefined;
        return env === "command-center-ui" ? "command-center-ui" : "material-ui";
    }

    return (      
            <Box ref={chatScrollRef} sx={{ flex: 1, overflowY: "auto", p: 2 }}>
                <Stack spacing={2} gap={1}>                   
                    {messages.map((msg, i) => (
                        <Paper
                            key={i}
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
                            {(msg.role === "user" && msg.markdown) ? <MarkdownContent content={msg.markdown} /> : null}
                            {msg.ui?.length ? (
                                <Box 
                                // sx={{ borderTop: msg.markdown ? 1 : 0, borderColor: "divider", pt: msg.markdown ? 2 : 0 }}
                                >
                                    <UiRenderer nodes={msg.ui} provider={provider} onAction={() => { }} />
                                </Box>
                            ) : null}
                            {/* {msg.debug ? (
                                <Box component="details" sx={{ mt: 1, fontSize: "0.75rem" }}>
                                    <Box component="summary" sx={{ cursor: "pointer", color: "text.secondary" }}>
                                        Orchestration debug
                                    </Box>
                                    <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: "grey.100", borderRadius: 1, overflow: "auto" }}>
                                        {JSON.stringify(msg.debug, null, 2)}
                                    </Box>
                                </Box>
                            ) : null} */}
                        </Paper>
                    ))}
                    {messages.length > 0 &&<div className={styles.actionIconContainer}>
                        <IconButton icon="copy-01" size="Tiny" onClick={() => {
                            // handle copy click
                        }} />
                        <IconButton icon="thumbs-up" size="Tiny" onClick={() => {
                            // handle thumbs-up    
                        }} />
                        <IconButton icon="thumbs-down" size="Tiny" onClick={() => {
                            // handle thumbs-down
                        }} />
                    </div>}
                    {messages.length > 0 && <div className={styles.kaiTyping}>
                        {loading && <TypingIndicator />}
                        <Lottie options={loading ? defaultOptionsKaiTyping : defaultOptionsKaiReplied} height={94} width={94} />
                    </div>}
                </Stack>
            </Box>

    );
};

export default ChatBotChatView;