import { ChatHistoryData } from "./ChatUtils"
import styles from './ChatbotHistory.module.scss';

function ChatbotHistory() {
  return (
    <div>
      {ChatHistoryData.map((item) => <div key={item.title} className={styles['headerText']}>{item.title}
        {item.messages.map((msg) => <div key={msg.sessionId} className={styles['messageContainer']}>
          <div className={styles['titleText']}>{msg.title}</div>
          <div className={styles['messageText']}>{msg.message}</div>
        </div>)}
      </div>)}
    </div>
  )
}

export default ChatbotHistory