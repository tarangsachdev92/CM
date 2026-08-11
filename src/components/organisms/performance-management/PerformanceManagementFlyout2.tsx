import { AnimatedLoaders, Divider, Flyout, SearchInput } from 'konnect-react-components';
import Flex from 'antd/es/flex';
import { Tooltip } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LeftArrowIcon } from '../../../assets/icons/icons';
import styles from '../performance-management/PerformanceManagementFlyout2.module.scss';
import { UserProfileSettingsPrimaryRole } from '../../../assets/images/images';
import Label from '../../atoms/label/Label';
import { RootState } from '../../../store';
import CircleIconCard from '../../atoms/custom-icon-card/CustomIconCard';
import {
    primaryGreen100Color,
    primaryGreen50Color,
    primaryGreenColor,
    secondaryPurple100Color,
    secondaryPurpleIntermediateColor,
    secondaryYellow100Color,
    secondaryYellow50Color,
    secondaryYellowColor,
    secondaryPurpleColor,
    primaryOrange100Color,
    primaryOrange50Color,
    primaryOrangeColor,
    secondaryBlue100Color,
    graphBlue4Color,
    graphBlueColor,
    ROLE_TYPE,
} from '../../../utils/constants';
import { useEffect, useRef, useState } from 'react';
import SecondaryFlyout2 from './SecondaryFlyout2';
import {  getSideNavigationTools } from '../../../services/forums';
import { useTranslation } from 'react-i18next';
import { logError } from '../../../utils/helpers';
import type { SelectedToolState } from '../../../store/slice/selectedToolSlice';
interface Props {
    isOpen: boolean;
    onClose: () => void;
    setIsOpen: (open: boolean) => void;
}

export function GuestUserLogin() {
    const { t } = useTranslation('performance-mangment-translation', { useSuspense: false });
    return (
        <Flex className={styles['empty-state-flex-container']} vertical gap={24}>
            <UserProfileSettingsPrimaryRole />
            <Label type="body1">{t('kpi.noRoleSetup')}</Label>

            <Label type="body3">
                <span className={styles['card-children-content-text']}>
                    {t('kpi.goto')}{' '}
                    <Link
                        to="/user-profile-settings"
                        className={styles['card-children-content-text-anchor']}
                    >
                        {t('kpi.userRoleSettings')}
                    </Link>
                    {''}, {t('kpi.addPrAndSecRole')}
                </span>
            </Label>
        </Flex>
    );
}

