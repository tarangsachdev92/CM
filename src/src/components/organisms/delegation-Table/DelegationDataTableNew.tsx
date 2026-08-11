 
import { Table, Icon, Dialog, Toast, Status } from 'konnect-react-components';
import { useCallback, useMemo, useState } from 'react';

import styles from './DelegationTable.module.scss';
import { deleteDelegationNew } from '../../../services/delegationNew';
import DelegationRoleFlyoutNew from '../delegate-role-flyout/DelegationRoleFlyoutNew';
import { DELEGATION_STATUS } from '../../../utils/constants';
import DelegationRolePermissionFlyoutNew from '../delegation-permission-flyout/DelegationRolePermissionFlyoutNew';

type KToastType = 'Delete' | 'Error' | 'Success' | 'Default' | 'Warning';

type Props = {
    delegationData: any[];
    pageNumber: number;
    pageSize: number;
    totalRows: number;
    loading: boolean;
    onPageChange: (p: number) => void;
    onPageSizeChange: (s: number) => void;
    refreshData: () => void;
};
const formatDate = (iso: string | number | Date) => {
    const date = new Date(iso); // interpreted as local time (IST)
    const formatted = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
    return formatted.replace(',', '');
};

// "2026-02-25T00:00:00" -> "25 Feb 2026" (IST)

