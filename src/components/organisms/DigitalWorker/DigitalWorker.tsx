import {
    AnimatedLoaders,
    AppReportCard,
    Flyout,
    Icon,
    Button,
    ToolTip,
} from 'konnect-react-components';
import Flex from 'antd/es/flex';
import styles from './DigitalWorker.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { useNavigate } from 'react-router-dom';
import { LeftArrowIcon, GembaWalkIcon, TruckInspectionIcon } from '../../../assets/icons/icons';
import { resetSelectedAFToDo } from '../../../store/slice/selectedAFToDoSlice';
import { useEffect, useRef, useState } from 'react';
import i18n from '../../../i18n/index';
import { getUserToolAccess } from '../../../services/users';
import Label from '../../atoms/label/Label';
import { DigitalWorkerNoAccess } from '../../../assets/images/images';
import { logError } from '../../../utils/helpers';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    setIsOpen: (open: boolean) => void;
}

const DigitalWorkerFlyout: React.FC<Props> = ({ isOpen, setIsOpen }) => {
    const { loading, error } = useSelector(
        (state: RootState) => state.exceptionFlyoutIssuesDetails,
    );

    const [isDigitalWorkerAllowed, setIsDigitalWorkerAllowed] = useState(false);
    const [isGembaWalkAllowed, setIsGembaWalkAllowed] = useState(true);
    const [isTruckInspectionAllowed, setIsTruckInspectionAllowed] = useState(true);
    const [isLoading, setisLoading] = useState(true);

    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();
    const flyoutRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        //Clearing the AF -todo redux value when the flyout opens
        dispatch(resetSelectedAFToDo());

        //check for user access for Diginitial worker
        const fetchUserToolAccess = async (toolName: string) => {
            try {
                setisLoading(true);
                const response = await getUserToolAccess(toolName);
                setIsDigitalWorkerAllowed(response?.data?.data);

                setIsGembaWalkAllowed(true);
                setIsTruckInspectionAllowed(true);
                setisLoading(false);
                setisLoading(false);
            } catch (error) {
                logError(error);
                setisLoading(false);
            }
        };

        fetchUserToolAccess('Digital Worker');
    }, []);

    const noPermissionHandler = () => {
        navigate('user-profile-settings');
        setIsOpen(false);
    };

    const renderEmptyState = () => {
        return (
            <Flex className={styles['empty-container']} gap={4}>
                <DigitalWorkerNoAccess />
                <Label type="body3">
                    <span className={styles['empty-container-heading']}>No Access Permission</span>
                </Label>
                <Label type="body3">
                    <span className={styles['empty-container-text']}>
                        Go to{' '}
                        <Button
                            className={styles['empty-container-link']}
                            onClick={() => noPermissionHandler()}
                            text="User Role Settings"
                            variant="Link"
                        />{' '}
                        , to raise the access for Digital Worker.
                    </span>
                </Label>
            </Flex>
        );
    };

    const getCustomActionsForFlyout = () => (
        <Flex justify="space-between" align="center" className={styles['custom-action-container']}>
            <span className={styles['header']}>AI Digital Worker</span>
            <Flex justify="flex-end" gap="16px">
                <ToolTip
                    direction="Top-Center"
                    text="Collapse flyout"
                    type="Text Only"
                    wrapperComponent={
                        <div className={styles['button']} onClick={() => setIsOpen(false)}>
                            {LeftArrowIcon()}
                        </div>
                    }
                />
            </Flex>
        </Flex>
    );

    const handleCardClick = async (path: string) => {
        setIsOpen(false);
        if (!location.pathname.includes('advanced-forecasting/future')) {
            navigate(path);
            try {
                const translationImport = path.includes('truck-inspection')
                    ? import('truckInspection/translations')
                    : path.includes('gemba-walk')
                      ? import('gembaWalk/translations')
                      : import('digitalWorker/translations');
                const module = await translationImport;
                const remoteTranslations = module.default;

                for (const [lang, value] of Object.entries(remoteTranslations)) {
                    i18n.addResourceBundle(lang, 'translation', value.translation, true, false);
                }
            } catch (err) {
                logError('Failed to load remote translations:', err);
            }
        }
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
            setIsOpen(false);
        }
    };

    useEffect(() => {
        const flyoutWrapper = document.getElementById('digitalworker-fly-out');
        if (!flyoutWrapper) return;

        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (target.closest('[class^="flyout-container"]')) return;

            onClickOutsideFlyoutContainer();
        };

        flyoutWrapper.addEventListener('click', handleClick);

        return () => flyoutWrapper.removeEventListener('click', handleClick);
    }, [onClickOutsideFlyoutContainer]);

    return (
        <Flyout
                content={
                    <div className={styles['content-container']}>
                        {isLoading || loading ? (
                            <Flex className={styles['initial-loader-container']}>
                                <AnimatedLoaders id="initial-loader" type="page" />
                            </Flex>
                        ) : error ? (
                            <div className={styles['empty-state-container']}>
                                <span className={styles['empty-text']}>Error</span>
                                <span>{error}</span>
                            </div>
                        ) : isDigitalWorkerAllowed || isGembaWalkAllowed || isTruckInspectionAllowed ? (
                            <div>
                                {isDigitalWorkerAllowed && (
                                    <AppReportCard
                                        defaultIcon="circle"
                                        defaultIconColor="feedback-error-color"
                                        description={
                                            <div
                                                className="analyticscolor"
                                                style={{ color: '#575757' }}
                                            >
                                                <div>
                                                    Facilitates problem-solving, provides
                                                    context-specific information, and accelerates
                                                    training and onboarding.
                                                </div>
                                            </div>
                                        }
                                        fillColor
                                        logoAsHtml={
                                            <Icon
                                                color="primary-green-color"
                                                name="troubleshooting-assitant"
                                                size="x10l"
                                            />
                                        }
                                        onRightIconClick={() => {}}
                                        selectedIcon="flag"
                                        selectedIconColor="$graph-blue-4-color"
                                        showTopLeftLogo
                                        size="Medium"
                                        title="Troubleshooting, Training & Onboarding and Knowledge Hub"
                                        tooltip="large tooltip"
                                        type="App"
                                        className={styles['card-analytics']}
                                        onCardClick={() =>
                                            handleCardClick(
                                                '/digital-worker/troubleshooting-assistant',
                                            )
                                        }
                                    />
                                )}

                                {isGembaWalkAllowed && (
                                    <AppReportCard
                                        defaultIcon="circle"
                                        defaultIconColor="feedback-error-color"
                                        description={
                                            <div
                                                className="analyticscolor"
                                                style={{ color: '#575757' }}
                                            >
                                                <div>
                                                    Track, manage and monitor Gemba Walk activities
                                                    across the organization.
                                                </div>
                                            </div>
                                        }
                                        fillColor
                                        logoAsHtml={
                                            (
                                                <GembaWalkIcon width={48} height={48} />
                                            ) as React.ReactNode
                                        }
                                        onRightIconClick={() => {}}
                                        selectedIcon="flag"
                                        selectedIconColor="$graph-blue-4-color"
                                        showTopLeftLogo
                                        size="Medium"
                                        title="Gemba Walk"
                                        tooltip="large tooltip"
                                        type="App"
                                        className={styles['card-analytics']}
                                        onCardClick={() =>
                                            handleCardClick('/digital-worker/gemba-walk')
                                        }
                                    />
                                )}

                                {isTruckInspectionAllowed && (
                                    <AppReportCard
                                        defaultIcon="circle"
                                        defaultIconColor="feedback-error-color"
                                        description={
                                            <div
                                                className="analyticscolor"
                                                style={{ color: '#575757' }}
                                            >
                                                <div>
                                                    Conduct inspections and verify truck compliance
                                                    as soon as the vehicle enters the facility gate.
                                                </div>
                                            </div>
                                        }
                                        fillColor
                                        logoAsHtml={
                                            (
                                                <TruckInspectionIcon width={48} height={48} />
                                            ) as React.ReactNode
                                        }
                                        onRightIconClick={() => {}}
                                        selectedIcon="flag"
                                        selectedIconColor="$graph-blue-4-color"
                                        showTopLeftLogo
                                        size="Medium"
                                        title="Truck Inspection"
                                        tooltip="large tooltip"
                                        type="App"
                                        className={styles['card-analytics']}
                                        onCardClick={() =>
                                            handleCardClick('/digital-worker/truck-inspection')
                                        }
                                    />
                                )}
                            </div>
                        ) : (
                            renderEmptyState()
                        )}
                    </div>
                }
                dataTestId="digitalworker-fly-out"
                flyoutOpen={isOpen}
                direction="left"
                cancelIconClick={() => setIsOpen(false)}
                heading=""
                flyoutBgColor="#F4F6F7"
                id="digitalworker-fly-out"
                className={styles['flyout-container-main']}
                customActions={getCustomActionsForFlyout()}
                containerMaxWidth="27rem"
            />
    );
};

export default DigitalWorkerFlyout;
