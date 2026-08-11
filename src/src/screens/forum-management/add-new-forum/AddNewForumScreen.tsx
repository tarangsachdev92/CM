import { useState, useEffect, useRef } from 'react';
import { Row, Col, Flex } from 'antd';
import { InputField, DropDown, Button, Icon, Dialog, Toast } from 'konnect-react-components';
import { ExpandableForm, Label } from '../../../components';
import styles from './AddNewForumScreen.module.scss';
import { Link } from 'react-router-dom';
import { BackArrowIcon } from '../../../assets/icons/icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, fetchRoleData, RootState } from '../../../store';
import { saveForumV1 } from '../../../store/thunks/addNewForums';
import {
    fetchForumDropdownInit,
    fetchSubFunctions,
    fetchRegions,
    fetchClusters,
    fetchMarkets,
    fetchSites,
    fetchPersona,
} from '../../../store/thunks/forumMasterData';
import {
    FlyoutCheckboxItemForum,
    RoleSelectionFlyoutForum,
} from '../../../components/organisms/role-selection-flyout/RoleSelectionFlyoutForum';
import ForumAccessNewDataTable, {
    TableRowData,
} from '../../../components/organisms/forums/ForumAccessNewDataTable';
import Style from './AddNewForumScreen.module.scss';
import { toCommaSeparated } from '../../../utils/helpers';
import { ROLE_SELECTION_PAGE_NUMBER, ROLE_SELECTION_PAGE_SIZE } from '../../../utils/constants';

import { getRoleSelection, getRoleUserSelection } from '../../../services/application';
import { OptionType } from '../../../types/common';

