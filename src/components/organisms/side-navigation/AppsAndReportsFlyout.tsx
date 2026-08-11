import React, { useEffect, useState, useRef } from 'react';
import { Flex, Divider } from 'antd';
import { Label } from '../../atoms';
import {
    Flyout,
    SearchInput,
    Accordion,
    AppReportCard,
    AnimatedLoaders,
} from 'konnect-react-components';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAppAndReportsSearchResults,
    fetchMyFavourites,
    fetchRecentlyOpenedAppsAndReports,
    type AppDispatch,
    type RootState,
} from '../../../store';
import { fetchToggleFavourite } from '../../../store/thunks/fetchToggleFavourite';
import { AppReport } from '../../../types/request';
import { ExternalLinkIcon, LeftArrowIcon } from '../../../assets/icons/icons';
import styles from './AppsAndReportsFlyout.module.scss';
import { NoMatchesFound } from '../../../assets/images/images';
import { useNavigate } from 'react-router-dom';
import { setFavouritesUpdated } from '../../../store/slice/appAndReportSlice';
import { useTranslation } from 'react-i18next';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    setIsOpen: (open: boolean) => void;
}

const mapToAppReport = (items: any[], forceFavourite: boolean): AppReport[] =>
    items.map(item => ({
        objectId: item.objectId,
        objectName: item.objectName,
        objectOwner: item.objectOwner,
        description: item.description,
        documentationURL: item.documentationURL ?? undefined,
        applicationURL: item.applicationURL ?? undefined,
        isFavourite: forceFavourite ? true : item.isFavourite,
        objectType: item.objectType,
    }));

