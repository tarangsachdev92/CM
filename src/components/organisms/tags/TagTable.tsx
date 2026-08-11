import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { Flex } from 'antd';
import {
    Toast,
    Table,
    FilterChip,
    Counter,
    AnimatedLoaders,
    Icon,
    SearchInput,
    Dialog,
} from 'konnect-react-components';
import { useDispatch, useSelector } from 'react-redux';
import { EmptyStateOfComponent, Label } from '../../atoms';
import { AppDispatch, RootState } from '../../../store';
import { getTagDetails } from '../../../store/thunks/getTagDetails';
import { searchTagService, deleteTagsById } from '../../../services/tags';
import styles from './TagTable.module.scss';
import {
    RoleManagementEmptyState,
    SearchResultEmptyStateImage,
} from '../../../assets/images/images';
import type { ITagsPayload, ITagDetails } from '../../../types/response';
import type { ITagsRequest } from '../../../types/request';
import { getCurrentUserEmail, formatDueDate, logError } from '../../../utils/helpers';
import AddNewTagFlyout from '../add-new-tag/AddNewTagFlyout';
import { handleKeyDownValidation } from '../../../utils/validation';
import { useDebounce } from '../../../utils/customHooks';

interface Tag {
    tagName: string | null;
    instances: number;
    updatedOn: string | null;
    tagId: number;
    tagCategoryId: number;
}

interface TableData {
    tagCategoryId: number;
    tagCategoryName: string;
    actions: number;
    expandedRowData: ITagDetails[];
    tagName?: string;
    instances?: number;
    updatedOn?: string;
    tagId?: number;
}

interface TagTableProps {
    refreshTags: boolean;
    newlyAddedTagCategoryId: null | number;
    setNewlyAddedTagCategoryId: React.Dispatch<React.SetStateAction<number | null>>;
}

type TableRef = {
    toogleRowExpandCallBack: (rowIndex: number | string, expand: boolean) => void;
};

