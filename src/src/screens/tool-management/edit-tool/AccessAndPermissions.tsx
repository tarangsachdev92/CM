import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Flex, Skeleton, Tooltip } from 'antd';
import {
    Button,
    Dialog,
    Icon,
    TagSelector,
    FilterChip,
    CheckBox,
    Toast,
    IconButton,
    ToolTip,
    InputField,
    DropDown,
} from 'konnect-react-components';
import CustomSwitch from '../../../components/atoms/custom-switch/CustomSwitch';
import {
    AppDispatch,
    RootState,
    fetchRoleData,
    fetchRolePermissionsForApplication,
} from '../../../store';
import {
    deleteApplicationRoleMapping,
    updateApplicationRolePermissionsMapping,
} from '../../../services/permission';
import styles from './EditToolScreen.module.scss';
import type {
    ILocationRolesData,
    IRoleToolPermissions,
    ToolAdGroup,
    ToolPermissionDetails,
    ToolPersona,
} from '../../../types/response';
import type { OptionType } from '../../../types/common';
import type { IRolePermissionsMappingPayload } from '../../../types/request';
import {
    isLeadershipPersona,
    isViewerPersona,
    logError,
    toCommaSeparated,
    trimTextAndAppendTrail,
} from '../../../utils/helpers';
import { ROLE_SELECTION_PAGE_SIZE, ROLE_SELECTION_PAGE_NUMBER } from '../../../utils/constants';
import { useParams } from 'react-router-dom';
import { ExpandableForm } from '../../../components';
import PersonaCard from '../../../components/molecules/tool-persona-edit-card/ToolPersonaEditCard';
import {
    deleteToolPersona,
    editToolPersonaAccessPermissions,
    getAdgroupPermissionMapping,
    getRoleSelection,
    getToolAccessAndPermissionsById,
    getToolPersonaConfiguration,
    getToolPersonas,
} from '../../../services/application';
import { getLeadershipRoles } from '../../../services/roles';
import PermissionMatrixTable, {
    PermissionMatrixRow,
} from '../../../components/molecules/permission-matrix/PermissionMatrixTable';
import {
    FlyoutCheckboxItemForum,
    RoleSelectionFlyoutForum,
} from '../../../components/organisms/role-selection-flyout/RoleSelectionFlyoutForum';
import { flushSync } from 'react-dom';

interface TableRow {
    key: number;
    application?: string;
    applicationId?: string;
    role: string;
    roleId: string;
    adgroup: string[];
    action?: string;
    appFeatureName?: string;
    appModuleName?: string;
    isEditMode: boolean;
    selectedPermissionCount?: number;
    disableEditForApplicationRow: boolean;
    isRowSaved: boolean;
    permissions?: ToolPermissionDetails[];
    isPermissionEditable?: boolean;
}

interface TableRowRef {
    rowRecord: TableRow;
}

interface AccessAndPermissionsProps {
    onAccessDataChange: (data: any) => void;
    toolType: string;
    title: string;
    resetTrigger: number;
}

