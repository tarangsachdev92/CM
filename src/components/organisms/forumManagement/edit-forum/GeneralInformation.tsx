import { Flex } from 'antd';
import { Icon, InputField, DropDown } from 'konnect-react-components';
import React, { useCallback, useState, useEffect, SetStateAction } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../store';

import { Label } from '../../../../components/atoms';
import styles from './EditForumScreen.module.scss';
import { convertOptions, logError } from '../../../../utils/helpers';
import {
    fetchForumDropdownInit,
    fetchSubFunctions,
    fetchRegions,
    fetchClusters,
    fetchMarkets,
    fetchSites,
} from '../../../../store/thunks/forumMasterData';
import { IForumDetail } from '../../../../types/response';

type GeographySelectionData = {
    regionIds: string | null;
    clusterIds: string | null;
    marketIds: string | null;
    siteIds: string | null;
    isRegionAll: boolean;
    isClusterAll: boolean;
    isMarketAll: boolean;
    isSiteAll: boolean;
};

type ChildProps = {
    forumDetail: IForumDetail | undefined;
    generalInfoData: {
        forumName: string;
        functionId: string;
        subFunctionId: string;
        geographyLevelId: string;
        periodId: string;
        status: string;
    };
    setGeographySelectionData: React.Dispatch<SetStateAction<GeographySelectionData>>;
    setGeneralInfoData: React.Dispatch<
        SetStateAction<{
            forumName: string;
            functionId: string;
            subFunctionId: string;
            geographyLevelId: string;
            periodId: string;
            status: string;
        }>
    >;
    setHasForumInfoChanged: React.Dispatch<SetStateAction<boolean>>;
    discardGeneralInfo: boolean;
    setDiscardGeneralInfo: React.Dispatch<SetStateAction<boolean>>;
    setIsPageDirty: React.Dispatch<SetStateAction<boolean>>;
};

