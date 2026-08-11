import { Flex } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import styles from './EditNewForumScreen.module.scss';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BackArrowIcon } from '../../../assets/icons/icons';
import Label from '../../../components/atoms/label/Label';
import { getForumAccessDetailsbyId, getForumDetialsById } from '../../../services/forums';
import { IForumDetail } from '../../../types/response';
import { formatRefreshText, toCommaSeparated } from '../../../utils/helpers';
import ForumAccessNewDataTable, {
    TableRowData,
} from '../../../components/organisms/forums/ForumAccessNewDataTable';
import {
    FlyoutCheckboxItemForum,
    RoleSelectionFlyoutForum,
} from '../../../components/organisms/role-selection-flyout/RoleSelectionFlyoutForum';
import { getRoleSelection, getRoleUserSelection } from '../../../services/application';
import { ROLE_SELECTION_PAGE_NUMBER, ROLE_SELECTION_PAGE_SIZE } from '../../../utils/constants';
import GeneralInformation from '../../../components/organisms/forumManagement/edit-forum/GeneralInformation';
import { Button, Dialog, DropDown, Icon, Tab, Toast } from 'konnect-react-components';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, fetchPersona, fetchRoleData, RootState } from '../../../store';
import { editForumV1 } from '../../../store/thunks/addNewForums';
import { IAddForumsRequest } from '../../../types/request';
import ExpandableForm from '../../../components/molecules/expandable-form/ExpandableForm';
import { Col, Row } from 'antd';
import { OptionType } from '../../../types/common';
enum TabNamesEnum {
    GeneralInformation = 'General Information',
    Access = 'Access',
}

interface GeographyResponse {
    forumId: number;
    geographyId: number;
    geographyTypeId: number;
    region: string | null;
    regionId: number | null;
    cluster: string | null;
    clusterId: number | null;
    market: string | null;
    marketId: number | null;
    site: string | null;
    siteId: number | null;
    isActive: boolean | true;
}

interface ForumAccessResponse {
    forumId: number;
    roleIds?: string | null;
    roleid?: string | number | null;
    geographyId: number;
    memberEmail?: string | null;
    memberEmails?: string | null;
}

interface RoleUserItem {
    checked: boolean;
    fullName: string;
    roleId: string;
    userEmail: string;
    userGroupEmail: string;
    userGroupId: number;
    userGroupName: string;
    userName: string;
    id: string;
}

interface RoleSelectionApiItem {
    roleId: number;
    roleName: string;
    functionId: number;
    functionName: string;
    subFunctionId: number;
    subFunctionName: string;
    geographyLevelId: number;
    geographyLevelName: string;
    responsibilityLevelId: number;
    responsibilityLevelName: string;
}

interface RoleUserSelectionApiItem extends RoleSelectionApiItem {
    userEmail: string;
    fullName: string;
    userName: string;
    userGroupId: number;
    userGroupName: string;
    userGroupEmail: string;
}

interface RoleFlyoutItem extends FlyoutCheckboxItemForum {
    checked: boolean;
    functionId: string;
    functionName: string;
    geographyLevelId: string;
    geographyLevelName: string;
    responsibilityLevelId: string;
    responsibilityLevelName: string;
    roleId: string;
    roleName: string;
    subFunctionId: string;
    subFunctionName: string;
    users: RoleUserItem[];
}

type SavedFlyoutData = {
    roles: FlyoutCheckboxItemForum[];
    users: RoleUserItem[];
};

type GeneralInfoData = {
    forumName: string;
    functionId: string;
    subFunctionId: string;
    geographyLevelId: string;
    periodId: string;
    status: string;
};

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

const getResolvedOptionId = (
    value: string,
    options: Array<Record<string, unknown>>,
    idKey: string,
    labelKey: string,
): number => {
    const normalizedValue = String(value ?? '').trim();
    if (!normalizedValue) return 0;

    const numericValue = Number(normalizedValue);
    if (!Number.isNaN(numericValue) && numericValue > 0) {
        return numericValue;
    }

    const matchedOption = options.find(
        option => String(option?.[labelKey] ?? '').toLowerCase() === normalizedValue.toLowerCase(),
    );

    return Number(matchedOption?.[idKey]) || 0;
};

const getGeneralInfoFromForumDetail = (forumDetail?: IForumDetail): GeneralInfoData => ({
    forumName: forumDetail?.basicInformation?.forumName ?? '',
    functionId: forumDetail?.basicInformation?.function ?? '',
    subFunctionId: forumDetail?.basicInformation?.subFunction ?? '',
    geographyLevelId: forumDetail?.basicInformation?.geographyLevel ?? '',
    periodId: forumDetail?.basicInformation?.period ?? '',
    status: forumDetail?.basicInformation?.status ?? '',
});

