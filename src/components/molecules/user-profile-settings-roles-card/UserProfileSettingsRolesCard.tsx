 
import React, { useEffect, useRef, useState } from 'react';
import { Flex, Divider, Avatar } from 'antd';
import { TextButton } from '../../atoms';
import { Icon, Status, ToolTip } from 'konnect-react-components';
import { EditIcon } from '../../../assets/icons/icons';
import { ROLE_TYPE } from '../../../utils/constants';
import { formatDueDate } from '../../../utils/helpers';
import styles from './UserProfileSettingsRolesCard.module.scss';
import type { IDelegateRoleProfile, IUserRole, IDelegateRoleStatusSummary } from '../../../types/response';

interface UserProfileSettingsRolesCardProps {
  roleType: string;
  username?: string;
  roleData?: IUserRole;
  delegateData?: IDelegateRoleProfile;
  isSecondaryRoleAdded?: boolean;
  onClickHandlerForRoleDelete?: (roleData: { roleId: number }) => void;
  onEditClick?: () => void;
  onCardClick?: () => void;
  assignedStartDate?: string | number | Date | null;
  assignedEndDate?: string | number | Date | null;
  delegateStatusSummaryList?: IDelegateRoleStatusSummary[];
}

function formatDate_DD_MMM_YYYY(input?: string | number | Date | null): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  const fmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const parts = fmt.formatToParts(d);
  const day = parts.find(p => p.type === 'day')?.value ?? '';
  const month = parts.find(p => p.type === 'month')?.value ?? '';
  const year = parts.find(p => p.type === 'year')?.value ?? '';
  if (!day || !month || !year) return null;
  const dd = String(Number(day));
  return `${dd} ${month} ${year}`;
}

function formatDateRange_DD_MMM_YYYY(start?: string | number | Date | null, end?: string | number | Date | null): string {
  const s = formatDate_DD_MMM_YYYY(start);
  const e = formatDate_DD_MMM_YYYY(end);
  if (s && e) return `${s} - ${e}`;
  if (s && !e) return `${s} - Ongoing`;
  if (!s && e) return `— - ${e}`;
  return '—';
}

function formatDueDateSafe(input?: string | number | Date | null): string {
  if (input == null) return 'Not available';
  let d: Date;
  if (input instanceof Date) d = input;
  else if (typeof input === 'number' || typeof input === 'string') d = new Date(input);
  else return 'Not available';
  if (Number.isNaN(d.getTime())) return 'Not available';
  return formatDueDate(d.toISOString());
}