const PerformanceManagementFlyout: React.FC<Props> = ({ isOpen, setIsOpen }) => {
    const userPrimaryRole = useSelector((state: RootState) => state.userRole.primary);
    const isGuestUser = useSelector((state: RootState) => state.primaryRole);
    const isPrimaryRoleAdded =
        userPrimaryRole?.isAnyADGroupPending || isGuestUser.data.roleType === ROLE_TYPE.GUEST;

    const [isSecondFlyoutVisible, setIsSecondFlyoutVisible] = useState(false);
    const [timePeriodFilterList, setTimePeriodFilterList] = useState<string[]>([]);
    const [selectedCardIds, setSelectedCardIds] = useState<Record<string, boolean>>({});
    const [allTools, setAllTools] = useState<any>([]);
    const [levelCounterList, setLevelCounterList] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [inputSearchTerm, setInputSearchTerm] = useState<string>('');
    const [clickedSearchBar, setClickedSearchBar] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    // const [isFavoriteUpdating, setIsFavoriteUpdating] = useState(false);
    const flyoutRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();

    const { t } = useTranslation('performance-mangment-translation', { useSuspense: false });

    const handleCardClick = (cardId: string) => {
        setSelectedCardIds(prev => {
            const updated: Record<string, boolean> = {};

            // Set all cards to false except the one clicked
            Object.keys(prev).forEach(key => {
                updated[key] = false;
            });

            // Toggle the clicked card
            updated[cardId] = !prev[cardId];

            return updated;
        });
    };
    const handleForumCardClick = (selectedToolData: SelectedToolState) => {
        setIsOpen(false); // Close primary flyout
        setIsSecondFlyoutVisible(false); // Close secondary flyout
        navigate('/performance-management', { state: { selectedToolData } }); // Optional navigation
    };

    const fetchLevelCounters = (response: any) => {
        const levelMap = response?.map((item: any) => ({
            [item.reportLevelName]: item.accessibleCount,
        }));

        const levelCounterObject = Object.assign({}, ...levelMap);
        setLevelCounterList(levelCounterObject);
    };
   

    useEffect(() => {
        const anySelected = Object.values(selectedCardIds).some(val => val);
        setIsSecondFlyoutVisible(anySelected);
    }, [selectedCardIds]);

    const fetchTimePeriod = (response: any) => {
        const periodList = response.forumPeriods.map((x: any) => x.reportPeriodName);
        setTimePeriodFilterList(periodList);
    };

    const handleFlyoutClose = () => {
        setIsSecondFlyoutVisible(false);
    };

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const payload = {
                reportLevel: '',
                reportPeriod: '',
                searchTerm: '',
                toolId: 0,
            };
            getSideNavigationTools(payload)
                .then(data => {
                    fetchTimePeriod(data);
                    fetchLevelCounters(data?.forumLevels);
                    setAllTools(data?.tools);
                })
                .catch(error => {
                    logError('Error fetching forum data:', error);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [isOpen]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(inputSearchTerm);
        }, 500); // 500ms debounce delay

        return () => {
            clearTimeout(handler); // Clear timeout on every keystroke
        };
    }, [inputSearchTerm]);

    useEffect(() => {
          if (!isOpen) return;
        const payload = {
            reportLevel: '',
            reportPeriod: '',
            searchTerm: debouncedSearchTerm,
            toolId: 0,
        };

        setIsSearchLoading(true);

        getSideNavigationTools(payload)
            .then(data => {
                fetchLevelCounters(data?.forumLevels);
                fetchTimePeriod(data);

                const isSearching = debouncedSearchTerm.trim().length > 0;
                const searchResults = Array.isArray(data?.searchResults) ? data.searchResults : [];
                const fallbackTools = Array.isArray(data?.tools) ? data.tools : [];
                const finalForums = isSearching ? searchResults : fallbackTools;      
                setAllTools(finalForums);

                if (isSearching) {
                    setIsSecondFlyoutVisible(true);
                }
            })
            .catch(error => {
                logError('Error fetching forum data:', error);
            })
            .finally(() => {
                setIsSearchLoading(false);
            });
      }, [debouncedSearchTerm, isOpen]);

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
        const flyoutWrapper = document.getElementById('todo-fly-out');
        if (!flyoutWrapper) return;

        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (target.closest('[class^="flyout-container"]')) return;

            onClickOutsideFlyoutContainer();
        };

        flyoutWrapper.addEventListener('click', handleClick);
        return () => flyoutWrapper.removeEventListener('click', handleClick);
    }, [onClickOutsideFlyoutContainer]);

    const getCustomActionsForFlyout = () => (
        <Flex justify="space-between" align="center" className={styles['custom-action-container']}>
            <span className={styles['header']}>{t('performacemng.title')}</span>
            <Flex justify="flex-end" gap="16px">
                <Tooltip title="Collapse flyout">
                    <div className={styles['button']} onClick={() => setIsOpen(false)}>
                        {LeftArrowIcon()}
                    </div>
                </Tooltip>
            </Flex>
        </Flex>
    );

    return (
        <>
            <div style={{ display: 'flex' }}>
                <Flyout
                    content={
                        isPrimaryRoleAdded ? (
                            GuestUserLogin()
                        ) : isLoading ? (
                            <div className={styles['initial-loader-container']}>
                                <AnimatedLoaders id="lazy-loader" type="page" />
                            </div>
                        ) : (
                            <div>
                                <Flex vertical className={styles['flyout-container']}>
                                    <div
                                        onMouseDown={() => setClickedSearchBar(true)}
                                        onBlur={() => setClickedSearchBar(false)}
                                    >
                                        <SearchInput
                                            menuButton
                                            menuButtonProps={{
                                                onClick: () => {},
                                                options: [{ label: 'Report', value: 'Report' }],
                                                text: 'Report',
                                                optionContainerClass:
                                                    styles['search-box-container'],
                                            }}
                                            defaultValue={inputSearchTerm}
                                            onChange={value => {
                                                setInputSearchTerm(String(value));
                                                setIsSecondFlyoutVisible(true);
                                            }}
                                            placeholder="Search Report"
                                            className={styles['searchInput']}
                                        />
                                    </div>
                                    <Divider className={styles['vertical-divider']} />
                                </Flex>
                                {/* <CustomIconCard /> */}
                                <Flex className={styles['cards-container']}>
                                    <Flex className={styles['heading']}>
                                        <span>{t('performacemng.subtitle')}</span>
                                        <span>Demo</span>
                                    </Flex>

                                    {isSearchLoading ? (
                                        <div className={styles['review-level-loader']}>
                                            <AnimatedLoaders id="lazy-loader" type="page" />
                                        </div>
                                    ) : (
                                        <Flex className={styles['only-cards']}>
                                            <Flex className={styles['two-cards']}>
                                                <CircleIconCard
                                                    iconName="globe-01"
                                                    size={50}
                                                    circleBackgroundColor={primaryGreenColor}
                                                    cardBackgroundColor={primaryGreen50Color}
                                                    cardBorderColor={primaryGreen100Color}
                                                    label={t('performacemng.global')}
                                                    count={levelCounterList['Global'] || 0}
                                                    onClick={() => handleCardClick('Global')}
                                                    isSelected={selectedCardIds['Global']}
                                                />
                                                <CircleIconCard
                                                    iconName="globe-05"
                                                    size={50}
                                                    circleBackgroundColor={secondaryYellowColor}
                                                    cardBackgroundColor={secondaryYellow50Color}
                                                    cardBorderColor={secondaryYellow100Color}
                                                    label={t('performacemng.region')}
                                                    count={levelCounterList['Region'] || 0}
                                                    onClick={() => handleCardClick('Region')}
                                                    isSelected={selectedCardIds['Region']}
                                                />
                                            </Flex>
                                            <Flex className={styles['two-cards']}>
                                                <CircleIconCard
                                                    iconName="bezier-curve-03"
                                                    size={50}
                                                    circleBackgroundColor={secondaryPurpleColor}
                                                    cardBackgroundColor={secondaryPurple100Color}
                                                    cardBorderColor={
                                                        secondaryPurpleIntermediateColor
                                                    }
                                                    label={t('performacemng.cluster')}
                                                    count={levelCounterList['Cluster'] || 0}
                                                    onClick={() => handleCardClick('Cluster')}
                                                    isSelected={selectedCardIds['Cluster']}
                                                />
                                                <CircleIconCard
                                                    iconName="flag-03"
                                                    size={50}
                                                    circleBackgroundColor={primaryOrangeColor}
                                                    cardBackgroundColor={primaryOrange50Color}
                                                    cardBorderColor={primaryOrange100Color}
                                                    label={t('performacemng.market')}
                                                    count={levelCounterList['Market'] || 0}
                                                    onClick={() => handleCardClick('Market')}
                                                    isSelected={selectedCardIds['Market']}
                                                />
                                            </Flex>
                                            <Flex className={styles['site-card']}>
                                                <CircleIconCard
                                                    iconName="building-05"
                                                    size={50}
                                                    circleBackgroundColor={graphBlueColor}
                                                    cardBackgroundColor={graphBlue4Color}
                                                    cardBorderColor={secondaryBlue100Color}
                                                    label={t('performacemng.site')}
                                                    count={levelCounterList['Site'] || 0}
                                                    onClick={() => handleCardClick('Site')}
                                                    isSelected={selectedCardIds['Site']}
                                                />
                                            </Flex>
                                        </Flex>
                                    )}
                                    <Divider className={styles['vertical-divider']} />
                                    <Flex className={styles['heading']}>
                                        <span style={{ marginTop: 10 }}>
                                            {t('performacemng.favorites')}
                                        </span>
                                        
                                    </Flex>
                                </Flex>
                            </div>
                        )
                    }
                    dataTestId="todo-fly-out"
                    flyoutOpen={isOpen}
                    direction="left"
                    cancelIconClick={() => setIsOpen(false)}
                    heading=""
                    className={styles['flyout-container-main']}
                    flyoutBgColor={'#F4F6F7'}
                    customActions={getCustomActionsForFlyout()}
                    id="todo-fly-out"
                    containerMaxWidth="26rem"
                />
                {isSecondFlyoutVisible && (
                    <SecondaryFlyout2
                        isOpen={isSecondFlyoutVisible}
                        onClose={handleFlyoutClose}
                        setIsOpen={setIsSecondFlyoutVisible}
                        tools={allTools}
                        isSearchResult={inputSearchTerm?.length > 0}
                        selectedId={
                            
                            Object.keys(selectedCardIds).find(key => selectedCardIds[key]) ||
                            'Global'
                            
                        }
                        timePeriodList={timePeriodFilterList}
                        clickedSearchBar={clickedSearchBar}
                        onFavoriteToggle={() => {}}
                        onCardClick={handleForumCardClick}
                        isFavoriteUpdating={false}
                    />
                )}
            </div>
        </>
    );
};

export default PerformanceManagementFlyout;
