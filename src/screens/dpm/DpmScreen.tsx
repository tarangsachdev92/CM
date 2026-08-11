import { Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatedLoaders } from 'konnect-react-components';
import React from 'react';
import { Flex } from 'antd';
import styles from './DpmScreen.module.scss';
import { getUserToolAccess } from '../../services/users';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ReportAccessDeniedState } from '../../assets/images/images';
import Label from '../../components/atoms/label/Label';
import { logError } from '../../utils/helpers';

const DpmMfe = React.lazy(() => import('dpmWrapper/dpm'));

const DpmScreen = () => {
    const globalFilters = useSelector((state: RootState) => state.userGlobalFilters.data);
    const localFilters = useSelector((state: RootState) => state.localFilter.selectedLocalFilters);
    const dateDetails = useSelector((state: RootState) => state.setSelectedCalendar.data);
    const selectedForumCardDetails = useSelector((state: RootState) => state.selectedForum);
    const [isuserAllowed, setIsuserAllowed] = useState(false);
    const [isLoading, setisLoading] = useState(false);

    //TO DO : - this needs to be populated based on user selection on side navigation for DPM
    const extraFilters = useMemo(() => {
        return {
            Level:
                selectedForumCardDetails.level === 'Region'
                    ? 'Regional'
                    : selectedForumCardDetails.level,
            Frequency: selectedForumCardDetails.period,
            Forum: selectedForumCardDetails.forums,
        };
    }, [selectedForumCardDetails]);

    useEffect(() => {
        const fetchUserToolAccess = async (toolName: string) => {
            try {
                setisLoading(true);
                const response = await getUserToolAccess(toolName);
                setIsuserAllowed(response?.data?.data);
                setisLoading(false);
            } catch (error) {
                logError(error);
                setisLoading(false);
            }
        };

        fetchUserToolAccess('DPM');
    }, []);

    const renderEmptyState = () => {
        return (
            <div className={styles['overlay']}>
                <Flex vertical align="center" justify="center" gap={4}>
                    <ReportAccessDeniedState />
                    <Flex vertical align="center" justify="center" gap={4}>
                        <Label type="body1">
                            <span className={styles['report-empty-state-title']}>
                                You don’t have access to this forum.
                            </span>
                        </Label>
                    </Flex>
                </Flex>
            </div>
        );
    };

    return (
        <>
            <Flex vertical gap={24}>
                <Suspense
                    fallback={
                        <div className={styles['overlay']}>
                            <AnimatedLoaders id="lazy-loader" type="page" />
                        </div>
                    }
                >
                    {isLoading ? (
                        <div className={styles['overlay']}>
                            <AnimatedLoaders id="lazy-loader" type="page" />
                        </div>
                    ) : isuserAllowed ? (
                        <DpmMfe
                            calendarData={dateDetails}
                            globalFilters={globalFilters}
                            localFilters={localFilters}
                            extraFilters={extraFilters}
                            BASE_URL={process.env.VITE_BASE_URL}
                        />
                    ) : (
                        renderEmptyState()
                    )}
                </Suspense>
            </Flex>
        </>
    );
};

export default DpmScreen;