/** ✅ FIXED: Add robust handling for "AutoRejected" variants (including camel-case split → "auto rejected") */
function toCanonicalStatus(raw?: string): 'Approved' | 'Pending' | 'AutoRejected' | null {
  // Normalize: split CamelCase, unify separators, trim, lowercase
  const s = (raw || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (!s) return null;

  if (s.includes('approve')) return 'Approved';

  const PENDING = new Set([
    'pending',
    'requested',
    'request',
    'addfailed',
    'add failed',
    'cancel initiated',
  ]);

  // ✅ include 'auto rejected' (space) plus other common variants
  const AUTOREJ = new Set([
    'auto reject',
    'auto rejected',
    'autorejected',
    'auto-rejected', // retained in case some callers skip the replace
    'rejected',
    'deny',
    'denied',
  ]);

  if (PENDING.has(s)) return 'Pending';
  if (AUTOREJ.has(s)) return 'AutoRejected';
  return null;
}

function UserProfileSettingsRolesCard({
  roleType,
  username = '',
  roleData,
  delegateData,
  isSecondaryRoleAdded,
  onClickHandlerForRoleDelete,
  onEditClick,
  onCardClick,
  assignedStartDate,
  assignedEndDate,
  delegateStatusSummaryList,
}: Readonly<UserProfileSettingsRolesCardProps>) {
  const [displayDeleteIcon, setDisplayDeleteIcon] = useState<'role-trash-icon-hide' | 'role-trash-icon-show'>('role-trash-icon-hide');
  const [displayEditIcon, setDisplayEditIcon] = useState<'edit-icon-hide' | 'edit-icon-show'>('edit-icon-hide');

  const isDelegated = roleType === ROLE_TYPE.DELEGATED;
  const isPrimary = roleType === ROLE_TYPE.PRIMARY;

  const getInitialsFromUsername = (name: string) => {
    if (!name) return '';
    return name.split(' ').filter(Boolean).map(n => n[0]?.toUpperCase() ?? '').join('');
  };

  const getIconForRoleType = (rt: string) => {
    switch (rt) {
      case ROLE_TYPE.PRIMARY:
        return (
          <span id="primary-role-type-icon">
            <Icon name="user-01" size="xm" color="primary-green-500-color" />
          </span>
        );
      case ROLE_TYPE.SECONDARY:
        return (
          <span id="primary-role-type-icon">
            <Icon name="user-down-01" size="xm" color="primary-green-500-color" />
          </span>
        );
      case ROLE_TYPE.DELEGATED:
        return (
          <span id="non-primary-role-type-icon">
            <Icon name="users-down" size="xm" color="primary-green-500-color" />
          </span>
        );
      default:
        return <></>;
    }
  };

  const displayDeleteIconAgainstRole = (e: React.MouseEvent) => {
    e.preventDefault();
    setDisplayDeleteIcon('role-trash-icon-show');
  };
  const hideDeleteIconAgainstRole = (e: React.MouseEvent) => {
    e.preventDefault();
    setDisplayDeleteIcon('role-trash-icon-hide');
  };
  const displayEditIconAgainstRole = (e: React.MouseEvent) => {
    e.preventDefault();
    setDisplayEditIcon('edit-icon-show');
  };
  const hideEditIconAgainstRole = (e: React.MouseEvent) => {
    e.preventDefault();
    setDisplayEditIcon('edit-icon-hide');
  };

  let effectiveRoleData: IUserRole | undefined = roleData;

  if (isDelegated && delegateData) {
    const rid = delegateData.roleId;
    let approved = 0;
    let pending = 0;
    let autoRejected = 0;

    if (Array.isArray(delegateStatusSummaryList) && delegateStatusSummaryList.length) {
      delegateStatusSummaryList
        .filter(s => Number(s.roleId) === Number(rid))
        .forEach(s => {
          const canon = toCanonicalStatus(s.status);
          const c = Number(s.statusCount || 0);
          if (canon === 'Approved') approved += c;
          else if (canon === 'Pending') pending += c;
          else if (canon === 'AutoRejected') autoRejected += c;
        });
    } else {
      const raw = (delegateData.status || '').toLowerCase();
      const fallbackCount = typeof delegateData.permissionCount === 'number' ? delegateData.permissionCount : 0;
      approved = raw.includes('approve') ? fallbackCount : 0;
      pending = raw.includes('pending') || raw.includes('request') || raw.includes('addfailed') ? fallbackCount : 0;
      autoRejected =
        raw.includes('auto reject') ||
        raw.includes('autorejected') ||
        raw.includes('auto_reject') ||
        raw.includes('rejected')
          ? fallbackCount
          : 0;
    }

    const chips: IUserRole['statusChips'] = {
      Approved: approved,
      Pending: pending,
      Requested: 0,
      AddFailed: 0,
      AutoRejected: autoRejected,
    };

    effectiveRoleData = {
      roleId: delegateData.roleId,
      role: delegateData.roleName,
      roleGeoName: delegateData.roleRegion,
      region: delegateData.roleRegion,
      levelName: '',
      subFunctionName: '',
      departmentName: '',
      adgroupsList: roleData?.adgroupsList ?? [],         // ← keep AD groups from incoming roleData
      isAnyADGroupRequested: true,
      isAnyADGroupPending: (chips?.Pending ?? 0) > 0,
      statusChips: chips,
    } as IUserRole;
  }

  const leftTitle = isDelegated
    ? `${delegateData?.roleName ?? ''} - ${delegateData?.roleRegion ?? ''}`
    : `${roleData?.levelName ?? ''} - ${roleData?.role ?? ''}`;

  const leftSub = isDelegated
    ? ''
    : `${roleData?.roleGeoName ?? ''} ${roleData?.subFunctionName ?? ''} ${roleData?.departmentName ?? ''}`
        .replace(/\s+/g, ' ')
        .trim();

  const textClass = isDelegated
    ? styles['role-request-approved-text']
    : roleData?.isAnyADGroupRequested
    ? styles['role-request-approved-text']
    : styles['role-request-unapproved-disabled-text'];

  const delegatedDuration = isDelegated ? formatDateRange_DD_MMM_YYYY(assignedStartDate, assignedEndDate) : null;

  return (
    <Flex
      justify="space-between"
      align="center"
      wrap="wrap"
      className={styles['role-container']}
      onMouseEnter={isPrimary ? displayEditIconAgainstRole : displayDeleteIconAgainstRole}
      onMouseLeave={isPrimary ? hideEditIconAgainstRole : hideDeleteIconAgainstRole}
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onCardClick?.();
      }}
    >
      <Flex justify="space-between" align="center" gap="8px">
        {getIconForRoleType(roleType)}
        <span className={textClass}>
          {leftTitle}
          <br />
          {leftSub}
        </span>
      </Flex>

      <RolesCardRightContent
        roleType={roleType}
        roleData={effectiveRoleData}
        displayClassName={isPrimary ? displayEditIcon : displayDeleteIcon}
        onClickHandlerForRoleDelete={onClickHandlerForRoleDelete}
        onEditClick={onEditClick}
        isSecondaryRoleAdded={isSecondaryRoleAdded}
        delegateData={delegateData}
        assignedStartDate={assignedStartDate}
      />

      {isDelegated && (
        <Flex align="center" gap="8px" style={{ flexBasis: '100%', marginTop: 4 }}>
          <Avatar className={styles['delegated-role-avatar']} size={24}>
            {getInitialsFromUsername(username)}
          </Avatar>
          <span className={styles['delegated-role-avatar-text-content']}>
            Assigned by :&nbsp;{username || '—'}
          </span>
          <Divider type="vertical" className={styles['vertical-divider']} />
          <div className={styles['delegated-role-date']}>{delegatedDuration}</div>
        </Flex>
      )}
    </Flex>
  );
}