function GeneralInformation({
    forumDetail,
    generalInfoData,
    setGeographySelectionData,
    setGeneralInfoData,
    setHasForumInfoChanged,
    discardGeneralInfo,
    setDiscardGeneralInfo,
    setIsPageDirty,
}: ChildProps) {
    const dispatch = useDispatch<AppDispatch>();
    const [regionDD, setRegionDD] = useState<{ label: string; value: number }[]>([]);
    const [clusterDD, setClusterDD] = useState<{ label: string; value: number }[]>([]);
    const [marketDD, setMarketDD] = useState<{ label: string; value: number }[]>([]);
    const [siteDD, setSiteDD] = useState<{ label: string; value: number }[]>([]);

    const {
        functions,
        geographyLevels,
        forumPeriods,
        subFunctions,
        regions,
        clusters,
        markets,
        sites,
    } = useSelector((state: RootState) => state.forumMaster);

    const allFunctions = functions;
    const allSubfunctions = subFunctions;
    const forumGeographyLevels = geographyLevels;
    const geographicalRegion = regions;
    const geographicalCluster = clusters;
    const geographicalMarkets = markets;
    const geographicalSites = sites;

    const [applicationRegion, setApplicationRegion] = useState<{ label: string; value: string }[]>(
        [],
    );
    const [applicationCluster, setApplicationCluster] = useState<
        { label: string; value: string }[]
    >([]);
    const [applicationMarket, setApplicationMarket] = useState<{ label: string; value: string }[]>(
        [],
    );
    const [applicationSite, setApplicationSite] = useState<{ label: string; value: string }[]>([]);
    const forumStatus: { label: string; value: string }[] = [
        { label: 'Active', value: '1' },
        { label: 'InActive', value: '0' },
    ];

    type ModificationStatus = {
        region: boolean;
        cluster: boolean;
        market: boolean;
        site: boolean;
        forumName: boolean;
        function: boolean;
        subfunction: boolean;
        geographyLevel: boolean;
        period: boolean;
        hasGeneralInfoChanged: boolean;
    };

    interface BasicInformation {
        forumName: string | null;
        forumId: string | null;
        functions: string | null;
        subFunctions: string | null;
        forumGeographyLevel: string | null;
        forumPeriod: string | null;
        status: string | null;
    }

    interface GeographicalInformation {
        region: string | null;
        cluster: string | null;
        market: string | null;
        site: string | null;
        allRegion: boolean;
        allCluster: boolean;
        allMarket: boolean;
        allSite: boolean;
    }

    const [modificationStatus, setModificationStatus] = useState<ModificationStatus>({
        region: false,
        cluster: false,
        market: false,
        site: false,
        forumName: false,
        function: false,
        subfunction: false,
        geographyLevel: false,
        period: false,
        hasGeneralInfoChanged: false,
    });

    const [newBasicData, setNewBasicData] = useState<BasicInformation>({
        forumName: '',
        forumId: '',
        functions: '',
        subFunctions: '',
        forumGeographyLevel: '',
        forumPeriod: '',
        status: '',
    });

    const [newGeoData, setNewGeoData] = useState<GeographicalInformation>({
        region: '',
        cluster: '',
        market: '',
        site: '',
        allRegion: false,
        allCluster: false,
        allMarket: false,
        allSite: false,
    });
   
    const geoLevelId = Number(generalInfoData?.geographyLevelId);

    const isGlobal = geoLevelId === 5;

    const isRegionEnabled = isGlobal || geoLevelId >= 1;

    const isClusterEnabled = isGlobal || geoLevelId >= 2;

    const isMarketEnabled = isGlobal || geoLevelId >= 3;

    const isSiteEnabled = isGlobal || geoLevelId >= 4;

    useEffect(() => {
        setRegionDD(
            geographicalRegion?.map(region => ({
                label: region.regionName,
                value: region.regionId,
            })),
        );
    }, [geographicalRegion]);

    useEffect(() => {
        const clusters = geographicalCluster.map(cluster => ({
            label: cluster.clusterName,
            value: cluster.clusterId,
        }));
        setClusterDD(clusters);
    }, [geographicalCluster]);

    const getResolvedOptionId = (
        value: string,
        options: any[],
        valueKey: string,
        labelKey: string,
    ) => {
        const matchedOption = options.find(
            option => option[labelKey]?.toLowerCase() === value?.toLowerCase(),
        );

        return matchedOption?.[valueKey];
    };
    useEffect(() => {
        if (!forumDetail?.basicInformation?.function) {
            return;
        }

        const functionId = getResolvedOptionId(
            forumDetail.basicInformation.function,
            functions,
            'functionId',
            'functionName',
        );

        if (functionId) {
            dispatch(fetchSubFunctions(Number(functionId)));
        }
    }, [forumDetail, functions, dispatch]);

    useEffect(() => {
        if (!forumDetail?.basicInformation?.subFunction || !allSubfunctions?.length) {
            return;
        }

        const selectedSubFunction = allSubfunctions.find(
            item =>
                item.subFunctionName?.toLowerCase() ===
                forumDetail.basicInformation.subFunction.toLowerCase(),
        );

        if (selectedSubFunction) {
            setGeneralInfoData(prev => ({
                ...prev,
                subFunctionId: String(selectedSubFunction.subFunctionId),
            }));
        }
    }, [allSubfunctions, forumDetail]);

    useEffect(() => {
        if (applicationRegion.length > 0) {
            const regionIds = applicationRegion?.map(region => String(region.value)) ?? [];
            dispatch(fetchClusters(regionIds))
                .unwrap()
                .then(() => {
                    if (modificationStatus.region) {
                        setApplicationCluster([]);
                        setApplicationMarket([]);
                        setApplicationSite([]);
                        setMarketDD([]);
                        setSiteDD([]);
                    }
                })
                .catch(error => {
                    logError('Failed to fetch clusters:', error);
                });
        } else {
            setApplicationCluster([]);
            setApplicationMarket([]);
            setApplicationSite([]);
            setClusterDD([]);
            setMarketDD([]);
            setSiteDD([]);
        }
    }, [applicationRegion, modificationStatus.region]);

    // Update cluster dropdown
    useEffect(() => {
        const clusters = geographicalCluster.map(cluster => ({
            label: cluster.clusterName,
            value: cluster.clusterId,
        }));
        setClusterDD(clusters);
    }, [geographicalCluster]);

    // Fetch Markets when Cluster changes
    useEffect(() => {
        if (applicationCluster.length > 0) {
            const clusterIds = applicationCluster?.map(cluster => String(cluster.value)) ?? [];
            dispatch(fetchMarkets(clusterIds))
                .unwrap()
                .then(() => {
                    if (modificationStatus.cluster) {
                        setApplicationMarket([]);
                        setApplicationSite([]);
                        setSiteDD([]);
                    }
                })
                .catch(error => {
                    logError('Failed to fetch markets:', error);
                });
        } else {
            setApplicationMarket([]);
            setApplicationSite([]);
            setSiteDD([]);
            setMarketDD([]);
        }
    }, [applicationCluster, modificationStatus.cluster]);

    // Update Market dropdown when markets data changes
    useEffect(() => {
        const markets = geographicalMarkets.map(market => ({
            label: market.marketName,
            value: market.marketId,
        }));
        setMarketDD(markets);
    }, [geographicalMarkets]);

    // Fetch Sites when Market changes
    useEffect(() => {
        if (applicationMarket.length > 0) {
            const marketIds = applicationMarket?.map(market => String(market.value)) ?? [];
            dispatch(fetchSites(marketIds))
                .unwrap()
                .then(() => {
                    if (modificationStatus.market) {
                        setApplicationSite([]);
                    }
                })
                .catch((error: any) => {
                    logError('Failed to fetch sites:', error);
                });
        } else if (applicationMarket.length == 0 || modificationStatus.market) {
            setApplicationSite([]);
            setSiteDD([]);
        } else {
            setSiteDD([]); // Clear Sites if no Market selected
        }
    }, [applicationMarket, modificationStatus.market]);

    // Update Site dropdown when sites data changes
    useEffect(() => {
        if (geographicalSites.length > 0) {
            setSiteDD(
                geographicalSites.map(site => ({
                    label: site.siteName,
                    value: site.siteId,
                })),
            );
        } else {
            setSiteDD([]);
        }
    }, [geographicalSites]);

    useEffect(() => {
        if (!forumDetail?.basicInformation?.forumId) {
            return;
        }
        dispatch(fetchForumDropdownInit());
        dispatch(fetchRegions());

        InitializeData();
    }, [forumDetail]);

    useEffect(() => {
        if (modificationStatus.hasGeneralInfoChanged) setIsPageDirty(true);
        else setIsPageDirty(false);
    }, [modificationStatus.hasGeneralInfoChanged]);

    const InitializeData = () => {
        setNewBasicData(prevData => ({
            ...prevData,
            forumId: forumDetail?.basicInformation?.forumId ?? null,
            forumName: forumDetail?.basicInformation?.forumName ?? null,
            functions: forumDetail?.basicInformation?.function ?? null,
            subFunctions: forumDetail?.basicInformation?.subFunction ?? null,
            forumGeographyLevel: forumDetail?.basicInformation?.geographyLevel ?? null,
            forumPeriod: forumDetail?.basicInformation?.period ?? null,
            status: forumDetail?.basicInformation?.status ?? null,
        }));

        setApplicationRegion(
            forumDetail?.geographicalInformation?.region?.map(geo => ({
                label: geo.name,
                value: String(geo.geographyId),
            })) ?? [],
        );

        setApplicationCluster(
            forumDetail?.geographicalInformation?.cluster?.map(geo => ({
                label: geo.name,
                value: String(geo.geographyId),
            })) ?? [],
        );
        setApplicationMarket(
            forumDetail?.geographicalInformation?.market?.map(geo => ({
                label: geo.name,
                value: String(geo.geographyId),
            })) ?? [],
        );
        setApplicationSite(
            forumDetail?.geographicalInformation?.sites?.map(geo => ({
                label: geo.name,
                value: String(geo.geographyId),
            })) ?? [],
        );
        setNewGeoData({
            ...newGeoData,
            region:
                forumDetail?.geographicalInformation?.region
                    ?.map(item => item.geographyId)
                    .join(',') ?? '',
            cluster:
                forumDetail?.geographicalInformation?.cluster
                    ?.map(item => item.geographyId)
                    .join(',') ?? '',
            market:
                forumDetail?.geographicalInformation?.market
                    ?.map(item => item.geographyId)
                    .join(',') ?? '',
            site:
                forumDetail?.geographicalInformation?.sites
                    ?.map(item => item.geographyId)
                    .join(',') ?? '',
        });
    };

    useEffect(() => {
        setNewGeoData({
            ...newGeoData,
            allRegion:
                forumDetail?.geographicalInformation?.region?.length === geographicalRegion?.length,
        });
    }, [forumDetail, geographicalRegion]);

    useEffect(() => {
        setNewGeoData({
            ...newGeoData,
            allCluster:
                forumDetail?.geographicalInformation?.cluster?.length ===
                geographicalCluster?.length,
        });
    }, [forumDetail, geographicalCluster]);

    useEffect(() => {
        setNewGeoData({
            ...newGeoData,
            allMarket:
                forumDetail?.geographicalInformation?.market?.length ===
                geographicalMarkets?.length,
        });
    }, [forumDetail, geographicalMarkets]);

    useEffect(() => {
        setNewGeoData({
            ...newGeoData,
            allSite:
                forumDetail?.geographicalInformation?.sites?.length === geographicalSites?.length,
        });
    }, [forumDetail, geographicalSites]);

    useEffect(() => {
        const selectedFunctionId = Number(generalInfoData?.functionId);

        if (!selectedFunctionId) {
            return;
        }

        dispatch(fetchSubFunctions(selectedFunctionId))
            .unwrap()
            .then(() => {})
            .catch(error => {
                logError('Failed to fetch subfunctions:', error);
            });
    }, [dispatch, generalInfoData?.functionId]);

    useEffect(() => {
        if (
            newBasicData?.subFunctions == null ||
            newBasicData?.subFunctions == undefined ||
            newBasicData?.subFunctions == '' ||
            allSubfunctions == undefined ||
            allSubfunctions?.length == 0
        )
            return;

        onSubFunctionSelect();
    }, [allSubfunctions, newBasicData?.subFunctions]);

    useEffect(() => {
        setHasForumInfoChanged(modificationStatus.hasGeneralInfoChanged);
    }, [modificationStatus.hasGeneralInfoChanged, setHasForumInfoChanged]);

    useEffect(() => {
        if (discardGeneralInfo) discardChanges();
        setDiscardGeneralInfo(false);
    }, [discardGeneralInfo]);

    useEffect(() => {
        setGeographySelectionData({
            regionIds: newGeoData.region || null,
            clusterIds: newGeoData.cluster || null,
            marketIds: newGeoData.market || null,
            siteIds: newGeoData.site || null,
            isRegionAll: Boolean(newGeoData.allRegion),
            isClusterAll: Boolean(newGeoData.allCluster),
            isMarketAll: Boolean(newGeoData.allMarket),
            isSiteAll: Boolean(newGeoData.allSite),
        });
    }, [newGeoData, setGeographySelectionData]);

    const getFunctions = useCallback(() => {
        if (!allFunctions.length) {
            return [];
        }
        const convertedData = convertOptions(allFunctions as any, 'functionName', 'functionId');
        return convertedData;
    }, [allFunctions]);

    const getSubFunctions = useCallback(() => {
        if (!allSubfunctions.length) {
            return [];
        }
        const convertedData = convertOptions(
            allSubfunctions as any,
            'subFunctionName',
            'subFunctionId',
        );
        return convertedData;
    }, [allSubfunctions]);

    const getForumGeograpyLevels = useCallback(() => {
        if (!forumGeographyLevels.length) {
            return [];
        }
        const convertedData = convertOptions(
            forumGeographyLevels as any,
            'geographyLevelName',
            'geographyLevelId',
        );
        return convertedData;
    }, [forumGeographyLevels]);

    const getForumPeriods = useCallback(() => {
        if (!forumPeriods.length) {
            return [];
        }
        const convertedData = convertOptions(forumPeriods as any, 'forumPeriodName', 'id');
        return convertedData;
    }, [forumPeriods]);

    const getSelectedDropdownOption = (
        options: { label: string; value: string | number }[],
        selectedValue: string,
    ) => {
        if (!selectedValue) return [];

        const normalizedValue = String(selectedValue).toLowerCase();
        const matchedOption = options.find(
            option =>
                String(option.value).toLowerCase() === normalizedValue ||
                String(option.label).toLowerCase() === normalizedValue,
        );

        return matchedOption
            ? [
                  {
                      label: matchedOption.label,
                      value: String(matchedOption.value),
                  },
              ]
            : [];
    };

    const onFunctionSelect = () => {
        return generalInfoData.functionId
            ? (() => {
                  return getSelectedDropdownOption(getFunctions(), generalInfoData.functionId);
              })()
            : [];
    };

    const onSubFunctionSelect = () => {
        return generalInfoData.subFunctionId
            ? (() => {
                  return getSelectedDropdownOption(
                      getSubFunctions(),
                      generalInfoData.subFunctionId,
                  );
              })()
            : [];
    };
    const onForumGeographyLevelSelect = () => {
        return generalInfoData.geographyLevelId
            ? (() => {
                  return getSelectedDropdownOption(
                      getForumGeograpyLevels(),
                      generalInfoData.geographyLevelId,
                  );
              })()
            : [];
    };

    const onForumPeriodSelect = () => {
        return generalInfoData.periodId
            ? (() => {
                  return getSelectedDropdownOption(getForumPeriods(), generalInfoData.periodId);
              })()
            : [];
    };
    const normalizeStatusValue = (status?: string): string => {
        const normalized = String(status ?? '')
            .trim()
            .toLowerCase();

        if (['1', 'true', 'active'].includes(normalized)) {
            return '1';
        }

        if (['0', 'false', 'inactive', 'in-active'].includes(normalized)) {
            return '0';
        }

        return '';
    };
    const onForumStatusSelect = () => {
        const normalizedStatus = normalizeStatusValue(generalInfoData.status);
        if (!normalizedStatus) return [];

        return getSelectedDropdownOption(forumStatus, normalizedStatus);
    };
    const onFunctionChange = (option: any) => {
        setModificationStatus(prev => ({
            ...prev,
            function: true,
            hasGeneralInfoChanged: true,
        }));
        setGeneralInfoData(prev => ({
            ...prev,
            functionId: String(option?.value ?? ''),
            subFunctionId: '',
        }));
        setHasForumInfoChanged(true);
    };

    const onSubFunctionChange = (option: any) => {
        setModificationStatus(prev => ({
            ...prev,
            subfunction: true,
            hasGeneralInfoChanged: true,
        }));
        setGeneralInfoData(prev => ({
            ...prev,
            subFunctionId: String(option?.value ?? ''),
        }));
        setHasForumInfoChanged(true);
    };

    const onForumPeriodChange = (option: any) => {
        setModificationStatus(prev => ({
            ...prev,
            period: true,
            hasGeneralInfoChanged: true,
        }));
        setGeneralInfoData(prev => ({
            ...prev,
            periodId: String(option?.value ?? ''),
        }));
        setHasForumInfoChanged(true);
    };

    const onForumGeograpyLevelChange = (option: any) => {
        setModificationStatus(prev => ({
            ...prev,
            hasGeneralInfoChanged: true,
        }));
        setGeneralInfoData(prev => ({
            ...prev,
            geographyLevelId: String(option?.value ?? ''),
        }));
        setHasForumInfoChanged(true);
    };

    const onForumStatusChange = (option: any) => {
        setModificationStatus(prev => ({
            ...prev,
            hasGeneralInfoChanged: true,
        }));
        setGeneralInfoData(prev => ({
            ...prev,
            status: String(option?.value ?? ''),
        }));
        setHasForumInfoChanged(true);
    };

    const onRegionChange = (tree: object[]) => {
        const selectedTree = tree as {
            label: string;
            value: string;
        }[];
        setApplicationRegion(selectedTree);
        setModificationStatus(prev => ({
            ...prev,
            region: true,
            hasGeneralInfoChanged: true,
        }));
        setNewGeoData(prev => ({
            ...prev,
            region: selectedTree?.map(x => x.value).join(',') ?? '',
            allRegion: selectedTree?.length == geographicalRegion?.length,
        }));
    };

    const onClusterChange = (tree: object[]) => {
        const selectedTree = tree as {
            label: string;
            value: string;
        }[];
        setModificationStatus(prev => ({
            ...prev,
            cluster: true,
            hasGeneralInfoChanged: true,
        }));
        setApplicationCluster(selectedTree);
        setNewGeoData(prev => ({
            ...prev,
            cluster: selectedTree?.map(x => x.value).join(',') ?? '',
            allCluster: selectedTree?.length == geographicalCluster?.length,
        }));
    };

    const onMarketChange = (tree: object[]) => {
        const selectedTree = tree as {
            label: string;
            value: string;
        }[];
        setModificationStatus(prev => ({
            ...prev,
            market: true,
            hasGeneralInfoChanged: true,
        }));
        setApplicationMarket(selectedTree);
        setNewGeoData(prev => ({
            ...prev,
            market: selectedTree?.map(x => x.value).join(',') ?? '',
            allMarket: selectedTree?.length == geographicalMarkets?.length,
        }));
    };

    const onSiteChange = (tree: object[]) => {
        const selectedTree = tree as {
            label: string;
            value: string;
        }[];
        setModificationStatus(prev => ({
            ...prev,
            site: true,
            hasGeneralInfoChanged: true,
        }));
        setApplicationSite(selectedTree);
        setNewGeoData(prev => ({
            ...prev,
            site: selectedTree?.map(x => String(x.value)).join(',') ?? '',
            allSite: selectedTree?.length == geographicalSites?.length,
        }));
    };

    const discardChanges = () => {
        setModificationStatus({
            region: false,
            cluster: false,
            market: false,
            site: false,
            forumName: false,
            function: false,
            subfunction: false,
            geographyLevel: false,
            period: false,
            hasGeneralInfoChanged: false,
        });

        InitializeData();
    };

    const RenderGeneralInformation = () => {
        return (
            <div className={styles['edit-application-screen']}>
                <Flex gap={24} justify="space-between">
                    <Flex className={styles['section']}>
                        <Flex vertical gap={16} className={styles['field']}>
                            <Label type="h2">
                                <span className={styles['section-heading']}>Basic Information</span>
                            </Label>
                            <Flex gap={4} align="center" className={styles['field-row']}>
                                <Icon
                                    name="layout-alt-01"
                                    size="xm"
                                    color="primary-green-500-color"
                                />
                                <span className={styles['basic-field-name']}>Forum Name:</span>
                                {
                                    <Flex className={styles['input-container']}>
                                        <InputField
                                            className="input-field"
                                            placeholder={forumDetail?.basicInformation?.forumName}
                                            value={generalInfoData?.forumName ?? undefined}
                                            onChange={e => {
                                                setModificationStatus(prev => ({
                                                    ...prev,
                                                    forumName: true,
                                                    hasGeneralInfoChanged: true,
                                                }));
                                                setGeneralInfoData(prev => ({
                                                    ...prev,
                                                    forumName: e.target.value,
                                                }));
                                                setHasForumInfoChanged(true);
                                            }}
                                            isDisabled={false}
                                        />
                                    </Flex>
                                }
                            </Flex>
                            <Flex gap={4} align="center" className={styles['field-row']}>
                                <Icon
                                    name="file-code-01"
                                    size="xm"
                                    color="primary-green-500-color"
                                />
                                <span className={styles['basic-field-name']}> ID:</span>
                                {
                                    <Flex className={styles['input-container']}>
                                        <InputField
                                            className="input-field"
                                            placeholder={String(
                                                forumDetail?.basicInformation?.forumId,
                                            )}
                                            value={String(forumDetail?.basicInformation?.forumId)}
                                            onChange={() => {}}
                                            isDisabled={true}
                                        />
                                    </Flex>
                                }
                            </Flex>
                            <Flex
                                gap={4}
                                align="center"
                                className={`${styles['function-field']} ${styles['field-row']}`}
                            >
                                <Icon name="sliders-01" size="xm" color="primary-green-500-color" />
                                <span className={styles['basic-field-name']}>Function:</span>
                                {
                                    <Flex className={styles['input-container']}>
                                        <DropDown
                                            className={`drop-down ${styles['full-width-dropdown']}`}
                                            id="Team-dropdown"
                                            dropdown={{
                                                options: getFunctions(),
                                                reset: false,
                                                placeholder: 'Select Function',
                                                onChange: (option: any, _) => {
                                                    onFunctionChange(option);
                                                },
                                                selectedOptions: onFunctionSelect(),
                                            }}
                                            dropdownOptionsClassName={
                                                styles['dropdown-options-custom']
                                            }
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    </Flex>
                                }
                            </Flex>
                            <Flex
                                gap={4}
                                align="center"
                                className={`${styles['subfunction-field']} ${styles['field-row']}`}
                            >
                                <Icon
                                    name="settings-04"
                                    size="xm"
                                    color="primary-green-500-color"
                                />
                                <span className={styles['basic-field-name']}>Sub-Function:</span>
                                {
                                    <Flex className={styles['input-container']}>
                                        <DropDown
                                            className={`drop-down ${styles['full-width-dropdown']}`}
                                            id="Team-dropdown"
                                            dropdown={{
                                                options: getSubFunctions(),
                                                reset: false,
                                                placeholder: 'Select Sub-Function',
                                                onChange: (option: any, _) => {
                                                    onSubFunctionChange(option);
                                                },
                                                selectedOptions: onSubFunctionSelect(),
                                            }}
                                            dropdownOptionsClassName={
                                                styles['dropdown-options-custom']
                                            }
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    </Flex>
                                }
                            </Flex>
                            <Flex gap={4} align="center" className={styles['field-row']}>
                                <Icon name="archieve" size="xm" color="primary-green-500-color" />
                                <span className={styles['basic-field-name']}>Geography Level:</span>
                                {
                                    <Flex className={styles['input-container']}>
                                        <DropDown
                                            className={`drop-down ${styles['full-width-dropdown']}`}
                                            id="Team-dropdown"
                                            dropdown={{
                                                options: getForumGeograpyLevels(),
                                                reset: false,
                                                placeholder: 'Select Geography Level',
                                                onChange: (option: any, _) => {
                                                    onForumGeograpyLevelChange(option);
                                                },
                                                selectedOptions: onForumGeographyLevelSelect(),
                                            }}
                                            dropdownOptionsClassName={
                                                styles['dropdown-options-custom']
                                            }
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    </Flex>
                                }
                            </Flex>
                            <Flex gap={4} align="center" className={styles['field-row']}>
                                <Icon name="archieve" size="xm" color="primary-green-500-color" />
                                <span className={styles['basic-field-name']}>Forum Period:</span>
                                {
                                    <Flex className={styles['input-container']}>
                                        <DropDown
                                            className={`drop-down ${styles['full-width-dropdown']}`}
                                            id="Team-dropdown"
                                            dropdown={{
                                                options: getForumPeriods(),
                                                reset: false,
                                                placeholder: 'Select Forum Period',
                                                onChange: (option: any, _) => {
                                                    onForumPeriodChange(option);
                                                },
                                                selectedOptions: onForumPeriodSelect(),
                                            }}
                                            dropdownOptionsClassName={
                                                styles['dropdown-options-custom']
                                            }
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    </Flex>
                                }
                            </Flex>

                            <Flex gap={4} align="center" className={styles['field-row']}>
                                <Icon name="archieve" size="xm" color="primary-green-500-color" />
                                <span className={styles['basic-field-name']}>Status:</span>
                                {
                                    <Flex className={styles['input-container']}>
                                        <DropDown
                                            className={`drop-down ${styles['full-width-dropdown']}`}
                                            id="Team-dropdown"
                                            dropdown={{
                                                options: forumStatus,
                                                reset: false,
                                                placeholder: 'Select Status',
                                                onChange: (option: any, _) => {
                                                    onForumStatusChange(option);
                                                },
                                                selectedOptions: onForumStatusSelect(),
                                            }}
                                            dropdownOptionsClassName={
                                                styles['dropdown-options-custom']
                                            }
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    </Flex>
                                }
                            </Flex>
                        </Flex>
                    </Flex>

                    <Flex gap={24} className={styles['right-section-container']}>
                        <Flex className={styles['section']}>
                            <Flex vertical gap={16} className={styles['field']}>
                                <Label type="h2">
                                    <span className={styles['section-heading']}>
                                        Geographical Information
                                    </span>
                                </Label>
                                <Flex gap={4} align="center" className={styles['field-row']}>
                                    <Icon
                                        name="globe-01"
                                        size="xm"
                                        color="primary-green-500-color"
                                    />
                                    <span className={styles['geo-field-name']}>Region:</span>
                                    {
                                        <DropDown
                                            className="drop-down"
                                            dataTestId="region-dropdown"
                                            dropdown={{
                                                isDisabled: !isRegionEnabled,
                                                isLabelInline: false,
                                                onChange: (
                                                    _obj: any,
                                                    _checked: boolean,
                                                    tree: object[],
                                                ) => {
                                                    onRegionChange(tree);
                                                },
                                                options: regionDD.map(item => ({
                                                    label: item.label,
                                                    value: String(item.value),
                                                })),
                                                placeholder: 'Select Region',
                                                required: false,
                                                reset: false,
                                                showSelectAll: true,
                                                selectAllOption: { label: 'ALL', value: 'all' },
                                                selectedOptions: applicationRegion,
                                                size: 'L',
                                                type: 'checkbox',
                                            }}
                                            dropdownOptionsClassName="dropdown-options-custom"
                                            id="region-drop-down"
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    }
                                </Flex>
                                <Flex gap={4} align="center" className={styles['field-row']}>
                                    <Icon
                                        name="bezier-curve-03"
                                        size="xm"
                                        color="primary-green-500-color"
                                    />
                                    <span className={styles['geo-field-name']}>Cluster:</span>
                                    {
                                        <DropDown
                                            className="drop-down"
                                            dataTestId="cluster-dropdown"
                                            dropdown={{
                                                isDisabled: !isClusterEnabled,
                                                isLabelInline: false,
                                                onChange: (
                                                    _obj: any,
                                                    _checked: boolean,
                                                    tree: object[],
                                                ) => {
                                                    onClusterChange(tree);
                                                },
                                                options: clusterDD.map(item => ({
                                                    label: item.label,
                                                    value: String(item.value),
                                                })),
                                                placeholder: 'Select Cluster',
                                                required: false,
                                                reset: false,
                                                showSelectAll: true,
                                                selectAllOption: { label: 'ALL', value: 'all' },
                                                selectedOptions: applicationCluster,
                                                size: 'L',
                                                type: 'checkbox',
                                            }}
                                            dropdownOptionsClassName="dropdown-options-custom"
                                            id="cluster-drop-down"
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    }
                                </Flex>
                                <Flex gap={4} align="center" className={styles['field-row']}>
                                    <Icon
                                        name="flag-03"
                                        size="xm"
                                        color="primary-green-500-color"
                                    />
                                    <span className={styles['geo-field-name']}>Market:</span>
                                    {
                                        <DropDown
                                            className="drop-down"
                                            dataTestId="market-dropdown"
                                            dropdown={{
                                                isDisabled: !isMarketEnabled,
                                                isLabelInline: false,
                                                onChange: (
                                                    _obj: any,
                                                    _checked: boolean,
                                                    tree: object[],
                                                ) => {
                                                    onMarketChange(tree);
                                                },
                                                options: marketDD.map(item => ({
                                                    label: item.label,
                                                    value: String(item.value),
                                                })),
                                                placeholder: 'Select Market',
                                                required: false,
                                                reset: false,
                                                showSelectAll: true,
                                                selectAllOption: { label: 'ALL', value: 'all' },
                                                selectedOptions: applicationMarket,
                                                size: 'L',
                                                type: 'checkbox',
                                            }}
                                            dropdownOptionsClassName="dropdown-options-custom"
                                            id="market-drop-down"
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    }
                                </Flex>
                                <Flex gap={4} align="center" className={styles['field-row']}>
                                    <Icon
                                        name="building-05"
                                        size="xm"
                                        color="primary-green-500-color"
                                    />
                                    <span className={styles['geo-field-name']}>Sites:</span>
                                    {
                                        <DropDown
                                            className="drop-down"
                                            dataTestId="site-dropdown"
                                            dropdown={{
                                                isDisabled: !isSiteEnabled,
                                                isLabelInline: false,
                                                onChange: (
                                                    _obj: any,
                                                    _checked: boolean,
                                                    tree: object[],
                                                ) => {
                                                    onSiteChange(tree);
                                                },
                                                options: siteDD.map(item => ({
                                                    label: item.label,
                                                    value: String(item.value),
                                                })),
                                                placeholder: 'Select Site',
                                                required: false,
                                                reset: false,
                                                showSelectAll: true,
                                                selectAllOption: { label: 'ALL', value: 'all' },
                                                selectedOptions: applicationSite,
                                                size: 'L',
                                                type: 'checkbox',
                                            }}
                                            dropdownOptionsClassName="dropdown-options-custom"
                                            id="site-drop-down"
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    }
                                </Flex>
                            </Flex>
                        </Flex>
                    </Flex>
                </Flex>
            </div>
        );
    };

    return <div>{RenderGeneralInformation()}</div>;
}
export default GeneralInformation;
