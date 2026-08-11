import { Flex, Skeleton } from 'antd';
import { Icon, Tab, InputField, Button, DropDown, Toast, Dialog } from 'konnect-react-components';
import { useCallback, useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    AppDispatch,
    RootState,
    fetchGeographicalRegion,
    fetchTeam,
    fetchOwnerName,
    fetchApplicationDetailsById,
    fetchFunctions,
    fetchSubfunctionsOnMultipleFunctionIds,
    fetchAdGroupForApplication,
    fetchGeographicalSitesOnMultipleMarketIds,
    fetchGeographicalClustersOnMultipleRegionsIds,
    fetchGeographicalMarketsOnMultipleClusterIds,
} from '../../../store';
import { BackArrowIcon } from '../../../assets/icons/icons';
import { Label } from '../../../components/atoms';
import AccessAndPermissions from './AccessAndPermissions';
import styles from './EditToolScreen.module.scss';
import { convertOptions, formatRefreshText, logError } from '../../../utils/helpers';
import { validateUrl } from '../../../utils/validation';
import ToolCombination from './ToolCombination';
import { updateGeneralInformation } from '../../../services/application';
import TextWithSkeleton from '../../../components/atoms/text-with-skeleton/TextWithSkeleton';

enum TabNamesEnum {
    GeneralInformation = 'General Information',
    ToolCombination = 'Tool Combination',
    AccessPermissions = 'Access & Permissions',
}

