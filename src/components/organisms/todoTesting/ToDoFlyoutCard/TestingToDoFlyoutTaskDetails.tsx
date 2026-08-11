import React, { useEffect, useRef, useState } from 'react';
import SelectedTaskDetails from '../SelectedTaskDetails';
import { AnimatedLoaders, Flyout, Dialog } from 'konnect-react-components';
import styles from './ToDoFlyout.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import { Flex, Tooltip } from 'antd';
import GoToTaskButton from '../../../atoms/go-to-task-button/GoToTaskButton';
import { IToDoDetails } from '../../../../types/response';
import { To_DO_SOURCE } from '../../../../utils/constants';
import { setSelectedAFToDo } from '../../../../store/slice/selectedAFToDoSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateToDoStatus } from '../../../../services/todo';
import { AppDispatch, fetchToDosFlyout } from '../../../../store';
import ToDoKababMenu from '../../../atoms/todo-kabab-menu/ToDoKababMenu';
import { logError } from '../../../../utils/helpers';

type FlyoutOrigin = 'default' | 'settingsIgnored' | 'settingsSnoozed';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    setIsOpen: (open: boolean) => void;
    tasks: IToDoDetails[];
    selectedId: string;
    helpDisplay?: string;
    closeParentFlyout?: () => void;
    setKebabBusyFromParent?: (busy: boolean) => void;
    onRefresh: () => void;
    origin?: FlyoutOrigin;
    hideMarkComplete?: boolean;
}