const AppsAndReportsFlyout: React.FC<Props> = ({ isOpen, setIsOpen }) => {
    const { t } = useTranslation('digital-tools-library', { useSuspense: false });
    const dispatch = useDispatch<AppDispatch>();
    const flyoutRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const searchedResultsData = useSelector(
        (state: RootState) => state.appReports.data,
    ) as AppReport[];
    const getMyFavourites = useSelector((state: RootState) => state.myFavourites.data);
    const favoriteData = Array.isArray(getMyFavourites?.favouriteItems)
        ? getMyFavourites.favouriteItems
        : [];
    const getRecentlyOpened = useSelector(
        (state: RootState) => state.recentlyOpenedAppsAndReports.data,
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [myFavourites, setMyFavourites] = useState<AppReport[]>([]);
    const [recentlyOpened, setRecentlyOpened] = useState<AppReport[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<'App' | 'Report'>('App');
    const [isFavouritesLoading, setIsFavouritesLoading] = useState(false);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchResults, setSearchResults] = useState<AppReport[]>([]);
    const [totalFavouriteCount, setTotalFavouriteCount] = useState<number>(0);

    useEffect(() => {
        const updatedTotal =
            (getMyFavourites?.favouriteCount?.totalAppFavourites || 0) +
            (getMyFavourites?.favouriteCount?.totalReportFavourites || 0);
        setTotalFavouriteCount(updatedTotal);
    }, [getMyFavourites?.favouriteCount]);

    useEffect(() => {
        setSearchResults(searchedResultsData);
    }, [searchedResultsData]);

    useEffect(() => {
        const payload = {
            objectType: selectedCategory === 'App' ? 'Application' : 'Report',
            objectName: debouncedQuery || null,
        };
        dispatch(fetchMyFavourites(payload));
        dispatch(fetchRecentlyOpenedAppsAndReports(payload));
    }, [dispatch, selectedCategory]);

    useEffect(() => {
        setMyFavourites(mapToAppReport(favoriteData, true));
        setRecentlyOpened(mapToAppReport(getRecentlyOpened.slice(0, 5), false));
    }, [favoriteData, getRecentlyOpened]);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedQuery(searchQuery), 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (debouncedQuery.trim()) {
                setIsSearchLoading(true);
                const searchType = selectedCategory === 'App' ? 'Application' : 'Report';
                await dispatch(
                    fetchAppAndReportsSearchResults({
                        searchKeyword: debouncedQuery,
                        searchType,
                    }),
                );
                setIsSearchLoading(false);
            }
        };

        fetchSearchResults();
    }, [debouncedQuery, selectedCategory, dispatch]);

    useEffect(() => {
        const fetchInitialData = async () => {
            const payload = {
                objectType: selectedCategory === 'App' ? 'Application' : 'Report',
                objectName: debouncedQuery || null,
            };
            await dispatch(fetchMyFavourites(payload));
            await dispatch(fetchRecentlyOpenedAppsAndReports(payload));
            setIsInitialLoading(false);
        };
        fetchInitialData();
    }, [dispatch]);

    useEffect(() => {
        const selectedCategoryString = selectedCategory === 'App' ? 'Application' : 'Report';
        const filteredFavourites = mapToAppReport(
            favoriteData.filter((item: any) => item.objectType === selectedCategoryString),
            true,
        );
        const filteredRecentlyOpened = mapToAppReport(
            getRecentlyOpened
                .filter(item => item.objectType === selectedCategoryString)
                .slice(0, 5),
            false,
        );
        setMyFavourites(filteredFavourites);
        setRecentlyOpened(filteredRecentlyOpened);
    }, [favoriteData, getRecentlyOpened, selectedCategory]);

    const [expandedSection, setExpandedSection] = useState<'favourites' | 'recentlyOpened' | null>(
        myFavourites.length === 0 && recentlyOpened.length === 0 ? null : 'favourites',
    );

    useEffect(() => {
        if (myFavourites.length > 0) {
            setExpandedSection('favourites');
        } else if (recentlyOpened.length > 0) {
            setExpandedSection('recentlyOpened');
        } else {
            setExpandedSection(null);
        }
    }, [myFavourites, recentlyOpened]);

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

    const handleToggleFavourite = async (
        index: number,
        list: AppReport[],
        setList: (list: AppReport[]) => void,
        item: AppReport,
    ) => {
        if (totalFavouriteCount >= 5 && !item.isFavourite) return;
        const updated = list.map((itm, i) =>
            i === index ? { ...itm, isFavourite: !itm.isFavourite } : itm,
        );
        setList(updated);

        const payload = {
            objectId: item.objectId,
            objectType: selectedCategory === 'App' ? 'Application' : 'Report',
            isFavourite: !item.isFavourite,
        };

        const fetchRecentlyOpenedAppsAndReportsPayload = {
            objectType: selectedCategory === 'App' ? 'Application' : 'Report',
            objectName: debouncedQuery || null,
        };
        await dispatch(fetchToggleFavourite(payload));

        setIsFavouritesLoading(true);
        await dispatch(
            fetchMyFavourites({
                objectType: selectedCategory === 'App' ? 'Application' : 'Report',
                objectName: null,
            }),
        );
        await dispatch(fetchRecentlyOpenedAppsAndReports(fetchRecentlyOpenedAppsAndReportsPayload));
        setIsFavouritesLoading(false);
        dispatch(setFavouritesUpdated(true));
    };

    const getCustomActionsForFlyout = () => (
        <Flex justify="space-between" align="center" className={styles['custom-action-container']}>
            <span className={styles['header']}>{t('title')}</span>
            <Flex justify="flex-end" gap="16px">
                <div
                    className={styles['button']}
                    onMouseDown={e => {
                        e.stopPropagation();
                        setIsOpen(false);
                        navigate('/digital-tools-library');
                        setIsOpen(false);
                    }}
                >
                    {ExternalLinkIcon()}
                </div>
                <div className={styles['button']} onClick={() => setIsOpen(false)}>
                    {LeftArrowIcon()}
                </div>
            </Flex>
        </Flex>
    );

    const getHeartTooltip = (item: AppReport, count: number) =>
        count >= 5 && !item.isFavourite ? t('favouritesLimitReached') : '';

    const openApplicationOrReport = (
        id: string,
        toolName: string,
        toolType: string,
        description?: string,
    ) => {
        setIsOpen(false);

        if (id && toolName && toolType) {
            navigate(`/digital-tools-library/${toolType}/${id}/${toolName}`, {
                state: { description: description?.trim() ?? '' },
            });
        }
    };

    const renderAppReportCards = (
        data: AppReport[],
        setList: (list: AppReport[]) => void,
        count: number,
    ) =>
        data.map((item, index) => (
            <div key={index} style={{ cursor: 'pointer' }}>
                <AppReportCard
                    additionalDescription={
                        <div>
                            <div>Owner: {item.objectOwner?.split('@')[0] ?? ''}</div>
                            <div
                                onClick={event => {
                                    window.open(item.documentationURL ?? '#', '_blank');
                                    event.stopPropagation();
                                }}
                            >
                                <span className={styles['documentation-access-typography']}>
                                    Documentation & Access
                                </span>
                            </div>
                        </div>
                    }
                    defaultIcon="heart"
                    tooltip={getHeartTooltip(item, count)}
                    defaultIconColor={item.isFavourite ? 'secondary-coral-color' : 'black-color'}
                    selectedIcon="heart"
                    selectedIconColor={item.isFavourite ? 'secondary-coral-color' : 'black-color'}
                    showIconOnHover={false}
                    size="Medium"
                    title={item.objectName ?? ''}
                     type="App"
                    onCardClick={() => {
                        openApplicationOrReport(
                            item.objectId,
                            item.objectName,
                            item.objectType,
                            item.description,
                        );
                    }}
                    description={
                        <div
                            key={index}
                            style={{ cursor: 'pointer', fontWeight: '400', color: '#575757' }}
                        >
                            {item.description ?? ''}
                        </div>
                    }
                    className={styles['cards']}
                    fillColor={item.isFavourite}
                    onRightIconClick={() => handleToggleFavourite(index, data, setList, item)}
                />
            </div>
        ));

    const handleSearchChange = (value: string | string[]) => {
        if (typeof value === 'string') {
            const normalizedValue = value.replace(/\s+/g, ' ').trim();
            setSearchQuery(normalizedValue);
        }
    };

    const handleCategoryChange = (value: string) => {
        if (value === 'App' || value === 'Report') {
            setSelectedCategory(value);
            setSearchQuery('');
        }
    };

    const onClickOutsideFlyoutContainer = () => {
        if (isOpen) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        const flyoutWrapper = document.getElementById('app-reports-flyout');
        if (!flyoutWrapper) return;

        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (target.closest('[class^="flyout-container"]')) return;

            onClickOutsideFlyoutContainer();
        };

        flyoutWrapper.addEventListener('click', handleClick);
        return () => flyoutWrapper.removeEventListener('click', handleClick);
    }, [onClickOutsideFlyoutContainer]);

    const noRecordsFound = () => (
        <Flex
            vertical
            className={styles['am-empty-state']}
            align="center"
            justify="center"
            gap={16}
        >
            <Flex vertical align="center" justify="center" gap={15}>
                <NoMatchesFound />
                <Flex vertical align="center" justify="center" gap={4}>
                    <Label type="body1">
                        <span className={styles['am-empty-state-title']}>
                            {t('noMatchesFound')}
                        </span>
                    </Label>
                    <Label type="body2">
                        <span className={styles['am-empty-state-description']}>
                            {t('noMatchesFoundDescription')}
                        </span>
                    </Label>
                </Flex>
            </Flex>
        </Flex>
    );

    return (
        <Flyout
            key="flyout"
            id="app-reports-flyout"
            flyoutOpen={isOpen}
            direction="left"
            cancelIconClick={() => setIsOpen(false)}
            heading=""
            containerMaxWidth="28rem"
            className={styles['flyout-container-main']}
            flyoutBgColor={'#F4F6F7'}
            content={
                isInitialLoading ? (
                    <Flex className={styles['initial-loader-container']}>
                        <AnimatedLoaders id="initial-loader" type="page" />
                    </Flex>
                ) : (
                    <Flex vertical className={styles['flyout-container']}>
                        <SearchInput
                            menuButton
                            menuButtonProps={{
                                onClick: column => setSelectedCategory(column.value),
                                options: [
                                    { label: 'App', value: 'App' },
                                    { label: 'Report', value: 'Report' },
                                ],
                                text: selectedCategory,
                                optionContainerClass: styles['search-box-container'],
                            }}
                            onChange={value => {
                                const normalizedValue =
                                    typeof value === 'string'
                                        ? value.replace(/\s+/g, ' ').trim()
                                        : value;
                                handleSearchChange(normalizedValue);
                                if (normalizedValue === 'App' || normalizedValue === 'Report') {
                                    handleCategoryChange(normalizedValue);
                                }
                            }}
                            placeholder={t('search')}
                            className={styles['searchInput']}
                        />

                        <Divider className={styles['vertical-divider']} />

                        {searchQuery.trim() && isSearchLoading ? (
                            <Flex align="center" justify="center" style={{ height: '100%' }}>
                                <AnimatedLoaders
                                    id="search-loader"
                                    text={t('searching')}
                                    type="page"
                                />
                            </Flex>
                        ) : searchQuery.trim() && !isSearchLoading ? (
                            <>
                                {searchedResultsData.length > 0 && (
                                    <Flex
                                        justify="space-between"
                                        align="center"
                                        className={styles['search-results-header']}
                                    >
                                        <Label type="body2">{`${searchedResultsData.length} ${t('searchResults')}`}</Label>
                                    </Flex>
                                )}
                                <Flex vertical wrap gap={10} className={styles['card-container']}>
                                    {searchedResultsData.length > 0
                                        ? renderAppReportCards(
                                              searchResults,
                                              setSearchResults,
                                              totalFavouriteCount,
                                          )
                                        : noRecordsFound()}
                                </Flex>
                            </>
                        ) : (
                            <>
                                {/* My Favourites Section */}
                                <Flex className={styles['accordion-container']}>
                                    <Accordion
                                        title={t('myFavourites')}
                                        outlined={false}
                                        isExpanded={expandedSection === 'favourites'}
                                        leftRightSpaceZero={true}
                                        onToggle={() =>
                                            setExpandedSection(
                                                expandedSection === 'favourites'
                                                    ? null
                                                    : 'favourites',
                                            )
                                        }
                                        className={`${styles['accordion']} ${myFavourites.length === 0 ? styles['no-card'] : ''}`}
                                        customActions={
                                            <Flex
                                                align="center"
                                                className={styles['custom-actions']}
                                            >
                                                {myFavourites.length > 0 && (
                                                    <div
                                                        className={styles['custom-actions-circle']}
                                                    >
                                                        {myFavourites.length}
                                                    </div>
                                                )}
                                            </Flex>
                                        }
                                    >
                                        <Flex
                                            vertical
                                            wrap
                                            gap={10}
                                            className={styles['card-container']}
                                        >
                                            {isFavouritesLoading ? (
                                                <Flex
                                                    align="center"
                                                    justify="center"
                                                    style={{ height: '584px' }}
                                                >
                                                    <AnimatedLoaders
                                                        id="page-loader"
                                                        text={t('loading')}
                                                        type="page"
                                                    />
                                                </Flex>
                                            ) : myFavourites.length === 0 ? (
                                                <div className={styles['disabled']}>
                                                    {t('noFavoritesFoundDescription')}
                                                </div>
                                            ) : (
                                                renderAppReportCards(
                                                    myFavourites,
                                                    setMyFavourites,
                                                    totalFavouriteCount,
                                                )
                                            )}
                                        </Flex>
                                    </Accordion>
                                </Flex>

                                {/* Recently Opened Section */}
                                <Flex className={styles['accordion-container']}>
                                    <Accordion
                                        title={t('recentlyOpened')}
                                        outlined={false}
                                        isExpanded={expandedSection === 'recentlyOpened'}
                                        leftRightSpaceZero={true}
                                        onToggle={() =>
                                            setExpandedSection(
                                                expandedSection === 'recentlyOpened'
                                                    ? null
                                                    : 'recentlyOpened',
                                            )
                                        }
                                        className={`${styles['accordion']} ${recentlyOpened.length == 0 ? styles['no-card'] : ''}`}
                                        customActions={
                                            <Flex
                                                align="center"
                                                className={styles['custom-actions']}
                                            >
                                                {recentlyOpened.length > 0 && (
                                                    <div
                                                        className={styles['custom-actions-circle']}
                                                    >
                                                        {recentlyOpened.length}
                                                    </div>
                                                )}
                                            </Flex>
                                        }
                                    >
                                        <Flex
                                            vertical
                                            wrap
                                            gap={10}
                                            className={styles['card-container']}
                                        >
                                            {recentlyOpened.length === 0 ? (
                                                <div className={styles['disabled']}>
                                                    {t('noRecentActivity')}
                                                </div>
                                            ) : (
                                                renderAppReportCards(
                                                    recentlyOpened,
                                                    setRecentlyOpened,
                                                    totalFavouriteCount,
                                                )
                                            )}
                                        </Flex>
                                    </Accordion>
                                </Flex>
                            </>
                        )}
                    </Flex>
                )
            }
            customActions={getCustomActionsForFlyout()}
        />
    );
};

export default AppsAndReportsFlyout;
