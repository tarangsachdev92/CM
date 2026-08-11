import React, { Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    AppDispatch,
    fetchUserLanguage,
    RootState,
    setUserLanguage,
} from '../../store';
import styles from '../dpm/DpmScreen.module.scss';
import { AnimatedLoaders } from 'konnect-react-components';
import i18n from '../../i18n';

const GembaWalkMfe = React.lazy(() => import('gembaWalk/App'));

const GembaWalkScreen = () => {
    const dispatch = useDispatch<AppDispatch>();
    const userLanguage = useSelector((state: RootState) => state.userLanguage.data);

    return (
        <Suspense
            fallback={
                <div className={styles['overlay']}>
                    <AnimatedLoaders id="lazy-loader" type="page" />
                </div>
            }
        >
            <GembaWalkMfe
                language={userLanguage.languageCode ?? 'EN'}
                onLanguageChange={(language: {
                    languageCode: string;
                    languageName: string;
                }) => {
                    dispatch(setUserLanguage(language));
                    void i18n.changeLanguage(language.languageCode.toLowerCase());
                    void dispatch(fetchUserLanguage());
                }}
            />
        </Suspense>
    );
};

export default GembaWalkScreen;