const FlyoutTaskDetails: React.FC<Props> = ({
    isOpen,
    setIsOpen,
    onClose,
    tasks,
    selectedId,
    helpDisplay = 'none',
    closeParentFlyout,
    setKebabBusyFromParent,
    onRefresh,
    origin = 'default',
    hideMarkComplete = origin !== 'default',
}) => {
    const { loading, error } = useSelector(
        (state: RootState) => state.exceptionFlyoutIssuesDetails,
    );
    const [navigationDetails, setNavigationDetails] = useState<any>('');
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const [showDialog, setShowDialog] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
    const [isKebabBusy, setIsKebabBusy] = useState(false);
    const flyoutRef = useRef<HTMLDivElement>(null);

    const setKebabBusy = (busy: boolean) => {
        setIsKebabBusy(busy);
        setKebabBusyFromParent?.(busy);
    };

    const handleMarkCompleteClick = () => {
        setPendingStatus(true); // assuming button only marks as complete
        setShowDialog(true);
    };

    const handleConfirm = async () => {
        if (pendingStatus !== null) {
            try {
                await updateToDoStatus({
                    id: navigationDetails.id,
                    isCompleted: pendingStatus,
                });

                dispatch(
                    fetchToDosFlyout({
                        toolName: null,
                        priorityName: null,
                        dueDate: null,
                        startDueDate: null,
                        endDueDate: null,
                    }),
                );
                window.dispatchEvent(new CustomEvent('todo:refresh'));
                setIsOpen(false);
            } catch (error) {
                logError('Failed to update task status:', error);
            }
        }
        setShowDialog(false);
        setPendingStatus(null);
    };

    const handleCancel = () => {
        setShowDialog(false);
        setPendingStatus(null);
    };

    useEffect(() => {
        const onClose = () => setIsOpen(false);
        window.addEventListener('todo:close-details', onClose);
        return () => window.removeEventListener('todo:close-details', onClose);
    }, [setIsOpen]);

    useEffect(() => {
        const selectedTask = tasks.find(x => String(x.id) === selectedId);
        if (selectedTask) {
            setNavigationDetails(selectedTask);
        }
    }, [selectedId, tasks, dispatch]);
   const handleGoToTaskClick = () => {
    if (!navigationDetails) return;

    // ✅ Advanced Forecasting (unchanged)
    if (navigationDetails.source === To_DO_SOURCE.AdvancedForecasting) {
        dispatch(
            setSelectedAFToDo({
                title: navigationDetails.title ?? '',
                subtitle: navigationDetails.subtitle ?? '',
                taskAFId: String(navigationDetails?.id ?? ''),
            }),
        );

        if (window.location.pathname.includes('/advanced-forecasting')) {
            navigate('/home');
            setTimeout(() => navigate('/advanced-forecasting'), 0);
        } else {
            navigate('/advanced-forecasting');
        }
    } 
    // ✅ Issues
    else if (navigationDetails.moduleName === 'Issues') {
        navigate(
            `/issues?issueId=${navigationDetails.sourceSystemUniqueIdentifier}` +
            `&section=${navigationDetails.exceptionSectionName}`,
        );
    } 
    // ✅ Risks (RO)
    else {
        navigate(
            `/ro?exceptionId=${navigationDetails.sourceSystemUniqueIdentifier}` +
            `&section=${navigationDetails.exceptionSectionName}`,
        );
    }

    setIsOpen(false);
    closeParentFlyout?.();
};

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const onClickOutsideFlyoutContainer = () => {
        if (isOpen) {
            if (!isKebabBusy) {
                setIsOpen(false);
                onClose();
            }
        }
    };

    useEffect(() => {
        const flyoutWrapper = document.getElementById('to-do-details-fly-out-o');
        if (!flyoutWrapper) return;

        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (
                target.closest('[class^="_flyout-container-secondmain"]') ||
                target.closest('[class^="flyout-header"]') ||
                target.closest('[class^="flyout-footer"]') ||
                target.closest('[class^="_todo-flyout-body-padding"]') ||
                target.closest('[class^="_custom-button"]') ||
                target.closest('[class^="dialog-Small"]')
            )
                return;

            onClickOutsideFlyoutContainer();
        };

        flyoutWrapper.addEventListener('click', handleClick);
        return () => flyoutWrapper.removeEventListener('click', handleClick);
    }, [onClickOutsideFlyoutContainer]);

    const flyoutDirection = origin === 'default' ? 'left' : 'right';

    const flyoutClass =
        origin === 'default'
            ? styles['flyout-container-secondmain']
            : styles['flyout-container-secondmain--settingsRight'];

    const getCustomActionsForFlyout = () => (
        <Flex justify="space-between" align="center" className={styles['custom-action-container']}>
            <Flex justify="end" gap="16px" style={{ width: '100%' }}>
                <Tooltip title={null}>
                    <Flex style={{ marginLeft: 'auto', marginRight: '12px' }} gap="1rem">
                        <Tooltip
                            title="Help & Documentation"
                            placement="bottom"
                            className={styles['display-none']}
                        >
                            <span>
                                <button
                                    className={styles['question-mark-button']}
                                    onClick={() => {}}
                                    title={''}
                                    disabled={true}
                                >
                                    ?
                                </button>
                            </span>
                        </Tooltip>
                        {/* <Button
                            icon="arrow-square-up-right"
                            onClick={() => {}}
                            size="S"
                            text="Go To Task"
                        /> */}
                        <GoToTaskButton size="small" onClick={handleGoToTaskClick} />
                        {!hideMarkComplete && (
                            <GoToTaskButton
                                size="small"
                                label="Mark Complete"
                                onClick={handleMarkCompleteClick}
                            />
                        )}
                        <ToDoKababMenu
                            task={navigationDetails}
                            origin={origin}
                            setIsKebabBusy={setKebabBusy}
                            onActionComplete={() => {
                                setIsOpen(false);
                            }}
                        />
                    </Flex>
                </Tooltip>
                {/* <Tooltip title={null}>
                    <div className={styles['button']} onClick={() => setIsOpen(false)}>
                        {LeftArrowIcon()}
                    </div>
                </Tooltip> */}
            </Flex>
        </Flex>
    );

    return (
        <>
            <Flyout
                content={
                    <div className={styles['content-container']}>
                        {loading ? (
                            <Flex className={styles['initial-loader-container']}>
                                <AnimatedLoaders id="initial-loader" type="page" />
                            </Flex>
                        ) : error ? (
                            <div className={styles['empty-state-container']}>
                                <span className={styles['empty-text']}>Error</span>
                                <span>{error}</span>
                            </div>
                        ) : (
                            <div className={styles['todo-flyout-body-padding']}>
                                <SelectedTaskDetails
                                    tasks={tasks}
                                    selectedId={selectedId}
                                    helpDisplay={helpDisplay}
                                    clearSelection={onRefresh}
                                />
                            </div>
                        )}
                    </div>
                }
                dataTestId="fly-out"
                flyoutOpen={isOpen}
                direction={flyoutDirection}
                cancelIconClick={() => {
                    setIsOpen(false);
                    onClose();
                }}
                heading=""
                className={flyoutClass}
                customActions={getCustomActionsForFlyout()}
                flyoutBgColor={'white'}
                id="to-do-details-fly-out-o"
                // onBackDropClick={() => {
                //     if (!isKebabBusy) {
                //         setIsOpen(false);
                //         onClose();
                //     }
                // }}
                iconForCancel={{
                    icon: 'x-close',
                    onClick: () => {
                        setIsOpen(false);
                        onClose();
                    },
                }}
            />
            <Dialog
                title={'Mark Complete'}
                content={`You are marking the to-do as complete. Click on “Mark Complete” to confirm this action.`}
                isOpen={showDialog}
                onClose={handleCancel}
                onPrimaryButtonClick={handleConfirm}
                primaryButtonText="Mark Complete"
            />
        </>
    );
};

export default FlyoutTaskDetails;
