import {
    Status,
    Table,
    AnimatedLoaders,
    SideMenu,
    Dialog,
    Toast,
    Icon,
    Button,
} from 'konnect-react-components';
import { useCallback, useMemo, useState } from 'react';
import styles from './DataTable.module.scss';
import { Flex } from 'antd';
import { NoMatchesFound, RoleManagementEmptyState } from '../../../assets/images/images';
import { Label, EllipsisWithTooltip } from '../../atoms';
import { useLocation, useNavigate } from 'react-router-dom';
import { FilterType } from '../applied-filters/AppliedFilters';
import { useDispatch, useSelector } from 'react-redux';
import {
    AppDispatch,
    deleteRoleFromRoleManagement,
    RootState,
    updateRoleStatus,
} from '../../../store';
import { IColumnFilterData, IRoleData } from '../../../types/response';
import { setIsRestoring } from '../../../store/slice/roleDataSlice';
import { logError } from '../../../utils/helpers';

type RoleData = {
    roleId: number;
    role: string;
    roleAlias: string;
    function: string;
    roleLevel: string;
    region: string;
    market: string;
    site: string;
    cluster: string;
    userCount: number | null;
    isActive: boolean;
    totalRows: number;
    totalPages: number;
    fullRoleName: string;
    responsibilityLevel: string;
    roleName: string;
    subFunction: string | null;
    department: string;
    geographyLevel: string | null;
    numberOfUsers: number;
};

type Props = {
    defaultFilters: any;
    filtersData: any;
    existingFilters: Array<FilterType>;
    setNewFilters: (
        filterName: string,
        filterTitle: string,
        filterArray: Array<{ label: string; value: number }>,
        existingData: Array<FilterType>,
        defaultExistingFilters?: Array<FilterType['selectedFilters']>,
    ) => void;
    roleData: IRoleData[];
    pageSize: number;
    pageNumber: number;
    totalRows: number;
    loading: boolean;
    searchText: string;
    handleSorting: (columnName: string, order: string) => void;
    handlePageChange: (page: number) => void;
    handlePageSizeChange: (size: number) => void;
    refreshData: () => void;
    appliedFilters: Array<IColumnFilterData>;
};

