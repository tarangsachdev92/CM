import styles from './EmptyState.module.scss';

type EmptyStateOfComponentProps = {
    emptyStateImage: React.ReactNode;
    emptyStateTitle: string;
    emptyStateMessage: string;
};

function EmptyStateOfComponent({
    emptyStateImage,
    emptyStateTitle,
    emptyStateMessage,
}: Readonly<EmptyStateOfComponentProps>) {
    return (
        <div className={styles['empty-state-container']}>
            {emptyStateImage}
            <span className={styles['empty-state-typography-1']}>{emptyStateTitle}</span>
            <span className={styles['empty-state-typography-2']}>{emptyStateMessage}</span>
        </div>
    );
}

export default EmptyStateOfComponent;
