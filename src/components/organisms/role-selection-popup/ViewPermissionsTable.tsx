import { useState, useEffect } from 'react';
import { Table, Icon, CheckBox, Counter, AnimatedLoaders } from 'konnect-react-components';
import { EllipsisWithTooltip } from '../../atoms';
import styles from './RoleSelectionPopup.module.scss';
import type { IRolePermissionsInitialState } from '../../../store/slice/rolePermissionsSlice';

type ViewPermissionsTableProps = {
    appPermissionsByRoleId: IRolePermissionsInitialState['applicationsData'];
    selectedRoleDetails: {
        roleName: string;
        roleId: number;
        roleRegion: string;
        getRoleNomenclature :string;
    };
    isAppPermissionsByRoleIdLoading: boolean;
};

interface TableRow {
    key: number;
    application?: string;
    applicationId?: string;
    toolType?: string;
    appFeature?: string;
    appModuleName?: string;
    role: string;
    isActive?: boolean | null;
    selectedPermissionCount?: number;
    expandedRowData?: TableRow[];
}

function ViewPermissionsTable({
    appPermissionsByRoleId,
    selectedRoleDetails,
    isAppPermissionsByRoleIdLoading,
}: Readonly<ViewPermissionsTableProps>) {
    const { existingToolPermissions } = appPermissionsByRoleId;
    const [tableRowData, setTableRowData] = useState<TableRow[]>([]);
    const [paginatedData, setPaginatedData] = useState<TableRow[]>([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        if (existingToolPermissions.length) {
            loadExistingApplicationsForRole();
        } else {
            setTableRowData([]);
        }
    }, [appPermissionsByRoleId]);

    useEffect(() => {
        const _paginatedData = tableRowData.slice(
            (pageNumber - 1) * pageSize,
            pageNumber * pageSize,
        );
        setPaginatedData(_paginatedData);
    }, [tableRowData, pageNumber, pageSize]);

    const loadExistingApplicationsForRole = () => {
        if (!existingToolPermissions.length) {
            return;
        }

        const newTableRowData: TableRow[] = existingToolPermissions.map((application, idx) => {
            return {
                key: idx,
                application: application.toolDetails.toolName,
                applicationId: application.toolDetails.toolId.toString(),
                toolType: application.toolDetails.toolType,
                role: selectedRoleDetails.roleName,
                selectedPermissionCount: application.activePermissionCount,
                expandedRowData: application.adgroups.flatMap(adgroup =>
                    adgroup.permission.map(perm => ({
                        key: perm.toolPermissionId,
                        appFeature: perm.toolPermissionName,
                        appModuleName: perm.toolModuleName,
                        role: '',
                        isActive: perm.isActiveToolPermission,
                    })),
                ),
            };
        });

        setTableRowData(newTableRowData);
    };

    const TableColumns = [
        {
            key: 'application',
            dataIndex: 'application',
            title: 'Tools & Permissions',
            externalStyles: { alignItems: 'center' },
            customExpandableColumn: true,
            render: (_value: string, record: TableRow) => (
                <>
                    {record.expandedRowData ? (
                        <div className={styles['application-cell-container']}>
                            <Icon name="chevron-down" size="xm" color="neutrals-B300" />
                            <div className={styles['header-title']}>
                                <span className={styles['application-permissions-cell-title']}>
                                    {record.toolType} {record.applicationId}
                                </span>
                                <span className={styles['application-permissions-cell-content']}>
                                    <EllipsisWithTooltip text={String(record.application)} />
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className={styles['header-title']}>
                            <span className={styles['application-permissions-cell-title']}>
                                {record.appModuleName}
                            </span>
                            <span className={styles['application-permissions-cell-content']}>
                                {record.appFeature}
                            </span>
                        </div>
                    )}
                </>
            ),
        },
        {
            key: 'role',
            dataIndex: 'role',
            title: selectedRoleDetails.roleName ?? '',
            subTitle: `${selectedRoleDetails.roleId ?? ''} | ${selectedRoleDetails.roleRegion ?? ''} ${selectedRoleDetails.getRoleNomenclature ?? ''}`,
            render: (_value: string, record: any) => {
                return record.expandedRowData ? (
                    <div className={styles['role_permissions_column']}>
                        <Counter
                            value={
                                record.selectedPermissionCount > 10
                                    ? record.selectedPermissionCount
                                    : `0${record.selectedPermissionCount}`
                            }
                            size="Small"
                        />
                    </div>
                ) : (
                    <div className={styles['role_permissions_column']}>
                        {record.isActive !== null ? (
                            <CheckBox
                                onChange={() => {}}
                                checked={record.isActive}
                                disabled={true}
                            />
                        ) : (
                            <Icon name="x-close" size="l" color="neutrals-B80" />
                        )}
                    </div>
                );
            },
        },
    ];

    const renderCustomRow = () => {
        if (isAppPermissionsByRoleIdLoading) {
            return <AnimatedLoaders type="page" id="view-permissions-table-animated-loader" />;
        }
        if (!tableRowData.length) {
            return <span>No mapped permissions found for the selected role.</span>;
        }
        return <></>;
    };

    const handlePageChange = (page: number) => {
        setPageNumber(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
    };

    return (
        <div className={styles['view-permissions-table-container']}>
            <Table
                columns={TableColumns as any}
                expandableRows={true}
                data={paginatedData}
                customRow={renderCustomRow()}
                pagination={{
                    totalItems: tableRowData.length > 0 ? tableRowData.length : 1,
                    pageSize,
                    currentPage: pageNumber,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    blankOut: 10,
                }}
            />
        </div>
    );
}

export default ViewPermissionsTable;