function AddNewForumScreen() {
    const dispatch = useDispatch<AppDispatch>();

    const {
        functions,
        geographyLevels,
        forumPeriods,
        subFunctions,
        regions,
        clusters,
        markets,
        sites,
        personas,
    } = useSelector((state: RootState) => state.forumMaster);

    useEffect(() => {
        dispatch(fetchForumDropdownInit());
        dispatch(fetchRegions());
        dispatch(fetchPersona());
    }, []);

    const [openGeneral, setOpenGeneral] = useState(true);
    const [openGeo, setOpenGeo] = useState(false);
    const [openPersona, setOpenPersona] = useState(false);
    const [openCancelDialog, setOpenCancelDialog] = useState<boolean>(false);
    const [isGeneralSaved, setIsGeneralSaved] = useState(false);
    const [isGeoSaved, setIsGeoSaved] = useState(false);
    const [isForumAccessOpen, setIsForumAccessOpen] = useState(false);
    const [payloadState, setPayloadState] = useState<any>(null);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const isSaveApplicationEnabled = isGeneralSaved && isGeoSaved;

    // General Info
    const [forumName, setForumName] = useState('');
    const [roleFunction, setRoleFunction] = useState<any[]>([]);
    const [roleSubFunction, setRoleSubFunction] = useState<any[]>([]);
    const [geoLevel, setGeoLevel] = useState<any>(null);
    const [forumPeriod, setForumPeriod] = useState<any>(null);

    // flyout states
    const [rolesAndUsers, setRolesAndUsers] = useState<any[]>([]);
    const [savedFlyOutData, setSavedFlyoutData] = useState<{ roles: any; users: any }>({
        roles: [],
        users: [],
    });
    const [usersFlyoutData, setUsersFlyoutData] = useState<any>([]);
    const [isRoleFlyoutOpen, setIsRoleFlyoutOpen] = useState(false);
    const [isUsersFlyoutOpen, setUsersFlyoutOpen] = useState(false);
    const [activePersonaName, setActivePersonaName] = useState<string | null>(null);
    const [selectedForumAccessRows, setSelectedForumAccessRows] = useState<TableRowData[]>([]);
    const [roleFlyoutOpenClicked, setRoleFlyoutOpenClicked] = useState<boolean>();
    const [usersFlyoutOpenClicked, setUsersFlyoutOpenClicked] = useState<boolean>();
    const [isRoleOnlyMode, setIsRoleOnlyMode] = useState(true);
    const [activeFlyoutContext, setActiveFlyoutContext] = useState<'role' | 'forumOwner'>('role');
    const [flyoutSearchPlaceholder, setFlyoutSearchPlaceholder] = useState<string | undefined>();
    const [selectedRoleFlyoutRow, setSelectedRoleFlyoutRow] = useState<TableRowData>();
    const [forumAccessTableData, setForumAccessTableData] = useState<TableRowData[]>([]);
    const [clearTableSelection, setClearTableSelection] = useState(false);
    const { columnFilters } = useSelector((state: RootState) => state.roleData);
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [isFlyoutEditable, setIsFlyoutEditable] = useState(true);
    const [filteredRoles, setFilteredRoles] = useState<any[]>([]);
    const [isRoleDataLoading, setIsRoleDataLoading] = useState(false);
    const [hasMoreRoles, setHasMoreRoles] = useState(true);
    const [isLoadingMoreRoles, setIsLoadingMoreRoles] = useState(false);
    const latestRoleRequestRef = useRef(0);
    const flyoutJustOpenedRef = useRef(false);
    const rolePageRef = useRef(ROLE_SELECTION_PAGE_NUMBER);

    const [selectedFilters, setSelectedFilters] = useState({
        function: [],
        subfunction: [],
        geographyLevel: [],
        rolelevel: [],
        userGroup: [],
    });
    const [searchKeyword, setSearchKeyword] = useState('');

    const [roleOptionsDD, setRoleOptionsDD] = useState<OptionType[]>([]);
    const [rolePageDD, setRolePageDD] = useState(1);
    const [hasMoreRolesDD, setHasMoreRolesDD] = useState(true);
    const [selectedRolesDD, setSelectedRolesDD] = useState<OptionType[]>([]);

    const { loading, error } = useSelector((state: RootState) => state.addNewForums);

    // Geo Info
    const [region, setRegion] = useState<any[]>([]);
    const [cluster, setCluster] = useState<any[]>([]);
    const [market, setMarket] = useState<any[]>([]);
    const [site, setSite] = useState<any[]>([]);

    const handleFunctionChange = (selected: any) => {
        if (!selected) return;
        const normalized = {
            label: selected.label || selected.title,
            value: selected.value,
        };

        setRoleFunction([normalized]);

        const functionId = normalized.value;
        if (functionId) {
            dispatch(fetchSubFunctions(functionId));
        }

        setRoleSubFunction([]);
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

    useEffect(() => {
        const gridFilters = buildGridFilters();

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

    const handleRegionChange = async (_: any, __: any, tree: any[]) => {
        const isAllSelected = tree.some(item => item.value === 'ALL');

        let selected: any[] = [];

        if (isAllSelected) {
            selected = regions.map(r => ({
                label: r.regionName,
                value: r.regionId,
            }));

            setRegion(selected);
        } else {
            setRegion(tree);
        }
        handleGeoEdit();
        const ids = selected.length
            ? selected.map(i => String(i.value))
            : tree.map(i => String(i.value));

        if (ids.length) {
            await dispatch(fetchClusters(ids));
        }

        setCluster([]);
        setMarket([]);
        setSite([]);
    };
    const handleClusterChange = async (_: any, __: any, tree: any[]) => {
        const isAllSelected = tree.some(item => item.value === 'ALL');

        let selected: any[] = [];

        if (isAllSelected) {
            selected = clusters.map(c => ({
                label: c.clusterName,
                value: c.clusterId,
            }));

            setCluster(selected);
        } else {
            setCluster(tree);
        }
        handleGeoEdit();
        const ids = selected.length
            ? selected.map(i => String(i.value))
            : tree.map(i => String(i.value));

        if (ids.length) {
            await dispatch(fetchMarkets(ids));
        }

        setMarket([]);
        setSite([]);
    };
    const handleMarketChange = (_: any, __: any, tree: any[]) => {
        const isAllSelected = tree.some(item => item.value === 'ALL');

        let selected: any[] = [];

        if (isAllSelected) {
            selected = markets.map(m => ({
                label: m.marketName,
                value: m.marketId,
            }));

            setMarket(selected);
        } else {
            setMarket(tree);
        }
        handleGeoEdit();
        const ids = selected.length
            ? selected.map(i => String(i.value))
            : tree.map(i => String(i.value));

        if (ids.length) {
            dispatch(fetchSites(ids));
        }

        setSite([]);
    };
    const handleSiteChange = (_: any, __: any, tree: any[]) => {
        const isAllSelected = tree.some(item => item.value === 'ALL');

        if (isAllSelected) {
            const selected = sites.map(s => ({
                label: s.siteName,
                value: s.siteId,
            }));

            setSite(selected);
        } else {
            setSite(tree);
        }
        handleGeoEdit();
    };
    // ---------------- HELPERS ----------------

    const isGeoEnabled = (selectedLevel: number, requiredLevel: number) => {
        return !!selectedLevel && selectedLevel >= requiredLevel;
    };

    // ---------------- VALIDATIONS ----------------

    const isGeneralValid =
        !!forumName &&
        roleFunction.length > 0 &&
        roleSubFunction.length > 0 &&
        !!geoLevel &&
        !!forumPeriod;

    const isGeoValid = () => {
        if (!region.length) return false;

        if (isGeoEnabled(geoLevel?.value, 2) && !cluster.length) return false;
        if (isGeoEnabled(geoLevel?.value, 3) && !market.length) return false;
        if (isGeoEnabled(geoLevel?.value, 4) && !site.length) return false;

        return true;
    };

    const handleGeneralSave = () => {
        setIsGeneralSaved(true);
        setOpenGeneral(false); // collapse
        setOpenGeo(true);
    };

    const handleGeoSave = () => {
        setIsGeoSaved(true);
        setOpenGeo(false);
        setOpenPersona(true);
    };

    const handleSubFunctionChange = (selected: any) => {
        if (!selected) return;

        const normalized = {
            label: selected.label || selected.title,
            value: selected.value,
        };

        setRoleSubFunction([normalized]);
    };

    const handleEditGeneral = () => {
        if (isGeneralSaved) {
            setIsGeneralSaved(false);
            setIsGeoSaved(false);

            setOpenGeneral(true);
            setOpenGeo(false);
            setOpenPersona(false);
            setIsForumAccessOpen(false);

            setRegion([]);
            setCluster([]);
            setMarket([]);
            setSite([]);
        }
    };
    const handleGeoEdit = () => {
        if (isGeoSaved) {
            setIsGeoSaved(false);
        }
    };
    const handleBackClick = (e: any) => {
        e.preventDefault();

        if (isDirty) {
            setOpenCancelDialog(true); // show modal
        } else {
            window.location.href = '/admin-hub/Forum-management';
        }
    };

    const handleFunctionDropdownChange = (option: any) => {
        handleFunctionChange(option);
        handleEditGeneral();
    };

    const handleSubFunctionDropdownChange = (option: any) => {
        handleSubFunctionChange(option);
        handleEditGeneral();
    };
    const allowed = ['Forum Owner', 'Decision Owner', 'Viewer'];

    const activePersonas = personas?.filter(p => p.isActive && allowed.includes(p.personaName));

    const handleSaveForum = () => {
        const forumOwners = forumAccessTableData.flatMap((row: any) => {
            let geographyId;

            switch (geoLevel?.label?.toLowerCase()) {
                case 'site':
                    geographyId = row.siteId;
                    break;
                case 'market':
                    geographyId = row.marketId;
                    break;
                case 'cluster':
                    geographyId = row.clusterId;
                    break;
                case 'region':
                    geographyId = row.regionId;
                    break;
                default:
                    geographyId = null;
            }

            const selectedUsers = row.users ?? [];
            const selectedRoles = row.roles ?? [];

            // Nothing selected
            if (selectedUsers.length === 0 && selectedRoles.length === 0) {
                return [
                    {
                        GeographyId: geographyId,
                        RoleId: null,
                        userEmail: null,
                    },
                ];
            }

            // Roles selected but no users selected
            if (selectedRoles.length > 0 && selectedUsers.length === 0) {
                return selectedRoles.map((role: any) => ({
                    GeographyId: geographyId,
                    RoleId: role.roleId,
                    userEmail: null,
                }));
            }

            // Users selected
            return selectedUsers.map((user: any) => ({
                GeographyId: geographyId,
                RoleId: user.roleId,
                userEmail: user.userEmail,
            }));
        });
        const buildField = (selected: any[], allOptions: any[]) => {
            const isAll = selected.length > 0 && selected.length === allOptions.length;

            return {
                ids: selected.length ? selected.map(i => i.value).join(',') : null,
                isAll,
            };
        };

        const regionData = buildField(region, regions);
        const clusterData = buildField(cluster, clusters);
        const marketData = buildField(market, markets);
        const siteData = buildField(site, sites);

        const payload = {
            forumName,

            functionId: Number(roleFunction[0]?.value),
            subFunctionId: Number(roleSubFunction[0]?.value),

            geographyLevelId: Number(geoLevel?.value),
            periodId:
                forumPeriod?.value !== undefined && forumPeriod?.value !== null
                    ? Number(forumPeriod.value)
                    : null,

            regionId: regionData.ids,
            clusterId: clusterData.ids,
            marketId: marketData.ids,
            siteId: siteData.ids,

            isRegionAll: regionData.isAll,
            isClusterAll: clusterData.isAll,
            isMarketAll: marketData.isAll,
            isSiteAll: siteData.isAll,
            forumOwners: forumOwners,
        };

        setPayloadState(payload);
        setShowSaveConfirm(true);
    };

    useEffect(() => {
        if (error) {
            setToastConfig({
                type: 'Error',
                title: 'Error',
                message: error,
            });
        }
    }, [error]);

    const [toastConfig, setToastConfig] = useState<{
        type: 'Success' | 'Error' | 'Default' | 'Warning';
        title: string;
        message: string;
    } | null>(null);

    const confirmSaveForum = async () => {
        let response;
        if (payloadState) {
            response = await dispatch(saveForumV1(payloadState));
        }
        if (response) {
            setShowSaveConfirm(false);
            setToastConfig({
                type: 'Success',
                title: 'Forum Saved',
                message: `${forumName} has been added successfully`,
            });
            setTimeout(() => {
                window.location.href = '/admin-hub/Forum-management';
            }, 900);
        } else {
            setToastConfig({
                type: 'Error',
                title: 'API Error',
                message: 'Error occured while saving the forum',
            });
        }
    };

    useEffect(() => {
        if (!isRoleFlyoutOpen) {
            flyoutJustOpenedRef.current = false;
            latestRoleRequestRef.current += 1;
            setIsRoleDataLoading(false);
            setIsLoadingMoreRoles(false);
            setShowSelectedOnly(false);
            return;
        }

        const requestId = ++latestRoleRequestRef.current;
        setIsRoleDataLoading(true);
        rolePageRef.current = ROLE_SELECTION_PAGE_NUMBER;
        setHasMoreRoles(true);
        // only clear rolesAndUsers on fresh flyout open, not on every search/filter change
        const justOpened = !flyoutJustOpenedRef.current;
        flyoutJustOpenedRef.current = true;
        if (justOpened) {
            setRolesAndUsers([]);
        }
        setFilteredRoles([]);

        const isForumOwnerContext = activeFlyoutContext === 'forumOwner';

        fetchDataForRolesAndUserFlyout(
            requestId,
            isForumOwnerContext,
            ROLE_SELECTION_PAGE_NUMBER,
            false,
        )
            .catch(() => {})
            .finally(() => {
                if (requestId === latestRoleRequestRef.current) {
                    setIsRoleDataLoading(false);
                }
            });
    }, [isRoleFlyoutOpen, searchKeyword, selectedFilters, activeFlyoutContext]);

    const mergeRoleLists = (
        previousRoles: any[] = [],
        incomingRoles: any[] = [],
        selectedRoleIdsForRow: Set<string>,
    ) => {
        const mergedByRoleId = new Map<string, any>();

        previousRoles.forEach(role => {
            mergedByRoleId.set(String(role.roleId), role);
        });

        incomingRoles.forEach(role => {
            const roleIdKey = String(role.roleId);
            const existing = mergedByRoleId.get(roleIdKey);

            if (!existing) {
                mergedByRoleId.set(roleIdKey, {
                    ...role,
                    checked: selectedRoleIdsForRow.has(roleIdKey),
                });
                return;
            }

            const existingUsers = Array.isArray(existing.users) ? existing.users : [];
            const incomingUsers = Array.isArray(role.users) ? role.users : [];

            const seenUsers = new Set(
                existingUsers.map((u: any) =>
                    String(u.userEmail ?? u.email ?? u.userName ?? `${u.roleId ?? ''}`),
                ),
            );
            const mergedUsers = [...existingUsers];

            incomingUsers.forEach((user: any) => {
                const userKey = String(
                    user.userEmail ?? user.email ?? user.userName ?? `${user.roleId ?? ''}`,
                );
                if (!seenUsers.has(userKey)) {
                    seenUsers.add(userKey);
                    mergedUsers.push(user);
                }
            });

            mergedByRoleId.set(roleIdKey, {
                ...existing,
                ...role,
                users: mergedUsers,
                checked: existing.checked,
            });
        });

        return Array.from(mergedByRoleId.values());
    };

    useEffect(() => {
        if (roleOptionsDD.length === 0) {
            fetchRolesDD(1);
        }
    }, [selectedForumAccessRows.length]);

    const handleLoadMoreRoles = async () => {
        if (!isRoleFlyoutOpen || activeFlyoutContext === 'forumOwner') return;
        if (!hasMoreRoles || isLoadingMoreRoles || isRoleDataLoading) return;

        const nextPage = rolePageRef.current + 1;
        const requestId = ++latestRoleRequestRef.current;

        setIsLoadingMoreRoles(true);

        try {
            await fetchDataForRolesAndUserFlyout(requestId, false, nextPage, true);
        } catch {
            // Keep existing list if load-more fails.
        } finally {
            if (requestId === latestRoleRequestRef.current) {
                setIsLoadingMoreRoles(false);
            }
        }
    };
    const getRoleGeographyLevelFilter = () => {
        switch (geoLevel?.label?.toLowerCase()) {
            case 'site':
                return '4';
 
            case 'market':
                return '3,4';
 
            case 'cluster':
                return '2,3,4';
 
            case 'region':
                return '1,2,3,4';
 
            case 'global':
                return '1,2,3,4';
 
            default:
                return null;
        }
    };
    const isDirty =
        !!forumName ||
        roleFunction.length > 0 ||
        roleSubFunction.length > 0 ||
        !!geoLevel ||
        !!forumPeriod ||
        region.length > 0 ||
        cluster.length > 0 ||
        market.length > 0 ||
        site.length > 0;

    const fetchDataForRolesAndUserFlyout = async (
        requestId: number,
        isForumOwnerContext: boolean,
        pageNumber: number = ROLE_SELECTION_PAGE_NUMBER,
        appendRoles: boolean = false,
    ) => {
        try {
            const baseFilterPayload = {
                geographyLevelId: getRoleGeographyLevelFilter(),
                functionId: toCommaSeparated(selectedFilters.function),
                subFunctionId: toCommaSeparated(selectedFilters.subfunction),
                roleResponsibilityLevelId: toCommaSeparated(selectedFilters.rolelevel),
                userGroupId: toCommaSeparated(selectedFilters.userGroup),
                isLeadership: null,
                locationId: null,
                searchKeyword: searchKeyword.trim() || undefined,
                pageNumber,
                pageSize: ROLE_SELECTION_PAGE_SIZE,
            };
            let roleIds;
            if (isForumOwnerContext) {
                roleIds = selectedRoleFlyoutRow?.roles.map((role: any) => role.roleId).join(',');
            }
            const rolesAndUserData = isForumOwnerContext
                ? await getRoleUserSelection({
                      ...baseFilterPayload,
                      roleId: roleIds,
                      userEmail: null,
                  })
                : await getRoleSelection({
                      ...baseFilterPayload,
                      roleId: null,
                  });

            if (requestId !== latestRoleRequestRef.current) return;

            const roleUserRows = rolesAndUserData.data.data;

            if (!isForumOwnerContext) {
                setHasMoreRoles(roleUserRows.length >= ROLE_SELECTION_PAGE_SIZE);
                if (appendRoles && roleUserRows.length > 0) {
                    rolePageRef.current = pageNumber;
                }
                if (!appendRoles) {
                    rolePageRef.current = ROLE_SELECTION_PAGE_NUMBER;
                }
            } else {
                setHasMoreRoles(false);
            }

            const roleMap = roleUserRows.reduce((acc: any, item: any) => {
                const key = `${item.roleId}`;

                if (!acc[key]) {
                    acc[key] = {
                        roleId: item.roleId,
                        roleName: item.roleName,
                        functionId: item.functionId,
                        functionName: item.functionName,
                        subFunctionId: item.subFunctionId,
                        subFunctionName: item.subFunctionName,
                        geographyLevelId: item.geographyLevelId,
                        geographyLevelName: item.geographyLevelName,
                        responsibilityLevelId: item.responsibilityLevelId,
                        responsibilityLevelName: item.responsibilityLevelName,
                        users: [],
                    };
                }

                return acc;
            }, {});

            roleUserRows.forEach((item: any) => {
                const key = `${item.roleId}`;
                if (!key) return;
                if (!roleMap[key]) {
                    roleMap[key] = {
                        roleId: item.roleId,
                        roleName: item.roleName,
                        functionId: item.functionId,
                        functionName: item.functionName,
                        subFunctionId: item.subFunctionId,
                        subFunctionName: item.subFunctionName,
                        geographyLevelId: item.geographyLevelId,
                        geographyLevelName: item.geographyLevelName,
                        responsibilityLevelId: item.responsibilityLevelId,
                        responsibilityLevelName: item.responsibilityLevelName,
                        users: [],
                    };
                }

                if (isForumOwnerContext && item.userEmail) {
                    roleMap[key].users.push({
                        roleId: item.roleId,
                        fullName: item.fullName,
                        userEmail: item.userEmail,
                        userName: item.userName,
                        userGroupId: item.userGroupId,
                        userGroupName: item.userGroupName,
                        userGroupEmail: item.userGroupEmail,
                    });
                }
            });
            const groupedResponse = Object.values(roleMap);
            let rolesForDisplay = groupedResponse;

            if (!isForumOwnerContext && !appendRoles) {
                const selectedRoles = selectedRoleFlyoutRow?.roles ?? [];

                const loadedRoleIds = new Set(
                    groupedResponse.map((role: any) => String(role.roleId)),
                );

                const missingSelectedRoles = selectedRoles.filter(
                    (role: any) => !loadedRoleIds.has(String(role.roleId)),
                );

                rolesForDisplay = [...missingSelectedRoles, ...groupedResponse];
            }
            const selectedRoleIdsForRow = new Set(
                (selectedRoleFlyoutRow?.roles || []).map((role: any) => String(role.roleId)),
            );
            const allRoleswithUsersMappedData = rolesForDisplay.map((item: any) => ({
                ...item,
                checked: selectedRoleIdsForRow.has(String(item.roleId)),
            }));

            const usersFlyoutData = groupedResponse.flatMap((item: any) =>
                item.users.map((userItem: any) => {
                    return {
                        ...userItem,
                        checked: false,
                        roleId: item.roleId,
                    };
                }),
            );
            setUsersFlyoutData(usersFlyoutData);
            if (isForumOwnerContext) {
                const forumOwnerRoles = (selectedRoleFlyoutRow?.roles ?? []).map(
                    (savedRole: any) => {
                        const apiRole: any = groupedResponse.find(
                            (role: any) => String(role.roleId) === String(savedRole.roleId),
                        );

                        const userCount = apiRole?.users?.length ?? 0;

                        return {
                            ...savedRole,
                            ...(apiRole ?? {}),
                            checked: true,
                            userCount,
                            users: apiRole?.users ?? [],
                        };
                    },
                );

                // keep existing role flyout data untouched
                setRolesAndUsers(allRoleswithUsersMappedData);

                // forum owner should display selected roles
                setFilteredRoles(forumOwnerRoles);
            } else if (!appendRoles) {
                // filteredRoles = current API results for display filtering only
                setFilteredRoles(groupedResponse.map((item: any) => ({ ...item, checked: false })));
                if (groupedResponse.length > 0) {
                    setRolesAndUsers(prev => {
                        if (prev.length === 0) {
                            // initial open: restore from saved selections
                            return allRoleswithUsersMappedData;
                        }
                        // search/filter change: preserve in-flyout checked state
                        const prevById = new Map(prev.map(r => [String(r.roleId), r]));
                        const currentIds = new Set(groupedResponse.map((r: any) => String(r.roleId)));
                        const preservedChecked = prev.filter(r => r.checked && !currentIds.has(String(r.roleId)));
                        const merged = groupedResponse.map((item: any) => ({
                            ...item,
                            checked: prevById.get(String(item.roleId))?.checked ?? false,
                        }));
                        return [...preservedChecked, ...merged];
                    });
                }
            } else {
                setRolesAndUsers((prev: any[]) =>
                    mergeRoleLists(prev, groupedResponse, selectedRoleIdsForRow as Set<string>),
                );

                setFilteredRoles((prev: any[]) =>
                    mergeRoleLists(prev, groupedResponse, selectedRoleIdsForRow as Set<string>),
                );
            }
            if (isForumOwnerContext) {
                setSavedFlyoutData((prev: any) => ({
                    ...prev,
                    users: groupedResponse.flatMap((item: any) =>
                        item.users.map((userItem: any) => {
                            return {
                                ...userItem,
                                checked: false,
                                roleId: item.roleId,
                            };
                        }),
                    ),
                }));
            }
        } catch (error) {
            if (requestId === latestRoleRequestRef.current) {
                if (!appendRoles) {
                    setRolesAndUsers([]);
                    setFilteredRoles([]);
                }
            }
            console.error('Error fetching permissions:', error);
        }
    };

    const handleCancelClick = () => {
        setIsFlyoutEditable(true);

        if (isDirty) {
            setOpenCancelDialog(true);
        } else {
            window.location.href = '/admin-hub/Forum-management';
        }
    };
    const getUserGroupOptions = () => {
        const uniqueGroups = new Map<string, { label: string; value: string }>();

        rolesAndUsers.forEach((item: any) => {
            if (item.userGroupId && item.userGroupName) {
                uniqueGroups.set(String(item.userGroupId), {
                    label: item.userGroupName,
                    value: String(item.userGroupId),
                });
            }
        });

        return Array.from(uniqueGroups.values());
    };

    const handleMultiSelectChange = (key: string) => {
        return (_option: any, _checked: boolean, tree: any[]) => {
            setSelectedFilters((prev: any) => ({
                ...prev,
                [key]: tree || [],
            }));
        };
    };

    const mapToOptions = (data: any[] = []) =>
        data.map(item => ({
            label: item.columnValue,
            value: item.id ?? item.columnValue,
        }));

    const mapSelectedOptions = (list: any[] = []) =>
        list.map(item => ({
            label: item.label,
            value: String(item.value),
        }));

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

    useEffect(() => {
        setForumAccessTableData(prev =>
            prev?.map(item => {
                return {
                    ...item,
                    roles:
                        item.rowId === selectedRoleFlyoutRow?.rowId
                            ? selectedRoleFlyoutRow.roles
                            : item.roles,
                    users:
                        item.rowId === selectedRoleFlyoutRow?.rowId
                            ? selectedRoleFlyoutRow.users
                            : item.users,
                };
            }),
        );
        setRolesAndUsers(
            rolesAndUsers.map(item => {
                return {
                    ...item,
                    checked: false,
                };
            }),
        );
        setIsRoleFlyoutOpen(false);
        setUsersFlyoutOpen(false);
        setRoleFlyoutOpenClicked(false);
        setUsersFlyoutOpenClicked(false);
    }, [selectedRoleFlyoutRow]);

    const onSaveRoleAndUserFlyout = () => {
        setSelectedRoleFlyoutRow(prev =>
            prev ? { ...prev, roles: savedFlyOutData.roles, users: savedFlyOutData.users } : prev,
        );
    };
    const buildRowsFromRegions = (): TableRowData[] => {
        return region.map(reg => ({
            rowId: 0,

            regionId: reg.value,
            regionName: reg.label,

            clusterId: 0,
            clusterName: '',

            marketId: 0,
            marketName: '',

            siteId: 0,
            siteName: '',

            roles: [],
            users: [],
        }));
    };

    const buildRowsFromClusters = (): TableRowData[] => {
        const rows: TableRowData[] = [];

        cluster.forEach(selectedCluster => {
            const clusterObj = clusters.find(c => c.clusterId === selectedCluster.value);

            if (!clusterObj) return;

            const regionObj = regions.find(r => r.regionId === clusterObj.regionId);

            rows.push({
                rowId: 0,

                regionId: regionObj?.regionId ?? 0,
                regionName: regionObj?.regionName ?? '',

                clusterId: clusterObj.clusterId,
                clusterName: clusterObj.clusterName,

                marketId: 0,
                marketName: '',

                siteId: 0,
                siteName: '',

                roles: [],
                users: [],
            });
        });

        return rows;
    };

    const buildRowsFromMarkets = (): TableRowData[] => {
        const rows: TableRowData[] = [];

        market.forEach(selectedMarket => {
            const marketObj = markets.find(m => m.marketId === selectedMarket.value);

            if (!marketObj) return;

            const clusterObj = clusters.find(c => c.clusterId === marketObj.clusterId);

            if (!clusterObj) return;

            const regionObj = regions.find(r => r.regionId === clusterObj.regionId);

            rows.push({
                rowId: 0,

                regionId: regionObj?.regionId ?? 0,
                regionName: regionObj?.regionName ?? '',

                clusterId: clusterObj.clusterId,
                clusterName: clusterObj.clusterName,

                marketId: marketObj.marketId,
                marketName: marketObj.marketName,

                siteId: 0,
                siteName: '',

                roles: [],
                users: [],
            });
        });

        return rows;
    };

    const buildRowsFromSites = (): TableRowData[] => {
        const rows: TableRowData[] = [];

        site.forEach(selectedSite => {
            const siteObj = sites.find(s => s.siteId === selectedSite.value);

            if (!siteObj) return;

            const marketObj = markets.find(m => m.marketId === siteObj.marketId);

            if (!marketObj) return;

            const clusterObj = clusters.find(c => c.clusterId === marketObj.clusterId);

            if (!clusterObj) return;

            const regionObj = regions.find(r => r.regionId === clusterObj.regionId);

            rows.push({
                rowId: 0,

                regionId: regionObj?.regionId ?? 0,
                regionName: regionObj?.regionName ?? '',

                clusterId: clusterObj.clusterId,
                clusterName: clusterObj.clusterName,

                marketId: marketObj.marketId,
                marketName: marketObj.marketName,

                siteId: siteObj.siteId,
                siteName: siteObj.siteName,

                roles: [],
                users: [],
            });
        });

        return rows;
    };
    const getForumAccessTableData = (): TableRowData[] => {
        let data: TableRowData[] = [];
        switch (geoLevel.label) {
            case 'Region':
                data = buildRowsFromRegions();
                break;

            case 'Cluster':
                data = buildRowsFromClusters();
                break;

            case 'Market':
                data = buildRowsFromMarkets();
                break;

            case 'Site':
                data = buildRowsFromSites();
                break;

            case 'Global':
                // Use lowest selected geography

                if (site.length > 0) {
                    data = buildRowsFromSites();
                } else if (market.length > 0) {
                    data = buildRowsFromMarkets();
                } else if (cluster.length > 0) {
                    data = buildRowsFromClusters();
                } else {
                    data = buildRowsFromRegions();
                }

                break;

            default:
                data = [];
        }

        return data.map((row, index) => ({
            ...row,
            rowId: index + 1,
        }));
    };

    useEffect(() => {
        if (region?.length == 0) return;
        const data = getForumAccessTableData();
        setForumAccessTableData(data);
    }, [region, cluster, market, site]);

    useEffect(() => {
        if (
            roleFlyoutOpenClicked == null ||
            roleFlyoutOpenClicked == undefined ||
            roleFlyoutOpenClicked == false
        )
            return;
        setUsersFlyoutOpen(false);
        setIsRoleFlyoutOpen(true);
        setIsRoleOnlyMode(true);
        setActiveFlyoutContext('role');
        setActivePersonaName('Roles');
        setFlyoutSearchPlaceholder('Search Roles');
    }, [roleFlyoutOpenClicked]);

    useEffect(() => {
        const tempRolesAndUsers = rolesAndUsers.map(item => {
            const selectedRole = selectedRoleFlyoutRow?.roles?.find(
                (r: any) => r.roleId === item.roleId,
            );
            return {
                ...item,
                checked: selectedRole ? selectedRole.checked : false,
                users: item.users.map((useritem: any) => {
                    const selectedUser = item.users.find(
                        (user: any) => useritem.userEmail === user.userEmail,
                    );
                    return { ...useritem, checked: selectedUser ? selectedUser.checked : false };
                }),
            };
        });
        setRolesAndUsers(tempRolesAndUsers);
        setIsFlyoutEditable(true);
    }, [roleFlyoutOpenClicked]);

    useEffect(() => {
        if (
            usersFlyoutOpenClicked == null ||
            usersFlyoutOpenClicked == undefined ||
            usersFlyoutOpenClicked == false
        )
            return;
        const requestId = ++latestRoleRequestRef.current;
        setIsRoleDataLoading(true);
        rolePageRef.current = ROLE_SELECTION_PAGE_NUMBER;
        const isForumOwnerContext = activeFlyoutContext === 'forumOwner';

        setIsFlyoutEditable(false);
        setUsersFlyoutOpen(false);
        setIsRoleFlyoutOpen(true);
        setIsRoleOnlyMode(false);
        setActiveFlyoutContext('forumOwner');
        setActivePersonaName('Forum Owner');
        fetchDataForRolesAndUserFlyout(
            requestId,
            isForumOwnerContext,
            ROLE_SELECTION_PAGE_NUMBER,
            false,
        )
            .catch(() => {})
            .finally(() => {
                if (requestId === latestRoleRequestRef.current) {
                    setIsRoleDataLoading(false);
                }
            });
        const rolesWithUserCount = (selectedRoleFlyoutRow?.roles ?? []).reduce(
            (acc: any[], role: any) => {
                const alreadyExists = acc.some(item => String(item.roleId) === String(role.roleId));

                if (alreadyExists) {
                    return acc;
                }

                const userCount = (selectedRoleFlyoutRow?.users ?? []).filter(
                    (user: any) => String(user.roleId) === String(role.roleId),
                ).length;

                acc.push({
                    ...role,
                    checked: true,
                    userCount,
                });

                return acc;
            },
            [],
        );

        setFilteredRoles(rolesWithUserCount);
    }, [usersFlyoutOpenClicked]);

    useEffect(() => {
        const requestId = ++latestRoleRequestRef.current;
        setIsRoleDataLoading(true);
        rolePageRef.current = ROLE_SELECTION_PAGE_NUMBER;
        fetchDataForRolesAndUserFlyout(requestId, false, ROLE_SELECTION_PAGE_NUMBER, false)
            .catch(() => {})
            .finally(() => {
                if (requestId === latestRoleRequestRef.current) {
                    setIsRoleDataLoading(false);
                }
            });
        setFilteredRoles(selectedRoleFlyoutRow?.roles);
    }, [selectedForumAccessRows.length]);

    const getRoleFlyoutData = () => {
        if (activeFlyoutContext === 'forumOwner') {
            return filteredRoles;
        }

        return rolesAndUsers;
    };

    const roleFlyoutItems = getRoleFlyoutData();
    const displayedRoleFlyoutItems = (() => {
        if (showSelectedOnly) return roleFlyoutItems.filter((item: any) => item.checked);
        if (searchKeyword.trim() !== '' && !isRoleDataLoading) {
            const currentIds = new Set(filteredRoles.map((r: any) => String(r.roleId)));
            return roleFlyoutItems.filter((item: any) => currentIds.has(String(item.roleId)));
        }
        return roleFlyoutItems;
    })();
    const selectedRoleCount = roleFlyoutItems.filter((item: any) => item.checked).length;

    useEffect(() => {
        getRoleFlyoutData();
    }, [isRoleOnlyMode]);

    const handleRoleDropdownConfirmButton = () => {
        if (selectedRolesDD?.length === 0) {
            setSelectedForumAccessRows([]);
            setClearTableSelection(true);
            return;
        }

        const selectedRoleIds = new Set(
            selectedRolesDD.filter(role => role.value !== 'ALL').map(role => String(role.value)),
        );

        const selectedRolesOnly = rolesAndUsers
            .filter(role => selectedRoleIds.has(String(role.roleId)))
            .map(role => ({
                ...role,
                checked: true,
            }));

        const selectedRowIds = new Set(selectedForumAccessRows.map(row => row.rowId));

        setForumAccessTableData(prev =>
            prev.map(row => {
                if (!selectedRowIds.has(row.rowId)) {
                    return row;
                }

                return {
                    ...row,
                    roles: [...selectedRolesOnly],
                };
            }),
        );
    };

    const handleRoleDropdownCancelButton = () => {
        setSelectedForumAccessRows([]);
        setClearTableSelection(true);
    };

    const handleRoleFlyoutOpenChange = (value: boolean | ((prev: boolean) => boolean)) => {
        setIsRoleFlyoutOpen((prev: any) => {
            const nextValue = typeof value === 'function' ? value(prev) : value;

            if (!nextValue) {
                setRoleFlyoutOpenClicked(false);
            }

            return nextValue;
        });
    };

    useEffect(() => {
        setClearTableSelection(false);
    }, [selectedForumAccessRows]);

    const handleRoleFlyoutSave = async () => {
        setIsFlyoutEditable(true);

        const existingRoles = selectedRoleFlyoutRow?.roles ?? [];

        const selectedRolesMap = new Map<string, any>();

        existingRoles.forEach((role: FlyoutCheckboxItemForum) => {
            selectedRolesMap.set(String(role.roleId), role);
        });

        // Current flyout selection
        rolesAndUsers.forEach(item => {
            const roleId = String(item.roleId);

            if (item.checked) {
                selectedRolesMap.set(roleId, {
                    checked: true,
                    functionId: item.functionId,
                    functionName: item.functionName,
                    geographyLevelId: item.geographyLevelId,
                    geographyLevelName: item.geographyLevelName,
                    responsibilityLevelId: item.responsibilityLevelId,
                    responsibilityLevelName: item.responsibilityLevelName,
                    roleId: item.roleId,
                    roleName: item.roleName,
                    rowIndex: item.rowIndex,
                    subFunctionId: item.subFunctionId,
                    subFunctionName: item.subFunctionName,
                    users: item.users ?? [],
                });
            } else {
                selectedRolesMap.delete(roleId);
            }
        });

        const selectedRoles = Array.from(selectedRolesMap.values());

        setSelectedRoleFlyoutRow(prev =>
            prev
                ? {
                      ...prev,
                      roles: selectedRoles,
                  }
                : prev,
        );
    };

    const handleUsersFlyoutPrimarySave = () => {
        const tempUserFlyoutData = [...savedFlyOutData.users];

        tempUserFlyoutData.forEach((item: any) => {
            const savedData = usersFlyoutData.find(
                (userItem: any) =>
                    userItem.userEmail === item.userEmail &&
                    String(userItem.roleId) === String(item.roleId),
            );

            if (savedData) {
                item.checked = savedData.checked;
            }
        });

        const currentRoleId = usersFlyoutData?.[0]?.roleId;

        const selectedUsersForCurrentRole = usersFlyoutData.filter((user: any) => user.checked);

        const usersForOtherRoles = tempUserFlyoutData.filter(
            (user: any) => String(user.roleId) !== String(currentRoleId),
        );

        setSavedFlyoutData((prev: any) => ({
            ...prev,
            users: [...usersForOtherRoles, ...selectedUsersForCurrentRole],
        }));

        onSaveRoleAndUserFlyout();
    };

    const fetchRolesDD = async (pageNumber = rolePageDD) => {
        try {
            const payload = {
                geographyLevelId: getRoleGeographyLevelFilter(),
                functionId: null,
                subFunctionId: null,
                roleResponsibilityLevelId: null,
                userGroupId: null,
                roleId: null,
                locationId: null,
                isLeadership: null,
                searchKeyword: undefined,
                pageNumber,
                pageSize: 10,
            };

            const response = await getRoleSelection(payload);

            const roles = response?.data?.data ?? [];

            const mappedRoles = roles.map((role: any) => ({
                label: `${role.responsibilityLevelName ?? ''} ${role.roleName ?? ''}`.trim(),
                value: String(role.roleId),
            }));

            const allOption = {
                label: 'All',
                value: 'ALL',
            };

            setRoleOptionsDD(prev => {
                if (pageNumber === 1) {
                    return [allOption, ...mappedRoles];
                }

                return [allOption, ...prev.filter(item => item.value !== 'ALL'), ...mappedRoles];
            });

            setHasMoreRolesDD(roles.length >= 5);

            if (roles.length >= 5) {
                setRolePageDD(pageNumber + 1);
            }
        } catch (error) {
            console.error('Error fetching dropdown roles:', error);
        }
    };

    const handleSelectUserCounter = (item: any) => {
        setActivePersonaName('Users');
        setUsersFlyoutOpen(true);
        setFlyoutSearchPlaceholder('Search Users');
        setIsFlyoutEditable(true);

        const selectedRole = filteredRoles.find(itemRole => itemRole.roleId === item.roleId);

        const updatedUsers =
            selectedRole?.users.map((userItems: any) => {
                const savedUserData = savedFlyOutData.users.find(
                    (savedItem: any) =>
                        selectedRole.roleId === savedItem.roleId &&
                        userItems.email === savedItem.email,
                );

                return {
                    ...userItems,
                    roleId: selectedRole.roleId,
                    checked: savedUserData?.checked,
                    numberOfUsers: 0,
                };
            }) ?? [];

        setUsersFlyoutData(updatedUsers);
    };

    const handleFlyoutItemToggle = (flyoutItem: string, type: string) => {
        if (type === 'Roles') {
            const tempRolesAndUsers: FlyoutCheckboxItemForum[] = rolesAndUsers.map((item: any) => {
                if (flyoutItem === item.roleId) {
                    return {
                        ...item,
                        newlyAdded: true,
                        checked: !item.checked,
                    };
                }

                return {
                    newlyAdded: false,
                    ...item,
                };
            });

            setRolesAndUsers(tempRolesAndUsers);
        } else {
            const tempUsers = usersFlyoutData.map((item: any) => {
                if (flyoutItem === item.userEmail) {
                    return {
                        ...item,
                        checked: !item.checked,
                    };
                }

                return {
                    ...item,
                };
            });

            setUsersFlyoutData(tempUsers);
        }
    };

    const handleRoleDropdownChange = (obj: OptionType, checked: boolean, tree: OptionType[]) => {
        const allOption = roleOptionsDD.find(item => item.value === 'ALL');

        const allRoles = roleOptionsDD.filter(item => item.value !== 'ALL');

        if (obj.value === 'ALL') {
            if (checked) {
                setSelectedRolesDD([...(allOption ? [allOption] : []), ...allRoles]);
            } else {
                setSelectedRolesDD([]);
            }

            return;
        }

        const selectedRoles = tree.filter(item => item.value !== 'ALL');

        const isEverythingSelected = selectedRoles.length === allRoles.length;

        setSelectedRolesDD(
            isEverythingSelected
                ? [...(allOption ? [allOption] : []), ...selectedRoles]
                : selectedRoles,
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles['header']}>
                <div className={styles['header-title-container']}>
                    <div className={styles['header-back-button']}>
                        <Link to="/admin-hub/tool-management" onClick={handleBackClick}>
                            {BackArrowIcon(8, 12)}
                        </Link>
                    </div>
                    <div className={styles['header-title']}>
                        Add New Forum
                        <div className={styles['space-v-8']} />
                        <Label type="body2">
                            <span className={styles['add-new-role-description']}>
                                Create a forum and define roles for its persona's.
                            </span>
                        </Label>
                    </div>
                </div>
                <div className={styles['header-action-container']}>
                    <Button
                        text="Cancel"
                        variant="Secondary"
                        size="S"
                        onClick={handleCancelClick}
                    />
                    <div className={styles['space-h-8']} />
                    <Button
                        text="Save Forum"
                        disabled={!isSaveApplicationEnabled}
                        variant="Primary"
                        size="S"
                        onClick={handleSaveForum}
                        loading={loading}
                    />
                </div>
            </div>{' '}
            {/* -------- GENERAL INFORMATION -------- */}
            <ExpandableForm
                title={
                    <>
                        {isGeneralSaved && (
                            <Icon name="check-circle" size="xl" color="feedback-success-color" />
                        )}
                        <span>General Information</span>
                    </>
                }
                description="Add Key Forum details"
                isOpen={openGeneral}
                onClick={() => {
                    setOpenGeneral(prev => !prev);
                    if (!openGeneral) {
                        setOpenGeo(false);
                        setOpenPersona(false);
                        setIsForumAccessOpen(false);
                    }
                }}
                additionalContentInTitleContainer={
                    <Icon
                        name={openGeneral ? 'chevron-up' : 'chevron-down'}
                        size="l"
                        color="neutrals-B800"
                    />
                }
                headerAction={
                    <Button
                        text="Save & Continue"
                        disabled={!isGeneralValid}
                        onClick={handleGeneralSave}
                    />
                }
                content={
                    <div>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Flex className={styles['form-inputs-flex-col']}>
                                    <InputField
                                        label="Forum Name"
                                        value={forumName}
                                        required
                                        onChange={e => {
                                            const value = e.target.value;
                                            if (/^[A-Za-z\s]*$/.test(value)) {
                                                setForumName(value);
                                                handleEditGeneral();
                                            }
                                        }}
                                    />
                                </Flex>
                            </Col>

                            <Col span={8}>
                                <DropDown
                                    dropdown={{
                                        label: 'Function',
                                        type: 'radio',
                                        options: functions?.map(item => ({
                                            label: item.functionName,
                                            value: item.functionId,
                                        })),

                                        selectedOptions: roleFunction,
                                        placeholder: 'Select Function',
                                        required: true,
                                        onChange: handleFunctionDropdownChange,
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
                                        label: 'Sub Function',
                                        type: 'radio',
                                        options: subFunctions?.map(s => ({
                                            label: s.subFunctionName,
                                            value: s.subFunctionId,
                                        })),

                                        selectedOptions: roleSubFunction,
                                        placeholder: 'Select Sub Function',
                                        required: true,
                                        onChange: handleSubFunctionDropdownChange,
                                    }}
                                    searchInput={{
                                        searchPlaceholder: 'Search',
                                        searchSize: 'L',
                                        searchWholeString: true,
                                    }}
                                />
                            </Col>
                        </Row>

                        <Row gutter={16} className={styles.rowSpacing}>
                            <Col span={8}>
                                <DropDown
                                    dropdown={{
                                        label: 'Geography Level',
                                        options: geographyLevels?.map(g => ({
                                            label: g.geographyLevelName,
                                            value: g.geographyLevelId,
                                        })),

                                        selectedOptions: geoLevel ? [geoLevel] : [],
                                        required: true,
                                        placeholder: 'Select Geography Level',
                                        onChange: opt => {
                                            const selected = Array.isArray(opt) ? opt[0] : opt;

                                            setGeoLevel({
                                                label: selected?.label,
                                                value: selected?.value,
                                            });
                                            handleEditGeneral();
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
                                        label: 'Forum Period',
                                        options: forumPeriods?.map(p => ({
                                            label: p.forumPeriodName,
                                            value: p.id,
                                        })),

                                        selectedOptions: forumPeriod ? [forumPeriod] : [],
                                        placeholder: 'Select Forum Period',
                                        required: true,
                                        onChange: opt => {
                                            setForumPeriod(opt);
                                            handleEditGeneral();
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
                    </div>
                }
            />
            {/* -------- GEOGRAPHICAL INFORMATION -------- */}
            <ExpandableForm
                title={
                    <>
                        {isGeoSaved && (
                            <Icon name="check-circle" size="xl" color="feedback-success-color" />
                        )}
                        <span>Geographical Information</span>
                    </>
                }
                description="Select all location where the Forum will run"
                isOpen={openGeo}
                disabled={!isGeneralSaved}
                onClick={() => {
                    if (!isGeneralSaved) return;

                    setOpenGeo(prev => !prev);

                    if (!openGeo) {
                        setOpenGeneral(false);
                        setOpenPersona(false);
                        setIsForumAccessOpen(false);
                    }
                }}
                additionalContentInTitleContainer={
                    <Icon
                        name={openGeo ? 'chevron-up' : 'chevron-down'}
                        size="l"
                        color="neutrals-B800"
                    />
                }
                headerAction={
                    <Button
                        text="Save & Continue"
                        disabled={!isGeoValid()}
                        onClick={handleGeoSave}
                    />
                }
                content={
                    <div>
                        <div className={styles.dropdownWithLine}></div>
                        <Row gutter={16}>
                            <Col span={6}>
                                <DropDown
                                    dropdown={{
                                        label: 'Region',
                                        type: 'checkbox',
                                        isDisabled: !geoLevel,
                                        options: [
                                            ...regions.map(r => ({
                                                label: r.regionName,
                                                value: r.regionId,
                                            })),
                                        ],
                                        selectedOptions: region,
                                        placeholder: 'Select Region',
                                        required: !!geoLevel,
                                        onChange: handleRegionChange,
                                    }}
                                    searchInput={{
                                        searchPlaceholder: 'Search',
                                        searchSize: 'L',
                                        searchWholeString: true,
                                    }}
                                />
                            </Col>

                            <Col span={6}>
                                <DropDown
                                    dropdown={{
                                        label: 'Cluster',
                                        type: 'checkbox',
                                        isDisabled: !isGeoEnabled(geoLevel?.value, 2),
                                        options: [
                                            { label: 'All', value: 'ALL' },
                                            ...clusters.map(c => ({
                                                label: c.clusterName,
                                                value: c.clusterId,
                                            })),
                                        ],
                                        selectedOptions: cluster,
                                        placeholder: 'Select Cluster',
                                        required: isGeoEnabled(geoLevel?.value, 2),
                                        onChange: handleClusterChange,
                                    }}
                                    searchInput={{
                                        searchPlaceholder: 'Search',
                                        searchSize: 'L',
                                        searchWholeString: true,
                                    }}
                                />
                            </Col>

                            <Col span={6}>
                                <DropDown
                                    dropdown={{
                                        label: 'Market',
                                        type: 'checkbox',
                                        isDisabled: !isGeoEnabled(geoLevel?.value, 3),
                                        options: [
                                            { label: 'All', value: 'ALL' },
                                            ...markets.map(m => ({
                                                label: m.marketName,
                                                value: m.marketId,
                                            })),
                                        ],
                                        selectedOptions: market,
                                        placeholder: 'Select Market',
                                        required: isGeoEnabled(geoLevel?.value, 3),
                                        onChange: handleMarketChange,
                                    }}
                                    searchInput={{
                                        searchPlaceholder: 'Search',
                                        searchSize: 'L',
                                        searchWholeString: true,
                                    }}
                                />
                            </Col>

                            <Col span={6}>
                                <DropDown
                                    dropdown={{
                                        label: 'Site',
                                        type: 'checkbox',
                                        isDisabled: !isGeoEnabled(geoLevel?.value, 4),
                                        options: [
                                            { label: 'All', value: 'ALL' },
                                            ...sites.map(s => ({
                                                label: s.siteName,
                                                value: s.siteId,
                                            })),
                                        ],
                                        selectedOptions: site,
                                        placeholder: 'Select Site',
                                        required: isGeoEnabled(geoLevel?.value, 4),
                                        onChange: handleSiteChange,
                                    }}
                                    searchInput={{
                                        searchPlaceholder: 'Search',
                                        searchSize: 'L',
                                        searchWholeString: true,
                                    }}
                                />
                            </Col>
                        </Row>
                    </div>
                }
            />
            {/* -------- PERSONAS -------- */}
            <ExpandableForm
                title={<span>Forum Persona’s</span>}
                description="Add all the personas related to the tool"
                isOpen={openPersona}
                disabled={!isGeoSaved}
                onClick={() => {
                    if (!isGeoSaved) return;
                    setOpenPersona(prev => !prev);

                    if (!openPersona) {
                        setOpenGeneral(false);
                        setOpenGeo(false);
                        setIsForumAccessOpen(false);
                    }
                }}
                headerAction={null}
                additionalContentInTitleContainer={
                    <Icon
                        name={openPersona ? 'chevron-up' : 'chevron-down'}
                        size="l"
                        color="neutrals-B800"
                    />
                }
                content={
                    <Row gutter={16}>
                        {activePersonas?.map(persona => (
                            <Col span={8} key={persona.personaId}>
                                <div className={styles.personaCard}>
                                    <h4>{persona.personaName}</h4>

                                    <p>
                                        {persona.personaName === 'Forum Owner' &&
                                            'Leads and manages the forum ensuring effective collaboration and participation.'}

                                        {persona.personaName === 'Decision Owner' &&
                                            'Responsible for making key decisions and guiding the forum’s direction.'}

                                        {persona.personaName === 'Viewer' &&
                                            'Observes discussions, providing insights without direct involvement.'}
                                    </p>
                                </div>
                            </Col>
                        ))}
                    </Row>
                }
            />
            {/* -------- Forum Access -------- */}
            <ExpandableForm
                disabled={!isGeoSaved}
                isOpen={isForumAccessOpen}
                description="Map roles and users to selected geographies and persona’s. To add/remove geographies go to geographical information."
                title={<span>Forum Access</span>}
                content={
                    <ForumAccessNewDataTable
                        forumAccessTableData={forumAccessTableData}
                        setRoleFlyoutOpenClicked={setRoleFlyoutOpenClicked}
                        setUsersFlyoutOpenClicked={setUsersFlyoutOpenClicked}
                        setSelectedForumAccessRows={setSelectedForumAccessRows}
                        clearTableSelection={clearTableSelection}
                        setSelectedRoleFlyoutRow={setSelectedRoleFlyoutRow}
                    />
                }
                onClick={() => {}}
                headerAction={null}
                additionalContentInTitleContainer={
                    <Flex align="center">
                        {isForumAccessOpen && (
                            <div className={styles.toggleHeader}>
                                {selectedForumAccessRows.length > 0 && (
                                    <Flex
                                        align="center"
                                        justify="center"
                                        className={styles.actions}
                                    >
                                        <DropDown
                                            dropdown={{
                                                label: '',
                                                type: 'checkbox',
                                                options: roleOptionsDD,
                                                selectedOptions: selectedRolesDD,
                                                placeholder: 'Select Role',
                                                onChange: handleRoleDropdownChange,
                                                onScroll: () => {
                                                    if (hasMoreRolesDD) {
                                                        fetchRolesDD();
                                                    }
                                                },
                                            }}
                                        />

                                        <button
                                            className={Style['forum-access-check-tick-icon-btn']}
                                            onClick={() => {
                                                handleRoleDropdownConfirmButton();
                                            }}
                                        >
                                            <Icon
                                                size="l"
                                                name="check-tick"
                                                color={'black-color'}
                                            />
                                        </button>
                                        <button
                                            className={Style['forum-access-check-tick-icon-btn']}
                                            onClick={() => {
                                                handleRoleDropdownCancelButton();
                                            }}
                                        >
                                            <Icon size="l" name="x-close" color={'black-color'} />
                                        </button>
                                    </Flex>
                                )}
                            </div>
                        )}
                        <button
                            className={styles.expandButton}
                            onClick={() => setIsForumAccessOpen(!isForumAccessOpen)}
                        >
                            <Icon
                                name={isForumAccessOpen ? 'chevron-up' : 'chevron-down'}
                                size="l"
                                color="neutrals-B800"
                            />
                        </button>
                    </Flex>
                }
            />
            {(isRoleFlyoutOpen || isUsersFlyoutOpen) && (
                <RoleSelectionFlyoutForum
                    isEditable={isFlyoutEditable}
                    userFlyoutOpen={isUsersFlyoutOpen}
                    isRoleOnlyMode={isRoleOnlyMode}
                    onSelectUserCounter={handleSelectUserCounter}
                    flyoutOpen={isRoleFlyoutOpen}
                    setIsFlyoutOpen={handleRoleFlyoutOpenChange}
                    userFlyoutData={usersFlyoutData}
                    onUserFlyoutBack={() => {
                        setActivePersonaName(activeFlyoutContext === 'role' ? 'Roles' : 'Forum Owner');
                        setIsRoleFlyoutOpen(true);
                        setUsersFlyoutOpen(false);
                        setIsFlyoutEditable(false);
                    }}
                    totalUsers={savedFlyOutData.users}
                    heading={`Select ${activePersonaName}`}
                    subHeading=""
                    userFlyoutHeading={'Users'}
                    showSearch
                    searchPlaceholder={flyoutSearchPlaceholder}
                    onSearchChange={value => {
                        const searchValue = Array.isArray(value) ? value.join(' ') : value;
                        setSearchKeyword(searchValue);
                    }}
                    dropdownFilter={dropdownFilters}
                    items={displayedRoleFlyoutItems}
                    onItemToggle={handleFlyoutItemToggle}
                    showSelectAll={!showSelectedOnly}
                    isAllSelected={
                        displayedRoleFlyoutItems.length > 0 &&
                        displayedRoleFlyoutItems.every((item: any) => item.checked)
                    }
                    onSelectAllToggle={(checked, type) => {
                        const selectType = type ?? 'Roles';

                        if (selectType === 'Users' && !isRoleOnlyMode) {
                            const tempUsersFlyoutData = usersFlyoutData.map((item: any) => {
                                return {
                                    ...item,
                                    checked: checked,
                                };
                            });
                            setUsersFlyoutData(tempUsersFlyoutData);
                        } else {
                            const tempRolesAndUsers = rolesAndUsers.map(item => {
                                return {
                                    ...item,
                                    checked: checked,
                                };
                            });
                            setRolesAndUsers(tempRolesAndUsers);
                        }
                    }}
                    isRoleDataLoading={isRoleDataLoading}
                    hasMoreItems={
                        activeFlyoutContext === 'forumOwner' || showSelectedOnly
                            ? false
                            : hasMoreRoles
                    }
                    isLoadingMore={
                        activeFlyoutContext === 'forumOwner' || showSelectedOnly
                            ? false
                            : isLoadingMoreRoles
                    }
                    onLoadMore={
                        activeFlyoutContext === 'forumOwner' || showSelectedOnly
                            ? () => {}
                            : handleLoadMoreRoles
                    }
                    cancelBtnProps={{
                        disabled: false,
                        onClick: () => setShowSelectedOnly(prev => !prev),
                        text: showSelectedOnly
                            ? 'Show All'
                            : `View Selected (${selectedRoleCount})`,
                        variant: 'Subtle2',
                    }}
                    secondaryBtnProps={{
                        text: 'Cancel',
                        variant: 'Secondary',
                        onClick: () => {
                            setShowSelectedOnly(false);
                            setRoleFlyoutOpenClicked(false);
                            setIsRoleFlyoutOpen(false);
                        },
                    }}
                    primaryBtnProps={{
                        text: 'Save',
                        variant: 'Primary',
                        onClick: () => {
                            setShowSelectedOnly(false);
                            setSavedFlyoutData({
                                roles: rolesAndUsers.filter(item => item.checked),
                                users: savedFlyOutData.users,
                            });
                            handleRoleFlyoutSave();
                        },
                    }}
                    primaryBtnPropsUsersFlyout={{
                        text: 'Save',
                        variant: 'Primary',
                        onClick: handleUsersFlyoutPrimarySave,
                    }}
                    cancelBtnPropsUsersFlyout={{
                        text: 'Cancel',
                        variant: 'Secondary',
                        onClick: () => {
                            setActivePersonaName('Viewer');
                            setFlyoutSearchPlaceholder('Search Roles');
                            setRoleFlyoutOpenClicked(false);
                            setIsRoleFlyoutOpen(false);
                            setUsersFlyoutOpenClicked(false);
                            setUsersFlyoutOpen(false);
                        },
                    }}
                    userDropdownFilter={userLocationFilter}
                />
            )}
            <Dialog
                title="Save New Forum?"
                content="You are about to add a new forum using the provided details. Once saved, this forum will be avialable in command center. Please confirm to proceed."
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onPrimaryButtonClick={confirmSaveForum}
                onSecondaryButtonClick={() => setShowSaveConfirm(false)}
                primaryButtonText="Save Forum"
                secondaryButtonText="Continue Adding"
            />
            <Dialog
                title="Unsaved Forum"
                content="Are you sure you want to leave without saving the forum or continue adding?"
                isOpen={openCancelDialog}
                onClose={() => setOpenCancelDialog(false)}
                onPrimaryButtonClick={() => {
                    setOpenCancelDialog(false);
                    window.location.href = '/admin-hub/Forum-management';
                }}
                onSecondaryButtonClick={() => setOpenCancelDialog(false)}
                primaryButtonText="Leave without Saving"
                secondaryButtonText="Continue Adding"
            />
            {toastConfig && (
                <Toast
                    toggle
                    type={toastConfig.type}
                    title={toastConfig.title}
                    message={toastConfig.message}
                    mode="Top Right"
                    distance="l"
                    timer={5000}
                    onCloseToast={() => setToastConfig(null)}
                />
            )}
        </div>
    );
}

export default AddNewForumScreen;
