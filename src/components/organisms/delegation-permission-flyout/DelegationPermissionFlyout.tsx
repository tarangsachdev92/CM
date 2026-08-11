 
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Skeleton, Tooltip } from 'antd';
import { Flyout, Table, Icon, Status, Counter, CheckBox } from 'konnect-react-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { fetchDelegatedRoleView } from '../../../store/thunks/fetchDelegatedRoleView';
import styles from './DelegationPermissionFlyout.module.scss';

const CHIP_ORDER = ['Approved', 'Pending', 'AutoRejected'] as const;
type Canonical = (typeof CHIP_ORDER)[number];

const PENDING_ALIASES = new Set([
  'pending',
  'requested',
  'request',
  'addfailed',
  'add failed',
  'add_failed',
  'cancel initiated',
  'cancel_initiated',
  'cancel-initiated',
]);

// ✅ Added 'auto rejected' (space variant); this is CRITICAL after camel-case splitting.
const AUTOREJ_ALIASES = new Set([
  'auto reject',
  'auto rejected',   // <-- added
  'auto_reject',
  'autorejected',
  'auto-rejected',
  'rejected',
  'deny',
  'denied',
]);

/**
 * Robust canonicalizer:
 * - splits `AutoRejected` -> "Auto Rejected"
 * - unifies separators
 * - collapses multiple spaces
 * - lowercases
 * - checks against aliases (exact) and also resilient includes() guard
 */
