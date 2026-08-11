import { AnimatedLoaders, Divider, Flyout, SearchInput } from 'konnect-react-components';
import Flex from 'antd/es/flex';
import { Tooltip } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LeftArrowIcon } from '../../../assets/icons/icons';
import styles from '../performance-management/PerformanceManagementFlyout.module.scss';
import { UserProfileSettingsPrimaryRole } from '../../../assets/images/images';
import Label from '../../atoms/label/Label';
import { RootState } from '../../../store';
import CircleIconCard from '../../atoms/custom-icon-card/CustomIconCard';
import PerformanceReviewCard from '../../atoms/custom-icon-card/PerformanceReviewCard';
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
import SecondaryFlyout from './SecondaryFlyout';
import { getSideNavigationForums, updateFavoriteForums } from '../../../services/forums';
import { useTranslation } from 'react-i18next';
import { logError } from '../../../utils/helpers';
interface Props {
    isOpen: boolean;
    onClose: () => void;
    setIsOpen: (open: boolean) => void;
}

interface ForumFavorite {
    forumId: number;
    forumName: string;
    level: string;
    period: string;
    geography: string;
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
    const [favorites, setFavorites] = useState<ForumFavorite[]>([]);

    const [isSecondFlyoutVisible, setIsSecondFlyoutVisible] = useState(false);
    const [timePeriodFilterList, setTimePeriodFilterList] = useState<string[]>([]);
    const [selectedCardIds, setSelectedCardIds] = useState<Record<string, boolean>>({});
    const [allForums, setAllForums] = useState<any>([]);
    const [levelCounterList, setLevelCounterList] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [inputSearchTerm, setInputSearchTerm] = useState<string>('');
    const [clickedSearchBar, setClickedSearchBar] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [isFavoriteUpdating, setIsFavoriteUpdating] = useState(false);
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
    const handleForumCardClick = () => {
        setIsOpen(false); // Close primary flyout
        setIsSecondFlyoutVisible(false); // Close secondary flyout
        navigate('/performance-management'); // Optional navigation
    };

    const fetchLevelCounters = (response: any) => {
        const levelMap = response?.map((item: any) => ({
            [item.forumLevelName]: item.accessibleCount,
        }));

        const levelCounterObject = Object.assign({}, ...levelMap);
        setLevelCounterList(levelCounterObject);
    };
    const updateFavoriteStatus = async (forumIds: number[], isFavorite: boolean) => {
        setIsFavoriteUpdating(true);
        try {
            await updateFavoriteForums({ forumIds, isFavorite });

            const payload = {
                pageSize: 0,
                pageNumber: 0,
                sortColumnName: '',
                sortDirection: '',
                searchKeyword: '',
                searchTerm: debouncedSearchTerm,
                gridFilters: [],
                forumLevel: '',
                forumPeriod: '',
            };

            const updatedData = await getSideNavigationForums(payload);

            fetchFavorites(updatedData);
            fetchLevelCounters(updatedData?.levelCounts);
            fetchTimePeriod(updatedData);

            const isSearching = debouncedSearchTerm.trim().length > 0;
            const searchResults = Array.isArray(updatedData?.searchResults)
                ? updatedData.searchResults
                : [];
            const fallbackForums = Array.isArray(updatedData?.forums) ? updatedData.forums : [];

            const finalForums = isSearching ? searchResults : fallbackForums;
            setAllForums(finalForums);

            if (isSearching) {
                setIsSecondFlyoutVisible(true);
            }
        } catch (error) {
            logError('Error updating favorite status:', error);
        } finally {
            setIsFavoriteUpdating(false);
        }
    };

    useEffect(() => {
        const anySelected = Object.values(selectedCardIds).some(val => val);
        setIsSecondFlyoutVisible(anySelected);
    }, [selectedCardIds]);

    const fetchTimePeriod = (response: any) => {
        const periodList = response?.forumPeriods?.map((x: any) => x.forumPeriodName);
        setTimePeriodFilterList(periodList);
    };

