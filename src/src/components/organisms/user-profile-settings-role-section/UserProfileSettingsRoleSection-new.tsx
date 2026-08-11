
// UserProfileSettingsRoleSection.tsx
 
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Card, Flex, Skeleton } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatedLoaders, Button, Dialog, Icon, Toast, Flyout, DropDown } from 'konnect-react-components';
import { Label, TextButton } from '../../atoms';
import { ExpandableForm } from '../../molecules';
import { UserProfileSettingsPrimaryRoleNew } from '../../../assets/images/images';
import { ROLE_TYPE, ROLE_SELECTION_PAGE_NUMBER, ROLE_SELECTION_PAGE_SIZE } from '../../../utils/constants';
import {
  RootState,
  AppDispatch,
  fetchUserRolesWithDetails,
  fetchPrimaryRoleNew,
  fetchRoleRequestStatus,
  fetchForumDetail,
  resendRequestForAutoRejects,
  deleteUserRoleMapping,
  fetchRoleData,
  editForumData
} from '../../../store';
import styles from './UserProfileSettingsRoleSection.module.scss';
import { RoleForumDetails, UserRoleDetails } from '../../../types/response';
import SecondaryPermissionsFlyout from '../secondary-permission-flyout/SecondaryPermissionFlyout';
import UserProfileSettingsForumSection from '../user-profile-settings-forum-section/UserProfileSettingsForumSectionTable';
import UserProfileSettingsRolesCardNew from '../../molecules/user-profile-settings-roles-card/UserProfileSettingsRolesCard-new';
import RequestNewRole from '../CreateRoleRequest/RequestNewRole';
import ViewPermissionsFlyoutContent from '../ViewPermissionsFlyoutContent/ViewPermissionsFlyoutContent';
import {
  FlyoutCheckboxItemForum,
  FlyoutUserCheckboxItem,
  RoleSelectionFlyoutForum,
} from '../role-selection-flyout/RoleSelectionFlyoutForum';
import { toCommaSeparated } from '../../../utils/helpers';
import { getRoleUserSelection } from '../../../services/application';