function EditApplicationScreen() {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { toolDetails, isLoading } = useSelector(
        (state: RootState) => state.applicationManagement,
    );
    const { toolDetail, geography, functions, subFunctions } = toolDetails;

    const [selectedTab, setSelectedTab] = useState<string>(TabNamesEnum.GeneralInformation);
    const applicationParams = useParams<{ appId: string; appName: string }>();
    const [activeDialog, setActiveDialog] = useState<
        'save' | 'discard' | 'unsaved-tab' | 'back-navigation' | null
    >(null);
    const [pendingTab, setPendingTab] = useState<string | null>(null);
    const [applicationOwnerName, setApplicationOwnerName] = useState<
        Record<string, string | number>
    >({});
    const applicationTeamList = useSelector((state: RootState) => state.teamAndOwnerName);
    const geographicalInformation = useSelector(
        (state: RootState) => state.fetchGeographicalInformation,
    );
    const functionalInformation = useSelector(
        (state: RootState) => state.fetchFunctionSubfunctionInformation,
    );
    const [roleFunction, setRoleFunction] = useState<
        { label: string; value: number; allLabel?: string }[]
    >([]);
    const [roleSubFunction, setRoleSubFunction] = useState<
        { label: string; value: number; allLabel?: string }[]
    >([]);

    const allFunctions = functionalInformation.data.functions;
    const multipleSubfunctions = functionalInformation.data.subfunctions;
    const geographicalRegion = geographicalInformation.data.regions;
    const geographicalCluster = geographicalInformation.data.clusters;
    const geographicalMarkets = geographicalInformation.data.markets;
    const geographicalSites = geographicalInformation.data.sites;
    const [toastConfig, setToastConfig] = useState<{
        visible: boolean;
        message: string;
        type: 'Delete' | 'Error' | 'Success';
    }>({ visible: false, message: '', type: 'Delete' });

    //Geographical Info States
    const [applicationRegion, setApplicationRegion] = useState<
        { label: string; value: number; allLabel?: string }[]
    >([]);
    const [applicationCluster, setApplicationCluster] = useState<
        { label: string; value: number; allLabel?: string }[]
    >([]);
    const [applicationMarket, setApplicationMarket] = useState<
        { label: string; value: number; allLabel?: string }[]
    >([]);
    const [applicationSite, setApplicationSite] = useState<
        { label: string; value: number; allLabel?: string }[]
    >([]);
    const [showSavingLoader, setShowSavingLoader] = useState<boolean>(false);
    type ModificationStatus = {
        region: boolean;
        cluster: boolean;
        market: boolean;
        site: boolean;
        function: boolean;
        subfunction: boolean;
        thumbnailURL: boolean;
        documentationURL: boolean;
        initialState: boolean;
        hasBasicInfoChanged: boolean;
    };

    const [modificationStatus, setModificationStatus] = useState<ModificationStatus>({
        region: false,
        cluster: false,
        market: false,
        site: false,
        function: false,
        subfunction: false,
        thumbnailURL: false,
        documentationURL: false,
        initialState: true,
        hasBasicInfoChanged: false,
    });

    //Dropdown values
    const [functionDD, setFunctionDD] = useState<{ label: string; value: number }[]>([]);
    const [subfunctionDD, setSubfunctionDD] = useState<{ label: string; value: number }[]>([]);
    const [regionDD, setRegionDD] = useState<{ label: string; value: number }[]>([]);
    const [clusterDD, setClusterDD] = useState<{ label: string; value: number }[]>([]);
    const [marketDD, setMarketDD] = useState<{ label: string; value: number }[]>([]);
    const [siteDD, setSiteDD] = useState<{ label: string; value: number }[]>([]);
    const [toolType, setToolType] = useState('');
    const [titleType, setTitleType] = useState('');
    const [resetAccessSection, setResetAccessSection] = useState(0);

    const stripExtraProps = (items: { label: string; value: number; allLabel?: string }[]) =>
        items.map(({ label, value }) => ({ label, value: String(value) }));

    interface BasicInformation {
        appName: string | null;
        appVersion: string | null;
        appId: string | null;
        appIdAlias: string | null;
        functions: string | null;
        subFunctions: string | null;
        owner: string | null;
        team: string | null;
        teamId: string | null;
        adGroups: string | null;
        description: string | undefined;
        isActive: boolean | null;
    }

    interface GeographicalInformation {
        region: string | null;
        cluster: string | null;
        market: string | null;
        site: string | null;
    }

    interface URLInformation {
        toolURL: string | null;
        documentationURL: string | null;
        thumbnailURL: string | null;
    }

    const [newBasicData, setNewBasicData] = useState<BasicInformation>({
        appName: '',
        appVersion: '',
        appId: '',
        appIdAlias: '',
        functions: '',
        subFunctions: '',
        owner: '',
        team: '',
        teamId: '',
        adGroups: '',
        description: '',
        isActive: null,
    });
    const [newGeoData, setNewGeoData] = useState<GeographicalInformation>({
        region: '',
        cluster: '',
        market: '',
        site: '',
    });
    const [newURLData, setNewURLData] = useState<URLInformation>({
        toolURL: '',
        documentationURL: '',
        thumbnailURL: '',
    });
    const [accessData, setAccessData] = useState<{
        hasChanges?: boolean;
        saveHandler?: () => Promise<void>;
    }>({});
    const [toolCombinationData, setToolCombinationData] = useState<{
        hasChanges?: boolean;
        isSaving?: boolean;
        saveHandler?: () => Promise<void>;
        discardHandler?: () => void;
    }>({});

    const [urlErrorState, setUrlErrorState] = useState({
        documentationURLError: false,
        thumbnailURLError: false,
    });
    const hasToolCombinationChanges = !!toolCombinationData?.hasChanges;

    const handleAccessDataChange = (data: any) => {
        setAccessData(data);
    };

    const handleToolCombinationChange = useCallback((data: any) => {
        setToolCombinationData({
            hasChanges: data?.isDirty,
            isSaving: data?.isSaving,
            saveHandler: data?.saveHandler,
            discardHandler: data?.discardHandler,
        });
    }, []);

    const handleBackClick = (e: any) => {
        const hasAnyChange =
            accessData?.hasChanges ||
            hasToolCombinationChanges ||
            modificationStatus.hasBasicInfoChanged ||
            modificationStatus.region ||
            modificationStatus.cluster ||
            modificationStatus.market ||
            modificationStatus.site ||
            modificationStatus.documentationURL ||
            modificationStatus.thumbnailURL;
        if (hasAnyChange) {
            e.preventDefault();
            setActiveDialog('back-navigation');
        }
    };

    const onSaveClose = useCallback(() => {
        navigate('/admin-hub/tool-management');
        window.location.reload(); //TempFix
        return true;
    }, []);

    const resetAllChanges = useCallback(() => {
        setModificationStatus({
            region: false,
            cluster: false,
            market: false,
            site: false,
            function: false,
            subfunction: false,
            thumbnailURL: false,
            documentationURL: false,
            initialState: false,
            hasBasicInfoChanged: false,
        });
        setRoleFunction(
            functions?.map(func => ({
                label: func.functionName,
                value: func.functionId,
                allLabel: func.showAll,
            })) ?? [],
        );
        setRoleSubFunction(
            subFunctions?.map(func => ({
                label: func.subFunctionName,
                value: func.subFunctionId,
                allLabel: func.showAll,
            })) ?? [],
        );
        const appOwnerName = getApplicationOwnerNameByEmail(toolDetail?.toolOwner);
        setApplicationOwnerName({
            label: appOwnerName?.fullName ?? '',
            value: appOwnerName?.userId ?? 0,
        });

        setNewBasicData({
            appName: toolDetail?.tool ?? null,
            appVersion: toolDetail?.version ?? null,
            appId: String(toolDetail?.toolId),
            appIdAlias: String(toolDetail?.toolIdAlias),
            functions: functions?.map(x => x.functionId).join(',') ?? null,
            subFunctions: subFunctions?.map(x => x.subFunctionId).join(',') ?? null,
            owner: toolDetail?.toolOwner ?? null,
            team: toolDetail?.team ?? null,
            adGroups: toolDetail?.adGroup ?? null,
            description: toolDetail?.description ?? null,
            isActive: getIsActiveFromStatus(toolDetail?.status),

            teamId: getTeamIdByName(toolDetail?.team) ?? null,
        });
        setApplicationRegion(
            geography?.region?.map(geo => ({
                label: geo.geographyName,
                value: geo.geographyId,
                allLabel: geo.showAll,
            })) ?? [],
        );
        setApplicationCluster(
            geography?.cluster?.map(geo => ({
                label: geo.geographyName,
                value: geo.geographyId,
                allLabel: geo.showAll,
            })) ?? [],
        );
        setApplicationMarket(
            geography?.market?.map(geo => ({
                label: geo.geographyName,
                value: geo.geographyId,
                allLabel: geo.showAll,
            })) ?? [],
        );
        setApplicationSite(
            geography?.site?.map(geo => ({
                label: geo.geographyName,
                value: geo.geographyId,
                allLabel: geo.showAll,
            })) ?? [],
        );
        setNewGeoData({
            region: geography?.region?.map(item => item.geographyId).join(',') ?? '',
            cluster: geography?.cluster?.map(item => item.geographyId).join(',') ?? '',
            market: geography?.market?.map(item => item.geographyId).join(',') ?? '',
            site: geography?.site?.map(item => item.geographyId).join(',') ?? '',
        });
        setNewURLData({
            toolURL: toolDetail?.toolURL ?? null,
            thumbnailURL: toolDetail?.toolThumbnailURL ?? null,
            documentationURL: toolDetail?.toolDocumentationURL ?? null,
        });
        setUrlErrorState({ documentationURLError: false, thumbnailURLError: false });
    }, [toolDetail, geography, functions, subFunctions]);
    const handleGlobalSaveClick = useCallback((event?: any) => {
        event?.stopPropagation?.();
        setActiveDialog('save');
    }, []);

    const handleGlobalDiscardClick = useCallback((event?: any) => {
        event?.stopPropagation?.();
        setActiveDialog('discard');
    }, []);

    const setInitialData = useCallback(() => {
        setNewBasicData({
            appName: toolDetail?.tool ?? '',
            appVersion: toolDetail?.version ?? '',
            appId: String(toolDetail?.toolId),
            appIdAlias: String(toolDetail?.toolIdAlias),
            functions: functions?.map(x => x.functionId).join(',') ?? '',
            subFunctions: subFunctions?.map(x => x.subFunctionId).join(',') ?? '',
            owner: toolDetail?.toolOwner ?? '',
            team: toolDetail?.team ?? '',
            adGroups: toolDetail?.adGroup ?? '',
            description: toolDetail?.description ?? '',
            isActive: getIsActiveFromStatus(toolDetail?.status),
            teamId: getTeamIdByName(toolDetail?.team) ?? null,
        });

        setNewGeoData({
            region: geography?.region?.map(item => item.geographyId).join(',') ?? '',
            cluster: geography?.cluster?.map(item => item.geographyId).join(',') ?? '',
            market: geography?.market?.map(item => item.geographyId).join(',') ?? '',
            site: geography?.site?.map(item => item.geographyId).join(',') ?? '',
        });

        setNewURLData({
            toolURL: toolDetail?.toolURL ?? '',
            documentationURL: toolDetail?.toolDocumentationURL ?? '',
            thumbnailURL: toolDetail?.toolThumbnailURL ?? '',
        });
    }, [toolDetail, geography, functions, subFunctions]);

    const handleDescriptionChange = (e: any) => {
        const newDescription = e.target.value;
        setModificationStatus(prevStatus => ({
            ...prevStatus,
            hasBasicInfoChanged: true,
        }));
        setNewBasicData(prevData => ({
            ...prevData,
            description: newDescription,
        }));
    };
    const handleOwnerChange = (option: any) => {
        setApplicationOwnerName(option);
        setNewBasicData(prevData => ({
            ...prevData,
            owner: getAppOwnerEmail(option.value),
        }));
    };

    const getApplicationOwnerName = useCallback(() => {
        if (!applicationTeamList.ownerName.length) {
            return [];
        }
        const ownerNames = applicationTeamList.ownerName.map((item: any) => ({
            ...item,
            fullName: `${item.firstName} ${item.lastName}`,
        }));
        const convertedData = convertOptions(ownerNames, 'fullName', 'userId');
        return convertedData;
    }, [applicationTeamList]);
    const getTeamIdByName = (teamName: string) => {
        const team = (applicationTeamList.team as any[]).find(t => t.teamName === teamName);
        return team?.teamId || null;
    };
    const getGeoFieldAccess = (levelId: number) => {
        return {
            region: levelId >= 1,
            cluster: levelId >= 2 && levelId != 5,
            market: levelId >= 3 && levelId != 5,
            site: levelId >= 4 && levelId != 5,
        };
    };

    const geoAccess = getGeoFieldAccess(Number(toolDetail?.geographyLevelId) || 0);
    const getIsActiveFromStatus = (status?: string | null): boolean => {
        return status?.trim().toLowerCase() === 'active';
    };
    const isAllSelected = (
        selected: { label: string; value: number | string }[],
        allOptions: { label: string; value: number | string }[],
    ) => {
        if (!selected || selected.length === 0) return false;

        // Case 1: explicit ALL option selected
        if (selected.some(item => item.value === 'all')) return true;

        // Case 2: all individual items selected
        return selected.length === allOptions.length;
    };

    const getApplicationOwnerNameByEmail = useCallback(
        (
            providedEmail: string,
        ):
            | {
                  userId: number;
                  firstName: string;
                  lastName: string;
                  userEmail: string;
                  userName: string;
                  fullName: string;
              }
            | undefined => {
            const defaultOwner = {
                userId: 0,
                firstName: '',
                lastName: '',
                userEmail: '',
                userName: '',
                fullName: '',
            };
            if (!applicationTeamList.ownerName || applicationTeamList.ownerName.length === 0) {
                return defaultOwner;
            }
            const ownerDetails = applicationTeamList.ownerName.find(
                (item: {
                    userId: number;
                    firstName: string;
                    lastName: string;
                    userEmail: string;
                    userName: string;
                }) => item.userEmail?.toLowerCase() === providedEmail?.toLowerCase(),
            ) as
                | {
                      userId: number;
                      firstName: string;
                      lastName: string;
                      userEmail: string;
                      userName: string;
                  }
                | undefined;
            if (!ownerDetails) {
                return defaultOwner;
            }
            return {
                ...ownerDetails,
                fullName: `${ownerDetails.firstName} ${ownerDetails.lastName}`,
            };
        },
        [applicationTeamList],
    );
    const getAppOwnerEmail = (id: number) => {
        const owner = (applicationTeamList.ownerName as any[]).find(o => o.userId == id);
        return owner?.userEmail;
    };

    const getApplicationTeam = useCallback(() => {
        if (!applicationTeamList.team.length) {
            return [];
        }
        const convertedData = convertOptions(applicationTeamList.team as any, 'teamName', 'teamId');
        return convertedData;
    }, [applicationTeamList]);

    function RenderTabContent() {
        switch (selectedTab) {
            case TabNamesEnum.GeneralInformation:
                return RenderGeneralInformation();
            case TabNamesEnum.ToolCombination:
                if (toolType?.toLowerCase() !== 'performance management') return null;
                return (
                    <ToolCombination
                        toolId={toolDetail?.toolId}
                        onToolCombinationChange={handleToolCombinationChange}
                    />
                );

            case TabNamesEnum.AccessPermissions:
                return (
                    <AccessAndPermissions
                        onAccessDataChange={handleAccessDataChange}
                        toolType={toolType}
                        title={titleType}
                        resetTrigger={resetAccessSection}
                    />
                );

            default:
                return selectedTab;
        }
    }
    const handleEditApplicationChanges = useCallback(async () => {
        // Validate URL fields before saving
        const trimmedDoc = (newURLData.documentationURL ?? '').trim();
        const trimmedThumb = (newURLData.thumbnailURL ?? '').trim();
        if (
            (trimmedDoc && !validateUrl(trimmedDoc)) ||
            (trimmedThumb && !validateUrl(trimmedThumb))
        ) {
            setToastConfig({
                visible: true,
                message: 'Please enter valid URLs for Documentation or Thumbnail.',
                type: 'Error',
            });
            setActiveDialog(null);
            return;
        }
        try {
            const editPayload = {
                toolIds: newBasicData.appId ?? null,
                owner: newBasicData.owner ?? null,
                region: newGeoData.region ?? null,
                cluster: newGeoData.cluster ?? null,
                market: newGeoData.market ?? null,
                site: newGeoData.site ?? null,
                functionId: newBasicData.functions ?? null,
                subFunctionId: newBasicData.subFunctions ?? null,
                isFunctionAll: isAllSelected(roleFunction, functionDD),
                isSubFunctionAll: isAllSelected(roleSubFunction, subfunctionDD),
                isRegionAll: isAllSelected(applicationRegion, regionDD),
                isClusterAll: isAllSelected(applicationCluster, clusterDD),
                isMarketAll: isAllSelected(applicationMarket, marketDD),
                isSiteAll: isAllSelected(applicationSite, siteDD),
                ownerEmail: newBasicData.owner ?? null,
                ownerWWID: null,
                toolUrl: toolDetail?.toolURL ?? null,
                documentationURL: trimmedDoc ?? null,
                thumbnailURL: trimmedThumb ?? null,
                teamId: Number(newBasicData.teamId),
                geographyLevelId: Number(toolDetail?.geographyLevelId) || null,
                description: newBasicData.description ?? '',
                status: Boolean(newBasicData.isActive),
            };
            setShowSavingLoader(true);
            await updateGeneralInformation(editPayload);

            setToastConfig({
                visible: true,
                message: `${toolType} "${newBasicData.appName}" updated successfully`,
                type: 'Success',
            });
            dispatch(fetchApplicationDetailsById({ appId: Number(applicationParams.appId) }));
            setModificationStatus({
                region: false,
                cluster: false,
                market: false,
                site: false,
                function: false,
                subfunction: false,
                thumbnailURL: false,
                documentationURL: false,
                initialState: false,
                hasBasicInfoChanged: false,
            });
            setShowSavingLoader(false);
            setActiveDialog(null);
        } catch (error) {
            setToastConfig({
                visible: true,
                message: `Failed to update the application details. Please try again`,
                type: 'Error',
            });
            logError(error);
            setShowSavingLoader(false);
            setActiveDialog(null);
        }
    }, [newGeoData, newBasicData, newURLData]);

    const onUserSelectTab = useCallback(
        ({ label }: { label: string }) => {
            const hasAnyChange =
                accessData?.hasChanges ||
                hasToolCombinationChanges ||
                modificationStatus.hasBasicInfoChanged ||
                modificationStatus.region ||
                modificationStatus.cluster ||
                modificationStatus.market ||
                modificationStatus.site ||
                modificationStatus.documentationURL ||
                modificationStatus.thumbnailURL;

            const resolveTab = (l: string) => {
                if (l === 'General Information') return TabNamesEnum.GeneralInformation;
                if (l === 'Tool Combination') return TabNamesEnum.ToolCombination;
                if (l === 'Access & Permissions') return TabNamesEnum.AccessPermissions;

                return null;
            };

            if (hasAnyChange) {
                const tab = resolveTab(label);
                if (tab) {
                    setPendingTab(tab);
                    setActiveDialog('unsaved-tab');
                }
                return;
            }

            const tab = resolveTab(label);
            if (tab) setSelectedTab(tab);
        },
        [accessData, hasToolCombinationChanges, modificationStatus],
    );
    useEffect(() => {
        if (!geoAccess.cluster) {
            setApplicationCluster([]);
            setNewGeoData(prev => ({ ...prev, cluster: '' }));
        }

        if (!geoAccess.market) {
            setApplicationMarket([]);
            setNewGeoData(prev => ({ ...prev, market: '' }));
        }

        if (!geoAccess.site) {
            setApplicationSite([]);
            setNewGeoData(prev => ({ ...prev, site: '' }));
        }
    }, [toolDetail?.geographyLevelId]);

    useEffect(() => {
        if (applicationTeamList.team?.length && toolDetail?.team && !newBasicData.teamId) {
            const matchedTeam = (applicationTeamList.team as any[]).find(
                t => t.teamName === toolDetail.team,
            );

            if (matchedTeam) {
                setNewBasicData(prev => ({
                    ...prev,
                    teamId: matchedTeam.teamId,
                }));
            }
        }
    }, [applicationTeamList.team, toolDetail]);

    useEffect(() => {
        if (!applicationParams.appId) {
            return;
        }
        dispatch(fetchApplicationDetailsById({ appId: Number(applicationParams.appId) }));
        dispatch(fetchFunctions());
        dispatch(fetchOwnerName());
        dispatch(fetchTeam());
        dispatch(fetchGeographicalRegion());
        setInitialData();
    }, []);

    useEffect(() => {
        setToolType(toolDetail?.toolType);
    }, [toolDetail]);

    useEffect(() => {
        if (toolType?.toLowerCase() === 'application') {
            setTitleType('App');
        } else if (
            toolType?.toLowerCase() === 'report' ||
            toolType?.toLowerCase() === 'performance management'
        ) {
            setTitleType('Report');
        } else {
            setTitleType('Analytics');
        }
    }, [toolType]);

    useEffect(() => {
        setRegionDD(
            geographicalRegion?.map(region => ({
                label: region.regionName,
                value: region.regionId,
            })),
        );
    }, [geographicalRegion]);

    useEffect(() => {
        if (applicationRegion.length > 0) {
            const regionIds = applicationRegion?.map(region => region.value) ?? [];
            dispatch(fetchGeographicalClustersOnMultipleRegionsIds({ regionIds }))
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
            const clusterIds = applicationCluster?.map(cluster => cluster.value) ?? [];
            dispatch(fetchGeographicalMarketsOnMultipleClusterIds({ clusterIds }))
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
            const marketIds = applicationMarket?.map(market => market.value) ?? [];
            dispatch(fetchGeographicalSitesOnMultipleMarketIds({ marketIds }))
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
        setFunctionDD(
            allFunctions.map((func: { functionName: string | null; functionId: number }) => ({
                label: func.functionName ?? '',
                value: func.functionId,
            })),
        );
    }, [allFunctions]);
    useEffect(() => {
        const appOwnerName = getApplicationOwnerNameByEmail(toolDetail?.toolOwner);
        setApplicationOwnerName({
            label: appOwnerName?.fullName ?? '',
            value: appOwnerName?.userId ?? 0,
        });
    }, [toolDetail, applicationTeamList]);
    useEffect(() => {
        dispatch(fetchAdGroupForApplication({ toolId: toolDetail?.toolId }));
        setInitialData();
        setRoleFunction(
            functions?.map(func => ({
                label: func.functionName,
                value: func.functionId,
                allLabel: func.showAll,
            })),
        );
        setRoleSubFunction(
            subFunctions?.map(func => ({
                label: func.subFunctionName,
                value: func.subFunctionId,
                allLabel: func.showAll,
            })),
        );
        setApplicationRegion(
            geography?.region?.map(geo => ({
                label: geo.geographyName,
                value: geo.geographyId,
                allLabel: geo.showAll,
            })) ?? [],
        );
        setApplicationCluster(
            geography?.cluster?.map(geo => ({
                label: geo.geographyName,
                value: geo.geographyId,
                allLabel: geo.showAll,
            })) ?? [],
        );
        setApplicationMarket(
            geography?.market?.map(geo => ({
                label: geo.geographyName,
                value: geo.geographyId,
                allLabel: geo.showAll,
            })) ?? [],
        );
        setApplicationSite(
            geography?.site?.map(geo => ({
                label: geo.geographyName,
                value: geo.geographyId,
                allLabel: geo.showAll,
            })) ?? [],
        );
    }, [toolDetail, geography]);
    useEffect(() => {
        if (roleFunction?.length > 0) {
            const functionIds = roleFunction?.map(func => func.value) ?? [];
            dispatch(fetchSubfunctionsOnMultipleFunctionIds({ functionIds }))
                .unwrap()
                .then(() => {})
                .catch(error => {
                    logError('Failed to fetch subfunctions:', error);
                });
        }
    }, [roleFunction, modificationStatus.function]);

    useEffect(() => {
        const functionIds = roleFunction?.map(func => Number(func.value));
        const updatedSubfunctions = multipleSubfunctions
            .filter(sub => functionIds?.includes(sub.functionId))
            .map(sub => ({
                label: sub.subFunctionName ?? '',
                value: sub.subFunctionId,
            }));

        if (updatedSubfunctions?.length > 0) {
            setSubfunctionDD(updatedSubfunctions);

            // Only filter roleSubFunction if it's already initialized
            if (roleSubFunction?.length > 0) {
                setRoleSubFunction(prev =>
                    prev?.filter(sel =>
                        updatedSubfunctions.some(sub => Number(sub.value) === Number(sel.value)),
                    ),
                );
            }
        } else {
            const subfunctions = multipleSubfunctions.map(sub => ({
                label: sub.subFunctionName ?? '',
                value: sub.subFunctionId,
            }));
            setSubfunctionDD(subfunctions);
        }
    }, [roleFunction, multipleSubfunctions]);

    useEffect(() => {
        setNewBasicData(prevData => ({
            ...prevData,
            subFunctions: roleSubFunction?.map(x => x.value).join(','),
        }));
    }, [roleSubFunction]);

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
                                <span className={styles['basic-field-name']}>
                                    {titleType} Name:
                                </span>
                                {isLoading ? (
                                    <Skeleton.Node
                                        active
                                        style={{ width: '200px', height: '1rem' }}
                                    />
                                ) : (
                                    <Flex className={styles['input-container']}>
                                        <InputField
                                            className="input-field"
                                            placeholder={toolDetail?.tool}
                                            value={toolDetail?.tool}
                                            onChange={() => {}}
                                            isDisabled={true}
                                        />
                                    </Flex>
                                )}
                            </Flex>
                            <Flex gap={4} align="center" className={styles['field-row']}>
                                <Icon name="hash-02" size="xm" color="primary-green-500-color" />
                                <span className={styles['basic-field-name']}>
                                    {titleType} Version:
                                </span>
                                {isLoading ? (
                                    <Skeleton.Node
                                        active
                                        style={{ width: '200px', height: '1rem' }}
                                    />
                                ) : (
                                    <Flex className={styles['input-container']}>
                                        <InputField
                                            className="input-field"
                                            placeholder={toolDetail?.version}
                                            value={toolDetail?.version}
                                            onChange={() => {}}
                                            isDisabled={true}
                                        />
                                    </Flex>
                                )}
                            </Flex>
                            <Flex gap={4} align="center" className={styles['field-row']}>
                                <Icon
                                    name="file-code-01"
                                    size="xm"
                                    color="primary-green-500-color"
                                />
                                <span className={styles['basic-field-name']}>{titleType} ID:</span>
                                {isLoading ? (
                                    <Skeleton.Node
                                        active
                                        style={{ width: '200px', height: '1rem' }}
                                    />
                                ) : (
                                    <Flex className={styles['input-container']}>
                                        <InputField
                                            className="input-field"
                                            placeholder={String(toolDetail?.toolIdAlias)}
                                            value={String(toolDetail?.toolIdAlias)}
                                            onChange={() => {}}
                                            isDisabled={true}
                                        />
                                    </Flex>
                                )}
                            </Flex>
                            <Flex
                                gap={4}
                                align="center"
                                className={`${styles['function-field']} ${styles['field-row']}`}
                            >
                                <Icon name="sliders-01" size="xm" color="primary-green-500-color" />
                                <span className={styles['basic-field-name']}>Function:</span>
                                {isLoading ? (
                                    <Skeleton.Node
                                        active
                                        style={{ width: '200px', height: '1rem' }}
                                    />
                                ) : (
                                    <Flex className={styles['input-container']}>
                                        <DropDown
                                            className={`drop-down ${styles['full-width-dropdown']}`}
                                            dataTestId="function-dropdown"
                                            dropdown={{
                                                isDisabled: false,
                                                isLabelInline: false,
                                                onChange: (
                                                    _option: any,
                                                    _checked: boolean,
                                                    tree: object[],
                                                ) => {
                                                    const selectedTree = tree as {
                                                        label: string;
                                                        value: number;
                                                    }[];
                                                    setModificationStatus(prev => ({
                                                        ...prev,
                                                        function: true,
                                                        hasBasicInfoChanged: true,
                                                    }));
                                                    setRoleFunction(selectedTree);
                                                    setNewBasicData(prev => ({
                                                        ...prev,
                                                        functions: selectedTree
                                                            ?.map(x => x.value)
                                                            .join(','),
                                                    }));
                                                },
                                                options: functionDD.map(item => ({
                                                    label: item.label,
                                                    value: String(item.value),
                                                })),
                                                placeholder: 'Select Function',
                                                required: false,
                                                reset: false,
                                                showSelectAll: true,
                                                selectAllOption: { label: 'ALL', value: 'all' },
                                                selectedOptions:
                                                    roleFunction?.length > 0
                                                        ? stripExtraProps(roleFunction)
                                                        : [],
                                                size: 'L',
                                                type: 'checkbox',
                                            }}
                                            dropdownOptionsClassName="dropdown-options-custom"
                                            id="function-drop-down"
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    </Flex>
                                )}
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
                                {isLoading ? (
                                    <Skeleton.Node
                                        active
                                        style={{ width: '200px', height: '1rem' }}
                                    />
                                ) : (
                                    <Flex className={styles['input-container']}>
                                        <DropDown
                                            className={`drop-down ${styles['full-width-dropdown']}`}
                                            dataTestId="subfunction-dropdown"
                                            dropdown={{
                                                isDisabled: false,
                                                isLabelInline: false,
                                                onChange: (
                                                    _option: any,
                                                    _checked: boolean,
                                                    tree: object[],
                                                ) => {
                                                    const selectedTree = tree as {
                                                        label: string;
                                                        value: number;
                                                    }[];
                                                    setModificationStatus(prev => ({
                                                        ...prev,
                                                        subfunction: true,
                                                        hasBasicInfoChanged: true,
                                                    }));
                                                    setRoleSubFunction(selectedTree);
                                                },
                                                options: subfunctionDD.map(item => ({
                                                    label: item.label,
                                                    value: String(item.value),
                                                })),
                                                placeholder: 'Select Sub-Function',
                                                required: false,
                                                reset: false,
                                                showSelectAll: true,
                                                selectAllOption: { label: 'ALL', value: 'all' },
                                                selectedOptions:
                                                    roleSubFunction?.length > 0
                                                        ? stripExtraProps(roleSubFunction)
                                                        : [],
                                                size: 'L',
                                                type: 'checkbox',
                                            }}
                                            dropdownOptionsClassName={
                                                styles['dropdown-options-custom']
                                            }
                                            id="subfunction-drop-down"
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    </Flex>
                                )}
                            </Flex>
                            <Flex gap={4} align="center" className={styles['field-row']}>
                                <Icon name="archieve" size="xm" color="primary-green-500-color" />
                                <span className={styles['basic-field-name']}>Team:</span>
                                {isLoading ? (
                                    <Skeleton.Node
                                        active
                                        style={{ width: '200px', height: '1rem' }}
                                    />
                                ) : (
                                    <Flex className={styles['input-container']}>
                                        <DropDown
                                            className={`drop-down ${styles['full-width-dropdown']}`}
                                            id="Team-dropdown"
                                            dropdown={{
                                                options: getApplicationTeam(),
                                                reset: false,
                                                placeholder: 'Select Team',
                                                onChange: (option: any) => {
                                                    setModificationStatus(prev => ({
                                                        ...prev,
                                                        hasBasicInfoChanged: true,
                                                    }));
                                                    setNewBasicData(prev => ({
                                                        ...prev,
                                                        team: option.label,
                                                        teamId: option.value,
                                                    }));
                                                },
                                                selectedOptions: newBasicData.team
                                                    ? (() => {
                                                          const matchedTeam =
                                                              getApplicationTeam().find(
                                                                  (t: any) =>
                                                                      t.label === newBasicData.team,
                                                              );
                                                          return matchedTeam
                                                              ? [
                                                                    {
                                                                        label: matchedTeam.label,
                                                                        value: matchedTeam.value,
                                                                    },
                                                                ]
                                                              : [];
                                                      })()
                                                    : [],
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
                                )}
                            </Flex>
                            <Flex
                                gap={4}
                                align="center"
                                className={`${styles['owner-field']} ${styles['field-row']}`}
                            >
                                <Icon name="users-01" size="xm" color="primary-green-500-color" />
                                <span className={styles['basic-field-name']}>Tool Owner:</span>
                                {isLoading ? (
                                    <Skeleton.Node
                                        active
                                        style={{ width: '200px', height: '1rem' }}
                                    />
                                ) : (
                                    <Flex className={styles['input-container-owner']}>
                                        <DropDown
                                            className={`drop-down ${styles['full-width-dropdown']}`}
                                            id="OwnerName-dropdown"
                                            dropdown={{
                                                options: getApplicationOwnerName(),
                                                reset: false,
                                                placeholder: 'Select Owner Name',
                                                onChange: (option: any) => {
                                                    setModificationStatus(prev => ({
                                                        ...prev,
                                                        hasBasicInfoChanged: true,
                                                    }));
                                                    handleOwnerChange(option);
                                                },
                                                selectedOptions:
                                                    applicationOwnerName?.value &&
                                                    applicationOwnerName?.label
                                                        ? [
                                                              {
                                                                  label: String(
                                                                      applicationOwnerName.label,
                                                                  ),
                                                                  value: String(
                                                                      applicationOwnerName.value,
                                                                  ),
                                                              },
                                                          ]
                                                        : [],
                                            }}
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                            dropdownOptionsClassName="dropdown-options-custom"
                                        />
                                    </Flex>
                                )}
                            </Flex>
                            <Flex gap={4} align="center" className={styles['field-row']}>
                                <Icon
                                    name="user-check-01"
                                    size="xm"
                                    color="primary-green-500-color"
                                />
                                <span className={styles['basic-field-name']}>Status:</span>
                                {isLoading ? (
                                    <Skeleton.Node
                                        active
                                        style={{ width: '200px', height: '1rem' }}
                                    />
                                ) : (
                                    <Flex className={styles['input-container']}>
                                        <DropDown
                                            className={`drop-down ${styles['full-width-dropdown']}`}
                                            id="status-dropdown"
                                            dropdown={{
                                                options: [
                                                    { label: 'Active', value: 'true' },
                                                    { label: 'Inactive', value: 'false' },
                                                ],
                                                reset: false,
                                                placeholder: 'Select status',
                                                onChange: (option: any) => {
                                                    setNewBasicData(prev => ({
                                                        ...prev,
                                                        isActive: option.value === 'true',
                                                    }));
                                                    setModificationStatus(prev => ({
                                                        ...prev,
                                                        hasBasicInfoChanged: true,
                                                    }));
                                                },
                                                selectedOptions:
                                                    newBasicData.isActive !== null
                                                        ? [
                                                              {
                                                                  label: newBasicData.isActive
                                                                      ? 'Active'
                                                                      : 'Inactive',
                                                                  value: newBasicData.isActive
                                                                      ? 'true'
                                                                      : 'false',
                                                              },
                                                          ]
                                                        : [],
                                            }}
                                            dropdownOptionsClassName={
                                                styles['dropdown-options-custom']
                                            }
                                        />
                                    </Flex>
                                )}
                            </Flex>

                            <Flex gap={4} align="center" className={styles['field-row']}>
                                <Icon name="file-05" size="xm" color="primary-green-500-color" />
                                <span className={styles['basic-field-name']}>Description:</span>
                                {isLoading ? (
                                    <Skeleton.Node
                                        active
                                        style={{ width: '200px', height: '1rem' }}
                                    />
                                ) : (
                                    <Flex className={styles['input-container']}>
                                        <InputField
                                            className="input-field"
                                            placeholder="Enter Description"
                                            value={newBasicData.description}
                                            onChange={handleDescriptionChange}
                                        />
                                    </Flex>
                                )}
                            </Flex>
                        </Flex>
                    </Flex>

                    <Flex gap={24} className={styles['right-section-container']}>
                        {toolType?.toLowerCase() !== 'performance management' ? (
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
                                        {isLoading ? (
                                            <Skeleton.Node
                                                active
                                                style={{ width: '200px', height: '1rem' }}
                                            />
                                        ) : (
                                            <DropDown
                                                className="drop-down"
                                                dataTestId="region-dropdown"
                                                dropdown={{
                                                    isDisabled: !geoAccess.region,
                                                    isLabelInline: false,
                                                    onChange: (
                                                        _obj: any,
                                                        _checked: boolean,
                                                        tree: object[],
                                                    ) => {
                                                        const selectedTree = tree as {
                                                            label: string;
                                                            value: number;
                                                        }[];
                                                        setApplicationRegion(selectedTree);
                                                        setModificationStatus(prev => ({
                                                            ...prev,
                                                            region: true,
                                                        }));
                                                        setNewGeoData(prev => ({
                                                            ...prev,
                                                            region:
                                                                selectedTree
                                                                    ?.map(x => x.value)
                                                                    .join(',') ?? '',
                                                        }));
                                                    },
                                                    options: regionDD.map(item => ({
                                                        label: item.label,
                                                        value: String(item.value),
                                                    })),
                                                    placeholder: 'Select Region',
                                                    required: false,
                                                    reset: false,
                                                    showSelectAll: false,
                                                    selectAllOption: { label: 'ALL', value: 'all' },
                                                    selectedOptions:
                                                        applicationRegion?.length > 0
                                                            ? stripExtraProps(applicationRegion)
                                                            : [],
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
                                        )}
                                    </Flex>
                                    <Flex gap={4} align="center" className={styles['field-row']}>
                                        <Icon
                                            name="bezier-curve-03"
                                            size="xm"
                                            color="primary-green-500-color"
                                        />
                                        <span className={styles['geo-field-name']}>Cluster:</span>
                                        {isLoading ? (
                                            <Skeleton.Node
                                                active
                                                style={{ width: '200px', height: '1rem' }}
                                            />
                                        ) : (
                                            <DropDown
                                                className="drop-down"
                                                dataTestId="cluster-dropdown"
                                                dropdown={{
                                                    isDisabled:
                                                        !geoAccess.cluster ||
                                                        applicationRegion.length === 0,

                                                    isLabelInline: false,
                                                    onChange: (
                                                        _obj: any,
                                                        _checked: boolean,
                                                        tree: object[],
                                                    ) => {
                                                        const selectedTree = tree as {
                                                            label: string;
                                                            value: number;
                                                        }[];
                                                        setModificationStatus(prev => ({
                                                            ...prev,
                                                            cluster: true,
                                                        }));
                                                        setApplicationCluster(selectedTree);
                                                        setNewGeoData(prev => ({
                                                            ...prev,
                                                            cluster:
                                                                selectedTree
                                                                    ?.map(x => x.value)
                                                                    .join(',') ?? '',
                                                        }));
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
                                                    selectedOptions:
                                                        geoAccess.cluster &&
                                                        applicationCluster?.length > 0
                                                            ? stripExtraProps(applicationCluster)
                                                            : [],
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
                                        )}
                                    </Flex>
                                    <Flex gap={4} align="center" className={styles['field-row']}>
                                        <Icon
                                            name="flag-03"
                                            size="xm"
                                            color="primary-green-500-color"
                                        />
                                        <span className={styles['geo-field-name']}>Market:</span>
                                        {isLoading ? (
                                            <Skeleton.Node
                                                active
                                                style={{ width: '200px', height: '1rem' }}
                                            />
                                        ) : (
                                            <DropDown
                                                className="drop-down"
                                                dataTestId="market-dropdown"
                                                dropdown={{
                                                    isDisabled:
                                                        !geoAccess.market ||
                                                        applicationCluster.length === 0,
                                                    isLabelInline: false,
                                                    onChange: (
                                                        _obj: any,
                                                        _checked: boolean,
                                                        tree: object[],
                                                    ) => {
                                                        const selectedTree = tree as {
                                                            label: string;
                                                            value: number;
                                                        }[];
                                                        setModificationStatus(prev => ({
                                                            ...prev,
                                                            market: true,
                                                        }));
                                                        setApplicationMarket(selectedTree);
                                                        setNewGeoData(prev => ({
                                                            ...prev,
                                                            market:
                                                                selectedTree
                                                                    ?.map(x => x.value)
                                                                    .join(',') ?? '',
                                                        }));
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
                                                    selectedOptions:
                                                        geoAccess.market &&
                                                        applicationMarket?.length > 0
                                                            ? stripExtraProps(applicationMarket)
                                                            : [],
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
                                        )}
                                    </Flex>
                                    <Flex gap={4} align="center" className={styles['field-row']}>
                                        <Icon
                                            name="building-05"
                                            size="xm"
                                            color="primary-green-500-color"
                                        />
                                        <span className={styles['geo-field-name']}>Sites:</span>
                                        {isLoading ? (
                                            <Skeleton.Node
                                                active
                                                style={{ width: '200px', height: '1rem' }}
                                            />
                                        ) : (
                                            <DropDown
                                                className="drop-down"
                                                dataTestId="site-dropdown"
                                                dropdown={{
                                                    isDisabled:
                                                        !geoAccess.site ||
                                                        applicationMarket.length === 0,
                                                    isLabelInline: false,
                                                    onChange: (
                                                        _obj: any,
                                                        _checked: boolean,
                                                        tree: object[],
                                                    ) => {
                                                        const selectedTree = tree as {
                                                            label: string;
                                                            value: number;
                                                        }[];
                                                        setModificationStatus(prev => ({
                                                            ...prev,
                                                            site: true,
                                                        }));
                                                        setApplicationSite(selectedTree);
                                                        setNewGeoData(prev => ({
                                                            ...prev,
                                                            site:
                                                                selectedTree
                                                                    ?.map(x => x.value)
                                                                    .join(',') ?? '',
                                                        }));
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
                                                    selectedOptions:
                                                        geoAccess.site &&
                                                        applicationSite?.length > 0
                                                            ? stripExtraProps(applicationSite)
                                                            : [],
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
                                        )}
                                    </Flex>
                                </Flex>
                            </Flex>
                        ) : (
                            <></>
                        )}

                        <Flex className={styles['section']}>
                            <Flex
                                vertical
                                gap={16}
                                className={styles['field']}
                                style={{ width: '100%' }}
                            >
                                <Label type="h2">
                                    <span className={styles['section-heading']}>
                                        {toolType} URL Information
                                    </span>
                                </Label>

                                <Flex gap={4} align="center" className={styles['field-row']}>
                                    <Icon
                                        name="cursor-click-01"
                                        size="xm"
                                        color="primary-green-500-color"
                                    />
                                    <span className={styles['field-name']}>
                                        {' '}
                                        {toolType?.toLowerCase() == 'performance management'
                                            ? 'Report'
                                            : toolType}{' '}
                                        URL:
                                    </span>
                                    {isLoading ? (
                                        <Skeleton.Node
                                            active
                                            style={{ width: '200px', height: '1rem' }}
                                        />
                                    ) : (
                                        <Flex className={styles['input-container']}>
                                            <InputField
                                                className="input-field"
                                                placeholder={toolDetail?.tool}
                                                value={
                                                    toolDetail?.toolURL?.length >= 50
                                                        ? `${toolDetail?.toolURL.slice(0, 50)}...`
                                                        : toolDetail?.toolURL
                                                }
                                                onChange={() => {}}
                                                isDisabled={true}
                                            />
                                        </Flex>
                                    )}
                                </Flex>
                                <Flex gap={4} align="center" className={styles['field-row']}>
                                    <Icon
                                        name="file-attachment-02"
                                        size="xm"
                                        color="primary-green-500-color"
                                    />
                                    <span className={styles['field-name']}>Documentation URL:</span>
                                    {isLoading ? (
                                        <Skeleton.Node
                                            active
                                            style={{ width: '200px', height: '1rem' }}
                                        />
                                    ) : (
                                        <Flex className={styles['input-container']}>
                                            <InputField
                                                className="input-field"
                                                placeholder="Documentation URL"
                                                value={String(newURLData.documentationURL)}
                                                onChange={event => {
                                                    const value = event.target.value.trim();
                                                    setModificationStatus(prev => ({
                                                        ...prev,
                                                        documentationURL: true,
                                                    }));
                                                    setNewURLData(prev => ({
                                                        ...prev,
                                                        documentationURL: value,
                                                    }));
                                                    setUrlErrorState(prev => ({
                                                        ...prev,
                                                        documentationURLError:
                                                            value.length > 0 && !validateUrl(value),
                                                    }));
                                                }}
                                                captionMessage={
                                                    urlErrorState.documentationURLError
                                                        ? 'Please enter a valid URL for Documentation.'
                                                        : ''
                                                }
                                                captionMessageType={
                                                    urlErrorState.documentationURLError
                                                        ? 'error'
                                                        : 'default'
                                                }
                                                isDisabled={false}
                                            />
                                        </Flex>
                                    )}
                                </Flex>
                                <Flex gap={4} align="center" className={styles['field-row']}>
                                    <Icon
                                        name="image-01"
                                        size="xm"
                                        color="primary-green-500-color"
                                    />
                                    <span className={styles['field-name']}>Thumbnail URL:</span>
                                    {isLoading ? (
                                        <Skeleton.Node
                                            active
                                            style={{ width: '200px', height: '1rem' }}
                                        />
                                    ) : (
                                        <Flex className={styles['input-container']}>
                                            <InputField
                                                className="input-field"
                                                placeholder="Thumbnail URL"
                                                value={String(newURLData.thumbnailURL)}
                                                onChange={event => {
                                                    const value = event.target.value.trim();
                                                    setModificationStatus(prev => ({
                                                        ...prev,
                                                        thumbnailURL: true,
                                                    }));
                                                    setNewURLData(prev => ({
                                                        ...prev,
                                                        thumbnailURL: value,
                                                    }));
                                                    setUrlErrorState(prev => ({
                                                        ...prev,
                                                        thumbnailURLError:
                                                            value.length > 0 && !validateUrl(value),
                                                    }));
                                                }}
                                                captionMessage={
                                                    urlErrorState.thumbnailURLError
                                                        ? 'Please enter a valid URL for Thumbnail.'
                                                        : ''
                                                }
                                                captionMessageType={
                                                    urlErrorState.thumbnailURLError
                                                        ? 'error'
                                                        : 'default'
                                                }
                                                isDisabled={false}
                                            />
                                        </Flex>
                                    )}
                                </Flex>
                            </Flex>
                        </Flex>
                    </Flex>
                </Flex>
            </div>
        );
    };
    const hasAnyChange =
        modificationStatus.hasBasicInfoChanged ||
        modificationStatus.region ||
        modificationStatus.cluster ||
        modificationStatus.market ||
        modificationStatus.site ||
        modificationStatus.documentationURL ||
        modificationStatus.thumbnailURL ||
        accessData?.hasChanges ||
        hasToolCombinationChanges;
    const isCurrentTabSaving =
        selectedTab === TabNamesEnum.ToolCombination
            ? !!toolCombinationData?.isSaving
            : showSavingLoader;

    const discardActiveTabChanges = () => {
        if (selectedTab === TabNamesEnum.ToolCombination && toolCombinationData?.discardHandler) {
            toolCombinationData.discardHandler();
            return;
        }

        resetAllChanges();
        setResetAccessSection(prev => prev + 1);
    };

    const currentDialogConfig = (() => {
        switch (activeDialog) {
            case 'save':
                return {
                    title: 'Save Changes',
                    content:
                        'Are you sure you want to save all the updates to the selected tool. These changes may affect user access within the Command Centre.',
                    primaryButtonText: 'Save',
                    secondaryButtonText: 'Continue Editing',
                    onPrimaryButtonClick: async () => {
                        if (
                            selectedTab === TabNamesEnum.AccessPermissions &&
                            accessData?.saveHandler
                        ) {
                            //  CALL ACCESS API
                            await accessData.saveHandler();
                            setActiveDialog(null);
                        } else if (
                            selectedTab === TabNamesEnum.ToolCombination &&
                            toolCombinationData?.saveHandler
                        ) {
                            await toolCombinationData.saveHandler();
                            setActiveDialog(null);
                        } else {
                            //  CALL GENERAL API
                            await handleEditApplicationChanges();
                        }
                    },
                    onSecondaryButtonClick: () => setActiveDialog(null),
                };
            case 'discard':
                return {
                    title: 'Discard Changes',
                    content: 'Are you sure you want to revert all unsaved changes?',
                    primaryButtonText: 'Discard Changes',
                    secondaryButtonText: 'Continue Editing',
                    onPrimaryButtonClick: () => {
                        discardActiveTabChanges();
                        setActiveDialog(null);
                    },
                    onSecondaryButtonClick: () => setActiveDialog(null),
                };
            case 'unsaved-tab':
                return {
                    title: 'Unsaved Changes',
                    content: (
                        <>
                            You have unsaved changes in the current section.
                            <br />
                            If you navigate away, your edits will be lost.
                            <br />
                            Are you sure you want to leave without saving?
                        </>
                    ),
                    primaryButtonText: 'Discard Changes',
                    secondaryButtonText: 'Continue Editing',
                    onPrimaryButtonClick: () => {
                        discardActiveTabChanges();
                        if (pendingTab) setSelectedTab(pendingTab);
                        setPendingTab(null);
                        setActiveDialog(null);
                    },
                    onSecondaryButtonClick: () => {
                        setPendingTab(null);
                        setActiveDialog(null);
                    },
                };
            case 'back-navigation':
                return {
                    title: 'Unsaved Changes',
                    content: (
                        <>
                            You have unsaved changes in the current section. If you navigate away,
                            your edits will be lost.
                            <br /> <br />
                            Are you sure you want to leave without saving?
                        </>
                    ),
                    primaryButtonText: 'Discard Changes',
                    secondaryButtonText: 'Continue Editing',
                    onPrimaryButtonClick: onSaveClose,
                    onSecondaryButtonClick: () => setActiveDialog(null),
                };
            default:
                return null;
        }
    })();

    const tabItems = [
        {
            label: TabNamesEnum.GeneralInformation,
            icon: 'layout-alt-01' as any,
        },
        ...(String(toolType)?.toLowerCase() === 'performance management' ||
        String(toolType)?.toLowerCase() === 'performance management'
            ? [
                  {
                      label: TabNamesEnum.ToolCombination,
                      icon: 'shield-tick' as any,
                  },
              ]
            : []),
        {
            label: TabNamesEnum.AccessPermissions,
            icon: 'shield-tick' as any,
        },
    ];

    return (
        <Flex vertical gap={24}>
            <Flex vertical gap={8} className={styles['edit-role-title']}>
                <Flex align="center" gap={8} justify="space-between">
                    <Flex align="flex-start" gap={16}>
                        <div className={styles['header-back-button']}>
                            <Link to="/admin-hub/tool-management" onClick={handleBackClick}>
                                {BackArrowIcon(8, 12)}
                            </Link>
                        </div>
                        <Flex justify="flex-start" vertical gap={8}>
                            <Label type="h2">
                                <TextWithSkeleton
                                    loading={isLoading}
                                    skeletonHeight="2rem"
                                    skeletonWidth="300"
                                    className={styles["edit-role-heading"]}
                                >
                                    {toolType}: {applicationParams?.appName}
                                </TextWithSkeleton>
                            </Label>

                            <Label type="body2">
                                <TextWithSkeleton
                                    loading={isLoading}
                                    skeletonHeight="1.5rem"
                                    skeletonWidth="300"
                                    className={styles["edit-role-description"]}
                                >
                                    {formatRefreshText(
                                        toolDetail?.lastRefresh
                                            ? new Date(toolDetail.lastRefresh)
                                            : null
                                    )}
                                </TextWithSkeleton>
                            </Label>
                        </Flex>
                    </Flex>
                    {hasAnyChange && (
                        <Flex
                            className={styles['add-role-button-container']}
                            align="center"
                            gap={8}
                        >
                            <Button
                                text="Discard Changes"
                                variant="Secondary"
                                onClick={handleGlobalDiscardClick}
                            />
                            <Button
                                text={isCurrentTabSaving ? 'Saving...' : 'Save Changes'}
                                variant="Primary"
                                onClick={handleGlobalSaveClick}
                                disabled={
                                    isCurrentTabSaving ||
                                    urlErrorState.documentationURLError ||
                                    urlErrorState.thumbnailURLError
                                }
                            />
                        </Flex>
                    )}
                </Flex>
                <Flex className={styles['tabs-wrapper']}>
                    <Tab items={tabItems} onClick={onUserSelectTab} />
                </Flex>
            </Flex>
            <div>{RenderTabContent()}</div>
            {toastConfig.visible && (
                <Toast
                    distance="x5l"
                    message={toastConfig.message}
                    mode="Top Right"
                    onCloseToast={() => setToastConfig({ ...toastConfig, visible: false })}
                    toggle
                    type={toastConfig.type}
                    timer={5000}
                />
            )}
            {activeDialog && currentDialogConfig && (
                <Dialog
                    key={activeDialog}
                    isOpen={!!activeDialog}
                    title={currentDialogConfig.title}
                    content={currentDialogConfig.content}
                    primaryButtonText={currentDialogConfig.primaryButtonText}
                    secondaryButtonText={currentDialogConfig.secondaryButtonText}
                    onPrimaryButtonClick={currentDialogConfig.onPrimaryButtonClick}
                    onSecondaryButtonClick={currentDialogConfig.onSecondaryButtonClick}
                    onClose={() => setActiveDialog(null)}
                />
            )}
        </Flex>
    );
}

export default EditApplicationScreen;
