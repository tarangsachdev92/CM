import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAFaccess } from '../../services/roles';
import { IAPIResponse, IAFAccessPermissionsRowData } from '../../types/response';
import { AnimatedLoaders, Toast } from 'konnect-react-components';
import styles from './advancedForecasting.module.scss';
import { fetchAfUserRoleFilterDetails } from '../../store/thunks/fetchAfUserRoleFilterDetails';
import { RootState, AppDispatch } from '../../store';
import { logError } from '../../utils/helpers';

const AdvancedForecastingMfe = React.lazy(() => import('advancedForecasting/AFWrapper'));

const AdvancedForecasting = () => {
    const dispatch: AppDispatch = useDispatch();
    const afUserRoleFilterDetails = useSelector(
        (state: RootState) => state.afUserRoleFilterDetails.roleDetail,
    );
    const afToDoDetails = useSelector((state: RootState) => state.selectedAFToDo);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [showToast, setShowToast] = useState<boolean>(false);

    const [mountKey, setMountKey] = useState<string>(() => `af-${Date.now()}`);
    const lastToDoIdRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        dispatch(fetchAfUserRoleFilterDetails());
    }, [dispatch]);
    useEffect(() => {
        const fetchAccessDetails = async () => {
            try {
                const response: IAPIResponse = await getAFaccess();

                if (!response.data?.data.roleDetail?.accessAndPermission) {
                    throw new Error('Unexpected response structure');
                }

                const hasAdvancedForecastingTool =
                    response.data.data.roleDetail.accessAndPermission.some(
                        (permission: IAFAccessPermissionsRowData) =>
                            permission.toolDetails?.toolName === 'Advanced Forecasting',
                    );

                setHasAccess(hasAdvancedForecastingTool);
                if (!hasAdvancedForecastingTool) {
                    setShowToast(true);
                }
            } catch (error) {
                logError('Error fetching access details:', error);
                setHasAccess(false);
                setShowToast(true);
            } finally {
                setLoading(false);
            }
        };

        fetchAccessDetails();
    }, []);

    useEffect(() => {
        if (!afToDoDetails) return;
        const currentId = afToDoDetails.taskAFId || afToDoDetails.selectedToDoId;
        if (!currentId) return; // Only react when we have a concrete identifier.
        if (lastToDoIdRef.current === currentId) return; // No change.
        lastToDoIdRef.current = currentId;
        // Use timestamp + id to force a full remount of remote module.
        setMountKey(`af-${Date.now()}-${currentId}`);
    }, [afToDoDetails?.taskAFId, afToDoDetails?.selectedToDoId, afToDoDetails]);

    if (loading) {
        return (
            <div className={styles['overlay']}>
                <AnimatedLoaders id="lazy-loader" type="page" />
            </div>
        );
    }

    if (hasAccess === false) {
        return (
            <>
                {showToast && (
                    <Toast
                        toggle
                        type="Error"
                        message="You don’t have access to Advanced Forecasting"
                        mode="Top Right"
                        distance="x10l"
                        onCloseToast={() => setShowToast(false)}
                        timer={3000}
                    />
                )}
            </>
        );
    }

    return (
        <div style={{ backgroundColor: 'white' }}>
            <React.Suspense
                fallback={
                    <div className={styles['overlay']}>
                        <AnimatedLoaders id="lazy-loader" type="page" />
                    </div>
                }
            >
                <AdvancedForecastingMfe
                    key={mountKey}
                    afUserRoleFilterDetails={afUserRoleFilterDetails}
                    toDoDetails={afToDoDetails}
                />
            </React.Suspense>
        </div>
    );
};

export default AdvancedForecasting;
