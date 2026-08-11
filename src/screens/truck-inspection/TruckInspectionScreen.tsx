import React, { Suspense } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import styles from '../dpm/DpmScreen.module.scss';
import { AnimatedLoaders } from 'konnect-react-components';

const TruckInspectionMfe = React.lazy(() => import('truckInspection/App'));

/**
 * Hosts the Truck Inspection MFE from the Digital Worker flyout route.
 *
 * Deliberately renders the remote without a centering `Flex` wrapper: on a
 * column flex container `align-items: center` collapses the child to its
 * content width, which leaves the MFE short of the full page width.
 */
const TruckInspectionScreen = () => {
    const userLanguage = useSelector((state: RootState) => state.userLanguage.data);

    return (
        <Suspense
            fallback={
                <div className={styles['overlay']}>
                    <AnimatedLoaders id="lazy-loader" type="page" />
                </div>
            }
        >
            <TruckInspectionMfe hostMode language={userLanguage.languageCode ?? 'EN'} />
        </Suspense>
    );
};

export default TruckInspectionScreen;
