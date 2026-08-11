import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { Flex } from 'antd';
import { Button, Dialog, InputField, Table, Icon, DropDown, Toast, ToolTip, AnimatedLoaders } from 'konnect-react-components';
import { useDispatch, useSelector } from 'react-redux';
import { ExpandArrow, ExpandArrowUp } from '../../../assets/icons/icons';
import { Label } from '../../atoms';
import styles from './UserGroupManagementTable.module.scss';
import {
    fetchUserGroupDetails,
    createUserGroup,
    deleteUserGroup,
    fetchUsersForUserGroup,
    fetchUsersAvailableForGroup,
    saveUserInGroup,
    editUserInGroup,
    moveOrRemoveUserFromGroup,
    validateUserEmail,
    validateUserRole
} from '../../../store/thunks/fetchUserGroupDetails';
import type { RootState, AppDispatch } from '../../../store';
import { useDebounce } from '../../../utils/customHooks';

/* ================= TYPES ================= */

interface User {
    username: string;
    useremail: string;
    roleId?: number;
    roleName?: string;
}

interface UserGroupRow {
    key: string;
    name: string;
    users: User[];
}

type Option = { label: string; value: string };

type UserValidateData = {
    isPrimaryUserEmailExist: boolean;
    isUserEmailExist: boolean;
    isRoleExist: boolean;
};

/* ================= COMPONENT ================= */

