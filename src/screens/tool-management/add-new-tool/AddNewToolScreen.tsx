import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Flex, Row, Col, Tooltip } from 'antd';
import styles from './AddNewToolScreen.module.scss';
import CustomSwitch from '../../../components/atoms/custom-switch/CustomSwitch';
import type { OptionType } from '../../../types/common';
import {
    AppDispatch,
    RootState,
    fetchRoleFunctions,
    fetchRoleLevels,
    fetchGeographicalRegion,
    fetchTeam,
    fetchOwnerName,
    fetchOnboardingAppPermission,
    fetchGeographicalClustersOnMultipleRegionsIds,
    fetchGeographicalMarketsOnMultipleClusterIds,
    fetchSubfunctionsOnMultipleFunctionIds,
    fetchFunctions,
    fetchGeographicalSitesOnMultipleMarketIds,
    fetchToolName,
    forumLevel,
    forumPeriod,
    getGeographyByLevel,
    fetchForumPersonaMappings,
    fetchRoleData,
} from '../../../store';
import {
    Button,
    Dialog,
    DropDown,
    Icon,
    InputField,
    TextArea,
    Tag,
    TagSelector,
    FilterChip,
    CheckBox,
    Toast,
    IconButton,
    Radio,
    Table,
} from 'konnect-react-components';
import { BackArrowIcon } from '../../../assets/icons/icons';
import {
    DUPLICATE_APPLICATION_ERROR_MESSAGE,
    ROLE_SELECTION_PAGE_NUMBER,
    ROLE_SELECTION_PAGE_SIZE,
} from '../../../utils/constants';
import { ExpandableForm, Label } from '../../../components';
import type {
    ToolPermissionsColumnData,
    ILocationRolesData,
    ToolAdGroup,
    IToolFeature,
    ToolPersona,
    IPersonaDescription,
    IPersonaPermissionMappings,
    IReportCombinationDetails,
    IReportCombinationSetup,
    IForumMapping,
    IPersonaRoleMapping,
} from '../../../types/response';
import { getLeadershipRoles } from '../../../services/roles';
import {
    getAdGroupsByAppId,
    saveApplicationDetails,
    getApplicationDetailsById,
    getLatestAppId,
    editToolPersona,
    deleteToolPersona,
    getToolPersonas,
    getToolPersonaConfiguration,
    getRoleSelection,
    getAdgroupPermissionMapping,
} from '../../../services/application';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import { Link, useNavigate } from 'react-router-dom';
import {
    convertOptions,
    isViewerPersona,
    isLeadershipPersona,
    logError,
    logWarning,
    toCommaSeparated,
} from '../../../utils/helpers';
import { validateUrl } from '../../../utils/validation';
import PermissionMatrixTable from '../../../components/molecules/permission-matrix/PermissionMatrixTable';
import { PermissionMatrixRow } from '../../../components/molecules/permission-matrix/PermissionMatrixTable';
import { applyPersonaPermissionToggleToRows } from '../../../components/molecules/permission-matrix/permissionMatrixUtils';

import {
    FlyoutCheckboxItemForum,
    RoleSelectionFlyoutForum,
} from '../../../components/organisms/role-selection-flyout/RoleSelectionFlyoutForum';
import LinkedForumFlyout, {
    type LinkedForumSavePayload,
    type ForumItem,
    type ForumPersonaType,
    PersonaMapping,
} from '../../../components/organisms/linked-forum-flyout/LinkedForumFlyout';

export type IAddNewRoleFormData = {
    generalInformationFormData: {
        applicationName: string;
        applicationId: string;
        applicationVersion: Record<string, string | number>;
        applicationTeam: Record<string, string | number>;
        applicationOwnerName: Record<string, string | number>;
        roleFunction: Record<string, string | number>;
        roleSubFunction: Record<string, string | number>;
        applicationRegion: Record<string, string | number>;
        applicationCluster: Record<string, string | number>;
        applicationMarket: Record<string, string | number>;
        applicationSite: Record<string, string | number>;
    };
    accessAndPermissionsFormData: {
        applicationPermissionIds: string[];
    };
};

export type GeneralInfoDropdownTool = {
    toolId: number;
    toolName: string;
    toolUrl?: string | null;
    toolDocumentationUrl?: string | null;
    toolThumbnailUrl?: string | null;
};

const TOOL_TYPE_MAP: Record<string, string> = {
    application: '1',
    report: '2',
    analytics: '3',
    performancemanagement: '4',
    other: '0',
};

