import { useCallback, useMemo, useState } from 'react';
import { Flex } from 'antd';
import { Table, AnimatedLoaders, Dialog, Icon, SideMenu, Status, Button } from 'konnect-react-components';
import styles from './ForumManagementTable.module.scss';
import { NoMatchesFound, RoleManagementEmptyState } from '../../../assets/images/images';
import { Label } from '../../atoms';
import { FilterType } from '../../molecules/applied-filters/AppliedFilters';
import { IColumnFilterData, IForumData } from '../../../types/response';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../store';
import { deleteForums, inactivateForum } from '../../../store';
import { useNavigate } from 'react-router-dom';

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

function ForumManagementTable({
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
  
}: Props) {
  const navigate = useNavigate();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedForumId, setSelectedForumId] = useState<number | null>(null);
    const [, setSelectedForumName] = useState<string | null>(null);
    const [isLoading, ] = useState(false);
const [isInactiveDialogOpen, setIsInactiveDialogOpen] = useState(false);
const [selectedTransferForum, setSelectedTransferForum] = useState<number | null>(null);
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
const handleForumMenu = (option: any, record: IForumData) => {
  setSelectedForumId(record.forumId);
  setSelectedForumName(record.forumName);

  if (option.value === 'inactive') {
    setIsInactiveDialogOpen(true);
  } else if (option.value === 'delete') {
    setIsDeleteDialogOpen(true);
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

        const getCommonColumnProps = (key: string) => ({
                  sortColumnOptions: true,

                  filter: {
                    options: formatFilterOptions(key),
                    selectedOptions: getExistingFiltersData(existingFilters, key) ?? [],
                    onSubmit: (selectedList: any) => {
                      setNewFilters(key, key, selectedList, existingFilters, defaultFilters);
                    },
                    onClear: () => {
                      setNewFilters(key, key, [], existingFilters);
                    },
                  },
                  pinColumnOptions: true,
                  hideColumnOption: true,
                  manageColumns: {
                    onSubmit: () => {},
                    onCancel: () => {},
                  },
                });

        const createColumn = (key: keyof IForumData, title: string, width = '140px') => ({
            key,
            dataIndex: dataIndex(key),
            title,
            width,
            resizable: true,
            sortable: true,
            columnFilterProps: getCommonColumnProps(key as string),
        });

        return [
            ...[
                { key: 'functionName', title: 'Function' },
                { key: 'subFunctionName', title: 'SubFunction' },
                { key: 'forumLevel', title: 'Level' },
                { key: 'forumPeriod', title: 'Period' },
            ].map(({ key, title }) => createColumn(key as keyof IForumData, title)),

            createColumn('geography' as keyof IForumData, 'Geography', '260px'),

              {
                key: 'forumName',
                dataIndex: 'forumName',
                title: 'Forum Name',
                width: '240px',
                sticky: 'left',
                resizable: true,
                sortable: true,  
                columnFilterProps: getCommonColumnProps('forumName'),
                render: (_: any, record: IForumData) => {
                  return (
                    <Flex justify="space-between">
                      <Flex vertical gap={2}>
                        <div className={styles['roleId']}>{record.forumId}</div>
                        <div
                          className={styles['clickableText']}
                           onClick={() => {navigate(`${record.forumId}/${record.forumName}`)}}
                        >
                          {record.forumName}
                        </div>
                      </Flex>
                      <Flex onClick={(e) => e.stopPropagation()}>
                        <SideMenu
                          action={
                            <Icon name="dots-vertical" size="xm" color="neutrals-B800" />
                          }
                          onOptionSelect={(option) => {
                            handleForumMenu(option, record);
                          }}
                          options={[
                            { label: 'Set as Inactive', value: 'inactive' },
                            { label: 'Delete', value: 'delete' },
                          ]}
                        />
                      </Flex>
                    </Flex>
                  );
                },
              },

              {
                key: 'status',
                dataIndex: 'status',
                title: 'Status',
                width: '120px',
                sortable: true,
                columnFilterProps: getCommonColumnProps('status'),
                render: (status: string) => (
                  <Status
                    size="S"
                    text={status}
                    type={status === 'Active' ? 'Success' : 'Warning'}
                  />
                ),
              },
        ];
    }, [defaultFilters, existingFilters, filtersData]);

    const columnsWithClickableForumName = useCallback(
        () =>
            getColumns().map((column: any) => {
                if (column.key === 'forum') {
                    return {
                        ...column,
                        render: (value: any, record: typeof forumData) => (
                            <div style={{ cursor: 'pointer' }}>
                                {column.render ? column.render(value, record) : value}
                            </div>
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
                columns={columnsWithClickableForumName()}
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
        columnsWithClickableForumName,
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
            <Flex vertical align="center" gap={8}>
              <Label type="body1">
                  <span className={styles['rm-empty-state-title']}>No Forums Added Yet</span>
              </Label>
              <Label type="body2">
                  <span className={styles['rm-empty-state-description']}>
                      Click on the button below to start adding and managing forums
                  </span>
              </Label>
            </Flex>
            <Button icon="plus" text="Add New Forum" onClick={() => navigate('/admin-hub/forum-management/add-new-forum')} />
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
          <Flex vertical align="center" justify="center" gap={16}>
            <NoMatchesFound />
              <Flex vertical align="center" justify="center" gap={4}>
                <Label type="body1">
                    <span className={styles['rm-empty-state-title']}>No Matches Found</span>
                </Label>
                <Label type="body2">
                    <span className={styles['rm-empty-state-description']}>
                        Sorry, nothing matches your search. Please try using a different term.
                    </span>
                </Label>
              </Flex>
          </Flex>
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
              title="Set as Inactive"
              isOpen={isInactiveDialogOpen}
              onClose={() => {
                setIsInactiveDialogOpen(false);
                setSelectedTransferForum(null);
              }}
              content={
                <>
                  <p>
                    Are you sure you want to change the status to “Inactive”.
                    The Forum will be removed from command center until active.
                  </p>
              
                  <select
                    value={selectedTransferForum ?? ''}
                    onChange={(e) => setSelectedTransferForum(Number(e.target.value))}
                  >
                    <option value="">Select Forum</option>
                    {forumData
                      .filter(f => f.forumId !== selectedForumId) 
                      .map(f => (
                        <option key={f.forumId} value={f.forumId}>
                          {f.forumName}
                        </option>
                      ))}
                  </select>
                </>
              }
              primaryButtonText="Transfer & Set as Inactive"
              secondaryButtonText="Set as Inactive Only"
              onPrimaryButtonClick={() => {
                dispatch(
                  inactivateForum({
                    forumId: selectedForumId!,
                    isTransferRequired: true,
                    transferToForumId: selectedTransferForum!,
                  })
                ).then(() => {
                  setIsInactiveDialogOpen(false);
                  setSelectedTransferForum(null);
                  refreshData(); 
                });
              }}
              onSecondaryButtonClick={() => {
                dispatch(
                  inactivateForum({
                    forumId: selectedForumId!,
                    isTransferRequired: false,
                    transferToForumId: null,
                  })
                ).then(() => {
                  setIsInactiveDialogOpen(false);
                  refreshData();
                });
              }}
              isPrimaryDisabled={!selectedTransferForum}
            />
            <Dialog
              title="Confirm Deletion"
              isOpen={isDeleteDialogOpen}
              onClose={() => {
                setIsDeleteDialogOpen(false);
                setSelectedTransferForum(null);
              }}
              content={
                <>
                  <p>
                    Are you sure you want to delete the application Forum?
                  </p>
              
                  <select
                    value={selectedTransferForum ?? ''}
                    onChange={(e) => setSelectedTransferForum(Number(e.target.value))}
                  >
                    <option value="">Select Forum</option>
                    {forumData
                      .filter(f => f.forumId !== selectedForumId) 
                      .map(f => (
                        <option key={f.forumId} value={f.forumId}>
                          {f.forumName}
                        </option>
                      ))}
                  </select>
                </>
              }
              primaryButtonText="Transfer & Delete"
              secondaryButtonText="Delete Only"
              onPrimaryButtonClick={() => {
                dispatch(
                  deleteForums({
                    forumId: selectedForumId!,
                    isTransferRequired: true,
                    transferToForumId: selectedTransferForum!,
                  })
                ).then(() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedTransferForum(null);
                  refreshData();
                });
              }}           
              onSecondaryButtonClick={() => {
                dispatch(
                  deleteForums({
                    forumId: selectedForumId!,
                    isTransferRequired: false,
                    transferToForumId: null,
                  })
                ).then(() => {
                  setIsDeleteDialogOpen(false);
                  refreshData();
                });
              }}
              isPrimaryDisabled={!selectedTransferForum} 
            />
        </div>
    );
}

export default ForumManagementTable;