interface RolesCardRightContentProps
  extends Pick<
    UserProfileSettingsRolesCardProps,
    'roleType' | 'roleData' | 'onEditClick' | 'onClickHandlerForRoleDelete' | 'isSecondaryRoleAdded'
  > {
  displayClassName: string;
  delegateData?: IDelegateRoleProfile;
  assignedStartDate?: string | number | Date | null;
}

enum RoleStatusChips {
  Approved = 'Approved',
  Pending = 'Pending',
  AutoReject = 'Auto Reject',
}

export function RolesCardRightContent({
  roleType,
  roleData,
  displayClassName,
  isSecondaryRoleAdded,
  onEditClick,
  onClickHandlerForRoleDelete,
  delegateData,
  assignedStartDate,
}: RolesCardRightContentProps) {
  const [showStatusChipButton, setShowStatusChipButton] = useState(false);
  const rolesCardRightContentRef = useRef<{ statusChipButtonText: RoleStatusChips }>({
    statusChipButtonText: RoleStatusChips.Approved,
  });
  const statusChipButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showStatusChipButton) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (statusChipButtonRef.current?.contains(target)) return;
      if (target.closest('.status-chips, .status-chip-button, .status-chip-button-inner')) return;
      setShowStatusChipButton(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showStatusChipButton]);

  if (!roleData) {
    return (
      <div>
        <span className={styles['access-requested-badge']}>Access Requested</span>
      </div>
    );
  }

  const getIconToDisplayAgainstRole = (rt: string) => {
    if (rt === ROLE_TYPE.PRIMARY && roleData.isAnyADGroupRequested && !isSecondaryRoleAdded) {
      return (
        <span
          role="none"
          onClick={(e) => {
            e.stopPropagation();
            onEditClick?.();
          }}
          className={styles[displayClassName]}
        >
          <EditIcon />
        </span>
      );
    }
    if (rt === ROLE_TYPE.SECONDARY) {
      return (
        <TextButton
          onClick={(e) => {
            e.stopPropagation();
            if (onClickHandlerForRoleDelete && roleData.roleId) {
              onClickHandlerForRoleDelete({ roleId: roleData.roleId });
            }
          }}
        >
          <span className={styles[displayClassName]}>
            <Icon name="trash-01" size="xm" color="neutrals-B800" />
          </span>
        </TextButton>
      );
    }
    return <></>;
  };

  const getPendingCount = (statusChips: IUserRole['statusChips']) => {
    if (!statusChips) return 0;
    return (statusChips.Pending ?? 0) + (statusChips.Requested ?? 0) + (statusChips.AddFailed ?? 0);
  };

  const hasAnyRequest = !!(roleData.isAnyADGroupRequested || roleData.isAnyADGroupPending);

  if (!hasAnyRequest) {
    return (
      <div>
        <span className={styles['access-requested-badge']}>Access Requested</span>
      </div>
    );
  }

  const toDate = (v: any): Date | null => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  // ✅ Keep your original tooltip logic and JSX
  // Requested On = earliest adgroup.requestedOn; delegated fallback
  let requestedOn: Date | null = null;
  if (roleData?.adgroupsList?.length) {
    const reqDates =
      roleData.adgroupsList
        .map((g: any) => toDate(g?.requestedOn))
        .filter(Boolean)
        .sort((a, b) => a!.getTime() - b!.getTime()) ?? [];
    requestedOn = (reqDates[0] as Date) ?? null;
  }
  if (!requestedOn && roleType === ROLE_TYPE.DELEGATED) {
    requestedOn = toDate(delegateData?.startDate) ?? toDate(assignedStartDate);
  }

  // Approved On = latest updatedOn among status === Approved
  let approvedOn: Date | null = null;
  for (const g of roleData?.adgroupsList ?? []) {
    // (kept as-is)
    if (canonStatus((g as any)?.status) === 'Approved') {
      const d = toDate((g as any)?.updatedOn);
      if (d && (!approvedOn || d > approvedOn)) approvedOn = d;
    }
  }

  // Auto Rejected On = latest updatedOn among status === AutoRejected
  let autoRejectedOn: Date | null = null;
  for (const g of roleData?.adgroupsList ?? []) {
    // (kept as-is)
    if (canonStatus((g as any)?.status) === 'AutoRejected') {
      const d = toDate((g as any)?.updatedOn);
      if (d && (!autoRejectedOn || d > autoRejectedOn)) autoRejectedOn = d;
    }
  }

  function canonStatus(raw?: string): 'Approved' | 'Pending' | 'AutoRejected' | null {
    const s = (raw || '').toLowerCase().replace(/[_-]/g, ' ').trim();
    if (s.includes('approve')) return 'Approved';
    if (['pending', 'requested', 'request', 'addfailed', 'add failed', 'cancel initiated'].includes(s)) return 'Pending';
    if (['auto rejected', 'autorejected', 'auto reject', 'rejected', 'deny', 'denied'].includes(s)) return 'AutoRejected';
    return null;
  }

  const tooltipApproved = (
     <div>
            <div className={styles['tooltip-font']}>
                Requested on{' '}
                <span className={styles['tooltipContentNowrap']}>
                    {formatDueDateSafe(requestedOn)}
                </span>
            </div>
            <div className={styles['tooltip-font']}>
                Approved on{' '}
                <span className={styles['tooltipContentNowrap']}>
                    {formatDueDateSafe(approvedOn)}
                </span>
            </div>
        </div>
  );
  const tooltipPending =   <div className={styles['tooltip-font']}>Requested on {formatDueDateSafe(requestedOn)}</div>;
  const tooltipAutoRejected = (
      <div>
            <div className={styles['tooltip-font']}>
                Requested on{' '}
                <span className={styles['tooltipContentNowrap']}>
                    {formatDueDateSafe(requestedOn)}
                </span>
            </div>
            <div className={styles['tooltip-font']}>
                Auto Rejected on{' '}
                <span className={styles['tooltipContentNowrap']}>
                    {formatDueDateSafe(autoRejectedOn)}
                </span>
            </div>
        </div>
  );
  /** -------------------- END Tooltip dates -------------------- */

  return (
    <Flex gap="6px">
      {(roleData.statusChips?.Approved ?? 0) > 0 && (
        <ToolTip
          type="Text Only"
          direction="Top-Center"
          text={tooltipApproved}
          wrapperComponent={
            <span title="" data-title="">
              <Status text={`Approved (${roleData.statusChips?.Approved ?? 0})`} type="Success" />
            </span>
          }
        />
      )}

      {getPendingCount(roleData.statusChips ?? {}) > 0 && (
        <ToolTip
          type="Text Only"
          direction="Top-Center"
          text={tooltipPending}
          wrapperComponent={
            <TextButton
              onClick={(e) => {
                e.stopPropagation();
                rolesCardRightContentRef.current.statusChipButtonText = RoleStatusChips.Pending;
                setShowStatusChipButton(true);
              }}
            >
              <span title="" data-title="">
                <Status
                  text={`Pending (${getPendingCount(roleData.statusChips ?? {})})`}
                  type="Alert"
                  className="status-chips"
                />
              </span>
            </TextButton>
          }
        />
      )}

      {(roleData.statusChips?.AutoRejected ?? 0) > 0 && (
        <ToolTip
          type="Text Only"
          direction="Top-Center"
          text={tooltipAutoRejected}
          wrapperComponent={
            <TextButton
              onClick={(e) => {
                e.stopPropagation();
                rolesCardRightContentRef.current.statusChipButtonText = RoleStatusChips.AutoReject;
                setShowStatusChipButton(true);
              }}
            >
              <span title="" data-title="">
                <Status
                  text={`Auto Reject (${roleData.statusChips?.AutoRejected ?? 0})`}
                  type="Warning"
                  className="status-chips"
                />
              </span>
            </TextButton>
          }
        />
      )}

      {showStatusChipButton && (
        <Flex justify="flex-start" align="flex-end" style={{ flexDirection: 'column' }}>
          <div ref={statusChipButtonRef} className={styles['status-chip-button']}>
            <TextButton>
              <div className={styles['status-chip-button-inner']}>
                {rolesCardRightContentRef.current.statusChipButtonText === RoleStatusChips.Pending
                  ? 'Check Status in IAM'
                  : rolesCardRightContentRef.current.statusChipButtonText === RoleStatusChips.AutoReject
                  ? 'Resend Request'
                  : ''}
              </div>
            </TextButton>
          </div>
        </Flex>
      )}
      {roleType && getIconToDisplayAgainstRole(roleType)}
    </Flex>
  );
}

export default UserProfileSettingsRolesCard;