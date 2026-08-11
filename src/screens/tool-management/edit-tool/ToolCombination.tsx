import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Flex, Row, Col } from 'antd';
import {
    Button,
    Dialog,
    DropDown,
    Icon,
    IconButton,
    Table,
    Tag,
    Toast,
} from 'konnect-react-components';
import { ExpandableForm } from '../../../components';
import type { OptionType } from '../../../types/common';
import type { ToolPersona } from '../../../types/response';
import {
    AppDispatch,
    RootState,
    fetchForumPersonaMappings,
    fetchRoleData,
    forumLevel,
    forumPeriod,
    getGeographyByLevel,
} from '../../../store';
import {
    deleteToolReportCombination,
    getRoleSelection,
    getToolPersonaConfiguration,
    getToolPersonas,
    getToolReportCombinationsByToolId,
    saveToolCombination,
} from '../../../services/application';
import { ROLE_SELECTION_PAGE_SIZE } from '../../../utils/constants';
import { logError, toCommaSeparated } from '../../../utils/helpers';
import {
    FlyoutCheckboxItemForum,
    RoleSelectionFlyoutForum,
} from '../../../components/organisms/role-selection-flyout/RoleSelectionFlyoutForum';
import LinkedForumFlyout, {
    PersonaMapping,
    type ForumItem,
    type ForumPersonaType,
    type LinkedForumSavePayload,
} from '../../../components/organisms/linked-forum-flyout/LinkedForumFlyout';
import styles from './EditToolScreen.module.scss';

type FilterKey = 'function' | 'subfunction' | 'geographyLevel' | 'rolelevel' | 'userGroup';

type ReportCombinationRoleTarget = {
    rowKey: number;
    personaId: string;
    personaName: string;
};

export type ToolCombinationChangePayload = {
    reportCombinations: ReportCombination[];
    isDirty: boolean;
    isSaving?: boolean;
    saveHandler?: () => Promise<void>;
    discardHandler?: () => void;
};

type SaveToolCombinationPayload = {
    toolId: number;
    reportCombinationId: number;
    reportLevelId: number;
    reportPeriodId: number;
    reportGeographyId: string;
    isAllReportGeography: boolean;
    updatedBy: string;
};

export type ToolCombinationProps = {
    toolId?: number | string | null;
    onToolCombinationChange?: (payload: ToolCombinationChangePayload) => void;
};

export type ReportCombination = {
    key: number;
    reportCombinationId?: number | null;
    reportLevelId?: number | string | null;
    reportPeriodId?: number | string | null;
    reportGeographyIds?: Array<string | number>;
    reportLevel: string;
    reportPeriod: string;
    reportGeography: string;
    geographyCount: number;
    personaRoles: Record<string, OptionType[]>;
    linkedForum: OptionType | null;
    linkedForums?: OptionType[];
    linkedForumMappings?: any[];
    linkedForumPersonaMapping?: PersonaMapping;
    isNew?: boolean;
};

const geographyLevelOptions: OptionType[] = [
    { label: 'Region', value: '1' },
    { label: 'Cluster', value: '2' },
    { label: 'Market', value: '3' },
    { label: 'Site', value: '4' },
];

const readFirstArray = (...values: any[]): any[] => {
    for (const value of values) {
        if (Array.isArray(value)) return value;
    }

    return [];
};

const makeOption = (label: unknown, value: unknown): OptionType => ({
    label: String(label ?? ''),
    value: String(value ?? ''),
});

const normalizeRoleOption = (role: any): OptionType => ({
    label: String(role?.roleName ?? role?.label ?? role?.name ?? role?.roleId ?? role?.value ?? ''),
    value: String(role?.roleId ?? role?.value ?? role?.id ?? role?.roleID ?? ''),
});

const normalizeRoleList = (roles: any): OptionType[] => {
    if (!roles) return [];

    if (Array.isArray(roles)) {
        return roles
            .map(role => {
                if (typeof role === 'string' || typeof role === 'number') {
                    return makeOption(role, role);
                }

                return normalizeRoleOption(role);
            })
            .filter(role => role.value !== '');
    }

    if (typeof roles === 'string') {
        return roles
            .split(',')
            .map(roleId => roleId.trim())
            .filter(Boolean)
            .map(roleId => makeOption(roleId, roleId));
    }

    return [];
};

const getPersonaId = (persona: ToolPersona | any): string =>
    String(persona?.personaId ?? persona?.toolPersonaId ?? persona?.id ?? '');

const getPersonaName = (persona: ToolPersona | any): string =>
    String(persona?.personaName ?? persona?.name ?? persona?.label ?? 'Persona');

const getReportPersonaColumnKey = (personaId: string | number) => `persona-${personaId}-roles`;
const getReportRoleSelectionKey = (rowKey: number, personaId: string | number) =>
    `report-combination-${rowKey}-persona-${personaId}`;

const getSelectedRoleIds = (roles: OptionType[]) => roles.map(role => String(role.value));

const mapOptionToFlyoutRoleItem = (role: OptionType): FlyoutCheckboxItemForum => ({
    roleId: String(role.value),
    roleName: String(role.label),
    checked: true,
    users: [],
});

const areCombinationsEqual = (left: ReportCombination[], right: ReportCombination[]) =>
    JSON.stringify(left) === JSON.stringify(right);

const normalizeForumOption = (forum: any): OptionType =>
    makeOption(
        forum?.label ?? forum?.forumName ?? forum?.name ?? forum?.linkedForumName ?? forum?.id,
        forum?.value ?? forum?.forumId ?? forum?.id ?? forum?.linkedForumId,
    );

const getForumItemId = (forum: any): string =>
    String(forum?.id ?? forum?.value ?? forum?.forumId ?? forum?.linkedForumId ?? '');

const getForumItemLabel = (forum: any): string =>
    String(
        forum?.label ??
            forum?.forumName ??
            forum?.name ??
            forum?.linkedForumName ??
            getForumItemId(forum),
    );

const getSelectedLinkedForums = (combination?: ReportCombination | null): OptionType[] => {
    if (!combination) return [];

    const forums =
        Array.isArray(combination.linkedForums) && combination.linkedForums.length > 0
            ? combination.linkedForums
            : combination.linkedForum
              ? [combination.linkedForum]
              : [];
    const uniqueForums = new Map<string, OptionType>();

    forums.forEach(forum => {
        const value = String(forum?.value ?? '');
        if (!value) return;

        uniqueForums.set(value, {
            label: String(forum.label ?? value),
            value,
        });
    });

    return Array.from(uniqueForums.values());
};

const getFirstToolDetail = (toolDetailsState: any) => {
    const toolDetail = toolDetailsState?.toolDetail;
    return Array.isArray(toolDetail) ? toolDetail[0] : toolDetail;
};

