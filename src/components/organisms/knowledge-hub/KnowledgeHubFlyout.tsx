import {
    Flyout,
    ToolTip,
    ToolTip2,
    AnimatedLoaders,
    SearchInput,
    AppReportCard,
    Divider,
    Icon,
} from 'konnect-react-components';
import Flex from 'antd/es/flex';
import { LeftArrowIcon } from '../../../assets/icons/icons';
import styles from './KnowledgeHubFlyout.module.scss';
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import i18n from '../../../i18n/index';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState, fetchSubRoleFunctions, fetchRoleFunctions } from '../../../store';
import {
    setSelectedSubFunctionId,
    setIsFlyoutClose,
    setIsMFEenable,
} from '../../../store/slice/knowledgeHubSlice';
import {
    fetchFavoriteFiles,
    saveFavoriteFile,
    fetchMostViewedFiles,
    upsertFileView,
    searchDocuments,
} from '../../../store/thunks/fetchknowledgeHubDetails';
import {
    logError,
    getKnowledgeHubCreatedDate,
    getKnowledgeHubDocTitle,
    getKnowledgeHubDocSubtitle,
    getKnowledgeHubFileIcon,
} from '../../../utils/helpers';
import { useIsGuestUser } from '../../../utils/customHooks';
import { EmptyStateOfComponent } from '../../atoms';
import { SearchResultEmptyStateImage } from '../../../assets/images/images';

const FAVOURITES_EMPTY_TITLE = 'No Favourites Available';
const FAVOURITES_EMPTY_MESSAGE =
    'Please get the required user role assigned to view favourite documents here.';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    setIsOpen: (open: boolean) => void;
}

// Single ToolTip2 per card — card-body hover shows filename, heart-zone hover
// switches the text to the limit message. AppReportCard.showTooltip never set.
function KHCardWithLimitTooltip({
    isLimitReached,
    limitMsg,
    hoverTitle,
    hoverSubtitle,
    children,
}: {
    isLimitReached: boolean;
    limitMsg: string;
    hoverTitle: string;
    hoverSubtitle?: string;
    children: ReactNode;
}) {
    const [isInHeartZone, setIsInHeartZone] = useState(false);
    const sub = (hoverSubtitle ?? '').trim();

    const tooltipText =
        isLimitReached && isInHeartZone ? (
            limitMsg
        ) : (
            <div className={styles['kh-card-hover-tooltip-body']}>
                <div className={styles['kh-card-hover-tooltip-title-line']}>{hoverTitle}</div>
                <div className={styles['kh-card-hover-tooltip-sub-line']}>
                    {sub !== '' ? sub : ' '}
                </div>
            </div>
        );

    return (
        <ToolTip2
            type="Text Only"
            direction="Top-Center"
            zIndex={6000}
            maxWidth="min(36rem, calc(100vw - 2rem))"
            outerContainerClass={styles['kh-card-konnect-tooltip-trigger']}
            tooltipPopupClass={styles['kh-card-hover-tooltip-popup']}
            text={tooltipText}
            wrapperComponent={
                <div className={styles['kh-card-konnect-tooltip-child-wrap']}>
                    <div
                        onMouseMove={e => {
                            if (!isLimitReached) {
                                if (isInHeartZone) setIsInHeartZone(false);
                                return;
                            }
                            const cardEl = (e.currentTarget as HTMLElement)
                                .firstElementChild as HTMLElement | null;
                            const rect = (
                                cardEl ?? (e.currentTarget as HTMLElement)
                            ).getBoundingClientRect();
                            setIsInHeartZone(
                                e.clientX > rect.right - 40 && e.clientY < rect.top + 60,
                            );
                        }}
                        onMouseLeave={() => setIsInHeartZone(false)}
                    >
                        {children}
                    </div>
                </div>
            }
        />
    );
}

type ViewMode = 'default' | 'favorites' | 'mostViewed';

