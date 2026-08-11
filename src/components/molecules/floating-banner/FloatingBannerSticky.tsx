import { AlertTriangle, Close } from "../../../assets/images/images";
import styles from "./FloatingBannerSticky.module.scss";

type Props = {
    isOpen: boolean;
    updateEnvBannerState: (mainBannerState: boolean) => void
    env: string;
}

function FloatingBannerSticky({ isOpen, updateEnvBannerState, env }: Readonly<Props>) {

    return (
        <>
            {!isOpen ? (
                <div className={styles["floating-banner"]}>
                    <div
                        className={styles["banner-tab"]}
                        onClick={() => updateEnvBannerState(true)}
                    >
                        <AlertTriangle />
                        <span>{env}</span>
                    </div>
                </div>
            ) : (
                <div className={styles["banner-wrap"]}>
                    <div className={styles["banner-full"]}>
                        <button
                            className={styles["close-btn"]}
                            onClick={() => updateEnvBannerState(false)}
                        >
                            <Close />
                        </button>

                        <div className={styles["banner-row"]}>
                            <AlertTriangle />

                            <div>
                                <div className={styles["banner-title"]}>
                                    Test Environment Active
                                </div>

                                <div className={styles["banner-text"]}>
                                    You're currently in the {env} environment. Data may be incomplete.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default FloatingBannerSticky;