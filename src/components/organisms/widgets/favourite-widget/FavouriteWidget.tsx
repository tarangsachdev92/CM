import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {
    AppDispatch,
    RootState,
    getAppAndReports,
    getAppAndReportsFavourite,
} from '../../../../store';
import { IAppSReportItem } from '../../../../types/request';
import { AnimatedLoaders, ChartTypeButton, IconButton } from 'konnect-react-components';
import { NoFavouritesIcon } from '../../../../assets/icons/widget-menu';
import styles from './FavouriteWidget.module.scss';
import { Carousel } from 'antd';
import { CarouselRef } from 'antd/es/carousel';
import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 9;

type FavouriteItem = IAppSReportItem & {
    objectId: number;
    objectType: string;
    objectName: string;
    description?: string | null;
};

export const FavouriteWidgetComponent = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const carouselRef = useRef<CarouselRef>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [originalFavourites, setOriginalFavourites] = useState<FavouriteItem[]>([]);
    const [pendingFavourites, setPendingFavourites] = useState<FavouriteItem[]>([]);

    const [activeSlide, setActiveSlide] = useState(0);
    const [removedItems, setRemovedItems] = useState<FavouriteItem[]>([]);
    const isLoadingFavourites = useSelector(
        (state: RootState) => state.appReportsCardsData.loading,
        shallowEqual,
    );
    const userPrimaryRole = useSelector((state: RootState) => state.primaryRole.data, shallowEqual);
    const roleType = userPrimaryRole?.roleType;

    const isFilterGroupDisabled = roleType === 'Guest' || !roleType;

    const favouritesData = useSelector(
        (state: RootState) =>
            (state.appReportsCardsData.data as unknown as { data?: { data?: FavouriteItem[] } })
                ?.data?.data ?? [],
        shallowEqual,
    ) as FavouriteItem[];

    const removeFavourite = (item: FavouriteItem) => {
        setPendingFavourites(prev => prev.filter(favourite => favourite.objectId !== item.objectId));
        setRemovedItems(prev => [...prev, item]);
    };

    const handleSave = async () => {
        if (!removedItems.length) {
            setIsEditMode(false);
            return;
        }

        try {
            await Promise.all(
                removedItems.map(item =>
                    dispatch(
                        getAppAndReportsFavourite({
                            objectId: item.objectId,
                            objectType: item.objectType,
                            isFavourite: false,
                        }),
                    ),
                ),
            );

            await dispatch(
                getAppAndReports({
                    objectType: null,
                    objectName: null,
                    pageNumber: 1,
                    pageSize: 100,
                    regionId: null,
                    functionId: null,
                    subFunctionId: null,
                    isFavourite: 1,
                }),
            );

            setRemovedItems([]);
            setOriginalFavourites([]);
            setIsEditMode(false);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (isFilterGroupDisabled) return;

        dispatch(
            getAppAndReports({
                objectType: null,
                objectName: null,
                pageNumber: 1,
                pageSize: 100,
                regionId: null,
                functionId: null,
                subFunctionId: null,
                isFavourite: 1,
            }),
        );
    }, [dispatch, isFilterGroupDisabled]);

    const displayData = isEditMode ? pendingFavourites : favouritesData;
    const noFavourites = !displayData || displayData.length === 0;

    const slides = useMemo(() => {
        const pages: FavouriteItem[][] = [];

        for (let i = 0; i < displayData.length; i += ITEMS_PER_PAGE) {
            pages.push(displayData.slice(i, i + ITEMS_PER_PAGE));
        }

        return pages;
    }, [displayData]);

    const getInitials = (name: string) => {
        if (!name) return '';

        const words = name.trim().split(/\s+/);
        const firstWord = words[0] ?? '';
        const secondWord = words[1] ?? '';

        if (firstWord && secondWord) {
            return `${firstWord[0]}${secondWord[0]}`.toUpperCase();
        }

        return name.substring(0, 2).toUpperCase();
    };

    const getName = (name: string) => {
        return name.length > 18 ? `${name.substring(0, 15)}...` : name;
    };

    const openTool = (item: FavouriteItem) => {
        navigate(`/digital-tools-library/${item.objectType}/${item.objectId}/${item.objectName}`, {
            state: {
                description: item.description ?? '',
            },
        });
    };
    const undoChanges = () => {
        setPendingFavourites([...originalFavourites]);
        setRemovedItems([]);
        setIsEditMode(false);
    };

    let content: JSX.Element;

    if (isLoadingFavourites) {
        content = (
            <div className={styles.loaderContainer}>
                <AnimatedLoaders id="favourites-widget-loader" type="page" />
            </div>
        );
    } else if (noFavourites) {
        content = (
            <div className={styles.emptyState}>
                <div className={styles.emptyStateText}>
                    {isFilterGroupDisabled ? (
                        <>
                            <h3 className={styles.guestEmptyTitle}>No Favourites Available</h3>

                            <p className={styles.guestEmptyDescription}>
                                Your favorite tools and reports are just a step away set up your role
                                to simplify your workspace.
                            </p>
                        </>
                    ) : (
                        <>
                            <h3>No Favourites Added</h3>

                            <p>
                                Keep your go-to tools and reports within easy reach. Add them from the{' '}
                                <a className={styles.libraryLink} href="/digital-tools-library">
                                    Digital Tools Library
                                </a>{' '}
                                to see them here.
                            </p>
                        </>
                    )}
                </div>

                <div className={styles.emptyStateImage}>
                    <NoFavouritesIcon />
                </div>
            </div>
        );
    } else {
        content = (
            <div className={styles.carouselContent}>
                <Carousel
                    ref={carouselRef}
                    dots={false}
                    arrows={false}
                    infinite={false}
                    afterChange={current => setActiveSlide(current)}
                >
                    {slides.map(page => (
                        <div key={page.map(item => item.objectId).join('-')}>
                            <div className={styles.grid}>
                                {page.map((item, index) => (
                                    <div
                                        key={item.objectId}
                                        className={`${styles.card} ${isEditMode ? styles.cardEditable : ''}`}
                                        role={isEditMode ? undefined : 'button'}
                                        tabIndex={isEditMode ? -1 : 0}
                                        onClick={() => {
                                            if (!isEditMode) {
                                                openTool(item);
                                            }
                                        }}
                                        onKeyDown={event => {
                                            if (isEditMode) return;
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                openTool(item);
                                            }
                                        }}
                                    >
                                        {isEditMode && (
                                            <div className={styles.minusWrapper}>
                                                <IconButton
                                                    icon="minus"
                                                    size="Tiny"
                                                    onClick={() => {
                                                        removeFavourite(item);
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <ChartTypeButton
                                            className={
                                                index % 2 === 0
                                                    ? styles['teal-button']
                                                    : styles['purple-button']
                                            }
                                            icon={
                                                <span className={styles.initials}>
                                                    {getInitials(item.objectName)}
                                                </span>
                                            }
                                            onClick={() => {}}
                                            size={40}
                                        />

                                        <span className={styles.name}>{getName(item.objectName)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </Carousel>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.heading}>My Favourites</div>

                {!noFavourites && (
                    <div className={`${styles.actions} ${isEditMode ? styles.actionsEditMode : ''}`}>
                        {isEditMode ? (
                            <>
                                <IconButton icon="refresh-ccw-01" size="Tiny" onClick={undoChanges} />

                                <IconButton icon="check" size="Tiny" onClick={handleSave} />
                            </>
                        ) : (
                            <IconButton
                                icon="edit-02"
                                size="Tiny"
                                onClick={() => {
                                    setOriginalFavourites([...favouritesData]);
                                    setPendingFavourites([...favouritesData]);
                                    setRemovedItems([]);
                                    setIsEditMode(true);
                                }}
                            />
                        )}
                    </div>
                )}
            </div>
            {content}

            {!noFavourites && slides.length > 1 && (
                <div className={styles.carouselFooter}>
                    <button
                        className={styles.footerArrow}
                        onClick={() => carouselRef.current?.prev()}
                        disabled={activeSlide === 0}
                    >
                        ‹
                    </button>

                    <div className={styles.dots}>
                        {slides.map((slide, index) => (
                            <button
                                key={`dot-${slide.map(item => item.objectId).join('-')}`}
                                className={activeSlide === index ? styles.activeDot : styles.dot}
                                onClick={() => {
                                    carouselRef.current?.goTo(index);
                                    setActiveSlide(index);
                                }}
                            />
                        ))}
                    </div>

                    <button
                        className={styles.footerArrow}
                        onClick={() => carouselRef.current?.next()}
                        disabled={activeSlide === slides.length - 1}
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
};