function AddNewToolScreen() {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const searchParams = new URLSearchParams(location.search);
    const applicationIdRef = useRef<string | null>(null);
    interface TableRow {
        key: number;
        application?: string;
        applicationId?: string;
        appFeature?: string;
        appModuleName?: string;
        role: string;
        adgroup: string[];
        action: string;
        isActive?: boolean | null;
        isEditMode?: boolean;
        selectedPermissionCount?: number | null;
        parentRowKey?: number;
        disableEditForApplicationRow?: boolean;
        isRowSaved?: boolean;
        [key: string]: any;
        isEditable?: boolean;
        columnsTobeShown?: string[];
    }
    interface TableColumn {
        key: string;
        dataIndex: keyof TableRow;
        title: string;
        subTitle: string;
        width: string;
        sticky?: 'left' | 'right';
        externalStyles: { display: string; alignItems: string };
        customExpandableColumn: boolean;
        render: (_value: any, record: any) => JSX.Element;
    }

    interface GeographicalDataReset {
        region: boolean;
        cluster: boolean;
        market: boolean;
        site: boolean;
        function: boolean;
        subfunction: boolean;
    }

    interface ReportCombination {
        key: number;
        reportLevel: string;
        reportLevelId: string;
        reportPeriod: string;
        reportPeriodId: string;
        reportGeography: string;
        reportGeographyId: string;
        personaRoles: Record<string, OptionType[]>;
        linkedForum: OptionType[];
        forumPersonaMapping?: PersonaMapping;
    }

    type ReportCombinationRoleTarget = {
        rowKey: number;
        personaId: string;
        personaName: string;
    };

    const [permissions, setPermissions] = useState<ToolPermissionsColumnData[]>([]);

    const [, setSelectedRow] = useState<TableRow>();
    const [adGroupPermissions, setAdGroupPermissions] = useState<any[]>([]);

    const [showCheckedOnlyPerRow, setShowCheckedOnlyPerRow] = useState<Record<number, boolean>>({});

    const applicationTeamList = useSelector((state: RootState) => state.teamAndOwnerName);
    const geographicalInformation = useSelector(
        (state: RootState) => state.fetchGeographicalInformation,
    );
    const functionalInformation = useSelector(
        (state: RootState) => state.fetchFunctionSubfunctionInformation,
    );
    const applicationNameList = useSelector((state: RootState) => state.onboardingAppPermission);
    const toolName = useSelector((state: RootState) => state.toolName);

    const geographicalRegion = geographicalInformation.data.regions;
    const geographicalCluster = geographicalInformation.data.clusters;
    const geographicalMarkets = geographicalInformation.data.markets;
    const geographicalSites = geographicalInformation.data.sites;

    const allFunctions = functionalInformation.data.functions;
    const multipleSubfunctions = functionalInformation.data.subfunctions;

    const forumLevelsData = useSelector((state: RootState) => {
        const d = state.forumLevel?.data;
        return Array.isArray(d) ? d : [];
    });
    const forumPeriodsData = useSelector((state: RootState) => {
        const d = state.forumPeriod?.data;
        return Array.isArray(d) ? d : [];
    });
    const geographyByLevelData = useSelector(
        (state: RootState) => state.geographyByLevel?.data ?? [],
    );

    // Dropdown Data
    const [regionDD, setRegionDD] = useState<{ label: string; value: number }[]>([]);
    const [clusterDD, setClusterDD] = useState<{ label: string; value: number }[]>([]);
    const [marketDD, setMarketDD] = useState<{ label: string; value: number }[]>([]);
    const [siteDD, setSiteDD] = useState<{ label: string; value: number }[]>([]);

    const [isGeoDataFetched, setIsGeoDataFetched] = useState<GeographicalDataReset>({
        region: true,
        cluster: true,
        market: true,
        site: true,
        function: true,
        subfunction: true,
    });
    const [functionDD, setFunctionDD] = useState<{ label: string; value: number }[]>([]);
    const [subfunctionDD, setSubfunctionDD] = useState<{ label: string; value: number }[]>([]);

    const [openAccessPermissionsContainer, setOpenAccessPermissionsContainer] = useState(true);
    const [isEditModeOn, setIsEditModeOn] = useState(false);
    const [, setIsAddNewRoleButtonClicked] = useState(false);
    const [isGeneralContainerFormSaved, setIsGeneralContainerFormSaved] = useState(false);
    const [isUrlInfoContainerFormSaved, setIsUrlInfoContainerFormSaved] = useState(false);
    const [isGeoInfoContainerFormSaved, setIsGeoInfoContainerFormSaved] = useState(false);
    const [openCancelDialog, setOpenCancelDialog] = useState<boolean>(false);
    const [dropdownCloseKey, setDropdownCloseKey] = useState<number>(0);
    const [openGeneralContainer, setOpenGeneralContainer] = useState<boolean>(true);
    const [openGeoInfoContainer, setOpenGeoInfoContainer] = useState<boolean>(false);
    const [openUrlInfoContainer, setOpenUrlInfoContainer] = useState<boolean>(false);
    const [toggleToast, setToggleToast] = useState<boolean>(false);
    const [toggleErrorToast, setToggleErrorToast] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [applicationName, setApplicationName] = useState<string>('');
    const [applicationId, setApplicationId] = useState<string>('');
    const [isCancelEditClicked, setIsCancelEditClicked] = useState<boolean>(false);
    const [isSaveApplicationEnabled, setIsSaveApplicationEnabled] = useState<boolean>(false);
    const [applicationVersion, setApplicationVersion] = useState<string>('');
    const [isReportCombinationDeleteDialogOpen, setIsReportCombinationDeleteDialogOpen] =
        useState<boolean>(false);
    const [reportCombinationIdVal, setReportCombinationIdVal] = useState<number>(-1);
    const [, setIsEditButtonDisabled] = useState<boolean>(true);
    const applicationDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    const [applicationOwnerName, setApplicationOwnerName] = useState<
        Record<string, string | number>
    >({});
    const [applicationTeam, setApplicationTeam] = useState<Record<string, string>>({
        label: '',
        value: '',
    });
    const [geographyLevel, setGeographyLevel] = useState<Record<string, string>>({
        label: '',
        value: '',
    });
    const [applicationDescription, setApplicationDescription] = useState('');
    const [applicationRegion, setApplicationRegion] = useState<{ label: string; value: number }[]>(
        [],
    );
    const [applicationCluster, setApplicationCluster] = useState<
        { label: string; value: number }[]
    >([]);
    const [applicationMarket, setApplicationMarket] = useState<{ label: string; value: number }[]>(
        [],
    );
    const [applicationSite, setApplicationSite] = useState<{ label: string; value: number }[]>([]);
    const [allRegions, setAllRegions] = useState<{ label: string; value: number }[]>([]);
    const [allClusters, setAllClusters] = useState<{ label: string; value: number }[]>([]);
    const [allMarkets, setAllMarkets] = useState<{ label: string; value: number }[]>([]);
    const [allSites, setAllSites] = useState<{ label: string; value: number }[]>([]);
    const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
    const [isGeoInfoSaveButtonDisabled, setIsGeoInfoSaveButtonDisabled] = useState(true);
    const [isUrlInfoSaveButtonDisabled, setIsUrlInfoSaveButtonDisabled] = useState(true);
    const [showDuplicateApplicationMessage, setShowDuplicateApplicationMessage] = useState(false);
    const [roleFunction, setRoleFunction] = useState<{ label: string; value: number }[]>([]);
    const [roleSubFunction, setRoleSubFunction] = useState<{ label: string; value: number }[]>([]);
    const ALL_OPTION: { label: string; value: number } = {
        label: 'ALL',
        value: -1,
    };
    const ALL_OPTION_DD = {
        label: 'ALL',
        value: 'ALL',
    };

    const [, setShowEditButton] = useState<boolean>(false);

    const [data, setData] = useState<TableRow[]>([]);
    const [previousData, setPreviousData] = useState<TableRow[]>([]);

    const tableRef = useRef<any>(null);
    const [selectedRoles, setSelectedRoles] = useState<Record<number, OptionType[]>>({});
    const [roles, setRoles] = useState<ILocationRolesData[]>([]);
    const [adGroupOptions, setAdGroupOptions] = useState<Record<number, ToolAdGroup[]>>({});

    const [selectedAdGroups, setSelectedAdGroups] = useState<Record<number, OptionType[]>>({});

    const [selectedUrlActionOption, setSelectedUrlActionOption] = useState('openInIFrame');
    const [applicationUrl, setApplicationUrl] = useState('');
    const [isApplicationUrlLocked, setIsApplicationUrlLocked] = useState(false);
    const [documentationUrl, setDocumentationUrl] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [isSaveEditMode, setIsSaveEditMode] = useState<boolean>(false);
    const [openSaveDialog, setOpenSaveDialog] = useState<boolean>(false);
    const [roleNamesWithoutPermissions, setRoleNamesWithoutPermissions] = useState<string[]>([]);
    const [roleNamesWithoutAdGroups, setRoleNamesWithoutAdGroups] = useState<string[]>([]);

    const [fetchedAdGroups, setFetchedAdGroups] = useState<ToolAdGroup[]>([]);
    const [resetKeys, setResetKeys] = useState<Record<string, number>>({});
    const [permissionInteractionTracker, setPermissionInteractionTracker] = useState<
        Record<number, boolean>
    >({});
    const [selectedToolTypeOption, setSelectedToolTypeOption] = useState<{
        label: string;
        value: string;
    }>({ label: 'Application', value: '1' });
    const [pendingToolTypeOption, setPendingToolTypeOption] = useState<{
        label: string;
        value: string;
    }>({ label: '', value: '' });

    const [selectedToolName, setSelectedToolName] = useState<OptionType | null>(null);
    const [permissionMatrixRows, setPermissionMatrixRows] = useState<PermissionMatrixRow[]>([]);
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [showSelectedUsersOnly, setShowSelectedUsersOnly] = useState(false);

    const toolTypeOptions = [
        {
            label: 'Application',
            value: '1',
        },
        {
            label: 'Report',
            value: '2',
        },
        {
            label: 'Analytics',
            value: '3',
        },
        {
            label: 'Performance Management',
            value: '4',
        },
    ];
    const geographyLevelOptions = [
        {
            label: 'Region',
            value: '1',
        },
        {
            label: 'Cluster',
            value: '2',
        },
        {
            label: 'Market',
            value: '3',
        },
        {
            label: 'Site',
            value: '4',
        },
    ];

    const reportLevelOptions: OptionType[] = forumLevelsData.map((item: any) => ({
        label: item.forumLevelName ?? item,
        value: String(item.forumLevelId ?? item),
    }));

    const reportPeriodOptions: OptionType[] = forumPeriodsData.map((item: any) => ({
        label: item.forumPeriodName ?? item,
        value: String(item.forumPeriodId ?? item),
    }));
    const [applicationUrlError, setApplicationUrlError] = useState('');
    const [documentationUrlError, setDocumentationUrlError] = useState('');
    const [thumbnailUrlError, setThumbnailUrlError] = useState('');

    const [toolTypeChangeDialog, setToolTypeChangeDialog] = useState<boolean>(false);

    const [toolPersonas, setToolPersonas] = useState<ToolPersona[]>([]);
    const [openToolPersonaSection, setOpenToolPersonaSection] = useState(false);

    const [isPersonaDialogOpen, setIsPersonaDialogOpen] = useState(false);
    const [editingPersona, setEditingPersona] = useState<ToolPersona | null>(null);

    const [personaName, setPersonaName] = useState('');
    const [personaDescription, setPersonaDescription] = useState('');

    const [personaToDelete, setPersonaToDelete] = useState<ToolPersona | null>(null);
    const [openDeletePersonaDialog, setOpenDeletePersonaDialog] = useState(false);

    const [hoveredPersonaId, setHoveredPersonaId] = useState<number | null>(null);
    const [openMoveRolesDialog, setOpenMoveRolesDialog] = useState(false);
    const [moveRolesTargetPersonaId, setMoveRolesTargetPersonaId] = useState<string>('');

    const [adGroups, setAdGroups] = useState<any[]>([]);
    const [dataAccessList, setDataAccessList] = useState<any[]>([]);

    const [isRoleFlyoutOpen, setIsRoleFlyoutOpen] = useState(false);
    const [activePersonaName, setActivePersonaName] = useState<string | null>(null);

    // Report Combination state
    const [openReportCombinationSection, setOpenReportCombinationSection] = useState(false);
    const [reportCombinations, setReportCombinations] = useState<ReportCombination[]>([]);
    const [isLinkedForumFlyoutOpen, setIsLinkedForumFlyoutOpen] = useState(false);
    const [activeLinkedForumRowKey, setActiveLinkedForumRowKey] = useState<number | null>(null);
    const [activeReportRoleTarget, setActiveReportRoleTarget] =
        useState<ReportCombinationRoleTarget | null>(null);

    const forumPersonaMappingsState = useSelector((state: RootState) => state.forumPersonaMappings);
    const forumPersonaTypes: ForumPersonaType[] =
        forumPersonaMappingsState?.forumPersonaTypes ?? [];
    const forumPersonaToolPersonaOptions = (forumPersonaMappingsState?.toolPersonas ?? []).map(
        (p: { personaId: number; personaName: string }) => ({
            label: p.personaName,
            value: String(p.personaId),
        }),
    );
    const hasFetchedForumPersonaMappingsOnOpenRef = useRef(false);

    useEffect(() => {
        if (!isLinkedForumFlyoutOpen) {
            hasFetchedForumPersonaMappingsOnOpenRef.current = false;
            return;
        }

        const toolId = applicationId || applicationIdRef.current;
        if (!hasFetchedForumPersonaMappingsOnOpenRef.current && toolId) {
            hasFetchedForumPersonaMappingsOnOpenRef.current = true;
            dispatch(fetchForumPersonaMappings({ toolId: Number(toolId) }));
        }
    }, [isLinkedForumFlyoutOpen, applicationId, dispatch]);
    const [openDeleteCombinationDialog, setOpenDeleteCombinationDialog] = useState(false);
    const [isAddReportCombinationDialogOpen, setIsAddReportCombinationDialogOpen] = useState(false);
    const [dialogReportLevel, setDialogReportLevel] = useState<OptionType | null>(null);
    const [dialogReportPeriod, setDialogReportPeriod] = useState<OptionType | null>(null);
    const [dialogReportGeography, setDialogReportGeography] = useState<OptionType[]>([]);

    const isToolPersonaSectionEnabled = isGeneralContainerFormSaved && isUrlInfoContainerFormSaved;

    const isPMToolType =
        selectedToolTypeOption?.label?.trim().toLowerCase() === 'performance management';

    const reportCombinationPersonas = useMemo(
        () => toolPersonas.filter(persona => persona.isActive === true),
        [toolPersonas],
    );

    useEffect(() => {
        setReportCombinations(prev => {
            if (prev.length === 0 || reportCombinationPersonas.length === 0) return prev;

            return prev.map(combination => {
                const nextPersonaRoles = reportCombinationPersonas.reduce(
                    (acc, persona) => {
                        const personaId = String(persona.personaId);
                        acc[personaId] = combination.personaRoles?.[personaId] ?? [];
                        return acc;
                    },
                    {} as Record<string, OptionType[]>,
                );

                return {
                    ...combination,
                    personaRoles: nextPersonaRoles,
                };
            });
        });
    }, [reportCombinationPersonas]);

    const personaDataAccessOptions: OptionType[] = useMemo(
        () =>
            dataAccessList
                .map(access => ({
                    label:
                        access.accessName ??
                        access.dataAccessName ??
                        access.name ??
                        access.label ??
                        '',
                    value: String(access.dataAccessId ?? access.id ?? access.value ?? ''),
                }))
                .filter(option => option.label && option.value),
        [dataAccessList],
    );

    const [, setUsersFlyoutOpen] = useState<boolean>(false);

    const [activePersonaId, setActivePersonaId] = useState<string | null>(null);

    const [rolesAndUsers, setRolesAndUsers] = useState<Record<string, FlyoutCheckboxItemForum[]>>(
        {},
    );
    const [usersFlyoutData, setUsersFlyoutData] = useState<Record<string, any>>({});
    const [savedFlyOutData, setSavedFlyOutData] = useState<Record<string, any>>({});

    const [tempRoleSelection, setTempRoleSelection] = useState<Record<string, string[]>>({});
    const [personaRoleSelection, setPersonaRoleSelection] = useState<Record<string, string[]>>({});
    const [roleUserData, setRoleUserData] = useState<any[]>([]);
    const [isRoleDataLoading, setIsRoleDataLoading] = useState(false);
    const [hasMoreRoles, setHasMoreRoles] = useState(true);
    const [isLoadingMoreRoles, setIsLoadingMoreRoles] = useState(false);
    const latestRequestRef = useRef(0);
    const rolePageRef = useRef(ROLE_SELECTION_PAGE_NUMBER);
    // const [tempUsersSelection, setTempUsersSelection] = useState<Record<string, any[]>>({});
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedFilters, setSelectedFilters] = useState({
        function: [],
        subfunction: [],
        geographyLevel: [],
        rolelevel: [],
        userGroup: [],
    });
    const { columnFilters } = useSelector((state: RootState) => state.roleData);
    const mapToOptions = (data: any[] = []) =>
        data.map(item => ({
            label: item.columnValue,
            value: item.id ?? item.columnValue,
        }));
    const getUserGroupOptions = () => {
        const uniqueGroups = new Map<string, { label: string; value: string }>();

        roleUserData.forEach((item: any) => {
            if (item.userGroupId && item.userGroupName) {
                uniqueGroups.set(String(item.userGroupId), {
                    label: item.userGroupName,
                    value: String(item.userGroupId),
                });
            }
        });

        return Array.from(uniqueGroups.values());
    };

    const buildRoleSelectionPayload = useCallback(
        (pageNumber: number) => {
            const isLeadershipRoleContext = /leadership/i.test(
                activeReportRoleTarget?.personaName ?? activePersonaName ?? '',
            );

            return {
                geographyLevelId: toCommaSeparated(selectedFilters.geographyLevel),
                functionId: toCommaSeparated(selectedFilters.function),
                subFunctionId: toCommaSeparated(selectedFilters.subfunction),
                roleResponsibilityLevelId: toCommaSeparated(selectedFilters.rolelevel),
                userGroupId: toCommaSeparated(selectedFilters.userGroup),
                roleId: null,
                locationId: toCommaSeparated(selectedFilters.geographyLevel),
                searchKeyword: searchKeyword.trim() || undefined,
                isLeadership: isLeadershipRoleContext,
                pageNumber,
                pageSize: ROLE_SELECTION_PAGE_SIZE,
            };
        },
        [selectedFilters, searchKeyword, activeReportRoleTarget?.personaName, activePersonaName],
    );

    const handleLoadMoreRoles = useCallback(async () => {
        if (!hasMoreRoles || isLoadingMoreRoles || isRoleDataLoading) return;

        const nextPage = rolePageRef.current + 1;
        const requestId = ++latestRequestRef.current;

        setIsLoadingMoreRoles(true);

        try {
            const res = await getRoleSelection(buildRoleSelectionPayload(nextPage));
            const newData: any[] = res?.data?.data || [];

            if (requestId !== latestRequestRef.current) return;

            if (newData.length < ROLE_SELECTION_PAGE_SIZE) {
                setHasMoreRoles(false);
            }

            if (newData.length > 0) {
                rolePageRef.current = nextPage;
                setRoleUserData(prev => [...prev, ...newData]);
            }
        } catch {
            // Keep existing roles if load-more fails.
        } finally {
            if (requestId === latestRequestRef.current) {
                setIsLoadingMoreRoles(false);
            }
        }
    }, [hasMoreRoles, isLoadingMoreRoles, isRoleDataLoading, buildRoleSelectionPayload]);

    useEffect(() => {
        if (!isRoleFlyoutOpen) {
            latestRequestRef.current += 1;
            setIsRoleDataLoading(false);
            setIsLoadingMoreRoles(false);
            return;
        }

        rolePageRef.current = ROLE_SELECTION_PAGE_NUMBER;
        setHasMoreRoles(true);
        setRoleUserData([]);
        setIsRoleDataLoading(true);

        const timer = setTimeout(() => {
            const fetchRoleUsers = async () => {
                const requestId = ++latestRequestRef.current;

                try {
                    const res = await getRoleSelection(
                        buildRoleSelectionPayload(ROLE_SELECTION_PAGE_NUMBER),
                    );
                    const data: any[] = res?.data?.data || [];

                    if (requestId === latestRequestRef.current) {
                        setRoleUserData(data);
                        setHasMoreRoles(data.length >= ROLE_SELECTION_PAGE_SIZE);
                        setIsRoleDataLoading(false);
                    }
                } catch {
                    if (requestId === latestRequestRef.current) {
                        setRoleUserData([]);
                        setIsRoleDataLoading(false);
                    }
                }
            };

            fetchRoleUsers();
        }, 400);

        return () => clearTimeout(timer);
    }, [
        activePersonaName,
        activeReportRoleTarget?.personaName,
        isRoleFlyoutOpen,
        selectedFilters,
        searchKeyword,
        buildRoleSelectionPayload,
    ]);
    const groupedRoles = useMemo(() => {
        if (!Array.isArray(roleUserData)) return [];

        const grouped = Object.values(
            roleUserData.reduce((acc, item) => {
                const key = String(item.roleId);

                if (!acc[key]) {
                    acc[key] = {
                        roleId: item.roleId,
                        roleName: item.roleName,
                        functionName: item.functionName,
                        subFunctionName: item.subFunctionName,
                        roleLevelName: item.geographyLevelName,
                        responsibilityLevelName: item.responsibilityLevelName,
                        users: [],
                    };
                }

                acc[key].users.push({
                    id: item.userEmail,
                    roleId: item.roleId,
                    userEmail: item.userEmail,
                    fullName: item.fullName,
                    checked: true,
                });

                return acc;
            }, {}),
        );

        return grouped;
    }, [roleUserData]);

    useEffect(() => {
        if (!activePersonaId) return;
        if (!Array.isArray(groupedRoles)) return;

        const selectedRoleIds =
            tempRoleSelection[activePersonaId] || personaRoleSelection[activePersonaId] || [];

        setRolesAndUsers(prev => {
            const existing = prev[activePersonaId] ?? [];
            const groupedRoleIds = new Set(
                groupedRoles.map((item: any) => String(item.roleId)),
            );
            const preservedSelectedRoles = existing.filter(
                (role: any) => role.checked && !groupedRoleIds.has(String(role.roleId)),
            );

            const formatted = groupedRoles.map((item: any) => {
                const existingRole = existing.find(
                    (role: any) => String(role.roleId) === String(item.roleId),
                );

                return {
                    ...item,
                    checked: existingRole?.checked ?? selectedRoleIds.includes(String(item.roleId)),
                };
            });

            return {
                ...prev,
                [activePersonaId]: [...preservedSelectedRoles, ...formatted],
            };
        });
    }, [groupedRoles, activePersonaId, tempRoleSelection, personaRoleSelection]);
    useEffect(() => {
        if (!activePersonaId || !groupedRoles?.length) return;

        setSavedFlyOutData(prev => {
            const existing = prev[activePersonaId];
            if (existing?.users?.length) return prev;

            const users = groupedRoles.flatMap((role: any) =>
                (role.users || []).map((user: any) => ({
                    id: user.userEmail,
                    roleId: role.roleId,
                    userEmail: user.userEmail,
                    fullName: user.fullName,
                    checked: true,
                })),
            );

            return {
                ...prev,
                [activePersonaId]: {
                    roles: existing?.roles ?? [],
                    users,
                },
            };
        });
    }, [groupedRoles, activePersonaId]);

    useEffect(() => {
        // Cluster
        if (!isGeoEnabled(geographyLevel.label, 'Cluster')) {
            if (applicationCluster.length === 0) {
                setApplicationCluster([ALL_OPTION]);
                markGeoDirty(isGeoInfoContainerFormSaved, setIsGeoInfoContainerFormSaved);
            }
        }

        // Market
        if (!isGeoEnabled(geographyLevel.label, 'Market')) {
            if (applicationMarket.length === 0) {
                setApplicationMarket([ALL_OPTION]);
                markGeoDirty(isGeoInfoContainerFormSaved, setIsGeoInfoContainerFormSaved);
            }
        }

        // Site
        if (!isGeoEnabled(geographyLevel.label, 'Site')) {
            if (applicationSite.length === 0) {
                setApplicationSite([ALL_OPTION]);
                markGeoDirty(isGeoInfoContainerFormSaved, setIsGeoInfoContainerFormSaved);
            }
        }
    }, [
        geographyLevel.label,
        applicationCluster.length,
        applicationMarket.length,
        applicationSite.length,
    ]);
    useEffect(() => {
        const gridFilters: any[] = [];

        dispatch(
            fetchRoleData({
                pageNumber: 1,
                pageSize: 10,
                sortColumnName: '',
                sortDirection: '',
                searchKeyword: '',
                searchTerm: 'Role',
                gridFilters,
                userEmail: '',
                forumLevel: '',
                forumPeriod: '',
            }),
        );
    }, []);

    useEffect(() => {
        if (
            geographicalCluster?.length > 0 ||
            geographicalMarkets?.length > 0 ||
            geographicalRegion?.length > 0 ||
            geographicalSites?.length > 0
        ) {
            setAllClusters(clusterDD);
            setAllMarkets(marketDD);
            setAllRegions(regionDD);
            setAllSites(siteDD);
        }
    }, [
        clusterDD,
        geographicalCluster,
        geographicalMarkets,
        geographicalRegion,
        geographicalSites,
        marketDD,
        regionDD,
        siteDD,
    ]);

    const getPersonaAdGroupOptions = (): OptionType[] => [
        { label: 'None', value: 'none' },
        ...adGroups
            .map(group => ({
                label: group.adGroupName ?? group.adGroup ?? group.name ?? group.label ?? '',
                value: String(group.id ?? group.adGroupId ?? group.value ?? ''),
            }))
            .filter(option => option.label && option.value),
    ];

    const getReportCombinationDetails = (): IReportCombinationDetails[] => {
        return reportCombinations.map(item => {
            const level = reportLevelOptions.find(opt => opt.label === item.reportLevel);

            const period = reportPeriodOptions.find(opt => opt.label === item.reportPeriod);

            const selectedGeoLabels = item.reportGeography
                ? item.reportGeography.split(',').map(g => g.trim())
                : [];

            const selectedGeoIds = geographyByLevelData
                .filter((g: any) => selectedGeoLabels.includes(String(g.name ?? g.geographyName)))
                .map((g: any) => String(g.geographyId ?? g.id));

            const availableGeoOptions = geographyByLevelData.filter(
                (g: any) => g.geographyId !== 0 && String(g.name ?? '').toUpperCase() !== 'ALL',
            );

            const isAllReportGeography =
                availableGeoOptions.length > 0 &&
                selectedGeoIds.length === availableGeoOptions.length;

            return {
                tempKey: item.key,

                reportLevelId: Number(level?.value ?? 0),
                reportPeriodId: Number(period?.value ?? 0),

                reportGeographyId: selectedGeoIds.join(','),

                isAllReportGeography,
            };
        });
    };
    const getReportCombinationSetup = (): IReportCombinationSetup[] => {
        return reportCombinations.map(item => {
            const reportCombinationTempKey = item.key;

            /* ------------------------------------------
            1. FORUM MAPPINGS 
        ------------------------------------------ */
            const forumMappings: IForumMapping[] = [];

            if (item.linkedForum && item.linkedForum.length > 0) {
                item.linkedForum.forEach(forum => {
                    if (
                        item.forumPersonaMapping &&
                        Object.keys(item.forumPersonaMapping).length > 0
                    ) {
                        const forumPersonaMapping = item.forumPersonaMapping;

                        forumPersonaTypes.forEach(fp => {
                            const personaId =
                                forumPersonaMapping[String(fp.forumPersonaTypeId) as any];

                            if (fp && personaId) {
                                forumMappings.push({
                                    reportCombinationTempKey,
                                    forumId: Number(forum.value),
                                    forumPersonaTypeId: Number(fp.forumPersonaTypeId),
                                    personaTempKey: Number(personaId.value),
                                });
                            }
                        });
                    }
                });
            }

            /* ------------------------------------------
            2. PERSONA ROLE MAPPINGS 
        ------------------------------------------ */
            const personaRoleMappings: IPersonaRoleMapping[] = [];

            const activePersonas = toolPersonas?.filter(p => p.isActive) ?? [];

            activePersonas.forEach(persona => {
                const personaId = String(persona.personaId);

                const roleKey = `report-combination-${item.key}-persona-${personaId}`;

                const selectedRoles = [
                    ...(personaRoleSelection[roleKey] ?? []),
                    ...(tempRoleSelection[roleKey] ?? []),
                ];

                const uniqueRoleIds = Array.from(new Set(selectedRoles));

                if (uniqueRoleIds.length > 0) {
                    personaRoleMappings.push({
                        reportCombinationTempKey,
                        personaTempKey: Number(persona.personaId),
                        roleIds: uniqueRoleIds.join(','),
                    });
                }
            });

            return {
                forumMappings,
                personaRoleMappings,
            };
        });
    };
    const handleMultiSelectChange = (key: string) => {
        return (_option: any, _checked: boolean, tree: any[]) => {
            setSelectedFilters(prev => ({
                ...prev,
                [key]: tree || [],
            }));
        };
    };

    const mapSelectedOptions = (list: any[] = []) =>
        list.map(item => ({
            label: item.label,
            value: String(item.value),
        }));
    const getSelectedRolesCount = () => {
        if (!activePersonaId) return 0;

        return rolesAndUsers[activePersonaId]?.filter(item => item.checked).length || 0;
    };
    const getSelectedUsersCount = () => {
        if (!activePersonaId) return 0;

        const users = usersFlyoutData[activePersonaId] || [];
        const emails = new Set<string>();

        users.forEach((user: any) => {
            if (user.checked !== false && user.userEmail) {
                emails.add(user.userEmail);
            }
        });

        return emails.size;
    };

    const dropdownFilters = (
        <Flex wrap="wrap" gap={8}>
            <DropDown
                dropdown={{
                    size: 'S',
                    label: 'Function',
                    isLabelInline: true,
                    options: mapToOptions(columnFilters.function),
                    onChange: handleMultiSelectChange('function'),
                    selectedOptions: mapSelectedOptions(selectedFilters.function),
                    type: 'checkbox',
                    showSelectAll: true,
                    selectAllOption: { label: 'Select All', value: 'all' },
                    placeholder: '',
                }}
            />

            <DropDown
                dropdown={{
                    size: 'S',
                    label: 'Sub-Function',
                    isLabelInline: true,
                    options: mapToOptions(columnFilters.subfunction),
                    onChange: handleMultiSelectChange('subfunction'),
                    selectedOptions: mapSelectedOptions(selectedFilters.subfunction),
                    type: 'checkbox',
                    showSelectAll: true,
                    selectAllOption: { label: 'Select All', value: 'all' },
                    placeholder: '',
                }}
            />

            <DropDown
                dropdown={{
                    size: 'S',
                    label: 'Geography Level',
                    isLabelInline: true,
                    options: mapToOptions(columnFilters.region),
                    onChange: handleMultiSelectChange('geographyLevel'),
                    selectedOptions: mapSelectedOptions(selectedFilters.geographyLevel),
                    type: 'checkbox',
                    showSelectAll: true,
                    selectAllOption: { label: 'Select All', value: 'all' },
                    placeholder: '',
                }}
            />

            <DropDown
                dropdown={{
                    size: 'S',
                    label: 'Responsibility Level',
                    isLabelInline: true,
                    options: mapToOptions(columnFilters.roleLevel),
                    onChange: handleMultiSelectChange('rolelevel'),
                    selectedOptions: mapSelectedOptions(selectedFilters.rolelevel),
                    type: 'checkbox',
                    showSelectAll: true,
                    selectAllOption: { label: 'Select All', value: 'all' },
                    placeholder: '',
                }}
            />

            <DropDown
                dropdown={{
                    size: 'S',
                    label: 'User Groups',
                    isLabelInline: true,

                    type: 'checkbox',
                    showSelectAll: true,
                    selectAllOption: { label: 'Select All', value: 'all' },

                    options: getUserGroupOptions(),

                    onChange: handleMultiSelectChange('userGroup'),

                    selectedOptions: mapSelectedOptions(selectedFilters.userGroup),

                    placeholder: '',
                }}
                searchInput={{
                    searchPlaceholder: 'Search',
                    searchSize: 'L',
                    searchWholeString: true,
                }}
            />
        </Flex>
    );    
    const userLocationFilter = (
        <DropDown
            dropdown={{
                size: 'S',
                label: 'Location',
                isLabelInline: true,
                type: 'checkbox',
                showSelectAll: true,
                selectAllOption: { label: 'Select All', value: 'all' },
                options: mapToOptions(columnFilters.region),
                onChange: handleMultiSelectChange('geographyLevel'),
                selectedOptions: mapSelectedOptions(selectedFilters.geographyLevel),
                placeholder: '',
            }}
        />
    );

    const ensureDefaultToolPersonas = useCallback(
        (incoming: ToolPersona[] = []): ToolPersona[] => {
            const personas = [...incoming];
            const hasViewer = personas.some(persona => isViewerPersona(persona));
            const hasLeadership = personas.some(persona => isLeadershipPersona(persona));

            const defaultViewer: ToolPersona = {
                personaId: -1,
                personaName: 'Viewer',
                description:
                    'The users of this group can view the tool but do not have editing access.',
                adGroup: 'None',
                adGroupId: null,
                dataAccess: 'None',
                dataAccessId: null,
                roleIds: [],
                rolesCount: 0,
                isActive: true,
            };

            const defaultLeadership: ToolPersona = {
                personaId: -2,
                personaName: 'Leadership',
                description:
                    'The users of this group have leadership access to the tool with all viewable permissions.',
                adGroup: 'None',
                adGroupId: null,
                dataAccess: 'None',
                dataAccessId: null,
                roleIds: roles.map(role => Number(role.roleId)).filter(Boolean),
                rolesCount: roles.length,
                isActive: true,
            };

            const merged = [...personas];

            if (!hasViewer) {
                merged.unshift(defaultViewer);
            }

            if (!hasLeadership) {
                merged.unshift(defaultLeadership);
            }

            return merged.map(persona => {
                if (isViewerPersona(persona)) {
                    return {
                        ...persona,
                        adGroup: persona.adGroup ?? 'None',
                        adGroupId: persona.adGroupId ?? null,
                        dataAccess: persona.dataAccess ?? 'None',
                        dataAccessId: persona.dataAccessId ?? null,
                        roleIds: [],
                        rolesCount: 0,
                        isActive: persona.isActive ?? true,
                    };
                }

                if (isLeadershipPersona(persona)) {
                    const leadershipRoleIds =
                        persona.roleIds && persona.roleIds.length > 0
                            ? persona.roleIds
                            : roles.map(role => Number(role.roleId)).filter(Boolean);

                    return {
                        ...persona,
                        adGroup: 'None',
                        adGroupId: null,
                        dataAccess: persona.dataAccess ?? 'None',
                        dataAccessId: persona.dataAccessId ?? null,
                        roleIds: leadershipRoleIds,
                        rolesCount: leadershipRoleIds.length,
                        isActive: persona.isActive ?? true,
                    };
                }

                return {
                    ...persona,
                    adGroup: persona.adGroup ?? 'None',
                    adGroupId: persona.adGroupId ?? null,
                    dataAccess: persona.dataAccess ?? 'None',
                    dataAccessId: persona.dataAccessId ?? null,
                    roleIds: persona.roleIds ?? [],
                    rolesCount: persona.rolesCount ?? persona.roleIds?.length ?? 0,
                    isActive: persona.isActive ?? true,
                };
            });
        },
        [roles],
    );

    const getPersonaRoleChipText = (persona: ToolPersona) => {
        const personaId = String(persona.personaId);

        const hasUserModified = personaRoleSelection[personaId] !== undefined;

        //  Use local state AFTER modification
        if (hasUserModified) {
            const count = rolesAndUsers[personaId]?.filter(item => item.checked).length ?? 0;

            if (count > 0) return `Roles: ${count}`;
            return 'Roles: None';
        }

        //  Otherwise use API count
        const apiCount = persona.rolesCount ?? persona.roleIds?.length ?? 0;

        if (apiCount > 0) return `Roles: ${apiCount}`;
        return 'Roles: None';
    };

    const getPersonaSelectedAdGroup = (persona: ToolPersona): OptionType[] => {
        if (!persona.adGroupId || persona.adGroup === 'None') {
            return [{ label: 'None', value: 'none' }];
        }

        const optionFromConfig = getPersonaAdGroupOptions().find(
            option => String(option.value) === String(persona.adGroupId),
        );

        return [
            {
                label: persona.adGroup || optionFromConfig?.label || 'None',
                value: String(persona.adGroupId),
            },
        ];
    };

    const getPersonaSelectedDataAccess = (persona: ToolPersona): OptionType[] => {
        if (!persona.dataAccessId || persona.dataAccess === 'None') {
            return [];
        }

        const optionFromConfig = personaDataAccessOptions.find(
            option => String(option.value) === String(persona.dataAccessId),
        );

        return [
            {
                label: persona.dataAccess || optionFromConfig?.label || '',
                value: String(persona.dataAccessId),
            },
        ];
    };

    const getPermissionsForAdGroup = (adGroupName: string) => {
        return adGroupPermissions.filter(item => item.adGroupName === adGroupName);
    };

    const handlePersonaFieldChange = async (
        personaId: number,
        field: 'adGroup' | 'dataAccess',
        option: OptionType | OptionType[] | null,
    ) => {
        const persona = toolPersonas.find(p => p.personaId === personaId);

        if (isLeadershipPersona(persona)) {
            return;
        }

        let selectedOption: OptionType | undefined | null = null;

        if (Array.isArray(option)) {
            selectedOption = option.length > 0 ? option[0] : null;
        } else {
            selectedOption = option ?? null;
        }

        const selectedAdGroupId =
            field === 'adGroup'
                ? !selectedOption || selectedOption.value === 'none'
                    ? null
                    : Number(selectedOption.value)
                : undefined;

        const selectedDataAccessId =
            field === 'dataAccess'
                ? selectedOption &&
                  selectedOption.value !== undefined &&
                  selectedOption.value !== null
                    ? Number(selectedOption.value)
                    : null
                : undefined;

        setToolPersonas(prev => {
            const updated = prev.map(persona => {
                if (persona.personaId !== personaId) return persona;

                const label = selectedOption?.label || 'None';

                if (field === 'adGroup') {
                    return {
                        ...persona,
                        adGroup: selectedOption?.value === 'none' ? 'None' : label,
                        adGroupId: selectedAdGroupId ?? null,
                    };
                }

                return {
                    ...persona,
                    dataAccess: label,
                    dataAccessId: selectedDataAccessId ?? null,
                };
            });
            return updated;
        });
    };

    const handleRoleChipClick = (persona: ToolPersona) => {
        if (isLeadershipPersona(persona)) {
            return;
        }
        const id = String(persona.personaId);
        setActivePersonaName(persona.personaName);
        setActivePersonaId(id);
        setSearchKeyword('');

        setTempRoleSelection(prev => ({
            ...prev,
            [id]: personaRoleSelection[id] || [],
        }));

        // ✅ IMPORTANT: open flyout AFTER setting ID
        setTimeout(() => {
            setIsRoleFlyoutOpen(true);
        }, 0);
    };

    const handleOpenMoveRolesDialog = () => {
        setOpenDeletePersonaDialog(false);
        setMoveRolesTargetPersonaId('');
        setOpenMoveRolesDialog(true);
    };

    const handleGoBackToDeleteDialog = () => {
        setOpenMoveRolesDialog(false);
        setOpenDeletePersonaDialog(true);
    };

    const handleMoveRolesAndDeletePersona = async () => {
        if (!personaToDelete || !moveRolesTargetPersonaId) return;

        try {
            await deleteToolPersona({
                personaId: personaToDelete.personaId,
                targetPersonaId: Number(moveRolesTargetPersonaId),
            });

            setToolPersonas(prev => prev.filter(p => p.personaId !== personaToDelete.personaId));
        } catch {
            setToggleErrorToast(true);
        } finally {
            setOpenMoveRolesDialog(false);
            setPersonaToDelete(null);
            setMoveRolesTargetPersonaId('');
        }
    };
    useEffect(() => {
        if (!toolPersonas.length || !adGroupPermissions.length) return;

        const rows: PermissionMatrixRow[] = [];

        adGroupPermissions.forEach((permissionObj: any) => {
            const {
                moduleId = '0',
                module,
                subModuleId = '0',
                subModule,
                permissionId,
                permission,
            } = permissionObj;
            const permissionName = permission ?? `Permission ${permissionId}`;
            const rowKey = `${moduleId}-${subModuleId}-${permissionId}`;

            let existingRow = rows.find(r => r.key === rowKey);
            if (!existingRow) {
                existingRow = {
                    key: rowKey,
                    moduleId,
                    moduleName: module,
                    subModuleId,
                    subModuleName: subModule,
                    permissionName,
                    personaAccess: toolPersonas.reduce(
                        (acc, persona) => {
                            acc[String(persona.personaId)] = null;
                            return acc;
                        },
                        {} as Record<string, boolean | null>,
                    ),
                    isFirstInModule: !rows.some(r => r.moduleId === moduleId),
                    isFirstInSubModule: !rows.some(
                        r => r.moduleId === moduleId && r.subModuleId === subModuleId,
                    ),
                };
                rows.push(existingRow);
            }
        });

        const updatedRows = rows.map(row => {
            const personaAccess = { ...row.personaAccess };

            toolPersonas.forEach(persona => {
                const personaIdStr = String(persona.personaId);

                if (isLeadershipPersona(persona)) {
                    personaAccess[personaIdStr] = true;
                    return;
                }

                if (!persona.adGroup || persona.adGroup === 'None') {
                    personaAccess[personaIdStr] = null;
                    return;
                }

                const allowedPermissions = getPermissionsForAdGroup(String(persona.adGroup));
                const isAllowed = allowedPermissions.some((p: any) => {
                    return (
                        String(p.moduleId ?? '0') === String(row.moduleId) &&
                        String(p.subModuleId ?? '0') === String(row.subModuleId) &&
                        (p.permission === row.permissionName ||
                            String(p.permissionId) === String(row.key)?.split('-').pop())
                    );
                });

                personaAccess[personaIdStr] = isAllowed ? true : null;
            });

            return {
                ...row,
                personaAccess,
            };
        });

        const personaSelectorRow: PermissionMatrixRow = {
            key: 'persona-selector-row',
            moduleId: '',
            moduleName: '',
            subModuleId: '',
            subModuleName: '',
            permissionName: '',
            isPersonaSelectorRow: true,
            personaAccess: toolPersonas.reduce(
                (acc, persona) => {
                    acc[String(persona.personaId)] = false;
                    return acc;
                },
                {} as Record<string, boolean | null>,
            ),
        };

        setPermissionMatrixRows([personaSelectorRow, ...updatedRows]);
    }, [toolPersonas, adGroupPermissions]);

    useEffect(() => {
        const initialize = async () => {
            if (!applicationIdRef.current) {
                applicationIdRef.current = searchParams.get('appId');
                if (applicationIdRef.current != null) {
                    setApplicationId('');
                }
            }

            if (applicationIdRef.current) {
                fetchApplicationDetails(applicationIdRef.current);
            }
        };

        initialize();
    }, [applicationTeamList]);

    useEffect(() => {
        const effectiveToolId = applicationId || applicationIdRef.current;

        if (!effectiveToolId) return;

        const fetchAdGroupPermissions = async () => {
            try {
                const effectiveToolId = applicationId || applicationIdRef.current;

                if (!effectiveToolId) return;
                const res = await getAdgroupPermissionMapping(Number(effectiveToolId));
                setAdGroupPermissions(res?.data || []);
            } catch (e) {
                logError('Failed to fetch AD group permissions', e);
                setAdGroupPermissions([]);
            }
        };

        fetchAdGroupPermissions();
    }, [applicationId]);

    useEffect(() => {
        const effectiveToolId = applicationId || applicationIdRef.current;

        if (!effectiveToolId) return;

        const fetchConfig = async () => {
            try {
                const res: any = await getToolPersonaConfiguration(Number(effectiveToolId));
                const config = res?.data ?? res ?? {};

                setAdGroups(Array.isArray(config.adGroups) ? config.adGroups : []);
                setDataAccessList(
                    Array.isArray(config.dataAccessList) ? config.dataAccessList : [],
                );
            } catch {
                setAdGroups([]);
                setDataAccessList([]);
            }
        };

        fetchConfig();
    }, [applicationId]);

    useEffect(() => {
        const fetchData = async () => {
            const _selectedApp = applicationNameList.toolName[applicationName as any] as any;
            const response = (await getLatestAppId()) ?? '';

            setApplicationVersion(_selectedApp?.version);
            if (_selectedApp) {
                setApplicationId(response.data ?? '');
            }
        };

        fetchData();
    }, [applicationName]);

    useEffect(() => {
        setFunctionDD(
            allFunctions.map((func: { functionName: string | null; functionId: number }) => ({
                label: func.functionName ?? '',
                value: func.functionId,
            })),
        );
    }, [allFunctions]);

    useEffect(() => {
        if (roleFunction.length > 0) {
            const functionIds = roleFunction?.map(func => func.value) ?? [];
            dispatch(fetchSubfunctionsOnMultipleFunctionIds({ functionIds }))
                .unwrap()
                .then(() => {})
                .catch(error => {
                    logError('Failed to fetch subfunctions:', error);
                });
        } else {
            setRoleSubFunction([]);
        }
    }, [roleFunction, isGeoDataFetched.function]);

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
        setRegionDD(
            geographicalRegion
                .filter(region => region.regionName.toLowerCase() !== 'global')
                .map(region => ({
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
                    if (!isGeoDataFetched.region) {
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
            setMarketDD([]);
            setSiteDD([]);
        }
    }, [applicationRegion, isGeoDataFetched.region]);

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
                    if (!isGeoDataFetched.cluster) {
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
        }
    }, [applicationCluster, isGeoDataFetched.cluster]);

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
                    if (!isGeoDataFetched.market) {
                        setApplicationSite([]);
                    }
                })
                .catch((error: any) => {
                    logError('Failed to fetch sites:', error);
                });
        } else {
            setApplicationSite([]); // Clear Sites if no Market selected
        }
    }, [applicationMarket, isGeoDataFetched.market]);

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
        setApplicationId('');
        dispatch(fetchRoleLevels());
        dispatch(fetchRoleFunctions());
        dispatch(fetchFunctions());
        dispatch(fetchGeographicalRegion());
        dispatch(fetchOnboardingAppPermission());
        dispatch(fetchOwnerName());
        dispatch(fetchTeam());
        dispatch(fetchToolName(selectedToolTypeOption?.value));
        fetchRoles();
    }, []);

    const ResetOnToolTypeChange = () => {
        setApplicationName('');
        setApplicationId('');
        setSelectedToolName(null);
        setApplicationVersion('');
        setRoleFunction([]);
        setRoleSubFunction([]);
        setApplicationTeam({});
        setApplicationOwnerName({});
        setApplicationDescription('');
        setGeographyLevel({
            label: '',
            value: '',
        });
        setReportCombinations([]);
        setApplicationRegion([]);
        setApplicationCluster([]);
        setApplicationMarket([]);
        setApplicationSite([]);
        setApplicationUrl('');
        setIsApplicationUrlLocked(false);
        setDocumentationUrl('');
        setThumbnailUrl('');
        setIsGeneralContainerFormSaved(false);
        setIsUrlInfoContainerFormSaved(false);
        setOpenUrlInfoContainer(false);
        setOpenAccessPermissionsContainer(false);
        setIsAddNewRoleButtonClicked(false);
        setOpenGeneralContainer(true);
        setOpenGeoInfoContainer(false);
        setIsGeoInfoContainerFormSaved(false);
        setData([]);
    };

    const handleToolTypeChange = (value: { label: string; value: string }) => {
        closeOpenDropdowns();

        const hasFieldValue = (fieldValue: unknown) => String(fieldValue ?? '').trim().length > 0;
        const hasSelectedOption = (option?: Record<string, unknown> | null) =>
            Boolean(option && (hasFieldValue(option.label) || hasFieldValue(option.value)));
        const hasSelection = (items?: unknown[]) => Array.isArray(items) && items.length > 0;
        const hasCustomPersonaData = toolPersonas.some(
            persona =>
                persona.isActive && !isLeadershipPersona(persona) && !isViewerPersona(persona),
        );

        const hasDataInAnyField =
            hasFieldValue(applicationName) ||
            hasFieldValue(applicationId) ||
            hasFieldValue(applicationVersion) ||
            hasSelection(roleFunction) ||
            hasSelection(roleSubFunction) ||
            hasSelectedOption(applicationTeam) ||
            hasSelectedOption(applicationOwnerName) ||
            hasSelectedOption(geographyLevel) ||
            hasFieldValue(applicationDescription) ||
            hasSelection(applicationRegion) ||
            (isGeoEnabled(geographyLevel.label, 'Cluster') && hasSelection(applicationCluster)) ||
            (isGeoEnabled(geographyLevel.label, 'Market') && hasSelection(applicationMarket)) ||
            (isGeoEnabled(geographyLevel.label, 'Site') && hasSelection(applicationSite)) ||
            hasFieldValue(applicationUrl) ||
            hasFieldValue(documentationUrl) ||
            hasFieldValue(thumbnailUrl) ||
            selectedUrlActionOption !== 'openInIFrame' ||
            hasCustomPersonaData ||
            hasSelection(reportCombinations) ||
            hasSelection(data) ||
            hasFieldValue(personaName) ||
            hasFieldValue(personaDescription);

        if (selectedToolTypeOption.value !== '' && hasDataInAnyField) {
            setPendingToolTypeOption(value);
            setToolTypeChangeDialog(true);
        } else {
            // First-time selection, no dialog needed
            setSelectedToolTypeOption(value);
            setSelectedToolName(null);
            setApplicationName('');
            setApplicationId('');
            setApplicationUrl('');
            setIsApplicationUrlLocked(false);
            setApplicationUrlError('');
            dispatch(fetchToolName(value?.value));
        }
    };

    const onClickGeneralContainer = useCallback(() => {
        setOpenGeneralContainer(!openGeneralContainer);
    }, [openGeneralContainer]);

    const onClickAccessPermissionsContainer = useCallback(() => {
        setOpenAccessPermissionsContainer(!openAccessPermissionsContainer);
    }, [openAccessPermissionsContainer]);

    const fetchRoles = async () => {
        try {
            const response = await getLeadershipRoles();
            setRoles(response.data.data);
        } catch {
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchToolName(selectedToolTypeOption?.value);
    }, [selectedToolTypeOption]);

    useEffect(() => {
        const fetchAdGroups = async () => {
            try {
                const response = await getAdGroupsByAppId(applicationName);
                if (response) {
                    setFetchedAdGroups(response[applicationName]?.adGroups);
                    setPermissions(response[applicationName]?.featureModules);
                }
            } catch (error) {
                logError('Error fetching ad groups:', error);
            }
        };

        if (applicationName) {
            fetchAdGroups();
        }
    }, [isGeneralContainerFormSaved, applicationName]);

    const getAdGroupOptions = (key: number) => {
        return (
            adGroupOptions[key]?.map(({ adGroup, adGroupId }) => ({
                label: adGroup,
                value: adGroupId,
            })) || []
        );
    };

    const getRolesForDropdown = (selectedRoles: string[]) => {
        return roles
            .filter(role => !selectedRoles.includes(String(role?.role)))
            .map(role => ({
                desc: role.role ?? '',
                label: role.roleId?.toString(),
                value: role.roleId?.toString(),
            }));
    };
    const getSelectedRole = (key: number) => {
        return (
            selectedRoles[key]?.map(({ label, value, desc }) => ({
                label,
                value,
                desc: desc as string,
            })) || []
        );
    };
    const fetchApplicationDetails = async (appId: string) => {
        try {
            const response = await getApplicationDetailsById(appId);
            const generalInfo = response.toolDetail[0];
            const geographicalInfo = response.geography;
            const regions = geographicalInfo.region;
            const clusters = geographicalInfo.cluster;
            const markets = geographicalInfo.market;
            const sites = geographicalInfo.site;
            const functions = response.functions;
            const subFunctions = response.subFunctions;
            const appOwnerName = getApplicationOwnerNameByEmail(generalInfo.toolOwner);

            setSelectedToolTypeOption(() => {
                const toolType = generalInfo.toolType?.toLowerCase() || '';
                const value = TOOL_TYPE_MAP[toolType] || TOOL_TYPE_MAP.other;

                return {
                    label: generalInfo.toolType,
                    value: value as string,
                };
            });
            setApplicationDescription(generalInfo.description);
            setApplicationTeam({ label: generalInfo.team, value: generalInfo.team });
            setApplicationOwnerName({
                label: appOwnerName?.fullName ?? '',
                value: appOwnerName?.userId ?? 0,
            });
            setApplicationRegion(
                regions.map((region: { geographyName: string; geographyId: string }) => ({
                    label: region.geographyName,
                    value: Number(region.geographyId),
                })),
            );
            setApplicationCluster(
                clusters.map((cluster: { geographyName: string; geographyId: string }) => ({
                    label: cluster.geographyName,
                    value: cluster.geographyId,
                })),
            );
            setApplicationMarket(
                markets.map((market: { geographyName: string; geographyId: string }) => ({
                    label: market.geographyName,
                    value: Number(market.geographyId),
                })),
            );
            setApplicationSite(
                sites.map((site: { geographyName: string; geographyId: string }) => ({
                    label: site.geographyName,
                    value: Number(site.geographyId),
                })),
            );
            setRoleFunction(
                functions.map((func: { functionName: string | null; functionId: number }) => ({
                    label: func.functionName ?? '',
                    value: Number(func.functionId),
                })),
            );
            setRoleSubFunction(
                subFunctions.map(
                    (subfunc: {
                        functionId: number;
                        subFunctionName: string | null;
                        subFunctionId: number;
                    }) => ({
                        label: subfunc.subFunctionName ?? '',
                        value: Number(subfunc.subFunctionId),
                    }),
                ),
            );
        } catch (error) {
            logError('Failed to fetch role details:', error);
        }
    };

    const handleRemoveRow = useCallback(
        (key: number) => {
            const roleToDelete = data.find(row => row.key == key)?.role;
            setIsCancelEditClicked(false);
            setIsEditButtonDisabled(false);
            setData(prevData => prevData.filter(row => row.key !== key));

            setAdGroupOptions(prev => {
                const updatedOptions = { ...prev };
                delete updatedOptions[key];
                return updatedOptions;
            });

            setSelectedAdGroups(prev => {
                const updatedSelected = { ...prev };
                delete updatedSelected[key];
                return updatedSelected;
            });

            if (!isSaveEditMode) {
                setPreviousData(data);
            }
            setRoleNamesWithoutPermissions(prevApps =>
                prevApps.filter(role => role !== roleToDelete),
            );
            setRoleNamesWithoutAdGroups(prevApps => prevApps.filter(role => role !== roleToDelete));
        },
        [data, selectedAdGroups, permissions, adGroupOptions], //selectedPreviousPermissions
    );

    const getDisabledStatusForCheck = (key: number) => {
        const selectedRow = data.filter(x => x.key === key)[0];
        const noPermissions = roleNamesWithoutPermissions.includes(selectedRow?.role || '');

        if (!selectedAdGroups[key] || selectedAdGroups[key].length === 0 || noPermissions) {
            return true;
        }
        return false;
    };

    const getSelectedAdGroups = (key: number) => {
        return (
            selectedAdGroups[key]?.map(({ label, value, desc }) => ({
                desc: desc,
                label,
                value,
            })) || []
        );
    };
    const handleSelectedPermission = useCallback(
        (key: number, permissionName: string, checked: boolean) => {
            setData(prevData =>
                prevData.map(row => {
                    if (row.key !== key) return row;

                    let updatedPermissionCount = row.selectedPermissionCount ?? 0;

                    if (checked) {
                        updatedPermissionCount += 1;
                    } else if (
                        row.selectedPermissionCount !== undefined &&
                        row.selectedPermissionCount !== null &&
                        row.selectedPermissionCount > 0
                    ) {
                        updatedPermissionCount -= 1;
                    }

                    let updatedColumnsToBeShown = row.columnsTobeShown ?? [];

                    if (checked) {
                        if (!updatedColumnsToBeShown.includes(permissionName)) {
                            updatedColumnsToBeShown.push(permissionName);
                        }
                    } else {
                        updatedColumnsToBeShown = updatedColumnsToBeShown.filter(
                            item => item !== permissionName,
                        );
                    }

                    return {
                        ...row,
                        [permissionName]: checked,
                        selectedPermissionCount: updatedPermissionCount,
                        columnsTobeShown: updatedColumnsToBeShown,
                    };
                }),
            );
            setPermissionInteractionTracker(prev => ({
                ...prev,
                [key]: true,
            }));
        },
        [data, permissions, selectedAdGroups],
    );

    useEffect(() => {
        data.forEach(obj => {
            const noPermissions = obj.selectedPermissionCount === 0;
            const manuallyUncheckedPermissions = permissionInteractionTracker?.[obj.key];

            if (obj.role !== '' && noPermissions && manuallyUncheckedPermissions) {
                setRoleNamesWithoutPermissions(prev => {
                    if (!prev.includes(obj.role)) {
                        return [...prev, obj.role];
                    }
                    return prev;
                });
            } else {
                setRoleNamesWithoutPermissions(prev => prev.filter(role => role !== obj.role));
            }
        });
    }, [data, selectedAdGroups, permissionInteractionTracker]);

    const handleApplyAdGroups = useCallback(
        (recordKey: number, selectedValues: OptionType[]) => {
            const _allRelatedAdGroups = getAdGroupOptions(recordKey);
            const filteredSelectedValues = _allRelatedAdGroups.filter(selectedValue =>
                selectedValues.some(adGroup => adGroup.value === selectedValue.value),
            );
            const selectedAdGroupIds = filteredSelectedValues.map(item => item.value);

            // Update selectedAdGroups state
            setSelectedAdGroups(prev => ({
                ...prev,
                [recordKey]: selectedValues,
            }));

            // Update data and roleNamesWithoutPermissions in one go
            setData(prevData => {
                const updatedData = prevData.map(row => {
                    if (row.key === recordKey) {
                        const updatedRow = {
                            ...row,
                            adgroup: selectedValues.map(v => v.label),
                        };

                        let permissionCount = 0;

                        permissions?.forEach(permission => {
                            const hasPermission = selectedAdGroupIds.some(adGroupId =>
                                adGroupOptions[recordKey]?.some(
                                    adGroup =>
                                        adGroup.adGroupId === adGroupId &&
                                        adGroup.toolFeature.some(
                                            p => p.toolFeatureName === permission.toolFeatureName,
                                        ),
                                ),
                            );
                            (updatedRow as any)[permission.toolFeatureName] = hasPermission
                                ? true
                                : null;

                            if (hasPermission) permissionCount++;
                        });

                        updatedRow.selectedPermissionCount = permissionCount;

                        return updatedRow;
                    }
                    return row;
                });

                return updatedData;
            });

            const _roleName = data.find(role => role.key === recordKey)?.role ?? '';
            const permissionCount =
                data.find(role => role.key === recordKey)?.selectedPermissionCount ?? 0;

            setRoleNamesWithoutPermissions(prev =>
                permissionCount === 0 && permissionInteractionTracker[recordKey]
                    ? [...new Set([...prev, _roleName])]
                    : prev.filter(name => name !== _roleName),
            );

            setResetKeys(prev => ({
                ...prev,
                [recordKey]: (prev[recordKey] ?? 0) + 1,
            }));

            // Update roleNamesWithoutAdGroups immediately
            const roleName = data.find(role => role.key === recordKey)?.role ?? '';
            setRoleNamesWithoutAdGroups(prev =>
                selectedValues.length === 0
                    ? [...new Set([...prev, roleName])]
                    : prev.filter(name => name !== roleName),
            );

            // Trigger check click if in save edit mode
            if (isSaveEditMode) {
                const updatedRow = data.find(row => row.key === recordKey);
                if (updatedRow) {
                    handleCheckClick(recordKey, updatedRow, isSaveEditMode);
                }
            }
        },
        [permissions, adGroupOptions, isSaveEditMode, data],
    );

    const handleToggleSwitch = useCallback((row: TableRow) => {
        const rowKey = row.key;
        setSelectedRow(row);
        setShowCheckedOnlyPerRow(prevState => {
            const newState = Object.keys(prevState).reduce(
                (acc, key) => {
                    acc[Number(key)] = false;
                    return acc;
                },
                {} as { [key: number]: boolean },
            );

            // Update the toggle state for the specific row
            const updatedToggleState = { ...newState, [rowKey]: !prevState[rowKey] };

            return updatedToggleState;
        });
    }, []);

    const handleRoleChange = (value: OptionType, record: TableRow) => {
        setSelectedRoles(prev => {
            const newSelectedRoles = { ...prev };
            newSelectedRoles[record.key] = [value];
            return newSelectedRoles;
        });

        // Update only the selected row
        setData(prevData =>
            prevData.map(row =>
                row.key === record.key
                    ? {
                          ...row,
                          role: value.desc ?? '',
                          roleId: String(value.value),
                          adgroup: [],
                      }
                    : row,
            ),
        );

        setAdGroupOptions(prev => {
            prev[record.key] = fetchedAdGroups;
            return prev;
        });

        checkIfSingleAdGroupForSelectedTool(record.key);
    };

    const checkIfSingleAdGroupForSelectedTool = (key: number) => {
        setAdGroupOptions(options => {
            const selectedToolAdGroupOptions = options[key];
            if (selectedToolAdGroupOptions?.length === 1) {
                const mappedAdGroups = selectedToolAdGroupOptions.map(({ adGroup, adGroupId }) => ({
                    label: adGroup,
                    value: adGroupId,
                }));
                handleApplyAdGroups(key, mappedAdGroups);
            }
            return options;
        });
    };

    const TableColumns: TableColumn[] = [
        {
            key: 'Roles',
            dataIndex: 'roles' as keyof TableRow,
            title: 'Roles',
            subTitle: '',
            width: '360px',
            sticky: 'left',
            externalStyles: { display: '', alignItems: 'center' },
            customExpandableColumn: true,
            render: (_value: any, record: any) => (
                <>
                    {record.isEditMode &&
                    !record.disableEditForApplicationRow &&
                    !isSaveEditMode ? (
                        <Flex align="center" justify="space-between" flex={1}>
                            <Tooltip
                                title={getSelectedRole(record.key)
                                    .map(group => group.label)
                                    .join(', ')}
                                placement="bottom"
                            >
                                <span>
                                    <TagSelector
                                        dataTestId="application-drop-down"
                                        id="application-drop-down"
                                        className={styles['application-tag-selector']}
                                        onChange={value => handleRoleChange(value, record)}
                                        options={getRolesForDropdown(data.map(row => row.role))}
                                        selectedOptions={getSelectedRole(record.key)}
                                        placeholder="Select Role"
                                        searchInput={{
                                            searchPlaceholder: 'Search Role',
                                            searchSize: 'S',
                                            searchWholeString: true,
                                        }}
                                        filterChipProps={{
                                            showCloseIcon: false,
                                            showTooltip: false,
                                        }}
                                        size="S"
                                        type="default"
                                        showCloseIcon={false}
                                        optionsContainerClassName={
                                            styles['row-edit-application-tag-selector-container']
                                        }
                                        portal={true}
                                    />
                                </span>
                            </Tooltip>
                        </Flex>
                    ) : (
                        <div
                            className={`${styles['application-cell-container']}`}
                            ref={el => {
                                if (el) {
                                    el.style.display = 'block';
                                    el.style.alignItems = 'center';
                                    el.style.gap = '4px';
                                }
                            }}
                        >
                            <div className={styles['header-title']}>
                                <span className={styles['application-permissions-cell-title']}>
                                    {record.roleId}
                                </span>
                                <Flex align="center" justify="space-between" flex={1} gap="170px">
                                    <span
                                        className={`${styles['application-permissions-cell-content']} override-display`}
                                        ref={el => {
                                            if (el) {
                                                el.style.display = 'auto';
                                                el.style.width = '120px';
                                                el.style.flexBasis = 'auto';
                                            }
                                        }}
                                    >
                                        {record.role}
                                    </span>
                                    {!record.isRowSaved ? (
                                        <Icon name="chevron-down" size="xm" color="neutrals-B300" />
                                    ) : (
                                        <CustomSwitch
                                            count={record.selectedPermissionCount}
                                            isOn={showCheckedOnlyPerRow[record.key] || false}
                                            toggleSwitch={() => handleToggleSwitch(record)}
                                            type="tick"
                                        />
                                    )}
                                </Flex>
                            </div>
                        </div>
                    )}
                </>
            ),
        },
    ];

    permissions?.forEach(permission => {
        TableColumns.push({
            key: String(permission.toolFeatureName),
            title: permission.toolFeatureName,
            subTitle: permission.toolModuleName,
            dataIndex: permission.toolFeatureName as keyof TableRow,
            width: '150px',
            sticky: undefined,
            externalStyles: { display: 'auto', alignItems: 'center' },
            customExpandableColumn: false,
            render: (_value, record) => {
                const selectedAdGroupIds =
                    selectedAdGroups[record.key]?.map(item => item.value) || [];
                const hasPermission = selectedAdGroupIds.some(adGroupId =>
                    adGroupOptions[record.key]?.some(
                        adGroup =>
                            adGroup.adGroupId === adGroupId &&
                            adGroup.toolFeature.some(
                                p => p.toolFeatureName === permission.toolFeatureName,
                            ),
                    ),
                );
                return (
                    <div className={styles['role_permissions_column']}>
                        {selectedAdGroupIds.length === 0 ? null : hasPermission ? (
                            <CheckBox
                                onChange={() =>
                                    handleSelectedPermission(
                                        record.key,
                                        permission.toolFeatureName,
                                        !record[permission.toolFeatureName],
                                    )
                                }
                                checked={record[permission.toolFeatureName] || false}
                                disabled={record.disableEditForApplicationRow} // Disable the checkbox if the row is not editable
                            />
                        ) : (
                            <Icon name="x-close" size="l" color="neutrals-B80" />
                        )}
                    </div>
                );
            },
        });
    });
    TableColumns.push(
        {
            key: 'adgroup',
            dataIndex: 'adgroup' as keyof TableRow,
            title: 'AD groups',
            subTitle: '',
            externalStyles: { display: '', alignItems: '' },
            width: '160px',
            //sticky: undefined,
            customExpandableColumn: false,
            render: (_value, record) => (
                <>
                    {record.isEditMode ? (
                        <Tooltip
                            title={getSelectedAdGroups(record.key)
                                .map(group => group.label)
                                .join(', ')}
                            placement="bottom"
                        >
                            <span>
                                <TagSelector
                                    key={`tag-selector-${record.key}-${resetKeys[record.key] ?? 0}`}
                                    confirmSelection={{
                                        onApply: selectedValues => {
                                            handleApplyAdGroups(record.key, selectedValues);
                                        },
                                        onCancel: () => {
                                            // bump the reset key to force re-render
                                            setResetKeys(prev => ({
                                                ...prev,
                                                [record.key]: (prev[record.key] ?? 0) + 1,
                                            }));
                                        },
                                    }}
                                    dataTestId="adgroup-drop-down"
                                    onChange={() => {}}
                                    id="adgroup-drop-down"
                                    options={getAdGroupOptions(record.key)}
                                    placeholder="Select AD Group"
                                    searchInput={{
                                        searchPlaceholder: 'Search AD Group',
                                        searchSize: 'S',
                                        searchWholeString: true,
                                    }}
                                    selectedOptions={getSelectedAdGroups(record.key)}
                                    size="S"
                                    type="checkbox"
                                    filterChipProps={{
                                        showCloseIcon: false,
                                        outerContainerClass:
                                            styles['row-edit-filterchip-container'],
                                        showTooltip: false,
                                    }}
                                    optionsContainerClassName={
                                        styles['row-edit-adgroup-tag-selector-container']
                                    }
                                    portal={true}
                                />
                            </span>
                        </Tooltip>
                    ) : (
                        getSelectedAdGroups(record.key).length > 0 && (
                            <Tooltip
                                title={getSelectedAdGroups(record.key)
                                    .map(group => group.label)
                                    .join(', ')}
                                placement="bottom"
                            >
                                <span>
                                    <FilterChip
                                        key={String(record.key)}
                                        label={`${getSelectedAdGroups(record.key)
                                            .map(group => group.label)
                                            .join(', ')}`}
                                        counter={
                                            getSelectedAdGroups(record.key).length > 0
                                                ? getSelectedAdGroups(record.key).length - 1
                                                : 0
                                        }
                                        showCloseIcon={false}
                                        outerContainerClass={
                                            styles['row-view-filterchip-container']
                                        }
                                        showTooltip={false}
                                    />
                                </span>
                            </Tooltip>
                        )
                    )}
                </>
            ),
        },
        {
            key: 'action',
            dataIndex: 'action' as keyof TableRow,
            title: 'Actions',
            subTitle: '',
            externalStyles: { display: 'auto', alignItems: '' },
            width: '96px',
            sticky: undefined,
            customExpandableColumn: false,
            render: (_value, record) => (
                <div className={styles['role_permissions_column']}>
                    {record.isEditMode && !isEditModeOn ? (
                        <Flex gap="8px">
                            <IconButton
                                size="Small"
                                icon="check"
                                onClick={() => handleCheckClick(record.key, record, isSaveEditMode)}
                                disabled={getDisabledStatusForCheck(record.key)}
                            />
                            <IconButton
                                size="Small"
                                icon="x-close"
                                onClick={() => handleRemoveRow(record.key)}
                                disabled={false}
                            />
                        </Flex>
                    ) : (
                        <IconButton
                            size="Small"
                            icon="trash-01"
                            onClick={() => handleRemoveRow(record.key)}
                            disabled={isEditModeOn}
                        />
                    )}
                </div>
            ),
        },
    );

    const handleCheckClick = useCallback(
        (key: number, record: TableRow, IsSaveEditMode: boolean) => {
            setIsEditButtonDisabled(false);
            setData(prevData =>
                prevData.map(row => {
                    if (row.key === key) {
                        let trueCount = 0;
                        const filteredPermissions: string[] = [];

                        // Loops through the TableColumns to check if the corresponding record value is true (for dynamically rendered columns to get permissions count)
                        TableColumns.forEach(column => {
                            const key = column.key;
                            if (record[key as keyof typeof record] === true) {
                                trueCount += 1;
                                filteredPermissions.push(key);
                            }
                        });

                        //If no permissions selected then add it to setRoleNamesWithoutPermissions
                        if (trueCount == 0) {
                            setRoleNamesWithoutPermissions(prev => [...prev, row.role]);
                        }

                        return {
                            ...row,
                            isEditMode: IsSaveEditMode,
                            disableEditForApplicationRow: !IsSaveEditMode,
                            isRowSaved: true,
                            isEditable: true,
                            selectedPermissionCount: trueCount, // Updates the selectedPermissionCount
                            columnsTobeShown: filteredPermissions,
                        };
                    }
                    return row;
                }),
            );

            setIsEditModeOn(isSaveEditMode);
            setIsSaveEditMode(false);

            // Enable Edit button on click of check button
            if (data.length && data[0]?.role && Object.keys(selectedAdGroups).length) {
                setShowEditButton(true);
            }

            // Collapse the expanded row
            tableRef.current?.toogleRowExpandCallBack(0, false);
        },
        [TableColumns],
    );

    useEffect(() => {
        // Check if there is data to determine the visibility of the edit button
        if (data.length > 0) {
            setIsAddNewRoleButtonClicked(true);
        } else {
            setShowEditButton(false);
            if (!isCancelEditClicked) {
                setIsAddNewRoleButtonClicked(false);
            }
        }
    }, [data, previousData, showCheckedOnlyPerRow]); // pageNumber, pageSize,
    useEffect(() => {
        const isGeneralInformationComplete =
            applicationName &&
            applicationId &&
            applicationDate &&
            applicationTeam.label != '' &&
            applicationOwnerName.label != '' &&
            applicationDescription &&
            roleFunction.length > 0 &&
            roleSubFunction.length > 0;

        if (isGeneralInformationComplete && !isGeneralContainerFormSaved) {
            setIsSaveButtonDisabled(false);
        } else {
            setIsSaveButtonDisabled(true);
            setShowDuplicateApplicationMessage(false);
        }
    }, [
        applicationName,
        applicationId,
        applicationVersion,
        applicationDate,
        applicationTeam,
        applicationOwnerName,
        applicationDescription,
        roleFunction,
        roleSubFunction,
        isGeneralContainerFormSaved,
    ]);

    // handle geographical tracking
    useEffect(() => {
        const hasMissingRequiredGeoInfo =
            applicationRegion.length === 0 ||
            (isGeoEnabled(geographyLevel.label, 'Cluster') && applicationCluster.length === 0) ||
            (isGeoEnabled(geographyLevel.label, 'Market') && applicationMarket.length === 0) ||
            (isGeoEnabled(geographyLevel.label, 'Site') && applicationSite.length === 0);
        const isDisabled = isGeoInfoContainerFormSaved || hasMissingRequiredGeoInfo;

        setIsGeoInfoSaveButtonDisabled(isDisabled);

        if (hasMissingRequiredGeoInfo) {
            setShowDuplicateApplicationMessage(false);
        }
    }, [
        applicationRegion,
        applicationCluster,
        applicationMarket,
        applicationSite,
        geographyLevel.label,
        isGeoInfoContainerFormSaved,
    ]);

    //handle live url tracking
    useEffect(() => {
        const hasUrlErrors =
            Boolean(applicationUrlError) ||
            Boolean(documentationUrlError) ||
            Boolean(thumbnailUrlError);

        const requiredOk = Boolean(selectedUrlActionOption) && applicationUrl?.trim().length > 0;

        // Disable if there are errors OR required fields aren’t satisfied
        setIsUrlInfoSaveButtonDisabled(
            isUrlInfoContainerFormSaved || !(requiredOk && !hasUrlErrors),
        );
    }, [
        selectedUrlActionOption,
        applicationUrl,
        applicationUrlError,
        documentationUrlError,
        thumbnailUrlError,
        isUrlInfoContainerFormSaved,
    ]);
    useEffect(() => {
        if (isSaveButtonDisabled) {
            if (isGeoInfoSaveButtonDisabled) {
                setIsSaveApplicationEnabled(true);
            }
            setIsSaveApplicationEnabled(false);
        } else {
            setIsSaveApplicationEnabled(false);
        }
    }, [isSaveButtonDisabled, isGeoInfoSaveButtonDisabled]);

    const getApplicationTeam = useCallback(() => {
        if (!applicationTeamList.team.length) {
            return [];
        }
        const convertedData = convertOptions(applicationTeamList.team as any, 'teamName', 'teamId');
        return convertedData;
    }, [applicationTeamList]);

    const getToolName = useCallback(() => {
        const toolData =
            (toolName as any)?.toolName ??
            (toolName as any)?.data?.data ??
            (toolName as any)?.data ??
            [];

        if (!Array.isArray(toolData) || !toolData.length) {
            return [];
        }
        const convertedData = convertOptions(toolData as any, 'toolName', 'toolId');
        return convertedData;
    }, [toolName]);

    const getGeneralInfoDropdownTools = useCallback((): GeneralInfoDropdownTool[] => {
        const toolData =
            (toolName as any)?.toolName ??
            (toolName as any)?.data?.data ??
            (toolName as any)?.data ??
            [];

        return Array.isArray(toolData) ? toolData : [];
    }, [toolName]);

    const getSelectedGeneralInfoTool = useCallback(
        (option?: OptionType | null): GeneralInfoDropdownTool | null => {
            if (!option) return null;

            return (
                getGeneralInfoDropdownTools().find(
                    tool =>
                        String(tool.toolId) === String(option.value) ||
                        String(tool.toolName) === String(option.label),
                ) ?? null
            );
        },
        [getGeneralInfoDropdownTools],
    );

    const applySelectedToolUrl = useCallback((selectedTool: GeneralInfoDropdownTool | null) => {
        const toolUrl = selectedTool?.toolUrl ?? (selectedTool as any)?.toolURL ?? null;
        const nextToolUrl = toolUrl ? String(toolUrl) : '';

        setApplicationUrl(nextToolUrl);
        setIsApplicationUrlLocked(Boolean(toolUrl));
        setApplicationUrlError(
            nextToolUrl && !validateUrl(nextToolUrl) ? 'Please enter a valid Application URL' : '',
        );
    }, []);

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
                }) => item?.userEmail.toLowerCase() === providedEmail.toLowerCase(),
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

    const onClickHandlerForGeneralInformation = async () => {
        setIsGeneralContainerFormSaved(true);
        setIsSaveButtonDisabled(true);
        setOpenGeneralContainer(false);
        if (isPMToolType) {
            // Performance Management skips Geographical Information
            setIsGeoInfoContainerFormSaved(true);
            setOpenUrlInfoContainer(true);
        } else {
            setOpenGeoInfoContainer(true);
        }
    };

    const onClickHandlerForGeoInformation = async () => {
        setIsGeoInfoContainerFormSaved(true);
        setIsGeoInfoSaveButtonDisabled(true);
        setOpenGeoInfoContainer(false);
        setOpenUrlInfoContainer(true);
    };

    const onClickHandlerURLInformation = async () => {
        setIsUrlInfoContainerFormSaved(true);
        setIsUrlInfoSaveButtonDisabled(true);
        setOpenUrlInfoContainer(false);
        setOpenToolPersonaSection(true);
        setOpenAccessPermissionsContainer(true);
        setIsSaveApplicationEnabled(true);
    };

    const getActionUrlId = (appActionUrlName: string) => {
        switch (appActionUrlName) {
            case 'openInIFrame':
                return 1;
            case 'OpenSameInstance':
                return 2;
            case 'openInNewTab':
                return 3;
        }
        return 0;
    };

    const getApplicationFeature = (inputData: TableRow[] = data): IToolFeature[] => {
        const applicationFeature: IToolFeature[] = [];
        inputData.forEach(obj => {
            Object.keys(obj).forEach(key => {
                if (
                    permissions.findIndex(element => element.toolFeatureName === key) > -1 &&
                    obj[key]
                ) {
                    applicationFeature.push({
                        roleId: Number(obj.roleId),
                        toolId: 0,
                        toolFeatureId: 0,
                        toolFeatureName: key,
                    });
                }
            });
        });
        return applicationFeature;
    };

    const getPersonaDescription = (personas: any[] = data): IPersonaDescription[] => {
        const personaDscription: IPersonaDescription[] = [];
        personas.forEach(p => {
            personaDscription.push({
                PersonaName: p.personaName,
                Description: p.description,
                ADGroupId: p.adGroupId ? String(p.adGroupId) : '',
                DataAccessId: p.dataAccessId ? String(p.dataAccessId) : '',
                RoleId: Array.isArray(p.roleIds) ? p.roleIds.join(',') : '',
            });
        });
        return personaDscription;
    };

    const extractPermissionId = (key: string) => {
        const parts = key.split('-');
        return Number(parts[2]);
    };

    const getPersonaPermissionMappings = (
        permissionToMap: PermissionMatrixRow[],
        toolPersonas: ToolPersona[],
    ): IPersonaPermissionMappings[] => {
        const personaPermissionMappings: IPersonaPermissionMappings[] = [];

        permissionToMap.forEach(row => {
            if (row.isPersonaSelectorRow) return;

            Object.entries(row.personaAccess).forEach(([personaId, isChecked]) => {
                if (typeof isChecked !== 'boolean') return;

                const persona = toolPersonas.find(p => String(p.personaId) === personaId);

                personaPermissionMappings.push({
                    PersonaName: persona?.personaName ?? '',
                    permissionId: extractPermissionId(String(row.key)),
                    isChecked,
                });
            });
        });
        return personaPermissionMappings;
    };
    const getAppOwnerEmail = (id: number) => {
        const owner = (applicationTeamList.ownerName as any[]).find(o => o.userId == id);
        return owner.userEmail;
    };

    const isAllSelected = (list: { label: string; value: number | string }[]) =>
        list.length === 1 && (list?.[0]?.value === -1 || list?.[0]?.value === 'ALL');

    type Option = {
        value: string | number;
        label?: string;
    };

    const getFinalIds = (
        selected: Option[],
        visibleOptions: Option[] | undefined,
        masterOptions: Option[] | undefined,
        isAllFlag: boolean,
        isDisabled: boolean,
    ): string => {
        if (isDisabled) {
            return masterOptions?.length ? masterOptions.map(opt => opt.value).join(',') : '';
        }

        if (!selected || selected.length === 0) return '';

        const isAll = isAllFlag || selected.some(item => item.value === -1 || item.value === 'ALL');

        if (isAll) {
            // ✅ 1st priority: master
            if (masterOptions?.length) {
                return masterOptions.map(opt => opt.value).join(',');
            }

            // ✅ 2nd priority: visible
            if (visibleOptions?.length) {
                return visibleOptions.map(opt => opt.value).join(',');
            }

            // ✅ FINAL FALLBACK
            return selected.map(item => item.value).join(',');
        }

        return selected.map(item => item.value).join(',');
    };

    const onSaveApplication = useCallback(async () => {
        try {
            setLoading(true);
            //  Validating url's in here
            let isValid = true;

            const trimmedAppUrl = applicationUrl?.trim();
            const trimmedDocUrl = documentationUrl?.trim();
            const trimmedThumbUrl = thumbnailUrl?.trim();

            // Validate Application URL
            if (trimmedAppUrl) {
                if (!validateUrl(trimmedAppUrl)) {
                    setApplicationUrlError('Please enter a valid Application URL');
                    isValid = false;
                } else {
                    setApplicationUrlError('');
                }
            } else {
                setApplicationUrl('');
                setApplicationUrlError('');
            }

            // Validate Documentation URL
            if (trimmedDocUrl) {
                if (!validateUrl(trimmedDocUrl)) {
                    setDocumentationUrlError('Please enter a valid Documentation URL');
                    isValid = false;
                } else {
                    setDocumentationUrlError('');
                }
            } else {
                setDocumentationUrl('');
                setDocumentationUrlError('');
            }

            // Validate Thumbnail URL
            if (trimmedThumbUrl) {
                if (!validateUrl(trimmedThumbUrl)) {
                    setThumbnailUrlError('Please enter a valid Thumbnail URL');
                    isValid = false;
                } else {
                    setThumbnailUrlError('');
                }
            } else {
                setThumbnailUrl('');
                setThumbnailUrlError('');
            }

            // Stop execution if any URL is invalid
            if (!isValid) {
                logWarning('Validation failed: One or more URLs are invalid');
                setLoading(false);
                return;
            }
            // Filter out roles with no permissions or no AD groups
            const validData = data.filter(
                row =>
                    !roleNamesWithoutPermissions.includes(row.role) &&
                    !roleNamesWithoutAdGroups.includes(row.role),
            );

            const toolData = {
                toolId: Number(applicationId) || 0,
                toolTypeId: Number(selectedToolTypeOption?.value),
                toolName: applicationName,
                version: applicationVersion,
                toolUrl: trimmedAppUrl,
                documentationUrl: trimmedDocUrl,
                thumbnailUrl: trimmedThumbUrl,
                team: String(applicationTeam.label),
                owner: String(getAppOwnerEmail(Number(applicationOwnerName.value))),
                toolDescription: applicationDescription,
                teamId: Number(applicationTeam.value) || 0,
                ownerEmail: String(getAppOwnerEmail(Number(applicationOwnerName.value))),
                region: getFinalIds(
                    applicationRegion,
                    regionDD,
                    allRegions,
                    isAllSelected(applicationRegion),
                    !isGeoEnabled(geographyLevel.label, 'Region'),
                ),

                cluster: getFinalIds(
                    applicationCluster,
                    clusterDD,
                    allClusters,
                    isAllSelected(applicationCluster),
                    !isGeoEnabled(geographyLevel.label, 'Cluster'),
                ),

                market: getFinalIds(
                    applicationMarket,
                    marketDD,
                    allMarkets,
                    isAllSelected(applicationMarket),
                    !isGeoEnabled(geographyLevel.label, 'Market'),
                ),

                site: getFinalIds(
                    applicationSite,
                    siteDD,
                    allSites,
                    isAllSelected(applicationSite),
                    !isGeoEnabled(geographyLevel.label, 'Site'),
                ),

                urlActionId: getActionUrlId(selectedUrlActionOption),
                urlActionName: selectedUrlActionOption,
                functionId: roleFunction.map(func => func.value).join(','),
                subFunctionId: roleSubFunction.map(subFunc => subFunc.value).join(','),
                toolFeatures: getApplicationFeature(validData),
                geographyLevelId: geographyLevel?.value || null,

                isRegionAll: isAllSelected(applicationRegion),
                isClusterAll: isAllSelected(applicationCluster),
                isMarketAll: isAllSelected(applicationMarket),
                isSiteAll: isAllSelected(applicationSite),
                isFunctionAll: isAllSelected(roleFunction),
                isSubFunctionAll: isAllSelected(roleSubFunction),
                description: getPersonaDescription(toolPersonas),
                personaPermissionMappings: getPersonaPermissionMappings(
                    permissionMatrixRows,
                    toolPersonas,
                ),
                reportCombinationDetails: getReportCombinationDetails(),
                reportCombinationSetups: getReportCombinationSetup(),
            };
            await saveApplicationDetails(toolData);
            setToggleToast(true);
            setShowEditButton(false);
            setIsSaveApplicationEnabled(false);
            setOpenCancelDialog(false);
            setTimeout(() => {
                navigate('/admin-hub/tool-management');
            }, 3000);
        } catch {
            setToggleErrorToast(true);
            setShowEditButton(true);
            setIsSaveApplicationEnabled(true);
        } finally {
            setLoading(false);
        }
        return true;
    }, [
        applicationId,
        applicationName,
        applicationVersion,
        applicationUrl,
        documentationUrl,
        thumbnailUrl,
        applicationTeam,
        applicationOwnerName,
        applicationDescription,
        applicationRegion,
        applicationCluster,
        applicationMarket,
        applicationSite,
        selectedUrlActionOption,
        selectedRoles,
        data,
        permissions,
        reportCombinations,
        permissionMatrixRows,
        toolPersonas,
    ]);

    const closeOpenDropdowns = useCallback(() => {
        if (typeof document !== 'undefined') {
            const activeElement = document.activeElement as HTMLElement | null;
            activeElement?.blur?.();
        }

        setDropdownCloseKey(prevKey => prevKey + 1);
    }, []);

    const openCancelConfirmationDialog = useCallback(() => {
        closeOpenDropdowns();
        setOpenCancelDialog(true);
    }, [closeOpenDropdowns]);

    const handleBackClick = (e: any) => {
        e.preventDefault();
        openCancelConfirmationDialog();
    };

    const onSaveClose = useCallback(() => {
        navigate('/admin-hub/tool-management');
        window.location.reload();
        return true;
    }, []);

    const options = [
        {
            label: 'Open in command centre',
            value: 'openInIFrame',
        },
        {
            label: 'Open in New Tab',
            value: 'openInNewTab',
        },
    ];
    const handleChangeRadio = (value: string) => {
        if (isUrlInfoContainerFormSaved) {
            setIsUrlInfoContainerFormSaved(false);
        }
        setSelectedUrlActionOption(value);
    };

    useEffect(() => {
        if (selectedToolName) {
            const selectedTool = getSelectedGeneralInfoTool(selectedToolName);
            applySelectedToolUrl(selectedTool);
        } else if (!applicationName) {
            setApplicationUrl('');
            setIsApplicationUrlLocked(false);
            setDocumentationUrl('');
            setThumbnailUrl('');
        }
    }, [applicationName, applySelectedToolUrl, getSelectedGeneralInfoTool, selectedToolName]);

    // Live-validate whenever the URL fields change (including prefilled values)
    useEffect(() => {
        const app = applicationUrl?.trim();
        const doc = documentationUrl?.trim();
        const thumb = thumbnailUrl?.trim();
        if (app) {
            setApplicationUrlError(validateUrl(app) ? '' : 'Please enter a valid Application URL');
        } else {
            setApplicationUrlError(''); // keep empty allowed until user types, or set a "required" msg if needed
        }

        if (doc) {
            setDocumentationUrlError(
                validateUrl(doc) ? '' : 'Please enter a valid Documentation URL',
            );
        } else {
            setDocumentationUrlError('');
        }

        if (thumb) {
            setThumbnailUrlError(validateUrl(thumb) ? '' : 'Please enter a valid Thumbnail URL');
        } else {
            setThumbnailUrlError('');
        }
    }, [applicationUrl, documentationUrl, thumbnailUrl]);

    const handleSavePersona = async () => {
        if (!personaName.trim() || !personaDescription.trim() || loading) return;

        try {
            setLoading(true);

            const toolId = Number(applicationId || applicationIdRef.current);

            if (!toolId) return;

            if (editingPersona && editingPersona.personaId > 0) {
                await editToolPersona({
                    personaId: editingPersona.personaId,
                    personaName: personaName.trim(),
                    description: personaDescription.trim(),
                    toolId,
                    adGroupId: editingPersona.adGroupId ?? null,
                    dataAccessId: editingPersona.dataAccessId ?? null,
                    roleIds:
                        editingPersona.roleIds && editingPersona.roleIds.length > 0
                            ? editingPersona.roleIds.join(',')
                            : null,
                });
                await refreshToolPersonas(toolId);
            } else if (editingPersona && editingPersona.personaId < 0) {
                setToolPersonas(prev =>
                    prev.map(persona =>
                        persona.personaId === editingPersona.personaId
                            ? {
                                  ...persona,
                                  personaName: personaName.trim(),
                                  description: personaDescription.trim(),
                              }
                            : persona,
                    ),
                );
            } else {
                const tempPersona: ToolPersona = {
                    personaId: -Date.now(),
                    personaName: personaName.trim(),
                    description: personaDescription.trim(),
                    adGroup: 'None',
                    adGroupId: null,
                    dataAccess: 'None',
                    dataAccessId: null,
                    roleIds: [],
                    rolesCount: 0,
                    isActive: true,
                };

                setToolPersonas(prev => [...prev, tempPersona]);
            }

            setIsPersonaDialogOpen(false);
            setEditingPersona(null);
            setPersonaName('');
            setPersonaDescription('');
        } catch {
            setToggleErrorToast(true);
        } finally {
            setLoading(false);
        }
    };

    const refreshToolPersonas = useCallback(
        async (toolId: number) => {
            try {
                setLoading(true);
                const response: any = await getToolPersonas(toolId);
                const personas = Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response)
                      ? response
                      : [];

                const mapped: ToolPersona[] = personas.map((p: any) => ({
                    personaId: p.personaId,
                    personaName: p.personaName,
                    description: p.description ?? p.personaDescription ?? '',
                    adGroup: p.adGroupName ?? p.adGroup ?? 'None',
                    dataAccess: p.accessName ?? p.dataAccess ?? 'None',
                    adGroupId: p.adGroupId ?? null,
                    dataAccessId: p.dataAccessId ?? null,
                    roleIds: p.roleIds ?? [],
                    rolesCount: p.roleCount ?? p.rolesCount ?? p.roleIds?.length ?? 0,
                    isActive: p.isActive ?? true,
                }));

                setToolPersonas(ensureDefaultToolPersonas(mapped));
            } catch {
                setToolPersonas(ensureDefaultToolPersonas([]));
                setToggleErrorToast(true);
            } finally {
                setLoading(false);
            }
        },
        [ensureDefaultToolPersonas],
    );

    useEffect(() => {
        const effectiveToolId = applicationId || applicationIdRef.current;

        if (effectiveToolId) {
            refreshToolPersonas(Number(effectiveToolId));
        }
    }, [applicationId, refreshToolPersonas]);

    useEffect(() => {
        setToolPersonas(prev => ensureDefaultToolPersonas(prev));
    }, [ensureDefaultToolPersonas, roles]);

    const handleCancelPersona = () => {
        setPersonaName('');
        setPersonaDescription('');
        setEditingPersona(null);
        setIsPersonaDialogOpen(false);
    };

    const handleEditPersona = (persona: ToolPersona) => {
        if (
            isLeadershipPersona(persona) ||
            isViewerPersona(persona) ||
            !isToolPersonaSectionEnabled
        ) {
            return;
        }
        setEditingPersona(persona);
        setPersonaName(persona.personaName);
        setPersonaDescription(persona.description);
        setIsPersonaDialogOpen(true);
    };

    const handleAddPersona = () => {
        setEditingPersona(null);
        setPersonaName('');
        setPersonaDescription('');
        setIsPersonaDialogOpen(true);
    };

    const handleAskDeletePersona = (persona: ToolPersona) => {
        if (
            isLeadershipPersona(persona) ||
            isViewerPersona(persona) ||
            !isToolPersonaSectionEnabled
        ) {
            return;
        }
        setPersonaToDelete(persona);
        setOpenDeletePersonaDialog(true);
    };

    const handleConfirmDeletePersona = async () => {
        if (!personaToDelete) return;

        try {
            if (personaToDelete.personaId > 0) {
                await deleteToolPersona({
                    personaId: personaToDelete.personaId,
                    targetPersonaId: null,
                });
            }

            setToolPersonas(prev => prev.filter(p => p.personaId !== personaToDelete.personaId));
        } catch {
            setToggleErrorToast(true);
        } finally {
            setOpenDeletePersonaDialog(false);
            setPersonaToDelete(null);
        }
    };

    const GEO_LEVEL_ORDER = ['Region', 'Cluster', 'Market', 'Site'] as const;
    type GeoLevel = (typeof GEO_LEVEL_ORDER)[number];

    const isGeoEnabled = (selectedLevel: string | undefined, fieldLevel: GeoLevel): boolean => {
        if (!selectedLevel || selectedLevel === 'All') return false;

        return (
            GEO_LEVEL_ORDER.indexOf(fieldLevel) <=
            GEO_LEVEL_ORDER.indexOf(selectedLevel as GeoLevel)
        );
    };

    const markGeoDirty = (isSaved: boolean, setSaved: (v: boolean) => void) => {
        if (isSaved) {
            setSaved(false);
        }
    };
    const isRegionSelectAllValue = (value?: string | number) =>
        value === -1 || ['ALL', 'GLOBAL'].includes(String(value).toUpperCase());

    const areAllRegionOptionsSelected = (
        selectedRegions: { label: string; value: number | string }[] = applicationRegion,
    ) => {
        if (regionDD.length === 0) return false;

        const selectedRegionValues = new Set(
            selectedRegions
                .filter(region => !isRegionSelectAllValue(region.value))
                .map(region => String(region.value)),
        );

        return regionDD.every(region => selectedRegionValues.has(String(region.value)));
    };

    const getRegionSelectedOptions = () => {
        const selectedRegionOptions = applicationRegion.map(region => ({
            label: region.label,
            value: String(region.value),
        }));

        if (areAllRegionOptionsSelected()) {
            return [ALL_OPTION_DD, ...selectedRegionOptions];
        }

        return selectedRegionOptions;
    };

    const getNormalizedRegionSelection = (
        changedOption: OptionType | undefined,
        isChecked: boolean | undefined,
        selectedTree: object[],
    ) => {
        const changedOptionIsAll = isRegionSelectAllValue(changedOption?.value);

        if (changedOptionIsAll) {
            return isChecked === false ? [] : regionDD;
        }

        const selectedOptions = selectedTree as { label: string; value: number | string }[];

        if (
            isChecked !== false &&
            selectedOptions.some(region => isRegionSelectAllValue(region.value))
        ) {
            return regionDD;
        }

        const selectedRegionValues = new Set(
            selectedOptions
                .filter(region => !isRegionSelectAllValue(region.value))
                .map(region => String(region.value)),
        );

        if (isChecked === false && changedOption?.value !== undefined) {
            selectedRegionValues.delete(String(changedOption.value));
        }

        return regionDD.filter(region => selectedRegionValues.has(String(region.value)));
    };

    const CLUSTER_ALL_OPTION = {
        label: 'ALL',
        value: 'ALL',
    };

    // ✅ AUTO-SELECT ALL WHEN DROPDOWNS ARE DISABLED
    useEffect(() => {
        if (!isGeoEnabled(geographyLevel.label, 'Cluster')) {
            setApplicationCluster([ALL_OPTION]);
        }
    }, [geographyLevel.label]);

    useEffect(() => {
        if (!isGeoEnabled(geographyLevel.label, 'Market')) {
            setApplicationMarket([ALL_OPTION]);
        }
    }, [geographyLevel.label]);

    useEffect(() => {
        if (!isGeoEnabled(geographyLevel.label, 'Site')) {
            setApplicationSite([ALL_OPTION]);
        }
    }, [geographyLevel.label]);

    const getReportGeographyOptions = (): OptionType[] => {
        if (!dialogReportLevel) return [];
        return geographyByLevelData
            .filter(
                (item: any) => item.geographyId !== 0 && String(item.name).toUpperCase() !== 'ALL',
            )
            .map((item: any) => ({
                label: String(item.name ?? item.geographyName ?? item),
                value: String(item.geographyId ?? item.id ?? item),
            }));
    };

    const handleAddReportCombination = () => {
        if (!dialogReportLevel || !dialogReportPeriod || dialogReportGeography.length === 0) return;

        const newCombination: ReportCombination = {
            key: Date.now(),
            reportLevel: String(dialogReportLevel.label),
            reportLevelId: String(dialogReportLevel.value),
            reportPeriod: String(dialogReportPeriod.label),
            reportPeriodId: String(dialogReportPeriod.value),
            reportGeography: dialogReportGeography.map(g => g.label).join(','),
            reportGeographyId: dialogReportGeography.map(g => g.value).join(','),
            personaRoles: reportCombinationPersonas.reduce(
                (acc, persona) => {
                    acc[String(persona.personaId)] = [];
                    return acc;
                },
                {} as Record<string, OptionType[]>,
            ),
            linkedForum: [],
        };
        setReportCombinations(prev => [...prev, newCombination]);
        setOpenReportCombinationSection(true);
        setIsAddReportCombinationDialogOpen(false);
        setDialogReportLevel(null);
        setDialogReportPeriod(null);
        setDialogReportGeography([]);
    };

    const handleCloseReportCombinationDialog = () => {
        setIsAddReportCombinationDialogOpen(false);
        setDialogReportLevel(null);
        setDialogReportPeriod(null);
        setDialogReportGeography([]);
    };

    const handleDeleteReportCombination = () => {
        setReportCombinations(prev => {
            const updated = prev.filter(c => c.key !== reportCombinationIdVal);
            if (updated.length === 0) setOpenReportCombinationSection(false);
            return updated;
        });
        setIsReportCombinationDeleteDialogOpen(false);
    };

    const handleDeleteReportCombinationConfirmDialog = (key: number) => {
        setIsReportCombinationDeleteDialogOpen(true);
        setReportCombinationIdVal(key);
    };

    const getLinkedForumItems = (): ForumItem[] => {
        if (activeLinkedForumRowKey === null) return [];

        const currentRow = reportCombinations.find(r => r.key === activeLinkedForumRowKey);

        if (!currentRow?.linkedForum) return [];

        return currentRow.linkedForum.map((f: any) => ({
            id: String(f.value),
            label: f.label,
            checked: true,
        }));
    };

    const handleLinkedForumSave = (payload: LinkedForumSavePayload) => {
        if (activeLinkedForumRowKey === null) return;

        const selectedForums = payload.selectedForums
            .filter(f => f.checked)
            .map(f => ({
                label: f.label,
                value: f.id,
            }));

        setReportCombinations(prev =>
            prev.map(c =>
                c.key === activeLinkedForumRowKey
                    ? {
                          ...c,
                          linkedForum: selectedForums,
                          forumPersonaMapping: payload.personaMapping,
                      }
                    : c,
            ),
        );
        setIsLinkedForumFlyoutOpen(false);
        setActiveLinkedForumRowKey(null);
    };

    const getReportRoleSelectionKey = (rowKey: number, personaId: string | number) =>
        `report-combination-${rowKey}-persona-${personaId}`;

    const getReportPersonaColumnKey = (personaId: string | number) => `persona-${personaId}-roles`;

    const getReportPersonaRoles = (
        record: ReportCombination,
        personaId: string | number,
    ): OptionType[] => record.personaRoles?.[String(personaId)] ?? [];

    const mapRoleItemToOption = (role: any): OptionType => ({
        label: String(role.roleName ?? role.label ?? role.name ?? role.roleId ?? ''),
        value: String(role.roleId ?? role.value ?? role.id ?? ''),
    });

    const closeRoleFlyout = () => {
        setIsRoleFlyoutOpen(false);
        setActiveReportRoleTarget(null);
    };

    const handleRoleFlyoutOpenChange = (value: boolean | ((prev: boolean) => boolean)) => {
        setIsRoleFlyoutOpen(prev => {
            const nextValue = typeof value === 'function' ? value(prev) : value;

            if (!nextValue) {
                setActiveReportRoleTarget(null);
            }

            return nextValue;
        });
    };

    const handleOpenReportRoleFlyout = (record: ReportCombination, persona: ToolPersona) => {
        const personaId = String(persona.personaId);
        const activeId = getReportRoleSelectionKey(record.key, personaId);
        const selectedRoleIds = getReportPersonaRoles(record, personaId).map(role =>
            String(role.value),
        );

        setRoleUserData([]);
        setIsRoleDataLoading(true);

        setActiveReportRoleTarget({
            rowKey: record.key,
            personaId,
            personaName: persona.personaName,
        });
        setActivePersonaId(activeId);
        setActivePersonaName(`${persona.personaName} Roles`);
        setShowSelectedOnly(false);
        setShowSelectedUsersOnly(false);
        setSearchKeyword('');

        setTempRoleSelection(prev => ({
            ...prev,
            [activeId]: selectedRoleIds,
        }));

        setSavedFlyOutData(prev => ({
            ...prev,
            [activeId]: {
                roles: prev[activeId]?.roles ?? [],
                users: prev[activeId]?.users ?? [],
            },
        }));

        setRolesAndUsers(prev => {
            const existingRoles = prev[activeId];

            if (!existingRoles) {
                return {
                    ...prev,
                    [activeId]: [],
                };
            }

            return {
                ...prev,
                [activeId]: [],
            };
        });

        setTimeout(() => {
            setIsRoleFlyoutOpen(true);
        }, 0);
    };

    const handleRoleFlyoutSave = () => {
        if (!activePersonaId) return;

        const currentRoles = rolesAndUsers[activePersonaId] ?? [];
        const selectedRoleItems = currentRoles.filter(role => role.checked);
        const selectedRoleIds = selectedRoleItems.map(role => String((role as any).roleId));

        setTempRoleSelection(prev => ({
            ...prev,
            [activePersonaId]: selectedRoleIds,
        }));

        setSavedFlyOutData(prev => ({
            ...prev,
            [activePersonaId]: {
                ...(prev[activePersonaId] ?? {}),
                roles: selectedRoleItems,
                users: prev[activePersonaId]?.users ?? [],
            },
        }));

        if (activeReportRoleTarget) {
            setReportCombinations(prev =>
                prev.map(combination =>
                    combination.key === activeReportRoleTarget.rowKey
                        ? {
                              ...combination,
                              personaRoles: {
                                  ...(combination.personaRoles ?? {}),
                                  [activeReportRoleTarget.personaId]:
                                      selectedRoleItems.map(mapRoleItemToOption),
                              },
                          }
                        : combination,
                ),
            );
            setActiveReportRoleTarget(null);
        } else {
            setPersonaRoleSelection(prev => ({
                ...prev,
                [activePersonaId]: selectedRoleIds,
            }));

            setToolPersonas(prev =>
                prev.map(persona =>
                    String(persona.personaId) === activePersonaId
                        ? {
                              ...persona,
                              roleIds: selectedRoleIds.map(Number),
                              rolesCount: selectedRoleIds.length,
                          }
                        : persona,
                ),
            );
        }

        setIsRoleFlyoutOpen(false);
    };

    const filteredRoles = (() => {
        const roles = rolesAndUsers[activePersonaId || ''] || [];
        if (showSelectedOnly) return roles.filter(item => item.checked);
        if (searchKeyword.trim() !== '' && !isRoleDataLoading) {
            const currentIds = new Set(groupedRoles.map((r: any) => String(r.roleId)));
            return roles.filter(item => currentIds.has(String((item as any).roleId)));
        }
        return roles;
    })();

    const reportCombinationColumns: any[] = [
        {
            key: 'reportLevel',
            dataIndex: 'reportLevel',
            title: 'Report Level',
            subTitle: '',
            width: '220px',
            externalStyles: { display: '', alignItems: 'center' },
            customExpandableColumn: false,
            render: (_value: any, record: ReportCombination) => (
                <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>
                        {record.reportLevel} - {record.reportPeriod}
                    </strong>
                    <Tag
                        size="L"
                        text={`${record.reportLevel} :`}
                        chipText={String(record.reportGeography.split(', ').length)}
                        onClick={() => {}}
                        tagBgColor="#F3FAF9"
                        tagBorderColor="#B0E7DF"
                        chipBgColor="#B0E7DF"
                        chipBorderColor="#B0E7DF"
                    />
                </Flex>
            ),
        },
        ...reportCombinationPersonas.map(persona => {
            const personaId = String(persona.personaId);

            return {
                key: getReportPersonaColumnKey(personaId),
                dataIndex: getReportPersonaColumnKey(personaId),
                title: `${persona.personaName}`,
                subTitle: '',
                width: '200px',
                externalStyles: { display: '', alignItems: 'center' },
                customExpandableColumn: false,
                render: (_value: any, record: ReportCombination) => {
                    const selectedRoles = getReportPersonaRoles(record, personaId);

                    return (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                            }}
                            onClick={event => {
                                const target = event.target as HTMLElement;
                                if (target.closest('[data-flyout-trigger="report-role-button"]')) {
                                    return;
                                }

                                handleOpenReportRoleFlyout(record, persona);
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '13px',
                                    color: selectedRoles.length > 0 ? '#333' : '#999',
                                }}
                            >
                                {selectedRoles.length > 0
                                    ? `Roles : ${selectedRoles.length} Selected`
                                    : 'Roles : Select'}
                            </span>
                            <div
                                data-flyout-trigger="report-role-button"
                                onClick={event => {
                                    event.stopPropagation();
                                    handleOpenReportRoleFlyout(record, persona);
                                }}
                            >
                                <Button
                                    variant="Subtle2"
                                    icon="chevron-down"
                                    iconSize="Medium"
                                    onClick={event => {
                                        event.stopPropagation();
                                        handleOpenReportRoleFlyout(record, persona);
                                    }}
                                />
                            </div>
                        </div>
                    );
                },
            };
        }),
        {
            key: 'linkedForum',
            dataIndex: 'linkedForum',
            title: 'Linked Forum',
            subTitle: '',
            width: '200px',
            externalStyles: { display: '', alignItems: 'center' },
            customExpandableColumn: false,
            render: (_value: any, record: ReportCombination) => (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                    }}
                    onClick={() => {
                        setActiveLinkedForumRowKey(record.key);
                        setIsLinkedForumFlyoutOpen(true);
                    }}
                >
                    {record.linkedForum?.length > 0 ? (
                        <Flex vertical gap={2}>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>
                                {record.linkedForum?.length > 0
                                    ? record.linkedForum.length > 1
                                        ? `${record.linkedForum[0]?.label} +${record.linkedForum.length - 1}`
                                        : record.linkedForum[0]?.label
                                    : 'Select Forum'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#1a8a6d' }}>Forum Active</span>
                        </Flex>
                    ) : (
                        <span style={{ fontSize: '13px', color: '#999' }}>Select Forum</span>
                    )}
                    <Button
                        variant="Subtle2"
                        icon="chevron-down"
                        iconSize="Large"
                        onClick={e => {
                            e.stopPropagation();
                            setActiveLinkedForumRowKey(record.key);
                            setIsLinkedForumFlyoutOpen(true);
                        }}
                    />
                </div>
            ),
        },
        {
            key: 'action',
            dataIndex: 'action',
            title: 'Actions',
            subTitle: '',
            width: '60px',
            externalStyles: { display: 'auto', alignItems: 'center' },
            customExpandableColumn: false,
            render: (_value: any, record: ReportCombination) => (
                <IconButton
                    size="Small"
                    icon="trash-01"
                    onClick={() => handleDeleteReportCombinationConfirmDialog(record.key)}
                />
            ),
        },
    ];

    const handlePermissionToggle = (
        rowKey: string | number,
        personaId: string,
        checked: boolean,
    ) => {
        setPermissionMatrixRows(prev =>
            applyPersonaPermissionToggleToRows(prev, rowKey, personaId, checked),
        );
    };

    const handleLevelChange = (option: any) => {
        if (isGeneralContainerFormSaved) {
            setIsGeneralContainerFormSaved(false);
        }
        if (isGeoInfoContainerFormSaved) {
            setIsGeoInfoContainerFormSaved(false);
        }
        setGeographyLevel(option);
    };

    const handleOwnerNameChange = (option: any) => {
        if (isGeneralContainerFormSaved) {
            setIsGeneralContainerFormSaved(false);
        }
        setApplicationOwnerName(option);
    };

    const handleTeamChange = (option: any) => {
        if (isGeneralContainerFormSaved) {
            setIsGeneralContainerFormSaved(false);
        }
        setApplicationTeam(option);
    };

    const handleToolNameChange = (option: OptionType) => {
        const isToolSwitched =
            String(selectedToolName?.value ?? '') !== String(option.value ?? '');

        setIsGeneralContainerFormSaved(false);
        setSelectedToolName(option);
        setApplicationId(String(option.value));
        setApplicationName(String(option.label));

        if (isToolSwitched) {
            setGeographyLevel({ label: '', value: '' });
            setApplicationRegion([]);
            setApplicationCluster([]);
            setApplicationMarket([]);
            setApplicationSite([]);
            setIsGeoInfoContainerFormSaved(false);
        }

        applySelectedToolUrl(getSelectedGeneralInfoTool(option));

        if (isUrlInfoContainerFormSaved) {
            setIsUrlInfoContainerFormSaved(false);
        }
    };

    return (
        <div className={styles['container']}>
            <div className={styles['header']}>
                <div className={styles['header-title-container']}>
                    <div className={styles['header-back-button']}>
                        <Link to="/admin-hub/tool-management" onClick={handleBackClick}>
                            {BackArrowIcon(8, 12)}
                        </Link>
                    </div>
                    <div className={styles['header-title']}>
                        <Label type="h2">Add New Tool</Label>
                        <div className={styles['space-v-8']} />
                        <Label type="body2">
                            <span className={styles['add-new-role-description']}>
                                Add a tool and define tool permissions here.
                            </span>
                        </Label>
                    </div>
                </div>
                <div className={styles['header-action-container']}>
                    <Button
                        text="Cancel"
                        variant="Secondary"
                        size="S"
                        onClick={openCancelConfirmationDialog}
                    />
                    <div className={styles['space-h-8']} />
                    <Button
                        text="Save Tool"
                        disabled={!isSaveApplicationEnabled}
                        variant="Primary"
                        size="S"
                        onClick={() => {
                            setOpenSaveDialog(true);
                        }}
                        loading={loading}
                    />
                </div>
            </div>
            <div className={styles['space-v-8']} />
            <div className={styles['space-v-8']} />
            <div className={styles['tool-type-header']}>
                <div className={styles['add-new-role-description']}>Select Tool Type</div>
                <div className={styles['radio-group']}>
                    {toolTypeOptions.map(option => (
                        <Radio
                            key={option.value}
                            label={option.label}
                            value={option.value}
                            checked={
                                selectedToolTypeOption.label?.toLowerCase() ===
                                option.label?.toLowerCase()
                            }
                            onChange={() => {
                                handleToolTypeChange(option);
                            }}
                        />
                    ))}
                </div>
            </div>

            {selectedToolTypeOption.value !== '' && (
                <>
                    {/* ===================== GENERAL INFORMATION ===================== */}
                    <ExpandableForm
                        key={`general-information-${dropdownCloseKey}`}
                        title={
                            <>
                                {isGeneralContainerFormSaved && (
                                    <Icon
                                        name="check-circle"
                                        size="xl"
                                        color="feedback-success-color"
                                    />
                                )}
                                <span>General Information</span>
                            </>
                        }
                        description="Add key tool details"
                        isOpen={openGeneralContainer}
                        content={
                            <div>
                                <Row gutter={{ xs: 24, md: 24 }}>
                                    <Col span={8}>
                                        <DropDown
                                            id="ApplicationName-dropdown"
                                            dropdown={{
                                                label: 'Tool Name',
                                                // options: toolNameOptions,
                                                options: getToolName(),
                                                required: true,
                                                reset: false,
                                                onChange: handleToolNameChange,
                                                selectedOptions: selectedToolName
                                                    ? [selectedToolName]
                                                    : [],
                                                placeholder: 'Select Tool Name',
                                            }}
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    </Col>

                                    <Col span={8}>
                                        <DropDown
                                            dropdown={{
                                                label: 'Function',
                                                type: 'checkbox',
                                                showSelectAll: true,
                                                required: true,
                                                selectAllOption: {
                                                    label: 'ALL',
                                                    value: 'all',
                                                },
                                                options: functionDD.map(f => ({
                                                    label: f.label,
                                                    value: String(f.value),
                                                })),
                                                selectedOptions: roleFunction.map(f => ({
                                                    ...f,
                                                    value: String(f.value),
                                                })),
                                                placeholder: 'Select Function',
                                                onChange: (_o, _c, tree) => {
                                                    setIsGeneralContainerFormSaved(false);
                                                    setRoleFunction(tree as any);
                                                },
                                            }}
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    </Col>

                                    <Col span={8}>
                                        <DropDown
                                            dropdown={{
                                                label: 'Sub-Function',
                                                type: 'checkbox',
                                                showSelectAll: true,
                                                required: true,
                                                selectAllOption: {
                                                    label: 'ALL',
                                                    value: 'all',
                                                },
                                                options: subfunctionDD.map(f => ({
                                                    label: f.label,
                                                    value: String(f.value),
                                                })),
                                                selectedOptions: roleSubFunction.map(f => ({
                                                    ...f,
                                                    value: String(f.value),
                                                })),
                                                placeholder: 'Select Sub-Function',
                                                onChange: (_o, _c, tree) => {
                                                    setIsGeneralContainerFormSaved(false);
                                                    setRoleSubFunction(tree as any);
                                                },
                                            }}
                                            searchInput={{
                                                searchPlaceholder: 'Search',
                                                searchSize: 'L',
                                                searchWholeString: true,
                                            }}
                                        />
                                    </Col>
                                </Row>

                                <Row
                                    gutter={{ xs: 24, sm: 24, md: 24, lg: 24 }}
                                    className={styles['form-category-heading']}
                                >
                                    <Col span={8}>
                                        <Flex className={styles['form-inputs-flex-col']}>
                                            <DropDown
                                                id="Team-dropdown"
                                                dropdown={{
                                                    label: 'Team',
                                                    options: getApplicationTeam(),
                                                    reset: false,
                                                    placeholder: 'Select Team',
                                                    required: true,
                                                    onChange: (option: any) => {
                                                        handleTeamChange(option);
                                                    },
                                                    selectedOptions:
                                                        applicationTeam &&
                                                        applicationTeam.value &&
                                                        applicationTeam.label
                                                            ? [
                                                                  {
                                                                      label: String(
                                                                          applicationTeam.label,
                                                                      ),
                                                                      value: String(
                                                                          applicationTeam.value,
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
                                            />
                                        </Flex>
                                    </Col>
                                    <Col span={8}>
                                        <Flex className={styles['form-inputs-flex-col']}>
                                            <DropDown
                                                id="OwnerName-dropdown"
                                                dropdown={{
                                                    label: 'Owner Name',
                                                    options: getApplicationOwnerName(),
                                                    reset: false,
                                                    placeholder: 'Select Owner Name',
                                                    required: true,
                                                    onChange: (option: any) => {
                                                        handleOwnerNameChange(option);
                                                    },
                                                    selectedOptions:
                                                        applicationOwnerName &&
                                                        applicationOwnerName.value &&
                                                        applicationOwnerName.label
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
                                            />
                                        </Flex>
                                    </Col>
                                    {!isPMToolType && (
                                        <Col span={8}>
                                            <Flex className={styles['form-inputs-flex-col']}>
                                                <DropDown
                                                    id="geo-dropdown"
                                                    dropdown={{
                                                        label: 'Geography level',
                                                        options: geographyLevelOptions.map(
                                                            item => ({
                                                                label: item.label,
                                                                value: String(item.value),
                                                            }),
                                                        ),
                                                        reset: false,
                                                        placeholder: 'Select Level',
                                                        required: true,
                                                        onChange: (option: any) => {
                                                            handleLevelChange(option);
                                                        },
                                                        selectedOptions: [
                                                            {
                                                                label: String(geographyLevel.label),
                                                                value: String(geographyLevel.value),
                                                            },
                                                        ],
                                                    }}
                                                    searchInput={{
                                                        searchPlaceholder: 'Search',
                                                        searchSize: 'L',
                                                        searchWholeString: true,
                                                    }}
                                                />
                                            </Flex>
                                        </Col>
                                    )}
                                </Row>

                                <Row
                                    gutter={{ xs: 24, sm: 24, md: 24, lg: 24 }}
                                    className={styles['form-category-heading']}
                                >
                                    <Col span={24}>
                                        <Flex className={styles['form-inputs-flex-col']}>
                                            <TextArea
                                                customheight={40}
                                                label={'Tool Description'}
                                                maxCharacters={300}
                                                placeholder="Enter Tool Description"
                                                value={applicationDescription}
                                                required={true}
                                                onChange={event => {
                                                    if (isGeneralContainerFormSaved) {
                                                        setIsGeneralContainerFormSaved(false);
                                                    }
                                                    setApplicationDescription(event.target.value);
                                                }}
                                            />                                            
                                        </Flex>
                                    </Col>
                                </Row>

                                <Flex
                                    justify={
                                        showDuplicateApplicationMessage
                                            ? 'space-between'
                                            : 'flex-end'
                                    }
                                    align="flex-start"
                                >
                                    {showDuplicateApplicationMessage && (
                                        <div className={styles['custom-message']}>
                                            <IoMdInformationCircleOutline
                                                className={styles['info-icon']}
                                            />
                                            <span className={styles['message']}>
                                                {DUPLICATE_APPLICATION_ERROR_MESSAGE}
                                            </span>
                                        </div>
                                    )}
                                    <Button
                                        text="Save & Continue"
                                        variant="Primary"
                                        size="L"
                                        onClick={onClickHandlerForGeneralInformation}
                                        disabled={isSaveButtonDisabled}
                                        // disabled={isGeneralContainerFormSaved}
                                    />
                                </Flex>
                            </div>
                        }
                        onClick={onClickGeneralContainer}
                        additionalContentInTitleContainer={
                            <Icon
                                name={openGeneralContainer ? 'chevron-up' : 'chevron-down'}
                                size="l"
                                color="neutrals-B800"
                            />
                        }
                    />

                    {/* ===================== GEOGRAPHICAL INFORMATION (hidden for Performance Management) ===================== */}
                    {!isPMToolType && (
                        <ExpandableForm
                            key={`geographical-information-${dropdownCloseKey}`}
                            title={
                                <>
                                    {isGeoInfoContainerFormSaved && (
                                        <Icon
                                            name="check-circle"
                                            size="xl"
                                            color="feedback-success-color"
                                        />
                                    )}
                                    <span>Geographical Information</span>
                                </>
                            }
                            description="Select all the locations where the tool will run"
                            isOpen={openGeoInfoContainer}
                            onClick={() => setOpenGeoInfoContainer(!openGeoInfoContainer)}
                            disabled={!isGeneralContainerFormSaved}
                            additionalContentInTitleContainer={
                                <Icon
                                    name={openGeoInfoContainer ? 'chevron-up' : 'chevron-down'}
                                    size="l"
                                    color="neutrals-B800"
                                />
                            }
                            content={
                                <div>
                                    <Row gutter={{ xs: 24, md: 24 }}>
                                        <Col span={8}>
                                            <DropDown
                                                dropdown={{
                                                    label: 'Region',
                                                    type: 'checkbox',
                                                    isDisabled: !isGeoEnabled(
                                                        geographyLevel.label,
                                                        'Region',
                                                    ),
                                                    isLabelInline: false,
                                                    showSelectAll: true,
                                                    selectAllOption: ALL_OPTION_DD,
                                                    options: regionDD.map(item => ({
                                                        label: item.label,
                                                        value: String(item.value),
                                                    })),
                                                    selectedOptions: getRegionSelectedOptions(),
                                                    size: 'L',
                                                    required: true,
                                                    reset: false,
                                                    placeholder: 'Select Region',

                                                    onChange: (
                                                        option: OptionType | undefined,
                                                        isChecked: boolean | undefined,
                                                        tree: object[],
                                                    ) => {
                                                        if (isGeoInfoContainerFormSaved) {
                                                            setIsGeoInfoContainerFormSaved(false);
                                                        }
                                                        const selectedTree =
                                                            getNormalizedRegionSelection(
                                                                option,
                                                                isChecked,
                                                                tree,
                                                            );
                                                        setIsGeoDataFetched(prevStatus => ({
                                                            ...prevStatus,
                                                            region: false,
                                                        }));

                                                        markGeoDirty(
                                                            isGeoInfoContainerFormSaved,
                                                            setIsGeoInfoContainerFormSaved,
                                                        );
                                                        setApplicationRegion(selectedTree);
                                                    },
                                                }}
                                                dropdownOptionsClassName="dropdown-options-custom"
                                                id="drop-down"
                                                searchInput={{
                                                    searchPlaceholder: 'Search',
                                                    searchSize: 'L',
                                                    searchWholeString: true,
                                                }}
                                            />
                                        </Col>

                                        <Col span={8}>
                                            <DropDown
                                                dropdown={{
                                                    label: 'Cluster',
                                                    type: 'checkbox',
                                                    isDisabled: !isGeoEnabled(
                                                        geographyLevel.label,
                                                        'Cluster',
                                                    ),
                                                    showSelectAll: true,
                                                    selectAllOption: {
                                                        label: 'ALL',
                                                        value: 'ALL',
                                                    },
                                                    placeholder: !isGeoEnabled(
                                                        geographyLevel.label,
                                                        'Cluster',
                                                    )
                                                        ? 'ALL'
                                                        : 'Select Cluster',
                                                    required: true,
                                                    reset: false,
                                                    options: !isGeoEnabled(
                                                        geographyLevel.label,
                                                        'Cluster',
                                                    )
                                                        ? [ALL_OPTION_DD]
                                                        : clusterDD.map(item => ({
                                                              label: item.label,
                                                              value: String(item.value),
                                                          })),
                                                    selectedOptions: !isGeoEnabled(
                                                        geographyLevel.label,
                                                        'Cluster',
                                                    )
                                                        ? [ALL_OPTION_DD]
                                                        : applicationCluster.length > 0
                                                          ? applicationCluster.map(cluster => ({
                                                                label: cluster.label,
                                                                value: String(cluster.value), // ✅ convert number → string
                                                            }))
                                                          : [],

                                                    size: 'L',

                                                    onChange: (_o, _c, tree: object[]) => {
                                                        if (
                                                            !isGeoEnabled(
                                                                geographyLevel.label,
                                                                'Cluster',
                                                            )
                                                        ) {
                                                            return;
                                                        }

                                                        if (isGeoInfoContainerFormSaved) {
                                                            setIsGeoInfoContainerFormSaved(false);
                                                        }
                                                        const selectedTree = tree as {
                                                            label: string;
                                                            value: number;
                                                        }[];
                                                        setIsGeoDataFetched(prevStatus => ({
                                                            ...prevStatus,
                                                            cluster: false,
                                                        }));

                                                        markGeoDirty(
                                                            isGeoInfoContainerFormSaved,
                                                            setIsGeoInfoContainerFormSaved,
                                                        );
                                                        setApplicationCluster(selectedTree);
                                                    },
                                                }}
                                                dropdownOptionsClassName="dropdown-options-custom"
                                                id="drop-down"
                                                searchInput={{
                                                    searchPlaceholder: 'Search',
                                                    searchSize: 'L',
                                                    searchWholeString: true,
                                                }}
                                            />
                                        </Col>

                                        <Col span={8}>
                                            <DropDown
                                                dropdown={{
                                                    label: 'Market',
                                                    type: 'checkbox',
                                                    isDisabled: !isGeoEnabled(
                                                        geographyLevel.label,
                                                        'Market',
                                                    ),
                                                    showSelectAll: true,
                                                    selectAllOption: CLUSTER_ALL_OPTION,
                                                    options: !isGeoEnabled(
                                                        geographyLevel.label,
                                                        'Market',
                                                    )
                                                        ? [ALL_OPTION_DD]
                                                        : marketDD.map(item => ({
                                                              label: item.label,
                                                              value: String(item.value),
                                                          })),
                                                    placeholder: !isGeoEnabled(
                                                        geographyLevel.label,
                                                        'Market',
                                                    )
                                                        ? 'ALL'
                                                        : 'Select Market',
                                                    required: true,
                                                    reset: false,

                                                    selectedOptions: !isGeoEnabled(
                                                        geographyLevel.label,
                                                        'Market',
                                                    )
                                                        ? [ALL_OPTION_DD] // ✅ force ALL in UI
                                                        : applicationMarket.length > 0
                                                          ? applicationMarket.map(market => ({
                                                                label: market.label,
                                                                value: String(market.value), // number → string
                                                            }))
                                                          : [],

                                                    size: 'L',

                                                    onChange: (_o, _c, tree: object[]) => {
                                                        if (isGeoInfoContainerFormSaved) {
                                                            setIsGeoInfoContainerFormSaved(false);
                                                        }
                                                        const selectedTree = tree as {
                                                            label: string;
                                                            value: number;
                                                        }[];
                                                        setIsGeoDataFetched(prevStatus => ({
                                                            ...prevStatus,
                                                            market: false,
                                                        }));
                                                        markGeoDirty(
                                                            isGeoInfoContainerFormSaved,
                                                            setIsGeoInfoContainerFormSaved,
                                                        );
                                                        setApplicationMarket(selectedTree);
                                                    },
                                                }}
                                                dropdownOptionsClassName="dropdown-options-custom"
                                                id="drop-down"
                                                searchInput={{
                                                    searchPlaceholder: 'Search',
                                                    searchSize: 'L',
                                                    searchWholeString: true,
                                                }}
                                            />
                                        </Col>
                                    </Row>

                                    <Row gutter={{ xs: 24, md: 24 }}>
                                        <Col span={8}>
                                            <DropDown
                                                dropdown={{
                                                    label: 'Site',
                                                    type: 'checkbox',
                                                    isDisabled: !isGeoEnabled(
                                                        geographyLevel.label,
                                                        'Site',
                                                    ),
                                                    showSelectAll: true,
                                                    selectAllOption: {
                                                        label: 'ALL',
                                                        value: 'ALL',
                                                    },
                                                    placeholder: !isGeoEnabled(
                                                        geographyLevel.label,
                                                        'Site',
                                                    )
                                                        ? 'ALL'
                                                        : 'Select Site',
                                                    required: true,
                                                    reset: false,
                                                    options: !isGeoEnabled(
                                                        geographyLevel.label,
                                                        'Site',
                                                    )
                                                        ? [ALL_OPTION_DD]
                                                        : siteDD.map(item => ({
                                                              label: item.label,
                                                              value: String(item.value),
                                                          })),

                                                    selectedOptions: !isGeoEnabled(
                                                        geographyLevel.label,
                                                        'Site',
                                                    )
                                                        ? [ALL_OPTION_DD] // ✅ force ALL in UI
                                                        : applicationSite.length > 0
                                                          ? applicationSite.map(site => ({
                                                                label: site.label,
                                                                value: String(site.value), // number → string
                                                            }))
                                                          : [],
                                                    size: 'L',

                                                    onChange: (_o, _c, tree: object[]) => {
                                                        if (isGeoInfoContainerFormSaved) {
                                                            setIsGeoInfoContainerFormSaved(false);
                                                        }
                                                        const selectedTree = tree as {
                                                            label: string;
                                                            value: number;
                                                        }[];
                                                        setIsGeoDataFetched(prevStatus => ({
                                                            ...prevStatus,
                                                            region: false,
                                                        }));

                                                        markGeoDirty(
                                                            isGeoInfoContainerFormSaved,
                                                            setIsGeoInfoContainerFormSaved,
                                                        );
                                                        setApplicationSite(selectedTree);
                                                        setApplicationSite(selectedTree);
                                                    },
                                                }}
                                                dropdownOptionsClassName="dropdown-options-custom"
                                                id="drop-down"
                                                searchInput={{
                                                    searchPlaceholder: 'Search',
                                                    searchSize: 'L',
                                                    searchWholeString: true,
                                                }}
                                            />
                                        </Col>
                                    </Row>

                                    <Flex
                                        justify={
                                            showDuplicateApplicationMessage
                                                ? 'space-between'
                                                : 'flex-end'
                                        }
                                        align="flex-start"
                                    >
                                        {showDuplicateApplicationMessage && (
                                            <div className={styles['custom-message']}>
                                                <IoMdInformationCircleOutline
                                                    className={styles['info-icon']}
                                                />
                                                <span className={styles['message']}>
                                                    {DUPLICATE_APPLICATION_ERROR_MESSAGE}
                                                </span>
                                            </div>
                                        )}
                                        <Button
                                            text="Save & Continue"
                                            variant="Primary"
                                            size="L"
                                            onClick={onClickHandlerForGeoInformation}
                                            disabled={isGeoInfoSaveButtonDisabled}
                                        />
                                    </Flex>
                                </div>
                            }
                        />
                    )}
                </>
            )}
            {selectedToolTypeOption.value !== '' && (
                <ExpandableForm
                    key={`url-information-${dropdownCloseKey}`}
                    title={
                        <>
                            {isUrlInfoContainerFormSaved && (
                                <Icon
                                    name="check-circle"
                                    size="xl"
                                    color="feedback-success-color"
                                />
                            )}
                            <span>URL Information</span>
                        </>
                    }
                    description="Add or view the direct link to access this tool online for easy sharing and reference."
                    isOpen={openUrlInfoContainer}
                    content={
                        <div>
                            <div className={styles['form-category-heading']}>
                                <Label type="h2">
                                    <span className={styles['form-category-heading-typography']}>
                                        URL Action
                                    </span>
                                </Label>
                            </div>
                            <Row
                                gutter={{ xs: 24, sm: 24, md: 24, lg: 24 }}
                                className={styles['form-category-heading']}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        gap: '12px',
                                        paddingLeft: '12px',
                                    }}
                                >
                                    {options.map(option => (
                                        <Radio
                                            key={option.value}
                                            label={option.label}
                                            value={option.value}
                                            checked={selectedUrlActionOption === option.value}
                                            onChange={() => handleChangeRadio(option.value)}
                                        />
                                    ))}
                                </div>
                            </Row>
                            <div className={styles['form-category-heading']}>
                                <Label type="h2">
                                    <span className={styles['form-category-heading-typography']}>
                                        URL Links
                                    </span>
                                </Label>
                            </div>
                            <Row
                                gutter={{ xs: 24, sm: 24, md: 24, lg: 24 }}
                                className={styles['form-category-heading']}
                            >
                                <Col span={8}>
                                    <Flex className={styles['form-inputs-flex-col']}>
                                        <InputField
                                            label={'Tool URL'}
                                            placeholder="Enter tool URL"
                                            value={applicationUrl}
                                            required={true}
                                            isDisabled={isApplicationUrlLocked}
                                            onChange={event => {
                                                if (isApplicationUrlLocked) return;

                                                if (isUrlInfoContainerFormSaved) {
                                                    setIsUrlInfoContainerFormSaved(false);
                                                }

                                                const value = event.target.value;
                                                setApplicationUrl(value);

                                                const trimmedValue = value.trim();

                                                // ✅ Only validate after user types enough characters
                                                if (trimmedValue.length > 5) {
                                                    if (!validateUrl(trimmedValue)) {
                                                        setApplicationUrlError(
                                                            'Please enter a valid Application URL',
                                                        );
                                                    } else {
                                                        setApplicationUrlError('');
                                                    }
                                                } else {
                                                    setApplicationUrlError('');
                                                }
                                            }}
                                            captionMessage={applicationUrlError}
                                            captionMessageType={
                                                applicationUrlError ? 'error' : 'default'
                                            }
                                        />{' '}
                                    </Flex>
                                </Col>
                                <Col span={8}>
                                    <Flex className={styles['form-inputs-flex-col']}>
                                        <InputField
                                            label={'Documentation URL'}
                                            placeholder="Enter Documentation URL"
                                            value={documentationUrl}
                                            required={false}
                                            isDisabled={false}
                                            onChange={event => {
                                                if (isUrlInfoContainerFormSaved) {
                                                    setIsUrlInfoContainerFormSaved(false);
                                                }
                                                const value = event.target.value;
                                                setDocumentationUrl(value);
                                                const trimmedValue = value.trim();
                                                if (trimmedValue && !validateUrl(value)) {
                                                    setDocumentationUrlError(
                                                        'Please enter a valid Documentation URL',
                                                    );
                                                } else {
                                                    setDocumentationUrlError('');
                                                }
                                            }}
                                            captionMessage={documentationUrlError} // show error message
                                            captionMessageType={
                                                documentationUrlError ? 'error' : 'default'
                                            }
                                        />
                                    </Flex>
                                </Col>
                                <Col span={8}>
                                    <Flex className={styles['form-inputs-flex-col']}>
                                        <InputField
                                            label={'Thumbnail URL'}
                                            placeholder="Enter Thumbnail URL"
                                            value={thumbnailUrl}
                                            required={false}
                                            isDisabled={false}
                                            onChange={event => {
                                                if (isUrlInfoContainerFormSaved) {
                                                    setIsUrlInfoContainerFormSaved(false);
                                                }
                                                const value = event.target.value;
                                                setThumbnailUrl(value);
                                                const trimmedValue = value.trim();
                                                if (trimmedValue && !validateUrl(value)) {
                                                    setThumbnailUrlError(
                                                        'Please enter a valid Thumbnail URL',
                                                    );
                                                } else {
                                                    setThumbnailUrlError('');
                                                }
                                            }}
                                            captionMessage={thumbnailUrlError} // show error message
                                            captionMessageType={
                                                thumbnailUrlError ? 'error' : 'default'
                                            }
                                        />
                                    </Flex>
                                </Col>
                            </Row>
                            <Flex justify={'flex-end'} align="flex-start">
                                <Button
                                    text="Save & Continue"
                                    variant="Primary"
                                    size="L"
                                    onClick={onClickHandlerURLInformation}
                                    disabled={isUrlInfoSaveButtonDisabled}
                                />
                            </Flex>
                        </div>
                    }
                    disabled={
                        isPMToolType ? !isGeneralContainerFormSaved : !isGeoInfoContainerFormSaved
                    }
                    onClick={() => setOpenUrlInfoContainer(!openUrlInfoContainer)} // Toggle the section on click
                    additionalContentInTitleContainer={
                        <Icon
                            name={openUrlInfoContainer ? 'chevron-up' : 'chevron-down'}
                            size="l"
                            color="neutrals-B800"
                        />
                    }
                />
            )}

            {selectedToolTypeOption.value !== '' && (
                <ExpandableForm
                    key={`tool-personas-${dropdownCloseKey}`}
                    title={<span>Tool Personas</span>}
                    description=" Add all the persona’s related to the tool"
                    isOpen={openToolPersonaSection}
                    disabled={!isToolPersonaSectionEnabled}
                    onClick={() => setOpenToolPersonaSection(v => !v)}
                    additionalContentInTitleContainer={
                        <Flex align="center" gap="8px">
                            <Button
                                text="Add Persona"
                                variant="Secondary"
                                size="M"
                                disabled={!isToolPersonaSectionEnabled}
                                onClick={() => {
                                    handleAddPersona();
                                }}
                            />
                            <Icon
                                name={openToolPersonaSection ? 'chevron-up' : 'chevron-down'}
                                size="l"
                                color="neutrals-B800"
                            />
                        </Flex>
                    }
                    content={
                        <div>
                            <Row gutter={[16, 16]} align={'stretch'}>
                                {toolPersonas
                                    .filter(persona => persona.isActive === true)
                                    .map(persona => {
                                        const isHovered = hoveredPersonaId === persona.personaId;

                                        return (
                                            <Col
                                                xs={24}
                                                sm={12}
                                                md={8}
                                                lg={6}
                                                key={persona.personaId}
                                                className={styles['persona-card-col']}
                                            >
                                                <div
                                                    className={styles['persona-card']}
                                                    onMouseEnter={() =>
                                                        setHoveredPersonaId(persona.personaId)
                                                    }
                                                    onMouseLeave={() => {
                                                        setHoveredPersonaId(null);
                                                    }}
                                                    style={{
                                                        border: '1px solid #E5E7EB',
                                                        borderRadius: '12px',
                                                        padding: '16px',
                                                        background: '#FFFFFF',
                                                        minHeight: '220px',
                                                        position: 'relative',
                                                        cursor: 'default',
                                                    }}
                                                >
                                                    {isHovered && (
                                                        <Flex
                                                            gap="8px"
                                                            style={{
                                                                position: 'absolute',
                                                                top: '12px',
                                                                right: '12px',
                                                                zIndex: 2,
                                                            }}
                                                        >
                                                            <IconButton
                                                                size="Small"
                                                                icon="edit-02"
                                                                onClick={() =>
                                                                    handleEditPersona(persona)
                                                                }
                                                                disabled={
                                                                    isLeadershipPersona(persona) ||
                                                                    isViewerPersona(persona) ||
                                                                    !isToolPersonaSectionEnabled
                                                                }
                                                            />
                                                            <IconButton
                                                                size="Small"
                                                                icon="trash-01"
                                                                onClick={() =>
                                                                    handleAskDeletePersona(persona)
                                                                }
                                                                disabled={
                                                                    isLeadershipPersona(persona) ||
                                                                    isViewerPersona(persona) ||
                                                                    !isToolPersonaSectionEnabled
                                                                }
                                                            />
                                                        </Flex>
                                                    )}

                                                    <div style={{ paddingRight: '72px' }}>
                                                        <Label type="h3">
                                                            {persona.personaName}
                                                        </Label>
                                                        <div style={{ height: '8px' }} />
                                                        <Label type="body2">
                                                            {persona.description}
                                                        </Label>
                                                    </div>

                                                    <div style={{ height: '16px' }} />

                                                    <Flex vertical gap="12px">
                                                        <div
                                                            className={
                                                                styles['persona-dropdown-option']
                                                            }
                                                        >
                                                            <DropDown
                                                                id={`persona-ad-group-${persona.personaId}`}
                                                                dropdown={{
                                                                    isLabelInline: true,
                                                                    label: 'AD Group ',
                                                                    options:
                                                                        getPersonaAdGroupOptions(),
                                                                    reset: false,
                                                                    placeholder: 'Select AD Group',
                                                                    isDisabled:
                                                                        isLeadershipPersona(
                                                                            persona,
                                                                        ),
                                                                    onChange: (
                                                                        option: OptionType,
                                                                    ) =>
                                                                        handlePersonaFieldChange(
                                                                            persona.personaId,
                                                                            'adGroup',
                                                                            option,
                                                                        ),
                                                                    selectedOptions:
                                                                        getPersonaSelectedAdGroup(
                                                                            persona,
                                                                        ),
                                                                }}
                                                            />
                                                        </div>
                                                        <div
                                                            className={
                                                                styles['persona-dropdown-option']
                                                            }
                                                        >
                                                            <DropDown
                                                                id={`persona-data-access-${persona.personaId}`}
                                                                dropdown={{
                                                                    isLabelInline: true,
                                                                    label: 'Data Access ',
                                                                    options:
                                                                        personaDataAccessOptions,
                                                                    reset: false,
                                                                    placeholder:
                                                                        'Select Data Access',
                                                                    isDisabled:
                                                                        isLeadershipPersona(
                                                                            persona,
                                                                        ),
                                                                    onChange: (
                                                                        option: OptionType,
                                                                    ) =>
                                                                        handlePersonaFieldChange(
                                                                            persona.personaId,
                                                                            'dataAccess',
                                                                            option,
                                                                        ),
                                                                    selectedOptions:
                                                                        getPersonaSelectedDataAccess(
                                                                            persona,
                                                                        ),
                                                                }}
                                                            />
                                                        </div>

                                                        {!isPMToolType && (
                                                            <div
                                                                style={{
                                                                    border: '1px solid #E5E7EB',
                                                                    borderRadius: '0.25rem',
                                                                    padding: '8px 12px',
                                                                    background: '#FFFFFF',
                                                                    opacity: isLeadershipPersona(
                                                                        persona,
                                                                    )
                                                                        ? 0.5
                                                                        : isHovered
                                                                          ? 1
                                                                          : 0.85,
                                                                    cursor: isLeadershipPersona(
                                                                        persona,
                                                                    )
                                                                        ? 'not-allowed'
                                                                        : 'default',
                                                                }}
                                                                onClick={() => {
                                                                    handleRoleChipClick(persona);
                                                                }}
                                                            >
                                                                <Label type="body2">
                                                                    {getPersonaRoleChipText(
                                                                        persona,
                                                                    )}
                                                                </Label>
                                                            </div>
                                                        )}
                                                    </Flex>
                                                </div>
                                            </Col>
                                        );
                                    })}
                            </Row>
                        </div>
                    }
                />
            )}

            {isPMToolType && selectedToolTypeOption.value !== '' && (
                <ExpandableForm
                    key={`report-combination-${dropdownCloseKey}`}
                    title={<span>Report Combination Setup</span>}
                    description="Manage report level and period combinations"
                    isOpen={openReportCombinationSection}
                    disabled={!isToolPersonaSectionEnabled}
                    onClick={() => {
                        setOpenReportCombinationSection(v => !v);
                    }}
                    additionalContentInTitleContainer={
                        <Flex align="center" gap="8px">
                            <div onClick={e => e.stopPropagation()}>
                                <Button
                                    text="Add Report Combination"
                                    variant="Secondary"
                                    size="M"
                                    disabled={!isToolPersonaSectionEnabled}
                                    onClick={() => {
                                        dispatch(forumLevel());
                                        dispatch(forumPeriod());
                                        setIsAddReportCombinationDialogOpen(true);
                                    }}
                                />
                            </div>
                            <Icon
                                name={
                                    openReportCombinationSection ? 'chevron-up' : 'chevron-down'
                                }
                                size="l"
                                color="neutrals-B800"
                            />
                        </Flex>
                    }
                    content={
                        reportCombinations.length > 0 ? (
                            <Table
                                columns={reportCombinationColumns}
                                data={reportCombinations}
                                expandableRows={false}
                            />
                        ) : (
                            <></>
                        )
                    }
                />
            )}

            {selectedToolTypeOption.value !== '' && (
                <ExpandableForm
                    key={`access-permissions-${dropdownCloseKey}`}
                    title={<span>Access & Permissions</span>}
                    description="Assign permissions to personas for each module and sub-modules"
                    isOpen={openAccessPermissionsContainer}
                    content={
                        <div className={styles['permissionTableWrapper']}>
                            <PermissionMatrixTable
                                personas={toolPersonas
                                    .filter(p => p.isActive)
                                    .map(p => ({
                                        personaId: String(p.personaId),
                                        personaName: p.personaName,
                                    }))}
                                rows={permissionMatrixRows}
                                mode="edit"
                                onPermissionToggle={(rowKey, personaId, checked) => {
                                    handlePermissionToggle(rowKey, personaId, checked);
                                }}
                            />
                        </div>
                    }
                    disabled={!isUrlInfoContainerFormSaved}
                    onClick={onClickAccessPermissionsContainer}
                    additionalContentInTitleContainer={
                        <>
                            <Icon
                                name={
                                    openAccessPermissionsContainer ? 'chevron-up' : 'chevron-down'
                                }
                                size="l"
                                color="neutrals-B800"
                            />
                        </>
                    }
                />
            )}

            <Dialog
                className={styles['tool-confirmation-dialog']}
                content={`Are you sure you want to leave without saving the tool or continue adding?`}
                isOpen={openCancelDialog}
                onClose={() => setOpenCancelDialog(false)}
                onPrimaryButtonClick={onSaveClose}
                onSecondaryButtonClick={() => setOpenCancelDialog(false)}
                primaryButtonText="Leave without Saving"
                secondaryButtonText="Continue Adding"
                title="Unsaved Tool"
            />
            <Toast
                type="Success"
                message={`Tool: ${applicationName} has been added successfully`}
                mode="Top Right"
                distance="x5l"
                toggle={toggleToast}
                timer={5000}
                onCloseToast={() => setToggleToast(false)}
            />
            <Toast
                type="Error"
                message="Failed to send request. Please try again."
                mode="Top Right"
                distance="x5l"
                toggle={toggleErrorToast}
                timer={3000}
                onCloseToast={() => setToggleErrorToast(false)}
            />

            <Dialog
                className={styles['tool-confirmation-dialog']}
                content={`You are about to add a new ${selectedToolTypeOption?.label?.toLowerCase()} using the provided details. Once saved, this tool will be available in command centre. Please confirm to proceed.`}

                isOpen={openSaveDialog}
                onClose={() => {
                    setOpenSaveDialog(false);
                }}
                onPrimaryButtonClick={() => {
                    onSaveApplication();
                    setOpenSaveDialog(false);
                }}
                onSecondaryButtonClick={() => {
                    setOpenSaveDialog(false);
                }}
                primaryButtonText="Save Tool"
                secondaryButtonText="Continue Adding"
                title="Save New Tool?"
            />
            
            {toolTypeChangeDialog && (
                <Dialog
                    content={`Are you sure you want to change tool type? Switching the tool type will reset all entered information. Your current inputs will be lost.`}
                    isOpen={toolTypeChangeDialog}
                    onClose={() => setToolTypeChangeDialog(false)}
                    onPrimaryButtonClick={() => {
                        setSelectedToolTypeOption(pendingToolTypeOption);
                        ResetOnToolTypeChange();

                        //  call API with NEW type
                        dispatch(fetchToolName(pendingToolTypeOption.value));

                        setToolTypeChangeDialog(false);
                    }}
                    onSecondaryButtonClick={() => setToolTypeChangeDialog(false)}
                    primaryButtonText="Change Tool Type"
                    secondaryButtonText="Keep Current"
                    title="Change Tool Type"
                />
            )}

            <Dialog
                title="Tool Persona"
                isOpen={isPersonaDialogOpen}
                onClose={handleCancelPersona}
                primaryButtonText="Save Persona"
                secondaryButtonText="Cancel"
                onPrimaryButtonClick={handleSavePersona}
                onSecondaryButtonClick={handleCancelPersona}
                isPrimaryDisabled={!personaName.trim() || !personaDescription.trim()}
                content={
                    <Flex vertical gap="16px">
                        <InputField
                            label="Persona Name"
                            placeholder="Enter Persona Name"
                            required
                            value={personaName}
                            onChange={e => setPersonaName(e.target.value)}
                        />
                        <InputField
                            label="Persona Description"
                            placeholder="Enter Persona Description"
                            required
                            value={personaDescription}
                            onChange={e => setPersonaDescription(e.target.value)}
                        />
                    </Flex>
                }
            />
            <Dialog
                title="Delete Persona"
                content="Are you sure you want to delete selected persona? All roles mapped to the persona will lose access to the tool"
                isOpen={openDeletePersonaDialog}
                onClose={() => {
                    setOpenDeletePersonaDialog(false);
                    setPersonaToDelete(null);
                }}
                primaryButtonText="Delete"
                secondaryButtonText="Move Roles to another Persona"
                onPrimaryButtonClick={handleConfirmDeletePersona}
                onSecondaryButtonClick={handleOpenMoveRolesDialog}
            />
            <Dialog
                title="Move Roles to Another Persona"
                isOpen={openMoveRolesDialog}
                onClose={() => {
                    setOpenMoveRolesDialog(false);
                    setMoveRolesTargetPersonaId('');
                }}
                primaryButtonText="Move Roles & Delete Persona"
                secondaryButtonText="Go Back"
                onPrimaryButtonClick={handleMoveRolesAndDeletePersona}
                onSecondaryButtonClick={handleGoBackToDeleteDialog}
                isPrimaryDisabled={!moveRolesTargetPersonaId}
                content={
                    <Flex vertical gap="16px" style={{ height: 280 }}>
                        <DropDown
                            id="move-roles-persona-dropdown"
                            dropdown={{
                                label: 'Select Persona',
                                options: toolPersonas
                                    .filter(
                                        persona =>
                                            persona.isActive === true &&
                                            persona.personaId !== personaToDelete?.personaId,
                                    )
                                    .map(persona => ({
                                        label: persona.personaName,
                                        value: String(persona.personaId),
                                    })),
                                reset: false,
                                placeholder: 'Select Persona',
                                onChange: (option: OptionType) => {
                                    setMoveRolesTargetPersonaId(String(option.value));
                                },
                                selectedOptions: moveRolesTargetPersonaId
                                    ? [
                                          {
                                              label:
                                                  toolPersonas.find(
                                                      persona =>
                                                          String(persona.personaId) ===
                                                          moveRolesTargetPersonaId,
                                                  )?.personaName ?? '',
                                              value: moveRolesTargetPersonaId,
                                          },
                                      ]
                                    : [],
                            }}
                            searchInput={{
                                searchPlaceholder: 'Search Persona',
                                searchSize: 'L',
                                searchWholeString: true,
                            }}
                        />
                    </Flex>
                }
            />
            <Dialog
                className={styles['add-report-combination-dialog']}
                title="Add Report Combination"
                description="Select report details to add a combination in the report combination table."
                isOpen={isAddReportCombinationDialogOpen}
                onClose={handleCloseReportCombinationDialog}
                primaryButtonText="Add Report Combination"
                secondaryButtonText="Cancel"
                onPrimaryButtonClick={handleAddReportCombination}
                onSecondaryButtonClick={handleCloseReportCombinationDialog}
                isPrimaryDisabled={
                    !dialogReportLevel || !dialogReportPeriod || dialogReportGeography.length === 0
                }
                content={
                    <Flex
                        vertical
                        gap="16px"
                        style={{ paddingBottom: '3.5rem' }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <DropDown
                                    id="dialog-report-level"
                                    dropdown={{
                                        label: 'Report Level',
                                        options: reportLevelOptions,
                                        placeholder: 'Select Report Level',
                                        required: true,
                                        reset: false,
                                        onChange: (opt: OptionType) => {
                                            setDialogReportLevel(opt);
                                            setDialogReportGeography([]);
                                            dispatch(getGeographyByLevel(Number(opt.value)));
                                        },
                                        selectedOptions: dialogReportLevel
                                            ? [dialogReportLevel]
                                            : [],
                                    }}
                                    searchInput={{
                                        searchPlaceholder: 'Search',
                                        searchSize: 'L',
                                        searchWholeString: true,
                                    }}
                                />
                            </Col>
                            <Col span={12}>
                                <DropDown
                                    id="dialog-report-period"
                                    dropdown={{
                                        label: 'Report Period',
                                        options: reportPeriodOptions,
                                        placeholder: 'Select Report Period',
                                        required: true,
                                        reset: false,
                                        onChange: (opt: OptionType) => {
                                            setDialogReportPeriod(opt);
                                        },
                                        selectedOptions: dialogReportPeriod
                                            ? [dialogReportPeriod]
                                            : [],
                                    }}
                                    searchInput={{
                                        searchPlaceholder: 'Search',
                                        searchSize: 'L',
                                        searchWholeString: true,
                                    }}
                                />
                            </Col>
                        </Row>
                        <DropDown
                            id="dialog-report-geography"
                            dropdown={{
                                label: 'Report Geography',
                                type: 'checkbox',
                                options: getReportGeographyOptions(),
                                placeholder: 'Select Report Geography',
                                required: true,
                                reset: false,
                                showSelectAll: true,
                                isDisabled: !dialogReportLevel,
                                onChange: (_opt: OptionType, _checked: boolean, tree: object[]) => {
                                    setDialogReportGeography(tree as OptionType[]);
                                },
                                selectedOptions: dialogReportGeography,
                            }}
                            searchInput={{
                                searchPlaceholder: 'Search',
                                searchSize: 'L',
                                searchWholeString: true,
                            }}
                        />
                    </Flex>
                }
            />

            <Dialog
                content={`Are you sure you want to delete this report combination? All roles and users will loose access to this combination of report.`}
                isOpen={isReportCombinationDeleteDialogOpen}
                onClose={() => setIsReportCombinationDeleteDialogOpen(false)}
                onPrimaryButtonClick={handleDeleteReportCombination}
                onSecondaryButtonClick={() => setIsReportCombinationDeleteDialogOpen(false)}
                primaryButtonText="Delete"
                secondaryButtonText="Don't Delete"
                title="Delete Report Combination"
                color="neutrals-B800"
            />

            <RoleSelectionFlyoutForum
                flyoutOpen={isRoleFlyoutOpen}
                setIsFlyoutOpen={handleRoleFlyoutOpenChange}
                userFlyoutOpen={false}
                isRoleDataLoading={isRoleDataLoading}
                items={filteredRoles}
                hasMoreItems={showSelectedOnly ? false : hasMoreRoles}
                isLoadingMore={showSelectedOnly ? false : isLoadingMoreRoles}
                onLoadMore={showSelectedOnly ? () => {} : handleLoadMoreRoles}
                isRoleOnlyMode={true}
                totalUsers={savedFlyOutData[activePersonaId || '']?.users || []}
                heading={`Select ${activePersonaName}`}
                subHeading=""
                userFlyoutHeading="Select Users"
                userFlyoutSubHeading="Search and select users for this role"
                showSearch
                searchPlaceholder="Search Roles"
                onSearchChange={value => {
                    const searchValue = Array.isArray(value) ? value.join(' ') : value;
                    setSearchKeyword(searchValue);
                }}
                onUserFlyoutBack={() => {
                    setUsersFlyoutOpen(false);
                }}
                dropdownFilter={dropdownFilters}
                onItemToggle={(id, type) => {
                    if (type === 'Roles' && activePersonaId) {
                        setRolesAndUsers(prev => {
                            const list = prev[activePersonaId] ?? [];

                            const updated = list.map((role: any) =>
                                String(role.roleId) === String(id)
                                    ? { ...role, checked: !role.checked }
                                    : role,
                            );

                            return {
                                ...prev,
                                [activePersonaId]: updated,
                            };
                        });
                    } else if (activePersonaId) {
                        const currentUsers = usersFlyoutData[activePersonaId] ?? [];

                        const updatedUsers = currentUsers.map((user: any) =>
                            user.userEmail === id || user.id === id
                                ? { ...user, checked: !user.checked }
                                : user,
                        );

                        setUsersFlyoutData(prev => ({
                            ...prev,
                            [activePersonaId]: updatedUsers,
                        }));

                        // setTempUsersSelection(prev => ({
                        //     ...prev,
                        //     [activePersonaId]: updatedUsers,
                        // }));
                    }
                }}
                onSelectUserCounter={(item: any) => {
                    setUsersFlyoutOpen(true);
                    if (!activePersonaId) return;

                    const personaRoles = rolesAndUsers[activePersonaId] ?? [];
                    const selectedRole = personaRoles.find(
                        (role: any) => String(role.roleId) === String(item.roleId),
                    );

                    const personaSavedUsers = savedFlyOutData[activePersonaId]?.users ?? [];

                    const updatedUsers =
                        selectedRole?.users.map((user: any) => {
                            const savedUser = personaSavedUsers.find(
                                (saved: any) =>
                                    String(saved.roleId) === String(selectedRole.roleId) &&
                                    saved.userEmail === user.userEmail,
                            );

                            return {
                                ...user,
                                roleId: selectedRole.roleId,
                                checked: savedUser?.checked ?? true,
                                id: user.userEmail,
                                numberOfUsers: 0,
                            };
                        }) ?? [];

                    setUsersFlyoutData(prev => ({
                        ...prev,
                        [activePersonaId]: updatedUsers,
                    }));

                    // setTempUsersSelection(prev => ({
                    //     ...prev,
                    //     [activePersonaId]: updatedUsers,
                    // }));

                    setSavedFlyOutData(prev => {
                        const personaData = prev[activePersonaId] ?? {
                            roles: [],
                            users: [],
                        };

                        const alreadyExists = personaData.users.some(
                            (user: any) => String(user.roleId) === String(selectedRole?.roleId),
                        );

                        if (alreadyExists) return prev;

                        return {
                            ...prev,
                            [activePersonaId]: {
                                ...personaData,
                                users: [
                                    ...personaData.users,
                                    ...updatedUsers.map((user: any) => ({
                                        ...user,
                                        checked: true,
                                    })),
                                ],
                            },
                        };
                    });
                }}
                showSelectAll={!showSelectedOnly && filteredRoles.length > 0}
                isAllSelected={
                    (rolesAndUsers[activePersonaId ?? ''] ?? []).length > 0 &&
                    (rolesAndUsers[activePersonaId ?? ''] ?? []).every(role => role.checked)
                }
                onSelectAllToggle={() => {
                    const personaId = activePersonaId ?? '';
                    const list = rolesAndUsers[personaId] ?? [];
                    const shouldSelectAll = !list.every(role => role.checked);

                    const updated = list.map((role: any) => ({
                        ...role,
                        checked: shouldSelectAll,
                    }));

                    setRolesAndUsers(prev => ({
                        ...prev,
                        [personaId]: updated,
                    }));
                }}
                primaryBtnProps={{
                    text: 'Save',
                    variant: 'Primary',
                    onClick: handleRoleFlyoutSave,
                }}
                secondaryBtnProps={{
                    disabled: false,
                    onClick: closeRoleFlyout,
                    text: 'Cancel',
                    variant: 'Secondary',
                }}
                cancelBtnProps={{
                    disabled: false,
                    onClick: () => setShowSelectedOnly(prev => !prev),
                    text: showSelectedOnly
                        ? 'Show All'
                        : `View Selected (${getSelectedRolesCount()})`,
                    variant: 'Subtle2',
                }}
                primaryBtnPropsUsersFlyout={{
                    text: 'Save',
                    variant: 'Primary',
                    onClick: () => {
                        if (!activePersonaId) return;

                        setSavedFlyOutData(prev => {
                            const personaData = prev[activePersonaId] || {
                                roles: [],
                                users: [],
                            };

                            const personaUsersFromState = usersFlyoutData[activePersonaId] ?? [];

                            return {
                                ...prev,
                                [activePersonaId]: {
                                    ...personaData,
                                    users: personaUsersFromState,
                                },
                            };
                        });

                        setUsersFlyoutOpen(false);
                    },
                }}
                secondaryBtnPropsUserFlyout={{
                    text: 'Cancel',
                    variant: 'Secondary',
                    onClick: () => setUsersFlyoutOpen(false),
                }}
                cancelBtnPropsUsersFlyout={{
                    disabled: false,
                    onClick: () => setShowSelectedUsersOnly(prev => !prev),
                    text: showSelectedUsersOnly
                        ? 'Show All'
                        : `View Selected (${getSelectedUsersCount()})`,
                    variant: 'Subtle2',
                }}
                userDropdownFilter={userLocationFilter}
            />
            <LinkedForumFlyout
                flyoutOpen={isLinkedForumFlyoutOpen}
                onClose={() => {
                    setIsLinkedForumFlyoutOpen(false);
                    setActiveLinkedForumRowKey(null);
                }}
                forums={getLinkedForumItems()}
                forumPersonaTypes={forumPersonaTypes.length > 0 ? forumPersonaTypes : undefined}
                initialPersonaMapping={
                    reportCombinations.find(r => r.key === activeLinkedForumRowKey)
                        ?.forumPersonaMapping || {}
                }
                personaOptions={
                    forumPersonaToolPersonaOptions.length > 0
                        ? forumPersonaToolPersonaOptions
                        : toolPersonas
                              .filter(p => p.isActive)
                              .map(p => ({ label: p.personaName, value: String(p.personaId) }))
                }
                functionOptions={functionDD.map(f => ({ label: f.label, value: String(f.value) }))}
                subFunctionOptions={subfunctionDD.map(f => ({
                    label: f.label,
                    value: String(f.value),
                }))}
                geographyLevelOptions={geographyLevelOptions.map(f => ({
                    label: f.label,
                    value: String(f.value),
                }))}
                onSave={handleLinkedForumSave}
            />
            <Dialog
                title="Confirm Deletion"
                content="Are you sure you want to delete this report combination? This action cannot be undone."
                isOpen={openDeleteCombinationDialog}
                onClose={() => setOpenDeleteCombinationDialog(false)}
                primaryButtonText="Delete"
                secondaryButtonText="Don't Delete"
                onPrimaryButtonClick={handleDeleteReportCombination}
                onSecondaryButtonClick={() => setOpenDeleteCombinationDialog(false)}
            />
        </div>
    );
}

export default AddNewToolScreen;