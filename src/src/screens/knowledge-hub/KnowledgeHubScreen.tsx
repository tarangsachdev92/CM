import React, { Suspense } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Flex } from 'antd';
import styles from '../dpm/DpmScreen.module.scss';
import { AnimatedLoaders } from 'konnect-react-components';
import { useIsGuestUser } from '../../utils/customHooks';

const KnowledgeHubMfe = React.lazy(() => import('knowledgeHub/App'));
const KnowledgeHubScreen = () => {
    const isGuestUser = useIsGuestUser();
    const userLanguage = useSelector((state: RootState) => state.userLanguage.data);
    const selectedSubFunctionId = useSelector(
        (state: RootState) => state.knowledgeHub.selectedSubFunctionId
    );
    const knowledgeHubUrl = import.meta.env.VITE_KNOWLEDGEHUB_URL;
    const isFlyoutClosed = useSelector(
        (state: RootState) => state.knowledgeHub.isFlyoutClose
    );

    return (
        <Flex align="center" justify="center" vertical gap={24}>
            <Suspense
                fallback={
                    <div className={styles['overlay']}>
                        <AnimatedLoaders id="lazy-loader" type="page" />
                    </div>
                }
            >
                <KnowledgeHubMfe
                    language={userLanguage.languageCode ?? 'EN'}
                    selectedFunction={selectedSubFunctionId}
                    knowledgeHubUrl={knowledgeHubUrl}
                    isFlyoutClosed={isFlyoutClosed}
                    isGuestUser={isGuestUser}
                />
            </Suspense>
        </Flex>
    );
};

export default KnowledgeHubScreen;