import React from 'react';
import { Flyout } from 'konnect-react-components';
import styles from './ExceptionDetailFlyout.module.scss';
import type { RawExceptionItem as ExceptionItem } from '../../../../../src/types/response';

interface Props {
    exception: ExceptionItem;
    onClose: () => void;
}

const ExceptionDetailFlyout: React.FC<Props> = ({ exception, onClose }) => {
    return (
        <Flyout
            key="detail-flyout"
            id="exception-detail-flyout"
            flyoutOpen={!!exception}
            direction="left"
            cancelIconClick={onClose}
            heading={exception?.title ?? 'Exception Details'}
            containerMaxWidth="172rem"
            className={styles['detail-flyout-container']}
            onBackDropClick={onClose}
            content={<div className={styles['content']}>{/* Add detail contents here */}</div>}
        />
    );
};

export default ExceptionDetailFlyout;
