 
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Flyout, Table, Icon, Counter, CheckBox } from 'konnect-react-components';
import { Skeleton, Tooltip, Flex } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDelegatedRoleViewByDelegation } from '../../../store/thunks/fetchDelegatedRoleView';
import { RootState, AppDispatch } from '../../../store';
import styles from './DelegationRolePermissionFlyout.module.scss';
import { Label } from '../../atoms';
import { ExpandArrow } from '../../../assets/icons/icons';

interface Props {
    delegationId: number;
    open: boolean;
    onClose: () => void;
}

interface ApiRow {
    roleId: number;
    roleName: string;
    roleRegion: string;
    toolId: number;
    toolName: string;
    toolType: string;
    toolPermissionId: number;
    toolPermissionName: string;
    toolModuleName: string;
    adGroup: string | null;
    isActiveToolPermission: boolean;
}

type RoleMeta = { roleId: number; roleName: string; roleRegion: string };

type ExpandedRow = {
    key: string;
    toolPermissionId: number;
    toolPermissionName: string;
    toolModuleName: string;
    roles: Array<{
        roleId: number;
        isActivePermission: boolean | null;
    }>;
};

type ParentRow = {
    rowIndex: number;
    key: string;
    isEditMode: false;
    toolId: number;
    toolName: string;
    toolType: string;
    roles: Array<{
        roleId: number;
        role: string;
        roleRegion: string;
        permissionCount: number;
    }>;
    noOfRolesTagged: number;
    expandedRowData: ExpandedRow[];
};

function pad2(n: number): string {
    return n > 9 ? String(n) : `0${n}`;
}

const EllipsisWithTooltip = ({
    text,
    onClick,
    className,
}: {
    text: string;
    onClick?: () => void;
    className?: string;
}) => {
    const textRef = useRef<HTMLDivElement>(null);
    const [isOverflowed, setIsOverflowed] = useState(false);
    useEffect(() => {
        const el = textRef.current;
        if (!el) return;
        const t = setTimeout(() => setIsOverflowed(el.scrollWidth > el.clientWidth), 0);
        return () => clearTimeout(t);
    }, [text]);

    return (
        <Tooltip
            title={text}
            placement="bottom"
            overlayClassName="custom-tooltip"
            open={isOverflowed ? undefined : false}
        >
            <div ref={textRef} className={className} onClick={onClick}>
                {text}
            </div>
        </Tooltip>
    );
};

