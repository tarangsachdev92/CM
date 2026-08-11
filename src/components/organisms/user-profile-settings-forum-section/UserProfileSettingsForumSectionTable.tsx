import { useCallback, useRef, useState } from 'react';
import { Flex, Popover } from 'antd';
import { Table, Icon, Status, IconButton, Dialog, Button, DropDown } from 'konnect-react-components';
import styles from './UserProfileSettingsForumSectionTable.module.scss';
import { FlyoutCheckboxItemForum } from '../role-selection-flyout/RoleSelectionFlyoutForum';
import { RoleForumDetails } from '../../../types/response';
import { OptionType } from '../../../types/common';

export type TableDataType = {
    forumName: string
    forumType: string,
    forumOwnersCount: string,
    decisionOwnerCount: string
    viewers: string,
    status: string
    collabType: string;
    comment: string;
    isCommentOpen: boolean;
    approversComment: string
}

type PropsType = {
    data: RoleForumDetails[];
    onClickRow: (record: RoleForumDetails, key: string) => void
    pageSize: number;
    pageNumber: number;
    totalRows: number;
    handlePageChange: (page: number) => void;
    handlePageSizeChange: (size: number) => void;
}

export type SavedPermissionType = TableDataType & {
    roles: FlyoutCheckboxItemForum[]
}

