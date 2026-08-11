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
 import { setSelectedToolData } from '../../../store/slice/selectedToolSlice';
import type { SelectedToolState } from '../../../store/slice/selectedToolSlice';
import { useTranslation } from 'react-i18next';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    setIsOpen: (open: boolean) => void;
    selectedId: string;
    tools: any[];
    isSearchResult: boolean;
    helpDisplay?: string;
    timePeriodList: string[];
    clickedSearchBar?: boolean;
    onFavoriteToggle?: (toolIds: number[], isFavorite: boolean) => void;
    onCardClick?: (selectedToolData: SelectedToolState) => void;
    isFavoriteUpdating?: boolean;
}

const SecondaryFlyout2: React.FC<Props> = ({
    isOpen,
    setIsOpen,
    selectedId,
    tools,
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

    const aggregateForums = (tools: any) => {
        const aggregated: Record<string, any> = {};

        tools.forEach((tool: any) => {
            const {
             //   forumCount,
                isAccessible,
                reportLevelName,
                reportPeriodName,
                toolDescription,
                toolId,
                toolName,
                reportLevelId,
                reportPeriodId
               
            } = tool;

            // Determine geography
            let geography = '';
            if (reportLevelName === 'Region') {
                geography = reportLevelName;
            } else if (reportLevelName === 'Cluster') {
                geography = reportLevelName;
            } else if (reportLevelName === 'Market') {
                geography = reportLevelName;
            } else if (reportLevelName === 'Site') {
                geography = reportLevelName;
            } else {
                geography = reportLevelName;
            }

            const key = `${toolName}||${reportLevelName}||${reportPeriodName} || ${isAccessible}`;

            if (!aggregated[key]) {
                aggregated[key] = {
                    toolName,
                    reportLevelName,
                    reportPeriodName,
                    isAccessible,
                    geographies: [],
                    toolDescription,
                    reportLevelId,
                    reportPeriodId,
                };
            }

            aggregated[key].geographies.push({
                forumId: toolId,
                geography,
            });
        });
        return Object.values(aggregated);
    };

    const matchesSelectedLevel = (levelValue: string, selectedLevel: string) => {
        if (!levelValue || !selectedLevel) return false;

        const normalizedSelected = selectedLevel.trim().toLowerCase();
        return levelValue
            .split(',')
            .map(level => level.trim().toLowerCase())
            .includes(normalizedSelected);
    };

    useEffect(() => {
        const toolsAfterAggregation = aggregateForums(tools);
        setAccessibleForums(
            toolsAfterAggregation?.filter(
                (item: any) =>
                    item.isAccessible === true &&
                    matchesSelectedLevel(item.reportLevelName, selectedId),
            ),
        );
        setOtherForums(
            toolsAfterAggregation?.filter(
                (item: any) =>
                    item.isAccessible === false &&
                    matchesSelectedLevel(item.reportLevelName, selectedId),
            ),
        );
        setAggregatedForums(toolsAfterAggregation);
    }, [tools, selectedId]);

    useEffect(() => {
        const isAllSelected = selectedPeriods.includes('All');
        const isNoneSelected = selectedPeriods.length === 0;

        const shouldShowAll = isAllSelected || isNoneSelected;

        const filteredAccessible = aggregatedForums
            ?.filter(
                (item: any) =>
                    item.isAccessible === true &&
                    matchesSelectedLevel(item.reportLevelName, selectedId) &&
                    (shouldShowAll || selectedPeriods.includes(item.reportPeriodName)),
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
                matchesSelectedLevel(item.reportLevelName, selectedId) &&
                (shouldShowAll || selectedPeriods.includes(item.reportPeriodName)),
        );

        setAccessibleForums(filteredAccessible);
        setOtherForums(filteredOther);
    }, [selectedPeriods, selectedId, aggregatedForums]);
    const handlePeriodToggle = (period: string) => {
        setSelectedPeriods(prev => {
            if (prev.includes(period)) {
                return prev.filter(p => p !== period);
            } else {
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
                    <Tag key={item} onClick={() => handlePeriodToggle(item)} size="S" text={item} />
                ))}
            </Flex>

            <Flex justify="start" gap="5px" style={{ marginTop: '8px' }}>
                {timePeriodList.slice(6).map(item => (
                    <Tag key={item} onClick={() => handlePeriodToggle(item)} size="S" text={item} />
                ))}
            </Flex>
        </Flex>
    );
    return (
        <Flex ref={flyoutRef} className={styles['secondary-flyout-wrapper']}>
            <Flyout
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
                                                  key={`${item.toolName}-${item.reportLevelName}-${item.reportPeriodName}-${item.isAccessible}`}
                                                    title={item.toolName}
                                                    subtitle={`${item.toolDescription}  ${item.reportPeriodName} ||  ${item.reportLevelName}`}
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
                                                        const selectedForumData: SelectedToolState = {
                                                            level: item.reportLevelId,
                                                            period: item.reportPeriodId,
                                                            toolId: item.geographies?.[0]?.forumId ?? 0,
                                                            
                                                        };
                                                        dispatch(
                                                            setSelectedToolData(selectedForumData),
                                                        );

                                                        if (onCardClick) {
                                                            onCardClick(selectedForumData);
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
                                                        const selectedToolData: SelectedToolState = {
                                                            level:
                                                                
                                                                item.reportLevelId,
                                                            period:
                                                               
                                                                item.reportPeriodId,
                                                            toolId:
                                                                data?.forumId ??
                                                                item.geographies?.[0]?.forumId ??
                                                                0,
                                                          
                                                        };
                                                        dispatch(
                                                            setSelectedToolData(selectedToolData),
                                                        );

                                                        if (onCardClick) {
                                                            onCardClick(selectedToolData);
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
                                                title={item.toolName}
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
                    setIsOpen(false);
                    onClose();
                }}
            />
        </Flex>
    );
};

export default SecondaryFlyout2;