export default function AccessAndPermissions({
    onAccessDataChange,
    toolType,
    resetTrigger,
}: AccessAndPermissionsProps) {
    const dispatch = useDispatch<AppDispatch>();

    const { isLoading } = useSelector((state: RootState) => state.applicationManagement);
    const { existingRoleToolPermissions, otherRoleToolPermssions } = useSelector(
        (state: RootState) => state.applicationManagement.roleAppPermissions,
    );

    const [expandToolCardSection, setExpandToolCardSection] = useState<boolean>(false);
    const [expandAccessPermSection, setExpandAccessPermSection] = useState<boolean>(false);

    const [tableRowData, setTableRowData] = useState<TableRow[]>([]);
    const [rolePermissions, setRolePermissions] = useState<ToolPermissionDetails[]>([]);
    const [, setPaginatedData] = useState<TableRow[]>([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [isAddNewRoleButtonDisabled, setIsAddNewRoleButtonDisabled] = useState<boolean>(false);
    const [isEditModeOn, setIsEditModeOn] = useState<boolean>(false);
    const [selectedAdGroups, setSelectedAdGroups] = useState<Record<number, OptionType[]>>({});
    const [adGroupOptions, setAdGroupOptions] = useState<Record<number, ToolAdGroup[]>>({});
    const [selectedRoles, setSelectedRoles] = useState<Record<number, OptionType[]>>({});
    const [showRoleDeletionToast, setShowRoleDeletionToast] = useState<boolean>(false);
    const [showRoleUpdationToast, setShowRoleUpdationToast] = useState<boolean>(false);
    const [showDialogForAddNewRole, setShowDialogForAddNewRole] = useState<boolean>(false);
    const [showDialogForRoleDeletion, setShowDialogForRoleDeletion] = useState<boolean>(false);
    const [showDialogForSaveEditChanges, setShowDialogForSaveEditChanges] =
        useState<boolean>(false);
    const [showDialogForCancelEditChanges, setShowDialogForCancelEditChanges] =
        useState<boolean>(false);
    const [editedRoleIds, setEditedRoleIds] = useState(new Set<string>());
    const [buttonLoadingState, setButtonLoadingState] = useState<boolean>(false);

    const tableRef = useRef<TableRowRef>({} as TableRowRef);
    const currentRecordRef = useRef<{ currentRecord: Partial<TableRow> }>({ currentRecord: {} });

    const applicationParams = useParams<{ appId: string; appName: string }>();
    const [adGroupInteractionTracker, setAdGroupInteractionTracker] = useState<
        Record<number, boolean>
    >({});
    const [resetKeys, setResetKeys] = useState<Record<string, number>>({});
    const [permissionInteractionTracker, setPermissionInteractionTracker] = useState<
        Record<number, boolean>
    >({});

    const [toolPersonas, setToolPersonas] = useState<ToolPersona[]>([]);
    const [isPersonaDialogOpen, setIsPersonaDialogOpen] = useState(false);
    const [editingPersona, setEditingPersona] = useState<ToolPersona | null>(null);
    const [personaName, setPersonaName] = useState('');
    const [personaDescription, setPersonaDescription] = useState('');
    const [personaToDelete, setPersonaToDelete] = useState<ToolPersona | null>(null);
    const [openDeletePersonaDialog, setOpenDeletePersonaDialog] = useState(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [toggleErrorToast, setToggleErrorToast] = useState<boolean>(false);
    const [roles, setRoles] = useState<ILocationRolesData[]>([]);
    const [moveRolesTargetPersonaId, setMoveRolesTargetPersonaId] = useState<string>('');
    const [openMoveRolesDialog, setOpenMoveRolesDialog] = useState(false);
    const [permissionMatrixRows, setPermissionMatrixRows] = useState<PermissionMatrixRow[]>([]);
    const [toolPermissionsData, setToolPermissionsData] = useState<any>(null);
    const [isPersonaDirty, setIsPersonaDirty] = useState(false);
    const [originalPersonas, setOriginalPersonas] = useState<ToolPersona[]>([]);
    const [isPersonaInitialized, setIsPersonaInitialized] = useState(false);
    const [isRoleFlyoutOpen, setIsRoleFlyoutOpen] = useState(false);
    const [activePersonaName, setActivePersonaName] = useState<string | null>(null);
    const [adGroups, setAdGroups] = useState<any[]>([]);
    const [dataAccessList, setDataAccessList] = useState<any[]>([]);
    const [, setPersonaRoles] = useState<any[]>([]);
    const [personaRoleSelection, setPersonaRoleSelection] = useState<Record<string, string[]>>({});
    const [originalPersonaRoleSelection, setOriginalPersonaRoleSelection] = useState<
        Record<string, string[]>
    >({});

    const [activePersonaId, setActivePersonaId] = useState<string | null>(null);

    const [selectedFilters, setSelectedFilters] = useState({
        function: [],
        subfunction: [],
        geographyLevel: [],
        rolelevel: [],
        userGroup: [],
    });
    const searchKeyword = '';
    const [personaSearchKeywords, setPersonaSearchKeywords] = useState<Record<string, string>>({});
    const { columnFilters } = useSelector((state: RootState) => state.roleData);
    const [roleUserData, setRoleUserData] = useState<any[]>([]);
    const [isRoleDataLoading, setIsRoleDataLoading] = useState(false);
    const [hasMoreRoles, setHasMoreRoles] = useState(true);
    const [isLoadingMoreRoles, setIsLoadingMoreRoles] = useState(false);
    const latestRequestRef = useRef(0);
    const rolePageRef = useRef(ROLE_SELECTION_PAGE_NUMBER);
    const [tempRoleSelection, setTempRoleSelection] = useState<Record<string, string[]>>({});
    const [adGroupPermissions, setAdGroupPermissions] = useState<any[]>([]);
    const [isAdGroupModified, setIsAdGroupModified] = useState(false);
    const [rolesAndUsers, setRolesAndUsers] = useState<Record<string, FlyoutCheckboxItemForum[]>>(
        {},
    );

    const [savedFlyOutData, setSavedFlyOutData] = useState<
        Record<
            string,
            {
                roles: any;
                users: any;
            }
        >
    >({});

    const [usersFlyoutData, setUsersFlyoutData] = useState<Record<string, any[]>>({});
    const [, setUsersFlyoutOpen] = useState(false);
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [showSelectedUsersOnly, setShowSelectedUsersOnly] = useState(false);
    const [pinSelectedRolesOnInitialLoad, setPinSelectedRolesOnInitialLoad] = useState(false);
    const toolPersonasRef = useRef(toolPersonas);
    const personaRoleSelectionRef = useRef(personaRoleSelection);
    const permissionMatrixRowsRef = useRef(permissionMatrixRows);
    const activePersonaSearchKeyword =
        (activePersonaId ? personaSearchKeywords[activePersonaId] : '') ?? '';

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
    const fetchAdGroupPermissions = async () => {
        try {
            const res = await getAdgroupPermissionMapping(Number(applicationParams.appId));
            setAdGroupPermissions(res?.data || []);
        } catch (e) {
            logError('Failed to fetch AD group permissions', e);
            setAdGroupPermissions([]);
        }
    };

    useEffect(() => {
        fetchRoles();
        fetchAdGroupPermissions();
    }, []);

    const buildRoleSelectionPayload = useCallback(
        (pageNumber: number) => ({
            geographyLevelId: toCommaSeparated(selectedFilters.geographyLevel),
            functionId: toCommaSeparated(selectedFilters.function),
            subFunctionId: toCommaSeparated(selectedFilters.subfunction),
            roleResponsibilityLevelId: toCommaSeparated(selectedFilters.rolelevel),
            userGroupId: toCommaSeparated(selectedFilters.userGroup),
            roleId: null,
            locationId: toCommaSeparated(selectedFilters.geographyLevel),
            searchKeyword: activePersonaSearchKeyword.trim() || undefined,
            isLeadership: /leadership/i.test(activePersonaName ?? ''),
            pageNumber,
            pageSize: ROLE_SELECTION_PAGE_SIZE,
        }),
        [selectedFilters, activePersonaName, activePersonaSearchKeyword],
    );

    const mapPersonaRolesFromApi = useCallback((roles: any[] = []): FlyoutCheckboxItemForum[] => {
        return roles
            .map((role: any) => {
                const roleId = String(
                    role?.roleId ?? role?.id ?? role?.value ?? role?.RoleId ?? '',
                ).trim();

                if (!roleId) return null;

                return {
                    roleId,
                    roleName: String(
                        role?.roleName ?? role?.label ?? role?.name ?? role?.RoleName ?? '',
                    ).trim(),
                    functionName: String(role?.functionName ?? role?.function ?? '').trim(),
                    subFunctionName: String(
                        role?.subFunctionName ?? role?.subFunction ?? '',
                    ).trim(),
                    roleLevelName: String(
                        role?.geographyLevelName ?? role?.roleLevelName ?? '',
                    ).trim(),
                    responsibilityLevelName: String(
                        role?.responsibilityLevelName ?? '',
                    ).trim(),
                    users: [],
                    checked: true,
                } as FlyoutCheckboxItemForum;
            })
            .filter(Boolean) as FlyoutCheckboxItemForum[];
    }, []);

    const handleLoadMoreRoles = useCallback(async () => {
        if (!hasMoreRoles || isLoadingMoreRoles || isRoleDataLoading) return;

        const nextPage = rolePageRef.current + 1;
        const requestId = ++latestRequestRef.current;

        if (nextPage > ROLE_SELECTION_PAGE_NUMBER) {
            setPinSelectedRolesOnInitialLoad(false);
        }

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
            // ignore load-more errors and keep current list intact
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
            setPinSelectedRolesOnInitialLoad(false);
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
        isRoleFlyoutOpen,
        selectedFilters,
        activePersonaName,
        activePersonaSearchKeyword,
        buildRoleSelectionPayload,
    ]);

    useEffect(() => {
        if (!isRoleFlyoutOpen) return;

        // On filter/search updates, treat refreshed page-1 data as initial load and pin selected roles.
        setPinSelectedRolesOnInitialLoad(true);
    }, [isRoleFlyoutOpen, selectedFilters, activePersonaSearchKeyword]);

    useEffect(() => {
        const gridFilters = buildGridFilters();

        dispatch(
            fetchRoleData({
                pageNumber: 1,
                pageSize,

                sortColumnName: '',
                sortDirection: '',
                searchKeyword: searchKeyword,
                searchTerm: 'Role',
                gridFilters,
                userEmail: '',
                forumLevel: '',
                forumPeriod: '',
            }),
        );
    }, []);
    useEffect(() => {
        if (!applicationParams.appId) return;

        const fetchConfig = async () => {
            try {
                const res = await getToolPersonaConfiguration(Number(applicationParams.appId));

                setAdGroups(res?.adGroups ?? []);
                setDataAccessList(res?.dataAccessList ?? []);
                setPersonaRoles(res?.roles ?? []);
            } catch {
                setAdGroups([]);
                setDataAccessList([]);
                setPersonaRoles([]);
            }
        };

        fetchConfig();
    }, [applicationParams.appId]);
    useEffect(() => {
        if (!isPersonaInitialized) return;

        if (resetTrigger > 0) {
            // ✅ only reset when explicitly needed
            setToolPersonas(originalPersonas);
            setPersonaRoleSelection(originalPersonaRoleSelection);
            setIsPersonaDirty(false);
        }
    }, [resetTrigger]);
    const getPermissionsForAdGroup = (adGroupName: string) => {
        return adGroupPermissions.filter(item => item.adGroupName === adGroupName);
    };

    const areRoleSelectionsEqual = (a: Record<string, string[]>, b: Record<string, string[]>) => {
        const normalize = (obj: Record<string, string[]>) => {
            const sorted: Record<string, string[]> = {};

            Object.keys(obj).forEach(key => {
                sorted[key] = [...(obj[key] ?? [])].sort();
            });

            return sorted;
        };

        return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
    };

    useEffect(() => {
        if (!isPersonaInitialized) return;

        const personaChanged = !arePersonasEqual(toolPersonas, originalPersonas);

        const rolesChanged = !areRoleSelectionsEqual(
            personaRoleSelection,
            originalPersonaRoleSelection,
        );

        const hasChanged = personaChanged || rolesChanged;

        setIsPersonaDirty(hasChanged);
    }, [
        toolPersonas,
        originalPersonas,
        personaRoleSelection,
        originalPersonaRoleSelection,
        isPersonaInitialized,
    ]);
    useEffect(() => {
        if (!applicationParams?.appId) {
            return;
        }
        dispatch(
            fetchRolePermissionsForApplication({
                appId: Number(applicationParams.appId),
                pageNumber: pageNumber,
                pageSize: pageSize,
            }),
        );
    }, [applicationParams.appId, pageNumber, pageSize]);

    useEffect(() => {
        getAndSavePermissionsForRole();
        loadExistingRolesForApplication();
    }, [existingRoleToolPermissions]);

    useEffect(() => {
        if (tableRowData.length == 0) {
            const newPageNumber = pageNumber == 1 ? 1 : pageNumber - 1;
            setPageNumber(newPageNumber);
        }

        setPaginatedData(tableRowData);
    }, [tableRowData]);

    const fetchPersonas = useCallback(async () => {
        try {
            const res = await getToolPersonas(Number(applicationParams.appId));

            const apiPersonas = res ?? [];
            const rawRolesByPersonaId: Record<string, any[]> = {};

            apiPersonas.forEach((p: any) => {
                const personaId = String(p?.personaId ?? '');
                if (personaId) {
                    rawRolesByPersonaId[personaId] = p?.roles ?? [];
                }
            });

            const mappedPersonas: ToolPersona[] = apiPersonas.map((p: any) => ({
                personaId: p.personaId,
                personaName: p.personaName,
                description: p.description ?? '',
                isActive: p.isActive,
                toolId: p.toolId,
                toolName: p.toolName,
                isNew: false,

                // map AD group
                adGroupId: p.adGroupId ?? null,
                adGroup: p.adGroupName ?? 'None',

                // map data access
                dataAccessId: p.dataAccessId ?? null,
                dataAccess: p.accessName ?? 'None',

                // roles
                roleIds: p.roleIds ?? [],
                rolesCount: p.roleCount ?? 0,
            }));

            const finalPersonas = ensureDefaultToolPersonas(mappedPersonas);

            setToolPersonas(finalPersonas);
            setOriginalPersonas(finalPersonas);

            // build role selection map
            const roleMap: Record<string, string[]> = {};
            const apiRolesByPersonaId: Record<string, FlyoutCheckboxItemForum[]> = {};
            const apiSavedRoleData: Record<string, { roles: any; users: any }> = {};
            finalPersonas.forEach(p => {
                const personaId = String(p.personaId);
                const rolesFromApi = mapPersonaRolesFromApi(rawRolesByPersonaId[personaId] ?? []);
                const roleIdsFromModel = (p.roleIds ?? []).map(id => String(id));
                const roleIdsFromRoles = rolesFromApi
                    .map(role => String(role.roleId ?? '').trim())
                    .filter(Boolean);
                const effectiveRoleIds = Array.from(
                    new Set(
                        roleIdsFromModel.length > 0
                            ? [...roleIdsFromModel, ...roleIdsFromRoles]
                            : roleIdsFromRoles,
                    ),
                );

                roleMap[personaId] = effectiveRoleIds;

                if (rolesFromApi.length) {
                    const selectedSet = new Set(effectiveRoleIds);
                    const selectedRoles = rolesFromApi.filter(role =>
                        selectedSet.has(String(role.roleId)),
                    );

                    apiRolesByPersonaId[personaId] = rolesFromApi.map(role => ({
                        ...role,
                        checked: selectedSet.has(String(role.roleId)),
                    }));

                    apiSavedRoleData[personaId] = {
                        roles: selectedRoles,
                        users: [],
                    };
                }
            });

            setPersonaRoleSelection(roleMap);
            setOriginalPersonaRoleSelection(roleMap);

            if (Object.keys(apiRolesByPersonaId).length) {
                setRolesAndUsers(prev => ({ ...prev, ...apiRolesByPersonaId }));
            }

            if (Object.keys(apiSavedRoleData).length) {
                setSavedFlyOutData(prev => ({ ...prev, ...apiSavedRoleData }));
            }

            setIsPersonaInitialized(true);
        } catch (e) {
            logError('Failed to fetch personas', e);
            setToolPersonas([]);
        }
    }, [applicationParams?.appId, mapPersonaRolesFromApi])

    useEffect(() => {
        if (!applicationParams?.appId) return;
        fetchPersonas();
    }, [applicationParams?.appId]);

    useEffect(() => {
        const fetchPermissions = async () => {
            if (!applicationParams?.appId) return;

            try {
                const response = await getToolAccessAndPermissionsById(
                    Number(applicationParams.appId),
                );

                const personas = response?.data?.[0]?.personas ?? response?.[0]?.personas ?? [];

                // ✅ ONLY set permission data
                setToolPermissionsData(personas);
            } catch (e) {
                logError(e);
                setToolPermissionsData([]);
            }
        };

        fetchPermissions();
    }, [applicationParams?.appId]);

    useEffect(() => {
        if (!toolPersonas.length) return;

        const personaSelectorRow: PermissionMatrixRow = {
            key: 'persona-selector-row',
            moduleId: '',
            moduleName: '',
            subModuleId: '',
            subModuleName: '',
            permissionName: '',
            isPersonaSelectorRow: true,
            personaAccess: toolPersonas.reduce(
                (acc, p) => {
                    acc[String(p.personaId)] = false;
                    return acc;
                },
                {} as Record<string, boolean>,
            ),
        };

        // ✅ capture previous state
        const prevAccessMap = permissionMatrixRows.reduce(
            (acc, row) => {
                acc[row.key] = row.personaAccess;
                return acc;
            },
            {} as Record<string, Record<string, boolean | null>>,
        );

        // ✅ CASE 1: INITIAL LOAD (unchanged)
        if (!isAdGroupModified) {
            if (!toolPermissionsData?.length) return;

            const rows: PermissionMatrixRow[] = [];

            toolPermissionsData.forEach((persona: any) => {
                persona.modules.forEach((module: any) => {
                    module.subModules?.forEach((subModule: any) => {
                        subModule.permission?.forEach((perm: any) => {
                            const rowKey = `${module.moduleId}-${subModule.subModuleId}-${perm.permissionId}`;

                            let existingRow = rows.find(r => r.key === rowKey);

                            if (!existingRow) {
                                existingRow = {
                                    key: rowKey,
                                    moduleId: module.moduleId,
                                    moduleName: module.module,
                                    subModuleId: subModule.subModuleId,
                                    subModuleName: subModule.subModule,
                                    permissionName: perm.permissionName,

                                    personaAccess: toolPersonas.reduce(
                                        (acc, p) => {
                                            acc[String(p.personaId)] = null;
                                            return acc;
                                        },
                                        {} as Record<string, boolean | null>,
                                    ),

                                    isFirstInModule: !rows.some(
                                        r => r.moduleId === module.moduleId,
                                    ),
                                    isFirstInSubModule: !rows.some(
                                        r =>
                                            r.moduleId === module.moduleId &&
                                            r.subModuleId === subModule.subModuleId,
                                    ),
                                };

                                rows.push(existingRow);
                            }

                            existingRow.personaAccess[String(persona.personaId)] =
                                perm.isActiveToolPermission ?? null;
                        });
                    });
                });
            });

            setPermissionMatrixRows([personaSelectorRow, ...rows]);
            return;
        }

        // ✅ CASE 2: AFTER AD GROUP CHANGE
        if (!adGroupPermissions.length) return;

        const rows: PermissionMatrixRow[] = [];

        adGroupPermissions.forEach(item => {
            const rowKey = `${item.moduleId}-${item.subModuleId}-${item.permissionId}`;

            let existingRow = rows.find(r => r.key === rowKey);

            if (!existingRow) {
                existingRow = {
                    key: rowKey,
                    moduleId: item.moduleId,
                    moduleName: item.module,
                    subModuleId: item.subModuleId,
                    subModuleName: item.subModule,
                    permissionName: item.permission,

                    personaAccess: {} as Record<string, boolean | null>,

                    isFirstInModule: !rows.some(r => r.moduleId === item.moduleId),
                    isFirstInSubModule: !rows.some(
                        r => r.moduleId === item.moduleId && r.subModuleId === item.subModuleId,
                    ),
                };

                rows.push(existingRow);
            }

            toolPersonas.forEach(persona => {
                const personaId = String(persona.personaId);

                const isAllowed =
                    persona.adGroup?.toLowerCase() === item.adGroupName?.toLowerCase();

                if (!isAllowed) {
                    // ✅ NOT allowed → always X
                    existingRow!.personaAccess[personaId] = null;
                    return;
                }

                // ✅ ALLOWED → preserve previous OR default false
                existingRow!.personaAccess[personaId] = prevAccessMap[rowKey]?.[personaId] ?? false;
            });
        });

        setPermissionMatrixRows([personaSelectorRow, ...rows]);
    }, [toolPermissionsData, toolPersonas, adGroupPermissions, isAdGroupModified]);

    const getAndSavePermissionsForRole = () => {
        const permissions: ToolPermissionDetails[] = [];
        let toolPermissions: IRoleToolPermissions[] = [];
        if (existingRoleToolPermissions.length > 0) {
            toolPermissions = existingRoleToolPermissions;
        } else {
            toolPermissions = otherRoleToolPermssions;
        }
        toolPermissions[0]?.toolAdGroups.forEach(i => {
            i.toolFeature.forEach(j => {
                permissions.push(j);
            });
        });
        setRolePermissions(permissions);
    };

    const loadExistingRolesForApplication = () => {
        if (!existingRoleToolPermissions.length) {
            setTableRowData([]);
            return;
        }

        const newTableRowData: TableRow[] = existingRoleToolPermissions.map(role => {
            let uniqueAdGroups = role.toolAdGroups.flatMap(adgroup =>
                adgroup.toolFeature
                    .filter(perm => perm.isActivePermission)
                    .map(() => adgroup.adGroup),
            );
            uniqueAdGroups = [...new Set(uniqueAdGroups)];

            const record: any = {
                key: role.roleId,
                application: applicationParams.appName,
                applicationId: applicationParams.appId,
                role: role.role,
                roleId: String(role.roleId),
                adgroup: uniqueAdGroups,
                action: '',
                appFeatureName: '',
                appModuleName: '',
                isEditMode: false,
                selectedPermissionCount: role.activePermissionCount,
                disableEditForApplicationRow: true,
                isRowSaved: true,
            };

            role.toolAdGroups.forEach(adGroup => {
                adGroup.toolFeature.forEach(toolFeature => {
                    record[toolFeature.toolFeatureName] = toolFeature.isActivePermission;
                });
            });

            return record;
        });

        setTableRowData(newTableRowData);

        const adGroupOptions: Record<number, ToolAdGroup[]> = {};
        const selectedAdGroups: Record<number, OptionType[]> = {};

        newTableRowData.forEach(row => {
            const { adgroup, key, roleId } = row;
            const filteredAdGroups = existingRoleToolPermissions.flatMap(appPermission =>
                appPermission.toolAdGroups.filter(adGroup => {
                    return adgroup.includes(adGroup.adGroup);
                }),
            );

            const uniqueAdGroups = new Set<string>();
            const uniqueSelectedAdGroups = new Set<string>();

            adGroupOptions[key] = existingRoleToolPermissions
                .filter(role => role.roleId === Number(roleId))
                .flatMap(role =>
                    role.toolAdGroups
                        .map(adGroup => {
                            const adGroupKey = `${adGroup.adGroup}-${adGroup.adGroupId}`;
                            if (!uniqueAdGroups.has(adGroupKey)) {
                                uniqueAdGroups.add(adGroupKey);
                                return {
                                    adGroup: adGroup.adGroup,
                                    adGroupId: adGroup.adGroupId,
                                    toolFeature: adGroup.toolFeature,
                                };
                            }
                            return null;
                        })
                        .filter(adGroup => adGroup !== null),
                );

            selectedAdGroups[key] = filteredAdGroups
                .filter(adGroup => {
                    if (!uniqueSelectedAdGroups.has(adGroup.adGroupId)) {
                        uniqueSelectedAdGroups.add(adGroup.adGroupId);
                        return true;
                    }
                    return false;
                })
                .map(adGroup => ({
                    label: adGroup.adGroup,
                    value: adGroup.adGroupId,
                }));
        });
        // Update state
        setAdGroupOptions(adGroupOptions);
        setSelectedAdGroups(selectedAdGroups);
    };

    const getAdGroupOptions = () => {
        const adGroupOptions = adGroups;
        return (
            adGroupOptions.map(({ adGroupName, id }) => ({
                label: adGroupName,
                value: String(id),
            })) || []
        );
    };
    const getDataAccessOptions = () => {
        const dataAccessOptions = dataAccessList;
        return (
            dataAccessOptions.map(({ accessName, dataAccessId }) => ({
                label: accessName,
                value: String(dataAccessId),
            })) || []
        );
    };

    const getRolesForDropdown = (selectedRoles: string[]) => {
        return otherRoleToolPermssions
            .filter(role => !selectedRoles.includes(role?.role))
            .map(role => ({
                desc: role.role ?? '',
                label: role.roleId.toString(),
                value: role.roleId.toString(),
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
    const handleRemoveRow = (record: TableRow) => {
        tableRef.current.rowRecord = record;
        setShowDialogForRoleDeletion(true);
    };

    const onClickHandlerForDeleteRole = (actionType: 'cancel' | 'delete') => {
        const record = tableRef.current.rowRecord;

        if (actionType === 'delete') {
            deleteRolePermission();
            return;
        }

        setTableRowData(prevData => prevData.filter(row => row.key !== record.key));

        setAdGroupOptions(prev => {
            const updatedOptions = { ...prev };
            delete updatedOptions[record.key];
            return updatedOptions;
        });

        setSelectedAdGroups(prev => {
            const updatedSelected = { ...prev };
            delete updatedSelected[record.key];
            return updatedSelected;
        });

        setIsAddNewRoleButtonDisabled(false);
    };
    const getAdGroupLabel = (adGroupId: string): string => {
        // Look through the adGroupOptions to find the corresponding label
        for (const group of Object.values(adGroupOptions)) {
            const foundGroup = group.find(item => item.adGroupId === adGroupId);
            if (foundGroup) {
                return foundGroup.adGroup; // Return the label if found
            }
        }
        return adGroupId; // Fallback to return the ID itself if not found
    };
    const deleteRolePermission = async () => {
        setButtonLoadingState(true);
        try {
            const payload = {
                toolId: Number(applicationParams.appId),
                roleId: Number(tableRef.current.rowRecord.roleId),
            };
            const response = await deleteApplicationRoleMapping(payload);
            if (response.statusCode === 200) {
                // Recall the API to get latest table data after deletion
                dispatch(
                    fetchRolePermissionsForApplication({
                        appId: Number(applicationParams.appId),
                        pageNumber: pageNumber,
                        pageSize: pageSize,
                    }),
                );
                setShowDialogForRoleDeletion(false);
                setShowRoleDeletionToast(true);
            }
        } catch (error) {
            logError(error);
        } finally {
            setButtonLoadingState(false);
        }
    };

    const getDisabledStatusForCheck = (key: number) => {
        const selectedRow = tableRowData.filter(x => x.key === key)[0];
        const noPermissions = roleNamesWithoutPermissions.includes(selectedRow?.role || '');
        if (!selectedAdGroups[key] || selectedAdGroups[key].length === 0 || noPermissions) {
            return true;
        }
        return false;
    };

    const getSelectedAdGroups = (key: number) => {
        return (
            selectedAdGroups[key]?.map(({ label, value }) => ({
                label,
                value,
            })) || []
        );
    };

    const handleSelectedPermission = (
        key: number,
        permissionName: string,
        checked: boolean,
        roleId: string,
    ) => {
        setTableRowData(prevData =>
            prevData.map(row => {
                if (row.key === key) {
                    const updatedRow = {
                        ...row,
                        [permissionName]: checked,
                        selectedPermissionCount:
                            (row.selectedPermissionCount ?? 0) + (checked ? 1 : -1),
                    };
                    return updatedRow;
                }
                return row;
            }),
        );
        setEditedRoleIds(prevData => prevData.add(roleId));
        setPermissionInteractionTracker(prev => ({
            ...prev,
            [key]: true,
        }));
    };

    const handleApplyAdGroups = (
        recordKey: number,
        selectedValues: OptionType[],
        roleName: string,
        roleId: string,
    ) => {
        const selectedAdGroupIds = selectedValues.map(item => item.value);

        setSelectedAdGroups(prev => {
            const newSelectedAdGroups = { ...prev };
            newSelectedAdGroups[recordKey] = selectedValues;
            return newSelectedAdGroups;
        });

        setAdGroupOptions(prev => {
            const newSelectedAdGroups = { ...prev };
            const roleAppPermissions = isEditModeOn
                ? existingRoleToolPermissions
                : otherRoleToolPermssions;
            const adGroupForNewRoleAdd = roleAppPermissions
                .filter(role => role.role === roleName)
                .map(role => role.toolAdGroups)[0] as ToolAdGroup[];
            newSelectedAdGroups[recordKey] = adGroupForNewRoleAdd;
            return newSelectedAdGroups;
        });

        setTableRowData(prevData => {
            return prevData.map(row => {
                if (row.key === recordKey) {
                    const updatedRow = { ...row };
                    let permissionCount = 0;

                    rolePermissions?.forEach(permission => {
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
                        if (hasPermission) {
                            permissionCount++;
                        }
                    });

                    updatedRow.selectedPermissionCount = permissionCount;
                    return updatedRow;
                }
                return row;
            });
        });

        setEditedRoleIds(prevData => prevData.add(roleId));
        setAdGroupInteractionTracker(prev => ({
            ...prev,
            [recordKey]: true,
        }));
        setResetKeys(prev => ({
            ...prev,
            [recordKey]: (prev[recordKey] ?? 0) + 1,
        }));
    };

    const handleCheckClick = (record: TableRow) => {
        tableRef.current.rowRecord = record;
        setShowDialogForAddNewRole(true);
    };

    const saveApplicationRolePermissionMapping = async () => {
        setButtonLoadingState(true);
        const payload: IRolePermissionsMappingPayload[] = [];
        const _editedRoleIds = [...editedRoleIds];
        const filteredTableRowData = tableRowData.filter(row =>
            _editedRoleIds.includes(row.roleId),
        );

        filteredTableRowData.forEach((row: any) => {
            rolePermissions.forEach(permission => {
                payload.push({
                    toolId: Number(applicationParams.appId),
                    roleId: Number(row.roleId),
                    toolFeatureId: permission.toolFeatureId,
                    toolFeatureName: permission.toolFeatureName,
                    isActive: Boolean(row[permission.toolFeatureName]),
                });
            });
        });

        try {
            if (!payload.length) {
                setIsEditModeOn(false);
                updateEditModeInTableRowRecord(false);
                setShowDialogForSaveEditChanges(false);
                return;
            }

            const response = await updateApplicationRolePermissionsMapping(payload);

            if (response.statusCode === 200) {
                // Recall the API to get latest table data after updation
                dispatch(
                    fetchRolePermissionsForApplication({
                        appId: Number(applicationParams.appId),
                        pageNumber: pageNumber,
                        pageSize: pageSize,
                    }),
                );
                setIsAddNewRoleButtonDisabled(false);
                setIsEditModeOn(false);
                setShowDialogForAddNewRole(false);
                updateEditModeInTableRowRecord(false);
                setShowDialogForSaveEditChanges(false);
                setShowRoleUpdationToast(true);
            }
        } catch (error) {
            logError(error);
        } finally {
            setShowDialogForAddNewRole(false);
            setButtonLoadingState(false);
            // Clear the set of edited role ids once data is saved
            setEditedRoleIds(prevData => {
                prevData.clear();
                return prevData;
            });
        }
    };

    const handleRoleChange = (value: OptionType, record: TableRow) => {
        setSelectedRoles(prev => {
            const newSelectedRoles = { ...prev };
            newSelectedRoles[record.key] = [value];
            return newSelectedRoles;
        });

        // Update only the selected row
        setTableRowData(prevData =>
            prevData.map(row =>
                row.key === record.key
                    ? {
                          ...row,
                          role: value.desc ?? '',
                          roleId: String(value.value),
                      }
                    : row,
            ),
        );

        tableRef.current.rowRecord = record;

        checkIfSingleAdGroupForSelectedTool(record.key);

        currentRecordRef.current['currentRecord'] = {
            role: String(value.desc),
            roleId: String(value.value),
        };
    };

    const checkIfSingleAdGroupForSelectedTool = (key: number) => {
        setAdGroupOptions(options => {
            const selectedToolAdGroupOptions = options[key];
            if (selectedToolAdGroupOptions?.length === 1) {
                const mappedAdGroups = selectedToolAdGroupOptions.map(({ adGroup, adGroupId }) => ({
                    label: adGroup,
                    value: adGroupId,
                }));
                handleApplyAdGroups(
                    key,
                    mappedAdGroups,
                    String(currentRecordRef.current.currentRecord.role),
                    String(currentRecordRef.current.currentRecord.roleId),
                );
            }
            return options;
        });
    };

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

    const updateEditModeInTableRowRecord = (isEditModeEnabled: boolean) => {
        setIsEditModeOn(isEditModeEnabled);
        setTableRowData(prevData => {
            prevData = prevData.map(row => {
                return {
                    ...row,
                    isEditMode: isEditModeEnabled,
                    isPermissionEditable: isEditModeEnabled,
                };
            });
            return prevData;
        });
    };

    const onClickSaveEditChangesHandler = async () => {
        try {
            setButtonLoadingState(true);
            flushSync(() => {});

            await saveApplicationRolePermissionMapping();

            const payload = buildPersonaPayload(toolPersonasRef.current);

            const response = await editToolPersonaAccessPermissions(payload);
            if (response.statusCode == 200) {
                setShowRoleUpdationToast(true);
            } else {
                setToggleErrorToast(true);
            }

            setPermissionInteractionTracker({});
            setAdGroupInteractionTracker({});
            setIsPersonaDirty(false);
        } catch (e) {
            logError('Failed to save persona permissions', e);
        } finally {
            setButtonLoadingState(false);
        }
    };
    useEffect(() => {
        if (onAccessDataChange) {
            onAccessDataChange({
                hasChanges: isEditModeOn || isAddNewRoleButtonDisabled || isPersonaDirty,
                saveHandler: onClickSaveEditChangesHandler, // ✅ expose here
            });
        }
    }, [isEditModeOn, isAddNewRoleButtonDisabled, isPersonaDirty]);

    const ensureDefaultToolPersonas = useCallback(
        (incoming: ToolPersona[] = []): ToolPersona[] => {
            const personas = [...incoming];

            const merged = [...personas];

            return merged.map(persona => {
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

    const onClickCancelEditChangesHandler = () => {
        updateEditModeInTableRowRecord(false);
        setShowDialogForCancelEditChanges(false);
        // Clear the set of edited role ids if edited changes are discarded.
        setEditedRoleIds(prevData => {
            prevData.clear();
            return prevData;
        });

        //Reset permission interaction tracker
        setPermissionInteractionTracker({});
        // reset ad group interaction tracker
        setAdGroupInteractionTracker({});
        setIsPersonaDirty(false);

        loadExistingRolesForApplication();
    };
    const handleAddPersona = () => {
        setEditingPersona(null);
        setPersonaName('');
        setPersonaDescription('');
        setIsPersonaDialogOpen(true);
    };

    const arePersonasEqual = (a: ToolPersona[], b: ToolPersona[]) => {
        if (a.length !== b.length) return false;

        const normalize = (list: ToolPersona[]) =>
            list
                .map(p => ({
                    name: p.personaName.trim(),
                    desc: p.description?.trim(),
                    active: p.isActive,

                    adGroupId: p.adGroupId ?? null,
                    dataAccessId: p.dataAccessId ?? null,
                    roleIds: (p.roleIds ?? []).sort(),
                }))
                .sort((x, y) => x.name.localeCompare(y.name));

        return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
    };
    useEffect(() => {
        toolPersonasRef.current = toolPersonas;
    }, [toolPersonas]);
    useEffect(() => {
        personaRoleSelectionRef.current = personaRoleSelection;
    }, [personaRoleSelection]);
    useEffect(() => {
        permissionMatrixRowsRef.current = permissionMatrixRows;
    }, [permissionMatrixRows]);

    const handlePersonaFieldChange = (
        personaId: number,
        field: 'adGroup' | 'dataAccess',
        option: any,
    ) => {
        // ✅ Normalize dropdown value (handles array, object, empty)
        let selected: any = null;

        if (Array.isArray(option)) {
            selected = option.length > 0 ? option[0] : null;
        } else {
            selected = option ?? null;
        }

        // ✅ Update persona state
        setToolPersonas(prev =>
            prev.map(p => {
                if (p.personaId !== personaId) return p;

                if (field === 'adGroup') {
                    // track AD group change (used in permission table logic)
                    setIsAdGroupModified(true);

                    return {
                        ...p,
                        adGroup: selected?.label ?? 'None',
                        adGroupId:
                            selected && selected.value !== undefined && selected.value !== null
                                ? Number(selected.value)
                                : null,
                    };
                }

                // ✅ dataAccess update
                return {
                    ...p,
                    dataAccess: selected?.label ?? 'None',
                    dataAccessId:
                        selected && selected.value !== undefined && selected.value !== null
                            ? Number(selected.value)
                            : null,
                };
            }),
        );

        // ✅ Update permission table when AD group changes
        if (field === 'adGroup') {
            const selectedAdGroupName = selected?.label;

            const allowedPermissions = selectedAdGroupName
                ? getPermissionsForAdGroup(selectedAdGroupName)
                : [];

            setPermissionMatrixRows(prevRows => {
                return prevRows.map(row => {
                    if (row.isPersonaSelectorRow) return row;

                    const hasAccess = allowedPermissions.some((p: any) => {
                        return (
                            p.module === row.moduleName &&
                            p.subModule === row.subModuleName &&
                            p.permission === row.permissionName
                        );
                    });

                    return {
                        ...row,
                        personaAccess: {
                            ...row.personaAccess,
                            [String(personaId)]: hasAccess || null,
                        },
                    };
                });
            });
        }

        // ✅ mark dirty so save button enables
        setIsPersonaDirty(true);
    };
    const handleMultiSelectChange = (key: string) => {
        return (_option: any, _checked: boolean, tree: any[]) => {
            const selected = tree || [];

            setSelectedFilters(prev => ({
                ...prev,
                [key]: selected,
            }));
        };
    };
    const mapSelectedOptions = (list: any[] = []) =>
        list.map(item => ({
            label: item.label,
            value: String(item.value),
        }));

    const handleEditPersona = (persona: any) => {
        setEditingPersona(persona);
        setPersonaName(persona.personaName);
        setPersonaDescription(persona.description);
        setIsPersonaDialogOpen(true);
    };

    const handleSavePersona = async () => {
        if (!personaName.trim() || !personaDescription.trim() || loading) return;

        try {
            setLoading(true);

            setToolPersonas(prev => {
                // EDIT CASE
                if (editingPersona) {
                    return prev.map(p =>
                        p.personaId === editingPersona.personaId
                            ? {
                                  ...p,
                                  personaName: personaName.trim(),
                                  description: personaDescription.trim(),
                              }
                            : p,
                    );
                }

                // ADD CASE (NEW PERSONA)
                const newPersona = {
                    personaId: Date.now(), // temp ID
                    isNew: true,
                    personaName: personaName.trim(),
                    description: personaDescription.trim(),
                    adGroup: 'None',
                    dataAccess: 'None',
                    roleIds: [],
                    rolesCount: 0,
                    isActive: true,
                };
                const newId = String(newPersona.personaId);

                setPermissionMatrixRows(prevRows =>
                    prevRows.map(row => ({
                        ...row,
                        personaAccess: {
                            ...row.personaAccess,
                            [newId]: row.personaAccess?.[newId] ?? null, // ✅ IMPORTANT
                        },
                    })),
                );

                return [...prev, newPersona];
            });

            setIsPersonaDirty(true);
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

    const handleAskDeletePersona = (persona: any) => {
        setPersonaToDelete(persona);
        setOpenDeletePersonaDialog(true);
    };
    const handleGoBackToDeleteDialog = () => {
        setOpenMoveRolesDialog(false);
        setOpenDeletePersonaDialog(true);
    };
    const handleOpenMoveRolesDialog = () => {
        setOpenDeletePersonaDialog(false);
        setMoveRolesTargetPersonaId('');
        setOpenMoveRolesDialog(true);
    };
    const handleConfirmDeletePersona = async () => {
        if (!personaToDelete) return;

        try {
            if (!personaToDelete.isNew) {
                const response = await deleteToolPersona({
                    personaId: personaToDelete.personaId,
                    targetPersonaId: null,
                });

                if (response.statusCode == 200) {
                    setShowRoleDeletionToast(true);
                } else {
                    setToggleErrorToast(true);
                }
            }

            const deletedId = String(personaToDelete.personaId);

            const updatedPersonas = toolPersonas.filter(p => String(p.personaId) !== deletedId);

            setToolPersonas(updatedPersonas);
            setOriginalPersonas(updatedPersonas);

            setPermissionMatrixRows(prevRows =>
                prevRows.map(row => {
                    const updatedAccess = { ...row.personaAccess };
                    delete updatedAccess[deletedId];

                    return {
                        ...row,
                        personaAccess: updatedAccess,
                    };
                }),
            );

            setPersonaRoleSelection(prev => {
                const updated = { ...prev };
                delete updated[deletedId];
                return updated;
            });

            setTempRoleSelection(prev => {
                const updated = { ...prev };
                delete updated[deletedId];
                return updated;
            });

            setOriginalPersonaRoleSelection(prev => {
                const updated = { ...prev };
                delete updated[deletedId];
                return updated;
            });

            setRolesAndUsers(prev => {
                const updated = { ...prev };
                delete updated[deletedId];
                return updated;
            });

            setSavedFlyOutData(prev => {
                const updated = { ...prev };
                delete updated[deletedId];
                return updated;
            });
        } catch {
            setToggleErrorToast(true);
        } finally {
            setOpenDeletePersonaDialog(false);
        }
    };
    const handleMoveRolesAndDeletePersona = async () => {
        if (!personaToDelete || !moveRolesTargetPersonaId) return;

        try {
            const response = await deleteToolPersona({
                personaId: personaToDelete.personaId,
                targetPersonaId: Number(moveRolesTargetPersonaId),
            });

            if (response.statusCode === 200) {
                await fetchPersonas(); // Refresh personas from API
            } else {
                setToggleErrorToast(true);
            }
        } catch (e) {
            logError('Failed to move roles and delete persona', e);
            setToggleErrorToast(true);
        } finally {
            setOpenMoveRolesDialog(false);
            setPersonaToDelete(null);
            setMoveRolesTargetPersonaId('');
        }
    };
    const handleCancelPersona = () => {
        setPersonaName('');
        setPersonaDescription('');
        setEditingPersona(null);
        setIsPersonaDialogOpen(false);
    };

    const TableColumns = [
        {
            key: 'Roles',
            dataIndex: 'roles',
            title: 'Roles',
            subTitle: '',
            width: '360px',
            sticky: '',
            externalStyles: {},
            customExpandableColumn: true,
            render: (_value: any, record: any) => (
                <>
                    {record.isEditMode && !record.disableEditForApplicationRow ? (
                        <TagSelector
                            dataTestId="application-drop-down"
                            id="application-drop-down"
                            className={styles['application-tag-selector']}
                            onChange={value => handleRoleChange(value, record)}
                            options={getRolesForDropdown(tableRowData.map(row => row.role))}
                            selectedOptions={getSelectedRole(record.key)}
                            placeholder="Select Role"
                            searchInput={{
                                searchPlaceholder: 'Search Role',
                                searchSize: 'S',
                                searchWholeString: true,
                            }}
                            size="S"
                            type="default"
                            showCloseIcon={false}
                            optionsContainerClassName={
                                styles['row-edit-application-tag-selector-container']
                            }
                            portal={true}
                        />
                    ) : (
                        <div className={styles['application-cell-container']}>
                            <div className={styles['header-title']}>
                                <span className={styles['application-permissions-cell-title']}>
                                    {record.roleId}
                                </span>
                                <Flex align="center" justify="space-between" flex={1}>
                                    <ToolTip
                                        direction="Left-Center"
                                        text={record.role}
                                        type="Text Only"
                                        wrapperComponent={
                                            <span
                                                className={
                                                    styles['application-permissions-cell-content']
                                                }
                                                style={{ width: '120px' }}
                                            >
                                                {trimTextAndAppendTrail(record.role)}
                                            </span>
                                        }
                                    />

                                    {!record.isRowSaved ? (
                                        <Icon name="chevron-down" size="xm" color="neutrals-B300" />
                                    ) : (
                                        <CustomSwitch
                                            count={record.selectedPermissionCount}
                                            isOn={false}
                                            toggleSwitch={() => {}}
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

    rolePermissions?.forEach(permission => {
        TableColumns.push({
            key: String(permission.toolFeatureName),
            title: permission.toolFeatureName,
            subTitle: permission.toolModuleName,
            dataIndex: permission.toolFeatureName,
            width: '150px',
            sticky: '',
            externalStyles: { display: 'auto', alignItems: 'center' },
            customExpandableColumn: false,
            render: (_value, record) => {
                const value = record[permission.toolFeatureName];

                return (
                    <div className={styles['role_permissions_column']}>
                        {value == null ? (
                            //  Not allowed → show X
                            <Icon name="x-close" size="l" color="neutrals-B80" />
                        ) : (
                            //  Allowed → always show checkbox
                            <CheckBox
                                onChange={() =>
                                    handleSelectedPermission(
                                        record.key,
                                        permission.toolFeatureName,
                                        !value,
                                        record.roleId,
                                    )
                                }
                                checked={value || false} // unchecked by default
                                disabled={!record.isPermissionEditable}
                            />
                        )}
                    </div>
                );
            },
        });
    });

    TableColumns.push(
        {
            key: 'adgroup',
            dataIndex: 'adgroup',
            title: 'AD groups',
            subTitle: '',
            externalStyles: { display: '', alignItems: '' },
            width: '150px',
            sticky: '',
            customExpandableColumn: false,
            render: (_value, record) => (
                <>
                    {record.isEditMode ? (
                        <Tooltip
                            title={record.adgroup.map(getAdGroupLabel).join(', ')}
                            placement="bottom"
                        >
                            <span>
                                <TagSelector
                                    key={`tag-selector-${record.key}-${resetKeys[record.key] ?? 0}`}
                                    confirmSelection={{
                                        onApply: selectedValues =>
                                            handleApplyAdGroups(
                                                record.key,
                                                selectedValues,
                                                record.role,
                                                record.roleId,
                                            ),
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
                                    options={getAdGroupOptions()}
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
                                        showTooltip: false,
                                        outerContainerClass:
                                            styles['row-edit-filterchip-container'],
                                    }}
                                    optionsContainerClassName={
                                        styles['adgroup-tag-selector-dropdown-container']
                                    }
                                    portal={true}
                                />
                            </span>
                        </Tooltip>
                    ) : record.adgroup.length ? (
                        <Tooltip
                            title={record.adgroup.map(getAdGroupLabel).join(', ')}
                            placement="bottom"
                        >
                            <span>
                                <FilterChip
                                    key={String(record.key)}
                                    label={`${getSelectedAdGroups(record.key)
                                        .map(group => group.label)
                                        .join(', ')
                                        .slice(0, 28)}...`}
                                    counter={getSelectedAdGroups(record.key).length - 1}
                                    showCloseIcon={false}
                                    outerContainerClass={styles['row-view-filterchip-container']}
                                    showTooltip={false}
                                />
                            </span>
                        </Tooltip>
                    ) : null}
                </>
            ),
        },
        {
            key: 'action',
            dataIndex: 'action',
            title: 'Actions',
            subTitle: '',
            externalStyles: { display: 'auto', alignItems: '' },
            width: '96px',
            sticky: '',
            customExpandableColumn: false,
            render: (_value, record: TableRow) => (
                <div className={styles['role_permissions_column']}>
                    {record.isEditMode && !isEditModeOn ? (
                        <Flex gap="8px">
                            <IconButton
                                size="Small"
                                icon="check"
                                onClick={() => handleCheckClick(record)}
                                disabled={getDisabledStatusForCheck(record.key)}
                            />
                            <IconButton
                                size="Small"
                                icon="x-close"
                                onClick={() => {
                                    tableRef.current.rowRecord = record;
                                    onClickHandlerForDeleteRole('cancel');
                                }}
                                disabled={false}
                            />
                        </Flex>
                    ) : (
                        <IconButton
                            size="Small"
                            icon="trash-01"
                            onClick={() => handleRemoveRow(record)}
                            // Disable deletion of role in edit mode
                            disabled={isEditModeOn}
                        />
                    )}
                </div>
            ),
        },
    );

    const roleNamesWithoutPermissions = tableRowData
        .filter(
            row =>
                row.selectedPermissionCount === 0 &&
                permissionInteractionTracker[row.key] && // Only if user manually interacted
                ((!row.isRowSaved && adGroupInteractionTracker[row.key]) || isEditModeOn),
        )
        .map(row => row.role);

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
        if (!groupedRoles.length || !activePersonaId) return;

        const personaRoles =
            tempRoleSelection[activePersonaId] || personaRoleSelection[activePersonaId] || [];

        setRolesAndUsers(prev => {
            const existing = prev[activePersonaId] ?? [];
            const groupedRoleIds = new Set(groupedRoles.map((item: any) => String(item.roleId)));
            const preservedSelectedRoles = existing.filter(
                (role: any) => role.checked && !groupedRoleIds.has(String(role.roleId)),
            );

            const formatted = groupedRoles.map((item: any) => {
                const existingRole = existing.find(
                    (r: any) => String(r.roleId) === String(item.roleId),
                );

                return {
                    ...item,
                    checked: existingRole?.checked ?? personaRoles.includes(String(item.roleId)), // ✅ preserve previous toggle // ✅ initial load
                };
            });

            const mergedRoles = [...preservedSelectedRoles, ...formatted];

            if (pinSelectedRolesOnInitialLoad) {
                const selected = mergedRoles.filter(role => role.checked);
                const unselected = mergedRoles.filter(role => !role.checked);

                return {
                    ...prev,
                    [activePersonaId]: [...selected, ...unselected],
                };
            }

            return {
                ...prev,
                [activePersonaId]: mergedRoles, // keep selected roles from other pages
            };
        });
    }, [
        groupedRoles,
        activePersonaId,
        tempRoleSelection,
        personaRoleSelection,
        pinSelectedRolesOnInitialLoad,
    ]);

    useEffect(() => {
        if (!activePersonaId || !groupedRoles.length) return;

        setSavedFlyOutData(prev => {
            const existing = prev[activePersonaId];
            if (existing?.users?.length) return prev; // ✅ already filled

            const initialUsers = groupedRoles.flatMap((role: any) =>
                (role.users || []).map((user: any) => ({
                    ...user,
                    roleId: role.roleId,
                    checked: true, // default
                })),
            );

            return {
                ...prev,
                [activePersonaId]: {
                    roles: [],
                    users: initialUsers,
                },
            };
        });
    }, [groupedRoles, activePersonaId]);

    const mapToOptions = (data: any[] = []) => {
        return data.map(item => ({
            label: item.columnValue,
            value: item.id ?? item.columnValue, // fallback if id is null
        }));
    };
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

    const buildGridFilters = () => {
        const filters: any[] = [];

        Object.entries(selectedFilters).forEach(([key, values]) => {
            if (!Array.isArray(values)) return;

            values.forEach((val: any) => {
                filters.push({
                    columnName: key,
                    columnValue: val.label?.toLowerCase() ?? '',
                    id: val.value ?? '',
                });
            });
        });

        return filters;
    };
    const extractPermissionId = (key: string) => {
        const parts = key.split('-');
        return Number(parts[2]);
    };
    const buildPersonaPayload = (personas = toolPersonas) => {
        const toolId = Number(applicationParams.appId);

        const activePersonas = personas.filter(p => p.isActive);

        const applicationPersonaDetails = activePersonas.map(persona => ({
            personaId: persona.isNew ? null : persona.personaId,
            personaName: persona.personaName,
            description: persona.description || '',
            ADGroupId: persona.adGroupId ? String(persona.adGroupId) : null,
            dataAccessId: persona.dataAccessId ? String(persona.dataAccessId) : null,
            roleIds: (personaRoleSelectionRef.current[String(persona.personaId)] || []).join(','),
            isNew: Boolean(persona.isNew), //persona.personaId > 0 ? false : true,
        }));

        const activePersonaIds = new Set(activePersonas.map(p => String(p.personaId)));

        const applicationToolPersonaPermissionMappings: any[] = [];

        permissionMatrixRowsRef.current.forEach(row => {
            if (row.isPersonaSelectorRow) return;

            Object.entries(row.personaAccess || {}).forEach(([personaId, value]) => {
                if (!activePersonaIds.has(personaId)) return;

                // ✅ find persona object
                const persona = activePersonas.find(p => String(p.personaId) === personaId);

                if (!persona) return;

                applicationToolPersonaPermissionMappings.push({
                    personaId: persona.isNew ? null : Number(personaId),
                    personaName: persona.isNew ? persona.personaName : null,
                    permissionId: extractPermissionId(String(row.key)),
                    isChecked: value,
                });
            });
        });

        return {
            toolId,
            applicationPersonaDetails,
            applicationToolPersonaPermissionMappings,
        };
    };
    const filteredRoles = (() => {
        const roles = rolesAndUsers[activePersonaId || ''] || [];
        if (showSelectedOnly) return roles.filter(item => item.checked);
        if (activePersonaSearchKeyword.trim() !== '' && !isRoleDataLoading) {
            const currentIds = new Set(groupedRoles.map((r: any) => String(r.roleId)));
            return roles.filter(item => currentIds.has(String((item as any).roleId)));
        }
        return roles;
    })();
    // const filteredUsers = showSelectedUsersOnly
    //     ? (usersFlyoutData[activePersonaId || ''] || []).filter((user: any) => user.checked)
    //     : usersFlyoutData[activePersonaId || ''] || [];

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
    const dropdownFilters = (
        <Flex wrap="wrap" gap={8}>
            <DropDown
                className={styles['role-selection-filter']}
                dropdown={{
                    size: 'S',
                    label: 'Function',
                    isLabelInline: true,
                    options: mapToOptions(columnFilters.function),

                    onChange: handleMultiSelectChange('function'),

                    selectedOptions: mapSelectedOptions(selectedFilters.function),

                    placeholder: '',
                    type: 'checkbox',

                    showSelectAll: true,
                    selectAllOption: { label: 'Select All', value: 'all' },
                }}
                searchInput={{
                    searchPlaceholder: 'Search',
                    searchSize: 'L',
                    searchWholeString: true,
                }}
            />

            <DropDown
                dropdown={{
                    size: 'S',
                    label: 'Sub-Function',
                    isLabelInline: true,
                    options: mapToOptions(columnFilters.subfunction),

                    type: 'checkbox',
                    showSelectAll: true,
                    selectAllOption: { label: 'Select All', value: 'all' },

                    onChange: handleMultiSelectChange('subfunction'),

                    selectedOptions: mapSelectedOptions(selectedFilters.subfunction),

                    placeholder: '',
                }}
                searchInput={{
                    searchPlaceholder: 'Search',
                    searchSize: 'L',
                    searchWholeString: true,
                }}
            />

            <DropDown
                dropdown={{
                    size: 'S',
                    label: 'Geography Level',
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

            <DropDown
                dropdown={{
                    size: 'S',
                    label: 'Responsibility Level',
                    type: 'checkbox',
                    isLabelInline: true,
                    showSelectAll: true,
                    selectAllOption: { label: 'Select All', value: 'all' },
                    options: mapToOptions(columnFilters.roleLevel),
                    selectedOptions: mapSelectedOptions(selectedFilters.rolelevel),
                    onChange: handleMultiSelectChange('rolelevel'),
                    placeholder: '',
                }}
                searchInput={{
                    searchPlaceholder: 'Search',
                    searchSize: 'L',
                    searchWholeString: true,
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

                    options: getUserGroupOptions(), // ✅ dynamic API-based options

                    onChange: handleMultiSelectChange('userGroup'), // ✅ connect state

                    selectedOptions: mapSelectedOptions(selectedFilters.userGroup), // ✅ bind state

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

    const renderPersonaCardSection = () => {
        return (
            <>
                <Flex style={{ marginTop: '1rem' }} gap={10} align="stretch" wrap="wrap">
                    {toolPersonas
                        .filter(persona => persona.isActive)
                        .map(persona => (
                            <PersonaCard
                                key={`${persona.personaId}-${(personaRoleSelection[String(persona.personaId)] ?? []).length}`}
                                title={persona.personaName}
                                description={persona.description}
                                isLeadership={isLeadershipPersona(persona)}
                                isViewer={isViewerPersona(persona)}
                                // AD GROUP DROPDOWN
                                adGroupOptions={getAdGroupOptions()}
                                selectedAdGroup={
                                    persona.adGroupId
                                        ? [
                                              {
                                                  label: persona.adGroup ?? 'None',
                                                  value: String(persona.adGroupId),
                                              },
                                          ]
                                        : [{ label: 'None', value: 'none' }]
                                }
                                onAdGroupChange={option =>
                                    handlePersonaFieldChange(persona.personaId, 'adGroup', option)
                                }
                                // DATA ACCESS DROPDOWN
                                dataAccessOptions={getDataAccessOptions()}
                                selectedDataAccess={
                                    persona.dataAccessId
                                        ? [
                                              {
                                                  label: persona.dataAccess ?? 'None',
                                                  value: String(persona.dataAccessId),
                                              },
                                          ]
                                        : []
                                }
                                onDataAccessChange={option =>
                                    handlePersonaFieldChange(
                                        persona.personaId,
                                        'dataAccess',
                                        option,
                                    )
                                }
                                // ROLES CLICK

                                roles={
                                    toolType?.toLowerCase() === 'performance management'
                                        ? undefined
                                        : (personaRoleSelection[String(persona.personaId)] ?? [])
                                              .length
                                }
                                onRolesClick={
                                    toolType?.toLowerCase() === 'performance management'
                                        ? undefined
                                        : () => {
                                              const id = String(persona.personaId);

                                              setActivePersonaId(id);
                                              setActivePersonaName(persona.personaName);
                                              setShowSelectedOnly(false);
                                              setShowSelectedUsersOnly(false);
                                              setPinSelectedRolesOnInitialLoad(true);

                                              //  Initialize temp selection from saved state
                                              const checkedRoleIds = (rolesAndUsers[id] || [])
                                                  .filter(r => r.checked)
                                                  .map(r => String(r.roleId));
                                              const selectedRoleIds =
                                                  checkedRoleIds.length > 0
                                                      ? checkedRoleIds
                                                      : [...(personaRoleSelection[id] || [])];

                                              setTempRoleSelection(prev => ({
                                                  ...prev,
                                                  [id]: selectedRoleIds, // ✅ reset from saved state
                                              }));

                                              setSavedFlyOutData(prev => {
                                                  if (prev[id]) return prev;

                                                  return {
                                                      ...prev,
                                                      [id]: {
                                                          roles: [],
                                                          users: [],
                                                      },
                                                  };
                                              });

                                              setIsRoleFlyoutOpen(true);
                                          }
                                }
                                onEdit={() => handleEditPersona(persona)}
                                onDelete={() => handleAskDeletePersona(persona)}
                                toolType={toolType}
                            />
                        ))}
                </Flex>
            </>
        );
    };

    const renderAccessAndPermissionsSection = () => {
        return (
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
                        setIsPersonaDirty(true);
                        setPermissionMatrixRows(prev => {
                            if (rowKey === 'ALL') {
                                return prev.map(row => {
                                    if (row.isPersonaSelectorRow) return row;

                                    const currentValue = row.personaAccess?.[personaId];

                                    //  IMPORTANT: only update allowed permissions
                                    if (currentValue === null) {
                                        return row; // ❌ keep X untouched
                                    }

                                    return {
                                        ...row,
                                        personaAccess: {
                                            ...row.personaAccess,
                                            [personaId]: checked, // ✅ update only allowed ones
                                        },
                                    };
                                });
                            }

                            return prev.map(row => {
                                if (row.key !== rowKey) return row;
                                return {
                                    ...row,
                                    personaAccess: {
                                        ...row.personaAccess,
                                        [personaId]: checked,
                                    },
                                };
                            });
                        });
                    }}
                />
            </div>
        );
    };

    return (
        <>
            <Flex vertical gap={8}>
                {isLoading ? (
                    <Skeleton active paragraph={{ rows: 10, width: '100%' }} />
                ) : (
                    <>
                        <ExpandableForm
                            key={'expandable-form-1'}
                            isOpen={expandToolCardSection}
                            description=""
                            title={
                                <Flex vertical gap={4}>
                                    <span className={styles['access_and_permissions_table_header']}>
                                        Tool Persona’s
                                    </span>
                                    <span
                                        className={
                                            styles['access_and_permissions_table_sub_header']
                                        }
                                    >
                                        Add all the persona’s related to the tool
                                    </span>
                                </Flex>
                            }
                            content={renderPersonaCardSection()}
                            onClick={() => setExpandToolCardSection(!expandToolCardSection)}
                            additionalContentInTitleContainer={
                                <Flex
                                    align="center"
                                    justify="center"
                                    gap={8}
                                    style={{ marginRight: 10 }}
                                >
                                    <Button
                                        text="Add Persona"
                                        variant="Secondary"
                                        className={styles['edit-mode-buttons-display']}
                                        onClick={() => handleAddPersona()}
                                    />
                                    <Icon
                                        name={expandToolCardSection ? 'chevron-up' : 'chevron-down'}
                                        size="l"
                                        color="neutrals-B800"
                                    />
                                </Flex>
                            }
                            applyCustomSpacing={true}
                        />
                        <ExpandableForm
                            key={'expandable-form'}
                            isOpen={expandAccessPermSection}
                            description=""
                            title={
                                <Flex vertical gap={4}>
                                    <span className={styles['access_and_permissions_table_header']}>
                                        Access & Permissions
                                    </span>
                                    <span
                                        className={
                                            styles['access_and_permissions_table_sub_header']
                                        }
                                    >
                                        Assign permissions to personas of each module and sub-module
                                    </span>
                                </Flex>
                            }
                            content={renderAccessAndPermissionsSection()}
                            onClick={() => setExpandAccessPermSection(!expandAccessPermSection)}
                            additionalContentInTitleContainer={
                                <Flex
                                    align="center"
                                    justify="center"
                                    gap={8}
                                    style={{ marginRight: 10 }}
                                >
                                    <Icon
                                        name={
                                            expandAccessPermSection ? 'chevron-up' : 'chevron-down'
                                        }
                                        size="l"
                                        color="neutrals-B800"
                                    />
                                </Flex>
                            }
                            applyCustomSpacing={true}
                        />
                    </>
                )}
            </Flex>

            <div className={styles['application-management-dialog']}>
                <Dialog
                    isOpen={showDialogForAddNewRole}
                    title="Add Role"
                    content={`Are you sure you want to give access to the role “${tableRef?.current?.rowRecord?.role}”? AD Group request for the same will be sent on confirmation`}
                    primaryButtonText="Add Role"
                    onPrimaryButtonClick={() => {
                        saveApplicationRolePermissionMapping();
                    }}
                    secondaryButtonText="Review Entry"
                    onSecondaryButtonClick={() => {
                        setShowDialogForAddNewRole(false);
                    }}
                    onClose={() => {
                        setShowDialogForAddNewRole(false);
                    }}
                    loading={buttonLoadingState}
                />
            </div>

            <div className={styles['application-management-dialog']}>
                <Dialog
                    isOpen={showDialogForRoleDeletion}
                    title="Confirm Deletion"
                    iconName="trash-01"
                    size="Small"
                    color="black-color"
                    variant="HeaderTitleIcon"
                    content={`Are you sure you want to remove access for role “${tableRef?.current?.rowRecord?.role}”?`}
                    primaryButtonText="Delete"
                    onPrimaryButtonClick={() => onClickHandlerForDeleteRole('delete')}
                    secondaryButtonText="Don’t Delete"
                    onSecondaryButtonClick={() => {
                        setShowDialogForRoleDeletion(false);
                    }}
                    onClose={() => {
                        setShowDialogForRoleDeletion(false);
                    }}
                    loading={buttonLoadingState}
                />
            </div>

            <Toast
                type="Delete"
                message={`Persona '${personaToDelete?.personaName}' removed.`}
                mode="Top Right"
                distance="x5l"
                toggle={showRoleDeletionToast}
                timer={5000}
                onCloseToast={() => setShowRoleDeletionToast(false)}
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

            <Toast
                type="Success"
                message={`${toolType} '${applicationParams?.appName}' updated successfully.`}
                mode="Top Right"
                distance="x5l"
                toggle={showRoleUpdationToast}
                timer={5000}
                onCloseToast={() => setShowRoleUpdationToast(false)}
            />
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
                            placeholder="Enter Name"
                            value={personaName}
                            onChange={e => setPersonaName(e.target.value)}
                        />
                        <InputField
                            label="Persona Description"
                            placeholder="Enter Description"
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

            <div className={styles['application-management-dialog']}>
                <Dialog
                    isOpen={showDialogForSaveEditChanges}
                    title="Save Changes"
                    content={`Your updates to the role access setting for the tool “${applicationParams?.appName}” will be saved. These changes may affect user access within the Command Centre.`}
                    primaryButtonText="Save"
                    onPrimaryButtonClick={onClickSaveEditChangesHandler}
                    secondaryButtonText="Continue Editing"
                    onSecondaryButtonClick={() => {
                        setShowDialogForSaveEditChanges(false);
                    }}
                    onClose={() => {
                        setShowDialogForSaveEditChanges(false);
                    }}
                    loading={buttonLoadingState}
                />
            </div>

            <div className={styles['application-management-dialog']}>
                <Dialog
                    isOpen={showDialogForCancelEditChanges}
                    title="Discard Changes"
                    content="Are you sure you want to leave without saving your changes?"
                    primaryButtonText="Discard Changes"
                    onPrimaryButtonClick={onClickCancelEditChangesHandler}
                    secondaryButtonText="Continue Editing"
                    onSecondaryButtonClick={() => {
                        setShowDialogForCancelEditChanges(false);
                    }}
                    onClose={() => {
                        setShowDialogForCancelEditChanges(false);
                    }}
                />
            </div>

            <RoleSelectionFlyoutForum
                flyoutOpen={isRoleFlyoutOpen}
                setIsFlyoutOpen={(val: boolean) => setIsRoleFlyoutOpen(val)}
                userFlyoutOpen={false}
                isRoleDataLoading={isRoleDataLoading}
                items={filteredRoles}
                hasMoreItems={hasMoreRoles}
                isLoadingMore={isLoadingMoreRoles}
                onLoadMore={handleLoadMoreRoles}
                isRoleOnlyMode={true}
                totalUsers={savedFlyOutData[activePersonaId ?? '']?.users || []}
                heading={`Select ${activePersonaName}`}
                subHeading=""
                userFlyoutHeading="Select Users"
                userFlyoutSubHeading="Search and select users for this role"
                showSearch
                searchPlaceholder="Search Roles"
                onSearchChange={value => {
                    const searchValue = Array.isArray(value) ? value.join(' ') : value;

                    if (activePersonaId) {
                        setPersonaSearchKeywords(prev => ({
                            ...prev,
                            [activePersonaId]: searchValue,
                        }));
                    }
                }}
                onUserFlyoutBack={() => {
                    setUsersFlyoutOpen(false);
                }}
                dropdownFilter={dropdownFilters}
                /* ✅ ROLE + USER TOGGLE */
                onItemToggle={(id, type) => {
                    if (type === 'Roles' && activePersonaId) {
                        setRolesAndUsers(prev => {
                            const personaId = activePersonaId!;
                            const list = prev[personaId] ?? [];

                            const updated = list.map((role: any) =>
                                String(role.roleId) === String(id)
                                    ? { ...role, checked: !role.checked }
                                    : role,
                            );

                            return {
                                ...prev,
                                [personaId]: updated, //  CRITICAL FIX
                            };
                        });
                    } else if (activePersonaId) {
                        const currentUsers = usersFlyoutData[activePersonaId] ?? [];

                        const updatedUsers = currentUsers.map(user =>
                            user.userEmail === id ? { ...user, checked: !user.checked } : user,
                        );

                        setUsersFlyoutData(prev => ({
                            ...prev,
                            [activePersonaId]: updatedUsers,
                        }));
                    }
                }}
                /* ✅ OPEN USER FLYOUT */
                onSelectUserCounter={(item: any) => {
                    setUsersFlyoutOpen(true);
                    if (!activePersonaId) return;

                    const personaRoles = rolesAndUsers[activePersonaId] ?? [];

                    const selectedRole = personaRoles.find(
                        r => String(r.roleId) === String(item.roleId),
                    );

                    const personaSavedUsers = savedFlyOutData[activePersonaId]?.users ?? [];

                    const updatedUsers =
                        selectedRole?.users.map((user: any) => {
                            const savedUser = personaSavedUsers.find(
                                (u: any) =>
                                    String(u.roleId) === String(selectedRole.roleId) &&
                                    u.userEmail === user.userEmail,
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

                    setSavedFlyOutData(prev => {
                        const personaData = prev[activePersonaId] ?? {
                            roles: [],
                            users: [],
                        };

                        const alreadyExists = personaData.users.some(
                            (u: any) => String(u.roleId) === String(selectedRole?.roleId),
                        );

                        if (alreadyExists) return prev;

                        return {
                            ...prev,
                            [activePersonaId]: {
                                ...personaData,
                                users: [
                                    ...personaData.users,
                                    ...updatedUsers.map((u: any) => ({
                                        ...u,
                                        checked: true,
                                    })),
                                ],
                            },
                        };
                    });
                }}
                /* ✅ SELECT ALL */
                showSelectAll={!showSelectedOnly && filteredRoles.length > 0}
                isAllSelected={
                    (rolesAndUsers[activePersonaId ?? ''] ?? []).length > 0 &&
                    (rolesAndUsers[activePersonaId ?? ''] ?? []).every(r => r.checked)
                }
                onSelectAllToggle={() => {
                    const personaId = activePersonaId ?? '';
                    const list = rolesAndUsers[personaId] ?? [];

                    const shouldSelectAll = !list.every(r => r.checked);

                    const updated = list.map((r: any) => ({
                        ...r,
                        checked: shouldSelectAll,
                    }));

                    setRolesAndUsers(prev => ({
                        ...prev,
                        [personaId]: updated, // ✅ CRITICAL FIX
                    }));
                }}
                /* ✅ ROLE SAVE */
                primaryBtnProps={{
                    text: 'Save',
                    variant: 'Primary',
                    onClick: () => {
                        if (!activePersonaId) return;

                        const personaRoles = rolesAndUsers[activePersonaId] ?? [];

                        const selectedRoleIds = personaRoles
                            .filter(r => r.checked)
                            .map(r => String(r.roleId));
                        // ✅ IMPORTANT: Sync tempRoleSelection also
                        setTempRoleSelection(prev => ({
                            ...prev,
                            [activePersonaId]: selectedRoleIds,
                        }));

                        // ✅ update role selection map
                        setPersonaRoleSelection(prev => ({
                            ...prev,
                            [activePersonaId]: selectedRoleIds,
                        }));

                        // ✅ IMPORTANT: update persona object for UI

                        setToolPersonas(prev =>
                            prev.map(p =>
                                String(p.personaId) === activePersonaId
                                    ? {
                                          ...p,
                                          roleIds: selectedRoleIds.map(Number),
                                          rolesCount: selectedRoleIds.length,
                                      }
                                    : p,
                            ),
                        );

                        // ✅ update saved roles
                        setSavedFlyOutData(prev => ({
                            ...prev,
                            [activePersonaId]: {
                                ...(prev[activePersonaId] ?? {}),
                                roles: personaRoles.filter(r => r.checked),
                                users: prev[activePersonaId]?.users ?? [],
                            },
                        }));

                        // ✅ Close flyout LAST (important)
                        setIsRoleFlyoutOpen(false);
                    },
                }}
                cancelBtnProps={{
                    disabled: false,
                    onClick: () => setShowSelectedOnly(prev => !prev),
                    text: showSelectedOnly
                        ? 'Show All'
                        : `View Selected (${getSelectedRolesCount()})`,
                    variant: 'Subtle2',
                }}
                secondaryBtnProps={{
                    disabled: false,
                    onClick: () => setIsRoleFlyoutOpen(false),
                    text: 'Cancel',
                    variant: 'Secondary',
                }}
                /* ✅ USER SAVE */
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
                                    users: personaUsersFromState, // direct overwrite
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
        </>
    );
}
