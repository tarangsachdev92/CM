 
import React, { useEffect, useRef, useState } from 'react';
import { Flex, Divider, Avatar } from 'antd';
import { TextButton } from '../../atoms';
import { FilterChip, IconButton, Status, ToolTip } from 'konnect-react-components';
import { ROLE_TYPE } from '../../../utils/constants';
import { formatDueDate } from '../../../utils/helpers';
import styles from './UserProfileSettingsRolesCard.module.scss';
import type { IDelegateRoleProfile, IDelegateRoleStatusSummary, IUserRoleStatus, UserRoleDetails } from '../../../types/response';

interface UserProfileSettingsRolesCardProps {
    roleType: string;
    username?: string;
    roleData?: UserRoleDetails;
    delegateData?: IDelegateRoleProfile;
    isSecondaryRoleAdded?: boolean;
    onClickHandlerForRoleDelete?: (roleData: { roleId: number }) => void;
    onEditClick?: () => void;
    onCardClick?: () => void;
    assignedStartDate?: string | number | Date | null;
    assignedEndDate?: string | number | Date | null;
    delegateStatusSummaryList?: IDelegateRoleStatusSummary[];
    clickHandlerForAutoReject?: any;
    openFlyout?: any;
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

function UserProfileSettingsRolesCardNew({
    roleType,
    roleData,
    delegateData,
    isSecondaryRoleAdded,
    onClickHandlerForRoleDelete,
    onEditClick,
    onCardClick,
    assignedStartDate,
    clickHandlerForAutoReject,
}: Readonly<UserProfileSettingsRolesCardProps>) {
  const [displayDeleteIcon, setDisplayDeleteIcon] = useState<'role-trash-icon-hide' | 'role-trash-icon-show'>('role-trash-icon-hide');
  const [displayEditIcon, setDisplayEditIcon] = useState<'edit-icon-hide' | 'edit-icon-show'>('edit-icon-hide');

    const isDelegated = roleType === ROLE_TYPE.DELEGATED;
    const isPrimary = roleType === ROLE_TYPE.PRIMARY;

    const getInitialsFromUsername = () => {
        if (!roleData?.assignedByUser) return '';
    return roleData?.assignedByUser.split(' ').filter(Boolean).map(n => n[0]?.toUpperCase() ?? '').join('');
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

    const roleName = roleData?.roleName;

  const geography = roleData?.geographyName || ''

  const leftSub = `${roleData?.subFunctionName ?? ''} ${roleData?.departmentName ?? ''} , ${geography}`
            .replace(/\s+/g, ' ')
            .trim();

  const delegatedDuration = isDelegated ? formatDateRange_DD_MMM_YYYY(roleData?.delegationStartDate, roleData?.delegationEndDate) : null;

    const brandAttr = isPrimary
        ? (roleData as any).userPrimaryRoleAttributes?.filter(
              (item: { attributeName: string }) => item.attributeName === 'Brand',
          )
        : (roleData as any)?.attributes || [];
    const hasApprovedAccess =
        roleData?.statusCounts?.some(
            status => status.status.toLowerCase() === 'approved' && status.statusCount > 0,
        ) ?? false;
    return (
        <Flex
            justify="space-between"
            align="center"
            wrap="wrap"
            className={styles['role-container-new']}
            onMouseEnter={
                isPrimary && !hasApprovedAccess
                    ? displayEditIconAgainstRole
                    : !isPrimary
                      ? displayDeleteIconAgainstRole
                      : undefined
            }
            onMouseLeave={
                isPrimary && !hasApprovedAccess
                    ? hideEditIconAgainstRole
                    : !isPrimary
                      ? hideDeleteIconAgainstRole
                      : undefined
            }
            onClick={onCardClick}
            role="button"
            tabIndex={0}
      onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onCardClick?.();
            }}
        >
            <Flex justify="space-between" gap="8px" vertical>

        <span className={styles['leftTitle']}>
          {roleName}
        </span>

        {roleData?.subFunctionName && <span className={styles['leftSub']}>
          {leftSub}
        </span>}
        <Flex gap={12} style={{ marginTop: 10 }}>
          <FilterChip
            showCloseIcon={false}
            key="filter-chip"
            label={
              (roleData as any)?.geographyName
            }
                        style={{
                            backgroundColor: '#F3FAF9',
                            borderColor: '#B0E7DF',
                            borderWidth: 1
                        }}
                        title="Location "
                    />
                    {brandAttr?.map((attr: any) => (
                        <FilterChip
                            showCloseIcon={false}
                            charLimit={50}
                            key={attr.attributeId}
                            label={attr.attributeValueNames || 'N/A'}
                            title={`${attr.attributeName} `}
                            style={{
                                backgroundColor: '#F3FAF9',
                                borderColor: '#B0E7DF',
                                borderWidth: 1,
                            }}
                            className={styles['filter-chip-style']}
                        />
                    ))}
                </Flex>
            </Flex>

            <RolesCardRightContent
                roleType={roleType}
                roleData={roleData}
                displayClassName={isPrimary ? displayEditIcon : displayDeleteIcon}
                onClickHandlerForRoleDelete={onClickHandlerForRoleDelete}
                onEditClick={onEditClick}
                isSecondaryRoleAdded={isSecondaryRoleAdded}
                delegateData={delegateData}
                assignedStartDate={assignedStartDate}
                clickHandlerForAutoReject={clickHandlerForAutoReject}
                statusData={roleData?.statusCounts}
            />

            {isDelegated && (
                <Flex align="center" gap="8px" style={{ flexBasis: '100%', marginTop: 12 }}>
                    <Avatar className={styles['delegated-role-avatar']} size={24}>
                        {getInitialsFromUsername()}
                    </Avatar>
                    <span className={styles['delegated-role-avatar-text-content']}>
                        Assigned by :&nbsp;{roleData?.assignedByUser || '—'}
                    </span>
                    <Divider type="vertical" className={styles['vertical-divider']} />
                    <div className={styles['delegated-role-avatar-text-content']}>
                        {delegatedDuration}
                    </div>
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
    clickHandlerForAutoReject?: any;
    statusData?: IUserRoleStatus[];
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
    onEditClick,
    onClickHandlerForRoleDelete,
    statusData,
    clickHandlerForAutoReject,
}: Readonly<RolesCardRightContentProps>) {
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
            if (target.closest('.status-chips, .status-chip-button, .status-chip-button-inner'))
                return;
            setShowStatusChipButton(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showStatusChipButton]);

    const getIconToDisplayAgainstRole = (rt: string) => {
        if (rt === ROLE_TYPE.SECONDARY) {
            return (
                <div className={styles[displayClassName]}>
                    <IconButton
                        onClick={() => {
                            if (onClickHandlerForRoleDelete && (roleData as any).roleId) {
                                onClickHandlerForRoleDelete({ roleId: (roleData as any).roleId });
                            }
                        }}
                        icon="trash-01"
                        size="Small"
                    />
                </div>
            );
        } else if (rt === ROLE_TYPE.PRIMARY) {
            const hasApprovedAccess =
                statusData?.some(
                    status => status.status.toLowerCase() === 'approved' && status.statusCount > 0,
                ) ?? false;

            if (hasApprovedAccess) {
                return null;
            }

            return (
            <div className={styles[displayClassName]}>
              <IconButton
                  icon="edit-01"
                  size="Small"
                  onClick={() => {
                    onEditClick?.();
                  }}
              />
            </div>);
        }
        return <></>;
    };

    const getRequestedOnDate = (status: string) => {
        const statusObj = statusData?.find((item: { status: string }) => item.status === status);
        return statusObj?.requestedOn || new Date();
    };

    const getUpdatedOnDate = (status: string) => {
        const statusObj = statusData?.find((item: { status: string }) => item.status === status);
        return statusObj?.updatedOn || new Date();
    };

    const tooltipDenied = (
        <div>
            <div className={styles['tooltip-font']}>
                Requested on{' '}
                <span className={styles['tooltipContentNowrap']}>
                    {formatDueDateSafe(getRequestedOnDate('Approved'))}
                </span>
            </div>
            <div className={styles['tooltip-font']}>
                Denied on{' '}
                <span className={styles['tooltipContentNowrap']}>
                    {formatDueDateSafe(getUpdatedOnDate('Approved'))}
                </span>
            </div>
        </div>
    );

    const tooltipApproved = (
        <div>
            <div className={styles['tooltip-font']}>
                Requested on{' '}
                <span className={styles['tooltipContentNowrap']}>
                    {formatDueDateSafe(getRequestedOnDate('Approved'))}
                </span>
            </div>
            <div className={styles['tooltip-font']}>
                Approved on{' '}
                <span className={styles['tooltipContentNowrap']}>
                    {formatDueDateSafe(getUpdatedOnDate('Approved'))}
                </span>
            </div>
        </div>
    );
    const tooltipPending = (
        <div className={styles['tooltip-font']}>
            Requested on {formatDueDateSafe(getRequestedOnDate('Pending'))}
        </div>
    );
    const tooltipAutoRejected = (
        <div>
            <div className={styles['tooltip-font']}>
                Requested on{' '}
                <span className={styles['tooltipContentNowrap']}>
                    {formatDueDateSafe(getRequestedOnDate('Auto-Rejected'))}
                </span>
            </div>
            <div className={styles['tooltip-font']}>
                Auto Rejected on{' '}
                <span className={styles['tooltipContentNowrap']}>
                    {formatDueDateSafe(getUpdatedOnDate('Auto-Rejected'))}
                </span>
            </div>
        </div>
    );
    /** -------------------- END Tooltip dates -------------------- */

    const handleStatusChipButton = () => {
        if (rolesCardRightContentRef.current.statusChipButtonText === RoleStatusChips.Pending) {
            window.open(
                'https://kenvue.identitynow.com/ui/d/approvals',
                '_blank',
                'noopener,noreferrer',
            );
        } else {
            // triggers AD group request only for that particular tool and not all the tools for the role.
            clickHandlerForAutoReject();
        }
    };

    const getApprovedCount = () => {
        return (
            statusData?.find(
                (item: { status: string }) => item.status.toLocaleLowerCase() === 'approved',
            )?.statusCount || 0
        );
    };

    const getPendingReqCount = () => {
        return (
            statusData?.find(
                (item: { status: string }) => item.status.toLocaleLowerCase() === 'pending',
            )?.statusCount || 0
        );
    };

    const getAutoRejectCount = () => {
        return (
            statusData?.find(
                (item: { status: string }) => item.status.toLocaleLowerCase() === 'reject',
            )?.statusCount || 0
        );
    };

    const getDeniedCount = () => {
        return (
            statusData?.find(
                (item: { status: string }) => item.status.toLocaleLowerCase() === 'deny',
            )?.statusCount || 0
        );
    };

    //deny
    return (
        <Flex gap="6px">
            {getApprovedCount() > 0 && (
                <ToolTip
                    type="Text Only"
                    direction="Top-Center"
                    text={tooltipApproved}
                    wrapperComponent={
                        <Status text={`Approved (${getApprovedCount()})`} type="Success" />
                    }
                />
            )}

            {getDeniedCount() > 0 && (
                <ToolTip
                    type="Text Only"
                    direction="Top-Center"
                    text={tooltipDenied}
                    wrapperComponent={
                        <Status text={`Denied (${getDeniedCount()})`} type="Warning" />
                    }
                />
            )}

            {getPendingReqCount() > 0 && (
                <ToolTip
                    type="Text Only"
                    direction="Top-Center"
                    text={tooltipPending}
                    wrapperComponent={
                        <TextButton
                            onClick={e => {
                                e.stopPropagation();
                                rolesCardRightContentRef.current.statusChipButtonText =
                                    RoleStatusChips.Pending;
                                setShowStatusChipButton(true);
                            }}
                        >
                            <span title="" data-title="">
                                <Status
                                    text={`Approval Pending (${getPendingReqCount()})`}
                                    type="Alert"
                                    className="status-chips"
                                />
                            </span>
                        </TextButton>
                    }
                />
            )}

            {getAutoRejectCount() > 0 && (
                <ToolTip
                    type="Text Only"
                    direction="Top-Center"
                    text={tooltipAutoRejected}
                    wrapperComponent={
                        <TextButton
                            onClick={e => {
                                e.stopPropagation();
                                rolesCardRightContentRef.current.statusChipButtonText =
                                    RoleStatusChips.AutoReject;
                                setShowStatusChipButton(true);
                            }}
                        >
                            <span title="" data-title="">
                                <Status
                                    text={`Auto-Reject (${getAutoRejectCount()})`}
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
                        <TextButton
                            onClick={(e: any) => {
                                e.stopPropagation();
                                handleStatusChipButton();
                            }}
                        >
                            <div className={styles['status-chip-button-inner']}>
                                {rolesCardRightContentRef.current.statusChipButtonText ===
                                RoleStatusChips.Pending
                                    ? 'Check Status in IAM'
                                    : rolesCardRightContentRef.current.statusChipButtonText ===
                                        RoleStatusChips.AutoReject
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

export default UserProfileSettingsRolesCardNew;
