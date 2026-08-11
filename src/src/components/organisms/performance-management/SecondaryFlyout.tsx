import {
    Accordion,
    AnimatedLoaders,
    Counter,
    Divider,
    Flyout,
    Tag,
} from 'konnect-react-components';
import styles from './PerformanceManagementFlyout.module.scss';
import { Flex } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import PerformanceReviewCard from '../../atoms/custom-icon-card/PerformanceReviewCard';
import { NoMatchesFound } from '../../../assets/images/images';
import { Label } from '../../atoms';

import { useDispatch } from 'react-redux';
import { setSelectedForumData } from '../../../store/slice/selectedForumSlice';
import { useTranslation } from 'react-i18next';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    setIsOpen: (open: boolean) => void;
    selectedId: string;
    forums: any[];
    isSearchResult: boolean;
    helpDisplay?: string;
    timePeriodList: string[];
    clickedSearchBar?: boolean;
    onFavoriteToggle?: (forumIds: number[], isFavorite: boolean) => void;
    onCardClick?: () => void;
    isFavoriteUpdating?: boolean;
}

const SecondaryFlyout: React.FC<Props> = ({
    isOpen,
    setIsOpen,
    selectedId,
    forums,
    onClose,
    isSearchResult,
    timePeriodList,
    onFavoriteToggle,
    onCardClick,
    isFavoriteUpdating,
}) => {
    const [accessibleForums, setAccessibleForums] = useState<any>([]);
    const [otherForums, setOtherForums] = useState<any>([]);
    const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
    const [aggregatedForums, setAggregatedForums] = useState<any>([]);

    const flyoutRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch();

    const { t } = useTranslation('performance-mangment-translation', { useSuspense: false });

    const aggregateForums = (forums: any) => {
        const aggregated: Record<string, any> = {};

        forums.forEach((forum: any) => {
            const {
                forumName,
                forumId,
                forumLevelName,
                forumPeriodName,
                isAccessible,
                isFavorite,
                region,
                site,
                market,
                cluster,
            } = forum;

            // Determine geography
            let geography = '';
            if (forumLevelName === 'Region') {
                geography = region;
            } else if (forumLevelName === 'Cluster') {
                geography = cluster;
            } else if (forumLevelName === 'Market') {
                geography = market;
            } else if (forumLevelName === 'Site') {
                geography = site;
            } else {
                geography = site || market || cluster || region;
            }

            // Composite key based on forumName + forumLevelName + forumPeriodName + isAccessible
            const key = `${forumName}||${forumLevelName}||${forumPeriodName} || ${isAccessible}`;

            if (!aggregated[key]) {
                aggregated[key] = {
                    forumName,
                    forumLevelName,
                    forumPeriodName,
                    isAccessible,
                    geographies: [],
                };
            }

            aggregated[key].geographies.push({
                forumId,
                geography,
                isFavorite,
            });
        });

        return Object.values(aggregated);
    };
    useEffect(() => {
        const forumsAfterAggregation = aggregateForums(forums);
        setAccessibleForums(
            forumsAfterAggregation?.filter(
                (item: any) => item.isAccessible === true && item.forumLevelName === selectedId,
            ),
        );
        setOtherForums(
            forumsAfterAggregation?.filter(
                (item: any) => item.isAccessible === false && item.forumLevelName === selectedId,
            ),
        );
        setAggregatedForums(forumsAfterAggregation);
    }, [forums, selectedId]);

    useEffect(() => {
        const isAllSelected = selectedPeriods.includes('All');
        const isNoneSelected = selectedPeriods.length === 0;

        const shouldShowAll = isAllSelected || isNoneSelected;

        const filteredAccessible = aggregatedForums
            ?.filter(
                (item: any) =>
                    item.isAccessible === true &&
                    item.forumLevelName === selectedId &&
                    (shouldShowAll || selectedPeriods.includes(item.forumPeriodName)),
            )
            .map((item: any) => ({
                ...item,
                geographies: item.geographies.map((geo: any) => ({
                    forumId: geo.forumId,
                    geography: geo.geography,
                    isFavorite: geo.isFavorite ?? false,
                })),
            }));
        const filteredOther = aggregatedForums?.filter(
            (item: any) =>
                item.isAccessible === false &&
                item.forumLevelName === selectedId &&
                (shouldShowAll || selectedPeriods.includes(item.forumPeriodName)),
        );

        setAccessibleForums(filteredAccessible);
        setOtherForums(filteredOther);
    }, [selectedPeriods, selectedId, aggregatedForums]);
    const handlePeriodToggle = (period: string) => {
        setSelectedPeriods(prev => {
            if (prev.includes(period)) {
                // Deselect the clicked period
                return prev.filter(p => p !== period);
            } else {
                // Select the clicked period
                return [...prev, period];
            }
        });
    };

    const getCustomActionsForFlyout = () => (
        <Flex className={styles['custom-action-container-secondary']}>
            <Flex justify="start" gap="16px" style={{ width: '100%', marginBottom: 10 }}>
                {t('performacemng.chooseTime')}
            </Flex>
            <Flex justify="start" gap="5px">
                {timePeriodList.slice(0, 6).map(item => (
                    <Tag onClick={() => handlePeriodToggle(item)} size="S" text={item} />
                ))}
            </Flex>

            <Flex justify="start" gap="5px" style={{ marginTop: '8px' }}>
                {timePeriodList.slice(6).map(item => (
                    <Tag onClick={() => handlePeriodToggle(item)} size="S" text={item} />
                ))}
            </Flex>
        </Flex>
    );
    return (
        <Flex ref={flyoutRef} className={styles['secondary-flyout-wrapper']}>
            <Flyout
                // content={<div className={styles['content-container']}>Hello World</div>}
                content={
                    isSearchResult &&
                    (accessibleForums?.length || 0) + (otherForums?.length || 0) === 0 ? (
                        <Flex
                            vertical
                            className={styles['am-empty-state']}
                            align="center"
                            justify="center"
                            gap={16}
                        >
                            <Flex vertical align="center" justify="center" gap={16}>
                                <NoMatchesFound />
                                <Flex vertical align="center" justify="center" gap={4}>
                                    <Label type="body1">
                                        <span className={styles['am-empty-state-title']}>
                                            {t('performacemng.noMatchesFound')}
                                        </span>
                                    </Label>
                                    <Label type="body2">
                                        <span className={styles['am-empty-state-description']}>
                                            {t('performacemng.sorryNothingMatchesRecords')}
                                        </span>
                                    </Label>
                                </Flex>
                            </Flex>
                        </Flex>
                    ) : (
                        <Flex className={styles['content-container']}>
                            {isSearchResult && (
                                <span>
                                    {(accessibleForums?.length || 0) + (otherForums?.length || 0)}{' '}
                                    {t('performacemng.searchResults')}
                                </span>
                            )}
                            {isSearchResult && <Divider className={styles['vertical-divider']} />}
                            {isFavoriteUpdating ? (
                                <div className={styles['initial-loader-container']}>
                                    <AnimatedLoaders id="lazy-loader" type="page" />
                                </div>
                            ) : (
                                <Accordion
                                    className={styles['accordian-accessible-forums']}
                                    isExpanded
                                    leftRightSpaceZero
                                    title={t('performacemng.reportsAccess')}
                                    outlined={false}
                                    customActions={
                                        <Counter
                                            className={styles['accordion-counter']}
                                            value={accessibleForums?.length || 0}
                                        />
                                    }
                                >
                                    <React.Fragment key=".$.0">
                                        {accessibleForums?.length > 0 ? (
                                            accessibleForums?.map((item: any) => (
                                                <PerformanceReviewCard
                                                    title={item.forumName}
                                                    subtitle={`${item.forumLevelName} | ${item.forumPeriodName}`}
                                                    siteButtons={
                                                        selectedId !== 'Global'
                                                            ? item.geographies.map((geo: any) => ({
                                                                  forumId: geo.forumId,
                                                                  geography: geo.geography,
                                                                  isFavorite: geo.isFavorite,
                                                              }))
                                                            : []
                                                    }
                                                    showCardHeartIcon={true}
                                                    onCardClick={() => {
                                                        const selectedForumData = {
                                                            level: item.forumLevelName,
                                                            period: item.forumPeriodName,

                                                            forums:
                                                                item.geographies?.map(
                                                                    (geo: any) => ({
                                                                        forumId:
                                                                            geo.forumId ?? null,
                                                                        forumName: item.forumName,
                                                                        geography:
                                                                            geo.geography ?? null,
                                                                    }),
                                                                ) ?? [], // Passing all the forumIds along with region as per new requirement for DPM integration
                                                        };

                                                        dispatch(
                                                            setSelectedForumData(selectedForumData),
                                                        );

                                                        if (onCardClick) {
                                                            onCardClick();
                                                        }
                                                    }}
                                                    onSiteFavoriteToggle={onFavoriteToggle}
                                                    onCardFavoriteToggle={onFavoriteToggle}
                                                    isFavorite={
                                                        selectedId === 'Global'
                                                            ? item.geographies[0]?.isFavorite
                                                            : undefined
                                                    }
                                                    globalForumId={
                                                        selectedId === 'Global'
                                                            ? item.geographies[0]?.forumId
                                                            : undefined
                                                    }
                                                    selectedId={selectedId}
                                                    onSiteButtonClick={data => {
                                                        const selectedForumData = {
                                                            level: item.forumLevelName,
                                                            period: item.forumPeriodName,
                                                            forums: [
                                                                {
                                                                    forumId: data?.forumId,
                                                                    forumName: item?.forumName,
                                                                    geography: data?.geography,
                                                                },
                                                            ],
                                                        };

                                                        dispatch(
                                                            setSelectedForumData(selectedForumData),
                                                        );

                                                        if (onCardClick) {
                                                            onCardClick();
                                                        }
                                                    }}
                                                />
                                            ))
                                        ) : (
                                            <span className={styles['empty-forums']}>
                                                {t('performacemng.notTagged')}
                                            </span>
                                        )}
                                    </React.Fragment>
                                </Accordion>
                            )}
                            <Accordion
                                className={styles['accordian-accessible-forums']}
                                isExpanded={false}
                                leftRightSpaceZero
                                title={t('performacemng.reportsOutsideAccess')}
                                outlined={false}
                                customActions={
                                    <Counter
                                        className={styles['accordion-counter']}
                                        value={otherForums?.length || 0}
                                    />
                                }
                            >
                                <React.Fragment key=".$.0">
                                    {otherForums?.length > 0 ? (
                                        otherForums?.map((item: any) => (
                                            <PerformanceReviewCard
                                                title={item.forumName}
                                                isDisabled={true}
                                            />
                                        ))
                                    ) : (
                                        <span className={styles['empty-forums']}>
                                            {t('performacemng.noReportsOutsideAccess')}
                                        </span>
                                    )}
                                </React.Fragment>
                            </Accordion>
                        </Flex>
                    )
                }
                dataTestId="fly-out"
                flyoutOpen={isOpen}
                direction="left"
                cancelIconClick={() => {
                    setIsOpen(false);
                    onClose();
                }}
                heading=""
                className={styles['flyout-container-secondmain']}
                customActions={getCustomActionsForFlyout()}
                flyoutBgColor={'#F4F6F7'}
                id="fly-out"
                onBackDropClick={() => {
                    //if (clickedSearchBar) return;

                    setIsOpen(false);
                    onClose();
                }}
            />
        </Flex>
    );
};

export default SecondaryFlyout;
