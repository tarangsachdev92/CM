 
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';
import { getUserToolPermissions } from '../../services/users';
import { getDelegationPermissions } from '../../services/delegation';
import type { IUserToolsApiResponse, DelegatedPermissionRow } from '../../types/response';

type PermissionItem = {
  appPermissionId: number;
  appPermissionName: string;
  appPermissionDescription: string;
  appModuleName: string;
  accessTypeName: string;
  isActiveAppPermission: boolean | null;
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

type ToolItem = {
  toolId: number;
  toolName: string;
  toolIdAlias: string;
  toolType: string;
  permissionCount: number;
  statusChips: { CancelInitiated: number; Pending: number };
  adgroupsList: GroupItem[];
};

const isPendingLike = (raw?: string) => {
  const s = (raw || '').trim().toLowerCase();
  return s === 'pending' || s === 'requested' || s === 'request' || s === 'addfailed' || s === 'add failed' || s === 'add_failed';
};

const isCancelInitiated = (raw?: string) => {
  const s = (raw || '').trim().toLowerCase();
  return s === 'cancel initiated' || s === 'cancel_initiated' || s === 'cancel-initiated';
};

function normalizeDelegatedRowsToUserTools(rows: DelegatedPermissionRow[]): IUserToolsApiResponse {
  const roleId = rows[0]?.roleId ?? 0;
  const role = rows[0]?.roleName ?? '';
  type ToolAgg = {
    toolId: number;
    toolName: string;
    adgroupsMap: Map<string, GroupItem>;
    chipsLegacy: { CancelInitiated: number; Pending: number };
  };
  const toolsMap = new Map<number, ToolAgg>();

  rows.forEach(r => {
    const toolId = Number(r.toolId);
    const toolName = r.toolName ?? '—';
    const tool =
      toolsMap.get(toolId) ??
      { toolId, toolName, adgroupsMap: new Map<string, GroupItem>(), chipsLegacy: { CancelInitiated: 0, Pending: 0 } };

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

    if (isCancelInitiated(r.adGroupAccessStatus)) tool.chipsLegacy.CancelInitiated += 1;
    else if (isPendingLike(r.adGroupAccessStatus)) tool.chipsLegacy.Pending += 1;

    group.permission.push({
      appPermissionId: Number(r.permissionId ?? 0),
      appPermissionName: r.permissionName ?? '-',
      appPermissionDescription: '',
      appModuleName: r.moduleName ?? '-',
      accessTypeName: '',
      isActiveAppPermission: r.IsActiveToolPermission ?? null,
    });

    group.status = r.adGroupAccessStatus ?? group.status;
    tool.adgroupsMap.set(gId, group);
    toolsMap.set(toolId, tool);
  });

  const tools: ToolItem[] = Array.from(toolsMap.values()).map(t => {
    const adgroupsList = Array.from(t.adgroupsMap.values()).map(g => ({
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
    totalPermissionCount: tools.reduce((s, t) => s + (t.permissionCount ?? 0), 0),
  };
}

function extractToolIdsFromToolsResponse(data?: IUserToolsApiResponse | null): number[] {
  if (!data || !Array.isArray(data.tools)) return [];
  return Array.from(
    new Set(
      data.tools
        .map(t => Number(t.toolId))
        .filter(n => Number.isFinite(n) && n > 0)
    )
  );
}

export const fetchDelegatedRoleView = createAsyncThunk<
  IUserToolsApiResponse,
  { roleId: number; roleType?: string; pageNumber?: number; pageSize?: number; toolIds?: number[] | null }
>(
  'userToolPermissions/fetchDelegatedRoleView',
  async ({ roleId, roleType = 'Delegated', pageNumber = 1, pageSize = 100, toolIds = null }, { rejectWithValue }) => {
    try {
      let ids = Array.isArray(toolIds) && toolIds.length > 0 ? toolIds : [];
      if (ids.length === 0) {
        const discovery = await getUserToolPermissions({ roleId, roleType, pageNumber, pageSize });
        const discovered: IUserToolsApiResponse | undefined = discovery?.data?.data;
        ids = extractToolIdsFromToolsResponse(discovered);
      }
      if (ids.length === 0) {
        return { roleId, role: '', tools: [], totalRows: 0, totalPages: 1, totalPermissionCount: 0 };
      }
      const params: Record<string, string> = { roleId: String(roleId), toolId: ids.join(',') };
      const res = await getAPI('/api/users/delegated-role-view', params);
      const json = res.data as { statusCode: number; data: DelegatedPermissionRow[]; message: string | null };
      const rows = Array.isArray(json?.data) ? json.data : [];
      return normalizeDelegatedRowsToUserTools(rows);
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Failed to fetch delegated role view');
    }
  }
);

export const fetchDelegatedRoleViewByDelegation = createAsyncThunk(
  'delegationPermissions/fetchDelegatedRoleViewByDelegation',
  async (
    { delegationId, pageNumber = 1, pageSize = 10 }: { delegationId: number; pageNumber?: number; pageSize?: number },
    { rejectWithValue }
  ) => {
    try {
      const res = await getDelegationPermissions(delegationId, pageNumber, pageSize);
      const rawItems = res?.items ?? res?.data ?? res?.rows ?? res?.list ?? (Array.isArray(res) ? res : []);
      const normalized = {
        items: Array.isArray(rawItems) ? rawItems : [],
        totalItems: Number(
          res?.totalItems ?? res?.totalRows ?? res?.totalCount ?? (Array.isArray(rawItems) ? rawItems.length : 0)
        ),
        pageNumber: Number(res?.pageNumber ?? res?.page ?? pageNumber ?? 1),
        pageSize: Number(res?.pageSize ?? res?.size ?? pageSize ?? 10),
        totalPages:
          Number(
            res?.totalPages ??
              Math.ceil(
                Number(res?.totalItems ?? res?.totalRows ?? res?.totalCount ?? 0) /
                  Number(res?.pageSize ?? res?.size ?? pageSize ?? 10)
              )
          ) || undefined,
        totalPermissionCount: Number(res?.totalPermissionCount ?? res?.totalCount ?? 0) || undefined,
      };
      return normalized;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || err?.message || 'Failed to fetch delegation permissions');
    }
  }
);