function TagTable({
    refreshTags,
    newlyAddedTagCategoryId,
    setNewlyAddedTagCategoryId,
}: Readonly<TagTableProps>) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
    const [selectedTagName, setSelectedTagName] = useState<string | null>(null);
    const dispatch = useDispatch<AppDispatch>();
    const { data, loading } = useSelector((state: RootState) => state.tagDetails);
    const expandedStatusRef = useRef<Record<number, boolean>>({});

    const [toastConfig, setToastConfig] = useState({
        visible: false,
        message: '',
        type: 'Delete' as 'Delete' | 'Error' | 'Success',
    });
    const [tableData, setTableData] = useState<TableData[]>([]);
    const [searchedTerm, setSearchedTerm] = useState<string>('');
    const debouncedSearchedTerm = useDebounce(searchedTerm);
    const [searchedResults, setSearchedResults] = useState<ITagsPayload>({
        tagDetails: [],
        tagCategoryDetails: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isEditFlyoutOpen, setIsEditFlyoutOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const tableRef = useRef<TableRef>(null);
    const [areColumnsVisible, setAreColumnsVisible] = useState(false);
    const fetchData = useCallback(async () => {
        const requestBody = {
            isActive: 1,
            tagCategoryId: null,
            tagName: null,
            sortColumn: null,
            sortOrder: null,
        };
        try {
            await dispatch(getTagDetails(requestBody));
        } catch (error) {
            logError('Failed to fetch tag data:', error);
            setToastConfig({
                visible: true,
                message: 'Failed to fetch data',
                type: 'Error',
            });
        }
    }, [dispatch]);

    useEffect(() => {
        const searchInputField = document.getElementsByClassName('search-input-container-l');
        searchInputField?.[0]?.setAttribute('style', 'width: 306px');
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTags, refreshKey]);

    useEffect(() => {
        // Set table data once all the master data and search result data is loaded
        getAndSetTableData();
    }, [data, searchedResults]);

    useEffect(() => {
        // On change of search term, fetch search results
        if (debouncedSearchedTerm) {
            getSearchedTags();
        }
        // Once the search term is cleared, set the table with master data once again
        if (debouncedSearchedTerm === '') {
            getAndSetTableData();
        }
    }, [debouncedSearchedTerm]);

    useEffect(() => {
        if (!newlyAddedTagCategoryId) {
            return;
        }
        expandTagCategory(newlyAddedTagCategoryId);
    }, [newlyAddedTagCategoryId]);

    const getSearchedTags = async () => {
        const payload: ITagsRequest = {
            isActive: 0,
            tagCategoryId: null,
            sortColumn: null,
            sortOrder: null,
            tagName: debouncedSearchedTerm,
        };
        try {
            setIsLoading(true);
            const response = await searchTagService(payload);
            setSearchedResults(response);
        } catch (error) {
            logError('Failed to fetch search tag data:', error);
            setToastConfig({
                visible: true,
                message: 'Failed to fetch search results',
                type: 'Error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const noTagsAdded = () => (
        <Flex
            vertical
            className={styles['tag-empty-state']}
            align="center"
            justify="center"
            gap={16}
        >
            <RoleManagementEmptyState />
            <Label type="body1">
                <span className={styles['tag-empty-state-title']}>No Tags Added Yet</span>
            </Label>
            <Label type="body2">
                <span className={styles['tag-empty-state-description']}>
                    Click on the add button to add a new tag
                </span>
            </Label>
        </Flex>
    );

    // No search results found empty state
    const searchResultEmptyState = () => {
        return (
            <EmptyStateOfComponent
                emptyStateImage={<SearchResultEmptyStateImage />}
                emptyStateTitle="No Matches Found"
                emptyStateMessage="Sorry, nothing matches your search. Please try using a different term."
            />
        );
    };

    const getAndSetTableData = () => {
        if (!data.tagCategoryDetails.length || !data.tagDetails.length) {
            return;
        }
        let _data: ITagsPayload;
        // If search term is available, use searched results to display table else use master data to display table
        if (debouncedSearchedTerm.length) {
            _data = searchedResults;
        } else {
            _data = data;
        }
        const _tableData: TableData[] =
            _data?.tagCategoryDetails.map(category => ({
                tagCategoryId: category.tagCategoryId,
                tagCategoryName: category.tagCategoryName || '',
                actions: category.actions,
                expandedRowData: _data.tagDetails.filter(
                    (tag: Tag) => tag.tagCategoryId === category.tagCategoryId,
                ),
            })) || [];
        setTableData(_tableData);
    };

    const formatCounterValue = (value: number) => {
        return value < 10 ? `0${value}` : `${value}`;
    };

    const renderColumns = useMemo(() => {
        return [
            {
                key: 'tagCategoryName',
                dataIndex: 'tagCategoryName' as keyof TableData,
                title: 'Tags',
                customExpandableColumn: true,
                width: '920px',
                render: (_value: any, record: TableData, isExpanded: boolean) => {
                    expandedStatusRef.current[record.tagCategoryId] = isExpanded;
                    const allExpansions = Object.values(expandedStatusRef.current);
                    const isAnyRowExpanded = allExpansions.some(status => status);

                    if (isAnyRowExpanded) {
                        setAreColumnsVisible(true);
                    } else {
                        setAreColumnsVisible(false);
                    }

                    return (
                        <>
                            {record.expandedRowData ? (
                                <div
                                    className={
                                        record.expandedRowData.length
                                            ? styles['application-cell-container']
                                            : styles['row-disabled']
                                    }
                                >
                                    <Icon
                                        name={isExpanded ? 'chevron-up' : 'chevron-down'} // Change icon based on isExpanded
                                        size="xm"
                                        color="neutrals-B300"
                                    />
                                    <div className={styles['application-permissions-cell-content']}>
                                        {record.tagCategoryName}
                                    </div>
                                </div>
                            ) : (
                                <FilterChip
                                    key={String(record.tagId)}
                                    label={record.tagName ?? ''}
                                    showCloseIcon={false}
                                />
                            )}
                        </>
                    );
                },
            },
            ...(areColumnsVisible
                ? [
                      {
                          key: 'instances',
                          dataIndex: 'instances' as keyof TableData,
                          title: 'Instances',
                          render: (_value: any, record: TableData) => (
                              <>
                                  {record.expandedRowData ? (
                                      <></>
                                  ) : (
                                      <div
                                          className={styles['application-permissions-cell-content']}
                                      >
                                          {record.instances}
                                      </div>
                                  )}
                              </>
                          ),
                      },
                      {
                          key: 'updatedOn',
                          dataIndex: 'updatedOn' as keyof TableData,
                          title: 'Last Updated',
                          externalStyles: { textAlign: 'center' },
                          render: (_value: any, record: TableData) => {
                              if (typeof record.updatedOn === 'string') {
                                  return record.updatedOn ? formatDueDate(record.updatedOn) : '';
                              }
                              return '';
                          },
                      },
                  ]
                : []),
            {
                key: 'actions',
                dataIndex: 'actions' as keyof TableData,
                title: areColumnsVisible ? 'Actions' : '', // Dynamically show title
                externalStyles: { textAlign: 'center' },
                render: (value: number | undefined, record: TableData) => {
                    const isParentRow = !!record.expandedRowData;
                    const count = typeof value === 'number' ? value : 0;

                    if (isParentRow) {
                        // Always render counter for tag category rows
                        return (
                            <div style={{ textAlign: 'right' }}>
                                <Counter value={formatCounterValue(count)} />
                            </div>
                        );
                    }

                    // For child tag rows, show icons only when columns are visible
                    if (areColumnsVisible) {
                        return (
                            <Flex gap={8} align="center" justify="flex-end">
                                <div
                                    className={styles.iconCircle}
                                    onClick={() =>
                                        handleEditClick(
                                            {
                                                instances: Number(record.instances),
                                                tagCategoryId: record.tagCategoryId,
                                                tagId: Number(record.tagId),
                                                tagName: String(record.tagName),
                                                updatedOn: String(record.updatedOn),
                                            },
                                            record.tagCategoryId,
                                        )
                                    }
                                    role="none"
                                >
                                    <Icon name="edit-01" size="m" color="neutrals-B800" />
                                </div>
                                <div
                                    className={styles.iconCircle}
                                    onClick={() => {
                                        setSelectedTagId(Number(record.tagId));
                                        setSelectedTagName(String(record.tagName));
                                        setIsDeleteDialogOpen(true);
                                    }}
                                    role="none"
                                >
                                    <Icon name="trash-01" size="m" color="neutrals-B800" />
                                </div>
                            </Flex>
                        );
                    }

                    return null;
                },
            },
        ];
    }, [tableData, areColumnsVisible]);

    const onChangeHandlerForSearchInputField = (searchedTerm: string | string[]) => {
        if (typeof searchedTerm === 'string') {
            setSearchedTerm(searchedTerm.trim());
        }
    };

    const renderTable = () => {
        if (debouncedSearchedTerm && !searchedResults.tagDetails.length) {
            return searchResultEmptyState();
        }
        return tableData.length < 1 ? (
            noTagsAdded()
        ) : (
            <Table
                ref={tableRef}
                columns={renderColumns as any}
                data={tableData as any}
                expandableRows={true}
            />
        );
    };

    const handleConfirmDelete = () => {
        if (selectedTagId !== null) {
            handleDeleteTag(selectedTagId);
        }
    };

    const handleDeleteTag = async (tagId: number) => {
        try {
            const userEmail = getCurrentUserEmail();
            const loggedInUser = userEmail ?? '';
            const response = await deleteTagsById(tagId, loggedInUser);
            if (response.statusCode === 200) {
                const tagCategoryId = tableData.find(category =>
                    category.expandedRowData.some(tag => tag.tagId === tagId),
                )?.tagCategoryId;

                setTableData(prevTableData =>
                    prevTableData.map(category => {
                        if (category.tagCategoryId === tagCategoryId) {
                            return {
                                ...category,
                                actions: category.actions > 0 ? category.actions - 1 : 0,
                                expandedRowData: category.expandedRowData.filter(
                                    tag => tag.tagId !== tagId,
                                ),
                            };
                        }
                        return category;
                    }),
                );

                setIsDeleteDialogOpen(false);
                setToastConfig({
                    visible: true,
                    message: `${selectedTagName} Tag deleted`,
                    type: 'Delete',
                });
            }
        } catch (error) {
            logError('TagTable handleDeleteTag Error', error);
            setIsDeleteDialogOpen(false);
            setToastConfig({
                visible: true,
                message: 'Failed to delete tag',
                type: 'Error',
            });
        }
    };
    //------------------------------------------------------------------
    const [editTagData, setEditTagData] = useState<
        { tagId: number; tagName: string; tagCategoryId: number; instances: number } | undefined
    >(undefined);

    const handleEditClick = (tag: Tag, categoryId: number) => {
        setEditTagData({
            tagId: tag.tagId,
            tagName: tag.tagName ?? '',
            tagCategoryId: categoryId,
            instances: tag.instances,
        });
        setIsEditFlyoutOpen(true);
        // Set the newly added tag category as NULL on click of edit flyout
        setNewlyAddedTagCategoryId(null);
    };

    const handleFlyoutCancel = () => {
        setIsEditFlyoutOpen(false);
        // Set the newly added tag category as NULL on click of close flyout
        setNewlyAddedTagCategoryId(null);
    };

    const expandTagCategory = (tagCategoryId: number | null) => {
        if (!tagCategoryId) {
            return;
        }
        setTimeout(() => {
            tableRef.current?.toogleRowExpandCallBack(tagCategoryId - 1, true);
        }, 1000);
    };

    return (
        <Flex
            vertical
            className={`${styles['tag-container']} ${!areColumnsVisible ? styles['noColumnsVisible'] : ''}`}
            gap={24}
        >
            <Flex justify="space-between">
                <Flex gap={8} align="center" justify="space-between" style={{ width: '100%' }}>
                    <Flex vertical gap={8} style={{ width: '90%' }}>
                        <Label type="body1">
                            <span className={styles['tag-card-title']}>Available Tags</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['tag-card-description']}>
                                You can edit or delete any tag by clicking the icons in the action
                                column. Name of tags that have an instance greater than 0 cannot be
                                edited.
                            </span>
                        </Label>
                    </Flex>
                    <div
                        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                            handleKeyDownValidation(event);
                        }}
                        role="searchbox"
                    >
                        <SearchInput
                            isAnimatedSearch={true}
                            size="L"
                            placeholder="Search Tag"
                            onChange={onChangeHandlerForSearchInputField}
                        />
                    </div>
                </Flex>
            </Flex>

            {loading || isLoading ? (
                <div className={styles['overlay']}>
                    <AnimatedLoaders id="lazy-loader" type="page" />
                </div>
            ) : (
                renderTable()
            )}
            <div className={styles['outer-container']}>
                <AddNewTagFlyout
                    isFlyoutOpen={isEditFlyoutOpen}
                    onClickHandlerForFlyoutCancelIcon={handleFlyoutCancel}
                    onTagEddited={() => setRefreshKey(prev => prev + 1)}
                    editMode={!!editTagData}
                    existingTag={editTagData}
                    onTagAdded={tagCategoryId => {
                        setNewlyAddedTagCategoryId(tagCategoryId);
                        expandTagCategory(tagCategoryId);
                    }}
                />
            </div>

            <Dialog
                content={`Are you sure you want to delete the Tag "${selectedTagName}"?`}
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onPrimaryButtonClick={handleConfirmDelete}
                onSecondaryButtonClick={() => setIsDeleteDialogOpen(false)}
                primaryButtonText="Delete"
                secondaryButtonText="Don't Delete"
                title="Delete Tag"
                color="neutrals-B800"
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
                    className={styles['toast-configuration']}
                />
            )}
        </Flex>
    );
}

export default TagTable;
