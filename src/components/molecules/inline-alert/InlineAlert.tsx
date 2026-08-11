import { ReactNode } from 'react';
import { Icon } from 'konnect-react-components';
import styles from './InlineAlert.module.scss';

type AlertVariant = 'success' | 'error';

type InlineAlertProps = {
    title: string;
    description?: string | ReactNode;
    variant?: AlertVariant;
};

const InlineAlert = ({ title, description, variant = 'success' }: InlineAlertProps) => {
    const isError = variant === 'error';

    return (
        <div
            className={isError ? styles['inline-alert-error'] : styles['inline-alert-success']}
            role="alert"
            aria-live="polite"
        >
            <Icon
                name={isError ? 'alert-circle' : 'check-circle'}
                size="xm"
                color={isError ? 'feedback-error-color' : 'feedback-success-color'}
            />

            <div className={styles['inline-alert-content']}>
                <div className={styles['inline-alert-title']}>{title}</div>

                {description && (
                    <div className={styles['inline-alert-description']}>{description}</div>
                )}
            </div>
        </div>
    );
};

export default InlineAlert;
