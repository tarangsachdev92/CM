import { DropDown, Flyout, AnimatedLoaders } from 'konnect-react-components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './DelegationRoleFlyout.module.scss';
import { OptionType, RoleSelectionPopupType } from '../../../types/common';
import DateDropdown from '../../atoms/date-picker/DateDropdown';
import {
    getDelegationDetailsById,
    getRolesByUserForDelegation,
    getToolsByRoleIdForDelegation,
    getUserForDelegation,
} from '../../../services/delegation';
import { DelegationRole, IDelegationUser } from '../../../types/response';
import { getCurrentUserEmail, toLocalMidnight } from '../../../utils/helpers';
import DelegationConfirmationFlyout from './DelegationConfirmationFlyout';
import { Tooltip } from 'antd';

function DelegationRoleFlyout({
    isOpen,
    isEditModeOn,
    onCancelClick,
    selectedRowId,
}: Readonly<RoleSelectionPopupType>) {
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedUserOption, setSelectedUserOption] = useState<{
        label: string;
        value: string;
        desc?: string;
    }>({
        label: '',
        value: '',
        desc: '',
    });
    const [usersDD, setUsersDD] = useState<IDelegationUser[]>([]);
    const [rolesDD, setRolesDD] = useState<any>([]);
    const [toolsDD, setToolsDD] = useState<any>([]);
    const [delegationDetails, setDelegationDetails] = useState<any>(null);
    const [selectedRoleOptions, setSelectedRoleOptions] = useState<
        Array<{
            label: string;
            value: string;
            desc?: string;
        }>
    >([]);
    const [selectedToolOptions, setSelectedToolOptions] = useState<
        Array<{
            label: string;
            value: string;
            //desc?: string;
        }>
    >([]);
    const currentUser = getCurrentUserEmail();

    const userOptions = useMemo(() => {
        const seen = new Set<string>();

        return (
            (usersDD ?? [])
                // keep valid emails and exclude current user
                .filter(u => u?.userEmail && u.userEmail !== currentUser)
                // dedupe by email (case-insensitive, trimmed)
                .filter(u => {
                    const emailKey = String(u.userEmail).trim().toLowerCase();
                    if (seen.has(emailKey)) return false;
                    seen.add(emailKey);
                    return true;
                })

                .map(u => ({
                    label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
                    value: u.userEmail,
                    desc: u.roleType ?? '',
                }))
        );
    }, [usersDD, currentUser]);
    const roleOptions = useMemo(
        () =>
            rolesDD.map((u: any) => ({
                label: `${u.role} - ${u.roleLevelName}`,
                value: String(u.roleId),
                desc: `${u.region} ${u.department} ${u.subFunctionName}`,
            })),
        [rolesDD],
    );

    const roleLookup = useMemo(() => {
        const map = new Map<string, DelegationRole>();
        (rolesDD ?? []).forEach((r: any) => {
            const key = String(r.roleId);
            map.set(key, r as DelegationRole);
        });
        return map;
    }, [rolesDD]);
    const selectedRoleDetails: DelegationRole[] = useMemo(() => {
        return (selectedRoleOptions ?? [])
            .map(r => roleLookup.get(String(r.value)))
            .filter((x): x is DelegationRole => Boolean(x));
    }, [selectedRoleOptions, roleLookup]);

    const toolOptions = useMemo(
        () =>
            toolsDD.map((u: any) => ({
                label: u.toolName,
                value: String(u.toolId),
            })),
        [toolsDD],
    );

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    // after selectedUserOption state, before popupBody
    const isDelegationBlocked = useMemo(() => {
        if (selectedUserOption?.value) {
            if (selectedUserOption.desc === '') {
                return true;
            }
            return false;
        }
        return false;
    }, [selectedUserOption]);
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    // Put this inside the component file (above setAllFieldsForEdit or near other helpers)
    const toRoleOptionFromDetails = (r: any) => {
        // Ensure we have an id to use as value
        const value = r?.roleId != null ? String(r.roleId) : r?.id != null ? String(r.id) : '';
        if (!value) return null;

        // Label: "Role - Level" (fallbacks so it’s never empty)
        const left = String(r?.role ?? r?.roleName ?? '').trim();
        const right = String(r?.roleLevelName ?? '').trim();
        const label = [left, right].filter(Boolean).join(' - ') || value;

        // Desc: "region department subFunctionName" (skip empties)
        const desc = [r?.region, r?.department, r?.subFunctionName]
            .map(x => (x != null ? String(x).trim() : ''))
            .filter(Boolean)
            .join(' ');

        return {
            label,
            value, // dropdown expects string
            desc: desc || undefined,
        } as { label: string; value: string; desc?: string };
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            const usersData = await getUserForDelegation();
            setUsersDD(usersData);
            setLoading(false);
        })();
    }, []);
    useEffect(() => {
        if (selectedRowId !== '0' && selectedRowId !== '') {
            (async () => {
                const response = await getDelegationDetailsById({
                    delegationId: Number(selectedRowId) || 0,
                });
                const obj = typeof response === 'string' ? JSON.parse(response) : response;
                setDelegationDetails(obj);
            })();
        }
    }, [selectedRowId]);
    // 2) Has anything changed? (pure boolean)
    const anythingChanged = useMemo(() => {
        if (!isEditModeOn || !delegationDetails) return true; // in create mode, allow Assign

        // --- tools changed? ---

        const originalToolIds = [
            ...new Set((delegationDetails.tools ?? []).map((t: any) => String(t.toolId))),
        ];
        const currentToolIds = [...new Set((selectedToolOptions ?? []).map(t => String(t.value)))];

        const toolsChanged =
            originalToolIds.length !== currentToolIds.length ||
            originalToolIds.some((id: any) => !currentToolIds.includes(id));

        // --- dates changed? compare by midnight ms to avoid time drift ---
        const originalStartMs = toLocalMidnight(delegationDetails.startDate)?.getTime() ?? null;
        const originalEndMs = toLocalMidnight(delegationDetails.endDate)?.getTime() ?? null;
        const currentStartMs = startDate ? (toLocalMidnight(startDate)?.getTime() ?? null) : null;
        const currentEndMs = endDate ? (toLocalMidnight(endDate)?.getTime() ?? null) : null;

        const datesChanged = originalStartMs !== currentStartMs || originalEndMs !== currentEndMs;

        return toolsChanged || datesChanged;
    }, [isEditModeOn, delegationDetails, selectedToolOptions, startDate, endDate]);
    const setAllFieldsForEdit = async () => {
        if (!isEditModeOn || !delegationDetails || userOptions.length === 0) return;
        const userSelected = userOptions?.filter(
            x => x.value.toLowerCase() == delegationDetails.delegatedToUser.toLowerCase(),
        )[0] ?? { label: '', value: '', desc: '' };
        setSelectedUserOption(userSelected);

        // Guard: roles must be an array
        const rolesFromDetails: any[] = Array.isArray(delegationDetails.roles)
            ? delegationDetails.roles
            : [];

        setRolesDD(rolesFromDetails);

        // Map roles → dropdown option shape
        const preselectedRoles = rolesFromDetails.map(toRoleOptionFromDetails).filter(Boolean) as {
            label: string;
            value: string;
            desc?: string;
        }[];
        setSelectedRoleOptions(preselectedRoles);
        // If you want to immediately load tools for those roles (optional):
        const roleIdsCsv = preselectedRoles.map(r => r.value).join(',');
        if (roleIdsCsv) {
            getToolsByRolesSelected(roleIdsCsv);
        }

        const preStart = toLocalMidnight(delegationDetails.startDate);
        const preEnd = toLocalMidnight(delegationDetails.endDate);

        setStartDate(preStart);
        setEndDate(preEnd);
    };

    useEffect(() => {
        setAllFieldsForEdit();
    }, [userOptions, delegationDetails]);

    useEffect(() => {
        if (startDate && endDate && endDate < startDate) {
            // Clear the invalid end date
            setEndDate(null);
        }
    }, [startDate, endDate]);
    // 1) Newly selected tools (array of string IDs)
    const newlySelectedToolIds = useMemo(() => {
        if (!isEditModeOn || !delegationDetails?.tools) return [];

        const original = (delegationDetails.tools ?? []).map((t: any) => String(t.toolId));
        const current = (selectedToolOptions ?? []).map(t => String(t.value));

        // which ones are in current but not in original?
        return current.filter(id => !original.includes(id));
    }, [isEditModeOn, delegationDetails, selectedToolOptions]);

    const getRolesByUserSelected = async (selectedUser: any) => {
        const roleList = await getRolesByUserForDelegation({
            delegatedByUser: String(currentUser),
            delegatedToUser: selectedUser,
        });
        setRolesDD(roleList);
    };

    const getToolsByRolesSelected = async (selectedRoles: string) => {
        const toolsList = await getToolsByRoleIdForDelegation({ roleId: selectedRoles });
        setToolsDD(toolsList);

        // If we already know what should be preselected (editing)
        if (isEditModeOn && delegationDetails?.tools?.length) {
            const preSelectedTools = delegationDetails.tools; // [{ toolId, ... }]
            const matchedFromApi = toolsList
                .filter((t: any) =>
                    preSelectedTools.some((p: any) => String(p.toolId) === String(t.toolId)),
                )
                .map((t: any) => ({ label: t.toolName, value: String(t.toolId) }));

            setSelectedToolOptions(matchedFromApi);
        }
    };
    const onClose = (isActionTypeClose = true, force = false) => {
        if (force || !isConfirmOpen) {
            if (isActionTypeClose) {
                onCancelClick();
            }
            setSelectedUserOption({
                label: '',
                value: '',
                desc: '',
            });
            setRolesDD([]);
            setToolsDD([]);
            setSelectedRoleOptions([]);
            setSelectedToolOptions([]);
            setStartDate(null);
            setEndDate(null);
        }
    };
    // A readable tooltip that lists all selected roles (one per line)
    const renderSelectedRolesTooltip = useMemo(() => {
        if (!selectedRoleDetails?.length) return 'No roles selected';

        // Build a multi-line JSX tooltip
        return (
            <div style={{ maxWidth: 420, whiteSpace: 'pre-wrap' }}>
                {selectedRoleDetails.map((r, idx) => {
                    const left = `${r.role ?? ''}`.trim();
                    const level = `${r.roleLevelName ?? ''}`.trim();
                    const scope = [r.region, r.department, r.subFunctionName]
                        .map(x => (x ? String(x).trim() : ''))
                        .filter(Boolean)
                        .join(' | ');

                    const line = [[left, level].filter(Boolean).join(' - '), scope]
                        .filter(Boolean)
                        .join(' — ');
                    const withComma = idx !== selectedRoleDetails.length - 1 ? `${line},` : line;

                    return (
                        <div key={idx} style={{ lineHeight: 1.35 }}>
                            {withComma}
                        </div>
                    );
                })}
            </div>
        );
    }, [selectedRoleDetails]);
    const getDisabledStateOfAssignButton = useMemo(() => {
        if (isEditModeOn && !anythingChanged) return true;
        const baseReady =
            !!startDate &&
            !!endDate &&
            (selectedToolOptions?.length ?? 0) > 0 &&
            selectedUserOption?.value !== '';

        if (!baseReady) return true;
        if (isDelegationBlocked) return true;

        return false;
    }, [
        startDate,
        endDate,
        selectedToolOptions,
        selectedUserOption,
        isDelegationBlocked,
        isEditModeOn,
    ]);

    const loaderComponent = useMemo(() => {
        return loading ? (
            <div className={styles['overlay']}>
                <AnimatedLoaders id="lazy-loader" type="page" />
            </div>
        ) : null;
    }, [loading]);

    const popupBody = useCallback(() => {
        return (
            <>
                {loaderComponent}
                <div className={loading ? styles['content-disabled'] : styles.container}>
                    <DropDown
                        dropdown={{
                            caption: isDelegationBlocked
                                ? 'Delegation not possible for selected user as they have not setup any primary role.'
                                : undefined,
                            captionIcon: isDelegationBlocked ? 'info-circle' : undefined,
                            captionMessageType: isDelegationBlocked ? 'default' : undefined,
                            isDisabled: isEditModeOn && selectedUserOption.value !== '',
                            isLabelInline: false,
                            label: 'Delegate to',

                            onChange(obj) {
                                setSelectedUserOption({
                                    label: obj.label,
                                    value: obj.value,
                                    desc: obj.desc,
                                });
                                getRolesByUserSelected(obj.value);
                            },

                            options: userOptions,
                            placeholder: 'Select user',

                            selectedOptions: selectedUserOption
                                ? [
                                      {
                                          label: selectedUserOption.label,
                                          value: String(selectedUserOption.value),
                                          desc: String(selectedUserOption.desc),
                                      },
                                  ]
                                : [],

                            size: 'L',
                            type: 'radio',
                        }}
                        searchInput={
                            Array.isArray(userOptions) && userOptions.length > 10
                                ? {
                                      menuButton: false,
                                      menuButtonText: 'Button',
                                      searchPlaceholder: 'Search',
                                      searchSize: 'L',
                                      searchWholeString: true,
                                  }
                                : undefined
                        }
                    />
                    <div className={styles['space-v-16']} />

                    <Tooltip
                        title={renderSelectedRolesTooltip}
                        placement="right"
                        mouseEnterDelay={0.2}
                        overlayClassName="roles-tooltip"
                    >
                        {/* Disabled elements don't emit hover events, so wrap in a span */}
                        <span style={{ display: 'block' }}>
                            <DropDown
                                className="drop-down"
                                dataTestId="dropd-down"
                                dropdown={{
                                    excludeSelectAllOnFilter: false,
                                    isDisabled: isEditModeOn,
                                    isLabelInline: false,
                                    label: 'Select Role',

                                    onChange: (
                                        _obj: OptionType,
                                        _checked: boolean,
                                        tree: object[],
                                    ) => {
                                        if (isEditModeOn) return;
                                        const selectedTree = (
                                            tree as {
                                                label: string;
                                                value: string;
                                                desc?: string;
                                            }[]
                                        )
                                            // drop the pseudo "All"
                                            .filter(x => String(x.value) !== 'all')
                                            // normalize strings (defensive)
                                            .map(x => ({
                                                label: String(x.label ?? ''),
                                                value: String(x.value ?? ''),
                                                desc: x.desc != null ? String(x.desc) : undefined,
                                            }));

                                        setSelectedRoleOptions(selectedTree);
                                        const allRolesSelected = selectedTree
                                            .map(item => item.value)
                                            .join(',');
                                        getToolsByRolesSelected(allRolesSelected);
                                    },
                                    onScroll: () => {},
                                    options: roleOptions,
                                    placeholder: 'Select ',
                                    required: false,
                                    reset: false,
                                    selectAllOption: {
                                        label: 'All',
                                        value: 'all',
                                    },
                                    selectedOptions:
                                        selectedRoleOptions.length > 0
                                            ? selectedRoleOptions.map(role => ({
                                                  ...role,
                                                  value: String(role.value),
                                                  desc: String(role.desc ?? ''),
                                              }))
                                            : [],
                                    showMoreCount: false,
                                    showSelectAll: !isEditModeOn,
                                    showtooltipcounter: true,
                                    size: 'L',
                                    type: 'checkbox',
                                    showDescription: true,
                                }}
                                dropdownOptionsClassName="dropdown-options-custom"
                                id="drop-down"
                                searchInput={
                                    Array.isArray(roleOptions) && roleOptions.length > 10
                                        ? {
                                              searchCharLimit: 30,
                                              searchPlaceholder: 'Search',
                                              searchSize: 'L',
                                              searchWholeString: true,
                                          }
                                        : undefined
                                }
                            />
                        </span>
                    </Tooltip>
                    <div className={styles['space-v-16']} />
                    <DropDown
                        className="drop-down"
                        dataTestId="dropd-down"
                        dropdown={{
                            excludeSelectAllOnFilter: false,
                            isDisabled: false,
                            isLabelInline: false,
                            label: 'Select Tool',

                            onChange: (_obj: OptionType, _checked: boolean, tree: object[]) => {
                                const selectedTree = (
                                    tree as { label: string; value: string; desc?: string }[]
                                )
                                    // drop the pseudo "All"
                                    .filter(x => String(x.value) !== 'all')
                                    // normalize strings (defensive)
                                    .map(x => ({
                                        label: String(x.label ?? ''),
                                        value: String(x.value ?? ''),
                                    }));

                                setSelectedToolOptions(selectedTree);
                            },
                            onScroll: () => {},
                            options: toolOptions,
                            placeholder: 'Select ',
                            required: false,
                            reset: false,
                            selectAllOption: {
                                label: 'All',
                                value: 'all',
                            },
                            selectedOptions:
                                selectedToolOptions.length > 0
                                    ? selectedToolOptions.map(tool => ({
                                          ...tool,
                                          value: String(tool.value),
                                      }))
                                    : [],
                            showMoreCount: false,
                            showSelectAll: true,
                            showtooltipcounter: true,
                            size: 'L',
                            type: 'checkbox',
                            showDescription: false,
                        }}
                        dropdownOptionsClassName="dropdown-options-custom"
                        id="drop-down"
                        searchInput={
                            Array.isArray(toolOptions) && toolOptions.length > 10
                                ? {
                                      searchCharLimit: 30,
                                      searchPlaceholder: 'Search',
                                      searchSize: 'L',
                                      searchWholeString: true,
                                  }
                                : undefined
                        }
                    />
                    <div className={styles['space-v-16']} />

                    <div className={styles.dateSection}>
                        {/* Start Date */}
                        <div className={styles.field}>
                            <label htmlFor="start-date" className={styles.fieldLabel}>
                                Start date
                            </label>
                            <DateDropdown
                                id="start-date"
                                value={startDate}
                                onChange={(d: Date | null) => setStartDate(d)}
                                //isDateDisabled={isDisabledDate} // keeps your weekend blocking
                                placeholder="Select"
                                aria-label="Start date"
                                isDateDisabled={d => {
                                    const day = d.getDay();
                                    const isWeekend = day === 0 || day === 6;
                                    const todayStart = new Date();
                                    todayStart.setHours(0, 0, 0, 0);
                                    return isWeekend || d < todayStart;
                                }}
                            />
                        </div>
                        <div className={styles['space-v-16']} />
                        {/* End Date */}
                        <div className={styles.field}>
                            <label htmlFor="end-date" className={styles.fieldLabel}>
                                End date
                            </label>
                            <DateDropdown
                                id="end-date"
                                value={endDate}
                                onChange={(d: Date | null) => setEndDate(d)}
                                //isDateDisabled={isDisabledDate}
                                disabled={!startDate}
                                placeholder="Select"
                                aria-label="End date"
                                minDate={startDate || undefined} // optional: prevent end before start (if supported)
                                isDateDisabled={d => {
                                    const day = d.getDay();
                                    const isWeekend = day === 0 || day === 6;
                                    const todayStart = new Date();
                                    todayStart.setHours(0, 0, 0, 0);
                                    return isWeekend || d < todayStart;
                                }}
                            />
                        </div>
                    </div>
                </div>
            </>
        );
    }, [
        loaderComponent,
        userOptions,
        roleOptions,
        toolOptions,
        selectedToolOptions,
        selectedUserOption,
        selectedRoleOptions,
        startDate,
        endDate,
    ]);

    return (
        <div className={styles['outer-container']}>
            <Flyout
                containerMaxWidth="616px"
                heading={'Delegate Role'}
                flyoutOpen={isOpen}
                direction="right"
                subHeading={
                    'You can delegate your role entirely or assign specific application-level roles to the user from this section'
                }
                cancelIconClick={onClose}
                cancelBtnProps={{ text: 'Cancel', onClick: onClose, variant: 'Subtle' }}
                primaryBtnProps={{
                    text: 'Assign',
                    onClick: () => {
                        setIsConfirmOpen(true);
                    },
                    disabled: getDisabledStateOfAssignButton,
                    loading: isConfirmOpen,
                }}
                content={popupBody()}
                id="delegation-selection-flyout"
                iconForCancel={{
                    icon: 'x-close',
                    onClick: () => {
                        onClose();
                    },
                }}
                onBackDropClick={() => onClose()}
            />

            <DelegationConfirmationFlyout
                open={isConfirmOpen}
                isEditModeOn={isEditModeOn || false}
                delegationId={Number(selectedRowId) || 0}
                roleIds={selectedRoleOptions?.map(x => x.value).join(',') ?? ''}
                toolIds={selectedToolOptions?.map(x => x.value).join(',') ?? ''}
                newToolIds={newlySelectedToolIds.join(',') ?? ''}
                selectedRoleDetails={selectedRoleDetails}
                selectedUser={selectedUserOption}
                startDate={startDate}
                endDate={endDate}
                onClose={() => setIsConfirmOpen(false)}
                onCloseAll={() => {
                    setIsConfirmOpen(false);
                    onClose(true, true);
                }}
            />
        </div>
    );
}

export default DelegationRoleFlyout;
