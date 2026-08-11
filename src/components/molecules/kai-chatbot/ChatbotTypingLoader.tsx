// TypingIndicator.tsx
import styles from "./ChatbotTypingLoader.module.scss";
export const TypingIndicator = () => {
    return (
        <div className={styles.wrapper}>
            <div className={styles.bubble}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
            </div>
        </div>
    );
};