const UserGroupManagementTable = () => {
    const PREFETCH_GROUP_COUNT = 6;
    const PREFETCH_STAGGER_MS = 100;
    const AUTO_RETRY_DELAY_MS = 300;
    const AUTO_RETRY_LIMIT = 1;

    const dispatch = useDispatch<AppDispatch>();

    /* ---------- REDUX STATE ---------- */
    const { groups, loading } = useSelector((state: RootState) => state.userGroups);

    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
    const [loadingUserGroups, setLoadingUserGroups] = useState<Record<string, boolean>>({});
    const [loadedUserGroups, setLoadedUserGroups] = useState<Record<string, boolean>>({});
    const [failedUserGroups, setFailedUserGroups] = useState<Record<string, boolean>>({});
    const loadingUserGroupsRef = useRef<Record<string, boolean>>({});
    const loadedUserGroupsRef = useRef<Record<string, boolean>>({});
    const failedUserGroupsRef = useRef<Record<string, boolean>>({});
    const retryAttemptsRef = useRef<Record<string, number>>({});
    const retryTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const initialPrefetchDoneRef = useRef(false);
    const prefetchTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const [availableUsers, setAvailableUsers] = useState<
        Array<{ userEmail?: string; UserName?: string; WWID?: number }>
    >([]);

    /* ---------- CREATE / EDIT GROUP ---------- */
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [editingGroup, setEditingGroup] = useState<UserGroupRow | null>(null);
    const [inlineEditingGroupKey, setInlineEditingGroupKey] = useState<string | null>(null);

    /* ---------- ADD USER INLINE ---------- */
    const [addUserGroupKey, setAddUserGroupKey] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<string>();
    const [roleName, setRoleName] = useState('');
    const [roleIsValid, setRoleIsValid] = useState<boolean | null>(null);
    const [userEmail,setUserEmail]=useState('');
    const [emailIsValid, setEmailIsValid] = useState<boolean | null>(null);
    const[userName,setUserName]=useState('User Name');


    /* ---------- EDIT USER ---------- */
    const [editingUser, setEditingUser] = useState<{
        user: User;
        groupKey: string;
    } | null>(null);
    const [editSelectedUser, setEditSelectedUser] = useState<string>();
    const [editRoleName, setEditRoleName] = useState('');

    /* ---------- DELETE GROUP ---------- */
    const [deletingGroup, setDeletingGroup] = useState<UserGroupRow | null>(null);
    const [isMoveUsersOpen, setIsMoveUsersOpen] = useState(false);
    const [targetGroupKey, setTargetGroupKey] = useState<string>();
    const [toastConfig, setToastConfig] = useState<{
        visible: boolean;
        message: string;
        type: 'Delete' | 'Error';
    }>({ visible: false, message: '', type: 'Delete' });

    /* ---------- DELETE USER ---------- */
    const [removingUser, setRemovingUser] = useState<{ user: User; groupKey: string } | null>(null);
    const [isMoveUserOpen, setIsMoveUserOpen] = useState(false);

    /* ================= LOAD DATA ================= */

    useEffect(() => {
        dispatch(fetchUserGroupDetails());
    }, [dispatch]);

    const syncTableRowExpand = useCallback((rowIndex: number, shouldExpand: boolean) => {
        const sync = () => {
            const mainRows = tableContainerRef.current?.querySelectorAll(
                '.table-wrapper .table-container tbody tr.main-row',
            );
            const mainRow = mainRows?.[rowIndex];
            if (!mainRow) return;

            const isTableExpanded =
                mainRow.nextElementSibling?.classList.contains('expanded-row') ?? false;

            if (shouldExpand !== isTableExpanded) {
                const expandCell = mainRow.querySelector('td') as HTMLElement | null;
                expandCell?.click();
            }
        };

        // Double rAF so sync runs after Table re-renders (e.g. when users load into a row).
        requestAnimationFrame(() => requestAnimationFrame(sync));
    }, []);

    const setGroupRowExpanded = useCallback(
        (recordKey: string, rowIndex: number, shouldExpand: boolean) => {
            setExpandedRowKeys((prev: string[]) => {
                const next = shouldExpand
                    ? prev.includes(recordKey)
                        ? prev
                        : [...prev, recordKey]
                    : prev.filter(key => key !== recordKey);
                return next;
            });
            syncTableRowExpand(rowIndex, shouldExpand);
        },
        [syncTableRowExpand],
    );

    const toggleGroupRowExpanded = useCallback(
        (recordKey: string, rowIndex: number) => {
            setExpandedRowKeys((prev: string[]) => {
                const shouldExpand = !prev.includes(recordKey);
                syncTableRowExpand(rowIndex, shouldExpand);
                return shouldExpand
                    ? prev.includes(recordKey)
                        ? prev
                        : [...prev, recordKey]
                    : prev.filter(key => key !== recordKey);
            });
        },
        [syncTableRowExpand],
    );

    const loadUsersForGroup = useCallback(
        async (groupKey: string, force = false) => {
            if (loadingUserGroupsRef.current[groupKey]) {
                return;
            }

            if (!force && loadedUserGroupsRef.current[groupKey]) {
                return;
            }

            loadingUserGroupsRef.current = {
                ...loadingUserGroupsRef.current,
                [groupKey]: true,
            };
            setLoadingUserGroups((prev) => ({ ...prev, [groupKey]: true }));
            setFailedUserGroups((prev) => ({ ...prev, [groupKey]: false }));

            const result = await dispatch(
                fetchUsersForUserGroup({
                    groupId: parseInt(groupKey, 10),
                }),
            );

            loadingUserGroupsRef.current = {
                ...loadingUserGroupsRef.current,
                [groupKey]: false,
            };
            setLoadingUserGroups((prev) => ({ ...prev, [groupKey]: false }));

            if (fetchUsersForUserGroup.fulfilled.match(result)) {
                loadedUserGroupsRef.current = {
                    ...loadedUserGroupsRef.current,
                    [groupKey]: true,
                };
                setLoadedUserGroups((prev) => ({ ...prev, [groupKey]: true }));

                retryAttemptsRef.current = {
                    ...retryAttemptsRef.current,
                    [groupKey]: 0,
                };

                if (retryTimeoutsRef.current[groupKey]) {
                    clearTimeout(retryTimeoutsRef.current[groupKey]);
                    delete retryTimeoutsRef.current[groupKey];
                }

                failedUserGroupsRef.current = {
                    ...failedUserGroupsRef.current,
                    [groupKey]: false,
                };
                setFailedUserGroups((prev) => ({ ...prev, [groupKey]: false }));
            } else {
                loadedUserGroupsRef.current = {
                    ...loadedUserGroupsRef.current,
                    [groupKey]: false,
                };
                setLoadedUserGroups((prev) => ({ ...prev, [groupKey]: false }));

                failedUserGroupsRef.current = {
                    ...failedUserGroupsRef.current,
                    [groupKey]: true,
                };
                setFailedUserGroups((prev) => ({ ...prev, [groupKey]: true }));

                const retryAttempt = retryAttemptsRef.current[groupKey] ?? 0;
                if (retryAttempt < AUTO_RETRY_LIMIT) {
                    retryAttemptsRef.current = {
                        ...retryAttemptsRef.current,
                        [groupKey]: retryAttempt + 1,
                    };

                    if (retryTimeoutsRef.current[groupKey]) {
                        clearTimeout(retryTimeoutsRef.current[groupKey]);
                    }

                    retryTimeoutsRef.current[groupKey] = setTimeout(() => {
                        loadUsersForGroup(groupKey, true);
                    }, AUTO_RETRY_DELAY_MS);
                }
            }
        },
        [AUTO_RETRY_DELAY_MS, AUTO_RETRY_LIMIT, dispatch],
    );

    /* ================= HANDLERS ================= */

    const handleSaveGroup = async () => {
        if (!groupName.trim()) return;

        // CREATE
        if (!editingGroup) {
            const result = await dispatch(
                createUserGroup({ groupId: 0, groupName: groupName.trim() }),
            );
            if (createUserGroup.fulfilled.match(result)) {
                closeGroupDialog();
                dispatch(fetchUserGroupDetails());
            }
            return;
        } else {
            // EDIT (API placeholder)
            const result = await dispatch(
                createUserGroup({
                    groupId: parseInt(editingGroup.key),
                    groupName: groupName.trim(),
                }),
            );
            if (createUserGroup.fulfilled.match(result)) {
                closeGroupDialog();
                dispatch(fetchUserGroupDetails());
            }
            return;
        }
    };

    const closeGroupDialog = () => {
        setIsGroupDialogOpen(false);
        setEditingGroup(null);
        setGroupName('');
    };

    
    const resetAddUserForm = () => {
        setAddUserGroupKey(null);
        setSelectedUser(undefined);
        setRoleName('');
        setUserEmail('');
        setUserName('');
        setEmailIsValid(null)
        setRoleIsValid(null)
    }

    const refreshGroupData = useCallback(
        async (groupKey: string) => {
            await dispatch(fetchUserGroupDetails());
            await loadUsersForGroup(groupKey, true);
        },
        [dispatch, loadUsersForGroup],
    );

    const handleAddUserConfirm = async (groupKey: string) => {
        if (!selectedUser || !roleName.trim()) return;

        const result = await dispatch(
            saveUserInGroup({
                roleName: roleName.trim(),
                userGroupId: parseInt(groupKey),
                userEmail: selectedUser,
            }),
        );

        if (saveUserInGroup.fulfilled.match(result)) {
            resetAddUserForm();
        }

        await refreshGroupData(groupKey);
    };

    const handleAddUserCancel = (groupKey: string) => {
        resetAddUserForm();
        void refreshGroupData(groupKey);
    };


    const showDeleteSuccessToast = (message?: unknown) => {
        setToastConfig({
            visible: true,
            message:
                typeof message === 'string' && message.trim()
                    ? message
                    : 'User group deleted successfully',
            type: 'Delete',
        });
    };

    const handleDeleteGroup = async () => {
        const result = await dispatch(
            deleteUserGroup({ groupId: parseInt(deletingGroup?.key ?? '0'), moveToGroupId: 0 }),
        );
        if (deleteUserGroup.fulfilled.match(result)) {
          showDeleteSuccessToast("User group " + deletingGroup?.name + " deleted successfully");
            dispatch(fetchUserGroupDetails());
        }
        setDeletingGroup(null);
    };

    const handleMoveUsersAndDelete = async () => {
        const result = await dispatch(
            deleteUserGroup({
                groupId: parseInt(deletingGroup?.key ?? '0'),
                moveToGroupId: parseInt(targetGroupKey ?? '0'),
            }),
        );
        if (deleteUserGroup.fulfilled.match(result)) {
            showDeleteSuccessToast(result.payload);
            dispatch(fetchUserGroupDetails());
        }
        setDeletingGroup(null);
        closeMoveUsersDialog();
    };

    /* ================= DATA ================= */

    const tableData: UserGroupRow[] = groups.map((group: any) => ({
        key: String(group.id),
        name: group.usergroupname,
        users: group.users ?? [],
    }));

    const groupIdsKey = useMemo(
        () => tableData.map((g: UserGroupRow) => g.key).sort().join(','),
        [tableData],
    );

    useEffect(() => {
        setExpandedRowKeys([]);
        setLoadedUserGroups({});
        setLoadingUserGroups({});
        setFailedUserGroups({});
        loadedUserGroupsRef.current = {};
        loadingUserGroupsRef.current = {};
        failedUserGroupsRef.current = {};
        retryAttemptsRef.current = {};
        Object.values(retryTimeoutsRef.current).forEach((timerId) => clearTimeout(timerId));
        retryTimeoutsRef.current = {};
        prefetchTimeoutsRef.current.forEach((timerId) => clearTimeout(timerId));
        prefetchTimeoutsRef.current = [];
        initialPrefetchDoneRef.current = false;
    }, [groupIdsKey]);

    useEffect(() => {
        loadedUserGroupsRef.current = loadedUserGroups;
    }, [loadedUserGroups]);

    useEffect(() => {
        loadingUserGroupsRef.current = loadingUserGroups;
    }, [loadingUserGroups]);

    useEffect(() => {
        failedUserGroupsRef.current = failedUserGroups;
    }, [failedUserGroups]);

    useEffect(() => {
        expandedRowKeys.forEach((groupKey: string) => {
            loadUsersForGroup(groupKey);
        });
    }, [expandedRowKeys, loadUsersForGroup]);

    useEffect(() => {
        if (initialPrefetchDoneRef.current || tableData.length === 0) {
            return;
        }

        initialPrefetchDoneRef.current = true;
        // Warm up first few groups so common expands feel faster.
        prefetchTimeoutsRef.current = tableData
            .slice(0, PREFETCH_GROUP_COUNT)
            .map((group: UserGroupRow, index: number) => setTimeout(() => {
                loadUsersForGroup(group.key);
            }, index * PREFETCH_STAGGER_MS));

        return () => {
            prefetchTimeoutsRef.current.forEach((timerId) => clearTimeout(timerId));
            prefetchTimeoutsRef.current = [];
        };
    }, [PREFETCH_GROUP_COUNT, PREFETCH_STAGGER_MS, tableData, loadUsersForGroup]);

    useEffect(() => {
        return () => {
            Object.values(retryTimeoutsRef.current).forEach((timerId) => clearTimeout(timerId));
            retryTimeoutsRef.current = {};
            prefetchTimeoutsRef.current.forEach((timerId) => clearTimeout(timerId));
            prefetchTimeoutsRef.current = [];
        };
    }, []);

    // Re-sync DOM expand state after user data loads without resetting expand keys.
    useEffect(() => {
        expandedRowKeys.forEach((recordKey: string) => {
            const rowIndex = tableData.findIndex(
                (row: UserGroupRow) => String(row.key) === recordKey,
            );
            if (rowIndex >= 0) {
                syncTableRowExpand(rowIndex, true);
            }
        });
    }, [tableData, expandedRowKeys, syncTableRowExpand]);

    const groupOptions: Option[] = useMemo(
        () => tableData.map((g: UserGroupRow) => ({ label: g.name, value: g.key })),
        [tableData],
    );

    const userOptions: Option[] = useMemo(() => {
        return availableUsers
            .filter((u: any) => !!u?.userEmail)
            .map((u: any) => ({
                label: u?.UserName ? `${u.UserName} (${u.userEmail})` : u.userEmail,
                value: u.userEmail as string,
            }));
    }, [availableUsers]);

    const editSelectedUserOption = useMemo(() => {
        if (!editSelectedUser) return [];
        const option = userOptions.find((o: Option) => o.value === editSelectedUser);
        return option ? [option] : [];
    }, [editSelectedUser, userOptions]);

    const selectedTargetGroupOption = useMemo(() => {
        if (!targetGroupKey) return [];
        const option = groupOptions.find((o: Option) => o.value === targetGroupKey);
        return option ? [option] : [];
    }, [targetGroupKey, groupOptions]);

    const openMoveUsersDialog = () => {
        setTargetGroupKey(undefined);
        setIsMoveUsersOpen(true);
    };

    const closeMoveUsersDialog = () => {
        setTargetGroupKey(undefined);
        setIsMoveUsersOpen(false);
    };

    const openMoveUserDialog = () => {
        setTargetGroupKey(undefined);
        setIsMoveUserOpen(true);
    };

    const closeMoveUserDialog = () => {
        setTargetGroupKey(undefined);
        setIsMoveUserOpen(false);
    };

    const cancelEditUser = () => {
        setEditingUser(null);
        setEditSelectedUser(undefined);
        setEditRoleName('');
    };

    const confirmEditUser = () => {
        if (!editingUser || !editSelectedUser || !editRoleName.trim()) return;

        dispatch(
            editUserInGroup({
                oldUserEmail: editingUser.user.useremail,
                newUserEmail: editSelectedUser ?? editingUser.user.useremail,
                userGroupId: parseInt(editingUser.groupKey),
                roleName: editRoleName.trim(),
            }),
        ).then((result: any) => {
            if (editUserInGroup.fulfilled.match(result)) {
                loadUsersForGroup(editingUser.groupKey, true);
                dispatch(fetchUserGroupDetails());
            }
            cancelEditUser();
        });
    };

    const startEditUser = (user: User, groupKey: string) => {
        setInlineEditingGroupKey(null);
        setAddUserGroupKey(null);
        setEditingUser({ user, groupKey });
        setEditSelectedUser(user.useremail);
        setEditRoleName(user.roleName ?? '');
        dispatch(fetchUsersAvailableForGroup()).then((res: any) => {
            if (fetchUsersAvailableForGroup.fulfilled.match(res)) {
                setAvailableUsers(res.payload ?? []);
            }
        });
    };

    const cancelInlineGroupEdit = () => {
        setInlineEditingGroupKey(null);
        setGroupName('');
    };

    const confirmInlineGroupEdit = async (groupKey: string) => {
        if (!groupName.trim()) return;

        const result = await dispatch(
            createUserGroup({
                groupId: parseInt(groupKey),
                groupName: groupName.trim(),
            }),
        );
        if (createUserGroup.fulfilled.match(result)) {
            dispatch(fetchUserGroupDetails());
        }
        cancelInlineGroupEdit();
    };

    const startInlineGroupEdit = (record: UserGroupRow) => {
        setEditingUser(null);
        setAddUserGroupKey(null);
        setInlineEditingGroupKey(record.key);
        setGroupName(record.name);
    };

    const renderIconAction = (
        iconName: ComponentProps<typeof Icon>['name'],
        onClick: () => void,
        ariaLabel: string,
        stopPropagation = false,
        valid :boolean = true
    ) => (
        <span
            role="button"
            tabIndex={0}
            aria-label={ariaLabel}
            className={styles.iconCircle}
            style={{cursor: valid ? "pointer" :"not-allowed"}}
            onClick={(e: React.MouseEvent) => {
                if (!valid) return;
                if (stopPropagation) {
                    e.stopPropagation();
                }
                onClick();
            }}
            onKeyDown={(e: React.KeyboardEvent) => {
                if (!valid) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (stopPropagation) {
                        e.stopPropagation();
                    }
                    onClick();
                }
            }}
        >
            <Icon name={iconName} size="l" color="neutrals-B800" />
        </span>
    );

    const renderSelectGroupDropdown = (id: string, options: Option[]) => (
        <div className={styles.moveUserDialogContent}>
            <DropDown
                className={styles.moveUserDialogDropdown}
                id={id}
                dropdown={{
                    label: 'Select Group',
                    type: 'radio',
                    isDisabled: false,
                    isLabelInline: false,
                    reset: false,
                    required: true,
                    placeholder: 'Select Group',
                    size: 'L',
                    selectedOptions: selectedTargetGroupOption,
                    options,
                    onChange: (option: Option | null) =>
                        setTargetGroupKey(option?.value),
                }}
                searchInput={{
                    searchPlaceholder: 'Search',
                    menuButton: false,
                    menuButtonText: 'Button',
                    searchSize: 'L',
                    searchWholeString: true,
                }}
            />
        </div>
    );

    const tableColumns = useMemo(
        (): Array<{
            key: string;
            dataIndex?: keyof UserGroupRow;
            title: string;
            customExpandableColumn?: boolean;
            width?: string;
            render: (_: unknown, record: UserGroupRow) => React.ReactNode;
        }> => [
            {
                key: 'name',
                dataIndex: 'name',
                title: 'User Group',
                customExpandableColumn: true,
                render: (_: unknown, record: UserGroupRow) => {
                    const recordKey = String(record.key);
                    const rowIndex = tableData.findIndex(
                        (row: UserGroupRow) => String(row.key) === recordKey,
                    );
                    const isRowExpanded = expandedRowKeys.includes(recordKey);
                    const isInlineEditingGroup = inlineEditingGroupKey === recordKey;

                    if (isInlineEditingGroup) {
                        return (
                            <div
                                className={styles.groupNameEditCell}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                                <InputField
                                    label=""
                                    placeholder="Enter group name"
                                    value={groupName}
                                    onChange={(e: any) => setGroupName(e.target.value)}
                                />
                            </div>
                        );
                    }

                    return (
                        <Flex
                            align="center"
                            gap={8}
                            className={styles['expand-trigger']}
                            data-ug-expand-trigger="true"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                const shouldExpand = !expandedRowKeys.includes(recordKey);
                                if (rowIndex >= 0) {
                                    toggleGroupRowExpanded(recordKey, rowIndex);
                                }
                                if (shouldExpand) {
                                    loadUsersForGroup(recordKey);
                                }
                            }}
                        >
                            <span className={styles['perm-arrow-icon']}>
                                {isRowExpanded ? <ExpandArrowUp /> : <ExpandArrow />}
                            </span>
                            <Label type="body3">{record.name}</Label>
                        </Flex>
                    );
                },
            },
            {
                key: 'actions',
                title: 'Actions',
                dataIndex: 'key',
                width: '220px',
                render: (_: unknown, record: UserGroupRow) => {
                    const isInlineEditingGroup = inlineEditingGroupKey === record.key;

                    if (isInlineEditingGroup) {
                        return (
                            <Flex
                                gap={16}
                                justify="center"
                                className={styles.groupRowActions}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                                {renderIconAction(
                                    'check',
                                    () => confirmInlineGroupEdit(record.key),
                                    'Save group',
                                )}
                                {renderIconAction(
                                    'x',
                                    cancelInlineGroupEdit,
                                    'Cancel edit',
                                )}
                            </Flex>
                        );
                    }

                    return (
                        <Flex gap={16} justify="center" className={styles.groupRowActions}>
                            {renderIconAction(
                                'plus',
                                () => {
                                    setInlineEditingGroupKey(null);
                                    const recordKey = String(record.key);
                                    const rowIndex = tableData.findIndex(
                                        (row: UserGroupRow) => String(row.key) === recordKey,
                                    );
                                    if (!expandedRowKeys.includes(recordKey) && rowIndex >= 0) {
                                        setGroupRowExpanded(recordKey, rowIndex, true);
                                    }
                                    loadUsersForGroup(recordKey);
                                    setAddUserGroupKey(record.key);
                                    dispatch(fetchUsersAvailableForGroup()).then((res: any) => {
                                        if (
                                            fetchUsersAvailableForGroup.fulfilled.match(res)
                                        ) {
                                            setAvailableUsers(res.payload ?? []);
                                        }
                                    });
                                },
                                'Add user',
                                true,
                            )}
                            {renderIconAction(
                                'edit-01',
                                () => startInlineGroupEdit(record),
                                'Edit group',
                                true,
                            )}
                            {renderIconAction(
                                'trash-01',
                                () => setDeletingGroup(record),
                                'Delete group',
                                true,
                            )}
                        </Flex>
                    );
                },
            },
        ],
        [
            expandedRowKeys,
            dispatch,
            tableData,
            toggleGroupRowExpanded,
            setGroupRowExpanded,
            inlineEditingGroupKey,
            groupName,
            loadUsersForGroup,
        ],
    );



    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const debouncedEmail = useDebounce(userEmail, 500);

    const validateEmail = async (email: string) => {
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setEmailIsValid(null);
            setUserName("");
            setSelectedUser(undefined);
            return;
        }

        if (!emailRegex.test(trimmedEmail)) {
            setEmailIsValid(false);
            setUserName("");
            setSelectedUser(undefined);
            return;
        }

        const result = await dispatch(
            validateUserEmail({
                emailId: trimmedEmail,
            }),
        );

        if (validateUserEmail.fulfilled.match(result)) {
            setEmailIsValid(true);
            setSelectedUser(trimmedEmail);
            setUserName(result.payload);
        } else {
            setEmailIsValid(false);
            setUserName("");
            setSelectedUser(undefined);
        }
    };
    useEffect(() => {
        validateEmail(debouncedEmail);
    }, [debouncedEmail]);

    const debouncedRoleName = useDebounce(roleName, 500);

    const validateRole = async (role: string) => {
        const trimmedRole = role.trim();

        if (!trimmedRole) {
            setRoleIsValid(null);
            return;
        }

        const result = await dispatch(
            validateUserRole({
                roleName: trimmedRole,
                userEmail: userEmail,
            }),
        );

        if (validateUserRole.fulfilled.match(result)) {
            const data: UserValidateData = result.payload as UserValidateData 

            if (data.isPrimaryUserEmailExist) {
                setRoleIsValid(false);

                setToastConfig({
                    visible: true,
                    message:
                        "Entered user already has a Primary Role in Command Center.",
                    type: "Error",
                });

                return;
            }

            if (data.isUserEmailExist) {
                setRoleIsValid(false);

                setToastConfig({
                    visible: true,
                    message:
                        "Entered user already belongs to a User Group.",
                    type: "Error",
                });

                return;
            }

            if (data.isRoleExist) {
                setRoleIsValid(false);

                setToastConfig({
                    visible: true,
                    message:
                        "Entered Role already exists in Command Center.",
                    type: "Error",
                });

                return;
            }

            setToastConfig(prev => ({
                ...prev,
                visible: false,
            }));

            setRoleIsValid(true);
        }
    };
    useEffect(() => {
        // Re-validate role checks whenever either role or user email changes.
        validateRole(debouncedRoleName);
    }, [debouncedRoleName, debouncedEmail]);

    const renderExpandedGroupRowContent = (record: UserGroupRow) => {
        const showErrorState =
            failedUserGroups[record.key] &&
            record.users.length === 0;
        const showLoadingState =
            loadingUserGroups[record.key] ||
            (!loadedUserGroups[record.key] && !showErrorState && record.users.length === 0);

        return (
            <div
                className={[
                    styles.expandedTable,
                    editingUser?.groupKey === record.key
                        ? styles.expandedTableOverflowVisible
                        : '',
                ].join(' ')}
            >
                {/* EMPTY STATE (NO USERS) */}
                {showLoadingState ? (
                    <div className={styles.emptyStateCentered}>
                        <AnimatedLoaders
                            id={`user-group-inline-loader-${record.key}`}
                            type="page"
                        />
                    </div>
                ) : showErrorState ? (
                    <div className={styles.emptyStateCentered}>
                        <span className={styles.emptyStateTitle}>Unable to load users</span>
                        <span className={styles.emptyStateDescription}>
                            Please retry loading users for this group.
                        </span>
                        <button
                            type="button"
                            className={styles.retryButton}
                            onClick={() => loadUsersForGroup(record.key, true)}
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    record.users.length === 0 &&
                    loadedUserGroups[record.key] &&
                    addUserGroupKey !== record.key && (
                        <div className={styles.emptyStateCentered}>
                            <span className={styles.emptyStateTitle}>No users added yet</span>
                            <span className={styles.emptyStateDescription}>
                                Click on &apos;+&apos; icon to start adding
                            </span>
                        </div>
                    )
                )}

                {/* INLINE ADD USER */}
                {addUserGroupKey === record.key && (
                    <div className={styles.inlineAddRow}>
                        <div className={styles.inlineAddInputs}>
                            <div>
                                <ToolTip direction='Left-Center' text= {userName} visible={emailIsValid ? true : false} type='Text Only' wrapperComponent >
                                <InputField
                                    label=""
                                    placeholder="Enter User Email"
                                    value={userEmail}
                                    className='error-state'
                                    rightIcon={emailIsValid !== null && emailIsValid ? "check-tick" : "x"}
                                    rightIconColor={emailIsValid !== null && emailIsValid ? "status-success-color" : "status-error-color"}
                                    onChange={(e) =>
                                        setUserEmail(e.target.value)
                                    }
                                />
                                </ToolTip>
                            </div>
                            <InputField
                                label=""
                                placeholder="Enter Role Name"
                                value={roleName}
                                className='error-state'
                                rightIcon={roleIsValid !== null && roleIsValid ? "check-tick" : "x"}
                                rightIconColor={roleIsValid !== null && roleIsValid ? "status-success-color" : "status-error-color"}
                                onChange={(e) =>
                                    setRoleName(e.target.value)
                                }
                            />
                        </div>

                        <div className={styles.inlineAddActions}>
                            {renderIconAction(
                                'check',
                                () => handleAddUserConfirm(record.key),
                                'Save user',
                                false, (emailIsValid && roleIsValid) as boolean
                            )}
                            {renderIconAction(
                                'x',
                                () => handleAddUserCancel(record.key),
                                'Cancel add user',
                            )}
                        </div>
                    </div>
                )}

                {/* USERS LIST */}
                {record.users.map((user: User) => (
                    <div
                        key={user.useremail}
                        className={styles.expandedTableRow}
                    >
                        {editingUser?.groupKey === record.key &&
                        editingUser?.user.useremail === user.useremail ? (
                            <>
                                <div
                                    className={[
                                        styles.expandedCell,
                                        styles.expandedCellEdit,
                                    ].join(' ')}
                                >
                                    <DropDown
                                        id={`edit-user-dropdown-${record.key}-${user.useremail}`}
                                        dropdown={{
                                            label: '',
                                            type: 'radio',
                                            isDisabled: false,
                                            isLabelInline: false,
                                            reset: false,
                                            required: false,
                                            placeholder: 'Enter User Email',
                                            size: 'L',
                                            selectedOptions:
                                                editSelectedUserOption,
                                            options: userOptions,
                                            onChange: (option: Option | null) =>
                                                setEditSelectedUser(
                                                    option?.value,
                                                ),
                                        }}
                                        searchInput={{
                                            searchPlaceholder: 'Search',
                                            menuButton: false,
                                            menuButtonText: 'Button',
                                            searchSize: 'L',
                                            searchWholeString: true,
                                        }}
                                    />
                                </div>

                                <div
                                    className={[
                                        styles.expandedCell,
                                        styles.expandedCellEdit,
                                    ].join(' ')}
                                >
                                    <InputField
                                        label=""
                                        placeholder="Enter Role Name"
                                        value={editRoleName}
                                        onChange={(e: any) =>
                                            setEditRoleName(e.target.value)
                                        }
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.expandedCell}>
                                    <span className={styles.userPrimaryText}>
                                        {user.username || user.useremail}
                                    </span>
                                    <span className={styles.userSecondaryText}>
                                        {user.useremail}
                                    </span>
                                </div>

                                <div className={styles.expandedCell}>
                                    {user.roleId != null && (
                                        <span className={styles.userSecondaryText}>
                                            {String(user.roleId)}
                                        </span>
                                    )}
                                    <span className={styles.userPrimaryText}>
                                        {user.roleName ?? ''}
                                    </span>
                                </div>
                            </>
                        )}

                        <div className={styles.actionCell}>
                            <div className={styles.actionCellIcons}>
                                {editingUser?.groupKey === record.key &&
                                editingUser?.user.useremail ===
                                    user.useremail ? (
                                    <>
                                        {renderIconAction(
                                            'check',
                                            confirmEditUser,
                                            'Save user',
                                        )}
                                        {renderIconAction(
                                            'x',
                                            cancelEditUser,
                                            'Cancel edit',
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {renderIconAction(
                                            'edit-01',
                                            () =>
                                                startEditUser(
                                                    user,
                                                    record.key,
                                                ),
                                            'Edit user',
                                        )}
                                        {renderIconAction(
                                            'trash-01',
                                            () =>
                                                setRemovingUser({
                                                    user,
                                                    groupKey: record.key,
                                                }),
                                            'Remove user',
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };


    /* ================= RENDER ================= */

    return (
        <>
            {/* ================= HEADER ================= */}
            <Flex vertical className={styles['rm-container']} gap={24}>
                <Flex justify="space-between" align="center">
                    <Flex vertical gap={8}>
                        <Label type="body1">
                            <span className={styles['rm-card-title']}>User Groups</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['rm-card-description']}>
                                User groups will be pre‑authorised and will have access to all attributes and values of command
                                center.
                            </span>
                        </Label>
                    </Flex>

                    <Button
                        text="Create User Group"
                        variant="Primary"
                        size="M"
                        onClick={() => {
                            setEditingGroup(null);
                            setInlineEditingGroupKey(null);
                            setGroupName('');
                            setIsGroupDialogOpen(true);
                        }}
                    />
                </Flex>

                {/* ================= TABLE ================= */}
                {loading ? (
                    <Flex justify="center" style={{ minHeight: 200 }}>
                        <Label type="body3">Loading…</Label>
                    </Flex>
                ) : tableData.length > 0? ( 
                    <div ref={tableContainerRef} className={styles.tableContainer}>
                    <Table<UserGroupRow>
                        className={styles.userGroupTable}
                        data={tableData}
                        columns={tableColumns}
                        expandResetOnDataChange={false}
                        expandable={{
                            rowExpandable: () => true,
                            expandedRowRender: renderExpandedGroupRowContent,
                        } as any}
                    />
                    </div>
                ) : ""}
            </Flex>

            {/* ================= CREATE / EDIT GROUP ================= */}
            {isGroupDialogOpen && (
                <Dialog
                    title={editingGroup ? 'Edit User Group' : 'Create User Group'}
                    isOpen
                    primaryButtonText="Save Group"
                    secondaryButtonText="Cancel"
                    isPrimaryDisabled={
                        editingGroup ? groupName === editingGroup.name : !groupName.trim()
                    }
                    onPrimaryButtonClick={handleSaveGroup}
                    onSecondaryButtonClick={closeGroupDialog}
                    onClose={closeGroupDialog}
                    content={
                        <InputField
                            label="Group Name"
                            value={groupName}
                            placeholder="Enter Name"
                            required
                            onChange={(e: any) => setGroupName(e.target.value)}
                        />
                    }
                />
            )}

            {/* ================= DELETE GROUP ================= */}
            {deletingGroup && (
                <Dialog
                    className={styles.moveGroupDialog}
                    title="Delete User Group"
                    isOpen
                    primaryButtonText="Delete"
                    secondaryButtonText="Move Users to Another Group"
                    onPrimaryButtonClick={handleDeleteGroup}
                    onSecondaryButtonClick={openMoveUsersDialog}
                    onClose={() => setDeletingGroup(null)}
                    content="Are you sure you want to delete this group? All users in the group will loose access to command center unless added to another user group"                />
            )}

            {/* ================= MOVE USERS ================= */}
            {isMoveUsersOpen && (
                <Dialog
                    className={styles.moveGroupDialog}
                    title="Move to Another Group"
                    isOpen
                    primaryButtonText="Move Users & Delete Group"
                    secondaryButtonText="Go Back"
                    isPrimaryDisabled={!targetGroupKey}
                    onPrimaryButtonClick={handleMoveUsersAndDelete}
                    onSecondaryButtonClick={closeMoveUsersDialog}
                    onClose={closeMoveUsersDialog}
                    content={renderSelectGroupDropdown(
                        'move-users-target-group',
                        groupOptions.filter(
                            (g: Option) => g.value !== deletingGroup?.key,
                        ),
                    )}
                />
            )}

            {/* ================= REMOVE USER ================= */}
            {removingUser && (
                <Dialog
                    className={styles.moveGroupDialog}
                    title="Remove User"
                    isOpen
                    primaryButtonText="Remove User"
                    secondaryButtonText="Move to Another Group"
                    onPrimaryButtonClick={() => {
                        dispatch(
                            moveOrRemoveUserFromGroup({
                                oldGroupId: parseInt(removingUser.groupKey),
                                userEmail: removingUser.user.useremail,
                            }),
                        ).then((result: any) => {
                            if (moveOrRemoveUserFromGroup.fulfilled.match(result)) {
                                loadUsersForGroup(removingUser.groupKey, true);
                                dispatch(fetchUserGroupDetails());
                            }
                            setRemovingUser(null);
                        });
                    }}
                    onSecondaryButtonClick={openMoveUserDialog}
                    onClose={() => setRemovingUser(null)}
                    content="Are you sure you want to remove this user from the user group? They will lose access unless added to another group."
                />
            )}

            {/* ================= MOVE USER ================= */}
            {isMoveUserOpen && removingUser && (
                <Dialog
                    className={styles.moveGroupDialog}
                    title="Move to Another Group"
                    isOpen
                    primaryButtonText="Move User"
                    secondaryButtonText="Go Back"
                    isPrimaryDisabled={!targetGroupKey}
                    onPrimaryButtonClick={() => {
                        if (!targetGroupKey) return;
                        dispatch(
                            moveOrRemoveUserFromGroup({
                                oldGroupId: parseInt(removingUser.groupKey),
                                newGroupId: parseInt(targetGroupKey),
                                userEmail: removingUser.user.useremail,
                            }),
                        ).then((result: any) => {
                            if (moveOrRemoveUserFromGroup.fulfilled.match(result)) {
                                loadUsersForGroup(removingUser.groupKey, true);
                                loadUsersForGroup(targetGroupKey, true);
                                dispatch(fetchUserGroupDetails());
                            }
                            setTargetGroupKey(undefined);
                            setIsMoveUserOpen(false);
                            setRemovingUser(null);
                        });
                    }}
                    onSecondaryButtonClick={closeMoveUserDialog}
                    onClose={closeMoveUserDialog}
                    content={renderSelectGroupDropdown(
                        'move-user-target-group',
                        groupOptions.filter(
                            (g: Option) => g.value !== removingUser.groupKey,
                        ),
                    )}
                />
            )}

            {toastConfig.visible && (
                <Toast
                    distance="x5l"
                    className="toast-configuration"
                    message={toastConfig.message}
                    mode="Top Right"
                    onCloseToast={() =>
                        setToastConfig({ ...toastConfig, visible: false })
                    }
                    toggle
                    type={toastConfig.type}
                   timer={15000}
                />
            )}
        </>
    );
};

export default UserGroupManagementTable;
