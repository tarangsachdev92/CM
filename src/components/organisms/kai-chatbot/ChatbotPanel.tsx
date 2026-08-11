import { Drawer, Flex } from 'antd';
import styles from './ChatbotPanel.module.scss';
import ChatPanelHeader from '../../molecules/kai-chatbot/ChatPanelHeader';
import ChatbotInputTextbox from '../../molecules/kai-chatbot/ChatbotInputTextbox';
import ChatbotGreetingsView, {
    ChatMessage,
} from '../../molecules/kai-chatbot/ChatbotGreetingsView';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon, IconButton } from 'konnect-react-components';
import ChatbotHistory from '../../molecules/kai-chatbot/ChatbotHistory';
import ChatbotPromptGuide from '../../molecules/kai-chatbot/ChatbotPromptGuide';

type ChatBotPanelProps = {
    openChatPanel: boolean;
    setOpenChatPanel: (open: boolean) => void;
};

enum ResponseHint {
    FOLLOW_UP = "follow-up",
    SUGGESTION = "suggestion",
    RESOLUTION = "resolution",
    FINAL_RESPONSE = "final-response",
}

function ChatbotPanel({ openChatPanel, setOpenChatPanel }: ChatBotPanelProps) {
    const [textInput, setTextInput] = useState<string>('');
    const [isFreshConv, setIsFreshConv] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [fullScreen, setFullScreen] = useState(false);
    const [openPanel, setOpenPanel] = useState(false);
    const [openPromptGuide, setOpenPromptGuide] = useState(false);
    const [isChatDisplayed, setIsChatDisplayed] = useState(false);
    const [responseHint, setResponseHint] = useState<ResponseHint>(ResponseHint.FOLLOW_UP);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const streamingMessageIndexRef = useRef<number | null>(null);
    const streamingTextRef = useRef('');
    const [loading, setLoading] = useState(false);
    const [conversationId] = useState(() => crypto.randomUUID());
    const TENANT_ID = process.env.VITE_CHATBOT_TENANT_ID;

    const uiContext = useCallback(
        () => ({
            tenantId: TENANT_ID || '',
            geoLevel: 'Region',
            region: ['India'],
            timePeriodLevel: 'Weekly',
            locale: 'en-US',
        }),
        [TENANT_ID],
    );

    const STEP_LABELS: Record<string, string> = {
        normalize: 'Understanding request',
        memory_load: 'Loading conversation history',
        classify_intent: 'Identifying intent',
        ground_workflow: 'Finding matching workflow',
        policy_gate: 'Applying policy checks',
        execute_workflow: 'Executing workflow',
        audit: 'Recording audit trail',
        memory_save: 'Saving conversation',
        finalize: 'Preparing response',
    };

    const upsertStreamingMessage = (markdown: string) => {
        setMessages(prev => {
            if (streamingMessageIndexRef.current == null) {
                const streamingMessage: ChatMessage = { role: 'assistant', markdown };
                const next = [...prev, streamingMessage];
                streamingMessageIndexRef.current = next.length - 1;
                return next;
            }

            const nextMessages: ChatMessage[] = prev.map((msg, idx) => {
                if (idx === streamingMessageIndexRef.current) {
                    return {
                        ...msg,
                        role: 'assistant',
                        markdown,
                    };
                }

                return msg;
            });

            return nextMessages;
        });
    };

    type StreamEvent = {
        type?: string;
        step?: string;
        message?: string;
        name?: string;
        content?: string;
        data?: unknown;
    };

    const processStreamEvent = (event: StreamEvent) => {
        switch (event.type) {
            case 'status': {
                const stepKey = event.step;
                const stepLabel = typeof stepKey === 'string' ? STEP_LABELS[stepKey] : undefined;
                if (stepLabel) {
                    upsertStreamingMessage(stepLabel);
                }
                break;
            }

            case 'tool_start':
            case 'tool_end':
                break;

            case 'token': {
                const next = streamingTextRef.current + (event.content ?? '');
                streamingTextRef.current = next;
                upsertStreamingMessage(next);
                break;
            }

            case 'final': {
                const res = (event.data ?? {}) as Record<string, unknown>;
                const assistantMessage = res.assistantMessage as
                    | { contentMarkdown?: string; ui?: ChatMessage['ui'] }
                    | undefined;
                const assistantMessageSnake = res.assistant_message as
                    | { content_markdown?: string; ui?: ChatMessage['ui'] }
                    | undefined;
                const assistantMarkdown =
                    assistantMessage?.contentMarkdown ?? assistantMessageSnake?.content_markdown;
                const assistantUi = assistantMessage?.ui ?? assistantMessageSnake?.ui ?? [];
                const debug = res.debug as ChatMessage['debug'];
                const finalAssistantMsg: ChatMessage = {
                    role: 'assistant',
                    markdown: assistantMarkdown,
                    ui: assistantUi,
                    debug,
                    responseHint: res.response_hint as ResponseHint,
                };
                setResponseHint(res.response_hint as ResponseHint);
                setMessages(prev => {
                    if (streamingMessageIndexRef.current == null) {
                        return [...prev, finalAssistantMsg];
                    }

                    return prev.map((msg, idx) =>
                        idx === streamingMessageIndexRef.current ? finalAssistantMsg : msg,
                    );
                });
                streamingTextRef.current = '';
                streamingMessageIndexRef.current = null;
                break;
            }

            default:
                break;
        }
    };

    const sendMessage = async (text: string) => {
        const content = text.trim();
        if (!content || loading) return;

        setMessages(m => [...m, { role: 'user', markdown: content }]);
        setLoading(true);

        try {
            await streamTurn(conversationId, {
                message: {
                    role: 'user',
                    content: content,
                },
                uiContext: uiContext(),
            });          
        } finally {
            setLoading(false);
        }
    };

    const streamTurn = async (conversationId: string, payload: unknown) => {
        streamingTextRef.current = '';
        streamingMessageIndexRef.current = null;

        try {
            const response = await fetch(
                `${process.env.VITE_CHATBOT_BASE_URL}/v1/conversations/${conversationId}/turns/stream`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                },
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            if (!response.body) {
                throw new Error('Streaming response body unavailable');
            }
            const reader = response.body.getReader();

            const decoder = new TextDecoder();

            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();

                if (done) {
                    break;
                }

                buffer += decoder.decode(value, {
                    stream: true,
                });

                const messages = buffer.split('\n\n');

                buffer = messages.pop() || '';

                for (const message of messages) {
                    const lines = message.split('\n').filter(Boolean);

                    let eventName = 'message';
                    let data = '';

                    for (const line of lines) {
                        if (line.startsWith('event:')) {
                            eventName = line.replace('event:', '').trim();
                        }

                        if (line.startsWith('data:')) {
                            data += line.replace('data:', '').trim();
                        }
                    }

                    if (eventName === 'complete' || data === '[DONE]') {
                        streamingMessageIndexRef.current = null;
                        continue;
                    }

                    try {
                        const parsed = JSON.parse(data);

                        processStreamEvent(parsed);
                    } catch (err) {
                        console.error('Failed to parse event', err, data);
                    }
                }
            }
        } catch (err) {
            console.error('Streaming error', err);
            streamingMessageIndexRef.current = null;
        }
    };

    useEffect(() => {
        setOpenPanel(openChatPanel);
        setIsFreshConv(true);
    }, [openChatPanel]);

    const setUserMessage = (message: string) => {
        setTextInput(message);
        setIsFreshConv(false);
    };

    const handleSuggestionSelect = (text: string) => {
        setTextInput(text);
        setIsFreshConv(false);
    };

    const getChatPanelWidth = () => {
        if (fullScreen) {
            return showHistory ? 'calc(100vw - 20rem)' : '100vw';
        }
        return '26.25rem';
    };

    const chatPanelWidth = getChatPanelWidth();

    const historyPanelWidth = fullScreen ? (showHistory ? '100vw' : '0vw') : '41.25rem';

    const handleOnClosePanel = () => {
        setOpenChatPanel(false);
        setShowHistory(false);
        setFullScreen(false);
    };

    const renderPromtGuidelinesContent = () => {
        return (
            <ChatbotPromptGuide
                showHistory={showHistory}
                fullScreen={fullScreen}
                onCloseClick={() => setOpenPromptGuide(false)}
            />
        );
    };

    const getTextFieldBottomPadding = () => {
        if (fullScreen) {
            if (isChatDisplayed) {
                return '90px';
            } else {
                return '100px';
            }
        } else {
            return '';
        }
    };

    //Handle Send message
    const handleSendMessage = () => {
        sendMessage(textInput);
        setTextInput('');
        setIsFreshConv(false);
        setIsChatDisplayed(true);
    };

    //handle the key down event for the chat input textbox
    const handleKeyDownMessageTextBox = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Drawer
            destroyOnClose={true}
            push={false}
            zIndex={901}
            id="chat-panel"
            open={openPanel}
            mask={false}
            rootClassName={`${styles.chatDrawer} `}
            closable={false}
            footer={
                <ChatbotInputTextbox
                    onChange={setUserMessage}
                    value={textInput}
                    onMicClick={() => {}}
                    isFreshConv={isFreshConv}
                    onKeyDown={handleKeyDownMessageTextBox}
                    onSendMessage={handleSendMessage}
                />
            }
            title={
                <ChatPanelHeader
                    fullScreen={fullScreen}
                    onFullScreenClick={setFullScreen}
                    showHistory={showHistory}
                    onHistoryClick={setShowHistory}
                    showVerticalDots={messages.length > 0}
                    onCloseClick={() => {
                        handleOnClosePanel();
                    }}
                />
            }
            styles={{
                wrapper: {
                    borderTopLeftRadius: showHistory ? '0px' : '0.5rem',
                    borderBottomLeftRadius: showHistory ? '0px' : '0.5rem',
                    boxShadow: showHistory ? 'none' : '',
                    width: chatPanelWidth,
                    bottom: fullScreen ? '0vh' : '2vh',
                    top: fullScreen ? '10.5vh' : 'calc(9vh + 2.5rem)',
                    paddingLeft: fullScreen ? '5rem' : '0',
                },
                footer: {
                    display: 'flex',
                    alignContent: 'center',
                    justifyContent: 'center',
                    maxWidth: fullScreen ? '70%' : '',
                    width: '100%',
                    margin: '0 auto',
                    paddingBottom: getTextFieldBottomPadding(),
                },
            }}
        >
            <div style={{ width: '100%' }}>
                <ChatbotGreetingsView
                    kaiResponse={responseHint}
                    loadingProps={loading}
                    fullScreen={fullScreen}
                    messagesProps={messages}
                    onPromptClick={() => {}}
                    onSuggestionSelect={handleSuggestionSelect}
                    onPromptGuideClick={() => {
                        setOpenPromptGuide(true);
                    }}
                />

                {openPromptGuide && renderPromtGuidelinesContent()}
            </div>
            <Drawer
                open={showHistory}
                mask={false}
                rootClassName={`${styles.historyDrawer} `}
                zIndex={900}
                closable={false}
                title={
                    <Flex
                        align="center"
                        justify="space-between"
                        className={styles.chatHistoryHeader}
                    >
                        <Flex align="center" gap={10}>
                            <Icon name="book-closed" size="xm" color="neutrals-B400" />
                            <label>Chat History</label>
                        </Flex>
                        <IconButton
                            icon="minus"
                            size="Small"
                            onClick={() => {
                                setShowHistory(false);
                            }}
                        />
                    </Flex>
                }
                styles={{
                    wrapper: {
                        width: historyPanelWidth,
                        bottom: fullScreen ? '0vh' : '2vh',
                        top: fullScreen ? '10.5vh' : 'calc(9vh + 2.5rem)',
                    },
                    content: {
                        marginRight: fullScreen ? '70vw' : '',
                        marginLeft: fullScreen ? '5rem' : '',
                        width: fullScreen ? '20rem' : '15rem',
                    },
                }}
            >
                <ChatbotHistory />
            </Drawer>
        </Drawer>
    );
}

export default ChatbotPanel;