function UserProfileSettingsForumSection({
    onClickRow,
    data,
    pageSize,
    pageNumber,
    totalRows,
    handlePageChange,
    handlePageSizeChange,
}: Readonly<PropsType>) {

    const tableRef = useRef<any>(null);
    const [forumData, setForumData] = useState<RoleForumDetails[]>(data)
    const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false)
    const [selectedForumData, setSelectedForumData] = useState<OptionType>({label: '', value: ''});
    const [forumSearchTerm, setForumSearchTerm] = useState<string>('');
    const dataIndex = <T extends keyof RoleForumDetails>(key: T): T => key;

    const renderPersonaCell = useCallback((
        record: RoleForumDetails,
        flyoutKey: 'forumOwner' | 'decisionOwner' | 'viewer',
        listKey: 'forumOwnerList' | 'decisionOwnerList' | 'viewerList',
        disableClickForViewer = false,
        align: 'flex-start' | 'center' = 'center',
    ) => {
        const isViewer = record.roleName?.toLowerCase() === 'viewer';
        const showDash = disableClickForViewer && isViewer;
        const canClick = !showDash;
        const selectedCount = record[listKey]?.length || 0;

        return (
            <Flex
                onClick={canClick ? () => onClickRow(record, flyoutKey) : undefined}
                justify='space-between'
                align={align}
            >
                {showDash ?
                    <div>
                        <span className={styles['usersText']}>-</span>
                    </div> :
                    <>
                        <div>
                            <span className={styles['usersText']}>Users : </span>
                            <span className={styles[selectedCount ? 'forumOwnerText' : 'usersText']}>{selectedCount || 'Not'} Selected</span>
                        </div>
                        <Icon name='chevron-down' color='neutrals-B200' />
                    </>}
            </Flex>
        );
    }, [onClickRow]);

    const getColumns = useCallback(() => {
        return [{
            key: 'forumName',
            dataIndex: dataIndex('forumName'),
            title: 'Forum',
            resizable: true,
            customExpandableColumn: true,
            width: '18.75rem',
            render: (_value: string, record: RoleForumDetails) => {
                return (
                    <Flex gap={10} vertical>
                        <span className={styles['forumOwnerText']}>{_value}</span>
                        <span className={styles['usersText']}>{record.geographyTypeName} | {record.forumPeriodName} | {record.geographyName}</span>
                    </Flex>
                )
            }
        }, {
            key: 'forumType',
            dataIndex: dataIndex('forumType'),
            title: 'Forum Type',
            resizable: true,
            render: (_value: string) => {
                return (
                    <Flex justify='space-between'>
                        <span className={styles['forumOwnerText']}>{_value}</span>
                    </Flex>
                )
            }
        }, {
            key: 'roleName',
            dataIndex: dataIndex('roleName'),
            title: 'Your Role',
            resizable: true,
            render: (_value: string) => {
                return (
                    <Flex justify='space-between'>
                        <span className={styles['forumOwnerText']}>{_value}</span>
                    </Flex>
                )
            }
        }, {
            key: 'forumOwner',
            dataIndex: dataIndex('forumOwner'),
            title: 'Forum Owners',
            resizable: true,
            render: (_value: string, record: RoleForumDetails) => {
                return renderPersonaCell(record, 'forumOwner', 'forumOwnerList', true, 'flex-start')
            }
        }, {
            key: 'decisionOwner',
            dataIndex: dataIndex('decisionOwner'),
            title: 'Decision Owners',
            resizable: true,
            render: (_value: string, record: RoleForumDetails) => {
                return renderPersonaCell(record, 'decisionOwner', 'decisionOwnerList', true)
            }
        }, {
            key: 'viewer',
            dataIndex: dataIndex('viewer'),
            title: 'Viewers',
            resizable: true,
            render: (_value: string, record: RoleForumDetails) => {
                return renderPersonaCell(record, 'viewer', 'viewerList')
            }
        }, {
            key: 'status',
            dataIndex: dataIndex('status'),
            title: 'Status',
            resizable: true,
            width: '5.625rem',
            render: (_value: string) => {
                const statusValue = _value?.trim();
                if (!statusValue) {
                    return <span className={styles['usersText']}>-</span>;
                }

                return (
                    <Status
                        size="S"
                        text={statusValue}
                        type={statusValue === 'Approved' ? 'Success' : 'Warning'}
                    />
                );
            },
        }, {
            key: 'actions',
            dataIndex: 'actions',
            title: 'Actions',
            width: '6.25rem',
            resizable: true,
            render: (_: any, record: RoleForumDetails) => (
                <Flex gap={12} align="center">
                    <Popover
                        open={record.isCommentOpen}
                        content={
                            <Flex gap={12}>
                                {record.approversComment}
                                <IconButton
                                    icon='x-close'
                                    onClick={() => {
                                        const tempForumData = forumData;
                                        tempForumData.forEach((item) => {
                                            if (item.forumName === record.forumName) {
                                                item.isCommentOpen = false
                                            }
                                        })
                                        setForumData([...tempForumData])
                                    }}
                                    size="Tiny"
                                />
                            </Flex>
                        }
                        trigger="click"
                    >
                        <button className={styles['iconButton']} onClick={() => {
                            const tempForumData = forumData;
                            tempForumData.forEach(item => {
                                if (item.forumName === record.forumName) {
                                    item.isCommentOpen = true
                                } else {
                                    item.isCommentOpen = false
                                }
                            })
                            setForumData([...tempForumData])
                        }}>
                            <Icon
                                name='message-text-square-01'
                                color='neutrals-B400'
                                size='l'
                            />
                        </button>

                    </Popover>
                    {(record.forumType?.toLowerCase() === 'custom' && record.roleName?.toLowerCase() === 'forum owner') && <IconButton
                        icon="trash-01"
                        onClick={() => {
                            setOpenDeleteDialog(true)
                        }}
                        size="Small"
                    />}
                </Flex>
            ),
        },];
    }, [forumData, renderPersonaCell])

    const columnsWithClickableRoleName = useCallback(
        () =>
            getColumns().map((column: any) => {
                return {
                    ...column,
                    render: (value: any, record: TableDataType) => (
                        <div>
                            {column.render ? column.render(value, record) : value}
                        </div>
                    ),
                };
            }),
        [getColumns, forumData],
    );

    const renderTable = useCallback(() => {
        return (
            <Table
                columns={columnsWithClickableRoleName()}
                data={forumData}
                className={styles['table-comp']}
                ref={tableRef}
                pagination={{
                    totalItems: totalRows, // Total number of rows
                    pageSize,
                    currentPage: pageNumber,
                    onPageChange: (page: number) => {
                        handlePageChange(page);
                    },
                    onPageSizeChange: handlePageSizeChange,
                    blankOut: 10,
                }}
            />
        );
    }, [
        getColumns,
        forumData,
        totalRows,
        pageNumber,
        pageSize,
        handlePageChange,
        handlePageSizeChange,
    ]);

    const mapToOptions = (data: any[] = []) =>
        data.map(item => ({
            label: item.forumName,
            value: item.id ?? item.forumId,
        }));

    const getFilteredForumOptions = () => {
        const normalizedSearchTerm = forumSearchTerm?.trim().toLowerCase();
        if (!normalizedSearchTerm) {
            return mapToOptions(data);
        }

        return mapToOptions(data).filter((item) =>
            item.label?.toLowerCase().includes(normalizedSearchTerm),
        );
    };

    const handleDeleteOnlyForumData = () => {

    }

    const handleDeleteAndTransferForumData = () => {
        
    }

    const forumDeletionDialog = () => {
        return (
            <Flex gap={20} className={styles.dialogContent} vertical>
                <span className={styles['delete-forum-title']}>Are you sure you want to delete this forum?</span>
                <span className={styles['delete-forum-sub-title']}>Select a forum for transferring all exceptions.</span>
                <div>
                    <DropDown
                        dropdown={{
                            options: getFilteredForumOptions(),
                            reset: false,
                            placeholder: 'Select Forum',
                            onSearch: (term: string) => {
                                setForumSearchTerm(term);
                            },
                            onChange: (option: OptionType) => {
                                setSelectedForumData(option);
                            },
                        }}
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                    />
                </div>
                <Flex gap={10} justify='end'>
                    <Button text="Delete Only" onClick={() => handleDeleteOnlyForumData()}></Button>
                    <Button disabled={!selectedForumData.value} text="Transfer & Delete" onClick={() => handleDeleteAndTransferForumData()}></Button>
                </Flex>
            </Flex>
        );
    };

    return (
        <div className={styles['table-container']}>
            {renderTable()}
            <Dialog
                content={forumDeletionDialog()}
                isOpen={openDeleteDialog}
                iconName="trash-01"
                size="Small"
                color="black-color"
                variant="HeaderTitleIcon"
                onClose={() => {
                    setOpenDeleteDialog(false);
                }}
                onPrimaryButtonClick={() => { setOpenDeleteDialog(false); }}
                onSecondaryButtonClick={() => {
                    setOpenDeleteDialog(false);
                }}
                hideFooter={true}
                primaryButtonText="Delete"
                secondaryButtonText="Don't Delete"
                title="Confirm Deletion"
            />
        </div>
    );
}

export default UserProfileSettingsForumSection;
