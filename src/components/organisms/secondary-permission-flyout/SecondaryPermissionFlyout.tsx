import { useEffect, useState, useMemo } from 'react';
import { Flyout, Table, CheckBox, Icon, Status, Counter } from 'konnect-react-components';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserToolPermissions } from '../../../store/thunks/fetchUserToolPermissions';
import { RootState, AppDispatch } from '../../../store';
import styles from './SecondaryPermissionFlyout.module.scss';
import { Skeleton } from 'antd';

const CHIP_ORDER = ['Approved', 'Pending', 'AutoRejected'] as const;
type Canonical = (typeof CHIP_ORDER)[number];

// canonical buckets for the flyout (match the card logic)
const PENDING_ALIASES = new Set(['pending', 'requested', 'addfailed', 'add failed', 'add_failed']);
const AUTOREJ_ALIASES = new Set(['auto reject', 'auto_reject', 'autorejected', 'auto-rejected']);

const toCanonical = (raw?: string): Canonical | null => {
    const s = (raw || '').trim().toLowerCase();
    if (!s) return null;
    if (s === 'approved' || s === 'approve') return 'Approved';
    if (PENDING_ALIASES.has(s)) return 'Pending';
    if (AUTOREJ_ALIASES.has(s)) return 'AutoRejected';
    return null;
};

const formatChipText = (canon: Canonical, count: number) =>
    canon === 'Approved'
        ? `Approved (${count})`
        : canon === 'Pending'
          ? `Pending (${count})`
          : `Auto Reject (${count})`;

const statusTypeForCanonical = (canon: Canonical): 'Success' | 'Alert' | 'Warning' =>
    canon === 'Approved' ? 'Success' : canon === 'Pending' ? 'Alert' : 'Warning';

interface Props {
    roleId: number;
    roleType: string;
    roleRegion: string;
    toggleFlyout: boolean;
    onCancelIconClickOfFlyout: () => void;
}

type ExpandedRow = {
    key: string;
    appModuleName: string;
    appPermissionName: string;
    isActive: boolean;
    // status removed from child rows because we only show chips at the parent level
};

type StatusSummary = Partial<Record<Canonical, number>>;

type TableRow = {
    key: string;
    toolName: string;
    toolType: string;
    applicationId: string;
    selectedPermissionCount: number;
    expandedRowData: ExpandedRow[];
    statusSummary: StatusSummary; // chips shown on parent row
};