const DelegationRolePermissionFlyout = ({ delegationId, open, onClose }: Props) => {
    const dispatch = useDispatch<AppDispatch>();
    const { data, loading } = useSelector((state: RootState) => state.delegationPermissions);

    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const [visibleRoles, setVisibleRoles] = useState<RoleMeta[]>([]);
    const [allRolesCache, setAllRolesCache] = useState<RoleMeta[]>([]);
    const [toggleState, setToggleState] = useState<{ [toolId: number]: boolean }>({});
    const tableRef = useRef<any>(null);
    const divRefs = useRef<{ [toolId: number]: HTMLDivElement | null }>({});
    const permArrowActive = styles['perm-arrow-icon-active'] ?? '';

    useEffect(() => {
        if (data?.pageSize && data?.pageNumber) {
            setPageSize(Number(data.pageSize));
            setCurrentPage(Number(data.pageNumber));
        }
    }, [data?.pageSize, data?.pageNumber]);

    useEffect(() => {
        if (open && delegationId) {
            const safePage = Math.max(1, currentPage || 1);
            const safeSize = Math.max(1, pageSize || 10);
            dispatch(
                fetchDelegatedRoleViewByDelegation({
                    delegationId,
                    pageNumber: safePage,
                    pageSize: safeSize,
                }),
            );
        }
    }, [open, delegationId, currentPage, pageSize, dispatch]);

    const rows: ApiRow[] = useMemo(() => {
        const raw = (data as any)?.items as ApiRow[] | undefined;
        return Array.isArray(raw) ? raw : [];
    }, [data]);

    const uniqueRoles: RoleMeta[] = useMemo(() => {
        const result: RoleMeta[] = [];
        const seen = new Set<number>();
        for (const r of rows) {
            const rid = r.roleId;
            if (Number.isFinite(rid) && !seen.has(rid)) {
                seen.add(rid);
                result.push({ roleId: rid, roleName: r.roleName, roleRegion: r.roleRegion });
            }
        }
        return result;
    }, [rows]);

    useEffect(() => {
        setAllRolesCache(uniqueRoles);
        setVisibleRoles(uniqueRoles);
    }, [uniqueRoles]);

    const availableRolesInfo = `Available roles : ${visibleRoles.length}`;

    const mappedTableData: ParentRow[] = useMemo(() => {
        const byTool = new Map<
            number,
            {
                toolId: number;
                toolName: string;
                toolType: string;
                rows: ApiRow[];
            }
        >();

        for (const r of rows) {
            const tid = r.toolId;
            if (!Number.isFinite(tid)) continue;
            const g = byTool.get(tid);
            if (g) g.rows.push(r);
            else
                byTool.set(tid, {
                    toolId: tid,
                    toolName: r.toolName,
                    toolType: r.toolType || r.toolName,
                    rows: [r],
                });
        }

        let rowIndex = 0;
        const parents: ParentRow[] = [];

        for (const [, group] of byTool) {
            const permMeta = new Map<number, { name: string; module: string }>();
            for (const r of group.rows) {
                permMeta.set(r.toolPermissionId, {
                    name: r.toolPermissionName,
                    module: r.toolModuleName,
                });
            }

            const roleActiveMap = new Map<number, Map<number, boolean | null>>();
            for (const role of uniqueRoles) {
                roleActiveMap.set(role.roleId, new Map<number, boolean | null>());
            }
            for (const r of group.rows) {
                const perRole = roleActiveMap.get(r.roleId)!;
                // Preserve true | false | null exactly as received (undefined -> null)
                perRole.set(r.toolPermissionId, r.isActiveToolPermission ?? null);
            }

            let idx = 0;
            const expandedRowData: ExpandedRow[] = [];
            for (const [permId, meta] of permMeta.entries()) {
                expandedRowData.push({
                    key: `perm_${group.toolId}_${permId}_${idx++}`,
                    toolPermissionId: permId,
                    toolPermissionName: meta.name,
                    toolModuleName: meta.module,
                    roles: uniqueRoles.map(role => {
                        const v = roleActiveMap.get(role.roleId)!.get(permId);
                        return {
                            roleId: role.roleId,
                            // keep tri-state true | false | null
                            isActivePermission: v ?? null,
                        };
                    }),
                });
            }

            const rolesForParent = uniqueRoles.map(role => {
                let count = 0;
                for (const er of expandedRowData) {
                    const hit = er.roles.find(rr => rr.roleId === role.roleId)?.isActivePermission;
                    if (hit === true) count += 1; // count only active true
                }
                return {
                    roleId: role.roleId,
                    role: role.roleName,
                    roleRegion: role.roleRegion,
                    permissionCount: count,
                };
            });

            const noOfRolesTagged = rolesForParent.filter(r => r.permissionCount > 0).length;

            parents.push({
                rowIndex: rowIndex++,
                key: String(group.toolId),
                isEditMode: false,
                toolId: group.toolId,
                toolName: group.toolName,
                toolType: group.toolType,
                roles: rolesForParent,
                noOfRolesTagged,
                expandedRowData,
            });
        }

        return parents;
    }, [rows, uniqueRoles]);

    const totalPerms = useMemo(() => {
        const serverTotal = (data as any)?.totalPermissionCount;
        if (typeof serverTotal === 'number') return serverTotal;
        if (!mappedTableData.length || !uniqueRoles.length) return 0;
        let sum = 0;
        for (const row of mappedTableData) {
            for (const role of uniqueRoles) {
                const rc = row.roles.find(r => r.roleId === role.roleId)?.permissionCount ?? 0;
                sum += rc;
            }
        }
        return sum;
    }, [data, mappedTableData, uniqueRoles]);

    const handleToggleSwitch = useCallback(
        (parent: ParentRow) => {
            setToggleState(prev => {
                const cleared: Record<number, boolean> = {};
                Object.keys(prev).forEach(k => (cleared[Number(k)] = false));
                const next = { ...cleared, [parent.toolId]: !prev[parent.toolId] };
                if (next[parent.toolId]) {
                    const taggedRoles: RoleMeta[] = parent.roles
                        .filter(r => r.permissionCount > 0)
                        .map(r => {
                            const found = allRolesCache.find(ar => ar.roleId === r.roleId);
                            return (
                                found || {
                                    roleId: r.roleId,
                                    roleName: r.role,
                                    roleRegion: r.roleRegion,
                                }
                            );
                        });
                    setVisibleRoles(taggedRoles);
                } else {
                    setVisibleRoles(allRolesCache);
                }
                tableRef.current?.toogleRowExpandCallBack(parent.rowIndex);
                return next;
            });
        },
        [allRolesCache],
    );

    const resetToggles = useCallback(() => {
        setToggleState({});
        setVisibleRoles(allRolesCache.length ? allRolesCache : uniqueRoles);
    }, [allRolesCache, uniqueRoles]);

    useEffect(() => {
        resetToggles();
    }, [currentPage, pageSize, resetToggles]);

    const columns: any[] = useMemo(() => {
        const firstColumn = {
            key: 'name',
            dataIndex: 'name',
            title: 'Tools & Permissions',
            width: '360px',
            sticky: 'left',
            customExpandableColumn: true,
            render: (_: any, rec: ParentRow | ExpandedRow) => {
                if ('toolId' in rec) {
                    const parent = rec as ParentRow;
                    return (
                        <Flex align="center" justify="space-between" style={{ width: '100%' }}>
                            <Flex align="center" gap={4}>
                                <div
                                    ref={el => (divRefs.current[parent.toolId] = el)}
                                    className={styles['perm-arrow-icon']}
                                    onClick={() => {
                                        if (divRefs.current[parent.toolId]) {
                                            divRefs.current[parent.toolId]!.classList.toggle(
                                                permArrowActive,
                                            );
                                        }
                                    }}
                                    role="none"
                                >
                                    {ExpandArrow()}
                                </div>

                                <div className={styles['name-cell-wrapper']}>
                                    <Label type="body4">
                                        <span className={styles['description-text']}>
                                            {parent.toolType} {parent.toolId}
                                        </span>
                                    </Label>
                                    <EllipsisWithTooltip
                                        text={String(parent.toolName)}
                                        className={`${styles.role} ${styles.roleText}`}
                                    />
                                </div>
                            </Flex>
                        </Flex>
                    );
                }

                const perm = rec as ExpandedRow;
                return (
                    <Tooltip
                        title={
                            <>
                                <div className={styles['tooltip-id-text']}>
                                    #{perm.toolPermissionId}
                                </div>
                            </>
                        }
                        placement="bottomLeft"
                        overlayClassName="permission-tooltip"
                        getPopupContainer={() => document.body}
                    >
                        <div className={styles['permission-tooltip-wrapper']}>
                            <Label type="body4">
                                <span className={styles['description-text']}>
                                    {perm.toolModuleName}
                                </span>
                            </Label>
                            <div className={styles['space-v-8']} />
                            <Label type="body3">
                                <span>{perm.toolPermissionName}</span>
                            </Label>
                        </div>
                    </Tooltip>
                );
            },
        };

        const roleColumns = visibleRoles.map(role => {
            const title = role.roleName || 'Role';
            const subTitle = `${role.roleId} | ${role.roleRegion ?? ''}`;
            return {
                key: String(role.roleId),
                title,
                subTitle,
                dataIndex: `role_${role.roleId}`,
                width: '206px',
                render: (_: any, rec: ParentRow | ExpandedRow) => {
                    if ('toolId' in rec) {
                        const parent = rec as ParentRow;
                        const count =
                            parent.roles.find(r => r.roleId === role.roleId)?.permissionCount ?? 0;
                        return (
                            <div className={styles['role-styles']}>
                                {count > 0 ? (
                                    <Counter value={pad2(count)} size="Small" />
                                ) : (
                                    <Icon name="x-close" size="l" color="neutrals-B80" />
                                )}
                            </div>
                        );
                    }

                    const perm = rec as ExpandedRow;
                    const hit = perm.roles.find(
                        rr => rr.roleId === role.roleId,
                    )?.isActivePermission;
                    return (
                        <div className={styles['role-styles']}>
                            {hit === true ? (
                                <div className={styles.filledSquare}>
                                    <Icon name="check" size="m" color="neutrals-B100" />
                                </div>
                            ) : hit === false ? (
                                <CheckBox onChange={() => {}} checked={false} disabled />
                            ) : (
                                <Icon name="x-close" size="l" color="neutrals-B80" />
                            )}
                        </div>
                    );
                },
            };
        });

        return [firstColumn, ...roleColumns];
    }, [visibleRoles, toggleState, handleToggleSwitch]);

    const tableContent = loading ? (
        <Skeleton active paragraph={{ rows: 5, width: '100%' }} />
    ) : (
        <div className={styles['delegation-permission-flyout']}>
            <Table
                ref={tableRef}
                columns={columns as any}
                expandableRows={true}
                data={mappedTableData as any[]}
                className={styles['table-class']}
                customRow={
                    loading ? (
                        <Skeleton active paragraph={{ rows: 2, width: '100%' }} />
                    ) : !mappedTableData.length ? (
                        <span>No permissions found for this delegation.</span>
                    ) : (
                        <></>
                    )
                }
                pagination={{
                    totalItems: Number(mappedTableData?.length ?? 0),
                    pageSize: Number(data?.pageSize ?? pageSize),
                    currentPage: Number(data?.pageNumber ?? currentPage),
                    additionalInfo: availableRolesInfo,
                    onPageChange: (page: number) => setCurrentPage(page),
                    onPageSizeChange: (size: number) => {
                        setPageSize(size);
                        setCurrentPage(1);
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
                    <div className={styles.subheadingLegend}>
                        <Counter value={String(totalPerms).padStart(2, '0')} size="Small" />
                        <span>No. of Permissions</span>
                    </div>
                )
            }
            flyoutOpen={open}
            cancelIconClick={onClose}
            onBackDropClick={onClose}
            iconForCancel={{ icon: 'x-close', onClick: onClose }}
            content={tableContent}
            id="delegation-role-permission-flyout"
            style={{ zIndex: 1001 }}
        />
    );
};

export default DelegationRolePermissionFlyout;