export default function DelegationDataTableNew({
    delegationData,
    pageNumber,
    pageSize,
    totalRows,
    onPageChange,
    onPageSizeChange,
    refreshData,
}: Props) {
    const [selectedDelegationId, setSelectedDelegationId] = useState<number | null>(null);
    const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [flyoutOpen, setFlyoutOpen] = useState(false);
    const [toastCfg, setToastCfg] = useState<{
        visible: boolean;
        message: string;
        type: KToastType;
    } | null>(null);
    const [showDelegationFlyout, setShowDelegationFlyout] = useState(false);
    const [selectedRowId, setSelectedRowId] = useState<string>('');

    const handleEditClick = (row: string) => {
        setSelectedRowId(row);
        setShowDelegationFlyout(true);
    };

    const handleCloseFlyout = useCallback(() => {
        setShowDelegationFlyout(false);
        // optional: clear selection
        setSelectedRowId('0');
    }, []);

    // Table data
    // Build rows that match columns (User Name, Tools, Start, End, Status)
    const tableData = useMemo(() => {
        // (Optional) de-dup again here if data might get duplicated later
        const map = new Map<number, any>();
        for (const row of delegationData ?? []) map.set(row.delegationId, row);
        const unique = Array.from(map.values());

        return unique.map((r: any) => ({
            delegationId: r.delegationId,
            userName: r.userName ?? '',
            toolsDisplay: r.toolName ?? '—',
            delegationStartDate: r.delegationStartDate,
            delegationEndDate: r.delegationEndDate,
            status: r.status ?? '',
            actions: true,
        }));
    }, [delegationData]);

    // Columns
    const columns = useMemo(
        () => [
            {
                key: 'userName',
                dataIndex: 'userName',
                title: 'User Name',
                width: '240px',
                sortable: true,
                render: (val: string) => <div className={styles['truncate-cell']}>{val}</div>,
            },
            {
                key: 'toolName',
                dataIndex: 'toolsDisplay',
                title: 'Tools',
                width: '240px',
                sortable: false,
                render: (val: string) => <div className={styles['truncate-cell']}>{val}</div>,
            },
            {
                key: 'delegationStartDate',
                dataIndex: 'delegationStartDate',
                title: 'Delegation Start Date',
                width: '160px',
                sortable: true,
                render: (d: string) => <div>{formatDate(d)}</div>,
            },
            {
                key: 'delegationEndDate',
                dataIndex: 'delegationEndDate',
                title: 'Delegation End Date',
                width: '160px',
                sortable: true,
                render: (d: string) => <div>{formatDate(d)}</div>,
            },
            {
                key: 'status',
                dataIndex: 'status',
                title: 'Status',
                width: '120px',
                sortable: true,
                render: (val: string) => {
                    const type =
                        val === 'Active' ? 'Success' : val === 'Pending' ? 'Alert' : 'Warning';

                    return <Status text={val} type={type} />;
                },
            },
            {
                key: 'actions',
                dataIndex: 'actions',
                title: 'Actions',
                width: '100px',
                sortable: false,
                render: (_: any, r: any) => {
                    const isExpired =
                        String(r.status ?? '').toLowerCase() ==
                        DELEGATION_STATUS.EXPIRED.toLowerCase();

                    return (
                        <div className={styles.actionsWrap}>
                            {/* View / Permissions */}
                            <button
                                type="button"
                                className={styles.iconCircle}
                                aria-label="View delegated role permissions"
                                onClick={() => {
                                    setSelectedDelegationId(r.delegationId);
                                    setFlyoutOpen(true);
                                }}
                            >
                                <Icon name="file-check-02" size="m" color="neutrals-B800" />
                            </button>

                            {/* Edit */}

                            {!isExpired && (
                                <button
                                    type="button"
                                    className={styles.iconCircle}
                                    aria-label="Edit delegation"
                                    onClick={() => handleEditClick(r.delegationId)}
                                >
                                    <Icon name="edit-02" size="m" color="neutrals-B800" />
                                </button>
                            )}

                            {/* Delete */}

                            {!isExpired && (
                                <button
                                    type="button"
                                    className={`${styles.iconCircle} ${styles.danger}`}
                                    aria-label="Withdraw delegation"
                                    onClick={() => {
                                        setSelectedUserName(r.userName);
                                        setSelectedDelegationId(r.delegationId);
                                        setIsDeleteDialogOpen(true);
                                    }}
                                >
                                    <Icon name="trash-01" size="m" color="neutrals-B800" />
                                </button>
                            )}
                        </div>
                    );
                },
            },
        ],
        [],
    );
    const handleConfirmDelete = () => {
        if (selectedDelegationId !== null) {
            handleDeleteDelegation(selectedDelegationId);
        }
    };

    const handleDeleteDelegation = async (delegationId: number) => {
        setIsDeleting(true);
        try {
            await deleteDelegationNew(delegationId);
            setIsDeleteDialogOpen(false);

            setToastCfg({
                visible: true,
                message: `Delegation Withdrawn for ${selectedUserName ?? 'user'}`,
                type: 'Delete',
            });

            refreshData();
        } catch (e: any) {
            setIsDeleteDialogOpen(false);
            setToastCfg({
                visible: true,
                message: e?.message ?? 'Failed to delete delegation',
                type: 'Error',
            });
        } finally {
            setIsDeleting(false);
        }
    };
    return (
        <>
            <Table
                data={tableData}
                columns={columns}
                pagination={{
                    totalItems: totalRows,
                    pageSize,
                    currentPage: pageNumber,
                    onPageChange,
                    onPageSizeChange,
                    blankOut: 10,
                }}
            />

            <Dialog
                content={
                    <>
                        <span>Are you sure you want to delete this Delegation?</span>
                        <br />

                        <span>Deleting this will result in the loss of all privileges for</span>
                        <br />

                        <span>the assigned role</span>
                    </>
                }
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onPrimaryButtonClick={handleConfirmDelete}
                onSecondaryButtonClick={() => setIsDeleteDialogOpen(false)}
                primaryButtonText="Delete Delegation"
                secondaryButtonText="Don't Delete"
                title="Confirm Delegation"
                color="neutrals-B800"
                loading={isDeleting}
                className={styles.wraptext}
            />

            {toastCfg?.visible && (
                <Toast
                    distance="x5l"
                    message={toastCfg.message}
                    mode="Top Right"
                    onCloseToast={() => setToastCfg(t => (t ? { ...t, visible: false } : t))}
                    toggle
                    type={toastCfg.type}
                    timer={10000}
                    className={styles['toast']}
                />
            )}
            <DelegationRoleFlyoutNew
                isOpen={showDelegationFlyout}
                isEditModeOn={true} // or compute based on your logic
                selectedRowId={selectedRowId} // pass the row being edited
                onCancelClick={handleCloseFlyout} // close handler
                isAddingSecondaryRole={false} // set appropriately
            />
            {selectedDelegationId && (
                <DelegationRolePermissionFlyoutNew
                    delegationId={selectedDelegationId}
                    open={flyoutOpen}
                    onClose={() => setFlyoutOpen(false)}
                />
            )}
        </>
    );
}
