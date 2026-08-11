import { useCallback, useMemo, useState } from 'react';
import { Flex } from 'antd';
import { Table, AnimatedLoaders, Dialog, Icon, Switch } from 'konnect-react-components';
import styles from './ForumDataTable.module.scss';
import { NoMatchesFound, RoleManagementEmptyState } from '../../../assets/images/images';
import { Label } from '../../atoms';
import { FilterType } from '../../molecules/applied-filters/AppliedFilters';
import { IColumnFilterData, IForumData } from '../../../types/response';
import { useDispatch } from 'react-redux';
import { AppDispatch, deleteForum } from '../../../store';
import { getForumById } from '../../../services/application';
import { toggleForumStatus } from '../../../services/issue';
import { logError } from '../../../utils/helpers';

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
    forumData: IForumData[];
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
    onEditForum: (forum: IForumData) => void;
    triggerToast: (message: string, type: 'Success' | 'Delete' | 'Error') => void;
};

function ForumDataTable({
    defaultFilters,
    setNewFilters,
    filtersData,
    existingFilters,
    forumData,
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
    onEditForum,
    triggerToast,
}: Props) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedForumId, setSelectedForumId] = useState<number | null>(null);
    const [selectedForumName, setSelectedForumName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const dispatch = useDispatch<AppDispatch>();
    const tableData = useMemo(() => {
        return (forumData ?? []).map(f => ({
            ...f,
            geography: [f.region, f.cluster, f.market, f.site]
                .filter(v => v && String(v).toLowerCase() !== 'null')
                .join(' - '),
        }));
    }, [forumData]);

    const getExistingFiltersData = useCallback((filters: FilterType[], id: string) => {
        return filters.find(item => item.id === id)?.selectedFilters ?? [];
    }, []);

    const handleToggleForumStatus = async (forumId: number) => {
        if (!forumId) return;
        setIsLoading(true);
        try {
            const response = await toggleForumStatus(forumId);
            if (response.status === 200) {
                triggerToast('Forum status updated successfully', 'Success');
            } else {
                triggerToast('Error updating forum status', 'Error');
            }
        } catch (err) {
            logError(err);
            triggerToast('An unexpected error occurred', 'Error');
        } finally {
            setIsLoading(false);
        }
    };

    const dataIndex = <T extends keyof IForumData>(key: T): T => key;

    const formatFilterOptions = (key: string) => {
        return (defaultFilters[key] ?? []).map((filter: any) => ({
            label: filter.label,
            value: filter.value !== 'null' ? filter.value : filter.label,
        }));
    };

    const getColumns = useCallback(() => {
        const handleEditClick = async (forum: IForumData) => {
            try {
                const data = await getForumById(forum.forumId);
                onEditForum(data);
            } catch (error) {
                logError('Failed to fetch forum details:', error);
            }
        };

        const handleFilterSubmit = (key: string, selectedList: any) => {
            setNewFilters(key, key, selectedList, existingFilters, defaultFilters);
        };

        const handleFilterClear = (key: string) => {
            setNewFilters(key, key, [], existingFilters);
        };

        const createColumn = (key: keyof IForumData, title: string, width = '140px') => ({
            key,
            dataIndex: dataIndex(key),
            title,
            width,
            resizable: true,
            sortable: true,
            columnFilterProps: {
                sortColumnOptions: true,
                filter: {
                    options: formatFilterOptions(key),
                    selectedOptions: getExistingFiltersData(existingFilters, key) ?? [],
                    onChange: () => {},
                    onSubmit: (selectedList: any) =>
                        handleFilterSubmit(key as string, selectedList),
                    onCancel: () => {},
                    onClear: () => handleFilterClear(key as string),
                },
            },
        });

        return [
            createColumn('forumName', 'Forum Name', '240px'),

            ...[
                { key: 'forumLevel', title: 'Level' },
                { key: 'forumPeriod', title: 'Period' },
                { key: 'function', title: 'Function' },
            ].map(({ key, title }) => createColumn(key as keyof IForumData, title)),

            createColumn('geography' as keyof IForumData, 'Geography', '260px'),
            createColumn('forumOwner1', 'Owner'),

            {
                key: 'status',
                dataIndex: dataIndex('status'),
                title: 'Status',
                width: '100px',
                resizable: true,
                sortable: true,
                render: (status: number, record: IForumData) => (
                    <Switch
                        checked={status === 1}
                        onToggle={() => handleToggleForumStatus(record.forumId)}
                    />
                ),
            },
            {
                key: 'actions',
                dataIndex: dataIndex('actions'),
                title: 'Actions',
                width: '100px',
                resizable: true,
                sortable: false,
                sticky: 'right',
                render: (_: any, record: IForumData) => (
                    <Flex gap={12} align="center">
                        <div className={styles.iconCircle} onClick={() => handleEditClick(record)}>
                            <Icon name="edit-01" size="m" color="neutrals-B800" />
                        </div>
                        <div
                            className={styles.iconCircle}
                            onClick={() => {
                                setSelectedForumName(record.forumName);
                                setSelectedForumId(record.forumId);
                                setIsDeleteDialogOpen(true);
                            }}
                        >
                            <Icon name="trash-01" size="m" color="neutrals-B800" />
                        </div>
                    </Flex>
                ),
            },
        ];
    }, [defaultFilters, existingFilters, filtersData]);

    const columnsWithForumName = useCallback(
        () =>
            getColumns().map((column: any) => {
                if (column.key === 'forumName') {
                    return {
                        ...column,
                        // render: (value: any, record: typeof forumData) => (
                        render: (value: any, record: IForumData) => (
                            <div>{column.render ? column.render(value, record) : value}</div>
                        ),
                    };
                }
                return column;
            }),
        [getColumns, defaultFilters],
    );

    const renderTable = useCallback(() => {
        return (
            <Table
                columns={columnsWithForumName()}
                data={tableData}
                className={styles['table-comp']}
                sort={(type: any, key: any) => {
                    handleSorting(key, type);
                }}
                pagination={
                    totalRows > pageSize
                        ? {
                              totalItems: totalRows,
                              pageSize,
                              currentPage: pageNumber,
                              onPageChange: handlePageChange,
                              onPageSizeChange: handlePageSizeChange,
                              blankOut: 10,
                          }
                        : undefined
                }
            />
        );
    }, [
        columnsWithForumName,
        tableData,
        totalRows,
        pageSize,
        pageNumber,
        handlePageChange,
        handlePageSizeChange,
        handleSorting,
        defaultFilters,
    ]);

    const noForumsAdded = () => (
        <Flex
            vertical
            className={styles['rm-empty-state']}
            align="center"
            justify="center"
            gap={16}
        >
            <RoleManagementEmptyState />
            <Label type="body1">
                <span className={styles['rm-empty-state-title']}>No Forums Added Yet</span>
            </Label>
            <Label type="body2">
                <span className={styles['rm-empty-state-description']}>
                    Click on the add button to add a new forum
                </span>
            </Label>
        </Flex>
    );

    const noSearchFound = () => (
        <Flex
            vertical
            className={styles['rm-empty-state']}
            align="center"
            justify="center"
            gap={16}
        >
            <NoMatchesFound />
            <Label type="body1">
                <span className={styles['rm-empty-state-title']}>No Matches Found</span>
            </Label>
            <Label type="body2">
                <span className={styles['rm-empty-state-description']}>
                    Sorry, nothing matches your search. Please try using a different term.
                </span>
            </Label>
        </Flex>
    );

    const noRecordsFound = () => (
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
                        <span className={styles['rm-empty-state-title']}>No Forums Found</span>
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

    const handleConfirmDelete = () => {
        if (selectedForumId !== null) {
            handleDeleteForum(selectedForumId);
        }
    };

    const handleDeleteForum = (forumId: number) => {
        setIsLoading(true);
        dispatch(deleteForum({ forumId }))
            .unwrap()
            .then(() => {
                setIsDeleteDialogOpen(false);
                triggerToast(`Forum "${selectedForumName}" deleted`, 'Delete');

                if (forumData.length === 1 && pageNumber > 1) {
                    handlePageChange(pageNumber - 1);
                } else {
                    refreshData();
                }
            })
            .catch((error: { message?: string }) => {
                setIsDeleteDialogOpen(false);
                triggerToast(error.message ?? 'Failed to delete forum', 'Error');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <div className={styles['table-container']}>
            {(loading || isLoading) && (
                <div className={styles['overlay']}>
                    <AnimatedLoaders id="lazy-loader" type="page" />
                </div>
            )}

            <div className={loading ? styles['content-disabled'] : ''}>
                {appliedFilters.length > 0 &&
                searchText === '' &&
                (!forumData || forumData.length === 0)
                    ? noRecordsFound()
                    : forumData?.length > 0
                      ? renderTable()
                      : searchText
                        ? noSearchFound()
                        : !loading
                          ? noForumsAdded()
                          : null}
            </div>

            <Dialog
                content={`Are you sure you want to delete the forum "${selectedForumName}"?`}
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onPrimaryButtonClick={handleConfirmDelete}
                onSecondaryButtonClick={() => setIsDeleteDialogOpen(false)}
                primaryButtonText="Delete"
                secondaryButtonText="Don't Delete"
                title="Delete Forum"
                color="neutrals-B800"
            />
        </div>
    );
}

export default ForumDataTable;