const toCanonical = (raw?: string): Canonical | null => {
  const s = (raw || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (!s) return null;

  if (s.includes('approve')) return 'Approved';

  // exact-set checks first
  if (PENDING_ALIASES.has(s)) return 'Pending';
  if (AUTOREJ_ALIASES.has(s)) return 'AutoRejected';

  // fallback resilient checks (handles close variants)
  if (
    s.includes('pending') ||
    s.includes('requested') ||
    s.includes('request') ||
    s.includes('addfailed') ||
    s.includes('add failed') ||
    s.includes('cancel initiated')
  ) {
    return 'Pending';
  }
  if (
    s.includes('auto reject') ||
    s.includes('auto rejected') ||
    s.includes('autorejected') ||
    s.includes('rejected') ||
    s.includes('deny') ||
    s.includes('denied')
  ) {
    return 'AutoRejected';
  }

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
  roleName?: string;
  toolId: number | null;
  toggleFlyout: boolean;
  onCancelIconClickOfFlyout: () => void;
}

type ExpandedRow = {
  key: string;
  appModuleName: string;
  appPermissionName: string;
  isActive: boolean;
};

type StatusSummary = Partial<Record<Canonical, number>>;

type TableRow = {
  key: string;
  toolName: string;
  toolType: string;
  applicationId: string;
  selectedPermissionCount: number;
  expandedRowData: ExpandedRow[];
  statusSummary: StatusSummary;
};

const DelegationPermissionsFlyout = ({
  roleId,
  roleRegion,
  roleName,
  toggleFlyout,
  onCancelIconClickOfFlyout,
}: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading } = useSelector((state: RootState) => state.userToolPermissions);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [openChipKey, setOpenChipKey] = useState<string | null>(null);

  useEffect(() => {
    if (toggleFlyout) {
      setPage(1);
      setPageSize(10);
      setOpenChipKey(null);
    }
  }, [toggleFlyout]);

  useEffect(() => {
    if (!toggleFlyout) return;
    if (!roleId) return;
    dispatch(fetchDelegatedRoleView({ roleId }));
  }, [toggleFlyout, roleId, dispatch]);

  const tools = data && Array.isArray(data.tools) ? (data.tools as any[]) : [];

  const mappedTableData: TableRow[] = useMemo(() => {
    const rows: TableRow[] = [];

    tools.forEach((tool: any, toolIndex: number) => {
      const expanded: ExpandedRow[] = [];
      let activePermCount = 0;

      (tool?.adgroupsList ?? []).forEach((group: any, groupIndex: number) => {
        const perms = Array.isArray(group?.permission) ? group.permission : [];
        perms.forEach((perm: any, permIndex: number) => {
          const isActive = perm?.isActiveAppPermission === true;
          if (isActive) activePermCount += 1;
          const appModuleName = String(perm?.appModuleName ?? perm?.ModuleName ?? '');
          expanded.push({
            key: `perm_${toolIndex}_${groupIndex}_${permIndex}`,
            appModuleName,
            appPermissionName: String(perm?.appPermissionName ?? ''),
            isActive,
          });
        });
      });

      // If your backend’s status is at the GROUP level, keep this.
      // If it’s at the PERMISSION level, move canonicalization inside perms.forEach() and count per-permission instead.
      const statusSummary: StatusSummary = { Approved: 0, Pending: 0, AutoRejected: 0 };
      (tool?.adgroupsList ?? []).forEach((group: any) => {
        const canon = toCanonical(group?.status);
        if (canon) statusSummary[canon] = (statusSummary[canon] ?? 0) + 1;
      });

      rows.push({
        key: `${tool.toolId ?? tool.toolIdAlias ?? toolIndex}_${toolIndex}`,
        toolName: String(tool?.toolName ?? ''),
        toolType: String(tool?.toolType ?? tool?.toolName ?? ''),
        applicationId: String(tool?.toolId ?? tool?.toolIdAlias ?? ''),
        selectedPermissionCount: activePermCount,
        expandedRowData: expanded,
        statusSummary,
      });
    });

    return rows;
  }, [tools]);

  const totalPerms = useMemo(() => {
    let sum = 0;

    mappedTableData.forEach(row => {
      row.expandedRowData.forEach(perm => {
        if (perm.isActive === true) sum += 1;
      });
    });

    return sum;
  }, [mappedTableData]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return mappedTableData.slice(start, end);
  }, [mappedTableData, page, pageSize]);

  const handleTooltipOpenChange = useCallback((key: string, visible: boolean) => {
    setOpenChipKey(prev => (visible ? key : prev === key ? null : prev));
  }, []);

  const columns = [
    {
      key: 'toolName',
      dataIndex: 'application',
      title: 'Tools & Permissions',
      customExpandableColumn: true,
      render: (_: any, record: TableRow | ExpandedRow) =>
        (record as TableRow).expandedRowData ? (
          <div className={styles['application-cell-container']}>
            <Icon name="chevron-down" size="xm" color="neutrals-B300" />
            <div className={styles['header-title']}>
              <span className={styles['application-permissions-cell-title']}>
                {(record as TableRow).toolType} {(record as TableRow).applicationId}
              </span>
              <span className={styles['application-permissions-cell-content']}>
                {(record as TableRow).toolName}
              </span>
            </div>
          </div>
        ) : (
          <div className={styles['header-title']}>
            <span className={styles['application-permissions-cell-title']}>
              {(record as ExpandedRow).appModuleName}
            </span>
            <span className={styles['application-permissions-cell-content']}>
              {(record as ExpandedRow).appPermissionName}
            </span>
          </div>
        ),
    },
    {
      key: 'role',
      dataIndex: 'role',
      title: roleName || 'Role',
      subTitle: `${roleId} | ${roleRegion ?? ''}`,
      render: (_: any, record: TableRow | ExpandedRow) =>
        (record as TableRow).expandedRowData ? (
          <div className={styles['role_permissions_column']}>
            <Counter
              value={
                (record as TableRow).selectedPermissionCount > 9
                  ? (record as TableRow).selectedPermissionCount
                  : `0${(record as TableRow).selectedPermissionCount}`
              }
              size="Small"
            />
          </div>
        ) : (
          <div className={styles['role_permissions_column']}>
            {(() => {
              const isActive = (record as ExpandedRow).isActive;
              if (isActive === true) {
                return <CheckBox onChange={() => {}} checked disabled />;
              }
              if (isActive === false) {
                return <CheckBox onChange={() => {}} checked={false} disabled />;
              }
              return <Icon name="x-close" size="l" color="neutrals-B80" />;
            })()}
          </div>
        ),
    },
    {
      key: 'status',
      dataIndex: 'status',
      title: 'AD Group Access Status',
      render: (_: any, record: TableRow | ExpandedRow) =>
        (record as TableRow).expandedRowData ? (
          <div className={styles['status-summary']}>
            {CHIP_ORDER.map(canon => {
              const count = Number((record as TableRow).statusSummary?.[canon] ?? 0);
              if (!count) return null;
              const text = formatChipText(canon, count);
              const chipKey = `${(record as TableRow).key}__${canon}`;
              return (
                <span key={canon} className={styles['status-chip']}>
                  <Tooltip
                    title={text}
                    placement="top"
                    getPopupContainer={() => document.body}
                    overlayInnerStyle={{ whiteSpace: 'normal' }}
                    overlayStyle={{ zIndex: 20000, maxWidth: 320 }}
                    destroyTooltipOnHide
                    mouseEnterDelay={0.05}
                    mouseLeaveDelay={0.05}
                    open={openChipKey === chipKey}
                    onOpenChange={vis => handleTooltipOpenChange(chipKey, vis)}
                  >
                    <span title="" data-title="" className={styles['status-chip-trigger']}>
                      <Status text={text} type={statusTypeForCanonical(canon)} />
                    </span>
                  </Tooltip>
                </span>
              );
            })}
          </div>
        ) : (
          ''
        ),
    },
  ];

  const showEmpty =
    !loading && (!Array.isArray(mappedTableData) || mappedTableData.length === 0);

  const tableContent = loading ? (
    <Skeleton active paragraph={{ rows: 5, width: '100%' }} />
  ) : showEmpty ? (
    <div className={styles['delegation-permission-flyout']}>
      <div className={styles['empty-state']}>No tools available for this delegated role.</div>
    </div>
  ) : (
    <div className={styles['delegation-permission-flyout']}>
      <Table
        columns={columns as any}
        expandableRows
        data={paginatedData as any[]}
        customRow={
          !paginatedData.length ? <span>No permissions found for this role.</span> : <></>
        }
        pagination={{
          totalItems: mappedTableData.length,
          pageSize,
          currentPage: page,
          onPageChange: (p: number) => setPage(p),
          onPageSizeChange: (size: number) => {
            setPageSize(size);
            setPage(1);
          },
          blankOut: 10,
          disabled: false,
        }}
      />
    </div>
  );

  return (
    <Flyout
      direction="right"
      containerMaxWidth="56.5rem"
      heading="Delegated Role Permissions"
      subHeading={
        loading ? (
          <Skeleton active paragraph={{ rows: 1, width: '100%' }} />
        ) : (
          <div className={styles['subheadingLegend']}>
            <Counter value={String(totalPerms ?? 0).padStart(2, '0')} size="Small" />
            <span>No. of Permissions</span>
          </div>
        )
      }
      flyoutOpen={toggleFlyout}
      cancelIconClick={onCancelIconClickOfFlyout}
      onBackDropClick={onCancelIconClickOfFlyout}
      iconForCancel={{ icon: 'x-close', onClick: onCancelIconClickOfFlyout }}
      content={tableContent}
      id="delegation-permission-flyout"
    />
  );
};

export default DelegationPermissionsFlyout;