    const fetchFavorites = (response: any) => {
        const myFavorites = response?.favorites || [];
        const formattedFavorites = myFavorites.map((fav: any) => ({
            forumId: fav.forumId,
            forumName: fav.forumName,
            level: fav.forumLevelName,
            period: fav.forumPeriodName,
            geography:
                fav.forumLevelName === 'Region'
                    ? fav.region
                    : fav.forumLevel === 'Cluster'
                      ? fav.cluster
                      : fav.forumLevel === 'Market'
                        ? fav.market
                        : fav.forumLevel === 'Site'
                          ? fav.site
                          : fav.forumLevelName,
        }));

        setFavorites(formattedFavorites);
    };

    const handleFlyoutClose = () => {
        setIsSecondFlyoutVisible(false);
    };

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const payload = {
                pageSize: 0,
                pageNumber: 0,
                sortColumnName: '',
                sortDirection: '',
                searchKeyword: '',
                searchTerm: debouncedSearchTerm,
                gridFilters: [],
                forumLevel: '',
                forumPeriod: '',
            };
            getSideNavigationForums(payload)
                .then(data => {
                    fetchTimePeriod(data);
                    fetchFavorites(data);
                    fetchLevelCounters(data?.levelCounts);
                    setAllForums(data?.forums);
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
        const payload = {
            pageSize: 0,
            pageNumber: 0,
            sortColumnName: '',
            sortDirection: '',
            searchKeyword: '',
            searchTerm: debouncedSearchTerm,
            gridFilters: [],
            forumLevel: '',
            forumPeriod: '',
        };

        setIsSearchLoading(true);

        getSideNavigationForums(payload)
            .then(data => {
                fetchFavorites(data);
                fetchLevelCounters(data?.levelCounts);
                fetchTimePeriod(data);

                const isSearching = debouncedSearchTerm.trim().length > 0;
                const searchResults = Array.isArray(data?.searchResults) ? data.searchResults : [];
                const fallbackForums = Array.isArray(data?.forums) ? data.forums : [];

                const finalForums = isSearching ? searchResults : fallbackForums;
                setAllForums(finalForums);

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
    }, [debouncedSearchTerm]);

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
                                        {favorites?.length === 0 ? (
                                            <span className={styles['empty-favorites']}>
                                                {t('performacemng.favoritespara')}
                                            </span>
                                        ) : isFavoriteUpdating ? (
                                            <div className={styles['review-level-loader']}>
                                                <AnimatedLoaders id="lazy-loader" type="page" />
                                            </div>
                                        ) : (
                                            favorites?.map(item => (
                                                <div>
                                                    <PerformanceReviewCard
                                                        title={item.forumName}
                                                        subtitle={`${item.level} | ${item.period} | ${item.geography}`}
                                                    />
                                                </div>
                                            ))
                                        )}
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
                    // onBackDropClick={() => {
                    //     if (!isSecondFlyoutVisible) {
                    //         setIsOpen(false);
                    //     }
                    // }}
                />
                {isSecondFlyoutVisible && (
                    <SecondaryFlyout
                        isOpen={isSecondFlyoutVisible}
                        onClose={handleFlyoutClose}
                        setIsOpen={setIsSecondFlyoutVisible}
                        forums={allForums}
                        isSearchResult={inputSearchTerm?.length > 0}
                        selectedId={
                            Object.keys(selectedCardIds).find(key => selectedCardIds[key]) ||
                            'Global'
                        }
                        timePeriodList={timePeriodFilterList}
                        clickedSearchBar={clickedSearchBar}
                        onFavoriteToggle={updateFavoriteStatus}
                        onCardClick={handleForumCardClick}
                        isFavoriteUpdating={isFavoriteUpdating}
                    />
                )}
            </div>
        </>
    );
};

export default PerformanceManagementFlyout;