export const loadKnowledgeHubTranslations = async () => {
    try {
        const module = await import('knowledgeHub/translations');
        const remoteTranslations = module.default;

        for (const [lang, value] of Object.entries(remoteTranslations)) {
            i18n.addResourceBundle(lang, 'translation', value.translation, true, false);
        }
    } catch (error) {
        logError('Failed to load Knowledge Hub translations', error);
    }
};

const KnowledgeHubFlyout = ({ isOpen, setIsOpen }: Props) => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const isGuestUser = useIsGuestUser();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubFunLoading, setIsSubFunLoading] = useState(false);
    const [isSeeAll, setIsSeeAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const MAX_DOCUMENT = 10;
    const DISPLAY_LIMIT = 4;
    const FAVORITES_LIMIT_MSG = `Favorites limit reached. You can mark max. ${MAX_DOCUMENT} documents as favourites.`;

    const [viewMode, setViewMode] = useState<ViewMode>('default');
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1024);

    const Functions = useSelector((state: RootState) => state.roleFunctions);
    const allFunctions = Functions.data;
    const roleFunctionsError = Functions.error;
    const SubFunctions = Functions.subFunctionData;

    const validSubFunctions = SubFunctions?.filter(
        (item): item is typeof item & { subFunctionName: string } => !!item.subFunctionName,
    );
    const FavoriteFilesCount = useSelector((state: RootState) => state.knowledgeHub.favoriteCount);
    const selectedSubFunctionId = useSelector(
        (state: RootState) => state.knowledgeHub.selectedSubFunctionId,
    );

    const FavoriteFiles = useSelector((state: RootState) => state.knowledgeHub.favoriteFiles);
    const FavoriteFilesLoading = useSelector(
        (state: RootState) => state.knowledgeHub.favoriteFilesloading,
    );
    const FavoriteFilesError = useSelector(
        (state: RootState) => state.knowledgeHub.errorFavoriteFiles,
    );

    const MostViewedFiles = useSelector((state: RootState) => state.knowledgeHub.mostViewedFiles);

    const MostViewedFilesloading = useSelector(
        (state: RootState) => state.knowledgeHub.mostViewedFilesloading,
    );
    const MostViewedFilesError = useSelector(
        (state: RootState) => state.knowledgeHub.errorMostViewedFiles,
    );

    const searchedDocuments = useSelector(
        (state: RootState) => state.knowledgeHub.searchedDocuments,
    );
    const searchedDocumentsLoading = useSelector(
        (state: RootState) => state.knowledgeHub.searchDocumentsLoading,
    );
    const searchedDocumentsError = useSelector(
        (state: RootState) => state.knowledgeHub.errorSearchDocuments,
    );

    const isMFEenable = useSelector((state: RootState) => state.knowledgeHub.isMFEenable);

    const isFlyoutClosed = useSelector((state: RootState) => state.knowledgeHub.isFlyoutClose);

    const favoriteList = FavoriteFiles ?? [];
    const mostViewedList = MostViewedFiles ?? [];
    const searchList = searchedDocuments ?? [];

    const showFavoriteSeeAll = viewMode === 'default' && favoriteList.length > DISPLAY_LIMIT;

    const showMostViewedSeeAll = viewMode === 'default' && mostViewedList.length > DISPLAY_LIMIT;

    const favoriteFilesToShow =
        viewMode === 'favorites'
            ? favoriteList.slice(0, MAX_DOCUMENT)
            : favoriteList.slice(0, DISPLAY_LIMIT);

    const mostViewedFilesToShow =
        viewMode === 'mostViewed'
            ? mostViewedList.slice(0, MAX_DOCUMENT)
            : mostViewedList.slice(0, DISPLAY_LIMIT);

    const favoriteIds = new Set(FavoriteFiles.map(f => String(f.fileId)));

    const hasNoFavourites =
        FavoriteFilesCount === 0 || FavoriteFiles.length === 0;

    const isFavouritesAccessError =
        !!FavoriteFilesError &&
        (isGuestUser ||
            String(FavoriteFilesError).toLowerCase().includes('role') ||
            String(FavoriteFilesError).toLowerCase().includes('favourite'));

    const renderFavouritesEmptyState = () => (
        <EmptyStateOfComponent
            emptyStateImage={<SearchResultEmptyStateImage />}
            emptyStateTitle={FAVOURITES_EMPTY_TITLE}
            emptyStateMessage={FAVOURITES_EMPTY_MESSAGE}
        />
    );

    const handleSeeAllFavorites = () => {
        setSearchTerm('');
        setViewMode('favorites');
        setIsSeeAll(true);
    };
    const handleSeeAllMostViewed = () => {
        setSearchTerm('');
        setViewMode('mostViewed');
        setIsSeeAll(true);
    };
    const handleBack = () => {
        setViewMode('default');
        setIsSeeAll(false);
    };

    const handleFavoriteToggle = (file: any) => {
        const id = String(file.fileId ?? file.documentID ?? file.id);

        const isAlreadyFavorite = favoriteIds.has(id);

        if (!isAlreadyFavorite && FavoriteFilesCount >= MAX_DOCUMENT) {
            return;
        }

        try {
            dispatch(saveFavoriteFile(Number(id))).unwrap();
        } catch (error) {
            logError(error);
        }
    };

    const handleCardClick = async (file: any) => {
        try {
            const id = String(file.fileId ?? file.documentID ?? file.id);
            await dispatch(upsertFileView(Number(id))).unwrap();
            setIsOpen(false);
            navigate('/knowledge-hub/document-summary', {
                state: {
                    docId: id,
                    docSummary: file.fileSummary || '',
                    docTitle: getKnowledgeHubDocTitle(file),
                    fileName: file.fileName,
                    docCreatedDate: getKnowledgeHubCreatedDate(file) || new Date().toISOString(),
                    docUrl: file.fileLink || file.fileUrl || '',
                    docType: file.docType,
                    subFunctionId: file.subFunctionId ?? selectedSubFunctionId ?? undefined,
                },
            });
        } catch (error) {
            logError('Failed to upsert file view', error);
        }
    };

    const onClickOutsideFlyoutContainer = () => {
        if (isOpen) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        const loadRoles = async () => {
            try {
                setIsLoading(true);
                await dispatch(fetchRoleFunctions()).unwrap();
            } catch (error) {
                logError(error);
            } finally {
                setIsLoading(false);
            }
        };

        loadRoles();
    }, [dispatch]);

    useEffect(() => {
        if (!allFunctions.length) return;
        const supplyChainFunction = allFunctions.find(
            func => func.functionName?.toLowerCase() === 'supply chain',
        );

        if (!supplyChainFunction) return;

        const loadSubFunctions = async () => {
            try {
                setIsSubFunLoading(true);
                await dispatch(
                    fetchSubRoleFunctions({
                        functionId: supplyChainFunction.functionId,
                    }),
                ).unwrap();
            } catch (err) {
                logError(err);
            } finally {
                setIsSubFunLoading(false);
            }
        };

        loadSubFunctions();
    }, [allFunctions]);

    useEffect(() => {
        dispatch(fetchFavoriteFiles());
        dispatch(fetchMostViewedFiles(MAX_DOCUMENT));
    }, [dispatch]);

    useEffect(() => {
        const q = searchTerm.trim();
        if (!q) return;

        const t = window.setTimeout(() => {
            dispatch(searchDocuments({ searchTerm: q }));
        }, 300);

        return () => window.clearTimeout(t);
    }, [dispatch, searchTerm]);

    useEffect(() => {
        if (!isFlyoutClosed) return;

        const timer = window.setTimeout(() => {
            dispatch(setIsFlyoutClose(false));
        }, 300);

        return () => window.clearTimeout(timer);
    }, [isFlyoutClosed]);

    const handleKnowledgeHubClick = async (subFunctionId?: string | null) => {
        if (!subFunctionId) return;
        setIsOpen(false);
        dispatch(setSelectedSubFunctionId(subFunctionId));
        await loadKnowledgeHubTranslations();
        dispatch(setIsMFEenable(true));
        navigate(`/knowledge-hub`);
    };

    useEffect(() => {
        const flyoutWrapper = document.getElementById('knowledge-hub-flyout');
        if (!flyoutWrapper) return;

        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.closest('[class^="flyout-container"]')) return;
            onClickOutsideFlyoutContainer();
        };

        flyoutWrapper.addEventListener('click', handleClick);
        return () => flyoutWrapper.removeEventListener('click', handleClick);
    }, [onClickOutsideFlyoutContainer]);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth <= 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getCustomActionsForKnowledgeHub = () => (
        <Flex justify="space-between" align="center" className={styles['custom-action-container']}>
            <span className={styles['header']}>Knowledge Hub</span>

            <Flex justify="flex-end" gap="16px">
                <ToolTip
                    type="Text Only"
                    text="Collapse flyout"
                    direction="Top-Center"
                    wrapperComponent={
                        <div
                            className={styles['tooltip-container']}
                            onClick={() => {
                                setIsOpen(false);
                                dispatch(setIsFlyoutClose(true));
                                if (isMFEenable) {
                                    navigate(`/knowledge-hub`);
                                }
                            }}
                        >
                            {LeftArrowIcon()}
                        </div>
                    }
                />
            </Flex>
        </Flex>
    );

    return (
        <div className={styles['knowledge-hub-container']}>
            <Flyout
                content={
                    <div className={styles['flyout-inner-container']}>
                        <div className={styles['left-sidebar']}>
                            {isLoading || isSubFunLoading ? (
                                <Flex className={styles['initial-loader-container']}>
                                    <AnimatedLoaders id="initial-loader" type="page" />
                                </Flex>
                            ) : roleFunctionsError ? (
                                <div className={styles['empty-state-container']}>
                                    <span className={styles['empty-text']}>Error : </span>
                                    <span className={styles['empty-text']}>
                                        {typeof roleFunctionsError === 'string'
                                            ? roleFunctionsError
                                            : (roleFunctionsError as { message?: string })?.message}
                                    </span>
                                </div>
                            ) : (
                                <div>
                                    <Flex vertical className={styles['flyout-container']}>
                                        <div>
                                            <Flex vertical className={styles['section']}>
                                                <h5 className={styles['section-title']}>
                                                    Featured
                                                </h5>
                                            </Flex>
                                            <Flex vertical className={styles['featured-list']}>
                                                <span
                                                    className={`${styles['featured-item']} ${
                                                        !searchTerm.trim() &&
                                                        viewMode === 'favorites'
                                                            ? styles['featured-item-active']
                                                            : ''
                                                    }`}
                                                    onClick={handleSeeAllFavorites}
                                                >
                                                    Your Favorites
                                                </span>
                                                <span
                                                    className={`${styles['featured-item']} ${
                                                        !searchTerm.trim() &&
                                                        viewMode === 'mostViewed'
                                                            ? styles['featured-item-active']
                                                            : ''
                                                    }`}
                                                    onClick={handleSeeAllMostViewed}
                                                >
                                                    Most Viewed Documents
                                                </span>
                                            </Flex>
                                        </div>
                                    </Flex>
                                    {/* <CustomIconCard /> */}
                                    <Flex vertical className={styles['section']}>
                                        <h5 className={styles['section-title']}>
                                            Select Sub Function
                                        </h5>

                                        <Flex vertical className={styles['subfunction-list']}>
                                            {validSubFunctions?.map(item => (
                                                <span
                                                    key={item.subFunctionId}
                                                    className={styles['subfunction-item']}
                                                    onClick={() =>
                                                        handleKnowledgeHubClick(
                                                            item.subFunctionName,
                                                        )
                                                    }
                                                >
                                                    {item.subFunctionName}
                                                </span>
                                            ))}
                                        </Flex>
                                    </Flex>
                                </div>
                            )}
                        </div>
                    </div>
                }
                id="knowledge-hub-flyout"
                dataTestId="knowledge-hub-flyout"
                flyoutOpen={isOpen}
                direction="left"
                cancelIconClick={() => setIsOpen(false)}
                heading=""
                className={`${styles['flyout-container-main']} ${styles['flyout-container-pdn']}`}
                flyoutBgColor="#F4F6F7"
                customActions={getCustomActionsForKnowledgeHub()}
            />
            {!isSmallScreen && (
                <Flyout
                    content={
                        <div className={styles['flyout-inner-container']}>
                            <div className={styles['right-content']}>
                                {!FavoriteFilesLoading && (
                                    <div className={styles['searchInput']}>
                                        <SearchInput
                                            className={styles['searchInput-field']}
                                            placeholder="Search Documents"
                                            defaultValue={searchTerm}
                                            onChange={(e: any) => {
                                                const val =
                                                    typeof e === 'string'
                                                        ? e
                                                        : (e?.target?.value ?? '');
                                                setSearchTerm(String(val));
                                            }}
                                        />
                                    </div>
                                )}
                                {searchTerm.trim() ? (
                                    searchedDocumentsLoading ? (
                                        <Flex className={styles['initial-loader-container']}>
                                            <AnimatedLoaders id="initial-loader" type="page" />
                                        </Flex>
                                    ) : searchedDocumentsError ? (
                                        <div className={styles['empty-state-container']}>
                                            <span className={styles['empty-text']}>Error </span>
                                            <span className={styles['empty-text']}>
                                                {typeof searchedDocumentsError === 'string'
                                                    ? searchedDocumentsError
                                                    : (
                                                          searchedDocumentsError as {
                                                              message?: string;
                                                          }
                                                      )?.message}
                                            </span>
                                        </div>
                                    ) : searchList.length === 0 ? (
                                        <EmptyStateOfComponent
                                            emptyStateImage={<SearchResultEmptyStateImage />}
                                            emptyStateTitle="No Results Found"
                                            emptyStateMessage="Try adjusting your search to find relevant documents."
                                        />
                                    ) : (
                                        <div className={styles['favorites-section']}>
                                            <div className={styles['favorite-files']}>
                                                <div className={styles['section-header']}>
                                                    <div className={styles['left-section-header']}>
                                                        <span>
                                                            {searchList?.length} Search Results
                                                        </span>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`${styles['cards-grid']} ${styles['search-cards-scroll']}`}
                                                >
                                                    {searchList.map(file => {
                                                        const id = String(
                                                            (file as any).fileId ??
                                                                (file as any).documentID ??
                                                                (file as any).id,
                                                        );
                                                        const isAlreadyFavorite =
                                                            favoriteIds.has(id);
                                                        const isLimitReached =
                                                            !isAlreadyFavorite &&
                                                            FavoriteFilesCount >= MAX_DOCUMENT;

                                                        const cardTitle = getKnowledgeHubDocTitle(
                                                            file as any,
                                                        );
                                                        const cardSubtitle =
                                                            getKnowledgeHubDocSubtitle(file as any);

                                                        return (
                                                            <Fragment key={id}>
                                                                <KHCardWithLimitTooltip
                                                                    hoverTitle={cardTitle}
                                                                    hoverSubtitle={cardSubtitle}
                                                                    isLimitReached={isLimitReached}
                                                                    limitMsg={FAVORITES_LIMIT_MSG}
                                                                >
                                                                    <AppReportCard
                                                                        customIcon={getKnowledgeHubFileIcon(
                                                                            file as any,
                                                                        )}
                                                                        defaultIcon={'heart'}
                                                                        defaultIconColor={
                                                                            'feedback-error-color'
                                                                        }
                                                                        selectedIcon="heart"
                                                                        selectedIconColor="feedback-error-color"
                                                                        fillColor={
                                                                            isAlreadyFavorite
                                                                        }
                                                                        showIconOnHover
                                                                        showTopLeftLogo
                                                                        description={
                                                                            (file as any)
                                                                                .fileSummary || ''
                                                                        }
                                                                        footer={
                                                                            <>
                                                                                <span>
                                                                                    Department:
                                                                                </span>{' '}
                                                                                {
                                                                                    (file as any)
                                                                                        .departmentId
                                                                                }{' '}
                                                                                •{' '}
                                                                                <span>
                                                                                    Category:
                                                                                </span>{' '}
                                                                                {(file as any)
                                                                                    .documentCategoryName ||
                                                                                    'NA'}
                                                                            </>
                                                                        }
                                                                        size="Small"
                                                                        subTitle={cardSubtitle}
                                                                        title={cardTitle}
                                                                        onRightIconClick={() =>
                                                                            handleFavoriteToggle(
                                                                                file,
                                                                            )
                                                                        }
                                                                        onCardClick={() =>
                                                                            handleCardClick(file)
                                                                        }
                                                                        type="App"
                                                                    />
                                                                </KHCardWithLimitTooltip>
                                                            </Fragment>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ) : FavoriteFilesLoading ? (
                                    <Flex className={styles['initial-loader-container']}>
                                        <AnimatedLoaders id="initial-loader" type="page" />
                                    </Flex>
                                ) : FavoriteFilesError && isFavouritesAccessError ? (
                                    renderFavouritesEmptyState()
                                ) : FavoriteFilesError ? (
                                    <div className={styles['empty-state-container']}>
                                        <span className={styles['empty-text']}>Error : </span>
                                        <span className={styles['empty-text']}>
                                            {typeof FavoriteFilesError === 'string'
                                                ? FavoriteFilesError
                                                : (FavoriteFilesError as { message?: string })
                                                      ?.message}
                                        </span>
                                    </div>
                                ) : (
                                    (viewMode === 'default' || viewMode === 'favorites') && (
                                        <div className={styles['favorites-section']}>
                                            <div className={styles['favorite-files']}>
                                                <div className={styles['section-header']}>
                                                    <div className={styles['left-section-header']}>
                                                        {viewMode === 'favorites' && (
                                                            <span
                                                                className={styles['back-btn']}
                                                                onClick={handleBack}
                                                            >
                                                                <Icon
                                                                    color="black-color"
                                                                    name="chevron-left"
                                                                    size="x20l"
                                                                />
                                                            </span>
                                                        )}
                                                        <span>Your Favorites</span>
                                                    </div>
                                                    {showFavoriteSeeAll && (
                                                        <span
                                                            className={styles['see-all']}
                                                            onClick={handleSeeAllFavorites}
                                                        >
                                                            See All
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={styles['featured-item']}>
                                                    View documents that have been marked as favorite
                                                    by you
                                                </p>

                                                {FavoriteFilesLoading ? (
                                                    <div>Loading...</div>
                                                ) : hasNoFavourites ? (
                                                    renderFavouritesEmptyState()
                                                ) : (
                                                    <div className={styles['cards-grid']}>
                                                        {favoriteFilesToShow.map(file => {
                                                            const isAlreadyFavorite =
                                                                FavoriteFiles?.some(
                                                                    f => f.fileId === file.fileId,
                                                                );

                                                            const isLimitReached =
                                                                !isAlreadyFavorite &&
                                                                FavoriteFilesCount >= MAX_DOCUMENT;

                                                            const cardTitle =
                                                                getKnowledgeHubDocTitle(
                                                                    file as any,
                                                                );
                                                            const cardSubtitle =
                                                                getKnowledgeHubDocSubtitle(
                                                                    file as any,
                                                                );

                                                            return (
                                                                <Fragment key={file.fileId}>
                                                                    <KHCardWithLimitTooltip
                                                                        hoverTitle={cardTitle}
                                                                        hoverSubtitle={cardSubtitle}
                                                                        isLimitReached={
                                                                            isLimitReached
                                                                        }
                                                                        limitMsg={
                                                                            FAVORITES_LIMIT_MSG
                                                                        }
                                                                    >
                                                                        <AppReportCard
                                                                            customIcon={getKnowledgeHubFileIcon(
                                                                                file,
                                                                            )}
                                                                            defaultIcon={'heart'}
                                                                            defaultIconColor={
                                                                                'feedback-error-color'
                                                                            }
                                                                            selectedIcon="heart"
                                                                            selectedIconColor="feedback-error-color"
                                                                            fillColor={
                                                                                isAlreadyFavorite
                                                                            }
                                                                            showIconOnHover
                                                                            showTopLeftLogo
                                                                            description={
                                                                                file.fileSummary ||
                                                                                ''
                                                                            }
                                                                            footer={
                                                                                <>
                                                                                    <span>
                                                                                        Department:
                                                                                    </span>{' '}
                                                                                    {
                                                                                        file.departmentId
                                                                                    }{' '}
                                                                                    •{' '}
                                                                                    <span>
                                                                                        Category:
                                                                                    </span>{' '}
                                                                                    {file.documentCategoryName ||
                                                                                        'NA'}
                                                                                </>
                                                                            }
                                                                            size="Small"
                                                                            subTitle={cardSubtitle}
                                                                            title={cardTitle}
                                                                            showTooltip={
                                                                                isLimitReached
                                                                            }
                                                                            tooltip={`Favorites limit reached. You can mark max. ${MAX_DOCUMENT} documents as favourites.`}
                                                                            tooltipDirection="Top-Center"
                                                                            onRightIconClick={() =>
                                                                                handleFavoriteToggle(
                                                                                    file,
                                                                                )
                                                                            }
                                                                            onCardClick={() =>
                                                                                handleCardClick(
                                                                                    file,
                                                                                )
                                                                            }
                                                                            type="App"
                                                                        />
                                                                    </KHCardWithLimitTooltip>
                                                                </Fragment>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}

                                {!searchTerm.trim() && !isSeeAll && (
                                    <div className={styles['divider-files']}>
                                        <Divider size="thick" />
                                    </div>
                                )}
                                {!searchTerm.trim() &&
                                    (MostViewedFilesloading ? (
                                        <Flex className={styles['initial-loader-container']}>
                                            <AnimatedLoaders id="initial-loader" type="page" />
                                        </Flex>
                                    ) : MostViewedFilesError ? (
                                        <div className={styles['empty-state-container']}>
                                            <span className={styles['empty-text']}>Error : </span>
                                            <span className={styles['empty-text']}>
                                                {typeof MostViewedFilesError === 'string'
                                                    ? MostViewedFilesError
                                                    : (MostViewedFilesError as { message?: string })
                                                          ?.message}
                                            </span>
                                        </div>
                                    ) : (
                                        (viewMode === 'default' || viewMode === 'mostViewed') && (
                                            <div className={styles['favorites-section']}>
                                                <div className={styles['favorite-files']}>
                                                    <div className={styles['section-header']}>
                                                        <div
                                                            className={
                                                                styles['left-section-header']
                                                            }
                                                        >
                                                            {viewMode === 'mostViewed' && (
                                                                <span
                                                                    className={styles['back-btn']}
                                                                    onClick={handleBack}
                                                                >
                                                                    <Icon
                                                                        color="black-color"
                                                                        name="chevron-left"
                                                                        size="x20l"
                                                                    />
                                                                </span>
                                                            )}
                                                            <span>Most Viewed Documents</span>
                                                        </div>
                                                        {showMostViewedSeeAll && (
                                                            <span
                                                                className={styles['see-all']}
                                                                onClick={handleSeeAllMostViewed}
                                                            >
                                                                See All
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={styles['featured-item']}>
                                                        View all documents that are most used by
                                                        sub-functions
                                                    </p>

                                                    {MostViewedFiles.length === 0 ? (
                                                        <EmptyStateOfComponent
                                                            emptyStateImage={
                                                                <SearchResultEmptyStateImage />
                                                            }
                                                            emptyStateTitle="No Documents Found"
                                                            emptyStateMessage="Your most viewed documents will appear here once you start accessing them."
                                                        />
                                                    ) : (
                                                        <div className={styles['cards-grid']}>
                                                            {mostViewedFilesToShow.map(file => {
                                                                const isAlreadyFavorite =
                                                                    favoriteIds.has(
                                                                        String(file.documentID),
                                                                    );

                                                                const isLimitReached =
                                                                    !isAlreadyFavorite &&
                                                                    FavoriteFilesCount >=
                                                                        MAX_DOCUMENT;

                                                                const cardTitle =
                                                                    getKnowledgeHubDocTitle(
                                                                        file as any,
                                                                    );
                                                                const cardSubtitle =
                                                                    getKnowledgeHubDocSubtitle(
                                                                        file as any,
                                                                    );

                                                                return (
                                                                    <Fragment key={file.documentID}>
                                                                        <KHCardWithLimitTooltip
                                                                            hoverTitle={cardTitle}
                                                                            hoverSubtitle={
                                                                                cardSubtitle
                                                                            }
                                                                            isLimitReached={
                                                                                isLimitReached
                                                                            }
                                                                            limitMsg={
                                                                                FAVORITES_LIMIT_MSG
                                                                            }
                                                                        >
                                                                            <AppReportCard
                                                                                customIcon={getKnowledgeHubFileIcon(
                                                                                    file,
                                                                                )}
                                                                                defaultIcon={
                                                                                    'heart'
                                                                                }
                                                                                defaultIconColor={
                                                                                    isAlreadyFavorite
                                                                                        ? 'feedback-error-color'
                                                                                        : 'black-color'
                                                                                }
                                                                                selectedIcon="heart"
                                                                                selectedIconColor={
                                                                                    isAlreadyFavorite
                                                                                        ? 'feedback-error-color'
                                                                                        : 'black-color'
                                                                                }
                                                                                fillColor={
                                                                                    isAlreadyFavorite
                                                                                }
                                                                                showIconOnHover={
                                                                                    false
                                                                                }
                                                                                showTopLeftLogo
                                                                                size="Small"
                                                                                title={cardTitle}
                                                                                subTitle={
                                                                                    cardSubtitle
                                                                                }
                                                                                onRightIconClick={() =>
                                                                                    handleFavoriteToggle(
                                                                                        file,
                                                                                    )
                                                                                }
                                                                                onCardClick={() =>
                                                                                    handleCardClick(
                                                                                        file,
                                                                                    )
                                                                                }
                                                                                type="App"
                                                                            />
                                                                        </KHCardWithLimitTooltip>
                                                                    </Fragment>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    ))}
                            </div>
                        </div>
                    }
                    containerMaxWidth="58rem"
                    id="knowledge-hub-flyout-right"
                    dataTestId="knowledge-hub-flyout-right"
                    flyoutOpen={isOpen}
                    direction="left"
                    cancelIconClick={() => setIsOpen(false)}
                    heading=""
                    className={`${styles['flyout-container-main']} ${styles['flyout-container-secondmain']}`}
                    flyoutBgColor="#F4F6F7"
                />
            )}
        </div>
    );
};

export default KnowledgeHubFlyout;
