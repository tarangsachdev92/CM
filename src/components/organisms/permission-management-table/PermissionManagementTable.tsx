import { Flex, Tooltip } from 'antd';
import {
    AnimatedLoaders,
    Button,
    CheckBox,
    Counter,
    Icon,
    IconButton,
    SearchInput,
    Table,
    TagSelector,
    Dialog,
    Toast,
} from 'konnect-react-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NoMatchesFound, PermissionDataEmptyState } from '../../../assets/images/images';
import {
    getAppRolePermissionDetails,
    submitApplicationRoleMapping,
} from '../../../services/permission';
import type { AppRole, AppRolePermissionRowData } from '../../../types/response';
import { Label } from '../../atoms';
import CustomSwitch from '../../atoms/custom-switch/CustomSwitch';
import ApplicationFilterPopup from '../application-filter-popup/ApplicationFilterPopup';
import styles from './PermissionManagementTable.module.scss';
import { ExpandArrow } from '../../../assets/icons/icons';
import PermissionManagementApplicationsPermissionsFlyout from '../permission-management-applications-permissions/PermissionManagementApplicationsPermissionsFlyout';
import { TOOL_TYPE_OPTIONS } from '../../../utils/constants';

interface TableRowData {
    isEditMode: boolean;
    roleId: number;
    toolId: number;
    toolName?: string;
    toolType?: string;
    noOfRolesTagged?: number;
    roles: AppRole[];
    expandedRowData?: TableRowData[];
    rowIndex: number;
    // Following are keys of expanded row data
    toolModuleName?: string;
    toolPermissionId?: number;
    toolPermissionName?: string;
    toolPermissionDescription?: string;
}

type ApplicationRoleMappingPayload = {
    roleId: number;
    toolPermissions: {
        toolId: number;
        toolFeatureId: number;
        isActive: number;
    }[];
};

import { AppDispatch, fetchLocationsForChip, RootState } from '../../../store';
import { useDispatch, useSelector } from 'react-redux';
import { logError } from '../../../utils/helpers';