function EditNewForumScreen() {
    const navigate = useNavigate();

    const dispatch = useDispatch<AppDispatch>();
    const forumDetailParams = useParams<{ forumId: string; forumName: string }>();

    const [forumDetail, setForumDetail] = useState<IForumDetail>();
    const [lastRefreshDate, setLastRefreshDate] = useState<Date | null>(null);

    const [forumAccessTableData, setForumAccessTableData] = useState<TableRowData[]>([]);
    const [lastSavedForumAccessData, setLastSavedForumAccessData] = useState<TableRowData[]>([]);

    const [roleFlyoutOpenClicked, setRoleFlyoutOpenClicked] = useState<boolean | undefined>(
        undefined,
    );

    const [usersFlyoutOpenClicked, setUsersFlyoutOpenClicked] = useState<boolean | undefined>(
        undefined,
    );
    const [selectedForumAccessRows, setSelectedForumAccessRows] = useState<TableRowData[]>([]);
    const [selectedRoleFlyoutRow, setSelectedRoleFlyoutRow] = useState<TableRowData>();

    const [rolesAndUsers, setRolesAndUsers] = useState<RoleFlyoutItem[]>([]);
    const [savedFlyOutData, setSavedFlyOutData] = useState<SavedFlyoutData>({
        roles: [],
        users: [],
    });
    const [usersFlyoutData, setUsersFlyoutData] = useState<RoleUserItem[]>([]);
    const [isRoleFlyoutOpen, setIsRoleFlyoutOpen] = useState(false);
    const [isUsersFlyoutOpen, setUsersFlyoutOpen] = useState(false);
    const [isRoleOnlyMode, setIsRoleOnlyMode] = useState(true);
    const [activeFlyoutContext, setActiveFlyoutContext] = useState<'role' | 'forumOwner'>('role');
    const [activeFlyoutTitle, setActiveFlyoutTitle] = useState('Roles');
    const [flyoutSearchPlaceholder, setFlyoutSearchPlaceholder] = useState('Search Roles');
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [isRoleDataLoading, setIsRoleDataLoading] = useState(false);
    const [hasMoreRoles, setHasMoreRoles] = useState(true);
    const [isLoadingMoreRoles, setIsLoadingMoreRoles] = useState(false);
    const [filteredRoles, setFilteredRoles] = useState<RoleFlyoutItem[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');

    const [isGeneralInfoDirty, setIsGeneralInfoDirty] = useState(false);
    const [isAccessDirty, setIsAccessDirty] = useState(false);
    const [pendingTab, setPendingTab] = useState<string | null>(null);

    const [isFlyoutEditable, setIsFlyoutEditable] = useState(true);

    const [selectedTab, setSelectedTab] = useState<string>(TabNamesEnum.GeneralInformation);
    const [hasForumInfoChanged, setHasForumInfoChanged] = useState<boolean>(false);
    const [discardGeneralInfo, setDiscardGeneralInfo] = useState<boolean>(false);
    const [generalInfoData, setGeneralInfoData] = useState<GeneralInfoData>({
        forumName: '',
        functionId: '',
        subFunctionId: '',
        geographyLevelId: '',
        periodId: '',
        status: '',
    });
    const [geographySelectionData, setGeographySelectionData] = useState<GeographySelectionData>({
        regionIds: null,
        clusterIds: null,
        marketIds: null,
        siteIds: null,
        isRegionAll: false,
        isClusterAll: false,
        isMarketAll: false,
        isSiteAll: false,
    });
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [openCancelDialog, setOpenCancelDialog] = useState<boolean>(false);

    const [roleOptionsDD, setRoleOptionsDD] = useState<OptionType[]>([]);
    const [rolePageDD, setRolePageDD] = useState(1);
    const [hasMoreRolesDD, setHasMoreRolesDD] = useState(true);
    const [selectedRolesDD, setSelectedRolesDD] = useState<OptionType[]>([]);

    const [toastConfig, setToastConfig] = useState<{
        type: 'Success' | 'Error' | 'Warning' | 'Default';
        title: string;
        message: string;
    } | null>(null);

    const hasUnsavedChanges = isGeneralInfoDirty || isAccessDirty;

    const latestRoleRequestRef = useRef(0);
    const activeFlyoutRowIdRef = useRef<number | null>(null);
    const rolePageRef = useRef(ROLE_SELECTION_PAGE_NUMBER);
    const [selectedFilters, setSelectedFilters] = useState({
        function: [],
        subfunction: [],
        geographyLevel: [],
        rolelevel: [],
        userGroup: [],
    });

    const [clearTableSelection, setClearTableSelection] = useState(false);

    const onUserSelectTab = useCallback(
        ({ label }: any) => {
            if (label === selectedTab) {
                return;
            }

            if (hasUnsavedChanges) {
                setPendingTab(label);
                return;
            }

            setSelectedTab(label);
        },
        [selectedTab, hasUnsavedChanges],
    );

    const parseCsv = useCallback((value: string | number | null | undefined): string[] => {
        if (!value) return [];
        return String(value)
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
    }, []);

    const getGeographySelectionFromForumDetail = useCallback(
        (detail?: IForumDetail): GeographySelectionData => ({
            regionIds:
                detail?.geographicalInformation?.region
                    ?.map(item => String(item.geographyId))
                    .join(',') || null,
            clusterIds:
                detail?.geographicalInformation?.cluster
                    ?.map(item => String(item.geographyId))
                    .join(',') || null,
            marketIds:
                detail?.geographicalInformation?.market
                    ?.map(item => String(item.geographyId))
                    .join(',') || null,
            siteIds:
                detail?.geographicalInformation?.sites
                    ?.map(item => String(item.geographyId))
                    .join(',') || null,
            isRegionAll: Boolean(detail?.geographicalInformation?.allRegion),
            isClusterAll: Boolean(detail?.geographicalInformation?.allCluster),
            isMarketAll: Boolean(detail?.geographicalInformation?.allMarket),
            isSiteAll: Boolean(detail?.geographicalInformation?.allSite),
        }),
        [],
    );

    const { columnFilters } = useSelector((state: RootState) => state.roleData);
    const { functions, subFunctions, geographyLevels, forumPeriods } = useSelector(
        (state: RootState) => state.forumMaster,
    );

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

    const mapRoleUserRecord = useCallback(
        (item: RoleUserSelectionApiItem): RoleUserItem => ({
            checked: false,
            fullName: item.fullName ?? '',
            roleId: String(item.roleId ?? ''),
            userEmail: item.userEmail ?? '',
            userGroupEmail: item.userGroupEmail ?? '',
            userGroupId: Number(item.userGroupId ?? 0),
            userGroupName: item.userGroupName ?? '',
            userName: item.userName ?? '',
            id: `${item.roleId ?? ''}-${item.userEmail ?? ''}`,
        }),
        [],
    );

    const getRoleIdsFromMember = useCallback(
        (member: ForumAccessResponse): string[] => {
            const rawRoleIds = member.roleIds ?? member.roleid;
            return parseCsv(rawRoleIds);
        },
        [parseCsv],
    );

    const getMemberEmailsFromMember = useCallback(
        (member: ForumAccessResponse): string[] => {
            const rawEmails = member.memberEmails ?? member.memberEmail;
            return parseCsv(rawEmails);
        },
        [parseCsv],
    );

    const buildForumAccessTableData = useCallback(
        async (
            accessData: GeographyResponse[],
            memberData: ForumAccessResponse[],
        ): Promise<TableRowData[]> => {
            const rows = await Promise.all(
                accessData.map(async (geo, index) => {
                    const geoMembers = memberData.filter(
                        member => member.geographyId === geo.geographyId,
                    );

                    // Role IDs saved for this geography
                    const selectedRoleIds = [
                        ...new Set(geoMembers.flatMap(member => getRoleIdsFromMember(member))),
                    ];

                    let roleRows: RoleSelectionApiItem[] = [];

                    if (selectedRoleIds.length > 0) {
                        const roleSelectionResponse = await getRoleSelection({
                            geographyLevelId: null,
                            functionId: null,
                            subFunctionId: null,
                            roleResponsibilityLevelId: null,
                            userGroupId: null,
                            roleId: selectedRoleIds.join(','),
                            locationId: null,
                            isLeadership: null,
                            pageNumber: ROLE_SELECTION_PAGE_NUMBER,
                            pageSize: ROLE_SELECTION_PAGE_SIZE,
                        });

                        roleRows = roleSelectionResponse?.data?.data ?? [];
                    }

                    const roleMap = new Map<string, RoleFlyoutItem>();

                    // Build selected roles only
                    selectedRoleIds.forEach(roleId => {
                        const roleFromApi = roleRows.find(role => String(role.roleId) === roleId);

                        roleMap.set(roleId, {
                            checked: true,

                            functionId: roleFromApi ? String(roleFromApi.functionId) : '',

                            functionName: roleFromApi?.functionName ?? '',

                            geographyLevelId: roleFromApi
                                ? String(roleFromApi.geographyLevelId)
                                : String(geo.geographyTypeId),

                            geographyLevelName: roleFromApi?.geographyLevelName ?? '',

                            responsibilityLevelId: roleFromApi
                                ? String(roleFromApi.responsibilityLevelId)
                                : '',

                            responsibilityLevelName: roleFromApi?.responsibilityLevelName ?? '',

                            roleId,

                            roleName: roleFromApi?.roleName ?? `Role ${roleId}`,

                            subFunctionId: roleFromApi ? String(roleFromApi.subFunctionId) : '',

                            subFunctionName: roleFromApi?.subFunctionName ?? '',

                            users: [],
                        });
                    });

                    // Users come directly from forum details response
                    const selectedUsers: RoleUserItem[] = geoMembers.flatMap(member => {
                        const roleIds = getRoleIdsFromMember(member);
                        const memberEmails = getMemberEmailsFromMember(member);

                        if (roleIds.length === 0 || memberEmails.length === 0) {
                            return [];
                        }

                        return roleIds.flatMap(roleId =>
                            memberEmails.map(email => ({
                                checked: true,

                                fullName: '',

                                roleId,

                                userEmail: String(email).trim(),

                                userGroupEmail: '',

                                userGroupId: 0,

                                userGroupName: '',

                                userName: String(email).trim(),

                                id: `${roleId}-${String(email).trim()}`,
                            })),
                        );
                    });

                    const selectedRoles = Array.from(roleMap.values());

                    return {
                        rowId: index + 1,

                        regionId: geo.regionId ?? 0,
                        regionName: geo.region ?? '',

                        clusterId: geo.clusterId ?? 0,
                        clusterName: geo.cluster ?? '',

                        marketId: geo.marketId ?? 0,
                        marketName: geo.market ?? '',

                        siteId: geo.siteId ?? 0,
                        siteName: geo.site ?? '',

                        roles: selectedRoles,
                        users: selectedUsers,
                    };
                }),
            );

            return rows;
        },
        [getMemberEmailsFromMember, getRoleIdsFromMember],
    );

    const mergeRoleLists = useCallback(
        (
            previousRoles: RoleFlyoutItem[] = [],
            incomingRoles: RoleFlyoutItem[] = [],
            selectedRoleIdsForRow: Set<string>,
        ) => {
            const mergedByRoleId = new Map<string, RoleFlyoutItem>();

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
                    existingUsers.map((u: RoleUserItem) =>
                        String(u.userEmail ?? u.userName ?? `${u.roleId ?? ''}`),
                    ),
                );
                const mergedUsers = [...existingUsers];

                incomingUsers.forEach((user: RoleUserItem) => {
                    const userKey = String(
                        user.userEmail ?? user.userName ?? `${user.roleId ?? ''}`,
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
        },
        [],
    );

    const fetchDataForRolesAndUserFlyout = useCallback(
        async (
            requestId: number,
            isForumOwnerContext: boolean,
            pageNumber: number = ROLE_SELECTION_PAGE_NUMBER,
            appendRoles: boolean = false,
        ) => {
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

            let roleIds: string | undefined;
            if (isForumOwnerContext) {
                roleIds = (selectedRoleFlyoutRow?.roles ?? [])
                    .map((role: FlyoutCheckboxItemForum) => String(role.roleId))
                    .join(',');
            }

            try {
                const response = isForumOwnerContext
                    ? await getRoleUserSelection({
                          ...baseFilterPayload,
                          roleId: roleIds && roleIds.length > 0 ? roleIds : null,
                          userEmail: null,
                      })
                    : await getRoleSelection({
                          ...baseFilterPayload,
                          roleId: null,
                      });

                if (requestId !== latestRoleRequestRef.current) return;

                const roleUserRows: RoleUserSelectionApiItem[] = response?.data?.data ?? [];

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

                const roleMap = roleUserRows.reduce<Record<string, RoleFlyoutItem>>((acc, item) => {
                    const key = String(item.roleId);

                    if (!acc[key]) {
                        acc[key] = {
                            checked: false,
                            roleId: String(item.roleId),
                            roleName: item.roleName,
                            functionId: String(item.functionId),
                            functionName: item.functionName,
                            subFunctionId: String(item.subFunctionId),
                            subFunctionName: item.subFunctionName,
                            geographyLevelId: String(item.geographyLevelId),
                            geographyLevelName: item.geographyLevelName,
                            responsibilityLevelId: String(item.responsibilityLevelId),
                            responsibilityLevelName: item.responsibilityLevelName,
                            users: [],
                        };
                    }

                    return acc;
                }, {});

                roleUserRows.forEach(item => {
                    const key = String(item.roleId);
                    if (!key || !roleMap[key]) return;

                    if (isForumOwnerContext && item.userEmail) {
                        roleMap[key].users.push({
                            ...mapRoleUserRecord(item),
                            checked: false,
                        });
                    }
                });

                const groupedResponse: RoleFlyoutItem[] = Object.values(roleMap);
                const selectedRoleIdsForRow = new Set<string>(
                    (selectedRoleFlyoutRow?.roles || []).map((role: FlyoutCheckboxItemForum) =>
                        String(role.roleId ?? ''),
                    ),
                );
                const allRoleswithUsersMappedData = groupedResponse.map((item: RoleFlyoutItem) => ({
                    ...item,
                    checked: selectedRoleIdsForRow.has(String(item.roleId)),
                }));

                const nextUsersFlyoutData: RoleUserItem[] = groupedResponse.flatMap(
                    (item: RoleFlyoutItem) =>
                        (item.users ?? []).map((userItem: RoleUserItem) => ({
                            ...userItem,
                            checked: false,
                            roleId: String(item.roleId),
                        })),
                );

                setUsersFlyoutData(nextUsersFlyoutData);

                if (isForumOwnerContext) {
                    const forumOwnerRoles: RoleFlyoutItem[] = (
                        selectedRoleFlyoutRow?.roles ?? []
                    ).map((savedRole: FlyoutCheckboxItemForum) => {
                        const apiRole = groupedResponse.find(
                            (role: RoleFlyoutItem) =>
                                String(role.roleId) === String(savedRole.roleId),
                        );

                        return {
                            ...savedRole,
                            ...(apiRole ?? {}),

                            checked: true,

                            users: apiRole?.users ?? [],

                            // counter support
                            numberOfUsers: apiRole?.users?.length ?? 0,
                        } as RoleFlyoutItem;
                    });

                    // keep existing role data intact
                    setRolesAndUsers(allRoleswithUsersMappedData);

                    // forum owner must show ALL selected roles
                    setFilteredRoles(forumOwnerRoles);
                } else if (!appendRoles) {
                    setRolesAndUsers(allRoleswithUsersMappedData);
                    setFilteredRoles(allRoleswithUsersMappedData);
                } else {
                    setRolesAndUsers(prev =>
                        mergeRoleLists(prev, groupedResponse, selectedRoleIdsForRow),
                    );

                    setFilteredRoles(prev =>
                        mergeRoleLists(prev, groupedResponse, selectedRoleIdsForRow),
                    );
                }

                if (isForumOwnerContext) {
                    if (isForumOwnerContext) {
                        const selectedUsersSet = new Set(
                            (selectedRoleFlyoutRow?.users ?? []).map(
                                (user: RoleUserItem) =>
                                    `${user.roleId}_${user.userEmail.toLowerCase()}`,
                            ),
                        );

                        setSavedFlyOutData(prev => ({
                            ...prev,
                            users: nextUsersFlyoutData.map(user => ({
                                ...user,
                                checked: selectedUsersSet.has(
                                    `${user.roleId}_${user.userEmail.toLowerCase()}`,
                                ),
                            })),
                        }));
                    }
                }
            } catch {
                if (requestId === latestRoleRequestRef.current && !appendRoles) {
                    setRolesAndUsers([]);
                    setFilteredRoles([]);
                }
            }
        },
        [
            mapRoleUserRecord,
            mergeRoleLists,
            selectedFilters,
            selectedRoleFlyoutRow?.roles,
            searchKeyword,
        ],
    );

    const handleLoadMoreRoles = async () => {
        if (!isRoleFlyoutOpen || activeFlyoutContext === 'forumOwner') return;
        if (!hasMoreRoles || isLoadingMoreRoles || isRoleDataLoading) return;

        const nextPage = rolePageRef.current + 1;
        const requestId = ++latestRoleRequestRef.current;

        setIsLoadingMoreRoles(true);
        try {
            await fetchDataForRolesAndUserFlyout(requestId, false, nextPage, true);
        } finally {
            if (requestId === latestRoleRequestRef.current) {
                setIsLoadingMoreRoles(false);
            }
        }
    };

    const displayedRoleFlyoutItems = useMemo(() => {
        const roleFlyoutItems = isRoleOnlyMode ? rolesAndUsers : filteredRoles;
        if (!showSelectedOnly) return roleFlyoutItems;
        return roleFlyoutItems.filter((item: RoleFlyoutItem) => item.checked);
    }, [isRoleOnlyMode, rolesAndUsers, filteredRoles, showSelectedOnly]);

    const selectedRoleCount = useMemo(
        () => rolesAndUsers.filter(item => item.checked).length,
        [rolesAndUsers],
    );

    const isAllRolesSelected =
        displayedRoleFlyoutItems.length > 0 &&
        displayedRoleFlyoutItems.every((item: RoleFlyoutItem) => item.checked);

    const isAllUsersSelected =
        usersFlyoutData.length > 0 && usersFlyoutData.every((item: RoleUserItem) => item.checked);

    const [openPersona, setOpenPersona] = useState(false);
    const { personas } = useSelector((state: RootState) => state.forumMaster);
    const activePersonas = personas?.filter(p => p.isActive);

    const [openForumAccessSection, setOpenForumAccessSection] = useState(false);

    useEffect(() => {
        setOpenPersona(true);
        setOpenForumAccessSection(false);
        dispatch(fetchPersona());
    }, [dispatch]);

    useEffect(() => {
        const fetchForumDetail = async () => {
            try {
                const response = await getForumDetialsById(Number(forumDetailParams?.forumId));
                setForumDetail(response);
            } catch {
                setForumDetail(undefined);
            }
        };

        fetchForumDetail();
    }, [buildForumAccessTableData, forumDetailParams?.forumId, selectedTab]);

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

    const reloadForumAccessData = useCallback(async () => {
        try {
            const response = await getForumAccessDetailsbyId(Number(forumDetailParams?.forumId));
            const accessData: GeographyResponse[] = response?.accessData ?? [];
            const memberData: ForumAccessResponse[] = response?.memberData ?? [];
            const tableData = await buildForumAccessTableData(accessData, memberData);
            setForumAccessTableData(tableData);
            setLastSavedForumAccessData(tableData);
        } catch {
            setForumAccessTableData([]);
            setLastSavedForumAccessData([]);
        }
    }, [buildForumAccessTableData, forumDetailParams?.forumId]);

    useEffect(() => {
        reloadForumAccessData();
    }, [reloadForumAccessData]);

    useEffect(() => {
        if (!isRoleFlyoutOpen) {
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
        setRolesAndUsers([]);
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
    }, [activeFlyoutContext, fetchDataForRolesAndUserFlyout, isRoleFlyoutOpen, searchKeyword]);

    useEffect(() => {
        if (!roleFlyoutOpenClicked || !selectedRoleFlyoutRow) {
            return;
        }

        activeFlyoutRowIdRef.current = selectedRoleFlyoutRow.rowId;
        setActiveFlyoutContext('role');

        setSavedFlyOutData({
            roles: [...(selectedRoleFlyoutRow.roles ?? [])],
            users: [...(selectedRoleFlyoutRow.users ?? [])],
        });

        setUsersFlyoutOpen(false);
        setIsRoleFlyoutOpen(true);
        setIsRoleOnlyMode(true);
        setIsFlyoutEditable(true);
        setUsersFlyoutOpenClicked(false);
        setActiveFlyoutTitle('Roles');
        setFlyoutSearchPlaceholder('Search Roles');
    }, [roleFlyoutOpenClicked, selectedRoleFlyoutRow]);

    useEffect(() => {
        if (!usersFlyoutOpenClicked || !selectedRoleFlyoutRow) return;

        activeFlyoutRowIdRef.current = selectedRoleFlyoutRow.rowId;

        const selectedUsers = (selectedRoleFlyoutRow?.users ?? []).map((user: RoleUserItem) => ({
            ...user,
            checked: user.checked ?? true,
        }));

        setSavedFlyOutData({
            roles: [...(selectedRoleFlyoutRow?.roles ?? [])],
            users: selectedUsers,
        });

        setIsFlyoutEditable(false);
        setUsersFlyoutOpen(false);
        setIsRoleFlyoutOpen(true);
        setIsRoleOnlyMode(false);
        setActiveFlyoutContext('forumOwner');
        setActiveFlyoutTitle('Select Users');
        setFlyoutSearchPlaceholder('Search Users');
        setFilteredRoles(selectedRoleFlyoutRow?.roles ?? []);
    }, [usersFlyoutOpenClicked, selectedRoleFlyoutRow]);

    const closeFlyouts = useCallback(() => {
        setRolesAndUsers(prev =>
            prev.map(item => ({
                ...item,
                checked: false,
            })),
        );
        setIsRoleFlyoutOpen(false);
        setUsersFlyoutOpen(false);
        setRoleFlyoutOpenClicked(false);
        setUsersFlyoutOpenClicked(false);
        activeFlyoutRowIdRef.current = null;
        setSelectedRoleFlyoutRow(undefined);
        setSavedFlyOutData({ roles: [], users: [] });
        setUsersFlyoutData([]);
    }, []);

    useEffect(() => {
        setLastRefreshDate(new Date());
    }, [forumDetailParams?.forumId]);

    const handleRoleFlyoutOpenChange = (value: boolean | ((prev: boolean) => boolean)) => {
        setIsRoleFlyoutOpen(prev => {
            const nextValue = typeof value === 'function' ? value(prev) : value;

            if (!nextValue) {
                handleRoleFlyoutClose();
            }

            return nextValue;
        });
    };
    const handleRoleFlyoutClose = useCallback(() => {
        setShowSelectedOnly(false);

        setRoleFlyoutOpenClicked(false);
        setUsersFlyoutOpenClicked(false);

        setUsersFlyoutOpen(false);

        setActiveFlyoutContext('role');
        setIsRoleOnlyMode(true);

        setIsFlyoutEditable(true);

        setIsRoleFlyoutOpen?.(false);
    }, [setIsRoleFlyoutOpen, setRoleFlyoutOpenClicked, setUsersFlyoutOpenClicked]);

    const handleRoleFlyoutSave = () => {
        const targetRowId = activeFlyoutRowIdRef.current ?? selectedRoleFlyoutRow?.rowId;
        if (!targetRowId) return;

        const selectedRoles = rolesAndUsers
            .filter(item => item.checked)
            .map(item => ({
                checked: item.checked,
                functionId: item.functionId,
                functionName: item.functionName,
                geographyLevelId: item.geographyLevelId,
                geographyLevelName: item.geographyLevelName,
                responsibilityLevelId: item.responsibilityLevelId,
                responsibilityLevelName: item.responsibilityLevelName,
                roleId: String(item.roleId),
                roleName: item.roleName,
                subFunctionId: item.subFunctionId,
                subFunctionName: item.subFunctionName,
                users: item.users ?? [],
            }));
        setIsAccessDirty(true);
        const selectedRoleIds = new Set(
            selectedRoles.map((role: RoleFlyoutItem) => String(role.roleId)),
        );
        const selectedUsers = savedFlyOutData.users.filter(user =>
            selectedRoleIds.has(String(user.roleId)),
        );

        setSavedFlyOutData({
            roles: selectedRoles,
            users: selectedUsers,
        });

        setForumAccessTableData(prev => {
            const updatedRows = prev.map(item =>
                item.rowId === targetRowId
                    ? {
                          ...item,
                          roles: selectedRoles,
                          users: selectedUsers,
                      }
                    : item,
            );

            const updatedRow = updatedRows.find(item => item.rowId === targetRowId);
            setSelectedRoleFlyoutRow(updatedRow);

            return updatedRows;
        });

        closeFlyouts();
    };

    useEffect(() => {
        if (!forumDetail?.basicInformation) return;
        setGeneralInfoData(getGeneralInfoFromForumDetail(forumDetail));
        setGeographySelectionData(getGeographySelectionFromForumDetail(forumDetail));
        setHasForumInfoChanged(false);
        setIsGeneralInfoDirty(false);
    }, [forumDetail, getGeographySelectionFromForumDetail]);

    useEffect(() => {
        if (hasForumInfoChanged) {
            setIsGeneralInfoDirty(true);
        }
    }, [hasForumInfoChanged]);

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

        setIsAccessDirty(true);
    };

    const handleSaveChanges = async () => {
        try {
            const resolvedGeographyLevelId = getResolvedOptionId(
                generalInfoData.geographyLevelId,
                geographyLevels,
                'geographyLevelId',
                'geographyLevelName',
            );
            const resolvedGeographyLevelName = String(
                geographyLevels.find(
                    level => Number(level.geographyLevelId) === resolvedGeographyLevelId,
                )?.geographyLevelName ?? generalInfoData.geographyLevelId,
            ).toLowerCase();

            const forumOwners = forumAccessTableData.flatMap((row: any) => {
                let geographyId;

                switch (resolvedGeographyLevelName) {
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

                const roles = row.roles ?? [];
                const users = row.users ?? [];

                if (roles.length === 0) {
                    return [
                        {
                            GeographyId: geographyId,
                            RoleId: null,
                            userEmail: null,
                        },
                    ];
                }

                return roles.flatMap((role: any) => {
                    const usersForRole = users.filter(
                        (user: any) => String(user.roleId) === String(role.roleId),
                    );

                    if (usersForRole.length === 0) {
                        return [
                            {
                                GeographyId: geographyId,
                                RoleId: role.roleId,
                                userEmail: null,
                            },
                        ];
                    }

                    return usersForRole.map((user: any) => ({
                        GeographyId: geographyId,
                        RoleId: role.roleId,
                        userEmail: user.userEmail,
                    }));
                });
            });

            const payload: IAddForumsRequest = {
                forumId: Number(forumDetailParams?.forumId),
                forumName: generalInfoData.forumName,

                functionId: getResolvedOptionId(
                    generalInfoData.functionId,
                    functions,
                    'functionId',
                    'functionName',
                ),

                subFunctionId: getResolvedOptionId(
                    generalInfoData.subFunctionId,
                    subFunctions,
                    'subFunctionId',
                    'subFunctionName',
                ),

                geographyLevelId: resolvedGeographyLevelId,

                periodId: getResolvedOptionId(
                    generalInfoData.periodId,
                    forumPeriods,
                    'id',
                    'forumPeriodName',
                ),

                regionIds: geographySelectionData.regionIds,
                clusterIds: geographySelectionData.clusterIds,
                marketIds: geographySelectionData.marketIds,
                siteIds: geographySelectionData.siteIds,

                isRegionAll: geographySelectionData.isRegionAll,
                isClusterAll: geographySelectionData.isClusterAll,
                isMarketAll: geographySelectionData.isMarketAll,
                isSiteAll: geographySelectionData.isSiteAll,
                status:
                    String(generalInfoData.status).toLowerCase() === 'active' ||
                    String(generalInfoData.status) === '1',
                forumOwners,
            };

            const response = await dispatch(editForumV1(payload));
            setLastSavedForumAccessData(forumAccessTableData);

            setIsGeneralInfoDirty(false);
            setIsAccessDirty(false);
            setHasForumInfoChanged(false);

            if (pendingTab) {
                setSelectedTab(pendingTab);
                setPendingTab(null);
            }

            setShowSaveConfirm(false);
            setToastConfig({
                title: '',
                type: response.payload.status === 200 ? 'Success' : 'Error',
                message: response.payload.data.data,
            });
        } catch (error) {
            console.error(error);

            setToastConfig({
                title: '',
                type: 'Error',
                message: 'Forum update failed',
            });
        }
    };

    const handleDiscardChanges = () => {
        if (selectedTab === TabNamesEnum.GeneralInformation) {
            setDiscardGeneralInfo(true);
            setGeneralInfoData(getGeneralInfoFromForumDetail(forumDetail));
            setGeographySelectionData(getGeographySelectionFromForumDetail(forumDetail));
            setIsGeneralInfoDirty(false);
            setHasForumInfoChanged(false);
        }

        if (selectedTab === TabNamesEnum.Access) {
            setForumAccessTableData(lastSavedForumAccessData);
            setIsAccessDirty(false);
        }

        setHasForumInfoChanged(false);
        setIsAccessDirty(false);

        if (pendingTab) {
            setSelectedTab(pendingTab);
            setPendingTab(null);
        }
    };

    const handleUsersFlyoutSave = () => {
        const targetRowId = activeFlyoutRowIdRef.current ?? selectedRoleFlyoutRow?.rowId;

        if (!targetRowId) return;

        const selectedUsers = usersFlyoutData.filter(item => item.checked);

        const currentRoleId = selectedUsers[0]?.roleId ?? usersFlyoutData[0]?.roleId;

        const selectedRolesForRow = savedFlyOutData.roles.filter(role => role.checked ?? true);

        setIsAccessDirty(true);

        setForumAccessTableData(prev => {
            const updatedRows = prev.map(item => {
                if (item.rowId !== targetRowId) {
                    return item;
                }

                return {
                    ...item,

                    roles: selectedRolesForRow,

                    users: [
                        ...(item.users ?? []).filter(
                            (user: RoleUserItem) => String(user.roleId) !== String(currentRoleId),
                        ),

                        ...selectedUsers,
                    ],
                };
            });

            const updatedRow = updatedRows.find(item => item.rowId === targetRowId);

            setSelectedRoleFlyoutRow(updatedRow);

            return updatedRows;
        });

        closeFlyouts();
    };

    const handleBackClick = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        navigate('/admin-hub/forum-management');
    };

    const handleRoleDropdownCancelButton = () => {
        setSelectedRolesDD([]);
        setSelectedForumAccessRows([]);
        setClearTableSelection(true);
        setSelectedForumAccessRows([]);
    };

    const loadRolesForDropdown = async () => {
        const requestId = ++latestRoleRequestRef.current;

        setIsRoleDataLoading(true);

        try {
            await fetchDataForRolesAndUserFlyout(
                requestId,
                false,
                ROLE_SELECTION_PAGE_NUMBER,
                false,
            );
        } finally {
            if (requestId === latestRoleRequestRef.current) {
                setIsRoleDataLoading(false);
            }
        }
    };

    useEffect(() => {
        if (!openForumAccessSection) return;
        if (!rolesAndUsers.length) {
            loadRolesForDropdown();
        }
    }, [openForumAccessSection]);

   const getRoleGeographyLevelFilter = () => {
        switch (forumDetail?.basicInformation?.geographyLevel.toLowerCase()) {
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
    
    useEffect(() => {
        if (roleOptionsDD.length === 0) {
            fetchRolesDD(1);
        }
    }, [selectedForumAccessRows.length]);
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

            setHasMoreRolesDD(roles.length >= 10);

            if (roles.length >= 5) {
                setRolePageDD(pageNumber + 1);
            }
        } catch (error) {
            console.error('Error fetching dropdown roles:', error);
        }
    };

    function RenderTabContent() {
        switch (selectedTab) {
            case TabNamesEnum.GeneralInformation:
                return (
                    <GeneralInformation
                        forumDetail={forumDetail}
                        generalInfoData={generalInfoData}
                        setGeneralInfoData={setGeneralInfoData}
                        setHasForumInfoChanged={setHasForumInfoChanged}
                        setGeographySelectionData={setGeographySelectionData}
                        discardGeneralInfo={discardGeneralInfo}
                        setDiscardGeneralInfo={setDiscardGeneralInfo}
                        setIsPageDirty={setIsGeneralInfoDirty}
                    />
                );

            case TabNamesEnum.Access:
                return (
                    <div>
                        <ExpandableForm
                            title={<span>Forum Persona’s</span>}
                            description="Add all the personas related to the tool"
                            isOpen={openPersona}
                            onClick={() => {
                                setOpenPersona(prev => !prev);
                                setOpenForumAccessSection(prev => !prev);
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
                        <ExpandableForm
                            disabled={false}
                            isOpen={openForumAccessSection}
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
                            headerAction={null}
                            additionalContentInTitleContainer={
                                <Flex align="center">
                                    {openForumAccessSection && (
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

                                                            onChange: (
                                                                obj: OptionType,
                                                                checked: boolean,
                                                                tree: OptionType[],
                                                            ) => {
                                                                const allOption =
                                                                    roleOptionsDD.find(
                                                                        item =>
                                                                            item.value === 'ALL',
                                                                    );

                                                                const allRoles =
                                                                    roleOptionsDD.filter(
                                                                        item =>
                                                                            item.value !== 'ALL',
                                                                    );

                                                                if (obj.value === 'ALL') {
                                                                    if (checked) {
                                                                        setSelectedRolesDD([
                                                                            ...(allOption
                                                                                ? [allOption]
                                                                                : []),
                                                                            ...allRoles,
                                                                        ]);
                                                                    } else {
                                                                        setSelectedRolesDD([]);
                                                                    }

                                                                    return;
                                                                }

                                                                const selectedRoles = tree.filter(
                                                                    item => item.value !== 'ALL',
                                                                );

                                                                const isEverythingSelected =
                                                                    selectedRoles.length ===
                                                                    allRoles.length;

                                                                setSelectedRolesDD(
                                                                    isEverythingSelected
                                                                        ? [
                                                                              ...(allOption
                                                                                  ? [allOption]
                                                                                  : []),
                                                                              ...selectedRoles,
                                                                          ]
                                                                        : selectedRoles,
                                                                );
                                                            },

                                                            onScroll: () => {
                                                                if (hasMoreRolesDD) {
                                                                    fetchRolesDD();
                                                                }
                                                            },
                                                        }}
                                                    />
                                                    <button
                                                        className={
                                                            styles[
                                                                'forum-access-check-tick-icon-btn'
                                                            ]
                                                        }
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
                                                        className={
                                                            styles[
                                                                'forum-access-check-tick-icon-btn'
                                                            ]
                                                        }
                                                        onClick={() => {
                                                            handleRoleDropdownCancelButton();
                                                        }}
                                                    >
                                                        <Icon
                                                            size="l"
                                                            name="x-close"
                                                            color={'black-color'}
                                                        />
                                                    </button>
                                                </Flex>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        className={styles.expandButton}
                                        onClick={() =>
                                            setOpenForumAccessSection(!openForumAccessSection)
                                        }
                                    >
                                        <Icon
                                            name={
                                                openForumAccessSection
                                                    ? 'chevron-up'
                                                    : 'chevron-down'
                                            }
                                            size="l"
                                            color="neutrals-B800"
                                        />
                                    </button>
                                </Flex>
                            }
                        />
                    </div>
                );
            default:
                return selectedTab;
        }
    }

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

    const handleItemToggle = (flyoutItem: string, type: string, roleId?: string) => {
        if (type === 'Roles') {
            const nextRoles = rolesAndUsers.map(item => {
                if (String(flyoutItem) !== String(item.roleId)) {
                    return item;
                }

                return {
                    ...item,
                    checked: !item.checked,
                };
            });

            setRolesAndUsers(nextRoles);
            return;
        }

        const nextUsers = usersFlyoutData.map(item => {
            if (
                String(item.userEmail) !== String(flyoutItem) ||
                String(item.roleId) !== String(roleId)
            ) {
                return item;
            }

            return {
                ...item,
                checked: !item.checked,
            };
        });

        setUsersFlyoutData(nextUsers);
    };

    const handleSelectAllToggle = (checked: boolean, type?: string) => {
        if (type === 'Users' && !isRoleOnlyMode) {
            setUsersFlyoutData(prev =>
                prev.map(item => ({
                    ...item,
                    checked,
                })),
            );

            return;
        }

        setRolesAndUsers(prev =>
            prev.map(item => ({
                ...item,
                checked,
            })),
        );
    };
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

    return (
        <div className={styles.container}>
            <Flex vertical gap={24}>
                <Flex vertical gap={8} className={styles['forum-title']}>
                    <Flex align="center" gap={8} justify="space-between">
                        <Flex align="flex-start" gap={16}>
                            <div className={styles['header-back-button']}>
                                <Link to="/admin-hub/forum-management" onClick={handleBackClick}>
                                    {BackArrowIcon(8, 12)}
                                </Link>
                            </div>
                            <Flex justify="flex-start" vertical gap={8}>
                                <Label type="h2">
                                    <span className={styles['forum-heading']}>
                                        {forumDetail?.basicInformation?.forumName ??
                                            'Edit Forum Access'}
                                    </span>
                                </Label>
                                <Label type="body2">
                                    <span className={styles['edit-role-description']}>
                                        {forumDetail?.basicInformation?.geographyLevel ?? ''}|{' '}
                                        {forumDetail?.basicInformation?.period ?? ''}
                                    </span>
                                    <span className={styles['secondLine']}>
                                        {formatRefreshText(lastRefreshDate)}
                                    </span>
                                </Label>
                            </Flex>
                        </Flex>
                        {hasUnsavedChanges && (
                            <Flex align="center" gap={12}>
                                <Button
                                    text="Discard Changes"
                                    variant="Secondary"
                                    onClick={() => setOpenCancelDialog(true)}
                                />

                                <Button
                                    text="Save Changes"
                                    variant="Primary"
                                    onClick={() => setShowSaveConfirm(true)}
                                />
                            </Flex>
                        )}
                    </Flex>

                    <Flex className={styles['tabs-wrapper']}>
                        <Tab
                            items={[
                                {
                                    label: TabNamesEnum.GeneralInformation,
                                    icon: 'info-circle',
                                },
                                {
                                    label: TabNamesEnum.Access,
                                    icon: 'shield-tick',
                                },
                            ]}
                            onClick={onUserSelectTab}
                        />
                    </Flex>
                </Flex>

                {RenderTabContent()}

                {(isRoleFlyoutOpen || isUsersFlyoutOpen) && (
                    <RoleSelectionFlyoutForum
                        isEditable={isFlyoutEditable}
                        userFlyoutOpen={isUsersFlyoutOpen}
                        isRoleOnlyMode={isRoleOnlyMode}
                        onSelectUserCounter={(item: RoleFlyoutItem) => {
                            const selectedRole = filteredRoles.find(
                                roleItem => String(roleItem.roleId) === String(item.roleId),
                            );

                            const updatedUsers = (selectedRole?.users ?? []).map(
                                (userItem: RoleUserItem) => {
                                    const savedUser = savedFlyOutData.users.find(
                                        savedItem =>
                                            String(savedItem.roleId) ===
                                                String(selectedRole?.roleId) &&
                                            savedItem.userEmail === userItem.userEmail,
                                    );

                                    return {
                                        ...userItem,
                                        checked: Boolean(savedUser?.checked),
                                    };
                                },
                            );

                            setUsersFlyoutData(updatedUsers);

                            setActiveFlyoutContext('forumOwner');

                            setActiveFlyoutTitle('Users');
                            setFlyoutSearchPlaceholder('Search Users');

                            setUsersFlyoutOpen(true);

                            setIsFlyoutEditable(true);
                            setIsRoleOnlyMode(false);
                        }}
                        flyoutOpen={isRoleFlyoutOpen}
                        setIsFlyoutOpen={handleRoleFlyoutOpenChange}
                        userFlyoutData={usersFlyoutData}
                        onUserFlyoutBack={() => {
                            setActiveFlyoutTitle('Roles');
                            setFlyoutSearchPlaceholder('Search Roles');
                            setIsFlyoutEditable(false);
                            setUsersFlyoutOpen(false);
                            setIsRoleFlyoutOpen(true);

                            setActiveFlyoutContext('forumOwner');
                            setIsFlyoutEditable(false);
                            setIsRoleOnlyMode(false);
                        }}
                        totalUsers={savedFlyOutData.users.map(user => ({
                            ...user,
                            roleId: String(user.roleId),
                        }))}
                        heading={`Select ${activeFlyoutTitle}`}
                        subHeading=""
                        userFlyoutHeading={'Users'}
                        showSearch
                        searchPlaceholder={flyoutSearchPlaceholder}
                        onSearchChange={value => {
                            const searchValue = Array.isArray(value) ? value.join(' ') : value;
                            setSearchKeyword(searchValue);
                        }}
                        items={displayedRoleFlyoutItems}
                        dropdownFilter={dropdownFilters}
                        onItemToggle={handleItemToggle}
                        showSelectAll={!showSelectedOnly}
                        isAllSelected={isUsersFlyoutOpen ? isAllUsersSelected : isAllRolesSelected}
                        onSelectAllToggle={handleSelectAllToggle}
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
                            onClick: () => {
                                setShowSelectedOnly(prev => !prev);
                                setUsersFlyoutOpen(false);
                                setRoleFlyoutOpenClicked(false);
                                setUsersFlyoutOpenClicked(false);
                                setIsRoleFlyoutOpen(false);
                                closeFlyouts();
                            },
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
                                setUsersFlyoutOpenClicked(false);
                                setIsRoleFlyoutOpen(false);
                                setUsersFlyoutOpen(false);
                                closeFlyouts();
                            },
                        }}
                        primaryBtnProps={{
                            text: 'Save',
                            variant: 'Primary',
                            onClick: () => {
                                setShowSelectedOnly(false);
                                handleRoleFlyoutSave();
                            },
                        }}
                        primaryBtnPropsUsersFlyout={{
                            text: 'Save',
                            variant: 'Primary',
                            onClick: () => {
                                handleUsersFlyoutSave();
                            },
                        }}
                        cancelBtnPropsUsersFlyout={{
                            text: 'Cancel',
                            variant: 'Secondary',
                            onClick: () => {
                                setUsersFlyoutOpen(false);
                                setRoleFlyoutOpenClicked(false);
                                setUsersFlyoutOpenClicked(false);
                                setIsRoleFlyoutOpen(false);
                                closeFlyouts();
                            },
                        }}
                    />
                )}
            </Flex>
            <Dialog
                title="Save New Forum?"
                content="You are about to add a new forum using the provided details. Once saved, this forum will be avialable in command center. Please confirm to proceed."
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onPrimaryButtonClick={handleSaveChanges}
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
                    handleDiscardChanges();
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

export default EditNewForumScreen;
