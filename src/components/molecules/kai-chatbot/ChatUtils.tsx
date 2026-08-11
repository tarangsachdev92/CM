export const PromptGuidelines = [
    {
        id: 1,
        title: "Recommended",
        icon: 'annotation-check',
        guidelines: [
            "Summarize my key updates",
            "Are there any risks I should be aware of?",
            "What’s changed since yesterday?"
        ],
        isOpen: false
    },
    {
        id: 2,
        title: "Performance Tracking",
        icon: 'speedo-meter-03',
        guidelines: [
            "Summarize my key updates",
            "Are there any risks I should be aware of?",
            "What’s changed since yesterday?"
        ],
        isOpen: false
    },
    {
        id: 3,
        title: "Information Retrieval",
        icon: 'file-search-03',
        guidelines: [
            "Summarize my key updates",
            "Are there any risks I should be aware of?",
            "What’s changed since yesterday?"
        ],
        isOpen: false
    },
    {
        id: 4,
        title: "Task Management",
        icon: 'target-icon-grey',
        guidelines: [
            "Summarize my key updates",
            "Are there any risks I should be aware of?",
            "What’s changed since yesterday?"
        ],
        isOpen: false
    }
]

export const ChatHistoryData = [
    {
        title: 'Today',
        messages: [
            {
                sessionId: "1",
                message: 'Show me the latest status of the shipments.',
                title: 'Chat History 1'
            },
            {
                sessionId: "2",
                message: 'Show me the latest status of the shipments.',
                title: 'Chat History 2'
            },
            {
                sessionId: "3",
                message: 'Show me the latest status of the shipments.',
                title: 'Chat History 3'
            }
        ],
    },
    {
        title: 'Yesterday',
        messages: [
            {
                sessionId: "4",
                message: 'Show me the latest status of the shipments.',
                title: 'Chat History 1'
            },
            {
                sessionId: "5",
                message: 'Show me the latest status of the shipments.',
                title: 'Chat History 2'
            }
        ]
    }
]


export type IconsChatBot =
    | 'annotation-check'
    | 'speedo-meter-03'
    | 'file-search-03'
    | 'target-icon-grey'

export const ChatBotMessages: ChatMessageType[] = [{
    id: 0,
    isTyping: false,
    showActions: true,
    sender: 'bot',
    text: "Hello there, I notice that your unique role hasn't been set up, can I assist you with the same?"
}, {
    id: 1,
    isTyping: false,
    showActions: false,
    sender: 'bot',
    text: "Yes! Set up my unique role"
}, {
    id: 2,
    isTyping: false,
    showActions: false,
    sender: 'bot',
    text: "No! I'll do it myself"
}, {
    id: 3,
    isTyping: false,
    showActions: false,
    sender: 'bot',
    text: "I need help with something else"
}, {
    showActions: true, id: 100, isTyping: false, sender: 'bot', text: "Sure, click here to setup your role in Command Centre. Alternatively, you can access it by: 1. Clicking on the settings icon 2. Set up a primary role followed by the secondary. Allow the dashboard to be personalised for you and enjoy your experience."
}, { showActions: true, id: 100, isTyping: false, sender: 'bot', text: "Got it! You can continue the process, and I’ll be here if you need help later." },
{ showActions: true, id: 100, isTyping: false, sender: 'bot', text: "No problem. What would you like help with? You can tell me what you’re trying to do, or choose from common actions like reviewing access or managing roles." }
]

export type ChatMessageType = { id: number | undefined, sender: string, text: string, showActions: boolean, isTyping: boolean }

export const GuestUserRoleSetupSuggestions = [{
                id: 1,
                text: "Yes! Set up my unique role"
            }, {
                id: 2,
                text: "No! I'll do it myself"
            }, {
                id: 3,
                text: "I need help with something else"
            }]