const PermissionManagementTable = () => {
    const dispatch = useDispatch<AppDispatch>();

    const [searchTerm, setSearchTerm] = useState<string>('toolName');
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    const [toggleState, setToggleState] = useState<{ [key: number]: boolean }>({});
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [roles, setRoles] = useState<AppRole[]>([]);
    const [data, setData] = useState<TableRowData[]>([]);
    const [totalRolesInfo, setTotalRolesInfo] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [isRoleNotMapped, setIsRoleNotMapped] = useState<boolean>(false);
    const [isToolNotMapped, setIsToolNotMapped] = useState<boolean>(false);
    const [isRoleToolNotMapped, setIsRoleToolNotMapped] = useState<boolean>(true);
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState<string>('');
    const [showFilterFlyout, setShowFilterFlyout] = useState<boolean>(false);
    const [showApplicationPermissionFlyout, setShowApplicationPermissionFlyout] =
        useState<boolean>(false);
    const [isEditModeOn, setIsEditModeOn] = useState<boolean>(false);
    const [editedApplicationIds, setEditedApplicationIds] = useState(new Set<number>());
    const [editedRoleIds, setEditedRoleIds] = useState(new Set<number>());
    const [showDialogForUnsavedChanges, setShowDialogForUnsavedChanges] = useState<boolean>(false);
    const [toggleToast, setToggleToast] = useState<boolean>(false);
    const roleDetailsForwardRef = useRef({ roleDetails: {} as AppRole });
    const [savingChanges, setSavingChanges] = useState<boolean>(false);
    const [filters, setFilters] = useState<Record<string, { label: string; value: number }[]>>({});
    const tableRef = useRef<any>(null);
    const divRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const permArrowActive = styles['perm-arrow-icon-active'] ?? '';
    const [permissionErrors, setPermissionErrors] = useState<Record<string, string>>({});

    const fetchPermissionDetails = async (
        selectedFilters?: Record<string, { label: string; value: number }[]>,
    ) => {
        setLoading(true);
        try {
            const formattedFilters: Record<string, string | number> = {};

            if (selectedFilters) {
                Object.keys(selectedFilters).forEach(key => {
                    const items = selectedFilters[key];

                    if (items && items.length > 0) {
                        formattedFilters[key] = items.map(item => item.value).join(',');
                    } else if (key === 'toolTypeId') {
                        formattedFilters[key] = 0;
                    } else {
                        formattedFilters[key] = '';
                    }
                });
            }
            const response: AppRolePermissionRowData = await getAppRolePermissionDetails({
                searchKeyword,
                searchColumn: searchKeyword ? searchTerm : '',
                pageNumber,
                pageSize,
                ...formattedFilters,
            });
            if (response) {
                transformApiResponse(response);
            }
            setLoading(false);
        } catch {
            setLoading(false);
        }
    };

    useEffect(() => {
        setRoles([]);
        fetchPermissionDetails(filters);
    }, [pageNumber, pageSize, searchKeyword, searchTerm, filters]);

    useMemo(() => {
        dispatch(fetchLocationsForChip());
    }, []);

    const primaryFunctions = useSelector((state: RootState) => state.roleFunctions);

    const applicationsData = primaryFunctions.toolsData;
    const applicationsFunction = primaryFunctions.data;
    const applicationRolesData = primaryFunctions.rolesData;
    const applicationLocations = primaryFunctions.geographyChipDetails;

    const renderFilterChips = () => {
        return Object.entries(filters).map(([key, values]) => {
            let options: { label: string; value: string }[] = [];
            if (['toolDD', 'rolesToolDD'].includes(key)) {
                options = applicationsData.map(item => ({
                    label: item.toolName ?? 'Unknown',
                    value: item.toolId.toString(),
                }));
            } else if (['toolFunctionDD', 'rolesFunctionDD'].includes(key)) {
                options = applicationsFunction.map(item => ({
                    label: item.functionName ?? 'Unknown',
                    value: item.functionId.toString(),
                }));
            } else if (['toolRolesDD', 'rolesDD'].includes(key)) {
                options = applicationRolesData.map(item => ({
                    label: item.role ?? 'Unknown',
                    value: item.roleId.toString(),
                }));
            } else if (['toolLocationDD', 'rolesLocationDD'].includes(key)) {
                options = applicationLocations.map(item => ({
                    label: item.geography ?? 'Unknown',
                    value: item.geographyId.toString(),
                }));
            } else if (['toolTypeId'].includes(key)) {
                options = TOOL_TYPE_OPTIONS;
            }
            const titleMapping: Record<string, string> = {
                toolDD: 'Applications:',
                toolRolesDD: 'Application Based Roles:',
                toolFunctionDD: 'Application Based Functions:',
                rolesFunctionDD: 'Role Based Functions:',
                rolesDD: 'Roles:',
                rolesToolDD: 'Role Based Applications:',
                toolLocationDD: 'Application Based Geography:',
                rolesLocationDD: 'Role Based Geography:',
                toolTypeId: 'Tool Type:',
            };
            return (
                <TagSelector
                    key={`${key}-${values.length}`}
                    confirmSelection={{
                        onApply: newValues => {
                            if (!Array.isArray(newValues)) return;

                            setFilters(prevFilters => {
                                const updatedFilters = {
                                    ...prevFilters,
                                    [key]: newValues.map(item => ({
                                        label: item.label,
                                        value: Number(item.value),
                                    })),
                                };
                                return updatedFilters;
                            });
                        },
                        onCancel: () => {},
                    }}
                    dataTestId="dropd-down"
                    filterChipProps={{
                        showTooltip: true,
                        title: titleMapping[key] || key,
                        onClose: () => {
                            setFilters(prevFilters => ({
                                ...prevFilters,
                                [key]: [],
                            }));
                        },
                    }}
                    filterChipVariant
                    id="drop-down"
                    onChange={() => {}}
                    options={options}
                    searchInput={{
                        searchPlaceholder: 'Search',
                        searchSize: 'L',
                        searchWholeString: true,
                    }}
                    selectedOptions={(filters[key] ?? []).map(item => ({
                        label: item.label,
                        value: item.value?.toString(),
                    }))}
                    showSelectAll={key !== 'toolTypeId'}
                    size="L"
                    type={'checkbox'}
                    portal={true}
                />
            );
        });
    };

    const renderColumns: any = useMemo(() => {
        const columns = [
            {
                key: 'name',
                dataIndex: 'name',
                subTitle: '',
                width: '360px',
                sticky: 'left',
                onHeaderClick: () => {},
                title: 'Tools & Permissions',
                customExpandableColumn: true,
                render: (_value: string, record: TableRowData, expanded: boolean) => {
                    const EllipsisWithTooltip = ({
                        text,
                        onClick,
                    }: {
                        text: string;
                        onClick: () => void;
                    }) => {
                        const textRef = useRef<HTMLDivElement>(null);
                        const [isOverflowed, setIsOverflowed] = useState(false);
                        useEffect(() => {
                            const el = textRef.current;
                            if (el) {
                                setTimeout(() => {
                                    setIsOverflowed(el.scrollWidth > el.clientWidth);
                                }, 0);
                            }
                        }, [text]);

                        return (
                            <Tooltip
                                title={text}
                                placement="bottom"
                                overlayClassName="custom-tooltip"
                                open={isOverflowed ? undefined : false}
                            >
                                <div
                                    ref={textRef}
                                    className={`${styles.role} ${styles.roleText}`}
                                    onClick={onClick}
                                >
                                    {text}
                                </div>
                            </Tooltip>
                        );
                    };
                    return !expanded ? (
                        <Flex align="center" justify="space-between" flex={1}>
                            <Flex align="center" gap={4}>
                                <div
                                    ref={el => (divRefs.current[record.toolId] = el)}
                                    className={styles['perm-arrow-icon']}
                                    onClick={() => {
                                        if (divRefs.current[record.toolId]) {
                                            divRefs.current[record.toolId]!.classList.toggle(
                                                permArrowActive,
                                            );
                                        }
                                    }}
                                    role="none"
                                >
                                    {ExpandArrow()}
                                </div>

                                <Flex vertical gap={4}>
                                    <Label type="body4">
                                        <span className={styles['description-text']}>
                                            {record.toolType} {record.toolId}
                                        </span>
                                    </Label>
                                    <EllipsisWithTooltip
                                        text={String(record.toolName)}
                                        onClick={() => {}}
                                    />
                                </Flex>
                            </Flex>
                            <CustomSwitch
                                count={record.noOfRolesTagged}
                                isOn={toggleState[record.toolId] ?? false}
                                toggleSwitch={() => handleToggleSwitch(record)}
                                type=""
                            />
                        </Flex>
                    ) : (
                        <Tooltip
                            title={
                                <>
                                    <div className={styles['tooltip-id-text']}>
                                        #{record.toolPermissionId}
                                    </div>
                                    <div className={styles['tooltip-desc-text']}>
                                        {record.toolPermissionDescription}
                                    </div>
                                </>
                            }
                            placement="bottomLeft"
                            overlayClassName="permission-tooltip"
                            getPopupContainer={() => document.body}
                        >
                            <div className={styles['permission-tooltip-wrapper']}>
                                <Label type="body4">
                                    <span className={styles['description-text']}>
                                        {record.toolModuleName}
                                    </span>
                                </Label>
                                <div className={styles['space-v-8']} />
                                <Label type="body3">
                                    <span>{record.toolPermissionName}</span>
                                </Label>
                            </div>
                        </Tooltip>
                    );
                },
            },
        ];

        roles.forEach((role: AppRole) => {
            columns.push({
                key: String(role.roleId),
                title: role.role,
                subTitle: role.roleId + ' | ' + role.roleRegion,
                dataIndex: role.role,
                width: '206px',
                sticky: '',
                onHeaderClick: () => {
                    if (isEditModeOn) {
                        return;
                    }
                    roleDetailsForwardRef.current.roleDetails = role;
                    setShowApplicationPermissionFlyout(true);
                },
                customExpandableColumn: false,
                render: (_value: string, record: TableRowData, expanded: boolean) =>
                    !expanded ? (
                        <div className={styles['role-styles']}>
                            {Number(
                                record.roles.find(r => r.roleId === role.roleId)?.permissionCount,
                            ) > 0 ? (
                                <Counter
                                    value={Number(
                                        record.roles.find((r: any) => r.roleId === role.roleId)
                                            ?.permissionCount,
                                    )
                                        .toString()
                                        .padStart(2, '0')}
                                    size="Small"
                                />
                            ) : (
                                <Icon name="x-close" size="l" color="neutrals-B80" />
                            )}
                        </div>
                    ) : (
                        <div className={styles['role-styles']}>
                            {record.roles.find((r: any) => r.roleId === role.roleId)
                                ?.isActivePermission !== null ? (
                                <CheckBox
                                    onChange={checked =>
                                        onChangeHandlerForPermissionsCheckbox(
                                            checked,
                                            record.rowIndex,
                                            record.toolId,
                                            Number(record.toolPermissionId),
                                            Number(role.roleId),
                                        )
                                    }
                                    disabled={!record.isEditMode}
                                    checked={
                                        record.roles.find((r: any) => r.roleId === role.roleId)
                                            ?.isActivePermission || false
                                    }
                                />
                            ) : (
                                <Icon name="x-close" size="l" color="neutrals-B80" />
                            )}
                        </div>
                    ),
            });
        });

        return columns;
    }, [roles, toggleState, isEditModeOn]);

    const transformApiResponse = useCallback((response: AppRolePermissionRowData) => {
        setRoles(
            response.toolRolePermissionData[0] ? response.toolRolePermissionData[0].roles : [],
        );
        setData(
            response.toolRolePermissionData.map((item, index) => ({
                ...item,
                rowIndex: index,
                isEditMode: false,
                roleId: item.roleId,
                expandedRowData: item.expandedRowData.map(expandedRow => ({
                    ...expandedRow,
                    // The following keys are added to handle edits for individual permission row
                    isEditMode: false,
                    rowIndex: index,
                    toolId: item.toolId,
                    roleId: item.roleId,
                })),
            })),
        );
        setTotalRows(response.pagination.totalRows);
        setIsRoleNotMapped(response.isRoleNotMapped);
        setIsToolNotMapped(response.isToolNotMapped);
        setIsRoleToolNotMapped(response.roleToolNotMapped);
        setTotalRolesInfo('Available roles : ' + response.totalRoles);
    }, []);

    const handlePageChange = (page: number) => {
        handleToggleSwitchOnPageChange();
        setPageNumber(page);
    };

    const handlePageSizeChange = (size: number) => {
        handleToggleSwitchOnPageChange();
        setPageSize(size);
    };

    const handleToggleSwitch = useCallback((row: TableRowData) => {
        setToggleState(prev => {
            const newState = Object.keys(prev).reduce(
                (acc, key) => {
                    acc[Number(key)] = false;
                    return acc;
                },
                {} as { [key: number]: boolean },
            );

            const updatedToggleState = { ...newState, [row.toolId]: !prev[row.toolId] };

            toggleAppRoles(row, updatedToggleState[row.toolId] as boolean);

            return updatedToggleState;
        });
    }, []);

    const toggleAppRoles = useCallback((row: TableRowData, isToggle: boolean) => {
        if (isToggle) {
            const taggedRoles = row.roles.filter(role => role.permissionCount > 0);
            setRoles(taggedRoles);
        } else {
            setRoles(row.roles);
        }
        tableRef.current?.toogleRowExpandCallBack(row.rowIndex);
    }, []);

    useEffect(() => {
        handleToggleSwitchOnPageChange();
        const delayDebounce = setTimeout(() => {
            setSearchKeyword(searchText);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchText]);

    const renderTable = () => {
        return (
            <Table
                columns={renderColumns}
                data={data as any}
                expandableRows={true}
                pagination={{
                    totalItems: totalRows,
                    pageSize,
                    currentPage: pageNumber,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    additionalInfo: totalRolesInfo,
                    blankOut: 10,
                    disabled: isEditModeOn,
                }}
                ref={tableRef}
                className={styles['table-class']}
            />
        );
    };

    const navigateTo = useCallback((module: string) => {
        if (module == 'app') {
            navigate('/admin-hub/tool-management');
        } else {
            navigate('/admin-hub/role-management');
        }
    }, []);

    const noFilteredResponse = useCallback(() => {
        return (
            <Flex
                vertical
                className={styles['perm-empty-state']}
                align="center"
                justify="center"
                gap={16}
            >
                <Flex vertical align="center" justify="center" gap={4}>
                    <PermissionDataEmptyState />
                    <Flex vertical align="center" justify="center" gap={4}>
                        <Label type="body1">
                            <span className={styles['perm-empty-state-title']}>
                                {isRoleToolNotMapped
                                    ? `No Roles or Tools Found`
                                    : isRoleNotMapped
                                      ? `No Roles Found`
                                      : `No Tools Found`}
                            </span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['perm-empty-state-description']}>
                                Try adjusting the filters to view relevant{' '}
                                {isRoleToolNotMapped
                                    ? `roles & tools`
                                    : isRoleNotMapped
                                      ? `roles`
                                      : `tools`}
                            </span>
                        </Label>
                    </Flex>
                </Flex>
            </Flex>
        );
    }, [isToolNotMapped, isRoleNotMapped, isRoleToolNotMapped]);

    const noAppsAdded = useCallback(() => {
        return (
            <Flex
                vertical
                className={styles['perm-empty-state']}
                align="center"
                justify="center"
                gap={16}
            >
                <Flex vertical align="center" justify="center" gap={4}>
                    <PermissionDataEmptyState />
                    <Flex vertical align="center" justify="center" gap={4}>
                        <Label type="body1">
                            <span className={styles['perm-empty-state-title']}>
                                {isRoleToolNotMapped
                                    ? `No Tools or Roles Added`
                                    : isRoleNotMapped
                                      ? `No Roles Added Yet`
                                      : `No Tool Added`}
                            </span>
                        </Label>
                        {isRoleToolNotMapped && (
                            <Label type="body2">
                                <span className={styles['perm-empty-state-description']}>
                                    Go to{' '}
                                    <span
                                        onClick={() => navigateTo('app')}
                                        className={styles['perm-empty-state-link']}
                                    >
                                        Tool Management
                                    </span>{' '}
                                    and{' '}
                                    <span
                                        onClick={() => navigateTo('role')}
                                        className={styles['perm-empty-state-link']}
                                    >
                                        Role Management
                                    </span>{' '}
                                    to begin the process.
                                </span>
                            </Label>
                        )}
                    </Flex>
                </Flex>
            </Flex>
        );
    }, [isToolNotMapped, isRoleNotMapped, isRoleToolNotMapped]);

    const noRecordsFound = useCallback(() => {
        return (
            <Flex
                vertical
                className={styles['perm-empty-state']}
                align="center"
                justify="center"
                gap={16}
            >
                <Flex vertical align="center" justify="center" gap={16}>
                    <NoMatchesFound />
                    <Flex vertical align="center" justify="center" gap={4}>
                        <Label type="body1">
                            <span className={styles['perm-empty-state-title']}>
                                No Matches Found
                            </span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['perm-empty-state-description']}>
                                Sorry, nothing matches your search. Please try using a different
                                term.
                            </span>
                        </Label>
                    </Flex>
                </Flex>
            </Flex>
        );
    }, []);

    const handleToggleSwitchOnPageChange = useCallback(() => {
        setToggleState(prev => {
            const newState = Object.keys(prev).reduce(
                (acc, key) => {
                    acc[Number(key)] = false;
                    return acc;
                },
                {} as { [key: number]: boolean },
            );

            return newState;
        });
    }, []);

    const handleFilterIconClick = () => {
        setShowFilterFlyout(true);
    };

    const onFilterPopupCancelClick = () => {
        setShowFilterFlyout(false);
    };

    const onCancelIconClickOfPermissionManagementFlyout = () => {
        setShowApplicationPermissionFlyout(false);
        fetchPermissionDetails(filters);
    };

    const loaderComponent = useMemo(() => {
        return loading ? (
            <div className={styles['overlay']}>
                <AnimatedLoaders id="lazy-loader" type="page" />
            </div>
        ) : null;
    }, [loading]);

    const renderSubHeader = useCallback(() => {
        const shouldNotDisplay = !searchKeyword && data.length == 0;
        return !shouldNotDisplay ? (
            <Label type="body2">
                <span className={styles['perm-card-description']}>
                    Click on edit to setup permissions for all roles
                </span>
            </Label>
        ) : (
            <></>
        );
    }, [data]);

    const updateEditModeInTableRowRecord = (isEditMode: boolean) => {
        setData(prevValue => {
            prevValue = prevValue.map(row => {
                return {
                    ...row,
                    isEditMode,
                    expandedRowData: row.expandedRowData?.map(expandedRow => ({
                        ...expandedRow,
                        isEditMode,
                    })),
                };
            });
            return prevValue;
        });
        setIsEditModeOn(isEditMode);
    };

    const onClickEditHandler = () => {
        updateEditModeInTableRowRecord(true);

        // By default, expand the first row on click of edit as per figma
        tableRef.current?.toogleRowExpandCallBack(0, true);
    };

    const onClickCancelEditHandler = () => {
        // Check if any unsaved changes are present in the Set. If yes, open dialog.
        if (editedApplicationIds.size) {
            setShowDialogForUnsavedChanges(true);
            setPermissionErrors({});
            return;
        }
        // Else directly turn off the edit mode
        updateEditModeInTableRowRecord(false);

        setPermissionErrors({});

        // Collapse the first row on click of save edit as per figma
        tableRef.current?.toogleRowExpandCallBack(0, false);
    };

    const preparePayloadForSavingChanges = () => {
        const payload: ApplicationRoleMappingPayload[] = [];
        const _editedApplicationIds = [...editedApplicationIds];
        const _editedRoleIds = [...editedRoleIds];

        const editedApps = data.filter(app => _editedApplicationIds.includes(app.toolId ?? 0));

        editedApps.forEach(app => {
            const rolePermissionMap = new Map<number, ApplicationRoleMappingPayload>();

            app.expandedRowData?.length &&
                app.expandedRowData.forEach(permission => {
                    permission.roles.forEach(role => {
                        const roleId = Number(role.roleId);
                        const appId = Number(app.toolId);
                        const appFeatureId = Number(permission.toolPermissionId);
                        const isActive =
                            role.isActivePermission !== null ? Number(role.isActivePermission) : 0;

                        if (!_editedRoleIds.includes(roleId)) {
                            return;
                        }

                        if (!rolePermissionMap.has(roleId)) {
                            rolePermissionMap.set(roleId, {
                                roleId: roleId,
                                toolPermissions: [],
                            });
                        }

                        rolePermissionMap.get(roleId)?.toolPermissions.push({
                            toolId: appId,
                            toolFeatureId: appFeatureId,
                            isActive: isActive,
                        });
                    });
                });

            payload.push(...Array.from(rolePermissionMap.values()));
        });

        const consolidated: any = {};

        // Iterate through each entry in the payload
        payload.forEach(item => {
            // Check if the roleId already exists in the consolidated object
            if (!consolidated[item.roleId]) {
                consolidated[item.roleId] = {
                    roleId: item.roleId,
                    toolPermissions: [],
                };
            }
            // Append the toolPermissions to the existing entry
            consolidated[item.roleId].toolPermissions = consolidated[
                item.roleId
            ].toolPermissions.concat(item.toolPermissions);
        });

        // Convert the consolidated object back into an array
        return Object.values(consolidated) as ApplicationRoleMappingPayload[];
    };

    const onClickSaveEditsHandler = async () => {
        setSavingChanges(true);
        const payload = preparePayloadForSavingChanges();

        try {
            await submitApplicationRoleMapping(payload);
            setToggleToast(true);
            setPermissionErrors({});
            updateEditModeInTableRowRecord(false);
            // Collapse the first row on click of save edit as per figma
            tableRef.current?.toogleRowExpandCallBack(0, false);
        } catch (error) {
            logError(error);
        } finally {
            setSavingChanges(false);
            loadDefaultState();
        }
    };

    const onChangeHandlerForPermissionsCheckbox = (
        checked: boolean,
        _rowIndex: number,
        appId: number,
        appPermissionId: number,
        roleId: number,
    ) => {
        setData(prevData =>
            prevData.map(row => {
                if (row.toolId === appId) {
                    setEditedApplicationIds(prev => prev.add(appId));

                    const updatedExpandedRowData = row.expandedRowData?.map(expandedRow => {
                        if (expandedRow.toolPermissionId === appPermissionId) {
                            return {
                                ...expandedRow,
                                roles: expandedRow.roles.map(role => {
                                    if (role.roleId === roleId) {
                                        setEditedRoleIds(prev => prev.add(roleId));
                                        return { ...role, isActivePermission: checked };
                                    }
                                    return role;
                                }),
                            };
                        }
                        return expandedRow;
                    });

                    // Check if all permissions for this role in this app are now unchecked
                    const allUnchecked =
                        updatedExpandedRowData?.length &&
                        updatedExpandedRowData
                            .flatMap(p => p.roles)
                            .filter(r => r.roleId === roleId)
                            .every(r => !r.isActivePermission);

                    const key = `${appId}-${roleId}`;
                    const roleName =
                        row.roles.find(r => r.roleId === roleId)?.role ?? 'Unknown Role';

                    if (allUnchecked) {
                        setPermissionErrors(prev => ({
                            ...prev,
                            [key]: `No permission selected for tool "${row.toolName}" and role "${roleName}". The tool will be removed from the roles list everywhere if no permission is selected.`,
                        }));
                    } else {
                        setPermissionErrors(prev => {
                            const updated = { ...prev };
                            delete updated[key];
                            return updated;
                        });
                    }

                    return {
                        ...row,
                        expandedRowData: updatedExpandedRowData,
                    };
                }
                return row;
            }),
        );
    };

    const loadDefaultState = () => {
        data.forEach(app => {
            tableRef.current?.toogleRowExpandCallBack(app.rowIndex, false);
        });
        handleToggleSwitchOnPageChange();
        setIsEditModeOn(false);
        setShowDialogForUnsavedChanges(false);
        fetchPermissionDetails(filters);
    };

    const menuButtonProps = useMemo(
        () => ({
            onClick: (column: { value: string }) => setSearchTerm(column.value),
            options: [
                { label: 'Tool', value: 'toolName' },
                { label: 'Role', value: 'roleName' },
            ],
            text: 'Tool',
            optionContainerClass: styles['search-box-container'],
        }),
        [],
    );

    const renderFilterAndSearchSection = useCallback(() => {
        const shouldNotDisplay =
            !searchKeyword &&
            data.length === 0 &&
            !Object.values(filters).some(values => values.length > 0);
        return !shouldNotDisplay ? (
            <Flex align="center" gap={8}>
                <div className={styles['search-box']}>
                    <SearchInput
                        isAnimatedSearch={true}
                        menuButtonProps={menuButtonProps}
                        onChange={(text: string | string[]) => {
                            if (typeof text === 'string') {
                                setPageNumber(1);
                                setSearchText(text);
                            }
                        }}
                        placeholder="Search"
                        menuButton={true}
                        disabled={isEditModeOn}
                    />
                </div>
                <IconButton
                    icon="filter-funnel-01"
                    onClick={() => {
                        handleFilterIconClick();
                    }}
                    size="Medium"
                    disabled={isEditModeOn}
                />
                {isEditModeOn ? (
                    <Flex gap={8} align="center">
                        <Button
                            text="Cancel"
                            variant="Secondary"
                            size="M"
                            onClick={onClickCancelEditHandler}
                        />
                        <Button
                            text="Save"
                            variant="Primary"
                            size="M"
                            onClick={onClickSaveEditsHandler}
                            loading={savingChanges}
                        />
                    </Flex>
                ) : (
                    <Flex align="center">
                        <Button
                            text="Edit"
                            variant="Primary"
                            size="M"
                            onClick={onClickEditHandler}
                            icon="edit-02"
                            disabled={
                                Object.values(filters).some(values => values.length > 0) &&
                                data.length == 0
                            }
                        />
                    </Flex>
                )}
            </Flex>
        ) : null;
    }, [data, isEditModeOn, savingChanges]);

    return (
        <>
            <Flex vertical className={styles['perm-container']} gap={24}>
                <Flex justify="space-between">
                    <Flex vertical gap={8}>
                        <Label type="body1">
                            <span className={styles['perm-card-title']}>Tools Access Settings</span>
                        </Label>
                        {renderSubHeader()}
                    </Flex>
                    {renderFilterAndSearchSection()}
                    {showFilterFlyout && (
                        <ApplicationFilterPopup
                            isOpen={showFilterFlyout}
                            onCancelClick={() => onFilterPopupCancelClick()}
                            setFilters={setFilters}
                            filters={filters}
                        />
                    )}
                </Flex>
                {Object.values(filters).some(values => values.length > 0) && (
                    <div className={styles.container}>
                        <div className={styles.filters}>
                            <Label type="body3">
                                <span className={styles.filterLabel}>Applied Filters :</span>
                            </Label>
                            {renderFilterChips()}
                        </div>
                        <Button
                            onClick={() => {
                                setFilters(prevFilters => {
                                    const updatedFilters: Record<string, any[]> = {};
                                    Object.keys(prevFilters).forEach(key => {
                                        updatedFilters[key] = [];
                                    });
                                    return updatedFilters;
                                });
                            }}
                            text="Reset"
                            variant="Subtle"
                        />
                    </div>
                )}
                {Object.values(permissionErrors).length > 0 && (
                    <div className={styles['error-text-container']}>
                        {Object.values(permissionErrors).map((msg, index) => (
                            <Label key={index} type="body2">
                                <Icon name="info-circle" size="xm" color="status-error-color" />
                                <span className={styles['error-text-color']}> {msg}</span>
                            </Label>
                        ))}
                    </div>
                )}

                <div className={styles['table-container']}>
                    {loaderComponent}
                    <div className={loading ? styles['content-disabled'] : ''}>
                        {data && data.length > 0
                            ? renderTable()
                            : searchKeyword
                              ? !loading && noRecordsFound()
                              : Object.values(filters).some(values => values.length > 0)
                                ? !loading && noFilteredResponse()
                                : !loading && noAppsAdded()}
                    </div>
                </div>
            </Flex>

            {showApplicationPermissionFlyout && (
                <PermissionManagementApplicationsPermissionsFlyout
                    toggleFlyout={true}
                    roleDetails={roleDetailsForwardRef.current.roleDetails}
                    onCancelIconClickOfFlyout={onCancelIconClickOfPermissionManagementFlyout}
                />
            )}

            <Dialog
                isOpen={showDialogForUnsavedChanges}
                title="Unsaved Changes"
                content="Are you sure you want to leave without saving your changes?"
                primaryButtonText="Leave without Saving"
                onPrimaryButtonClick={() => {
                    loadDefaultState();
                }}
                secondaryButtonText="Back to edit"
                onSecondaryButtonClick={() => {
                    setShowDialogForUnsavedChanges(false);
                }}
                onClose={() => {
                    setShowDialogForUnsavedChanges(false);
                }}
            />

            <Toast
                type="Success"
                message={`Permissions updated for ${editedApplicationIds.size} applications`}
                mode="Top Right"
                distance="x5l"
                toggle={toggleToast}
                timer={5000}
                onCloseToast={() => setToggleToast(false)}
            />
        </>
    );
};

export default PermissionManagementTable;