function DataTable({
    defaultFilters,
    filtersData,
    setNewFilters,
    existingFilters,
    roleData,
    pageSize,
    pageNumber,
    totalRows,
    loading,
    searchText,
    handleSorting,
    handlePageChange,
    handlePageSizeChange,
    refreshData,
    appliedFilters,
}: Props) {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isActiveDialogOpen, setIsActiveDialogOpen] = useState(false);
    const [isInactiveDialogOpen, setIsInactiveDialogOpen] = useState(false);
    const [isloading, setIsLoading] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [selectedRoleName, setSelectedRoleName] = useState<string | null>(null);
    const [toastConfig, setToastConfig] = useState<{
        visible: boolean;
        message: string;
        type: 'Delete' | 'Error';
    }>({ visible: false, message: '', type: 'Delete' });
    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

    const handleRowClick = (record: RoleData) => {
        dispatch(setIsRestoring(true));
        navigate(`${record.roleId}/${encodeURIComponent(record.fullRoleName)}`);
    };

    const { sortColumnName, sortDirection } = useSelector((state: RootState) => state.roleData);

    const isColumnSorted = (columnName: string) => {
        return columnName !== sortColumnName ? null : sortDirection === 'asc' ? true : false;
    };

    const handleDeleteRole = (roleId: number) => {
        setIsLoading(true);
        dispatch(deleteRoleFromRoleManagement({ roleId }))
            .unwrap()
            .then(() => {
                setIsDeleteDialogOpen(false);
                setToastConfig({
                    visible: true,
                    message: `${selectedRoleName} role deleted`,
                    type: 'Delete',
                });
                refreshData();
            })
            .catch((error: { message?: string }) => {
                setIsDeleteDialogOpen(false);

                setToastConfig({
                    visible: true,
                    message: error.message ?? 'Failed to delete role',
                    type: 'Error',
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleActiveInactiveRole = (roleId: number, makeActive: boolean) => {
        setIsLoading(true);
        dispatch(updateRoleStatus({ roleId, makeActive }))
            .unwrap()
            .then(() => {
                setIsInactiveDialogOpen(false);
                setIsActiveDialogOpen(false);
                refreshData();
            })
            .catch(() => {
                setIsInactiveDialogOpen(false);
                setIsActiveDialogOpen(false);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleSideMenuOptionSelect = (option: any, roleId: number, role: string) => {
        if (option.value === 'deleteAction') {
            setSelectedRoleId(roleId);
            setSelectedRoleName(role);
            setIsDeleteDialogOpen(true);
        } else if (option.value === 'duplicateAction') {
            if (typeof roleId === 'number') {
                navigate(`${location.pathname}/add-new-role?roleId=${roleId}`);
            } else {
                logError(`Invalid roleId:${roleId}`);
            }
        } else if (option.value === 'inActiveAction') {
            setSelectedRoleId(roleId);
            setSelectedRoleName(role);
            setIsInactiveDialogOpen(true);
        } else if (option.value === 'activeAction') {
            setSelectedRoleId(roleId);
            setSelectedRoleName(role);
            setIsActiveDialogOpen(true);
        }
    };

    const handleConfirmDelete = () => {
        if (selectedRoleId !== null) {
            handleDeleteRole(selectedRoleId);
        }
    };

    const handleConfirmInactive = () => {
        if (selectedRoleId !== null) {
            handleActiveInactiveRole(selectedRoleId, false);
        }
    };

    const handleConfirmActive = () => {
        if (selectedRoleId !== null) {
            handleActiveInactiveRole(selectedRoleId, true);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteDialogOpen(false);
        setSelectedRoleId(null);
    };

    const handleCancelInactive = () => {
        setIsInactiveDialogOpen(false);
        setSelectedRoleId(null);
    };

    const handleCancelActive = () => {
        setIsActiveDialogOpen(false);
        setSelectedRoleId(null);
    };

const tableData = roleData;

    const getExistingFiltersData = (existingFiltersData: any, id: string) => {
        const currentData = existingFiltersData.find((item: any) => item.id === id);
        return currentData?.selectedFilters;
    };

    const getColumns = useCallback(() => {
        return [
            {
                key: 'Role',
                dataIndex: 'fullRoleName',
                title: 'Full Role Name',
                width: '240px',
                fixedWidth: true,
                resizable: true,
                sortable: true,
                sticky: 'left',
                defaultSortIcon: isColumnSorted('Role'),
                hideColumn: visibleColumns.length > 0 ? !visibleColumns.includes('Role') : false,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.role ?? [],
                        selectedOptions: getExistingFiltersData(existingFilters, 'role') ?? [],
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'role',
                                'Role',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('role', 'Role', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => {}, // required (empty)
                        onCancel: () => {},
                    },
                },
                render: (_value: string, record: IRoleData) => {
                    const thirdLine = [record.subFunction, record.department, record.geographyLevel]
                        .filter(Boolean)
                        .join(', ');

                    return (
                        <Flex gap={4} justify="space-between">
                            <Flex vertical gap={2}>
                                {/* Line 1 → Role ID */}
                                <div className={styles['roleId']}>{record.roleId}</div>

                                {/* Line 2 → Role Name */}
                                <EllipsisWithTooltip
                                    text={`${record.fullRoleName}`}
                                    onClick={() => handleRowClick(record)}
                                />

                                {/* Line 3 → Combined */}
                                <div className={styles['roleMeta']}>{thirdLine}</div>
                            </Flex>

                            {/* Side menu (UNCHANGED) */}
                            <Flex
                                align="flex-end center"
                                justify="space-around"
                                onClick={e => e.stopPropagation()}
                            >
                                <SideMenu
                                    action={
                                        <div>
                                            <Icon
                                                color="neutrals-B800"
                                                name="dots-vertical"
                                                size="xm"
                                            />
                                        </div>
                                    }
                                    onOptionSelect={(option: any) => {
                                        handleSideMenuOptionSelect(
                                            option,
                                            record.roleId,
                                            record.roleName,
                                        );
                                    }}
                                    options={
                                        record.status
                                            ? [
                                                  // Options for active records
                                                  {
                                                      label: 'Duplicate',
                                                      value: 'duplicateAction',
                                                  },
                                                  {
                                                      label: 'Set as Inactive',
                                                      value: 'inActiveAction',
                                                  },
                                              ]
                                            : [
                                                  // Options for inactive records
                                                  {
                                                      label: 'Duplicate',
                                                      value: 'duplicateAction',
                                                  },
                                                  {
                                                      label: 'Set as Active',
                                                      value: 'activeAction',
                                                  },
                                              ]
                                    }
                                />
                            </Flex>
                        </Flex>
                    );
                },
            },
            {
                key: 'roleLevel',
                dataIndex: 'responsibilityLevel',
                title: 'Responsibility Level',
                width: '140px',
                resizable: true,
                sortable: true,
                defaultSortIcon: isColumnSorted('roleLevel'),
                hideColumn:
                    visibleColumns.length > 0 ? !visibleColumns.includes('roleLevel') : false,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.roleLevel ?? [],
                        selectedOptions: getExistingFiltersData(existingFilters, 'roleLevel') ?? [],
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'roleLevel',
                                'Role Level',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('roleLevel', 'Role Level', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => {}, // required (empty)
                        onCancel: () => {},
                    },
                },
            },
            {
                key: 'roleName',
                dataIndex: 'roleName',
                title: 'Role Name',
                width: '160px',
                resizable: true,
                sortable: true,
                defaultSortIcon: isColumnSorted('role'),
                hideColumn:
                    visibleColumns.length > 0 ? !visibleColumns.includes('roleName') : false,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.role ?? [],
                        selectedOptions: getExistingFiltersData(existingFilters, 'role') ?? [],
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'role',
                                'role name',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('role', 'Role Name', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => {}, // required (empty)
                        onCancel: () => {},
                    },
                },

                render: (value: string) => <EllipsisWithTooltip text={value} />,
            },
            {
                key: 'subFunction',
                dataIndex: 'subFunction',
                title: 'Sub-Function',
                width: '180px',
                resizable: true,
                sortable: true,
                defaultSortIcon: isColumnSorted('subFunction'),
                hideColumn:
                    visibleColumns.length > 0 ? !visibleColumns.includes('subFunction') : false,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.subFunction ?? [],
                        selectedOptions:
                            getExistingFiltersData(existingFilters, 'subFunction') ?? [],
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'subFunction',
                                'Sub-Function',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('subFunction', 'Sub-Function', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => {}, // required (empty)
                        onCancel: () => {},
                    },
                },
                render: (_: any, record: IRoleData) => {
                    return (
                        <Flex vertical gap={2}>
                            {/* Line 1 → Function */}
                            <div className={styles['primaryText']}>
                                {record.function || 'Function Not Assigned'}
                            </div>

                            {/* Line 2 → SubFunction (grey) */}
                            <div className={styles['secondaryText']}>
                                {record.subFunction || 'Sub-Function Not Assigned'}
                            </div>
                        </Flex>
                    );
                },
            },
            {
                key: 'department',
                dataIndex: 'department',
                title: 'Department',
                width: '140px',
                resizable: true,
                sortable: true,
                defaultSortIcon: isColumnSorted('department'),
                hideColumn:
                    visibleColumns.length > 0 ? !visibleColumns.includes('department') : false,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.department ?? [],
                        selectedOptions:
                            getExistingFiltersData(existingFilters, 'department') ?? [],
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'department',
                                'Department',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('department', 'Department', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,

                    manageColumns: {
                        onSubmit: (selectedList: any) => {
                            // optional: store hidden columns if needed
                            console.log('Manage Columns:', selectedList);
                        },
                        onCancel: () => {},
                    },
                },
                render: (value: string) => <span>{value || 'Not Assigned'}</span>,
            },
            {
                key: 'geographyLevel',
                dataIndex: 'geographyLevel',
                title: 'Geography Level',
                width: '140px',
                resizable: true,
                sortable: true,
                defaultSortIcon: isColumnSorted('geographyLevel'),
                hideColumn:
                    visibleColumns.length > 0 ? !visibleColumns.includes('geographyLevel') : false,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.geographyLevel ?? [],
                        selectedOptions:
                            getExistingFiltersData(existingFilters, 'geographyLevel') ?? [],
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'geographyLevel',
                                'Geography Level',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('geographyLevel', 'Geography Level', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => {}, // required (empty)
                        onCancel: () => {},
                    },
                },
                render: (value: string) => <span>{value || 'Not Assigned'}</span>,
            },
            {
                key: 'numberOfUsers',
                dataIndex: 'numberOfUsers',
                title: 'No. of Users',
                width: '104px',
                resizable: true,
                sortable: true,
                defaultSortIcon: isColumnSorted('userCount'),
                hideColumn:
                    visibleColumns.length > 0 ? !visibleColumns.includes('userCount') : false,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.userCount ?? [],
                        selectedOptions: getExistingFiltersData(existingFilters, 'userCount') ?? [],
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'userCount',
                                'User Count',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('userCount', 'User Count', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => {}, // required (empty)
                        onCancel: () => {},
                    },
                },
            },
            {
                key: 'isActive',
                dataIndex: 'status',
                title: 'Status',
                width: '100px',
                resizable: true,
                sortable: true,
                defaultSortIcon: isColumnSorted('isActive'),
                hideColumn:
                    visibleColumns.length > 0 ? !visibleColumns.includes('isActive') : false,
                sticky: 'right',
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.isactive ?? [],
                        selectedOptions: getExistingFiltersData(existingFilters, 'isactive') ?? [],
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'isactive',
                                'Status',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('isactive', 'Status', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => {}, // required (empty)
                        onCancel: () => {},
                    },
                },
                render: (isActive: boolean) => (
                    <Status
                        size="S"
                        text={isActive ? 'Active' : 'Inactive'}
                        type={isActive ? 'Success' : 'Warning'}
                    />
                ),
            },
        ];
    }, [existingFilters, defaultFilters, filtersData, visibleColumns]);

    const columnsWithClickableRoleName = useCallback(
        () =>
            getColumns().map((column: any) => {
                if (column.key === 'Role') {
                    return {
                        ...column,
                        render: (value: any, record: IRoleData) => (
                            <div
                                onClick={() => handleRowClick(record)}
                                style={{ cursor: 'pointer' }}
                            >
                                {column.render ? column.render(value, record) : value}
                            </div>
                        ),
                    };
                }
                return column;
            }),

        [getColumns, defaultFilters],
    );

    const handlePinnedColumnsCallback = useCallback(() => {}, []);

    const handleManageColumnsCallback = useCallback((managedColumns: any[]) => {
        const visible = managedColumns.map((item: { key: string }) => item.key);
        setVisibleColumns(visible);
    }, []);

    const memoizedColumns = useMemo(() => {
        return columnsWithClickableRoleName();
    }, [columnsWithClickableRoleName]);
    const renderTable = useCallback(() => {
        return (
            <Table
                columns={memoizedColumns}
                data={tableData}
                sort={(type: any, key: any) => {
                    handleSorting(key, type);
                }}
                pinColumnsCallback={handlePinnedColumnsCallback}
                manageColumnsCallback={handleManageColumnsCallback}
                pagination={{
                    totalItems: totalRows,
                    pageSize,
                    currentPage: pageNumber,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    blankOut: 10,
                }}
            />
        );
    }, [
        memoizedColumns,
        tableData,
        totalRows,
        pageNumber,
        pageSize,
        handlePageChange,
        handlePageSizeChange,
        handleSorting,
    ]);
    const noRolesAdded = () => {
        return (
            <Flex
                vertical
                className={styles['rm-empty-state']}
                align="center"
                justify="center"
                gap={16}
            >
                <RoleManagementEmptyState />
                <Flex vertical align="center" gap={8}>
                    <Label type="body1">
                        <span className={styles['rm-empty-state-title']}>No Roles Added Yet</span>
                    </Label>
                    <Label type="body2">
                        <span className={styles['rm-empty-state-description']}>
                            Click on the button below to start adding and managing roles
                        </span>
                    </Label>
                </Flex>
                <Button icon="plus" text="Add New Role" onClick={() => navigate('add-new-role')} />
            </Flex>
        );
    };

    const noRecordsFound = () => {
        return (
            <Flex
                vertical
                className={styles['rm-empty-state']}
                align="center"
                justify="center"
                gap={16}
            >
                <Flex vertical align="center" justify="center" gap={16}>
                    <NoMatchesFound />
                    <Flex vertical align="center" justify="center" gap={4}>
                        <Label type="body1">
                            <span className={styles['rm-empty-state-title']}>No Matches Found</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['rm-empty-state-description']}>
                                Sorry, nothing matches your search. Please try using a different
                                term.
                            </span>
                        </Label>
                    </Flex>
                </Flex>
            </Flex>
        );
    };

    const noRolesFound = () => {
        return (
            <Flex
                vertical
                className={styles['rm-empty-state']}
                align="center"
                justify="center"
                gap={16}
            >
                <Flex vertical align="center" justify="center" gap={16}>
                    <RoleManagementEmptyState />
                    <Flex vertical align="center" justify="center" gap={4}>
                        <Label type="body1">
                            <span className={styles['rm-empty-state-title']}>No Roles Found</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['rm-empty-state-description']}>
                                Try adjusting or clearing your filter to see more roles
                            </span>
                        </Label>
                    </Flex>
                </Flex>
            </Flex>
        );
    };

    return (
        <div className={styles['table-container']}>
            {loading && (
                <div className={styles['overlay']}>
                    <AnimatedLoaders id="lazy-loader" type="page" />
                </div>
            )}
            <div className={loading ? styles['content-disabled'] : ''}>
                {appliedFilters.length > 0 &&
                searchText === '' &&
                (!roleData || roleData.length === 0)
                    ? noRolesFound()
                    : roleData && roleData.length > 0
                      ? renderTable()
                      : searchText
                        ? noRecordsFound()
                        : !loading && noRolesAdded()}
            </div>
            <Dialog
                content={`Are you sure you want to delete the role "${selectedRoleName}"?`}
                isOpen={isDeleteDialogOpen}
                onClose={handleCancelDelete}
                onPrimaryButtonClick={handleConfirmDelete}
                onSecondaryButtonClick={handleCancelDelete}
                primaryButtonText="Delete"
                secondaryButtonText="Don't Delete"
                title="Confirm Deletion"
                iconName="trash-01"
                variant="HeaderTitleIcon"
                color="neutrals-B800"
                loading={isloading}
            />
            <Dialog
                content={`Are you sure you want to change the status to "Inactive". All users assigned to this role will loose access to the same.`}
                isOpen={isInactiveDialogOpen}
                onClose={handleCancelInactive}
                onPrimaryButtonClick={handleConfirmInactive}
                onSecondaryButtonClick={handleCancelInactive}
                primaryButtonText="Set as Inactive"
                secondaryButtonText="Cancel"
                title="Set as Inactive"
                color="neutrals-B800"
                loading={isloading}
            />
            <Dialog
                content={`Are you sure you want to change the status to "Active".`}
                isOpen={isActiveDialogOpen}
                onClose={handleCancelActive}
                onPrimaryButtonClick={handleConfirmActive}
                onSecondaryButtonClick={handleCancelActive}
                primaryButtonText="Set as Active"
                secondaryButtonText="Cancel"
                title="Set as Active"
                color="neutrals-B800"
                loading={isloading}
            />
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
        </div>
    );
}

export default DataTable;
