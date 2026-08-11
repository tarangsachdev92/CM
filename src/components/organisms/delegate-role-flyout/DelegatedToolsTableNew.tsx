import { Flex, Tooltip } from 'antd';
import {
    AnimatedLoaders,
    Button,
    CheckBox,
    Counter,
    Icon,
    // IconButton,
    // SearchInput,
    Table,
    TagSelector,
    Dialog,
    Toast,
} from 'konnect-react-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { NoMatchesFound } from '../../../assets/images/images';

import type { AppRole, AppRolePermissionRowData } from '../../../types/response';
import { Label } from '../../atoms';
import CustomSwitch from '../../atoms/custom-switch/CustomSwitch';

import styles from './DelegatedToolsTable.module.scss';
import { ExpandArrow } from '../../../assets/icons/icons';
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
    adGroup?: string;
    adGroupId?: string;
}

import { AppDispatch, fetchLocationsForChip, RootState } from '../../../store';
import { useDispatch, useSelector } from 'react-redux';
import { getToolRolePermissionDetailsForDelegationNew } from '../../../services/delegationNew';
import { ToolFeature } from '../../../types/request';
import PermissionManagementApplicationsPermissionsFlyoutNew from '../permission-management-applications-permissions/PermissionManagementApplicationsPermissionsFlyoutNew';
interface DelegationToolsTableProps {
    roleIds: string;
    toolIds: string;
    setTotalPermissions: React.Dispatch<React.SetStateAction<number>>;
    onPermissionsSnapshot?: (
        map: Record<
            number,
            {
                [toolId: number]: {
                    toolId: number;
                    features: Record<number, ToolFeature>;
                };
            }
        >,
    ) => void;
}

const DelegatedToolsTableNew = ({
    roleIds,
    toolIds,
    setTotalPermissions,
    onPermissionsSnapshot,
}: Readonly<DelegationToolsTableProps>) => {
    const dispatch = useDispatch<AppDispatch>();

    const [toggleState, setToggleState] = useState<{ [key: number]: boolean }>({});
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [roles, setRoles] = useState<AppRole[]>([]);
    const [data, setData] = useState<TableRowData[]>([]);
    const [totalRolesInfo, setTotalRolesInfo] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [, setIsRoleNotMapped] = useState<boolean>(false);
    const [, setIsToolNotMapped] = useState<boolean>(false);
    const [, setIsRoleToolNotMapped] = useState<boolean>(true);

    const [showApplicationPermissionFlyout, setShowApplicationPermissionFlyout] =
        useState<boolean>(false);
    const [isEditModeOn, setIsEditModeOn] = useState<boolean>(false);
    const [editedApplicationIds, setEditedApplicationIds] = useState(new Set<number>());
    const [, setEditedRoleIds] = useState(new Set<number>());
    const [showDialogForUnsavedChanges, setShowDialogForUnsavedChanges] = useState<boolean>(false);
    const [toggleToast, setToggleToast] = useState<boolean>(false);
    const roleDetailsForwardRef = useRef({ roleDetails: {} as AppRole });

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
            const response: AppRolePermissionRowData =
                await getToolRolePermissionDetailsForDelegationNew({
                    roleId: roleIds,
                    toolID: toolIds,
                    pageSize,
                    pageNumber,
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
        if (roleIds?.length > 0 && toolIds?.length > 0) {
            fetchPermissionDetails(filters);
        }
    }, [pageNumber, pageSize, filters, roleIds, toolIds]);

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
                title: 'Tools & Permissions New',
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
                                    onChange={checked => {
                                        onChangeHandlerForPermissionsCheckbox(
                                            checked,
                                            record.rowIndex,
                                            record.toolId,
                                            Number(record.toolPermissionId),
                                            Number(role.roleId),
                                        );

                                        //     checked,
                                        //     roleId: Number(role.roleId),
                                        //     toolId: record.toolId,
                                        //     toolPermissionId: Number(record.toolPermissionId),
                                        //     toolPermissionName: String(
                                        //         record.toolPermissionName ?? '',
                                        //     ),
                                        //     toolPermissionDescription: String(
                                        //         record.toolPermissionDescription ?? '',
                                        //     ),
                                        //     toolModuleName: String(record.toolModuleName ?? ''),
                                        // });
                                    }}
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

    const transformApiResponse = useCallback(
        (response: AppRolePermissionRowData) => {
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
            setTotalPermissions(response.totalPermissionCount);
        },
        [setTotalPermissions],
    );

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
    }, []);

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
    // helper casters
    const n = (v: any, fb = 0) => (Number.isFinite(Number(v)) ? Number(v) : fb);
    const s = (v: any, fb = '') => v ?? fb;

    // Build role -> tool -> features (only active permissions)
    const buildPermissionsSnapshot = useCallback(() => {
        const map: Record<
            number,
            {
                [toolId: number]: {
                    toolId: number;
                    features: Record<number, ToolFeature>;
                };
            }
        > = {};

        (data ?? []).forEach(row => {
            const toolId = n(row.toolId);
            (row.expandedRowData ?? []).forEach(exp => {
                const featureId = n(exp.toolPermissionId);
                const baseFeature = {
                    toolId,
                    toolFeatureId: featureId,
                    toolFeatureName: s(exp.toolPermissionName),
                    toolFeatureDescription: s(exp.toolPermissionDescription),
                    toolModuleName: s(exp.toolModuleName),
                    isActivePermission: true,
                    accessTypeName: '',
                    adGroup: exp.adGroup,
                    adGroupId: exp.adGroupId,
                };

                // For each role, include only if isActivePermission === true
                (exp.roles ?? []).forEach((r: any) => {
                    if (!r?.roleId) return;
                    if (!r?.isActivePermission) return;

                    const roleId = n(r.roleId);
                    map[roleId] = map[roleId] ?? {};
                    const toolBucket =
                        map[roleId][toolId] ?? (map[roleId][toolId] = { toolId, features: {} });
                    toolBucket.features[featureId] = baseFeature;
                });
            });
        });

        return map;
    }, [data]);
    useEffect(() => {
        if (onPermissionsSnapshot) {
            const snap = buildPermissionsSnapshot();
            onPermissionsSnapshot(snap);
        }
    }, [data]);

    return (
        <>
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
                    {
                        data && data.length > 0 ? renderTable() : noRecordsFound()
                        // : searchKeyword
                        //   ? !loading && noRecordsFound()
                        //   : Object.values(filters).some(values => values.length > 0)
                        //     ? !loading && noFilteredResponse()
                        //     : !loading && noAppsAdded()}
                    }
                </div>
            </div>
            {/* </Flex> */}

            {showApplicationPermissionFlyout && (
                <PermissionManagementApplicationsPermissionsFlyoutNew
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

export default DelegatedToolsTableNew;
