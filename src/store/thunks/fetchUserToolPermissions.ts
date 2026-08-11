import { createAsyncThunk } from '@reduxjs/toolkit';
import { getUserToolPermissions } from '../../services/users';
import { getAPI } from '../../services/api';
import type { IUserToolsApiResponse, DelegatedPermissionRow } from '../../types/response';

export const fetchUserToolPermissions = createAsyncThunk(
  'userToolPermissions/fetch',
  async (params: { roleId: number; roleType: string; pageNumber: number; pageSize: number }) => {
    const response = await getUserToolPermissions(params);
    return response.data.data as IUserToolsApiResponse;
  }
);

const isPendingLike = (raw?: string) => {
  const s = (raw || '').trim().toLowerCase();
  return s === 'pending' || s === 'requested' || s === 'addfailed' || s === 'add failed' || s === 'add_failed';
};
const isCancelInitiated = (raw?: string) => {
  const s = (raw || '').trim().toLowerCase();
  return s === 'cancel initiated' || s === 'cancel_initiated' || s === 'cancel-initiated';
};

const toCanonical = (
  raw?: string
): 'Approved' | 'Pending' | 'AutoRejected' | null => {
  const s = (raw || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase();
  if (!s) return null;
  if (s.includes('approve')) return 'Approved';
  const PENDING = new Set(['pending', 'requested', 'request', 'addfailed', 'add failed', 'cancel initiated']);
  const AUTOREJ = new Set(['auto reject', 'auto rejected', 'autorejected', 'auto-rejected', 'rejected', 'deny', 'denied']);
  if (PENDING.has(s)) return 'Pending';
  if (AUTOREJ.has(s)) return 'AutoRejected';
  return null;
};

const normalizeDelegatedRowsToUserTools = (rows: DelegatedPermissionRow[]): IUserToolsApiResponse => {
  const roleId = rows[0]?.roleId ?? 0;
  const role = rows[0]?.roleName ?? '';

  type PermissionItem = {
    appPermissionId: number;
    appPermissionName: string;
    appPermissionDescription: string;
    appModuleName: string;
    accessTypeName: string;
    isActiveAppPermission: boolean;
  };

  type GroupItem = {
    adGroupId: string;
    adGroup: string;
    status: string;
    requestedOn: string;
    updatedOn: string;
    permissionCount: number;
    permission: PermissionItem[];
  };

  type ToolAgg = {
    toolId: number;
    toolName: string;
    adgroupsMap: Map<string, GroupItem>;
    chipsLegacy: { CancelInitiated: number; Pending: number };
  };

  const toolsMap = new Map<number, ToolAgg>();

  rows.forEach((r) => {
    const toolId = Number(r.toolId);
    const toolName = r.toolName ?? '—';

    const tool =
      toolsMap.get(toolId) ??
      {
        toolId,
        toolName,
        adgroupsMap: new Map<string, GroupItem>(),
        chipsLegacy: { CancelInitiated: 0, Pending: 0 },
      };

    const gId = r.adGroupId ?? String(r.adGroupName ?? '');
    const group =
      tool.adgroupsMap.get(gId) ??
      {
        adGroupId: gId,
        adGroup: r.adGroupName ?? '-',
        status: r.adGroupAccessStatus ?? '',
        requestedOn: '',
        updatedOn: '',
        permissionCount: 0,
        permission: [] as PermissionItem[],
      };

    const canon = toCanonical(r.adGroupAccessStatus);

    if (isCancelInitiated(r.adGroupAccessStatus)) {
      tool.chipsLegacy.CancelInitiated += 1;
    } else if (isPendingLike(r.adGroupAccessStatus)) {
      tool.chipsLegacy.Pending += 1;
    }

    const isActive =
      r.hasPermissionAccess === true
        ? true
        : r.hasPermissionAccess === false
        ? false
        : canon === 'Approved';

    group.permission.push({
      appPermissionId: Number(r.permissionId ?? 0),
      appPermissionName: r.permissionName ?? '-',
      appPermissionDescription: '',
      appModuleName: r.moduleName ?? '-',
      accessTypeName: '',
      isActiveAppPermission: isActive,
    });

    group.status = r.adGroupAccessStatus ?? group.status;
    tool.adgroupsMap.set(gId, group);
    toolsMap.set(toolId, tool);
  });

  const tools = Array.from(toolsMap.values()).map((t) => {
    const adgroupsList: GroupItem[] = Array.from(t.adgroupsMap.values()).map((g) => ({
      ...g,
      permissionCount: g.permission.length,
    }));

    const permissionCount = adgroupsList.reduce((sum, g) => sum + (g.permissionCount ?? 0), 0);

    return {
      toolId: t.toolId,
      toolName: t.toolName,
      toolIdAlias: String(t.toolId),
      toolType: t.toolName,
      permissionCount,
      statusChips: t.chipsLegacy,
      adgroupsList,
    };
  });

  return {
    roleId,
    role,
    tools,
    totalRows: tools.length,
    totalPages: 1,
    totalPermissionCount: tools.reduce((sum, tool) => sum + (tool.permissionCount ?? 0), 0),
  };
};

export const fetchDelegatedRoleView = createAsyncThunk(
  'userToolPermissions/fetchDelegatedRoleView',
  async ({ roleId, toolId }: { roleId: number; toolId: number }) => {
    const response = await getAPI('/api/users/delegated-role-view', { roleId, toolId });
    const json = response.data as {
      statusCode: number;
      data: DelegatedPermissionRow[];
      message: string | null;
    };
    const rows = Array.isArray(json?.data) ? json.data : [];
    return normalizeDelegatedRowsToUserTools(rows);
  }
);