import styles from './Card.module.scss';

interface CardProps {
    preLabel?: React.ReactNode;
    title: string;
    label?: React.ReactNode;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    extra?: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

function Card({ preLabel, title, label, children, style, extra, onClick }: Readonly<CardProps>) {
    return (
        <div
            className={`${styles['main-card']} ${onClick ? styles['clickable'] : ''}`}
            style={style}
            onClick={onClick}
        >
            <div className={styles['card-head-wrapper']}>
                <div>
                    {preLabel && <div className={styles['card-prelabel']}>{preLabel}</div>}

                    <div className={styles['card-title']}>{title}</div>
                    {label ? <div className={styles['card-label']}>{label}</div> : <></>}
                </div>
                <div>{extra}</div>
            </div>
            <span>{children}</span>
        </div>
    );
}

export default Card;
