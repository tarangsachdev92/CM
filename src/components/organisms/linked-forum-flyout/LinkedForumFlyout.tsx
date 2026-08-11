import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Flex } from 'antd';
import { Flyout, SearchInput, CheckBox, Tab, DropDown, Dialog } from 'konnect-react-components';
import type { OptionType } from '../../../types/common';
import { getForumSelectionFlyout } from '../../../services/forums';
import styles from './LinkedForumFlyout.module.scss';

export interface ForumItem {
    id: string;
    label: string;
    subLabel?: string;
    checked: boolean;
    isActive?: boolean;
    regionCount?: number;
}

export interface ForumPersonaType {
    forumPersonaTypeId: number;
    forumPersonaTypeName: string;
}

export type PersonaMapping = Record<number, OptionType | null>;

export interface LinkedForumSavePayload {
    selectedForums: ForumItem[];
    personaMapping: PersonaMapping;
}

export interface LinkedForumFlyoutProps {
    flyoutOpen: boolean;
    onClose: () => void;
    forums?: ForumItem[];
    forumPersonaTypes?: ForumPersonaType[];
    personaOptions?: OptionType[];
    initialPersonaMapping?: PersonaMapping;
    onSave: (payload: LinkedForumSavePayload) => void;
    functionOptions?: OptionType[];
    subFunctionOptions?: OptionType[];
    geographyLevelOptions?: OptionType[];
    periodOptions?: OptionType[];
}

type RawForumItem = {
    forumId?: string | number;
    id?: string | number;
    forumName?: string;
    label?: string;
    functionId?: number;
    functionName?: string;
    subFunctionId?: number;
    subFunctionName?: string;
    geographyLevelId?: number;
    forumLevel?: string;
    periodId?: number;
    forumPeriod?: string;
    subLabel?: string;
    isActive?: boolean;
    regionCount?: number;
    checked?: boolean;
};

const DEFAULT_PERSONA_OPTIONS: OptionType[] = [
    { label: 'Editor', value: 'editor' },
    { label: 'Viewer', value: 'viewer' },
    { label: 'Owner', value: 'owner' },
];

type TabName = 'Forum' | 'Map Persona';

type ForumFilterKey = 'function' | 'subFunction' | 'geoLevel' | 'period';

const DEFAULT_FORUM_PERSONA_TYPES: ForumPersonaType[] = [
    { forumPersonaTypeId: 1, forumPersonaTypeName: 'Forum Owner' },
    { forumPersonaTypeId: 2, forumPersonaTypeName: 'Decision Owner' },
    { forumPersonaTypeId: 3, forumPersonaTypeName: 'Viewer' },
];

