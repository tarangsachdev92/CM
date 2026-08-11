// PermissionFlyout.tsx
import { Counter, Flyout, Toast } from 'konnect-react-components';
import { Flex } from 'antd';
import { useState } from 'react';
import { DelegationRole } from '../../../types/response';
import { DelegationRequestPayload, ToolFeature } from '../../../types/request';
import { getCurrentUserEmail } from '../../../utils/helpers';
import { fetchDelegationsNew } from '../../../store/thunks/delegationThunks';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import DelegatedToolsTableNew from './DelegatedToolsTableNew';
import { editDelegationNew, saveDelegationNew } from '../../../services/delegationNew';

interface DelegationConfirmationFlyoutProps {
    open: boolean;
    roleIds: string;
    toolIds: string;
    selectedRoleDetails: DelegationRole[];
    selectedUser: any;
    startDate: any;
    endDate: any;
    newToolIds?: string;
    isEditModeOn: boolean;
    delegationId?: number;

    onClose: () => void;
    onCloseAll: () => void;
}

const DelegationConfirmationFlyoutNew = ({
    open,
    roleIds,
    toolIds,
    selectedRoleDetails,
    selectedUser,
    startDate,
    endDate,
    onClose,
    onCloseAll,
    isEditModeOn,
    newToolIds,
    delegationId,
}: Readonly<DelegationConfirmationFlyoutProps>) => {
    const heading = 'Delegated Role Permissions New';
    const [totalPermissions, setTotalPermissions] = useState<number>(0);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [toggleToast, setToggleToast] = useState<boolean>(false);
    const [toggleErrorToast, setToggleErrorToast] = useState<boolean>(false);
    const [successMsg, setSuccessMsg] = useState<string>('');
    const dispatch = useDispatch<AppDispatch>();
    const { pageNumber, pageSize } = useSelector((s: RootState) => s.delegationNew);

    type PermMap = Record<
        number, // roleId
        Record<
            number, // toolId
            {
                toolId: number;
                features: Record<number, ToolFeature>; // key: toolPermissionId
            }
        >
    >;

    const [permMap, setPermMap] = useState<PermMap>({});
    const onPermissionsSnapshot = (map: PermMap) => {
        // Replace the current map with the snapshot from the table
        setPermMap(map);
    };

    const formatDate = (d: any) => {
        if (!d) return '';
        try {
            const dateObj = d instanceof Date ? d : new Date(d);

            // Use en-GB for day-first order and 2-digit day
            const fmt = new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });

            const parts = fmt.formatToParts(dateObj);
            const day = parts.find(p => p.type === 'day')?.value ?? '';
            const month = parts.find(p => p.type === 'month')?.value ?? '';
            const year = parts.find(p => p.type === 'year')?.value ?? '';

            return `${day} ${month}, ${year}`; // e.g., "03 February, 2025"
        } catch {
            return String(d);
        }
    };

    const n = (v: any, fb = 0) => (Number.isFinite(Number(v)) ? Number(v) : fb);
    const s = (v: any, fb = '') => v ?? fb;

    const buildIamRolesFromSelections = (onlyToolIds?: Set<number>) => {
        return (
            (selectedRoleDetails ?? [])
                .map((r: any) => {
                    const roleId = n(r.roleId);
                    const toolMap = permMap[roleId] ?? {};

                    const tools = Object.values(toolMap)
                        // If filter present (edit), keep only those; otherwise (create) keep all
                        .filter((t: any) => {
                            const id = n(t.toolId);
                            return isEditModeOn
                                ? onlyToolIds?.has(id) === true // in edit mode include only "new" tools; empty/undefined => include none
                                : true; // in create mode include all
                        })
                        .map((t: any) => {
                            // --- your existing grouping logic (unchanged) ---
                            const groups = new Map<
                                string,
                                { adGroupId: string; adGroup: string; features: ToolFeature[] }
                            >();

                            Object.values(t.features ?? {}).forEach((feat: any) => {
                                const adGroupId = String((feat as any).adGroupId ?? '');
                                const adGroup = String((feat as any).adGroup ?? '');
                                const key = `${adGroupId}\n${adGroup}`;
                                if (!groups.has(key))
                                    groups.set(key, { adGroupId, adGroup, features: [] });
                                groups.get(key)!.features.push(feat);
                            });

                            const adGroups = Array.from(groups.values()).map(g => ({
                                adGroup: g.adGroup,
                                adGroupId: g.adGroupId,
                                toolFeature: g.features,
                            }));

                            return { toolId: t.toolId, adGroups };
                        });

                    return {
                        roleId,
                        role: s(r.role),
                        roleLevelName: s(r.roleLevelName),
                        subFunctionName: s(r.subFunctionName),
                        functionID: n(r.functionID),
                        subFunctionID: n(r.subFunctionID),
                        department: s(r.department),
                        region: s(r.region),
                        regionID: n(r.regionID),
                        clusterID: n(r.clusterID),
                        marketID: n(r.marketID),
                        siteID: n(r.siteID),
                        roleType: 'Delegated',
                        tools,
                    };
                })
                // In edit mode (when a filter is supplied), drop roles that end up with 0 tools
                .filter(r => (r.tools?.length ?? 0) > 0)
        );
    };
    const toISO = (d: any) => {
        if (!d) return '';
        const date = d instanceof Date ? d : new Date(d);
        if (isNaN(date.getTime())) return '';

        // Use local components to avoid any timezone conversion
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        const ms = String(date.getMilliseconds()).padStart(3, '0');

        // Note: the trailing 'Z' here is just part of the format you asked for.
        // It will *not* represent an actual UTC instant—it's just a suffix.
        return `${y}-${m}-${day}T${hh}:${mm}:${ss}.${ms}Z`;
    };

    type MakePayloadOpts = {
        onlyToolIds?: Set<number>; // filter for iamRoles (edit only)
    };

    const makePayload = (opts?: MakePayloadOpts): DelegationRequestPayload => ({
        delegatedToUser: String(selectedUser?.value ?? ''),
        delegatedByUser: getCurrentUserEmail() ?? '',
        startDate: toISO(startDate),
        endDate: toISO(endDate),
        requestComment: '',
        roleIds: roleIds ?? '',

        toolIds: toolIds ?? '',
        //  iamRoles filtered only when opts.onlyToolIds is provided
        iamRoles: buildIamRolesFromSelections(opts?.onlyToolIds),
        delegationId: delegationId ?? 0,
    });

    const parseIdSet = (ids?: string | string[] | number[] | null) => {
        if (ids == null) return new Set<number>(); // empty set => no new tools
        const parts = Array.isArray(ids)
            ? ids
            : String(ids)
                  .split(',')
                  .map(s => s.trim());
        const nums = parts
            .filter(Boolean)
            .map(v => Number(v))
            .filter(v => Number.isFinite(v));
        return new Set(nums);
    };

    const handleConfirm = async () => {
        setIsSaving(true);
        try {
            // Decide filter for iamRoles based on edit mode
            const onlyToolIds = isEditModeOn ? parseIdSet(newToolIds) : undefined;

            // Build payload once (toolIds always include ALL selected tools)
            const payload = makePayload({ onlyToolIds });

            // Call the appropriate API
            if (isEditModeOn) {
                await editDelegationNew(payload);
            } else {
                await saveDelegationNew(payload);
            }

            // Common success message + toast
            const count = selectedRoleDetails?.length ?? 0;
            const endStr = formatDate(endDate);
            const msg = `${count} ${count === 1 ? 'role has' : 'roles have'} been successfully delegated to ${selectedUser?.label}. Their access will automatically be revoked on ${endStr}.`;
            setSuccessMsg(msg);
            setToggleToast(true);
        } catch {
            setToggleErrorToast(true);
        } finally {
            setIsSaving(false);
            window.setTimeout(() => setToggleToast(false), 5000);
            window.setTimeout(() => setToggleErrorToast(false), 5000);
        }
    };

    return (
        <>
            <Flyout
                id="permission-management-applications-permission-flyout"
                flyoutOpen={open}
                direction="right"
                containerMaxWidth={'56.5rem'}
                cancelIconClick={onCloseAll}
                heading={heading}
                subHeading={
                    <Flex>
                        <Counter value={totalPermissions} size="Small" />
                        No. of Permissions
                    </Flex>
                }
                content={
                    <DelegatedToolsTableNew
                        roleIds={roleIds}
                        toolIds={toolIds}
                        setTotalPermissions={setTotalPermissions}
                        //onPermissionToggle={onPermissionToggle}
                        onPermissionsSnapshot={onPermissionsSnapshot}
                    />
                }
                iconForCancel={{
                    icon: 'x-close',
                    onClick: onCloseAll,
                }}
                onBackDropClick={onClose}
                cancelBtnProps={{ text: 'Back', onClick: onClose, variant: 'Subtle' }}
                primaryBtnProps={{
                    text: 'Confirm Delegation',
                    onClick: async () => {
                        try {
                            setIsSaving(true);
                            await handleConfirm();
                            await dispatch(fetchDelegationsNew({ pageNumber, pageSize })).unwrap?.();
                            onCloseAll(); // close after fresh data is in the store
                        } catch {
                            // error toast already handled in handleConfirm; keep here if needed
                        } finally {
                            setIsSaving(false);
                        }
                    },
                    disabled: false,
                    loading: isSaving,
                }}
                secondaryBtnProps={{
                    text: 'Cancel Delegation',
                    onClick: onCloseAll,
                    variant: 'Secondary',
                }}
            />

            <Toast
                type="Success"
                message={successMsg}
                mode="Top Right"
                distance="x5l"
                toggle={toggleToast}
                timer={3000}
                onCloseToast={() => setToggleToast(false)}
            />

            <Toast
                type="Error"
                message="Failed to send request. Please try again."
                mode="Top Right"
                distance="x5l"
                toggle={toggleErrorToast}
                timer={3000}
                onCloseToast={() => setToggleErrorToast(false)}
            />
        </>
    );
};

export default DelegationConfirmationFlyoutNew;
