import React, { Suspense } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Flex } from 'antd';
import styles from '../dpm/DpmScreen.module.scss';
import { AnimatedLoaders } from 'konnect-react-components';

const DigitalWorkerMfe = React.lazy(() => import('digitalWorker/App'));
const DigitalWorkerScreen = () => {
    const userLanguage = useSelector((state: RootState) => state.userLanguage.data);

    return (
        <>
            <Flex align="center" justify="center" vertical gap={24}>
                <Suspense
                    fallback={
                        <div className={styles['overlay']}>
                            <AnimatedLoaders id="lazy-loader" type="page" />
                        </div>
                    }
                >
                    <DigitalWorkerMfe language={userLanguage.languageCode ?? 'EN'} />
                </Suspense>
            </Flex>
        </>
    );
};

export default DigitalWorkerScreen;
