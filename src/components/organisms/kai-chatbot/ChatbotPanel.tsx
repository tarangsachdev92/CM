import { Drawer, Flex } from 'antd';
import styles from './ChatbotPanel.module.scss';
import ChatPanelHeader from '../../molecules/kai-chatbot/ChatPanelHeader';
import ChatbotInputTextbox from '../../molecules/kai-chatbot/ChatbotInputTextbox';
import ChatbotGreetingsView, { ChatMessage } from '../../molecules/kai-chatbot/ChatbotGreetingsView';
import { useCallback, useEffect, useState } from 'react';
import { Icon, IconButton } from 'konnect-react-components';
import ChatbotHistory from '../../molecules/kai-chatbot/ChatbotHistory';
import ChatbotPromptGuide from '../../molecules/kai-chatbot/ChatbotPromptGuide';
import { postMessageToChatBot } from '../../../services/chatbot';

type ChatBotPanelProps = {
    openChatPanel: boolean;
    setOpenChatPanel: (open: boolean) => void
}

function ChatbotPanel({ openChatPanel, setOpenChatPanel }: ChatBotPanelProps) {
    const [textInput, setTextInput] = useState<string>('');
    const [isFreshConv, setIsFreshConv] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [fullScreen, setFullScreen] = useState(false);
    const [openPanel, setOpenPanel] = useState(false);
    const [openPromptGuide, setOpenPromptGuide] = useState(false)
    const [isChatDisplayed, setIsChatDisplayed] = useState(false)


    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [conversationId] = useState(() => crypto.randomUUID())
    const TENANT_ID = process.env.VITE_CHATBOT_TENANT_ID;

    const uiContext = useCallback(
        () => ({
            tenantId: TENANT_ID || '',
            geoLevel: 'Region',
            region: ['India'],
            timePeriodLevel: 'Weekly',
            locale: "en-US",
        }),
        [TENANT_ID],
    );


    const sendMessage = async (text: string) => {
        const content = text.trim();
        if (!content || loading) return;

        setMessages((m) => [...m, { role: "user", markdown: content }]);
        setLoading(true);
        
        try {
            const res = await postMessageToChatBot({
                    conversationId: conversationId,
                    message: { role: "user", content },
                    uiContext: uiContext()                
            });
            console.log(res)
            const assistant = res.assistantMessage ?? res.assistant_message;
            setMessages((m) => [
                ...m,
                {
                    role: "assistant",
                    markdown: assistant?.contentMarkdown ?? assistant?.content_markdown,
                    ui: assistant?.ui ?? [],
                    debug: res.debug,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setOpenPanel(openChatPanel)
        setIsFreshConv(true);
    }, [openChatPanel])

    const setUserMessage = (message: string) => {
        setTextInput(message);
        setIsFreshConv(false);
    }

    const getChatPanelWidth = () => {
        if (fullScreen) {
            return showHistory ? 'calc(100vw - 20rem)' : '100vw';
        }
        return '26.25rem';
    }

    const chatPanelWidth = getChatPanelWidth();

    const historyPanelWidth = fullScreen ? (showHistory ? '100vw' : '0vw') : '41.25rem';

    const handleOnClosePanel = () => {
        setOpenChatPanel(false);
        setShowHistory(false);
        setFullScreen(false);
    }

    const renderPromtGuidelinesContent = () => {
        return (<ChatbotPromptGuide showHistory={showHistory} fullScreen={fullScreen} onCloseClick={() => setOpenPromptGuide(false)} />)
    }

    const getTextFieldBottomPadding = () => {
        if (fullScreen) {
            if (isChatDisplayed) {
                return '90px'
            } else {
                return '100px'
            }
        } else {
            return ''
        }
    }

    //Handle Send message
    const handleSendMessage = () => {
        sendMessage(textInput);
        console.log('sending message', textInput)
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
                    onMicClick={() => { }}
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
                    onCloseClick={() => { handleOnClosePanel() }}
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
                    paddingBottom: getTextFieldBottomPadding()
                }
            }}
        >
            <div style={{ width: '100%' }}>
                <ChatbotGreetingsView loadingProps={loading} fullScreen={fullScreen} messagesProps={messages} onPromptClick={() => { }} onPromptGuideClick={() => { setOpenPromptGuide(true) }} />
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