export const LinkedForumFlyout: React.FC<LinkedForumFlyoutProps> = ({
    flyoutOpen,
    onClose,
    forums,
    forumPersonaTypes = DEFAULT_FORUM_PERSONA_TYPES,
    personaOptions = DEFAULT_PERSONA_OPTIONS,
    initialPersonaMapping = {},
    onSave,
}) => {
    const [activeTab, setActiveTab] = useState<TabName>('Forum');
    const [searchValue, setSearchValue] = useState('');
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [openKey, setOpenKey] = useState(0);

    // Unique filter options derived from API response
    const [apiFilterOptions, setApiFilterOptions] = useState({
        function: [] as OptionType[],
        subFunction: [] as OptionType[],
        geoLevel: [] as OptionType[],
        period: [] as OptionType[],
    });

    // Forum tab state
    const [forumList, setForumList] = useState<ForumItem[]>([]);
    const [selectedFunctionFilter, setSelectedFunctionFilter] = useState<OptionType[]>([]);
    const [selectedSubFunctionFilter, setSelectedSubFunctionFilter] = useState<OptionType[]>([]);
    const [selectedGeoLevelFilter, setSelectedGeoLevelFilter] = useState<OptionType[]>([]);
    const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<OptionType[]>([]);

    // Map Persona tab state
    const [personaMapping, setPersonaMapping] = useState<PersonaMapping>(initialPersonaMapping);

    // Discard changes dialog
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const lastSavedStateRef = useRef<{
        selectedForumIds: string[];
        personaMapping: PersonaMapping;
    }>({
        selectedForumIds: [],
        personaMapping: {},
    });
    const selectedForumIdsRef = useRef<Set<string>>(new Set());
    const wasFlyoutOpenRef = useRef(false);
    const isClosingRef = useRef(false);

    const buildUniqueForumList = useCallback(
        (items: RawForumItem[] = [], previousForums: ForumItem[] = []): ForumItem[] => {
            const uniqueForums = new Map<string, ForumItem>();

            items.forEach(item => {
                const id = String(item.forumId ?? item.id);
                const alreadySelected = previousForums.find(forum => forum.id === id)?.checked;

                uniqueForums.set(id, {
                    id,
                    label: item.forumName ?? item.label ?? '',
                    subLabel:
                        item.forumLevel && item.forumPeriod
                            ? `${item.forumLevel} | ${item.forumPeriod}`
                            : item.subLabel,
                    checked: alreadySelected ?? selectedForumIdsRef.current.has(id),
                    isActive: item.isActive,
                    regionCount: item.regionCount,
                });
            });

            return Array.from(uniqueForums.values());
        },
        [],
    );

    const fetchForumsFromApi = useCallback(
        async (
            search: string,
            funcFilter: OptionType[] = [],
            subFuncFilter: OptionType[] = [],
            geoFilter: OptionType[] = [],
            periodFilter: OptionType[] = [],
        ) => {
            setIsLoading(true);
            try {
                const data = await getForumSelectionFlyout({
                    functionId: funcFilter.length
                        ? funcFilter.map(f => String(f.value)).join(',')
                        : undefined,
                    subFunctionId: subFuncFilter.length
                        ? subFuncFilter.map(f => String(f.value)).join(',')
                        : undefined,
                    geographyLevelId: geoFilter.length
                        ? geoFilter.map(f => String(f.value)).join(',')
                        : undefined,
                    periodId: periodFilter.length
                        ? periodFilter.map(f => String(f.value)).join(',')
                        : undefined,
                    searchText: search || undefined,
                });

                const items: RawForumItem[] = data ?? [];

                // Derive unique filter options from the response
                const seenFunc = new Map<number, string>();
                const seenSub = new Map<number, string>();
                const seenGeo = new Map<number, string>();
                const seenPeriod = new Map<number, string>();
                items.forEach(item => {
                    if (item.functionId && item.functionName && !seenFunc.has(item.functionId))
                        seenFunc.set(item.functionId, item.functionName);
                    if (
                        item.subFunctionId &&
                        item.subFunctionName &&
                        !seenSub.has(item.subFunctionId)
                    )
                        seenSub.set(item.subFunctionId, item.subFunctionName);
                    if (item.geographyLevelId && item.forumLevel && !seenGeo.has(item.geographyLevelId))
                        seenGeo.set(item.geographyLevelId, item.forumLevel);
                    if (item.periodId && item.forumPeriod && !seenPeriod.has(item.periodId))
                        seenPeriod.set(item.periodId, item.forumPeriod);
                });
                setApiFilterOptions({
                    function: Array.from(seenFunc.entries()).map(([id, name]) => ({
                        value: String(id),
                        label: name,
                    })),
                    subFunction: Array.from(seenSub.entries()).map(([id, name]) => ({
                        value: String(id),
                        label: name,
                    })),
                    geoLevel: Array.from(seenGeo.entries()).map(([id, name]) => ({
                        value: String(id),
                        label: name,
                    })),
                    period: Array.from(seenPeriod.entries()).map(([id, name]) => ({
                        value: String(id),
                        label: name,
                    })),
                });

                setForumList(prev => buildUniqueForumList(items, prev));
            } catch {
                setForumList([]);
                setApiFilterOptions({ function: [], subFunction: [], geoLevel: [], period: [] });
            } finally {
                setIsLoading(false);
            }
        },
        [buildUniqueForumList],
    );

    const mapSelectedOptions = (list: OptionType[] = []): OptionType[] =>
        list.map(item => ({
            label: item.label,
            value: String(item.value),
        }));

    const handleMultiSelectChange = useCallback(
        (key: ForumFilterKey) => {
            return (_option: OptionType, _checked: boolean, tree: object[]) => {
                const nextSelected = (tree || []) as OptionType[];
                const nextFunc = key === 'function' ? nextSelected : selectedFunctionFilter;
                const nextSub = key === 'subFunction' ? nextSelected : selectedSubFunctionFilter;
                const nextGeo = key === 'geoLevel' ? nextSelected : selectedGeoLevelFilter;
                const nextPeriod = key === 'period' ? nextSelected : selectedPeriodFilter;

                setSelectedFunctionFilter(nextFunc);
                setSelectedSubFunctionFilter(nextSub);
                setSelectedGeoLevelFilter(nextGeo);
                setSelectedPeriodFilter(nextPeriod);
                fetchForumsFromApi(searchValue, nextFunc, nextSub, nextGeo, nextPeriod);
            };
        },
        [
            fetchForumsFromApi,
            searchValue,
            selectedFunctionFilter,
            selectedSubFunctionFilter,
            selectedGeoLevelFilter,
            selectedPeriodFilter,
        ],
    );

    // Reset all state and fetch fresh data when flyout opens
    useEffect(() => {
        if (flyoutOpen && !wasFlyoutOpenRef.current) {
            wasFlyoutOpenRef.current = true;
            isClosingRef.current = false;
            const initialSelectedForumIds = (forums || []).map(f => String(f.id)).sort();
            lastSavedStateRef.current = {
                selectedForumIds: initialSelectedForumIds,
                personaMapping: initialPersonaMapping,
            };
            selectedForumIdsRef.current = new Set(initialSelectedForumIds);

            setOpenKey(prev => prev + 1);
            setSearchValue('');
            setShowSelectedOnly(false);
            setActiveTab('Forum');
            setSelectedFunctionFilter([]);
            setSelectedSubFunctionFilter([]);
            setSelectedGeoLevelFilter([]);
            setSelectedPeriodFilter([]);
            setPersonaMapping(initialPersonaMapping);

            setForumList(
                buildUniqueForumList(
                    (forums || []).map(f => ({
                        ...f,
                        forumId: f.id,
                        forumName: f.label,
                        forumLevel: f.subLabel?.split(' | ')[0] ?? '',
                        forumPeriod: f.subLabel?.split(' | ')[1] ?? '',
                        checked: true,
                    })),
                    [],
                ),
            );
            fetchForumsFromApi('');
            return;
        }

        if (!flyoutOpen) {
            wasFlyoutOpenRef.current = false;
        }
    }, [flyoutOpen, initialPersonaMapping, forums, fetchForumsFromApi, buildUniqueForumList]);

    // Debounced re-fetch when search text changes
    useEffect(() => {
        if (!flyoutOpen || searchValue === '') return;
        const timer = setTimeout(() => {
            fetchForumsFromApi(
                searchValue,
                selectedFunctionFilter,
                selectedSubFunctionFilter,
                selectedGeoLevelFilter,
                selectedPeriodFilter,
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchValue, flyoutOpen, fetchForumsFromApi]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedForums = forumList.filter(f => f.checked);
    const totalSelected = selectedForums.length;

    const isMapPersonaSaveDisabled =
        activeTab === 'Map Persona' &&
        forumPersonaTypes.some(
            type =>
                !personaMapping[type.forumPersonaTypeId] ||
                personaMapping[type.forumPersonaTypeId]?.value === undefined ||
                personaMapping[type.forumPersonaTypeId]?.value === null ||
                String(personaMapping[type.forumPersonaTypeId]?.value).trim() === '',
        );

    const isAllSelected = forumList.length > 0 && forumList.every(f => f.checked);

    const forumsToDisplay = showSelectedOnly ? selectedForums : forumList;

    const filteredForums = forumsToDisplay.filter(forum => {
        const matchesSearch = forum.label.toLowerCase().includes(searchValue.toLowerCase());
        return matchesSearch;
    });

    const handleSelectAll = (checked: boolean) => {
        selectedForumIdsRef.current = checked
            ? new Set(forumList.map(forum => forum.id))
            : new Set();
        setForumList(prev => prev.map(f => ({ ...f, checked })));
    };

    const handleToggleForum = (id: string) => {
        const nextSelectedIds = new Set(selectedForumIdsRef.current);
        if (nextSelectedIds.has(id)) {
            nextSelectedIds.delete(id);
        } else {
            nextSelectedIds.add(id);
        }
        selectedForumIdsRef.current = nextSelectedIds;
        setForumList(prev => prev.map(f => (f.id === id ? { ...f, checked: !f.checked } : f)));
    };

    const hasUnsavedChanges = useCallback((): boolean => {
        const currentSelectedIds = forumList
            .filter(f => f.checked)
            .map(f => String(f.id))
            .sort();

        const savedSelectedIds = [...lastSavedStateRef.current.selectedForumIds]
            .map(id => String(id))
            .sort();

        const forumChanged =
            JSON.stringify(currentSelectedIds) !== JSON.stringify(savedSelectedIds);

        const personaChanged =
            JSON.stringify(personaMapping) !==
            JSON.stringify(lastSavedStateRef.current.personaMapping);

        return forumChanged || personaChanged;
    }, [forumList, personaMapping]);

    const requestClose = useCallback(() => {
        if (!flyoutOpen || isClosingRef.current) {
            return;
        }

        if (hasUnsavedChanges()) {
            setShowDiscardDialog(true);
        } else {
            isClosingRef.current = true;
            onClose();
        }
    }, [flyoutOpen, hasUnsavedChanges, onClose]);

    const handleCancelClick = () => {
        requestClose();
    };

    const handleDiscardChanges = () => {
        isClosingRef.current = true;
        setShowDiscardDialog(false);
        setForumList([]);
        setPersonaMapping(initialPersonaMapping);
        setSearchValue('');
        setShowSelectedOnly(false);
        setSelectedFunctionFilter([]);
        setSelectedSubFunctionFilter([]);
        setSelectedGeoLevelFilter([]);
        setSelectedPeriodFilter([]);
        setActiveTab('Forum');
        onClose();
    };

    const handleContinueEditing = () => {
        setShowDiscardDialog(false);
    };

    const handleSave = () => {
        if (activeTab === 'Forum') {
            setActiveTab('Map Persona');
            return;
        }

        const selectedIds = selectedForums.map(f => f.id);

        lastSavedStateRef.current = {
            selectedForumIds: selectedIds,
            personaMapping: personaMapping,
        };
        selectedForumIdsRef.current = new Set(selectedIds);

        onSave({ selectedForums, personaMapping });

        setSearchValue('');
        setShowSelectedOnly(false);
        setSelectedFunctionFilter([]);
        setSelectedSubFunctionFilter([]);
        setSelectedGeoLevelFilter([]);
        setSelectedPeriodFilter([]);
        setActiveTab('Forum');
        isClosingRef.current = true;
        onClose();
    };

    const tabItems = [
        { label: 'Forum', tabCode: 'forum' },
        { label: 'Map Persona', tabCode: 'map-persona' },
    ];

    const forumTabContent = (
        <Flex vertical className={styles['flyout-body']}>
            <SearchInput
                key={openKey}
                border={false}
                placeholder="Search Forums"
                onChange={val => setSearchValue(String(val))}
                className={styles['search-input-forum']}
            />

            <div className={styles['content-wrapper']}>
                <div className={styles['dropdown-wrapper']}>
                    <DropDown
                        dropdown={{
                            size: 'S',
                            label: 'Function',
                            isLabelInline: true,
                            options: apiFilterOptions.function,
                            onChange: handleMultiSelectChange('function'),
                            selectedOptions: mapSelectedOptions(selectedFunctionFilter),
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
                            options: apiFilterOptions.subFunction,
                            onChange: handleMultiSelectChange('subFunction'),
                            selectedOptions: mapSelectedOptions(selectedSubFunctionFilter),
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
                            options: apiFilterOptions.geoLevel,
                            onChange: handleMultiSelectChange('geoLevel'),
                            selectedOptions: mapSelectedOptions(selectedGeoLevelFilter),
                            type: 'checkbox',
                            showSelectAll: true,
                            selectAllOption: { label: 'Select All', value: 'all' },
                            placeholder: '',
                        }}
                    />
                    <DropDown
                        dropdown={{
                            size: 'S',
                            label: 'Period',
                            isLabelInline: true,
                            options: apiFilterOptions.period,
                            onChange: handleMultiSelectChange('period'),
                            selectedOptions: mapSelectedOptions(selectedPeriodFilter),
                            type: 'checkbox',
                            showSelectAll: true,
                            selectAllOption: { label: 'Select All', value: 'all' },
                            placeholder: '',
                        }}
                    />
                </div>

                <div className={styles['checkbox-list']}>
                {isLoading ? (
                    <div className={styles['loading-state']}>Loading forums...</div>
                ) : (
                    <>
                        {!showSelectedOnly && forumList.length > 0 && (
                            <div className={styles['select-all-row']}>
                                <CheckBox
                                    label="Select All"
                                    checked={isAllSelected}
                                    onChange={(checked: boolean) => handleSelectAll(checked)}
                                />
                            </div>
                        )}
                        <Flex vertical gap={0}>
                            {filteredForums.length === 0 ? (
                                <div className={styles['empty-state']}>No forums found.</div>
                            ) : (
                                filteredForums.map(forum => (
                                    <div key={forum.id} className={styles['forum-row']}>
                                        <CheckBox
                                            label={
                                                <Flex vertical gap={1}>
                                                    <span className={styles['forum-label']}>
                                                        {forum.label}
                                                    </span>
                                                    {forum.subLabel && (
                                                        <span className={styles['forum-sub-label']}>
                                                            {forum.subLabel}
                                                        </span>
                                                    )}
                                                </Flex>
                                            }
                                            checked={forum.checked}
                                            onChange={() => handleToggleForum(forum.id)}
                                        />
                                    </div>
                                ))
                            )}
                        </Flex>
                    </>
                )}
                </div>
            </div>
        </Flex>
    );

    const mapPersonaTabContent = (
        <Flex vertical gap={24} className={styles['tab-content']} style={{ padding: '16px' }}>
            {forumPersonaTypes.map(type => (
                <Flex vertical gap={8} key={type.forumPersonaTypeId}>
                    <DropDown
                        id={`persona-type-${type.forumPersonaTypeId}`}
                        dropdown={{
                            label: `Select persona for ${type.forumPersonaTypeName}`,
                            options: personaOptions,
                            placeholder: 'Select Persona',
                            reset: false,
                            onChange: (opt: OptionType) =>
                                setPersonaMapping(prev => ({
                                    ...prev,
                                    [type.forumPersonaTypeId]: opt,
                                })),
                            selectedOptions: personaMapping[type.forumPersonaTypeId]
                                ? [personaMapping[type.forumPersonaTypeId]!]
                                : [],
                        }}
                    />
                </Flex>
            ))}
        </Flex>
    );

    const flyoutContent = (
        <Flex vertical className={styles['flyout-content']}>
            <div className={styles['tab-wrapper']}>
                <Tab
                    key={`linked-forum-tab-${openKey}-${activeTab}`}
                    items={tabItems}
                    onClick={(item: { label?: string; tabCode?: string }) => {
                        if (item.label === 'Forum' || item.tabCode === 'forum') {
                            setActiveTab('Forum');
                        } else {
                            setActiveTab('Map Persona');
                        }
                    }}
                    DefaultSelected={activeTab === 'Forum' ? tabItems[0] : tabItems[1]}
                    fullWidthTabs
                />
            </div>
            {activeTab === 'Forum' ? forumTabContent : mapPersonaTabContent}
        </Flex>
    );

    return (
        <>
            <div className={styles['linked-forum-flyout']}>
                <Flyout
                    flyoutOpen={flyoutOpen}
                    onBackDropClick={handleCancelClick}
                    heading="Select Forum"
                    content={flyoutContent}
                    cancelIconClick={handleCancelClick}
                    iconForCancel={{
                        icon: 'x-close',
                        size: 'Tiny',
                        onClick: handleCancelClick,
                    }}
                    showfooter
                    cancelBtnProps={
                        activeTab === 'Forum'
                            ? {
                                  disabled: false,
                                  onClick: () => setShowSelectedOnly(prev => !prev),
                                  text: showSelectedOnly
                                      ? 'Show All'
                                      : `View Selected (${totalSelected})`,
                                  variant: 'Subtle2',
                              }
                            : undefined
                    }
                    secondaryBtnProps={{
                        text: 'Cancel',
                        variant: 'Secondary',
                        onClick: handleCancelClick,
                    }}
                    primaryBtnProps={{
                        text: 'Save',
                        variant: 'Primary',
                        disabled: isMapPersonaSaveDisabled,
                        onClick: handleSave,
                    }}
                    containerMaxWidth="35rem"
                    direction="right"
                    id="linked-forum-flyout"
                    dataTestId="linked-forum-flyout"
                />
            </div>

            {/* Discard Changes Dialog */}
            <Dialog
                title="Discard Changes"
                content="Are you sure you want to discard your changes? All unsaved selections will be lost."
                isOpen={showDiscardDialog}
                onClose={handleContinueEditing}
                primaryButtonText="Discard Changes"
                secondaryButtonText="Continue Editing"
                onPrimaryButtonClick={handleDiscardChanges}
                onSecondaryButtonClick={handleContinueEditing}
            />
        </>
    );
};

export default LinkedForumFlyout;
