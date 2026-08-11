import { useEffect, useRef, useState } from "react";
import animationData from "../../../assets/animate-icon/happy-kai.json";
import styles from "./KaiAssistant.module.scss";
import Lottie from "react-lottie";
import { getCurrentUserFullName } from "../../../utils/helpers";
import { useIsGuestUser } from "../../../utils/customHooks";
import { KAIAssistantPlaceholder } from "../../../assets/images/images";

type KaiAssistantProps = {
    setOpenChatPanel: (open: boolean) => void;
    openPanel: boolean;
}

const KaiAssistant = ({ openPanel, setOpenChatPanel }: KaiAssistantProps) => {
    const [visible, setVisible] = useState(false);
    const hideTimeout = useRef<NodeJS.Timeout | null>(null);
    const lottieContainerRef = useRef<HTMLDivElement | null>(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [isLottieLoaded, setIsLottieLoaded] = useState(false);
    const isGuestUser = useIsGuestUser()

    useEffect(() => {
        // Show on first page load
        setVisible(true);     
        setTimeout(() => {
            setIsLottieLoaded(true)
        }, 2000);  
        // Hide after 5 seconds
        const timer = setTimeout(() => {
            setShowWelcome(false)
            setVisible(false);
        }, 6000);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setShowWelcome(false);
    };

    const handleKaiClick = () => {
        setShowWelcome(false)
        setVisible(false)
        setOpenChatPanel(true)
    };

    const handleMouseEnter = () => {
        if (openPanel) {
            return
        }
        if (hideTimeout.current) {
            clearTimeout(hideTimeout.current);
        }
        // const hasSeenKai = localStorage.getItem("hasSeenKai");
        if (isGuestUser) {
            setShowWelcome(true);
            localStorage.setItem("hasSeenKai", "true");
        }
        setVisible(!visible);
    };

    const handleMouseLeave = () => {
        if (openPanel) {
            return
        }
        hideTimeout.current = setTimeout(() => {
            setVisible(false);
            setShowWelcome(false)
        }, 1000);
    };

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };

    return (
        <>
            {/* Background Overlay */}
            <div
                className={`${styles.overlay} ${visible ? styles.overlayShow : styles.overlayHide
                    }`}
            />          
            {/* Hover Detection Area */}
            {<div
                className={styles.kaiContainer}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {showWelcome && (
                    <div className={styles.messageBox}>
                        <button
                            className={styles.closeBtn}
                            onClick={handleClose}
                        >
                            ×
                        </button>
                        <div className={styles['messageTitle']}>
                            Hi {isGuestUser ? 'Guest User' : getCurrentUserFullName()},
                        </div>
                        <div className={styles['messageText']}>
                            Welcome to Operations Command Center.
                            <br />
                            I’m <span className={styles.messageTextBold}>KAI</span>, your personal assistant.
                            <span className={styles.messageTextBold}> Click on my  <br /> icon to get started.</span>
                        </div>
                        <div className={styles.messageArrow} />
                    </div>
                )}

                {/* Kai Assistant */}
                <div
                    onClick={handleKaiClick}
                    className={`${styles.kaiWrapper} ${visible ? styles.show : styles.hide
                        }`}
                >
                    <div className={styles.kaiCircle}>                        
                        {!isLottieLoaded && (
                            <div className={styles.kaiFallback}>
                                <KAIAssistantPlaceholder/>
                            </div>
                        )}
                        <div className={styles.kaiLottieContainer} ref={lottieContainerRef}>
                            <Lottie
                                options={defaultOptions}
                                height={100}
                                width={100}
                            />
                        </div>
                    </div>
                </div>
            </div>}
        </>
    );
};

export default KaiAssistant;