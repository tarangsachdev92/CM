import { Flex, Tooltip } from 'antd';
import {
    AnimatedLoaders,
    Icon,
    SearchInput,
    SideMenu,
    Status,
    Table,
    Toast,
} from 'konnect-react-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash';
import { AppDispatch, fetchUserData, RootState } from '../../../store';
import { convertOptions, removeElementByKey } from '../../../utils/helpers';
import { EllipsisWithTooltip, Label } from '../../atoms';
import { AppliedFilters } from '../../molecules';
import { FilterType } from '../../molecules/applied-filters/AppliedFilters';
import styles from './UserManagementTable.module.scss';
import { IColumnFilterData, IUserData, IUserFiltersData } from '../../../types/response';
import { useLocation, useNavigate } from 'react-router-dom';
import { IDeleteUser, type IUserRequest } from '../../../types/request';
import { NoMatchesFound } from '../../../assets/images/images';
import { deleteUserFromUserManagement } from '../../../store/thunks/deleteUserFromUserManagement';

function UserManagementTable() {
    const [filters, setFilters] = useState<Array<FilterType>>([]);
    const [defaultFilters, setDefaultFilters] = useState<any>({
        name: [],
        email: [],
        function: [],
        primaryRole: [],
        region: [],
        market: [],
        site: [],
        isactive: [],
        usercount: [],
    });

    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const tableRef = useRef<any>(null);
    const { users: userData, pagination } = useSelector((state: RootState) => state.userData);
    const { columnFilters: filtersData } = useSelector((state: RootState) => state.userData);
    const { columnFilters: existingFilters } = useSelector((state: RootState) => state.userData);
    const totalRows = pagination?.totalRows;
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState<string>('');
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    const [searchColumn, setSearchColumn] = useState<string>('role');
    const [sortColumnName, setSortColumnName] = useState<string>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | 'unsort'>('asc');
    const [appliedFilters, setAppliedFilters] = useState<Array<IColumnFilterData>>([]);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const location = useLocation();
    const [toastConfig, setToastConfig] = useState<{
        visible: boolean;
        message: string;
        type: 'Delete' | 'Error' | 'Success';
    }>({ visible: false, message: '', type: 'Delete' });

    const request: IUserRequest = {
        pageSize: pageSize,
        pageNumber: pageNumber,
        sortColumnName: sortColumnName,
        sortDirection: sortDirection,
        searchKeyword: searchKeyword,
        searchTerm: searchKeyword ? searchColumn : '',
        gridFilters: appliedFilters,
    };

    const handleRowClick = (record: IUserData) => {
        navigate(`${record.userId}/${encodeURIComponent(record.name)}`);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(fetchUserData(request));
        } finally {
            setLoading(false);
        }
    }, [
        dispatch,
        pageNumber,
        totalRows,
        pageSize,
        sortColumnName,
        sortDirection,
        searchKeyword,
        searchColumn,
        appliedFilters,
    ]);

    useEffect(() => {
        setLoading(true);
        fetchData().finally(() => {
            setIsFirstLoad(false); // only reset after first load completes
        });
    }, [fetchData, pageSize]);

    useEffect(() => {
        if (location.state?.showToast) {
            setToastConfig({
                visible: true,
                message: location.state.toastMessage,
                type: location.state.toastType,
            });
        }
    }, [location.state]);

    const handlePageChange = (page: number) => {
        setPageNumber(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
    };

    const handleSorting = async (order: 'asc' | 'desc' | 'unsort', columnName: string) => {
        if (order !== 'unsort') {
            setSortColumnName(columnName);
            setSortDirection(order);
        }
    };

    const updateAppliedFilters = useCallback(() => {
        const appliedFilterArray: IColumnFilterData[] = [];
        filters.map((filter: FilterType) => {
            filter.selectedFilters.map((selectedFilterObj: { label: string; value: string }) => {
                if (
                    selectedFilterObj.label !== 'Active' &&
                    selectedFilterObj.label !== 'InActive'
                ) {
                    const filterObj: IColumnFilterData = {
                        columnName: filter.id,
                        columnValue: selectedFilterObj.label,
                        id: String(selectedFilterObj.value),
                    };
                    appliedFilterArray.push(filterObj);
                } else {
                    const filterObj: IColumnFilterData = {
                        columnName: selectedFilterObj.label,
                        columnValue: selectedFilterObj.value,
                        id: null,
                    };
                    appliedFilterArray.push(filterObj);
                }
            });
        });
        setAppliedFilters([...appliedFilterArray]);
        setPageNumber(1);
    }, [filters]);

    const handleRemoveUserFromRole = (user: IUserData) => {
        const requestPayload: IDeleteUser = {
            primaryRoleId: user.primaryRoleId,
            userEmail: user.email,
        };

        dispatch(deleteUserFromUserManagement(requestPayload))
            .unwrap()
            .then(response => {
                const warningMessage = 'User not found or already inactive.';

                if (response?.data === warningMessage) {
                    setToastConfig({
                        visible: true,
                        message: warningMessage,
                        type: 'Error', // You could also use 'Warning' if supported
                    });
                } else {
                    setToastConfig({
                        visible: true,
                        message: 'User removed from role successfully',
                        type: 'Success',
                    });
                }
            })
            .catch(() => {
                setToastConfig({
                    visible: true,
                    message: 'Failed to remove user from role',
                    type: 'Error',
                });
            });
    };

    useEffect(() => {
        updateAppliedFilters();
    }, [filters]);

    const onResetFilters = useCallback(() => {
        setFilters([]);
        return true;
    }, []);

    const onRemoveFilter = useCallback((filterKey: string, filterArray: Array<FilterType>) => {
        const newFilter = removeElementByKey(filterArray, 'id', filterKey);
        setFilters(newFilter);
    }, []);

    const parseUSDateTime = (val?: string | null): Date | null => {
        if (!val) return null;

        const parts = val.split(' ');
        const mdy = parts[0]; // could be undefined -> guard below
        if (!mdy) return null;

        const [mmStr, ddStr, yyyyStr] = mdy.split('/');
        const mm = Number(mmStr);
        const dd = Number(ddStr);
        const yyyy = Number(yyyyStr);

        if (!mm || !dd || !yyyy) return null;

        // ignore time per requirement
        return new Date(yyyy, mm - 1, dd);
    };

    const formatLastActive = (value?: string | null): string => {
        if (!value) return 'Never';
        const d = parseUSDateTime(value);
        if (!d) return 'Never';

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const onlyDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        const msPerDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.floor((today.getTime() - onlyDate.getTime()) / msPerDay);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';

        return onlyDate.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const renderColumns = useMemo(() => {
        return [
            {
                key: 'name',
                dataIndex: 'name' as keyof IUserData,
                title: 'ID & Name',
                width: '240px',
                fixedWidth: true,
                resizable: true,
                sortable: true,
                sticky: 'left',
                render: (_: any, record: IUserData) => (
                    <Flex gap={4} justify="space-between">
                        <Flex vertical gap={1}>
                            <Label type="body4">
                                <span className={styles['description-text']}> {record.userId}</span>
                            </Label>
                            <Label type="body3">
                                <EllipsisWithTooltip
                                    text={record.name}
                                    onClick={() => {
                                        handleRowClick?.(record);
                                    }}
                                />
                            </Label>
                        </Flex>

                        <div className={styles['action-menu-wrapper']}>
                            <SideMenu
                                action={
                                    <div className={styles['action-icon']}>
                                        <Icon
                                            color="neutrals-B800"
                                            name="dots-vertical"
                                            size="xm"
                                        />
                                    </div>
                                }
                                onOptionSelect={(option: any) => {
                                    if (option.value === 'removeUser') {
                                        handleRemoveUserFromRole(record);
                                    }
                                }}
                                options={[
                                    {
                                        label: 'Remove from Role',
                                        value: 'removeUser',
                                    },
                                ]}
                            />
                        </div>
                    </Flex>
                ),
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.name,
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'name',
                                'Name',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('name', 'Name', [], existingFilters, []);
                        },
                    },
                },
            },
            {
                key: 'email',
                dataIndex: 'email' as keyof IUserData,
                title: 'Email',
                width: '260px',
                sortable: true,
                resizable: true,
                render: (email: string) => (
                    <Tooltip title={email} placement="bottom">
                        <span>{email}</span>
                    </Tooltip>
                ),
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.email,
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'email',
                                'Email',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('email', 'Email', [], existingFilters, []);
                        },
                    },
                },
            },
            {
                key: 'function',
                dataIndex: 'function' as keyof IUserData,
                title: 'Function',
                width: '180px',
                sortable: true,
                resizable: true,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.function,
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'function',
                                'Function',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('function', 'Function', [], existingFilters, []);
                        },
                    },
                },
            },
            {
                key: 'primaryRole',
                dataIndex: 'primaryRole' as keyof IUserData,
                title: 'Primary Role',
                width: '200px',
                sortable: true,
                resizable: true,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.primaryRole,
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'primaryRole',
                                'Primary Role',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('primaryRole', 'Primary Role', [], existingFilters, []);
                        },
                    },
                },
            },
            {
                key: 'region',
                dataIndex: 'region' as keyof IUserData,
                title: 'Region',
                width: '140px',
                sortable: true,
                resizable: true,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.region,
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'region',
                                'Region',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('region', 'Region', [], existingFilters, []);
                        },
                    },
                },
            },
            {
                key: 'market',
                dataIndex: 'market' as keyof IUserData,
                title: 'Market',
                width: '140px',
                sortable: true,
                resizable: true,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.market,
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'market',
                                'Market',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('market', 'Market', [], existingFilters, []);
                        },
                    },
                },
            },
            {
                key: 'site',
                dataIndex: 'site' as keyof IUserData,
                title: 'Site',
                width: '140px',
                sortable: true,
                resizable: true,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.site,
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'site',
                                'Site',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('site', 'Site', [], existingFilters, []);
                        },
                    },
                },
            },
            {
                key: 'lastActive',
                dataIndex: 'lastActive' as keyof IUserData,
                title: 'Last Active',
                width: '160px',
                sortable: true,
                resizable: true,
                render: (lastActive: IUserData['lastActive']) => (
                    <span>{formatLastActive(lastActive)}</span>
                ),
            },
            {
                key: 'isActive',
                dataIndex: 'isActive' as keyof IUserData,
                title: 'Status',
                width: '120px',
                sortable: true,
                resizable: true,
                render: (isActive: boolean) => (
                    <Status
                        size="S"
                        text={isActive ? 'Active' : 'Inactive'}
                        type={isActive ? 'Success' : 'Warning'}
                    />
                ),
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.isActive,
                        onChange: () => {},
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'isActive',
                                'Status',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {},
                        onClear: () => {
                            setNewFilters('isActive', 'Status', [], existingFilters, []);
                        },
                    },
                },
            },
        ];
    }, [defaultFilters, filters]);

    useEffect(() => {
        setPageNumber(1);
        const delayDebounce = setTimeout(() => {
            setSearchKeyword(searchText);
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchText]);

    const setNewFilters = useCallback(
        (
            filterName: string,
            filterTitle: string,
            newFiltersData: any,
            existingFilters: any,
            defaultExistingFilters: any,
        ) => {
            let newFilters = [...existingFilters]; // Avoid mutating original array
            if (newFiltersData.length > 0) {
                const singleFilter: any = {
                    id: filterName,
                    title: filterTitle,
                    selectedFilters: newFiltersData,
                    defaultFilters: defaultExistingFilters[filterName],
                    onClose: onRemoveFilter,
                };
                const index = newFilters.findIndex((obj: any) => obj.id === filterName);
                if (index === -1) {
                    newFilters.push(singleFilter);
                } else {
                    newFilters[index] = singleFilter;
                }
            } else {
                newFilters = newFilters.filter((obj: any) => obj.id !== filterName);
            }
            setFilters([...newFilters]);
        },
        [],
    );

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

    const updatePreviousFilters = useCallback((newFilterData: any) => {
        setFilters((prevFilters: any) => {
            const updatedFilters: any = [];
            if (prevFilters.length > 0) {
                prevFilters.forEach((existFilterData: any) => {
                    const updatedObj = { ...existFilterData };
                    const newSelected = newFilterData[updatedObj.id] || [];
                    updatedObj.selectedFilters =
                        newSelected.length < updatedObj.selectedFilters.length
                            ? newSelected
                            : updatedObj.selectedFilters;
                    updatedFilters.push(updatedObj);
                });
                return _.isEqual(updatedFilters, prevFilters) ? prevFilters : updatedFilters;
            }
            return prevFilters;
        });
    }, []);

    useEffect(() => {
        setPageNumber(1);
        const delayDebounce = setTimeout(() => {
            setSearchKeyword(searchText);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchText]);

    const addDefaultFilters = useCallback((allFiltersData: IUserFiltersData) => {
        if (allFiltersData) {
            const userData = convertOptions(allFiltersData.name, 'columnValue', 'id');
            const functionData = convertOptions(allFiltersData.function, 'columnValue', 'id');
            const roleLevelData = convertOptions(allFiltersData.rolelevel, 'columnValue', 'id');
            const regionData = convertOptions(allFiltersData.region, 'columnValue', 'id');
            const marketData = convertOptions(allFiltersData.market, 'columnValue', 'id');
            const siteData = convertOptions(allFiltersData.site, 'columnValue', 'id');
            const userCountData = convertOptions(
                allFiltersData.usercount,
                'columnValue',
                'columnValue',
            );
            const userStatusData = convertOptions(
                allFiltersData.isactive,
                'columnName',
                'columnValue',
            );
            const finalObj = {
                user: userData,
                function: functionData,
                rolelevel: roleLevelData,
                region: regionData,
                market: marketData,
                site: siteData,
                usercount: userCountData,
                isactive: userStatusData,
            };
            updatePreviousFilters(finalObj);
            setDefaultFilters(finalObj);
        }
    }, []);

    useEffect(() => {
        addDefaultFilters(filtersData);
    }, [filtersData]);

    return (
        <Flex vertical className={styles['rm-container']} gap={24}>
            <Flex justify="space-between">
                <Flex vertical gap={8}>
                    <Label type="body1">
                        <span className={styles['rm-card-title']}>User Access</span>
                    </Label>
                    <Label type="body2">
                        <span className={styles['rm-card-description']}>
                            View a list of all the users who have access to this role
                        </span>
                    </Label>
                </Flex>
                {!(searchText === '' && !userData) && (
                    <div className={styles['search-box']}>
                        <SearchInput
                            isAnimatedSearch={true}
                            menuButtonProps={{
                                onClick: column => {
                                    setSearchColumn(column.value);
                                },
                                options: [
                                    {
                                        label: 'ID & Name',
                                        value: 'role',
                                    },
                                    {
                                        label: 'Email',
                                        value: 'email',
                                    },
                                    {
                                        label: 'Function',
                                        value: 'function',
                                    },
                                    {
                                        label: 'Primary Role',
                                        value: 'primaryrole',
                                    },
                                    {
                                        label: 'Region',
                                        value: 'region',
                                    },
                                    {
                                        label: 'Market',
                                        value: 'market',
                                    },
                                    {
                                        label: 'Site',
                                        value: 'site',
                                    },
                                    {
                                        label: 'Status',
                                        value: 'status',
                                    },
                                ],
                                text: 'User',
                                optionContainerClass: styles['search-box-container'],
                            }}
                            onChange={(text: string | string[]) => {
                                if (typeof text === 'string') {
                                    setSearchText(text);
                                }
                            }}
                            placeholder="Search"
                            menuButton={true}
                        />
                    </div>
                )}
            </Flex>
            {filters.length > 0 && (
                <Flex gap={8}>
                    <AppliedFilters
                        onReset={onResetFilters}
                        filters={filters}
                        setNewFilters={setNewFilters}
                        defaultFilters={defaultFilters}
                        existingFilters={filters}
                    />
                </Flex>
            )}

            <div className={styles['table-container']}>
                <div className={styles['table-inner']}>
                    {loading && isFirstLoad && (
                        <div className={styles['overlay']}>
                            <AnimatedLoaders id="lazy-loader" type="page" />
                        </div>
                    )}
                    <Table
                        columns={renderColumns as any}
                        data={userData}
                        sort={handleSorting}
                        pagination={{
                            totalItems: totalRows,
                            pageSize,
                            currentPage: pageNumber,
                            onPageChange: handlePageChange,
                            onPageSizeChange: handlePageSizeChange,
                            blankOut: 10,
                        }}
                        ref={tableRef}
                        className={styles['table-class']}
                    />
                </div>
                {!loading && searchKeyword && userData?.length === 0 && noRecordsFound()}
            </div>
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
        </Flex>
    );
}

export default UserManagementTable;