function UserProfileSettingsRoleSectionNew() {
  const dispatch = useDispatch<AppDispatch>();
  const [requestNewRole, setRequestNewRole] = useState<{ isOpen: boolean; action: 'add' | 'edit', roleType: 'primary' | 'secondary' }>({ isOpen: false, action: 'add', roleType: 'primary' })
  const [isSecondaryRoleDeletionDialogOpen, setIsSecondaryRoleDeletionDialogOpen] =
    useState<boolean>(false);
  const [userFlyoutData, setUserFlyoutData] = useState<FlyoutUserCheckboxItem[]>([])
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const roleType = useRef<string>('')
  const forumObj = useRef<any>()
  const [toggleToast, setToggleToast] = useState<boolean>(false);
  const roleIdRef = useRef({ roleId: 0 });
  const [openSecondaryRoles, setOpenSecondaryRoles] = useState<boolean>(false)
  const [openForum, setOpenForum] = useState<boolean>(false)
  const [openDelegatedRoles, setOpenDelegatedRoles] = useState<boolean>(false)
  const [primaryFlyoutVisible, setPrimaryFlyoutVisible] = useState(false);
  const [selectedPrimaryRoleId, setSelectedPrimaryRoleId] = useState<number>(0);
  const [roleReqStatus, setRoleReqStatus] = useState([])
  const [showLoader, setShowLoader] = useState<boolean>(false)
  const personaId = useRef<number>(1)
  const [forumOwner, setForumOwner] = useState<RoleForumDetails[]>([])
  const userRolesDetails = useSelector((state: RootState) => state.userRoleDetails.data);
  const userRoleLoadingState = useSelector((state: RootState) => state.userRolesWithDetails.loading);
  const [isRoleFlyoutOpen, setIsRoleFlyoutOpen] = useState(false);
  const [flyoutKey, setFlyoutKey] = useState(0);
  const delegatedBucket = useSelector(
    (state: RootState) =>
      state.userRole.delegated ?? { delegateRoleProfile: [], delegateRoleStatusSummary: [] }
  );
  const {
    roles,
    statusCounts,
    attributes,
  } = useSelector((state: RootState) => state.userRolesWithDetails);

  const mappedRoles: UserRoleDetails[] = useMemo(() => {
    return roles.map(role => {
      const roleId = role.roleId;

      const chips = role.statusCounts
        .filter(s => s.roleId === roleId)
        .reduce(
          (acc, s) => {
            const status = (s.status || '').toLowerCase();

            if (status.includes('approve')) acc.Approved += s.statusCount;
            else if (status.includes('pending') || status.includes('request'))
              acc.Pending += s.statusCount;
            else if (status.includes('reject') || status.includes('deny'))
              acc.AutoRejected += s.statusCount;

            return acc;
          },
          {
            Approved: 0,
            Pending: 0,
            Requested: 0,
            AddFailed: 0,
            AutoRejected: 0,
          }
        );

      return {
        roleId: role.roleId,
        roleName: role.roleName,
        geographyName: role.geographyName,
        subFunctionName: role.subFunctionName,
        departmentName: role.departmentName,
        roleType: role.roleType,
        statusCounts: role.statusCounts,
        assignedByUser: role.assignedByUser || 'John Doe',
        delegationStartDate: role.delegationStartDate || '2026-06-09T14:09:15.003',
        delegationEndDate: role.delegationEndDate || '2026-06-09T14:09:15.003',
        isAnyADGroupRequested:
          chips.Approved > 0 ||
          chips.Pending > 0 ||
          chips.AutoRejected > 0,
        isAnyADGroupPending: chips.Pending > 0,
        attributes: attributes.filter(a => a.roleId === roleId),
      };
    });
  }, [roles, statusCounts, attributes]);


  const isPrimaryRoleAdded = mappedRoles.some(
    role => role.roleType?.toLowerCase() === "primary"
  );
  const delegateStatusSummaryList = delegatedBucket?.delegateRoleStatusSummary ?? [];

  const getPrimaryId = () => (userRolesDetails as any)?.userRoleDetails?.find((item: { roleType: string }) => item.roleType === 'Primary')?.roleId

  const onClickHandlerForRoleDelete = (roleData: { roleId: number }) => {
    roleIdRef.current.roleId = roleData.roleId;
    setIsSecondaryRoleDeletionDialogOpen(!isSecondaryRoleDeletionDialogOpen);
  };

  const onSecondaryRoleDelete = async () => {
    setShowLoader(true)
    try {
      const result = await dispatch(deleteUserRoleMapping({ roleId: roleIdRef.current.roleId })).unwrap();
      setShowLoader(false)
      if (result.data) {
        setIsSecondaryRoleDeletionDialogOpen(!isSecondaryRoleDeletionDialogOpen);
        setToggleToast(true);
        dispatch(fetchUserRolesWithDetails());
      }
    } catch {
      setShowLoader(false)
    }
  };

  const getStatusOfChips = async () => {
    try {
      const result = await dispatch(fetchRoleRequestStatus()).unwrap();
      if (result) {
        setRoleReqStatus(result)
        setShowLoader(false)
      }
    } catch {
      setShowLoader(false)
    }
  }

  const loaderComponent = () => {
    return (<div className={styles['overlay']}>
      <AnimatedLoaders id="lazy-loader" type="page" />
    </div>)
  }

  const callAutoRejectResendReqApi = async (roleId: number) => {
    setShowLoader(true)
    const statusObject = roleReqStatus.find((item: { roleId: number, status: string }) => item.roleId === roleId && item.status === "Auto-Rejected")
    const req = {
      roleId: roleId,
      adGroups: (statusObject as any).adGroupIds
    }
    try {
      const result = await dispatch(resendRequestForAutoRejects(req)).unwrap();
      if (result) {
        getStatusOfChips()
      }
    } catch {
      setShowLoader(false)
    }
  }

  const onSecondaryRoleDeleteDialogClose = () => {
    setIsSecondaryRoleDeletionDialogOpen(!isSecondaryRoleDeletionDialogOpen);
  };

  const showSecondaryRoleModel = () => {
    setRequestNewRole({
      isOpen: true,
      action: 'add',
      roleType: 'secondary',
    });
  };

  const handlRequestFlyoutClose = () => {
    setRequestNewRole({ action: 'add', isOpen: false, roleType: 'primary' })
  }

  const handleRoleRequestSuccess = () => {
    dispatch(fetchUserRolesWithDetails());

    if (requestNewRole.roleType === 'secondary') {
      setOpenSecondaryRoles(true);
    }
  };

  useEffect(() => {
    dispatch(fetchPrimaryRoleNew())
    dispatch(fetchUserRolesWithDetails());
  }, [dispatch]);


  useEffect(() => {
    fetchForumDetails()
  }, [dispatch, pageSize, pageNumber]);

  const fetchForumDetails = async () => {
    setShowLoader(true)
    try {
      const result = await dispatch(fetchForumDetail({ pageSize: pageSize, pageNumber: pageNumber })).unwrap();
      setShowLoader(false)
      if (result.forums) {
        const resp = result.forums
        setTotalRows(result.pagination.totalRows)
        setForumOwner(resp);
      }
    } catch {
      setShowLoader(false)
    }
  };

  const [flyoutVisible, setFlyoutVisible] = useState(false);
  const [selectedRole,] = useState({ roleId: 0, roleType: '', region: '' });

  useEffect(() => {
    getStatusOfChips()
  }, [mappedRoles, dispatch])

  const isSecondaryRoleAdded = mappedRoles.some(
    role => role.roleType?.toLowerCase() === "secondary"
  );

  useEffect(() => {
    if (isSecondaryRoleAdded) {
      setOpenSecondaryRoles(true);
    }
  }, [isSecondaryRoleAdded]);

  const isGuestUser = () => mappedRoles.length === 0

  const primaryRoles = mappedRoles.filter(role => role?.roleType?.toLowerCase() === "primary")?.[0] ?? undefined
  const secondaryRoles = mappedRoles.filter(role => role?.roleType?.toLowerCase() === "secondary")

  const delegatedRoles = mappedRoles.filter(role => role?.roleType?.toLowerCase() === "delegated")

  const renderPrimaryCard = () => {
    if (isGuestUser()) {
      return (
        <div className={styles['role-card-children']}>
          <UserProfileSettingsPrimaryRoleNew />
          <Label type="h2">
            <span className={styles['role-card-children-title']}>Request Primary Role</span>{' '}
          </Label>
          <Label type="body3">
            <span className={styles['role-card-children-label']}>
              No Primary role added. Click "Request Primary Role" to begin the process.
            </span>
          </Label>
          <Button icon='plus' text="Request Primary Role" onClick={() => setRequestNewRole({ isOpen: true, action: 'add', roleType: 'primary' })}></Button>
        </div>
      )
    } else if (userRoleLoadingState) {
      return (
        <PrimaryRoleCardEmptyState
          userRoleLoadingState={userRoleLoadingState}
          isPrimaryRoleAdded={isPrimaryRoleAdded}
        />
      )
    } else {
      return (<UserProfileSettingsRolesCardNew
        roleType={ROLE_TYPE.PRIMARY}
        roleData={primaryRoles}
        isSecondaryRoleAdded={isSecondaryRoleAdded}
        onEditClick={() => setRequestNewRole({ action: 'edit', isOpen: true, roleType: 'primary' })}
        onCardClick={() => {
          if (!primaryRoles?.roleId) return;
          setSelectedPrimaryRoleId(primaryRoles?.roleId || 0);
          setPrimaryFlyoutVisible(true);
        }}
        clickHandlerForAutoReject={() => callAutoRejectResendReqApi(getPrimaryId())}
      />)
    }
  }

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    function: [],
    subfunction: [],
    geographyLevel: [],
    rolelevel: [],
    userGroup: [],
  });
  const [roleUserDataState, setRoleUserDataState] = useState<FlyoutCheckboxItemForum[]>([]);
  const roleUserDataRef = useRef<FlyoutCheckboxItemForum[]>([]);
  const [activeUsersRoleId, setActiveUsersRoleId] = useState<string | null>(null);

  const [activePersonaName, setActivePersonaName] = useState<string | null>("Roles");
  const [roleFlyoutHeading, setRoleFlyoutHeading] = useState<string>('Select Viewers');
  const [showSelectedRolesOnly, setShowSelectedRolesOnly] = useState(false);
  const [showSelectedUsersOnly, setShowSelectedUsersOnly] = useState(false);
  const [usersFlyoutOpen, setUsersFlyoutOpen] = useState(false);
  const { columnFilters } = useSelector((state: RootState) => state.roleData);
  const latestRequestRef = useRef(0);
  const selectedRoleUserKeysRef = useRef<Set<string>>(new Set());
  const selectedUserEmailsRef = useRef<Set<string>>(new Set());
  const selectedRolesCountRef = useRef(0);
  const rolePageRef = useRef(ROLE_SELECTION_PAGE_NUMBER);
  const [isRoleDataLoading, setIsRoleDataLoading] = useState(false);
  const [hasMoreRoles, setHasMoreRoles] = useState(true);
  const [isLoadingMoreRoles, setIsLoadingMoreRoles] = useState(false);

  const resetRoleFilters = useCallback(() => {
    setSearchKeyword('');
    setSelectedFilters({
      function: [],
      subfunction: [],
      geographyLevel: [],
      rolelevel: [],
      userGroup: [],
    });
  }, []);

  const syncSelectionRefsFromRoles = useCallback((roles: FlyoutCheckboxItemForum[] = []) => {
    const roleUserKeys = new Set<string>();

    roles.forEach((role: any) => {
      (role.users || []).forEach((user: any) => {
        if (!user.checked || !user.userEmail) return;

        const normalizedEmail = String(user.userEmail).toLowerCase();
        roleUserKeys.add(`${String(role.roleId)}::${normalizedEmail}`);
      });
    });

    selectedRoleUserKeysRef.current = roleUserKeys;
    // clear email-only seed after explicit interaction to prevent cross-role contamination
    selectedUserEmailsRef.current = new Set();
    selectedRolesCountRef.current = roles.filter((r: any) => r.checked).length;
  }, []);

  const seedSelectionRefsFromForum = useCallback(() => {
    const selectedEmails = new Set<string>();

    if (personaId.current === 3) {
      (forumObj.current?.viewerList || []).forEach((item: { userEmail: string }) => {
        if (item?.userEmail) selectedEmails.add(item.userEmail.toLowerCase());
      });
    } else if (personaId.current === 1) {
      (forumObj.current?.forumOwnerList || []).forEach((item: { userEmail: string }) => {
        if (item?.userEmail) selectedEmails.add(item.userEmail.toLowerCase());
      });
    } else {
      (forumObj.current?.decisionOwnerList || []).forEach((item: { userEmail: string }) => {
        if (item?.userEmail) selectedEmails.add(item.userEmail.toLowerCase());
      });
    }

    selectedRoleUserKeysRef.current = new Set();
    selectedUserEmailsRef.current = selectedEmails;
  }, []);

  const getDisabledEmailsForActivePersona = useCallback(() => {
    const disabledEmails = new Set<string>();

    if (personaId.current !== 1) {
      (forumObj.current?.forumOwnerList || []).forEach((item: { userEmail: string }) => {
        if (item?.userEmail) disabledEmails.add(item.userEmail.toLowerCase());
      });
    }

    if (personaId.current !== 2) {
      (forumObj.current?.decisionOwnerList || []).forEach((item: { userEmail: string }) => {
        if (item?.userEmail) disabledEmails.add(item.userEmail.toLowerCase());
      });
    }

    if (personaId.current !== 3) {
      (forumObj.current?.viewerList || []).forEach((item: { userEmail: string }) => {
        if (item?.userEmail) disabledEmails.add(item.userEmail.toLowerCase());
      });
    }

    return disabledEmails;
  }, []);

  const buildRoleUserSelectionPayload = useCallback(
    (pageNumber: number) => ({
      geographyLevelId: toCommaSeparated(selectedFilters.geographyLevel),
      functionId: toCommaSeparated(selectedFilters.function),
      subFunctionId: toCommaSeparated(selectedFilters.subfunction),
      roleResponsibilityLevelId: toCommaSeparated(selectedFilters.rolelevel),
      userEmail: null,
      userGroupId: toCommaSeparated(selectedFilters.userGroup),
      roleId: null,
      searchKeyword: searchKeyword.trim() || undefined,
      pageNumber,
      pageSize: ROLE_SELECTION_PAGE_SIZE,
    }),
    [selectedFilters, searchKeyword],
  );

  const mapRoleUserRows = useCallback((rows: any[] = []): FlyoutCheckboxItemForum[] => {
    const groupedRole: FlyoutCheckboxItemForum[] = Object.values(
      rows.reduce((acc: any, item: any) => {
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

        if (item.userEmail) {
          acc[key].users.push({
            roleId: item.roleId,
            fullName: item.fullName,
            userEmail: item.userEmail,
            userName: item.userName,
            userGroupId: item.userGroupId,
            userGroupName: item.userGroupName,
            userGroupEmail: item.userGroupEmail,
            checked: false,
          });
        }

        return acc;
      }, {})
    );

    return groupedRole.map((item: FlyoutCheckboxItemForum) => ({ ...item, checked: false }));
  }, []);

  const applyForumSelection = useCallback((roles: FlyoutCheckboxItemForum[]) => {
    const selectedRoleUserKeys = selectedRoleUserKeysRef.current;
    const selectedUsersByEmail = selectedUserEmailsRef.current;
    const disabledEmails = getDisabledEmailsForActivePersona();

    return roles.map(role => {
      const users = (role.users || []).map((user: any) => ({
        ...user,
        checked:
          selectedRoleUserKeys.has(
            `${String(role.roleId)}::${String(user.userEmail || '').toLowerCase()}`,
          ) || selectedUsersByEmail.has(String(user.userEmail || '').toLowerCase()),
        disabled: disabledEmails.has(String(user.userEmail || '').toLowerCase()),
      }));

      return {
        ...role,
        users,
        checked: users.some((user: any) => user.checked),
      };
    });
  }, [getDisabledEmailsForActivePersona]);

  const mergeRoleLists = useCallback(
    (existingRoles: FlyoutCheckboxItemForum[], incomingRoles: FlyoutCheckboxItemForum[]) => {
      const mergedByRoleId = new Map<string, FlyoutCheckboxItemForum>();

      existingRoles.forEach(role => {
        mergedByRoleId.set(String(role.roleId), role);
      });

      incomingRoles.forEach(role => {
        const roleIdKey = String(role.roleId);
        const existing = mergedByRoleId.get(roleIdKey);

        if (!existing) {
          mergedByRoleId.set(roleIdKey, role);
          return;
        }

        const existingUsersByEmail = new Map<string, any>();
        (existing.users || []).forEach((user: any) => {
          existingUsersByEmail.set(String(user.userEmail).toLowerCase(), user);
        });

        const mergedUsers = [...(existing.users || [])];
        (role.users || []).forEach((incomingUser: any) => {
          const emailKey = String(incomingUser.userEmail).toLowerCase();
          if (!existingUsersByEmail.has(emailKey)) {
            mergedUsers.push(incomingUser);
          }
        });

        mergedByRoleId.set(roleIdKey, {
          ...existing,
          ...role,
          users: mergedUsers,
          checked: mergedUsers.some((user: any) => user.checked),
        });
      });

      return Array.from(mergedByRoleId.values());
    },
    [],
  );

  const hasMoreByResponse = (
    rowsCount: number,
    pageNumber: number,
    totalRows?: number,
  ) => {
    if (typeof totalRows === 'number') {
      return pageNumber * ROLE_SELECTION_PAGE_SIZE < totalRows;
    }

    return rowsCount >= ROLE_SELECTION_PAGE_SIZE;
  };

  const handleLoadMoreRoles = useCallback(async () => {
    if (!isRoleFlyoutOpen || !hasMoreRoles || isLoadingMoreRoles || isRoleDataLoading) return;

    const nextPage = rolePageRef.current + 1;
    const requestId = ++latestRequestRef.current;
    setIsLoadingMoreRoles(true);

    try {
      const res = await getRoleUserSelection(buildRoleUserSelectionPayload(nextPage));
      const roleUserRows: any[] = res?.data?.data ?? [];

      if (requestId !== latestRequestRef.current) return;

      if (roleUserRows.length > 0) {
        rolePageRef.current = nextPage;
      }

      const nextRoles = applyForumSelection(mapRoleUserRows(roleUserRows));
      const mergedRoles = mergeRoleLists(roleUserDataRef.current, nextRoles);
      roleUserDataRef.current = mergedRoles;
      setRoleUserDataState(mergedRoles);
      selectedRolesCountRef.current = mergedRoles.filter((r: any) => r.checked).length;

      setHasMoreRoles(
        hasMoreByResponse(
          roleUserRows.length,
          nextPage,
          res?.data?.pagination?.totalRows,
        ),
      );
    } catch {
      // keep current role list if load-more fails
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoadingMoreRoles(false);
      }
    }
  }, [
    isRoleFlyoutOpen,
    hasMoreRoles,
    isLoadingMoreRoles,
    isRoleDataLoading,
    buildRoleUserSelectionPayload,
    applyForumSelection,
    mapRoleUserRows,
    mergeRoleLists,
  ]);

  useEffect(() => {
    if (!isRoleFlyoutOpen) {
      latestRequestRef.current += 1;
      setIsRoleDataLoading(false);
      setIsLoadingMoreRoles(false);
      return;
    }

    rolePageRef.current = ROLE_SELECTION_PAGE_NUMBER;
    setHasMoreRoles(true);
    setIsRoleDataLoading(true);

    const timer = setTimeout(() => {
      const fetchRoleUsers = async () => {
        const requestId = ++latestRequestRef.current;

        try {
          const res = await getRoleUserSelection(
            buildRoleUserSelectionPayload(ROLE_SELECTION_PAGE_NUMBER),
          );
          const roleUserRows: any[] = res?.data?.data ?? [];

          if (requestId !== latestRequestRef.current) return;

          const mappedRoles = applyForumSelection(mapRoleUserRows(roleUserRows));
          roleUserDataRef.current = mappedRoles;
          setRoleUserDataState(mappedRoles);
          // only update count when results are non-empty; blank search shouldn't reset the count
          if (roleUserRows.length > 0) {
            selectedRolesCountRef.current = mappedRoles.filter((r: any) => r.checked).length;
          }
          setHasMoreRoles(
            hasMoreByResponse(
              roleUserRows.length,
              ROLE_SELECTION_PAGE_NUMBER,
              res?.data?.pagination?.totalRows,
            ),
          );
          setIsRoleDataLoading(false);
        } catch {
          if (requestId === latestRequestRef.current) {
            roleUserDataRef.current = [];
            setRoleUserDataState([]);
            setHasMoreRoles(false);
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
    searchKeyword,
    buildRoleUserSelectionPayload,
    applyForumSelection,
    mapRoleUserRows,
  ]);

  useEffect(() => {
    if (!usersFlyoutOpen || !activeUsersRoleId) return;

    const activeRole = (roleUserDataState?.length ? roleUserDataState : roleUserDataRef.current).find(
      (item: any) => String(item.roleId) === String(activeUsersRoleId),
    );

    setUserFlyoutData(activeRole?.users || []);
  }, [usersFlyoutOpen, activeUsersRoleId, roleUserDataState]);

  const getSelectedUsersCount = () => {
    return userFlyoutData.filter((item: any) => item.checked).length
  };

  const isAllSelectableRolesChecked = () => {
    const selectableRoles = roleUserDataRef.current.filter((item: any) =>
      (item.users || []).some((user: any) => !user.disabled),
    );

    if (!selectableRoles.length) return false;
    return selectableRoles.every((item: any) => item.checked);
  };

  const isAllSelectableUsersChecked = () => {
    const selectableUsers = (userFlyoutData || []).filter((item: any) => !item.disabled);

    if (!selectableUsers.length) return false;
    return selectableUsers.every((item: any) => item.checked);
  };

  const handleSelectAllToggle = (checked: boolean, type: string) => {
    let temp: any[] = [];

    if (type === 'Roles') {
      temp = roleUserDataRef.current.map((item: any) => {
        item.checked = checked;
        item.users.forEach((user: any) => {
          if (!user.disabled) {
            user.checked = checked;
          }
        });
        return item;
      });
    } else {
      temp = roleUserDataRef.current.map((item: any) => {
        if (String(item.roleId) === String(activeUsersRoleId)) {
          item.users.forEach((user: any) => {
            if (!user.disabled) {
              user.checked = checked;
            }
          });
          item.checked = item.users.some((user: any) => user.checked);
          setUserFlyoutData([...item.users]);
        }
        return item;
      });
    }

    roleUserDataRef.current = temp;
    syncSelectionRefsFromRoles(temp);
    setRoleUserDataState(temp);
  };

  const handleRoleFlyoutOpenChange = (value: boolean | ((prev: boolean) => boolean)) => {
    setIsRoleFlyoutOpen((prev: any) => {
      const nextValue = typeof value === 'function' ? value(prev) : value;

      if (!nextValue) {
        resetRoleFilters();
        setShowSelectedRolesOnly(false);
        setShowSelectedUsersOnly(false);
        setUsersFlyoutOpen(false);
        selectedRoleUserKeysRef.current = new Set();
        selectedUserEmailsRef.current = new Set();
        selectedRolesCountRef.current = 0;
      }

      return nextValue;
    });
  };

  const closeRoleFlyout = () => {
    resetRoleFilters();
    setShowSelectedRolesOnly(false);
    setShowSelectedUsersOnly(false);
    setUsersFlyoutOpen(false);
    setActiveUsersRoleId(null);
    selectedRoleUserKeysRef.current = new Set();
    selectedUserEmailsRef.current = new Set();
    selectedRolesCountRef.current = 0;
    setIsRoleFlyoutOpen(false)
  };

  const getSelectedRolesCount = () => {
    return selectedRolesCountRef.current;
  };

  const getUserGroupOptions = () => {
    const uniqueGroups = new Map<string, { label: string; value: string }>();

    roleUserDataRef.current.forEach((item: any) => {
      if (item.userGroupId && item.userGroupName) {
        uniqueGroups.set(String(item.userGroupId), {
          label: item.userGroupName,
          value: String(item.userGroupId),
        });
      }
    });

    return Array.from(uniqueGroups.values());
  };

  const handleRoleFlyoutSave = async () => {
    setIsRoleFlyoutOpen(false)
    resetRoleFilters();
    setShowSelectedRolesOnly(false);
    setShowSelectedUsersOnly(false);
    setUsersFlyoutOpen(false);
    setActiveUsersRoleId(null);
    selectedRoleUserKeysRef.current = new Set();
    selectedUserEmailsRef.current = new Set();
    selectedRolesCountRef.current = 0;
    setShowLoader(true)
    const selectedRoles = roleUserDataRef.current.filter(item => item.checked).map((item) => {
      const userObj = Array.from(
        new Map(
          item.users
            .filter((user: any) => user.checked)
            .map((user: any) => [
              user.userEmail,
              { userEmail: user.userEmail },
            ])
        ).values()
      );
      return {
        roleId: item.roleId,
        users: userObj
      }
    })
    const roleIdsInCurrentFlyout = new Set(
      roleUserDataRef.current.map((item: any) => Number(item.roleId))
    );

    const result = Object.values(
      (forumObj.current?.forumOwnerList || []).reduce(
        (acc: any, { id, userEmail }: any) => {
          if (roleIdsInCurrentFlyout.has(Number(id))) {
            // Role/user selections for currently visible roles are sourced from selectedRoles.
            return acc;
          }

          if (!acc[id]) {
            acc[id] = {
              roleId: id,
              users: [],
            };
          }
          if (
            !acc[id].users.some((u: any) => u.userEmail === userEmail)
          ) {
            acc[id].users.push({
              userEmail,
            });
          }
          return acc;
        },
        {} as Record<number, { roleId: number; users: { userEmail: string }[] }>
      )
    );
    const req: any = {
      forumId: forumObj.current?.forumId,
      personaId: personaId.current,
      geographyId: forumObj.current?.geographyId,
      roleUsers: [...result, ...selectedRoles]
    }

    try {
      const result = await dispatch(editForumData(req)).unwrap();
      setShowLoader(false)
      if (result) {
        fetchForumDetails()
      }
    } catch {
      setShowLoader(false)
    }
  };


  const mapToOptions = (data: any[] = []) =>
    data.map(item => ({
      label: item.columnValue,
      value: item.id ?? item.columnValue,
    }));

  const handleMultiSelectChange = (key: string) => {
    return (_option: any, _checked: boolean, tree: any[]) => {
      setSelectedFilters((prev: any) => ({
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
        searchKeyword: searchKeyword,
        searchTerm: 'Role',
        gridFilters,
        userEmail: '',
        forumLevel: '',
        forumPeriod: '',
      }),
    );
  }, []);

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

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
  };

  const checkIfRoleEditable = () => {
    return roleType.current === 'Forum Owner';
  }

  return (
    <>
      {showLoader ? loaderComponent() : <>
        <Card className={styles['user-profile-settings-card']}>
          <div className={styles['role-card-title']}>Primary Role</div>
          {renderPrimaryCard()}
          <RequestNewRole callBackFetchRoles={handleRoleRequestSuccess} action={requestNewRole.action} flyoutOpen={requestNewRole.isOpen} setIsFlyoutOpen={handlRequestFlyoutClose} roleType={requestNewRole.roleType} />
        </Card>

        <ExpandableForm
          title={<span>Secondary Role</span>}
          description="Manage tool permissions and AD Groups for added roles"
          isOpen={openSecondaryRoles}
          content={
            <div className={styles['permissionTableWrapper']}>
              {secondaryRoles.length ? (
                <div>
                  {secondaryRoles.map(role => (
                    <UserProfileSettingsRolesCardNew
                      key={role?.roleId}
                      roleType={ROLE_TYPE.SECONDARY}
                      roleData={role as any}
                      onClickHandlerForRoleDelete={onClickHandlerForRoleDelete}
                      onCardClick={() => {
                        if (!role?.roleId) return;
                        setSelectedPrimaryRoleId(role.roleId);
                        setPrimaryFlyoutVisible(true);
                      }}
                      clickHandlerForAutoReject={() => callAutoRejectResendReqApi(role.roleId)}
                    />
                  ))}
                </div>
              ) : (
                <SecondaryRoleCardEmptyState
                  userRoleLoadingState={userRoleLoadingState}
                  isPrimaryRoleAdded={isPrimaryRoleAdded}
                />
              )}
              <SecondaryPermissionsFlyout
                roleId={selectedRole.roleId}
                roleType={selectedRole.roleType}
                roleRegion={selectedRole.region}
                toggleFlyout={flyoutVisible}
                onCancelIconClickOfFlyout={() => setFlyoutVisible(false)}
              />
            </div>
          }
          disabled={isGuestUser() || userRoleLoadingState}
          additionalContentInTitleContainer={
            <Flex justify="space-between" className={styles['user-profile-settings-card-secondary-heading']}>
              <Flex gap={8}>
                <TextButton onClick={() => showSecondaryRoleModel()} disabled={!isPrimaryRoleAdded}>
                  <Flex gap={8}>
                    <div
                      style={{ fontSize: 22 }}
                      className={
                        isPrimaryRoleAdded
                          ? styles['secondary-role-card-title']
                          : styles['secondary-role-card-title-disabled']
                      }
                    >
                      +
                    </div>
                    <div
                      className={
                        isPrimaryRoleAdded
                          ? styles['secondary-role-card-title']
                          : styles['secondary-role-card-title-disabled']
                      }
                    >
                      Secondary Role
                    </div>
                  </Flex>
                </TextButton>
                <button disabled={isGuestUser() || userRoleLoadingState} className={styles['expand-button']} onClick={() => setOpenSecondaryRoles(!openSecondaryRoles)}>
                  <Icon
                    name={
                      openSecondaryRoles ? 'chevron-up' : 'chevron-down'
                    }
                    size="l"
                    color="neutrals-B800"
                  />
                </button>
              </Flex>
            </Flex>
          }
        />

        <ExpandableForm
          title={<span>Forums</span>}
          description="View all the forums you are a part of"
          isOpen={openForum}
          content={
            <div className={styles['permissionTableWrapper']}>
              {forumOwner.length > 0 ?
                <>
                  <div className={styles['role-card-forum-info-tag']}>
                    <div className={styles['role-card-label-primary-role-added']}>
                      You can edit the collaborators of all forums where you are a forum owner.
                    </div>
                  </div>
                  <UserProfileSettingsForumSection
                    pageSize={pageSize}
                    pageNumber={pageNumber}
                    handlePageChange={handlePageChange}
                    handlePageSizeChange={handlePageSizeChange}
                    totalRows={totalRows}
                    onClickRow={(forum: RoleForumDetails, key: string) => {
                      let heading = 'Select Viewers'
                      roleType.current = forum.roleName
                      forumObj.current = forum
                      if (key?.toLowerCase() === 'viewer') {
                        personaId.current = 3
                        heading = 'Select Viewers'
                      } else if (key?.toLowerCase() === 'forumowner') {
                        personaId.current = 1
                        heading = 'Select Forum Owners'
                      } else {
                        personaId.current = 2
                        heading = 'Select Decision Owners'
                      }
                      setRoleFlyoutHeading(heading)
                      setActivePersonaName(heading)
                      resetRoleFilters();
                      setShowSelectedRolesOnly(false);
                      seedSelectionRefsFromForum();
                      setFlyoutKey(k => k + 1);
                      setIsRoleFlyoutOpen(true)
                    }}
                    data={forumOwner} />
                </> :
                <div className={styles['role-card-label-primary-role-added']}>
                  You don't have access to a forum.
                </div>}
            </div>
          }
          // disabled={isGuestUser() || userRoleLoadingState}
          onClick={() => setOpenForum(!openForum)}
          additionalContentInTitleContainer={
            <Icon
              name={
                openForum ? 'chevron-up' : 'chevron-down'
              }
              size="l"
              color="neutrals-B800"
            />
          }
        />

        <ExpandableForm
          title={<span>Delegated Role</span>}
          description="All roles delegated to you will be visible here."
          isOpen={openDelegatedRoles}
          content={
            <div className={styles['permissionTableWrapper']}>
              {delegatedRoles.length === 0 ? (
                <div className={styles['role-card-label-primary-role-added']}>
                  No Roles currently delegated.
                </div>
              ) : (
                <div>
                  {delegatedRoles.map(profile => {
                    return (
                      <UserProfileSettingsRolesCardNew
                        key={profile.roleId}
                        roleType={ROLE_TYPE.DELEGATED}
                        delegateStatusSummaryList={delegateStatusSummaryList}
                        roleData={profile}
                        onCardClick={() => {
                          if (!profile?.roleId) return;
                          setSelectedPrimaryRoleId(profile.roleId);
                          setPrimaryFlyoutVisible(true);
                        }}
                        clickHandlerForAutoReject={() => callAutoRejectResendReqApi(profile.roleId)}
                      />
                    );
                  })}
                </div>)}
            </div>
          }
          disabled={isGuestUser() || userRoleLoadingState}
          onClick={() => setOpenDelegatedRoles(!openDelegatedRoles)}
          additionalContentInTitleContainer={
            <Icon
              name={
                openDelegatedRoles ? 'chevron-up' : 'chevron-down'
              }
              size="l"
              color="neutrals-B800"
            />
          }
        /></>}
      <Flyout
        direction="right"
        containerMaxWidth="56.5rem"
        id="primary-role-flyout"
        flyoutOpen={primaryFlyoutVisible}
        cancelIconClick={() => setPrimaryFlyoutVisible(false)}
        heading="View Permissions for Role"
        iconForCancel={{
          icon: 'x-close',
          onClick: () => setPrimaryFlyoutVisible(false),
        }}
        content={<ViewPermissionsFlyoutContent roleId={selectedPrimaryRoleId} />}
      />

      <RoleSelectionFlyoutForum
        key={flyoutKey}
        isEditable={checkIfRoleEditable()}
        flyoutOpen={isRoleFlyoutOpen}
        setIsFlyoutOpen={handleRoleFlyoutOpenChange}
        isRoleDataLoading={isRoleDataLoading}
        hasMoreItems={hasMoreRoles}
        isLoadingMore={isLoadingMoreRoles}
        onLoadMore={handleLoadMoreRoles}
        userFlyoutOpen={usersFlyoutOpen}
        items={
          showSelectedRolesOnly
            ? roleUserDataRef.current.filter((item: any) => item.checked)
            : roleUserDataRef.current
        }
        userFlyoutData={userFlyoutData}
        isRoleOnlyMode={false}
        heading={`${activePersonaName}`}
        subHeading="Search and select roles & users"
        userFlyoutHeading="Select Users"
        userFlyoutSubHeading="Search and select users for this role"
        showSearch
        searchPlaceholder="Search Roles"
        userSearchPlaceholder="Search Users"
        onSearchChange={value => {
          const searchValue = Array.isArray(value) ? value.join(' ') : value;
          setSearchKeyword(searchValue);
        }}
        onUserFlyoutBack={() => {
          setActivePersonaName(roleFlyoutHeading)
          setIsRoleFlyoutOpen(true)
          setUsersFlyoutOpen(false)
          setActiveUsersRoleId(null)
        }}
        dropdownFilter={dropdownFilters}
        onItemToggle={(id: string, type: string, roleId?: string) => {
          let temp = []
          if (type === 'Roles') {
            temp = roleUserDataRef.current.map((item) => {
              if (item.roleId === id) {
                const nextChecked = !item.checked
                item.checked = nextChecked
                item.users.forEach((users: any) => {
                  if (!users.disabled) {
                    users.checked = nextChecked
                  }
                })
              }
              return item
            })
          } else {
            temp = roleUserDataRef.current.map((item) => {
              if (item.roleId === roleId) {
                item.users.forEach((user: any) => {
                  if (user.userEmail === id && !user.disabled) {
                    user.checked = !user.checked
                  }
                })
                item.checked = item.users.some((user: any) => user.checked)
              }
              return item
            })
          }
          roleUserDataRef.current = temp
          syncSelectionRefsFromRoles(temp)
          setRoleUserDataState(temp)
        }}
        onSelectUserCounter={(item: any) => {
          setActivePersonaName("Users")
          setUsersFlyoutOpen(true)
          setActiveUsersRoleId(String(item.roleId))
          setUserFlyoutData(item.users)
        }}
        showSelectAll={!showSelectedRolesOnly && !showSelectedUsersOnly}
        onSelectAllToggle={handleSelectAllToggle}
        isAllRolesSelected={isAllSelectableRolesChecked()}
        isAllUsersSelected={isAllSelectableUsersChecked()}
        primaryBtnProps={{
          text: 'Save',
          variant: 'Primary',
          disabled: !checkIfRoleEditable(),
          onClick: handleRoleFlyoutSave,
        }}
        secondaryBtnProps={{
          disabled: false,
          onClick: () => closeRoleFlyout(),
          text: 'Cancel',
          variant: 'Secondary',
        }}
        cancelBtnProps={{
          disabled: false,
          hidden: true,
          onClick: () => setShowSelectedRolesOnly(prev => !prev),
          text: showSelectedRolesOnly
            ? 'Show All'
            : `View Selected (${getSelectedRolesCount()})`,
          variant: 'Subtle2',
        }}
        primaryBtnPropsUsersFlyout={{
          text: 'Save',
          variant: 'Primary',
          disabled: !checkIfRoleEditable(),
          onClick: () => {
            setActivePersonaName(roleFlyoutHeading)
            setIsRoleFlyoutOpen(true)
            setUsersFlyoutOpen(false)
          },
        }}
        secondaryBtnPropsUserFlyout={{
          text: 'Cancel',
          variant: 'Secondary',
          onClick: () => {
            setUsersFlyoutOpen(false);
            setActiveUsersRoleId(null);
          },
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

      <Dialog
        id=""
        isOpen={isSecondaryRoleDeletionDialogOpen}
        title="Confirm Deletetion"
        content="Are you sure you want to delete this role? Deleting this role will result in the loss of all privileges for the existing applications."
        primaryButtonText="Delete Role"
        secondaryButtonText="Don’t Delete"
        onPrimaryButtonClick={onSecondaryRoleDelete}
        onSecondaryButtonClick={onSecondaryRoleDeleteDialogClose}
        onClose={onSecondaryRoleDeleteDialogClose}
      />

      <Toast
        toggle={toggleToast}
        type="Default"
        message="Secondary role deleted"
        mode="Top Right"
        distance="x5l"
        onCloseToast={() => setToggleToast(false)}
        timer={5000}
      />
    </>
  );


}

const PrimaryRoleCardEmptyState = ({
  userRoleLoadingState,
  isPrimaryRoleAdded,
}: {
  userRoleLoadingState: boolean;
  isPrimaryRoleAdded: boolean;
}) => {
  if (userRoleLoadingState) {
    return <Skeleton active paragraph={{ rows: 2, width: '100%' }} />;
  }
  return (
    <div
      className={
        isPrimaryRoleAdded
          ? styles['role-card-label-primary-role-added']
          : styles['role-card-label']
      }
    >
      {isPrimaryRoleAdded
        ? 'No secondary roles added. Click "Add New Role" to begin the process.'
        : 'Please add a primary role to start adding secondary roles.'}
    </div>
  );
};

const SecondaryRoleCardEmptyState = ({
  userRoleLoadingState,
  isPrimaryRoleAdded,
}: {
  userRoleLoadingState: boolean;
  isPrimaryRoleAdded: boolean;
}) => {
  if (userRoleLoadingState) {
    return <Skeleton active paragraph={{ rows: 4, width: '100%' }} />;
  }
  return (
    <div
      className={
        isPrimaryRoleAdded
          ? styles['role-card-label-primary-role-added']
          : styles['role-card-label']
      }
    >
      {isPrimaryRoleAdded
        ? 'No secondary roles added. Click "Add New Role" to begin the process.'
        : 'Please add a primary role to start adding secondary roles.'}
    </div>
  );
};

export default UserProfileSettingsRoleSectionNew;