const SecondaryPermissionsFlyout = ({
    roleId,
    roleType,
    roleRegion,
    toggleFlyout,
    onCancelIconClickOfFlyout,
}: Props) => {
    const dispatch = useDispatch<AppDispatch>();
    const { data, loading } = useSelector((state: RootState) => state.userToolPermissions);

    const [pageSize, setPageSize] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (toggleFlyout && roleId) {
            dispatch(
                fetchUserToolPermissions({
                    roleId,
                    roleType,
                    pageSize,
                    pageNumber: currentPage,
                }),
            );
        }
    }, [toggleFlyout, roleId, roleType, pageSize, currentPage, dispatch]);

    const dedupeAcrossTools = false; // flip to false if you prefer per-tool counts

    const mappedTableData: TableRow[] = useMemo(() => {
        const tools = data?.tools ?? [];
        const seenAdGroupIds = new Set<string>(); // <- NEW: cross-tool dedupe

        const rows: TableRow[] = tools.map((tool: any, toolIndex: number) => {
            const expandedRowData: ExpandedRow[] =
                tool?.adgroupsList?.flatMap((group: any, groupIndex: number) =>
                    (group?.permission ?? []).map((perm: any, permIndex: number) => ({
                        key: `perm_${toolIndex}_${groupIndex}_${permIndex}`,
                        appModuleName: perm.appModuleName,
                        appPermissionName: perm.appPermissionName,
                        isActive: !!perm.isActiveAppPermission,
                    })),
                ) ?? [];

            const statusSummary: StatusSummary = { Approved: 0, Pending: 0, AutoRejected: 0 };

            if (tool?.statusChips && typeof tool.statusChips === 'object' && !dedupeAcrossTools) {
                Object.entries(tool.statusChips).forEach(([label, count]) => {
                    const canon = toCanonical(label);
                    if (canon)
                        statusSummary[canon] = (statusSummary[canon] ?? 0) + (Number(count) || 0);
                });
            } else {
                (tool?.adgroupsList ?? []).forEach((group: any) => {
                    const id: string | undefined = group?.adGroupId;
                    if (dedupeAcrossTools && id && seenAdGroupIds.has(id)) {
                        return; // skip duplicates seen in earlier tools
                    }
                    const canon = toCanonical(group?.status);
                    if (canon) statusSummary[canon] = (statusSummary[canon] ?? 0) + 1;
                    if (dedupeAcrossTools && id) seenAdGroupIds.add(id);
                });
            }

            return {
                key: `${tool.toolId}_${toolIndex}`,
                toolName: tool.toolName,
                toolType: tool.toolType,
                applicationId: tool.toolIdAlias,
                selectedPermissionCount: tool.permissionCount,
                expandedRowData,
                statusSummary,
            };
        });

        return rows;
    }, [data]);

    const columns = [
        {
            key: 'toolName',
            dataIndex: 'application',
            title: 'Tools & Permissions',
            customExpandableColumn: true,
            render: (_: any, record: any) =>
                record.expandedRowData ? (
                    <div className={styles['application-cell-container']}>
                        <Icon name="chevron-down" size="xm" color="neutrals-B300" />
                        <div className={styles['header-title']}>
                            <span className={styles['application-permissions-cell-title']}>
                                {record.toolType} {record.applicationId}
                            </span>
                            <span className={styles['application-permissions-cell-content']}>
                                {record.toolName}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className={styles['header-title']}>
                        <span className={styles['application-permissions-cell-title']}>
                            {record.appModuleName}
                        </span>
                        <span className={styles['application-permissions-cell-content']}>
                            {record.appPermissionName}
                        </span>
                    </div>
                ),
        },
        {
            key: 'role',
            dataIndex: 'role',
            title: data?.role ?? 'Role',
            subTitle: `${data?.roleId ?? ''} | ${roleRegion} `,
            render: (_: any, record: any) =>
                record.expandedRowData ? (
                    <div className={styles['role_permissions_column']}>
                        <Counter
                            value={
                                record.selectedPermissionCount > 9
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
                ),
        },
        {
            key: 'status',
            dataIndex: 'status',
            title: 'AD Group Access Status',
            render: (_: any, record: any) =>
                record.expandedRowData ? (
                    <div className={styles['status-summary']}>
                        {CHIP_ORDER.map(canon => {
                            const count = (record.statusSummary?.[canon] ?? 0) as number;
                            if (!count) return null;
                            return (
                                <span key={canon} className={styles['status-chip']}>
                                    <Status
                                        text={formatChipText(canon, count)}
                                        type={statusTypeForCanonical(canon)}
                                    />
                                </span>
                            );
                        })}
                    </div>
                ) : (
                    '' // children: no chips
                ),
        },
    ];

    const renderCustomRow = () => {
        if (loading) {
            return <Skeleton active paragraph={{ rows: 2, width: '100%' }} />;
        }
        if (!mappedTableData.length) {
            return <span>No permissions found for this role.</span>;
        }
        return <></>;
    };

    const totalPerms =
        typeof data?.totalPermissionCount === 'number'
            ? data.totalPermissionCount
            : (data?.tools ?? []).reduce(
                  (sum: number, t: any) => sum + (t.permissionCount ?? 0),
                  0,
              );

    const getContentForFlyout = () => {
        return loading ? (
            <Skeleton active paragraph={{ rows: 5, width: '100%' }} />
        ) : (
            <div className={styles['secondary-permission-flyout']}>
                <Table
                    columns={columns as any}
                    expandableRows={true}
                    data={mappedTableData as any[]}
                    customRow={renderCustomRow()}
                    pagination={{
                        totalItems: data?.totalRows || 0,
                        pageSize,
                        currentPage,
                        onPageChange: page => setCurrentPage(page),
                        onPageSizeChange: size => setPageSize(size),
                        blankOut: 10,
                        disabled: false,
                    }}
                />
            </div>
        );
    };

    return (
        <Flyout
            direction="right"
            containerMaxWidth="56.5rem"
            heading={`Permissions : ${data?.role ?? ''}`}
            subHeading={
                loading ? (
                    <Skeleton active paragraph={{ rows: 1, width: '100%' }} />
                ) : (
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}
                    >
                        <Counter value={String(totalPerms).padStart(2, '0')} size="Small" />
                        <span>No. of Permissions</span>
                    </div>
                )
            }
            flyoutOpen={toggleFlyout}
            cancelIconClick={onCancelIconClickOfFlyout}
            onBackDropClick={onCancelIconClickOfFlyout}
            iconForCancel={{
                icon: 'x-close',
                onClick: onCancelIconClickOfFlyout,
            }}
            content={getContentForFlyout()}
            id="secondary-permission-flyout"
        />
    );
};

export default SecondaryPermissionsFlyout;