function ToolCombination({
    toolId: toolIdProp = null,
    onToolCombinationChange,
}: ToolCombinationProps = {}) {
    const dispatch = useDispatch<AppDispatch>();
    const applicationParams = useParams<{ appId: string; appName: string }>();
    const resolvedToolId = toolIdProp ?? applicationParams.appId;
    const toolId = Number(resolvedToolId);

    const toolDetailsState = useSelector(
        (state: RootState) => state.applicationManagement?.toolDetails,
    );
    const forumLevelsData = useSelector((state: RootState) => {
        const data = state.forumLevel?.data;
        return Array.isArray(data) ? data : [];
    });
    const forumPeriodsData = useSelector((state: RootState) => {
        const data = state.forumPeriod?.data;
        return Array.isArray(data) ? data : [];
    });
    const geographyByLevelData = useSelector(
        (state: RootState) => state.geographyByLevel?.data ?? [],
    );
    const forumPersonaMappingsState = useSelector((state: RootState) => state.forumPersonaMappings);
    const { columnFilters } = useSelector((state: RootState) => state.roleData);

    const [openReportCombinationSection, setOpenReportCombinationSection] =
        useState<boolean>(false);
    const [reportCombinations, setReportCombinations] = useState<ReportCombination[]>([]);
    const [originalReportCombinations, setOriginalReportCombinations] = useState<
        ReportCombination[]
    >([]);
    const [toolPersonas, setToolPersonas] = useState<ToolPersona[]>([]);
    const [isAddReportCombinationDialogOpen, setIsAddReportCombinationDialogOpen] = useState(false);
    const [dialogReportLevel, setDialogReportLevel] = useState<OptionType | null>(null);
    const [dialogReportPeriod, setDialogReportPeriod] = useState<OptionType | null>(null);
    const [dialogReportGeography, setDialogReportGeography] = useState<OptionType[]>([]);
    const [isReportCombinationDeleteDialogOpen, setIsReportCombinationDeleteDialogOpen] =
        useState(false);
    const [reportCombinationIdVal, setReportCombinationIdVal] = useState<number>(-1);

    const [isLinkedForumFlyoutOpen, setIsLinkedForumFlyoutOpen] = useState(false);
    const [activeLinkedForumRowKey, setActiveLinkedForumRowKey] = useState<number | null>(null);

    const [isRoleFlyoutOpen, setIsRoleFlyoutOpen] = useState(false);
    const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
    const [activePersonaName, setActivePersonaName] = useState<string | null>(null);
    const [activeReportRoleTarget, setActiveReportRoleTarget] =
        useState<ReportCombinationRoleTarget | null>(null);

    const [rolesAndUsers, setRolesAndUsers] = useState<Record<string, FlyoutCheckboxItemForum[]>>(
        {},
    );
    const [usersFlyoutData, setUsersFlyoutData] = useState<Record<string, any[]>>({});
    const [savedFlyOutData, setSavedFlyOutData] = useState<Record<string, any>>({});
    const [tempRoleSelection, setTempRoleSelection] = useState<Record<string, string[]>>({});
    const [personaRoleSelection, setPersonaRoleSelection] = useState<Record<string, string[]>>({});
    // const [tempUsersSelection, setTempUsersSelection] = useState<Record<string, any[]>>({});
    const [, setUsersFlyoutOpen] = useState(false);
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [showSelectedUsersOnly, setShowSelectedUsersOnly] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [roleUserData, setRoleUserData] = useState<any[]>([]);
    const [isRoleDataLoading, setIsRoleDataLoading] = useState(false);
    const [isLoadingMoreRoles, setIsLoadingMoreRoles] = useState(false);
    const [hasMoreRoles, setHasMoreRoles] = useState(true);
    const rolePageRef = useRef(1);
    const latestRequestRef = useRef(0);

    const [selectedFilters, setSelectedFilters] = useState<Record<FilterKey, OptionType[]>>({
        function: [],
        subfunction: [],
        geographyLevel: [],
        rolelevel: [],
        userGroup: [],
    });

    const [isSavingToolCombination, setIsSavingToolCombination] = useState(false);
    const [hasReportCombinationSaveableChanges, setHasReportCombinationSaveableChanges] =
        useState(false);
    const [showSaveToast, setShowSaveToast] = useState(false);
    const [showDiscardToast, setShowDiscardToast] = useState(false);
    const [showErrorToast, setShowErrorToast] = useState(false);

    const reportLevelOptions: OptionType[] = useMemo(
        () =>
            forumLevelsData.map((item: any) => ({
                label: item.forumLevelName ?? item.name ?? item.label ?? String(item),
                value: String(item.forumLevelId ?? item.id ?? item.value ?? item),
            })),
        [forumLevelsData],
    );

    const reportPeriodOptions: OptionType[] = useMemo(
        () =>
            forumPeriodsData.map((item: any) => ({
                label: item.forumPeriodName ?? item.name ?? item.label ?? String(item),
                value: String(item.forumPeriodId ?? item.id ?? item.value ?? item),
            })),
        [forumPeriodsData],
    );

    const reportCombinationPersonas = useMemo(
        () => toolPersonas.filter((persona: any) => persona.isActive !== false),
        [toolPersonas],
    );

    const isToolCombinationDirty = useMemo(
        () => !areCombinationsEqual(reportCombinations, originalReportCombinations),
        [reportCombinations, originalReportCombinations],
    );
    const isSaveableToolCombinationDirty =
        hasReportCombinationSaveableChanges && isToolCombinationDirty;

    const forumPersonaTypes: ForumPersonaType[] =
        forumPersonaMappingsState?.forumPersonaTypes ?? [];
    const forumPersonaToolPersonaOptions = (forumPersonaMappingsState?.toolPersonas ?? []).map(
        (persona: { personaId: number; personaName: string }) => ({
            label: persona.personaName,
            value: String(persona.personaId),
        }),
    );

    const mapToOptions = (data: any[] = []): OptionType[] =>
        data.map(item => ({
            label: item.columnValue ?? item.label ?? item.name ?? String(item),
            value: String(item.id ?? item.value ?? item.columnValue ?? item),
        }));

    const mapSelectedOptions = (list: any[] = []): OptionType[] =>
        list.map(item => ({
            label: item.label,
            value: String(item.value),
        }));

    const getUserGroupOptions = (): OptionType[] => {
        const uniqueGroups = new Map<string, OptionType>();

        roleUserData.forEach((item: any) => {
            if (item.userGroupId && item.userGroupName) {
                uniqueGroups.set(String(item.userGroupId), {
                    label: item.userGroupName,
                    value: String(item.userGroupId),
                });
            }
        });

        return Array.from(uniqueGroups.values());
    };

    const handleMultiSelectChange = (key: FilterKey) => {
        return (_option: any, _checked: boolean, tree: object[]) => {
            setSelectedFilters(prev => ({
                ...prev,
                [key]: (tree || []) as OptionType[],
            }));
        };
    };

    const getSelectedRolesCount = () => {
        if (!activePersonaId) return 0;
        return rolesAndUsers[activePersonaId]?.filter(item => item.checked).length || 0;
    };

    const getSelectedUsersCount = () => {
        if (!activePersonaId) return 0;

        const users = usersFlyoutData[activePersonaId] || [];
        const emails = new Set<string>();

        users.forEach((user: any) => {
            if (user.checked !== false && user.userEmail) {
                emails.add(user.userEmail);
            }
        });

        return emails.size;
    };

    const buildFinalPayload = useCallback(() => {
        const details: any = [];
        const forumMappings: any = [];
        const personaRoleMappings: any = [];

        reportCombinations.forEach(combination => {
            const tempKey = combination.key;
            const isNew = !combination.reportCombinationId;

            // 1. Report Combination Details
            details.push({
                reportCombinationId: isNew ? null : Number(combination.reportCombinationId),

                tempKey: isNew ? tempKey : Number(combination.reportCombinationId),
                reportLevelId: Number(combination.reportLevelId ?? 0),
                reportPeriodId: Number(combination.reportPeriodId ?? 0),
                reportGeographyId: (combination.reportGeographyIds ?? []).join(','),
                isAllReportGeography: getIsAllReportGeography(combination),
            });

            // 2. Persona Role Mapping
            Object.entries(combination.personaRoles || {}).forEach(([personaId, roles]: any) => {
                personaRoleMappings.push({
                    personaId: Number(personaId),
                    roleIds: roles.map((r: any) => r.value).join(','),
                    reportCombinationId: isNew ? null : Number(combination.reportCombinationId),
                    reportCombinationTempKey: tempKey,
                });
            });

            // 3. Forum Mapping (DEDUPED + CORRECT)
            const uniqueForums = Array.from(
                new Map(
                    (combination.linkedForums || []).map((f: any) => [String(f.value), f]),
                ).values(),
            );

            uniqueForums.forEach((forum: any) => {
                const forumId = Number(forum.value);

                const personaMap =
                    (combination.linkedForumPersonaMapping as Record<string, any>)?.[
                        String(forum.value)
                    ] || {};

                Object.entries(personaMap).forEach(([personaTypeId, persona]: any) => {
                    if (!persona || !persona.value) return;

                    forumMappings.push({
                        forumId: forumId,
                        forumPersonaTypeId: Number(personaTypeId),
                        personaId: Number(persona.value),
                        reportCombinationId: isNew ? null : Number(combination.reportCombinationId),
                        reportCombinationTempKey: tempKey,
                    });
                });
            });
        });

        return {
            toolId: Number(toolId),
            reportCombinationDetails: details,
            reportCombinationForumMappings: forumMappings,
            reportCombinationPersonaRoleMappings: personaRoleMappings,
        };
    }, [reportCombinations, toolId]);
    const dropdownFilters = (
        <Flex wrap="wrap" gap={8}>
            <DropDown
                dropdown={{
                    size: 'S',
                    label: 'Function',
                    isLabelInline: true,
                    options: mapToOptions(columnFilters?.function),
                    onChange: handleMultiSelectChange('function'),
                    selectedOptions: mapSelectedOptions(selectedFilters.function),
                    type: 'checkbox',
                    showSelectAll: true,
                    selectAllOption: { label: 'Select All', value: 'all' },
                    placeholder: '',
                }}
            />
            <DropDown
                dropdown={{
                    size: 'S',
                    label: 'Sub-Function',
                    isLabelInline: true,
                    options: mapToOptions(columnFilters?.subfunction),
                    onChange: handleMultiSelectChange('subfunction'),
                    selectedOptions: mapSelectedOptions(selectedFilters.subfunction),
                    type: 'checkbox',
                    showSelectAll: true,
                    selectAllOption: { label: 'Select All', value: 'all' },
                    placeholder: '',
                }}
            />
            <DropDown
                dropdown={{
                    size: 'S',
                    label: 'Geography Level',
                    isLabelInline: true,
                    options: mapToOptions(columnFilters?.region),
                    onChange: handleMultiSelectChange('geographyLevel'),
                    selectedOptions: mapSelectedOptions(selectedFilters.geographyLevel),
                    type: 'checkbox',
                    showSelectAll: true,
                    selectAllOption: { label: 'Select All', value: 'all' },
                    placeholder: '',
                }}
            />
            <DropDown
                dropdown={{
                    size: 'S',
                    label: 'Responsibility Level',
                    isLabelInline: true,
                    options: mapToOptions(columnFilters?.roleLevel),
                    onChange: handleMultiSelectChange('rolelevel'),
                    selectedOptions: mapSelectedOptions(selectedFilters.rolelevel),
                    type: 'checkbox',
                    showSelectAll: true,
                    selectAllOption: { label: 'Select All', value: 'all' },
                    placeholder: '',
                }}
            />
            <DropDown
                dropdown={{
                    size: 'S',
                    label: 'User Groups',
                    isLabelInline: true,
                    options: getUserGroupOptions(),
                    onChange: handleMultiSelectChange('userGroup'),
                    selectedOptions: mapSelectedOptions(selectedFilters.userGroup),
                    type: 'checkbox',
                    showSelectAll: true,
                    selectAllOption: { label: 'Select All', value: 'all' },
                    placeholder: '',
                }}
                searchInput={{
                    searchPlaceholder: 'Search',
                    searchSize: 'L',
                    searchWholeString: true,
                }}
            />
        </Flex>
    );

    const userLocationFilter = (
        <DropDown
            dropdown={{
                size: 'S',
                label: 'Location',
                isLabelInline: true,
                type: 'checkbox',
                showSelectAll: true,
                selectAllOption: { label: 'Select All', value: 'all' },
                options: mapToOptions(columnFilters?.region),
                onChange: handleMultiSelectChange('geographyLevel'),
                selectedOptions: mapSelectedOptions(selectedFilters.geographyLevel),
                placeholder: '',
            }}
        />
    );

    const mapRawPersonaRoles = useCallback((raw: any, persona: ToolPersona | any): OptionType[] => {
        const personaId = getPersonaId(persona);
        const directRoles = raw?.personaRoles?.[personaId] ?? raw?.personaRoleMap?.[personaId];

        if (directRoles) return normalizeRoleList(directRoles);

        const roleMappings = readFirstArray(
            raw?.personaRoleMappings,
            raw?.roleMappings,
            raw?.reportPersonaRoleMappings,
            raw?.reportCombinationRoleMappings,
        );

        const mappedRoles = roleMappings.flatMap((mapping: any) => {
            const mappedPersonaId = String(
                mapping?.personaId ??
                    mapping?.toolPersonaId ??
                    mapping?.PersonaId ??
                    mapping?.id ??
                    '',
            );

            if (mappedPersonaId !== personaId) return [];

            return normalizeRoleList(
                mapping?.roles ?? mapping?.roleIds ?? mapping?.RoleIds ?? mapping?.roleId,
            );
        });

        return mappedRoles;
    }, []);

    const buildPersonaRoleMap = useCallback(
        (raw: any, personas: ToolPersona[]): Record<string, OptionType[]> => {
            return personas.reduce(
                (acc, persona) => {
                    const personaId = getPersonaId(persona);
                    if (personaId) {
                        acc[personaId] = mapRawPersonaRoles(raw, persona);
                    }
                    return acc;
                },
                {} as Record<string, OptionType[]>,
            );
        },
        [mapRawPersonaRoles],
    );

    const mapReportCombinationsFromApi = useCallback(
        (rawRows: any[], personas: ToolPersona[]): ReportCombination[] => {
            return rawRows.map((raw, index) => {
                const reportGeographyItems = readFirstArray(
                    raw?.reportGeography,
                    raw?.reportGeographies,
                    raw?.geography,
                    raw?.geographies,
                );
                const reportGeographyIds =
                    reportGeographyItems.length > 0
                        ? reportGeographyItems.map((item: any) =>
                              String(item.geographyId ?? item.id ?? item.value ?? item),
                          )
                        : String(raw?.reportGeographyId ?? raw?.ReportGeographyId ?? '')
                              .split(',')
                              .map(value => value.trim())
                              .filter(Boolean);
                const reportGeographyLabel =
                    reportGeographyItems.length > 0
                        ? reportGeographyItems
                              .map((item: any) =>
                                  String(item.geographyName ?? item.name ?? item.label ?? item),
                              )
                              .join(', ')
                        : String(
                              raw?.reportGeographyName ??
                                  raw?.reportGeography ??
                                  raw?.geographyName ??
                                  '',
                          );

                const linkedForumId =
                    raw?.linkedForumId ??
                    raw?.forumId ??
                    raw?.ForumId ??
                    raw?.linkedForum?.value ??
                    raw?.linkedForum?.id ??
                    null;
                const linkedForumName =
                    raw?.linkedForumName ?? raw?.forumName ?? raw?.linkedForum?.label ?? '';
                const forumMappings = raw?.forumMappings ?? [];

                const linkedForumItems =
                    forumMappings.length > 0
                        ? forumMappings
                        : readFirstArray(
                              raw?.linkedForums,
                              raw?.linkedForumList,
                              raw?.linkedForumDetails,
                              raw?.selectedLinkedForums,
                          );
                const linkedForums =
                    linkedForumItems.length > 0
                        ? linkedForumItems
                              .map(normalizeForumOption)
                              .filter((forum: any) => forum.value)
                        : linkedForumId !== null && linkedForumId !== undefined && linkedForumName
                          ? [makeOption(linkedForumName, linkedForumId)]
                          : [];

                const forumPersonaMapping = forumMappings.reduce((acc: any, item: any) => {
                    const forumId = String(item.forumId);
                    const personaTypeId = String(item.forumPersonaTypeId);

                    if (!acc[forumId]) acc[forumId] = {};

                    acc[forumId][personaTypeId] = {
                        label: item.personaName,
                        value: String(item.personaId),
                    };

                    return acc;
                }, {});

                return {
                    key: Number(
                        raw?.key ??
                            raw?.reportCombinationId ??
                            raw?.toolCombinationId ??
                            raw?.id ??
                            Date.now() + index,
                    ),
                    reportCombinationId:
                        raw?.reportCombinationId ?? raw?.toolCombinationId ?? raw?.id ?? null,
                    reportLevelId: raw?.reportLevelId ?? raw?.ReportLevelId ?? null,
                    reportPeriodId: raw?.reportPeriodId ?? raw?.ReportPeriodId ?? null,
                    reportGeographyIds,
                    reportLevel: String(
                        raw?.reportLevelName ?? raw?.reportLevel ?? raw?.forumLevelName ?? '',
                    ),
                    geographyCount: raw?.geographyCount,
                    reportPeriod: String(
                        raw?.reportPeriodName ?? raw?.reportPeriod ?? raw?.forumPeriodName ?? '',
                    ),
                    reportGeography: reportGeographyLabel,
                    personaRoles: buildPersonaRoleMap(raw, personas),
                    linkedForum: linkedForums[0] ?? null,
                    linkedForums,

                    linkedForumMappings: forumMappings,
                    isNew: false,
                    linkedForumPersonaMapping: forumPersonaMapping,
                };
            });
        },
        [buildPersonaRoleMap],
    );

    const getToolCombinationRowsFromStore = useCallback((): any[] => {
        const firstToolDetail = getFirstToolDetail(toolDetailsState);

        return readFirstArray(
            (toolDetailsState as any)?.reportCombinations,
            (toolDetailsState as any)?.toolCombinations,
            (toolDetailsState as any)?.reportCombinationDetails,
            (toolDetailsState as any)?.toolCombinationDetails,
            firstToolDetail?.reportCombinations,
            firstToolDetail?.toolCombinations,
            firstToolDetail?.reportCombinationDetails,
            firstToolDetail?.toolCombinationDetails,
        );
    }, [toolDetailsState]);

    const fetchReportCombinationsFromApi = useCallback(async () => {
        if (!toolId || Number.isNaN(toolId) || reportCombinationPersonas.length === 0) return;

        try {
            const response: any = await getToolReportCombinationsByToolId(toolId);
            const apiRows = response?.data.reportCombinations;

            if (apiRows.length > 0) {
                const mappedRows = mapReportCombinationsFromApi(apiRows, reportCombinationPersonas);
                setReportCombinations(mappedRows);
                setOriginalReportCombinations(mappedRows);
                setHasReportCombinationSaveableChanges(false);
            }
        } catch (error) {
            logError('Failed to fetch tool report combinations', error);
        }
    }, [toolId, reportCombinationPersonas, mapReportCombinationsFromApi]);

    const getReportGeographyOptions = (): OptionType[] => {
        if (!dialogReportLevel) return [];

        return geographyByLevelData
            .filter(
                (item: any) => item.geographyId !== 0 && String(item.name).toUpperCase() !== 'ALL',
            )
            .map((item: any) => ({
                label: String(item.name ?? item.geographyName ?? item.label ?? item),
                value: String(item.geographyId ?? item.id ?? item.value ?? item),
            }));
    };

    const getReportPersonaRoles = (
        record: ReportCombination,
        personaId: string | number,
    ): OptionType[] => record.personaRoles?.[String(personaId)] ?? [];

    const linkedForumItems = useMemo((): ForumItem[] => {
        const activeCombination = reportCombinations.find(
            combination => combination.key === activeLinkedForumRowKey,
        );

        const selectedForums = getSelectedLinkedForums(activeCombination);
        const selectedForumIds = new Set(selectedForums.map(forum => String(forum.value)));

        const availableForums = readFirstArray(
            (forumPersonaMappingsState as any)?.forums,
            (forumPersonaMappingsState as any)?.data?.forums,
            (forumPersonaMappingsState as any)?.data?.data?.forums,
            (forumPersonaMappingsState as any)?.forumMappings,
            (forumPersonaMappingsState as any)?.data?.forumMappings,
        );

        if (availableForums.length > 0) {
            return availableForums.map((forum: any) => {
                const forumId = getForumItemId(forum);

                return {
                    ...forum,
                    id: forumId,
                    label: getForumItemLabel(forum),
                    checked: selectedForumIds.has(forumId),
                    mappings:
                        forum?.mappings ??
                        forum?.personaMappings ??
                        activeCombination?.linkedForumMappings ??
                        [],
                } as unknown as ForumItem;
            });
        }

        if (selectedForums.length === 0) return [];

        return selectedForums.map(
            forum =>
                ({
                    id: String(forum.value),
                    label: String(forum.label),
                    checked: true,
                    mappings:
                        activeCombination?.linkedForumMappings?.filter(
                            (m: any) => String(m.forumId) == forum.value,
                        ) ?? [],
                }) as unknown as ForumItem,
        );
    }, [reportCombinations, activeLinkedForumRowKey, forumPersonaMappingsState]);
    const findOriginalReportCombination = useCallback(
        (combination: ReportCombination) =>
            originalReportCombinations.find(original => {
                if (combination.reportCombinationId && original.reportCombinationId) {
                    return (
                        String(combination.reportCombinationId) ===
                        String(original.reportCombinationId)
                    );
                }

                return combination.key === original.key;
            }),
        [originalReportCombinations],
    );

    const getChangedCurrentReportCombinations = useCallback(
        (combinations: ReportCombination[]) =>
            combinations.filter(combination => {
                const originalCombination = findOriginalReportCombination(combination);

                if (!originalCombination) return true;

                return !areCombinationsEqual([combination], [originalCombination]);
            }),
        [findOriginalReportCombination],
    );

    const markReportCombinationDirty = useCallback(
        (updater: (prev: ReportCombination[]) => ReportCombination[]) => {
            setReportCombinations(prev => {
                const updated = updater(prev);
                setHasReportCombinationSaveableChanges(
                    getChangedCurrentReportCombinations(updated).length > 0,
                );
                return updated;
            });
        },
        [getChangedCurrentReportCombinations],
    );

    const closeRoleFlyout = () => {
        setIsRoleFlyoutOpen(false);
        setActiveReportRoleTarget(null);
    };

    const handleRoleFlyoutOpenChange = (value: boolean | ((prev: boolean) => boolean)) => {
        setIsRoleFlyoutOpen(prev => {
            const nextValue = typeof value === 'function' ? value(prev) : value;

            if (!nextValue) {
                setActiveReportRoleTarget(null);
            }

            return nextValue;
        });
    };

    const handleOpenReportRoleFlyout = (record: ReportCombination, persona: ToolPersona) => {
        const personaId = getPersonaId(persona);
        const activeId = getReportRoleSelectionKey(record.key, personaId);
        const preselectedRoles = getReportPersonaRoles(record, personaId);
        const selectedRoleIds = getSelectedRoleIds(preselectedRoles);
        const preselectedRoleItems = preselectedRoles.map(mapOptionToFlyoutRoleItem);

        setRoleUserData([]);
        setIsRoleDataLoading(true);

        setActiveReportRoleTarget({
            rowKey: record.key,
            personaId,
            personaName: getPersonaName(persona),
        });
        setActivePersonaId(activeId);
        setActivePersonaName(`${getPersonaName(persona)} Roles`);
        setShowSelectedOnly(false);
        setShowSelectedUsersOnly(false);
        setSearchKeyword('');

        setTempRoleSelection(prev => ({
            ...prev,
            [activeId]: selectedRoleIds,
        }));

        setPersonaRoleSelection(prev => ({
            ...prev,
            [activeId]: selectedRoleIds,
        }));

        setSavedFlyOutData(prev => ({
            ...prev,
            [activeId]: {
                roles: prev[activeId]?.roles?.length
                    ? prev[activeId].roles
                    : preselectedRoleItems,
                users: prev[activeId]?.users ?? [],
            },
        }));

        setRolesAndUsers(prev => {
            const existingRoles = prev[activeId] ?? [];

            const existingRoleMap = new Map(
                existingRoles.map((role: any) => [String(role.roleId), role]),
            );

            preselectedRoleItems.forEach(role => {
                if (!existingRoleMap.has(String(role.roleId))) {
                    existingRoleMap.set(String(role.roleId), role);
                }
            });

            const mergedRoles = Array.from(existingRoleMap.values());

            return {
                ...prev,
                [activeId]: mergedRoles.map((role: any) => ({
                    ...role,
                    checked: selectedRoleIds.includes(String(role.roleId)),
                })),
            };
        });

        setTimeout(() => {
            setIsRoleFlyoutOpen(true);
        }, 0);
    };

    const handleRoleFlyoutSave = () => {
        if (!activePersonaId) return;

        const currentRoles = rolesAndUsers[activePersonaId] ?? [];
        const selectedRoleItems = currentRoles.filter(role => role.checked);
        const selectedRoleIds = selectedRoleItems.map(role => String((role as any).roleId));

        setTempRoleSelection(prev => ({
            ...prev,
            [activePersonaId]: selectedRoleIds,
        }));

        setSavedFlyOutData(prev => ({
            ...prev,
            [activePersonaId]: {
                ...(prev[activePersonaId] ?? {}),
                roles: selectedRoleItems,
                users: prev[activePersonaId]?.users ?? [],
            },
        }));

        if (activeReportRoleTarget) {
            markReportCombinationDirty(prev =>
                prev.map(combination =>
                    combination.key === activeReportRoleTarget.rowKey
                        ? {
                              ...combination,
                              personaRoles: {
                                  ...(combination.personaRoles ?? {}),
                                  [activeReportRoleTarget.personaId]:
                                      selectedRoleItems.map(normalizeRoleOption),
                              },
                          }
                        : combination,
                ),
            );
        }

        closeRoleFlyout();
    };

    const handleOpenLinkedForumFlyout = (record: ReportCombination) => {
        if (toolId) {
            dispatch(fetchForumPersonaMappings({ toolId }));
        }

        setActiveLinkedForumRowKey(record.key);
        setIsLinkedForumFlyoutOpen(true);
    };

    const handleLinkedForumSave = (payload: LinkedForumSavePayload) => {
        if (activeLinkedForumRowKey === null) return;

        const selectedForums = (payload.selectedForums ?? []).filter(forum => forum.checked);
        const linkedForums = selectedForums
            .map(forum => ({
                label: getForumItemLabel(forum),
                value: getForumItemId(forum),
            }))
            .filter(forum => forum.value);
        const forumMappings = selectedForums.flatMap(forum =>
            readFirstArray((forum as any).mappings, (forum as any).personaMappings),
        );
        const linkedForumMappings =
            forumMappings.length > 0
                ? forumMappings
                : readFirstArray((payload as any).mappings, (payload as any).linkedForumMappings);

        markReportCombinationDirty(prev =>
            prev.map(combination =>
                combination.key === activeLinkedForumRowKey
                    ? {
                          ...combination,
                          linkedForum: linkedForums[0] ?? null,
                          linkedForums,
                          linkedForumMappings,

                          linkedForumPersonaMapping: {
                              ...(combination.linkedForumPersonaMapping || {}),
                              ...Object.fromEntries(
                                  selectedForums.map((forum: any) => [
                                      String(forum.id),
                                      { ...payload.personaMapping },
                                  ]),
                              ),
                          },
                      }
                    : combination,
            ),
        );

        setIsLinkedForumFlyoutOpen(false);
        setActiveLinkedForumRowKey(null);
    };

    const handleAddReportCombination = () => {
        if (!dialogReportLevel || !dialogReportPeriod || dialogReportGeography.length === 0) return;

        const newCombination: ReportCombination = {
            key: Date.now(),
            reportCombinationId: null,
            reportLevelId: dialogReportLevel.value,
            reportPeriodId: dialogReportPeriod.value,
            reportGeographyIds: dialogReportGeography.map(geography => geography.value),
            reportLevel: String(dialogReportLevel.label),
            reportPeriod: String(dialogReportPeriod.label),
            reportGeography: dialogReportGeography.map(geography => geography.label).join(', '),
            geographyCount: dialogReportGeography.length,

            personaRoles: reportCombinationPersonas.reduce(
                (acc, persona) => {
                    const personaId = getPersonaId(persona);
                    if (personaId) acc[personaId] = [];
                    return acc;
                },
                {} as Record<string, OptionType[]>,
            ),
            linkedForum: null,
            linkedForums: [],
            linkedForumMappings: [],
            isNew: true,
        };

        markReportCombinationDirty(prev => [...prev, newCombination]);
        // setOpenReportCombinationSection(true);
        setIsAddReportCombinationDialogOpen(false);
        setDialogReportLevel(null);
        setDialogReportPeriod(null);
        setDialogReportGeography([]);
    };

    const handleCloseReportCombinationDialog = () => {
        setIsAddReportCombinationDialogOpen(false);
        setDialogReportLevel(null);
        setDialogReportPeriod(null);
        setDialogReportGeography([]);
    };

    const handleDeleteReportCombinationConfirmDialog = (key: number) => {
        setReportCombinationIdVal(key);
        setIsReportCombinationDeleteDialogOpen(true);
    };

    const handleDeleteReportCombination = async () => {
        const selectedCombination = reportCombinations.find(
            combination => combination.key === reportCombinationIdVal,
        );

        try {
            if (selectedCombination?.reportCombinationId) {
                // await deleteToolReportCombination(Number(selectedCombination?.reportCombinationId));

                await deleteToolReportCombination({
                    toolId: Number(toolId),
                    reportCombinationId: Number(selectedCombination.reportCombinationId),
                });

                setOriginalReportCombinations(prev =>
                    prev.filter(
                        combination =>
                            String(combination.reportCombinationId) !==
                            String(selectedCombination.reportCombinationId),
                    ),
                );
            }

            markReportCombinationDirty(prev => {
                const updated = prev.filter(
                    combination => combination.key !== reportCombinationIdVal,
                );
                // if (updated.length === 0) setOpenReportCombinationSection(false);
                return updated;
            });
        } catch (error) {
            logError('Failed to delete tool report combination', error);
            setShowErrorToast(true);
        } finally {
            setIsReportCombinationDeleteDialogOpen(false);
        }
    };

    const getUpdatedBy = useCallback(() => {
        const firstToolDetail = getFirstToolDetail(toolDetailsState);

        return String(
            firstToolDetail?.updatedBy ??
                firstToolDetail?.modifiedBy ??
                firstToolDetail?.createdBy ??
                firstToolDetail?.toolOwner ??
                '',
        );
    }, [toolDetailsState]);

    const getIsAllReportGeography = useCallback((combination: ReportCombination) => {
        const geographyIds = (combination.reportGeographyIds ?? []).map(id =>
            String(id).toLowerCase(),
        );

        return (
            geographyIds.includes('0') ||
            geographyIds.includes('all') ||
            String(combination.reportGeography).trim().toLowerCase() === 'all'
        );
    }, []);

    // const buildSaveToolCombinationPayload = useCallback((): SaveToolCombinationPayload[] => {
    //     const updatedBy = getUpdatedBy();

    //     return getChangedCurrentReportCombinations(reportCombinations).map(combination => {
    //         const isUpdate =
    //             !combination.isNew &&
    //             combination.reportCombinationId !== null &&
    //             combination.reportCombinationId !== undefined;
    //         const payload: SaveToolCombinationPayload = {
    //             reportCombinationId: Number(combination.reportCombinationId ?? 0),
    //             reportLevelId: Number(combination.reportLevelId ?? 0),
    //             reportPeriodId: Number(combination.reportPeriodId ?? 0),
    //             reportGeographyId: (combination.reportGeographyIds ?? []).join(','),
    //             isAllReportGeography: getIsAllReportGeography(combination),
    //             updatedBy,
    //         };

    //         if (isUpdate) {
    //             payload.toolId = toolId;
    //         }

    //         return payload;
    //     });
    // }, [
    //     getChangedCurrentReportCombinations,
    //     getIsAllReportGeography,
    //     getUpdatedBy,
    //     reportCombinations,
    //     toolId,
    // ]);

    const buildSaveToolCombinationPayload = useCallback((): SaveToolCombinationPayload[] => {
        const updatedBy = getUpdatedBy();

        return getChangedCurrentReportCombinations(reportCombinations).map(combination => {
            const payload: SaveToolCombinationPayload = {
                toolId: Number(toolId),
                reportCombinationId: Number(combination.reportCombinationId ?? 0),
                reportLevelId: Number(combination.reportLevelId ?? 0),
                reportPeriodId: Number(combination.reportPeriodId ?? 0),
                reportGeographyId: (combination.reportGeographyIds ?? []).join(','),
                isAllReportGeography: getIsAllReportGeography(combination),
                updatedBy,
            };

            return payload;
        });
    }, [
        getChangedCurrentReportCombinations,
        getIsAllReportGeography,
        getUpdatedBy,
        reportCombinations,
        toolId,
    ]);

    const handleDiscardToolCombinationChanges = useCallback(() => {
        setReportCombinations(originalReportCombinations);
        setHasReportCombinationSaveableChanges(false);
        setIsRoleFlyoutOpen(false);
        setIsLinkedForumFlyoutOpen(false);
        setActiveReportRoleTarget(null);
        setActiveLinkedForumRowKey(null);
        setShowDiscardToast(true);
    }, [originalReportCombinations]);

    const handleSaveToolCombinationChanges = useCallback(async () => {
        if (!toolId || Number.isNaN(toolId)) return;

        try {
            setIsSavingToolCombination(true);

            const currentPersistedIds = new Set(
                reportCombinations
                    .map(combination => combination.reportCombinationId)
                    .filter(
                        (id): id is number =>
                            id !== null && id !== undefined && !Number.isNaN(Number(id)),
                    )
                    .map(id => Number(id)),
            );

            const deletedCombinations = originalReportCombinations.filter(
                combination =>
                    combination.reportCombinationId !== null &&
                    combination.reportCombinationId !== undefined &&
                    !currentPersistedIds.has(Number(combination.reportCombinationId)),
            );

            const savePayload = buildFinalPayload();
            if (
                deletedCombinations.length === 0 &&
                savePayload.reportCombinationDetails.length === 0
            ) {
                setHasReportCombinationSaveableChanges(false);
                return;
            }

            await Promise.all(
                deletedCombinations
                    .filter(c => c.reportCombinationId != null)
                    .map(combination =>
                        deleteToolReportCombination({
                            toolId: Number(toolId),
                            reportCombinationId: Number(combination.reportCombinationId),
                        }),
                    ),
            );

            if (savePayload.reportCombinationDetails.length > 0) {
                const saveAction = await saveToolCombination(savePayload);

                if (typeof (saveAction as any)?.unwrap === 'function') {
                    await (saveAction as any).unwrap();
                } else {
                    await saveAction;
                }
            }

            const persistedCombinations = reportCombinations.map(combination => ({
                ...combination,
                isNew: false,
            }));
            setReportCombinations(persistedCombinations);
            setOriginalReportCombinations(persistedCombinations);
            setHasReportCombinationSaveableChanges(false);
            setShowSaveToast(true);
            await fetchReportCombinationsFromApi();
        } catch (error) {
            logError('Failed to save tool combination changes', error);
            setShowErrorToast(true);
        } finally {
            setIsSavingToolCombination(false);
        }
    }, [
        buildSaveToolCombinationPayload,
        dispatch,
        fetchReportCombinationsFromApi,
        originalReportCombinations,
        reportCombinations,
        toolId,
    ]);

    useEffect(() => {
        if (!isToolCombinationDirty && hasReportCombinationSaveableChanges) {
            setHasReportCombinationSaveableChanges(false);
        }
    }, [hasReportCombinationSaveableChanges, isToolCombinationDirty]);

    useEffect(() => {
        onToolCombinationChange?.({
            reportCombinations,
            isDirty: isSaveableToolCombinationDirty,
            isSaving: isSavingToolCombination,
            saveHandler: handleSaveToolCombinationChanges,
            discardHandler: handleDiscardToolCombinationChanges,
        });
    }, [
        handleDiscardToolCombinationChanges,
        handleSaveToolCombinationChanges,
        isSaveableToolCombinationDirty,
        isSavingToolCombination,
        onToolCombinationChange,
        reportCombinations,
    ]);

    const filteredRoles = showSelectedOnly
        ? (rolesAndUsers[activePersonaId || ''] || []).filter(item => item.checked)
        : rolesAndUsers[activePersonaId || ''] || [];

    const groupedRoles = useMemo(() => {
        if (!Array.isArray(roleUserData)) return [];

        return Object.values(
            roleUserData.reduce((acc, item) => {
                const key = String(item.roleId);

                if (!acc[key]) {
                    acc[key] = {
                        roleId: item.roleId,
                        roleName: item.roleName,
                        functionName: item.functionName,
                        subFunctionName: item.subFunctionName,
                        roleLevelName: item.geographyLevelName,
                        responsibilityLevelName: item.responsibilityLevelName,
                        users: [],
                    };
                }

                acc[key].users.push({
                    id: item.userEmail,
                    roleId: item.roleId,
                    userEmail: item.userEmail,
                    fullName: item.fullName,
                    checked: true,
                });

                return acc;
            }, {}),
        );
    }, [roleUserData]);

    const reportCombinationColumns: any[] = [
        {
            key: 'reportLevel',
            dataIndex: 'reportLevel',
            title: 'Report Level',
            subTitle: '',
            width: '220px',
            externalStyles: { display: '', alignItems: 'center' },
            customExpandableColumn: false,
            render: (_value: any, record: ReportCombination) => (
                <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                    <strong style={{ color: '#333', fontSize: '14px' }}>
                        {record.reportLevel} - {record.reportPeriod}
                    </strong>
                    <Tag
                        size="L"
                        text={`${record.reportLevel} :`}
                        chipText={String(record.geographyCount)}
                        onClick={() => {}}
                        tagBgColor="#F3FAF9"
                        tagBorderColor="#B0E7DF"
                        chipBgColor="#B0E7DF"
                        chipBorderColor="#B0E7DF"
                    />
                </Flex>
            ),
        },
        ...reportCombinationPersonas.map(persona => {
            const personaId = getPersonaId(persona);

            return {
                key: getReportPersonaColumnKey(personaId),
                dataIndex: getReportPersonaColumnKey(personaId),
                title: `${getPersonaName(persona)}`,
                subTitle: '',
                width: '200px',
                externalStyles: { display: '', alignItems: 'center' },
                customExpandableColumn: false,
                render: (_value: any, record: ReportCombination) => {
                    const selectedRoles = getReportPersonaRoles(record, personaId);

                    return (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                            }}
                            onClick={() => handleOpenReportRoleFlyout(record, persona)}
                        >
                            <span
                                style={{
                                    fontSize: '13px',
                                    color: selectedRoles.length > 0 ? '#333' : '#999',
                                }}
                            >
                                {selectedRoles.length > 0
                                    ? `Roles : ${selectedRoles.length} Selected`
                                    : 'Roles : Select'}
                            </span>
                            <Button
                                variant="Subtle2"
                                icon="chevron-down"
                                iconSize="Medium"
                                onClick={(event: any) => {
                                    event?.stopPropagation?.();
                                    handleOpenReportRoleFlyout(record, persona);
                                }}
                            />
                        </div>
                    );
                },
            };
        }),
        {
            key: 'linkedForum',
            dataIndex: 'linkedForum',
            title: 'Linked Forum',
            subTitle: '',
            width: '200px',
            externalStyles: { display: '', alignItems: 'center' },
            customExpandableColumn: false,
            render: (_value: any, record: ReportCombination) => {
                const selectedForums = getSelectedLinkedForums(record);

                return (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                        }}
                        onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                            const target = event.target as HTMLElement;
                            if (target.closest('[data-flyout-trigger="linked-forum-button"]')) {
                                return;
                            }

                            handleOpenLinkedForumFlyout(record);
                        }}
                    >
                        {selectedForums.length > 0 ? (
                            <Flex vertical gap={2}>
                                <span style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>
                                    {selectedForums.length > 1
                                        ? `${selectedForums[0]?.label} +${selectedForums.length - 1}`
                                        : selectedForums[0]?.label}
                                </span>
                                <span style={{ fontSize: '11px', color: '#1a8a6d' }}>
                                    Forum Active
                                </span>
                            </Flex>
                        ) : (
                            <span style={{ fontSize: '13px', color: '#999' }}>Select Forum</span>
                        )}
                        <div
                            data-flyout-trigger="linked-forum-button"
                            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                                event.stopPropagation();
                                handleOpenLinkedForumFlyout(record);
                            }}
                        >
                            <Button
                                variant="Subtle2"
                                icon="chevron-down"
                                iconSize="Large"
                                onClick={(event: any) => {
                                    event?.stopPropagation?.();
                                    handleOpenLinkedForumFlyout(record);
                                }}
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'action',
            dataIndex: 'action',
            title: 'Actions',
            subTitle: '',
            width: '60px',
            externalStyles: { display: 'auto', alignItems: 'center' },
            customExpandableColumn: false,
            render: (_value: any, record: ReportCombination) => (
                <IconButton
                    size="Small"
                    icon="trash-01"
                    onClick={(event: any) => {
                        event?.stopPropagation?.();
                        handleDeleteReportCombinationConfirmDialog(record.key);
                    }}
                />
            ),
        },
    ];

    useEffect(() => {
        dispatch(forumLevel());
        dispatch(forumPeriod());
        dispatch(
            fetchRoleData({
                pageNumber: 1,
                pageSize: 10,
                sortColumnName: '',
                sortDirection: '',
                searchKeyword: '',
                searchTerm: 'Role',
                gridFilters: [],
                userEmail: '',
                forumLevel: '',
                forumPeriod: '',
            }),
        );
    }, [dispatch]);

    useEffect(() => {
        const fetchToolPersonas = async () => {
            if (!toolId) return;

            try {
                const [personasResponse, configResponse]: any[] = await Promise.all([
                    getToolPersonas(toolId),
                    getToolPersonaConfiguration(toolId).catch(() => null),
                ]);

                const personas =
                    personasResponse?.data?.data ??
                    personasResponse?.data ??
                    personasResponse?.personas ??
                    personasResponse ??
                    [];
                const configPersonas =
                    configResponse?.data?.personas ??
                    configResponse?.data?.data?.personas ??
                    configResponse?.personas ??
                    [];

                const merged = (Array.isArray(personas) ? personas : []).map((persona: any) => {
                    const configPersona = Array.isArray(configPersonas)
                        ? configPersonas.find(
                              (config: any) =>
                                  String(config.personaId ?? config.id) ===
                                  String(persona.personaId ?? persona.id),
                          )
                        : null;

                    return {
                        ...persona,
                        personaId: persona.personaId ?? persona.id ?? persona.toolPersonaId,
                        personaName: persona.personaName ?? persona.name ?? persona.label,
                        isActive: persona.isActive ?? true,
                        roleIds: persona.roleIds ?? configPersona?.roleIds ?? [],
                        rolesCount: persona.rolesCount ?? persona.roleCount ?? 0,
                    };
                }) as ToolPersona[];

                setToolPersonas(merged);
            } catch (error) {
                logError('Failed to fetch tool personas', error);
                setToolPersonas([]);
            }
        };

        fetchToolPersonas();
    }, [toolId]);

    useEffect(() => {
        fetchReportCombinationsFromApi();
    }, [fetchReportCombinationsFromApi]);

    useEffect(() => {
        const rawRows = getToolCombinationRowsFromStore();
        if (!rawRows.length || !reportCombinationPersonas.length || reportCombinations.length > 0)
            return;

        const mappedRows = mapReportCombinationsFromApi(rawRows, reportCombinationPersonas);
        setReportCombinations(mappedRows);
        setOriginalReportCombinations(mappedRows);
        // setOpenReportCombinationSection(mappedRows.length > 0);
    }, [
        getToolCombinationRowsFromStore,
        mapReportCombinationsFromApi,
        reportCombinationPersonas,
        reportCombinations.length,
    ]);

    useEffect(() => {
        setReportCombinations(prev => {
            if (prev.length === 0 || reportCombinationPersonas.length === 0) return prev;

            return prev.map(combination => {
                const nextPersonaRoles = reportCombinationPersonas.reduce(
                    (acc, persona) => {
                        const personaId = getPersonaId(persona);
                        acc[personaId] = combination.personaRoles?.[personaId] ?? [];
                        return acc;
                    },
                    {} as Record<string, OptionType[]>,
                );

                return {
                    ...combination,
                    personaRoles: nextPersonaRoles,
                };
            });
        });
    }, [reportCombinationPersonas]);

    const buildRoleSelectionPayload = useCallback(
        (page: number) => ({
            geographyLevelId: toCommaSeparated(selectedFilters.geographyLevel),
            functionId: toCommaSeparated(selectedFilters.function),
            subFunctionId: toCommaSeparated(selectedFilters.subfunction),
            roleResponsibilityLevelId: toCommaSeparated(selectedFilters.rolelevel),
            userGroupId: toCommaSeparated(selectedFilters.userGroup),
            roleId: null,
            locationId: toCommaSeparated(selectedFilters.geographyLevel),
            searchKeyword: searchKeyword.trim() || undefined,
            pageNumber: page,
            pageSize: ROLE_SELECTION_PAGE_SIZE,
            isLeadership: /leadership/i.test(
                activeReportRoleTarget?.personaName ?? activePersonaName ?? '',
            ),
        }),
        [selectedFilters, searchKeyword, activeReportRoleTarget?.personaName, activePersonaName],
    );

    const handleLoadMoreRoles = useCallback(async () => {
        if (!hasMoreRoles || isLoadingMoreRoles || isRoleDataLoading) return;

        const nextPage = rolePageRef.current + 1;
        const requestId = ++latestRequestRef.current;

        setIsLoadingMoreRoles(true);

        try {
            const response = await getRoleSelection(buildRoleSelectionPayload(nextPage));
            const newData: any[] = response?.data?.data || [];

            if (requestId !== latestRequestRef.current) return;

            if (newData.length < ROLE_SELECTION_PAGE_SIZE) {
                setHasMoreRoles(false);
            }

            if (newData.length > 0) {
                rolePageRef.current = nextPage;
                setRoleUserData(prev => [...prev, ...newData]);
            }
        } catch {
            // silently ignore load-more errors
        } finally {
            if (requestId === latestRequestRef.current) {
                setIsLoadingMoreRoles(false);
            }
        }
    }, [hasMoreRoles, isLoadingMoreRoles, isRoleDataLoading, buildRoleSelectionPayload]);

    useEffect(() => {
        if (!isRoleFlyoutOpen) {
            setIsRoleDataLoading(false);
            return;
        }

        // Reset pagination on flyout open, filter change, or search change
        rolePageRef.current = 1;
        setHasMoreRoles(true);
        setRoleUserData([]);
        setIsRoleDataLoading(true);

        const timer = setTimeout(() => {
            const fetchRoleUsers = async () => {
                const requestId = ++latestRequestRef.current;

                try {
                    const response = await getRoleSelection(buildRoleSelectionPayload(1));
                    const data: any[] = response?.data?.data || [];

                    if (requestId === latestRequestRef.current) {
                        setRoleUserData(data);
                        setHasMoreRoles(data.length >= ROLE_SELECTION_PAGE_SIZE);
                        setIsRoleDataLoading(false);
                    }
                } catch {
                    if (requestId === latestRequestRef.current) {
                        setRoleUserData([]);
                        setIsRoleDataLoading(false);
                    }
                }
            };

            fetchRoleUsers();
        }, 400);

        return () => clearTimeout(timer);
    }, [
        activePersonaName,
        activeReportRoleTarget?.personaName,
        isRoleFlyoutOpen,
        selectedFilters,
        searchKeyword,
    ]);

    useEffect(() => {
        if (!activePersonaId || !Array.isArray(groupedRoles)) return;

        const selectedRoleIds =
            tempRoleSelection[activePersonaId] || personaRoleSelection[activePersonaId] || [];

        setRolesAndUsers(prev => {
            const existing = prev[activePersonaId] ?? [];
            const groupedRoleIds = new Set(
                groupedRoles.map((item: any) => String(item.roleId)),
            );
            const preservedSelectedRoles = existing.filter(
                (role: any) => role.checked && !groupedRoleIds.has(String(role.roleId)),
            );

            const formatted = groupedRoles.map((item: any) => {
                const existingRole = existing.find(
                    (role: any) => String(role.roleId) === String(item.roleId),
                );

                return {
                    ...item,
                    checked:
                        existingRole?.checked ??
                        selectedRoleIds.includes(String(item.roleId)),
                };
            });

            return {
                ...prev,
                [activePersonaId]: [...preservedSelectedRoles, ...formatted],
            };
        });
    }, [
        activePersonaId,
        groupedRoles,
        personaRoleSelection,
        tempRoleSelection,
    ]);

    useEffect(() => {
        if (!activePersonaId || !groupedRoles?.length) return;

        setSavedFlyOutData(prev => {
            const existing = prev[activePersonaId];
            if (existing?.users?.length) return prev;

            const users = groupedRoles.flatMap((role: any) =>
                (role.users || []).map((user: any) => ({
                    id: user.userEmail,
                    roleId: role.roleId,
                    userEmail: user.userEmail,
                    fullName: user.fullName,
                    checked: true,
                })),
            );

            return {
                ...prev,
                [activePersonaId]: {
                    roles: existing?.roles ?? [],
                    users,
                },
            };
        });
    }, [groupedRoles, activePersonaId]);

    useEffect(() => {
        setOpenReportCombinationSection(reportCombinations.length > 0);
    }, [reportCombinations.length]);
    const activeCombination = reportCombinations.find(c => c.key === activeLinkedForumRowKey);

    const selectedForums = getSelectedLinkedForums(activeCombination);
    const activeForumId = Number(selectedForums?.[0]?.value);

    const personaMappingForFlyout =
        activeCombination?.linkedForumPersonaMapping?.[activeForumId] || {};

    return (
        <div className={styles['container']}>
            <ExpandableForm
                title={<span>Tool Combination</span>}
                description="Manage report level, persona roles, and linked forum combinations"
                isOpen={openReportCombinationSection}
                onClick={() => {
                    setOpenReportCombinationSection(prev => !prev);
                }}
                additionalContentInTitleContainer={
                    <Flex align="center" gap="8px">
                        {/* ✅ Stop propagation ONLY for button */}
                        <div onClick={e => e.stopPropagation()}>
                            <Button
                                text="Add Report Combination"
                                variant="Secondary"
                                size="M"
                                onClick={() => {
                                    dispatch(forumLevel());
                                    dispatch(forumPeriod());
                                    setIsAddReportCombinationDialogOpen(true);
                                }}
                            />
                        </div>

                        {/* ✅ Explicit toggle for arrow */}
                        <div
                            onClick={e => {
                                e.stopPropagation();
                                setOpenReportCombinationSection(prev => !prev);
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <Icon
                                name={openReportCombinationSection ? 'chevron-up' : 'chevron-down'}
                                size="l"
                                color="neutrals-B800"
                            />
                        </div>
                    </Flex>
                }
                content={
                    <Flex vertical gap="16px">
                        <Table
                            columns={reportCombinationColumns}
                            data={reportCombinations}
                            expandableRows={false}
                        />
                    </Flex>
                }
            />

            {isAddReportCombinationDialogOpen && (
                <Dialog
                    key="add-report-combination"
                    className={styles['add-report-combination-dialog']}
                    title="Add Report Combination"
                    description="Select report details to add a combination in the report combination table."
                    isOpen={isAddReportCombinationDialogOpen}
                    onClose={handleCloseReportCombinationDialog}
                    primaryButtonText="Add Report Combination"
                    secondaryButtonText="Cancel"
                    onPrimaryButtonClick={handleAddReportCombination}
                    onSecondaryButtonClick={handleCloseReportCombinationDialog}
                    isPrimaryDisabled={
                        !dialogReportLevel ||
                        !dialogReportPeriod ||
                        dialogReportGeography.length === 0
                    }
                    content={
                        <Flex vertical gap="16px" style={{ paddingBottom: '1.25rem' }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <DropDown
                                        id="dialog-report-level"
                                        dropdown={{
                                            label: 'Report Level',
                                            options: reportLevelOptions,
                                            placeholder: 'Select Report Level',
                                            required: true,
                                            reset: false,
                                            onChange: (option: OptionType) => {
                                                setDialogReportLevel(option);
                                                setDialogReportGeography([]);
                                                dispatch(getGeographyByLevel(Number(option.value)));
                                            },
                                            selectedOptions: dialogReportLevel
                                                ? [dialogReportLevel]
                                                : [],
                                        }}
                                        searchInput={{
                                            searchPlaceholder: 'Search',
                                            searchSize: 'L',
                                            searchWholeString: true,
                                        }}
                                    />
                                </Col>
                                <Col span={12}>
                                    <DropDown
                                        id="dialog-report-period"
                                        dropdown={{
                                            label: 'Report Period',
                                            options: reportPeriodOptions,
                                            placeholder: 'Select Report Period',
                                            required: true,
                                            reset: false,
                                            onChange: (option: OptionType) => {
                                                setDialogReportPeriod(option);
                                            },
                                            selectedOptions: dialogReportPeriod
                                                ? [dialogReportPeriod]
                                                : [],
                                        }}
                                        searchInput={{
                                            searchPlaceholder: 'Search',
                                            searchSize: 'L',
                                            searchWholeString: true,
                                        }}
                                    />
                                </Col>
                            </Row>
                            <DropDown
                                id="dialog-report-geography"
                                dropdown={{
                                    label: 'Report Geography',
                                    type: 'checkbox',
                                    options: getReportGeographyOptions(),
                                    placeholder: 'Select Report Geography',
                                    required: true,
                                    reset: false,
                                    showSelectAll: true,
                                    isDisabled: !dialogReportLevel,
                                    onChange: (
                                        _option: OptionType,
                                        _checked: boolean,
                                        tree: object[],
                                    ) => {
                                        setDialogReportGeography(tree as OptionType[]);
                                    },
                                    selectedOptions: dialogReportGeography,
                                }}
                                searchInput={{
                                    searchPlaceholder: 'Search',
                                    searchSize: 'L',
                                    searchWholeString: true,
                                }}
                            />
                        </Flex>
                    }
                />
            )}

            {isReportCombinationDeleteDialogOpen && (
                <Dialog
                    key="delete-report-combination"
                    content={`Are you sure you want to delete this report combination? All roles and users will loose access to this combination of report.`}
                    isOpen={isReportCombinationDeleteDialogOpen}
                    onClose={() => setIsReportCombinationDeleteDialogOpen(false)}
                    onPrimaryButtonClick={handleDeleteReportCombination}
                    onSecondaryButtonClick={() => setIsReportCombinationDeleteDialogOpen(false)}
                    primaryButtonText="Delete"
                    secondaryButtonText="Don't Delete"
                    title="Delete Report Combination"
                    color="neutrals-B800"
                />
            )}

            {isRoleFlyoutOpen && (
                <RoleSelectionFlyoutForum
                    flyoutOpen={isRoleFlyoutOpen}
                    setIsFlyoutOpen={handleRoleFlyoutOpenChange}
                    userFlyoutOpen={false}
                    isRoleDataLoading={isRoleDataLoading}
                    isLoadingMore={showSelectedOnly ? false : isLoadingMoreRoles}
                    hasMoreItems={showSelectedOnly ? false : hasMoreRoles}
                    onLoadMore={showSelectedOnly ? () => {} : handleLoadMoreRoles}
                    items={filteredRoles}
                    isRoleOnlyMode={true}
                    totalUsers={savedFlyOutData[activePersonaId || '']?.users || []}
                    heading={`Select ${activePersonaName}`}
                    subHeading=""
                    userFlyoutHeading="Select Users"
                    userFlyoutSubHeading="Search and select users for this role"
                    showSearch
                    searchPlaceholder="Search Roles"
                    onSearchChange={value => {
                        const searchValue = Array.isArray(value) ? value.join(' ') : value;
                        setSearchKeyword(searchValue);
                    }}
                    onUserFlyoutBack={() => {
                        setUsersFlyoutOpen(false);
                    }}
                    dropdownFilter={dropdownFilters}
                    onItemToggle={(id, type) => {
                        if (type === 'Roles' && activePersonaId) {
                            setRolesAndUsers(prev => {
                                const list = prev[activePersonaId] ?? [];
                                const updated = list.map((role: any) =>
                                    String(role.roleId) === String(id)
                                        ? { ...role, checked: !role.checked }
                                        : role,
                                );

                                return {
                                    ...prev,
                                    [activePersonaId]: updated,
                                };
                            });
                        } else if (activePersonaId) {
                            const currentUsers = usersFlyoutData[activePersonaId] ?? [];
                            const updatedUsers = currentUsers.map((user: any) =>
                                user.userEmail === id || user.id === id
                                    ? { ...user, checked: !user.checked }
                                    : user,
                            );

                            setUsersFlyoutData(prev => ({
                                ...prev,
                                [activePersonaId]: updatedUsers,
                            }));

                            // setTempUsersSelection(prev => ({
                            //     ...prev,
                            //     [activePersonaId]: updatedUsers,
                            // }));
                        }
                    }}
                    onSelectUserCounter={(item: any) => {
                        setUsersFlyoutOpen(true);
                        if (!activePersonaId) return;

                        const personaRoles = rolesAndUsers[activePersonaId] ?? [];
                        const selectedRole = personaRoles.find(
                            (role: any) => String(role.roleId) === String(item.roleId),
                        );
                        const personaSavedUsers = savedFlyOutData[activePersonaId]?.users ?? [];
                        const updatedUsers =
                            selectedRole?.users.map((user: any) => {
                                const savedUser = personaSavedUsers.find(
                                    (saved: any) =>
                                        String(saved.roleId) === String(selectedRole.roleId) &&
                                        saved.userEmail === user.userEmail,
                                );

                                return {
                                    ...user,
                                    roleId: selectedRole.roleId,
                                    checked: savedUser?.checked ?? true,
                                    id: user.userEmail,
                                    numberOfUsers: 0,
                                };
                            }) ?? [];

                        setUsersFlyoutData(prev => ({
                            ...prev,
                            [activePersonaId]: updatedUsers,
                        }));

                        // setTempUsersSelection(prev => ({
                        //     ...prev,
                        //     [activePersonaId]: updatedUsers,
                        // }));

                        setSavedFlyOutData(prev => {
                            const personaData = prev[activePersonaId] ?? { roles: [], users: [] };
                            const alreadyExists = personaData.users.some(
                                (user: any) => String(user.roleId) === String(selectedRole?.roleId),
                            );

                            if (alreadyExists) return prev;

                            return {
                                ...prev,
                                [activePersonaId]: {
                                    ...personaData,
                                    users: [
                                        ...personaData.users,
                                        ...updatedUsers.map((user: any) => ({
                                            ...user,
                                            checked: true,
                                        })),
                                    ],
                                },
                            };
                        });
                    }}
                    showSelectAll={!showSelectedOnly && filteredRoles.length > 0}
                    isAllSelected={
                        (rolesAndUsers[activePersonaId ?? ''] ?? []).length > 0 &&
                        (rolesAndUsers[activePersonaId ?? ''] ?? []).every(role => role.checked)
                    }
                    onSelectAllToggle={() => {
                        const personaId = activePersonaId ?? '';
                        const list = rolesAndUsers[personaId] ?? [];
                        const shouldSelectAll = !list.every(role => role.checked);

                        const updated = list.map((role: any) => ({
                            ...role,
                            checked: shouldSelectAll,
                        }));

                        setRolesAndUsers(prev => ({
                            ...prev,
                            [personaId]: updated,
                        }));
                    }}
                    primaryBtnProps={{
                        text: 'Save',
                        variant: 'Primary',
                        onClick: handleRoleFlyoutSave,
                    }}
                    secondaryBtnProps={{
                        disabled: false,
                        onClick: closeRoleFlyout,
                        text: 'Cancel',
                        variant: 'Secondary',
                    }}
                    cancelBtnProps={{
                        disabled: false,
                        onClick: () => setShowSelectedOnly(prev => !prev),
                        text: showSelectedOnly
                            ? 'Show All'
                            : `View Selected (${getSelectedRolesCount()})`,
                        variant: 'Subtle2',
                    }}
                    primaryBtnPropsUsersFlyout={{
                        text: 'Save',
                        variant: 'Primary',
                        onClick: () => {
                            if (!activePersonaId) return;

                            setSavedFlyOutData(prev => {
                                const personaData = prev[activePersonaId] || {
                                    roles: [],
                                    users: [],
                                };
                                const personaUsersFromState =
                                    usersFlyoutData[activePersonaId] ?? [];

                                return {
                                    ...prev,
                                    [activePersonaId]: {
                                        ...personaData,
                                        users: personaUsersFromState,
                                    },
                                };
                            });

                            setUsersFlyoutOpen(false);
                        },
                    }}
                    secondaryBtnPropsUserFlyout={{
                        text: 'Cancel',
                        variant: 'Secondary',
                        onClick: () => setUsersFlyoutOpen(false),
                    }}
                    cancelBtnPropsUsersFlyout={{
                        disabled: false,
                        onClick: () => setShowSelectedUsersOnly(prev => !prev),
                        text: showSelectedUsersOnly
                            ? 'Show All'
                            : `View Selected (${getSelectedUsersCount()})`,
                        variant: 'Subtle2',
                    }}
                    userDropdownFilter={userLocationFilter}
                />
            )}

            <LinkedForumFlyout
                flyoutOpen={isLinkedForumFlyoutOpen}
                onClose={() => {
                    setIsLinkedForumFlyoutOpen(false);
                    setActiveLinkedForumRowKey(null);
                }}
                initialPersonaMapping={personaMappingForFlyout}
                forums={linkedForumItems}
                forumPersonaTypes={forumPersonaTypes.length > 0 ? forumPersonaTypes : undefined}
                personaOptions={
                    forumPersonaToolPersonaOptions.length > 0
                        ? forumPersonaToolPersonaOptions
                        : reportCombinationPersonas.map(persona => ({
                              label: getPersonaName(persona),
                              value: getPersonaId(persona),
                          }))
                }
                functionOptions={mapToOptions(columnFilters?.function)}
                subFunctionOptions={mapToOptions(columnFilters?.subfunction)}
                geographyLevelOptions={geographyLevelOptions}
                onSave={handleLinkedForumSave}
            />

            <Toast
                type="Success"
                message="Tool combination changes saved successfully."
                mode="Top Right"
                distance="x5l"
                toggle={showSaveToast}
                timer={5000}
                onCloseToast={() => setShowSaveToast(false)}
            />
            <Toast
                type="Success"
                message="Tool combination changes discarded."
                mode="Top Right"
                distance="x5l"
                toggle={showDiscardToast}
                timer={5000}
                onCloseToast={() => setShowDiscardToast(false)}
            />
            <Toast
                type="Error"
                message="Failed to save tool combination changes."
                mode="Top Right"
                distance="x5l"
                toggle={showErrorToast}
                timer={5000}
                onCloseToast={() => setShowErrorToast(false)}
            />
        </div>
    );
}

export default ToolCombination;
