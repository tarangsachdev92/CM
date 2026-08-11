import { useDispatch, useSelector } from 'react-redux';
import { Card, Label } from '../../atoms';
import { AppDispatch, fetchToDoWidgetDetails, RootState } from '../../../store';
import { Flex } from 'antd';
import { DotView, MyToDoEmptyState, MyToDoWidgetEmptyState } from '../../../assets/images/images';
import { Link, useNavigate } from 'react-router-dom';
import styles from './ToDoHome.module.scss';
import { useCallback, useEffect, useState } from 'react';
import ProgressCircle from '../../atoms/progress-circle/ProgressCircle';
import ToDoHeader from './ToDoHeader';
import { AnimatedLoaders, AppReportCard, CheckBox, Dialog } from 'konnect-react-components';
import { IToDoDetails } from '../../../types/response';
import { updateToDoStatus } from '../../../services/todo';
import ToDoFlyout from './ToDoFlyoutCard/ToDoFlyout';
import {
    criticalFlagValue,
    highFlagValue,
    lowFlagValue,
    mediumFlagValue,
    neutralsB300Color,
    neutralsB80Color,
} from '../../../utils/constants';
import { useTranslation } from 'react-i18next';
import { logError } from '../../../utils/helpers';

function ToDoHome({ cardHeight = '74vh' }: Readonly<{ cardHeight?: string }>) {
    const [myTasksCount, setMyTasksCount] = useState<number>(0);
    const [completionPercenatge, setCompletionPercenatge] = useState<number>(0);
    const [firstName, setFirstName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [showDialog, setShowDialog] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
    const [selectedId, setSelectedId] = useState<string>('');
    const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
    const [task, setTask] = useState<IToDoDetails>({
        id: 0,
        sourceSystemUniqueIdentifier: 0,
        title: '',
        status: '',
        completedOn: '',
        dueDate: '',
        priority: '',
        assignedTo: '',
        assignee: '',
        source: '',
        moduleName: '',
        sectionId: '',
        issueSectionName: '',
        exceptionSectionName: '',
        description: '',
        subtitle: '',
        readmorelink: null,
    });
    const userRole = useSelector((state: RootState) => state.primaryRole.data);

    const isGuestUser = userRole?.role?.toLowerCase() == 'guest user';
    const dispatch = useDispatch<AppDispatch>();
    const { data: todoWidgetDetails } = useSelector((state: RootState) => state.todoWidgetDetails);
    const checkboxChecked = showDialog && pendingStatus !== null ? pendingStatus : isCompleted;
    const navigate = useNavigate();

    const userGlobalFilters = useSelector(
        (state: RootState) => state.userGlobalFilters?.data?.userGlobalFilters ?? {},
    );
    const product = userGlobalFilters?.products;
    const geographies = userGlobalFilters?.geographies;
    const customers = userGlobalFilters?.customers;
    const { t } = useTranslation('user-home-translation');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            await dispatch(fetchToDoWidgetDetails());
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        fetchData();
    }, [fetchData, userGlobalFilters, product, geographies, customers]);

    const handleStatusUpdate = async (newStatus: boolean) => {
        try {
            await updateToDoStatus({
                id: task.id,
                isCompleted: newStatus,
            });
            setIsCompleted(newStatus);
            fetchData();
        } catch (error) {
            logError('Failed to update task status:', error);
        }
    };

    const handleConfirm = () => {
        if (pendingStatus !== null) {
            handleStatusUpdate(pendingStatus);
        }
        setShowDialog(false);
        setPendingStatus(null);
    };

    const handleCancel = () => {
        setShowDialog(false);
        setPendingStatus(null);
    };

    useEffect(() => {
        if (todoWidgetDetails && todoWidgetDetails !== null) {
            setMyTasksCount(todoWidgetDetails.totalTodo);
            setCompletionPercenatge(Math.round(todoWidgetDetails.completedOnTimeRatio * 100));
            setFirstName(todoWidgetDetails.firstName);

            setTask(prevState => ({
                ...prevState,
                id: todoWidgetDetails.id,
                sourceSystemUniqueIdentifier: todoWidgetDetails.sourceSystemUniqueIdentifier,
                title: todoWidgetDetails.title,
                status: todoWidgetDetails.status,
                completedOn: todoWidgetDetails.completedOn,
                dueDate: todoWidgetDetails.dueDate,
                priority: todoWidgetDetails.priority,
                assignedTo: todoWidgetDetails.assignedTo,
                assignee: todoWidgetDetails.assignee,
                source: todoWidgetDetails.source,
                sectionId: todoWidgetDetails.sectionId,
                issueSectionName: todoWidgetDetails.issueSectionName,
                description: todoWidgetDetails.description,
                subtitle: todoWidgetDetails.subtitle,
                readmorelink: todoWidgetDetails.readmorelink,
            }));
            setIsCompleted(todoWidgetDetails.status === 'Completed');
        }
    }, [todoWidgetDetails]);

    const SingleToDoCard = () => {
        return (
            <>
                {myTasksCount == 0 && completionPercenatge == 100 ? (
                    <Card title={''} onClick={() => navigate(`/todo`)}>
                        <Flex className={styles['minor-empty-state']} align="center" gap="small">
                            <MyToDoWidgetEmptyState />

                            <Label type="body3">
                                <span className={styles['card-children-content-text']}>
                                    {t('todo.noPendingTask')}
                                </span>
                            </Label>
                        </Flex>
                    </Card>
                ) : (
                    <>
                        <div onClick={e => e.stopPropagation()}>
                            <AppReportCard
                                defaultIcon="circle"
                                customIcon={isCompleted ? 'check-square' : undefined}
                                description={
                                    <div style={{ color: neutralsB300Color }}>
                                        {task.source}{' '}
                                        <span>
                                            <DotView />
                                        </span>
                                        <span>
                                            {' '}
                                            Due:{' '}
                                            {new Date(task.dueDate).toLocaleDateString(
                                                'en-CA',
                                            )}{' '}
                                        </span>
                                    </div>
                                }
                                fillColor
                                onCardClick={() => {
                                    setSelectedId(String(task.id));
                                    setIsFlyoutOpen(true);
                                }}
                                selectedIcon={
                                    task.priority === criticalFlagValue ? 'flag' : 'flag-02'
                                }
                                selectedIconColor={
                                    task.priority === criticalFlagValue
                                        ? 'feedback-error-color'
                                        : task.priority === highFlagValue
                                          ? 'feedback-error-color'
                                          : task.priority === mediumFlagValue
                                            ? 'feedback-warning-color'
                                            : task.priority === lowFlagValue
                                              ? 'secondary-blue-300-color'
                                              : 'secondary-blue-300-color'
                                }
                                size="Medium"
                                title={String(task.title)}
                                subTitle={
                                    <div>
                                        <span style={{ color: neutralsB80Color }}>
                                            {String(task.subtitle)}
                                        </span>
                                    </div>
                                }
                                type="App"
                                className={`${styles.cardcontent}`}
                                width="89%"
                                showTopLeftLogo={true}
                                logoAsHtml={
                                    <div>
                                        <CheckBox
                                            checked={checkboxChecked}
                                            onChange={(checked: boolean) => {
                                                setPendingStatus(checked);
                                                setShowDialog(true);
                                            }}
                                            aria-label="Open status dialog"
                                            className={isCompleted ? styles.cursorblock : ''}
                                        />
                                    </div>
                                }
                            />
                        </div>
                        <Dialog
                            title={'Mark Complete'}
                            content={`You are marking the to-do as complete. Click on “Mark Complete” to confirm this action.`}
                            isOpen={showDialog}
                            onClose={handleCancel}
                            onPrimaryButtonClick={handleConfirm}
                            onSecondaryButtonClick={handleCancel}
                            primaryButtonText="Mark Complete"
                            secondaryButtonText="To-do Pending"
                        />
                    </>
                )}
            </>
        );
    };

    const getTextByPercentageCompletion = (percentage: number): string => {
        if (percentage <= 0) {
            return t('todo.zeroPercent');
        }
        if (percentage <= 25) {
            return t('todo.twentyFivePercent');
        }
        if (percentage <= 50) {
            return t('todo.fiftyPercent');
        }
        if (percentage <= 75) {
            return t('todo.seventyFivePercent');
        }
        if (percentage <= 99) {
            return t('todo.ninetyninePercent');
        }
        if (percentage === 100) {
            return t('todo.hundredPercent');
        }

        return '';
    };

    const ToDoGuestUserState = () => {
        if (loading) {
            return (
                <Flex className={styles['initial-loader-container']}>
                    <AnimatedLoaders id="initial-loader" type="page" />
                </Flex>
            );
        }

        return (
            <>
                {isGuestUser ? (
                    <Flex className={styles['todo-card-children']} vertical gap={10}>
                        <MyToDoEmptyState />

                        <Label type="body3">
                            <span className={styles['card-children-content-text']}>
                                Go to{' '}
                                <Link
                                    to="/user-profile-settings"
                                    className={styles['card-children-content-text-anchor']}
                                >
                                    User Role Settings
                                </Link>
                                {''}, Add primary & secondary roles, to start viewing your to-do's
                            </span>
                        </Label>
                    </Flex>
                ) : myTasksCount === 0 && completionPercenatge == 0 ? (
                    <Flex className={styles['todo-card-children']} vertical gap={10}>
                        <MyToDoEmptyState />

                        <Label type="body3">
                            <span className={styles['card-children-content-text']}>
                                {t('todo.noPendingTask')}
                            </span>
                        </Label>
                    </Flex>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {/* Top row: Text on left, ProgressCircle on right */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                position: 'relative',
                                width: '100%',
                            }}
                        >
                            {/* Text block on the left */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: '400',
                                }}
                            >
                                <span>
                                    {getTextByPercentageCompletion(completionPercenatge)}{' '}
                                    {firstName}
                                </span>
                            </div>

                            {/* ProgressCircle on the right */}
                            <div
                                style={{
                                    position: 'relative',
                                    top: '-50px',
                                    marginRight: '-100px',
                                }}
                            >
                                <ProgressCircle percentage={completionPercenatge} />
                            </div>
                        </div>
                        <div className={styles['bottom-section']}>
                            {/* <SingleToDoCard /> */}
                            {/* Bottom row: ToDoHeader full width */}

                            <div className={styles['card-head-wrapper']} style={{ width: '100%' }}>
                                <SingleToDoCard />
                                <div style={{ marginTop: '20px' }}>
                                    <ToDoHeader count={myTasksCount} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };

    const generateLabel = () => {
        if (userRole?.role?.toLowerCase() !== 'guest user') {
            if (myTasksCount > 0) {
                return t('todo.myTodos');
            } else {
                return t('todo.noTaskAssigned');
            }
        } else {
            return t('todo.noTaskAssigned');
        }
    };

    return (
        <>
            <Card
                preLabel={<span>{t('todo.WeeksStatus')}</span>}
                title={loading ? '' : generateLabel()}
                style={{ height: cardHeight }}
                onClick={() => navigate(`/todo`)}
            >
                <ToDoGuestUserState />
            </Card>

            <ToDoFlyout
                isOpen={isFlyoutOpen}
                setIsOpen={setIsFlyoutOpen}
                onClose={() => setIsFlyoutOpen(false)}
                onFilterChange={() => {}}
                externalSelectedId={selectedId}
            />
        </>
    );
}

export default ToDoHome;
