import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Flex } from 'antd';
import {
    Flyout,
    Button,
    Accordion,
    Switch,
    Icon,
    CheckBox,
    DropDown,
    InputField,
    AnimatedLoaders,
} from 'konnect-react-components';
import { Label } from '../../../atoms';
import { DemoKpiCard } from '../table-widgets/Tables';
import type { TableWidgetState } from '../table-widgets/TableWidget';
import styles from './TableCustomizationPanel.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../store';
import {
    fetchWidgetConfiguration,
    saveWidgetConfiguration,
} from '../../../../store/thunks/performanceManagementWidgets';
import { fetchDynamicTabs } from '../../../../store/thunks/dynamicTabs';
import type { IWidgetOption } from '../../../../types/response';
import { logError } from '../../../../utils/helpers';
import TableHeader from '../table-widgets/TableHeader';
import { TableHeaderProps } from '../../../../types/common';

const SETUP_TAB = 'Setup';
const STYLING_TAB = 'Styling';
const FILTER_TAB = 'Filter';
const PANEL_TABS = [SETUP_TAB, STYLING_TAB, FILTER_TAB] as const;
const REPORT_ID = 1;
const WIDGET_NAMES = 'tableChart';
const WIDGET_TYPES = 'Table';

const SETUP_ACCORDIONS = [
    { key: 'header', title: 'Header' },
    { key: 'to-date-values', title: 'To Date Values' },
    { key: 'column-and-row-setup', title: 'Column and Row Setup' },
    { key: 'column-drilldown', title: 'Column Drilldown' },
    { key: 'user-selection', title: 'User Selections' },
    { key: 'action-setup', title: 'Actions Setup' },
    { key: 'pivot-table', title: 'Pivot Table' },
] as const;

const STYLING_ACCORDIONS = [] as const;

type OptionValue = string | number | boolean | string[] | number[] | null;

interface ExtendedOptionItem {
    path: string;
    title?: string;
    value: OptionValue; // bindable value
    options?: OptionValue[] | null;
    visible: boolean;
    disabled: boolean;
    error: string | null;
    raw: IWidgetOption;
}

type OptionState = Record<string, ExtendedOptionItem>;
type ToDateType = 'MTD' | 'QTD' | 'YTD';

type ComparisonType = 'Previous' | 'Target';

type StatusType = 'Success' | 'Warning' | 'Alert';

export type PerformanceStatus = {
    label: ToDateType;
    value: number;
    target: number;
    type: StatusType;
    comparison?: {
        type: ComparisonType;
        percentage: number | null;
    } | null;
};

export interface TableCustomizationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    tableState: TableWidgetState;
    titleLabel: string;
    widgetToken: string;
    activeTabId: number;
    onSave?: (config: Record<string, unknown>) => void;
    previewGraphic: React.ReactNode;
    TabId: number;
}

const TableCustomizationPanel: React.FC<TableCustomizationPanelProps> = ({
    isOpen,
    onClose,
    tableState,
    titleLabel,
    onSave,
    previewGraphic,
    TabId,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const widgetConfigurations = useSelector(
        (state: RootState) => state.performanceManagementWidgets.widgetConfiguration,
    );
    const isLoadingWidgetConfigurations = useSelector(
        (state: RootState) => state.performanceManagementWidgets.isWidgetConfigLoading,
    );

    const isTabLoading = useSelector((state: RootState) => state.dynamicTabs.isFetching);
    const widgetConfigurationsError = useSelector(
        (state: RootState) => state.performanceManagementWidgets.errorWidgetConfiguration,
    );
    const dynamicTabError = useSelector((state: RootState) => state.dynamicTabs.error);

    const widgetConfig = widgetConfigurations?.[0];
    const error = widgetConfigurationsError || dynamicTabError;
    const isLoading = isLoadingWidgetConfigurations || isTabLoading;
    const widgetConfigRef = useRef(widgetConfig);

    const [activePanelTab, setActivePanelTab] = useState<(typeof PANEL_TABS)[number]>(SETUP_TAB);
    const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());
    const [columnDrilldown, setColumnDrilldown] = useState(false);
    const [optionState, setOptionState] = useState<OptionState>({});
    const optionStateRef = useRef(optionState);
    const savedConfigRef = useRef<Record<string, unknown>>({});
    const editingConfigRef = useRef<Record<string, unknown>>({});
    const subtitleRef = useRef<HTMLDivElement>(null);
    const linkRef = useRef<HTMLDivElement>(null);

    const buildOptionStateWithPaths = (
        options: IWidgetOption[],
        parentPath = '',
        state: OptionState = {},
    ): OptionState => {
        const getNodeKey = (option: IWidgetOption, parentPath: string) =>
            parentPath
                ? `${parentPath}.${option.optionKey || option.optionName}`
                : option.optionKey || option.optionName;

        options.forEach(option => {
            const path = getNodeKey(option, parentPath);

            state[path] = {
                path,
                title: option.optionName ?? null,
                value: option.defaultValue ?? null,
                options: option.availableValues ?? null,
                visible: true,
                disabled: false,
                error: null,
                raw: option,
            };

            if (option.children?.length) {
                buildOptionStateWithPaths(option.children, path, state);
            }
        });

        return state;
    };

    const updateWidgetOptionsWithValues = (
        options: IWidgetOption[],
        state: OptionState,
        parentPath = '',
    ): IWidgetOption[] => {
        const getNodeKey = (option: IWidgetOption, parentPath: string) =>
            parentPath
                ? `${parentPath}.${option.optionKey || option.optionName}`
                : option.optionKey || option.optionName;

        return options.map(option => {
            const path = getNodeKey(option, parentPath);
            const currentState = state[path];

            const resolvedValue =
                currentState?.value !== undefined
                    ? currentState.value
                    : (option.defaultValue ?? null);

            return {
                ...option, // keep everything same

                // overwrite defaultValue with updated value
                defaultValue: resolvedValue,

                // recursive update
                children: option.children?.length
                    ? updateWidgetOptionsWithValues(option.children, state, path)
                    : option.children,
            };
        });
    };

    const saveConfiguration = async () => {
        try {
            if (!widgetConfigRef.current) {
                return;
            }
            const updatedWidgetOptions = updateWidgetOptionsWithValues(
                widgetConfigRef.current.widgetOptions,
                optionStateRef.current,
            );

            const payload = {
                WidgetId: widgetConfigRef.current?.widgetId,
                widgetOptions: updatedWidgetOptions,
            };

            await dispatch(saveWidgetConfiguration(payload)).unwrap();
        } catch (error: unknown) {
            logError(error);
        }
    };

    const getFirstWidget = async (
        tabId: number,
        filters: { widgetName?: string; widgetTypeName?: string },
    ) => {
        const { widgets } = await dispatch(
            fetchDynamicTabs({ reportId: REPORT_ID, tabId }),
        ).unwrap();

        const filtered =
            widgets?.filter((w: any) => {
                return (
                    (!filters.widgetName || w.widgetName === filters.widgetName) &&
                    (!filters.widgetTypeName || w.widgetTypeName === filters.widgetTypeName)
                );
            }) ?? [];

        return filtered[0] ?? null;
    };

    const loadWidgetConfiguration = async () => {
        if (!TabId) {
            logError('Tab is not Selected');
            return;
        }

        try {
            const widget = await getFirstWidget(TabId, {
                widgetName: WIDGET_NAMES,
                widgetTypeName: WIDGET_TYPES,
            });
            if (!widget) {
                logError('Widget is empty');
                return;
            }

            await dispatch(
                fetchWidgetConfiguration({
                    kpiIdsCsv: widget.kpiId,
                    visualTypeId: widget.widgetVisualTypeId,
                    widgetId: widget.widgetId,
                }),
            );
        } catch (error) {
            logError(error);
        }
    };

    useEffect(() => {
        loadWidgetConfiguration();
    }, [isOpen, dispatch]);

    useEffect(() => {
        if (!widgetConfig) return;
        const state = buildOptionStateWithPaths(widgetConfig.widgetOptions);

        setOptionState(state);
    }, [widgetConfig]);

    useEffect(() => {
        optionStateRef.current = optionState;
        widgetConfigRef.current = widgetConfig;
    }, [optionState]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (subtitleRef.current && !subtitleRef.current.contains(target)) {
                const value = optionState['Setup.Header.Sub-title.Sub-title Text']?.value;

                if (!value || String(value).trim() === '') {
                    handleOptionChange('Setup.Header.Sub-title', false);
                }
            }

            if (!optionState['Setup.Header.Link']?.value) return;

            const isInside = linkRef.current && linkRef.current.contains(target);

            if (!isInside) {
                const value = optionState['Setup.Header.Link.Link Text']?.value;

                const isEmpty =
                    !value || String(value).trim() === '' || value === 'Select link URL';

                if (isEmpty) {
                    handleOptionChange('Setup.Header.Link', false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [optionState]);

    const handleOptionChange = (key: string, value: any) => {
        if (value === undefined) return;

        setOptionState(prev => {
            const existing = prev[key];

            const safeItem: ExtendedOptionItem = existing ?? {
                path: key,
                title: key.split('.').pop() || '',
                value,
                options: [],
                visible: true,
                disabled: false,
                error: null,
                raw: {
                    defaultValue: value,
                } as IWidgetOption,
            };

            return {
                ...prev,
                [key]: {
                    ...safeItem,
                    value,
                    raw: {
                        ...safeItem.raw,
                        defaultValue: value,
                    },
                },
            };
        });
    };

    const toggleAccordion = useCallback((key: string) => {
        setExpandedAccordions(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    const handleReset = useCallback(() => {
        editingConfigRef.current = { ...savedConfigRef.current };
        setColumnDrilldown((savedConfigRef.current.columnDrilldown as boolean) ?? false);
    }, []);

    const handleSaveTable = useCallback(() => {
        saveConfiguration();
        savedConfigRef.current = { ...editingConfigRef.current, columnDrilldown };
        onSave?.(savedConfigRef.current);
        onClose();
    }, [onSave, onClose]);

    const handleClose = useCallback(() => {
        handleReset();
        onClose();
    }, [handleReset, onClose]);

    const calculatePercentage = (current: number, previous: number): number | null => {
        if (!previous) return null;
        return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const getStatusType = (dateValue: string): StatusType => {
        if (dateValue === 'MTD') return 'Success';
        if (dateValue === 'QTD') return 'Warning';
        return 'Alert';
    };

    const getPerformanceStatus = (optionState: any): PerformanceStatus[] => {
        const result: PerformanceStatus[] = [];

        const toDateTypes: ToDateType[] = ['MTD', 'QTD', 'YTD'];

        toDateTypes.forEach(type => {
            const isEnabled = optionState[`Setup.To Date Values.${type}`]?.value;
            if (!isEnabled) return;

            const currentValue = optionState[`Data.${type}.current`] ?? 60;
            const previousValue = optionState[`Data.${type}.previous`] ?? 50;
            const targetValue = optionState[`Data.${type}.target`] ?? 40;
            const comparisonValues = optionState['Setup.To Date Values.Comparison of']?.value || [];

            const isComparisonEnabled = comparisonValues.includes(type);

            const compareWith =
                optionState[`Setup.To Date Values.Compare with`]?.value || 'Previous';

            const percentage = isComparisonEnabled
                ? calculatePercentage(currentValue, previousValue)
                : 20;

            result.push({
                label: type,
                value: currentValue,
                target: targetValue,
                type: getStatusType(type),
                comparison: isComparisonEnabled
                    ? {
                          type: compareWith,
                          percentage,
                      }
                    : null,
            });
        });
        return result;
    };

    const getTableHeaderProps = (optionState: any): TableHeaderProps => {
        return {
            title: optionState['Setup.Header.Title']?.value || titleLabel,

            subtitle: optionState['Setup.Header.Sub-title']?.value
                ? optionState['Setup.Header.Sub-title.Sub-title Text']?.value
                : '',

            linkButton: {
                visible: optionState['Setup.Header.Link']?.value,
                label: optionState['Setup.Header.Link.Link Text']?.value,
                href: optionState['Setup.Header.Link.Link Text']?.value,
            },

            showInsightButton: optionState['Setup.Header.Insights']?.value,

            appliedFilters: optionState['Setup.Header.Applied Filters']?.value
                ? ['Region: APAC', 'Year: 2025']
                : [],

            performanceStatus: getPerformanceStatus(optionState),

            onDeleteWidget: () => logError('delete'),
            onDuplicateWidget: () => logError('duplicate'),
            onEditWidget: () => logError('edit'),
        };
    };

    const headerProps = getTableHeaderProps(optionState);
    //const tableProps = {};
    const renderPreview = () => {
        if (tableState === 'empty' || tableState === 'invalid') {
            return <>{previewGraphic}</>;
        }

        return (
            <div className={styles['preview-table']}>
                <TableHeader {...headerProps} />
                <DemoKpiCard />
            </div>
        );
    };

    const renderSetupContent = () => (
        <Flex vertical gap={0} className={styles['setup-accordions']}>
            {SETUP_ACCORDIONS.map(({ key, title }) => {
                if (key === 'header') {
                    return (
                        <div key={key} className={styles['']}>
                            <Accordion
                                title="Header"
                                outlined={false}
                                isExpanded={expandedAccordions.has(key)}
                                leftRightSpaceZero
                                onToggle={() => toggleAccordion(key)}
                                className={styles['setup-accordion']}
                            >
                                <Flex vertical gap={14} className={styles['setup-flex']}>
                                    {/* Title */}

                                    <Label type="body3">
                                        {String(
                                            optionState['Setup.Header.Title']?.title ?? 'Title',
                                        )}
                                    </Label>
                                    <InputField
                                        value={String(
                                            optionState['Setup.Header.Title']?.value ?? '',
                                        )}
                                        placeholder="Enter title"
                                        onChange={e =>
                                            handleOptionChange('Setup.Header.Title', e.target.value)
                                        }
                                        className="input-field"
                                    />

                                    {/* Sub Title */}

                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(
                                                optionState['Setup.Header.Sub-title']?.title ??
                                                    'Sub-title',
                                            )}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.Header.Sub-title']?.value,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.Header.Sub-title', v)
                                            }
                                        />
                                    </Flex>
                                    <div ref={subtitleRef}>
                                        {Boolean(optionState['Setup.Header.Sub-title']?.value) && (
                                            <InputField
                                                placeholder="Add a subtitle here to explain the graph"
                                                value={
                                                    String(
                                                        optionState[
                                                            'Setup.Header.Sub-title.Sub-title Text'
                                                        ]?.value,
                                                    ) || ''
                                                }
                                                onChange={e =>
                                                    handleOptionChange(
                                                        'Setup.Header.Sub-title.Sub-title Text',
                                                        e.target.value,
                                                    )
                                                }
                                                className="input-field"
                                            />
                                        )}
                                    </div>

                                    {/* Applied Filters */}

                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(
                                                optionState['Setup.Header.Applied Filters']
                                                    ?.title ?? 'Applied Filters',
                                            )}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.Header.Applied Filters']?.value,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange(
                                                    'Setup.Header.Applied Filters',
                                                    v,
                                                )
                                            }
                                        />
                                    </Flex>

                                    {/* Insights */}

                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(
                                                optionState['Setup.Header.Insights']?.title ??
                                                    'Insights',
                                            )}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.Header.Insights']?.value,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.Header.Insights', v)
                                            }
                                        />
                                    </Flex>

                                    {/* Link */}

                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(
                                                optionState['Setup.Header.Link']?.title ?? 'Link',
                                            )}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.Header.Link']?.value,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.Header.Link', v)
                                            }
                                        />
                                    </Flex>
                                    <div ref={linkRef}>
                                        {Boolean(optionState['Setup.Header.Link']?.value) && (
                                            <>
                                                <Label type="body2">
                                                    {String(
                                                        optionState['Setup.Header.Link.Link Text']
                                                            ?.title ?? 'Link Text',
                                                    )}
                                                </Label>

                                                <DropDown
                                                    id="link-url-dropdown"
                                                    dataTestId="link-url-dropdown"
                                                    dropdown={{
                                                        selectedOptions: (
                                                            optionState[
                                                                'Setup.Header.Link.Link Text'
                                                            ]?.options || []
                                                        )
                                                            .filter(
                                                                opt =>
                                                                    opt ===
                                                                    optionState[
                                                                        'Setup.Header.Link.Link Text'
                                                                    ]?.value,
                                                            )
                                                            .map(opt => ({
                                                                label: String(opt),
                                                                value: String(opt),
                                                            })),
                                                        placeholder: 'Select',
                                                        isDisabled: false,
                                                        isLabelInline: false,
                                                        size: 'L',
                                                        type: 'radio',
                                                        options: (
                                                            optionState[
                                                                'Setup.Header.Link.Link Text'
                                                            ]?.options || []
                                                        ).map(opt => ({
                                                            label: String(opt),
                                                            value: String(opt),
                                                        })),
                                                        onChange: option =>
                                                            handleOptionChange(
                                                                'Setup.Header.Link.Link Text',
                                                                option.value,
                                                            ),
                                                    }}
                                                    dropdownOptionsClassName="link-url-dropdown-options"
                                                />
                                            </>
                                        )}
                                    </div>
                                </Flex>
                            </Accordion>
                        </div>
                    );
                }

                if (key === 'to-date-values') {
                    return (
                        <div key={key} className={styles['']}>
                            <Accordion
                                title="To Date Values"
                                outlined={false}
                                isExpanded={expandedAccordions.has(key)}
                                leftRightSpaceZero
                                onToggle={() => toggleAccordion(key)}
                                className={styles['setup-accordion']}
                            >
                                <Flex vertical gap={12} className={styles['setup-flex']}>
                                    {/* MTD */}
                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(
                                                optionState['Setup.To Date Values.MTD']?.title ??
                                                    'MTD',
                                            )}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.To Date Values.MTD']?.value,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.To Date Values.MTD', v)
                                            }
                                        />
                                    </Flex>

                                    {/* QTD */}
                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(
                                                optionState['Setup.To Date Values.QTD']?.title ??
                                                    'QTD',
                                            )}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.To Date Values.QTD']?.value,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.To Date Values.QTD', v)
                                            }
                                        />
                                    </Flex>

                                    {/* YTD */}
                                    <Flex justify="space-between">
                                        <span className={styles.switchlabel}>
                                            {String(
                                                optionState['Setup.To Date Values.YTD']?.title ??
                                                    'YTD',
                                            )}
                                        </span>
                                        <Switch
                                            checked={Boolean(
                                                optionState['Setup.To Date Values.YTD']?.value,
                                            )}
                                            onToggle={(v: boolean) =>
                                                handleOptionChange('Setup.To Date Values.YTD', v)
                                            }
                                        />
                                    </Flex>

                                    {/* Comparison Section */}

                                    <Label type="body3">
                                        {String(
                                            optionState['Setup.To Date Values.Comparison of']
                                                ?.title ?? 'Comparison of',
                                        )}
                                    </Label>

                                    <Flex gap={12}>
                                        {(
                                            optionState['Setup.To Date Values.Comparison of']
                                                ?.options || []
                                        ).map(opt => {
                                            const selectedValues =
                                                (optionState['Setup.To Date Values.Comparison of']
                                                    ?.value as string[]) || [];

                                            return (
                                                <CheckBox
                                                    key={String(opt)}
                                                    label={String(opt)}
                                                    checked={selectedValues.includes(String(opt))}
                                                    onChange={checked => {
                                                        let updatedValues = [...selectedValues];

                                                        if (checked) {
                                                            updatedValues.push(String(opt));
                                                        } else {
                                                            updatedValues = updatedValues.filter(
                                                                v => v !== opt,
                                                            );
                                                        }

                                                        handleOptionChange(
                                                            'Setup.To Date Values.Comparison of',
                                                            updatedValues,
                                                        );
                                                    }}
                                                />
                                            );
                                        })}
                                    </Flex>

                                    {/* Compare With */}
                                    <Label type="body3">
                                        {String(
                                            optionState['Setup.To Date Values.Compare with']
                                                ?.title ?? 'Compare with',
                                        )}
                                    </Label>
                                    <DropDown
                                        className="drop-down"
                                        id="compare-with-dropdown"
                                        dataTestId="compare-with-dropdown"
                                        dropdown={{
                                            placeholder: 'Select',
                                            selectedOptions: (
                                                optionState['Setup.To Date Values.Compare with']
                                                    ?.options || []
                                            )
                                                .filter(
                                                    opt =>
                                                        opt ===
                                                        optionState[
                                                            'Setup.To Date Values.Compare with'
                                                        ]?.value,
                                                )
                                                .map(opt => ({
                                                    label: String(opt),
                                                    value: String(opt),
                                                })),
                                            isDisabled: false,
                                            isLabelInline: false,
                                            size: 'L',
                                            type: 'radio',
                                            options: (
                                                optionState['Setup.To Date Values.Compare with']
                                                    ?.options || []
                                            ).map(opt => ({
                                                label: String(opt),
                                                value: String(opt),
                                            })),
                                            onChange: option =>
                                                handleOptionChange(
                                                    'Setup.To Date Values.Compare with',
                                                    option.value,
                                                ),
                                        }}
                                        dropdownOptionsClassName="compare-with-dropdown-options"
                                    />
                                </Flex>
                            </Accordion>
                        </div>
                    );
                }
                if (key === 'column-drilldown') {
                    const drilldownPath = 'Setup.Column Drilldown.Enable Column Drilldown';

                    return (
                        <div className={styles['projection-accordion']}>
                            <Flex
                                align="center"
                                justify="space-between"
                                className={styles['accordion-header-with-switch']}
                            >
                                <span className={styles['projection-label']}>Column Drilldown</span>
                                <Flex
                                    align="center"
                                    gap={8}
                                    className={styles['projection-controls']}
                                >
                                    <div
                                        className={`${styles['projection-switch-wrapper']} ${columnDrilldown ? styles['projection-switch-active'] : ''}`}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Switch
                                            label=""
                                            isDisable={false}
                                            checked={Boolean(optionState[drilldownPath]?.value)}
                                            onToggle={(checked: boolean) => {
                                                handleOptionChange(drilldownPath, checked),
                                                    setColumnDrilldown(checked);
                                            }}
                                        />
                                    </div>
                                </Flex>
                            </Flex>
                        </div>
                    );
                }

                if (key === 'pivot-table') {
                    return (
                        <div key={key} className={styles['accordion-item']}>
                            <div className={styles['accordion-placeholder']}>
                                <Label type="body3">
                                    <div className={styles['pivot-row']}>
                                        <Flex
                                            align="center"
                                            gap={8}
                                            className={styles['placeholder-text']}
                                        >
                                            <Icon
                                                color="neutrals-B80"
                                                name="shuffle-02"
                                                size="xm"
                                            />
                                            Pivot Table
                                        </Flex>

                                        <div className={styles['row-divider']} />
                                    </div>
                                </Label>
                            </div>
                        </div>
                    );
                }
                return (
                    <div key={key} className={styles['accordion-item']}>
                        <Accordion
                            title={title}
                            outlined={false}
                            isExpanded={expandedAccordions.has(key)}
                            leftRightSpaceZero
                            onToggle={() => toggleAccordion(key)}
                            className={styles['setup-accordion']}
                        >
                            <div className={styles['accordion-placeholder']}>
                                <Label type="body3">
                                    <span className={styles['placeholder-text']}>
                                        {title} configuration options
                                    </span>
                                </Label>
                            </div>
                        </Accordion>
                    </div>
                );
            })}
        </Flex>
    );

    const renderStylingContent = () => (
        <Flex vertical gap={0} className={styles['styling-accordions']}>
            {STYLING_ACCORDIONS.map(({ key, title }) => {
                return (
                    <div key={key} className={styles['accordion-item']}>
                        <Accordion
                            title={title}
                            outlined={false}
                            isExpanded={expandedAccordions.has(key)}
                            leftRightSpaceZero
                            onToggle={() => toggleAccordion(key)}
                            className={styles['setup-accordion']}
                        >
                            <div className={styles['accordion-placeholder']}>
                                <Label type="body3">{title} configuration options</Label>
                            </div>
                        </Accordion>
                    </div>
                );
            })}
        </Flex>
    );

    const renderFilterContent = () => (
        <Flex vertical gap={12} className={styles['filter-tab-content']}>
            <button type="button" className={styles['add-filter-category-link']} onClick={() => {}}>
                Add Filter Category
            </button>
            <div className={styles['accordion-item']}>
                <div className={styles['projection-accordion']}>
                    <button
                        type="button"
                        className={styles['accordion-trigger']}
                        onClick={() => toggleAccordion('filter-table-filters')}
                        aria-expanded={expandedAccordions.has('filter-table-filters')}
                    >
                        <Flex align="center" gap={8} className={styles['projection-label']}>
                            <Icon name="dots-grid" size="l" color="neutrals-B600" />
                            <span>Tabke Filters</span>
                        </Flex>
                        <Icon
                            name={
                                expandedAccordions.has('filter-table-filters')
                                    ? 'chevron-up'
                                    : 'chevron-down'
                            }
                            size="l"
                            color="neutrals-B600"
                        />
                    </button>
                    {expandedAccordions.has('filter-table-filters') && (
                        <div className={styles['accordion-placeholder']}>
                            <Label type="body3">
                                <span className={styles['placeholder-text']}>
                                    Table Filters configuration options
                                </span>
                            </Label>
                        </div>
                    )}
                </div>
            </div>
        </Flex>
    );

    const renderPanelContent = () => {
        if (activePanelTab === SETUP_TAB) return renderSetupContent();
        if (activePanelTab === STYLING_TAB) return renderStylingContent();
        if (activePanelTab === FILTER_TAB) return renderFilterContent();
        return null;
    };

    const customActions = (
        <Flex
            justify="flex-end"
            gap={8}
            align="center"
            className={styles['custom-actions-wrapper']}
        >
            <Button
                icon="database-02"
                text="Data Fields"
                variant="Secondary"
                onClick={() => logError('Clicked data fields')}
            />
            <Button text="Reset" variant="Secondary" onClick={handleReset} />
            <Button text="Save Table" variant="Primary" onClick={handleSaveTable} />
        </Flex>
    );

    return (
        <Flyout
            id="table-customization-panel"
            flyoutOpen={isOpen}
            direction="right"
            containerMaxWidth="100%"
            heading={'Setup\u00a0your\u00a0widget'}
            content={
                <Flex className={styles['customization-layout']} gap={0}>
                    <div className={styles['preview-area']}>
                        {isLoading ? (
                            <Flex className={styles['initial-loader-container']}>
                                <AnimatedLoaders id="initial-loader" type="page" />
                            </Flex>
                        ) : (
                            renderPreview()
                        )}
                    </div>
                    <div className={styles['panel-area']}>
                        <Flex className={styles['panel-tabs']} gap={0}>
                            {PANEL_TABS.map(tab => (
                                <button
                                    key={tab}
                                    type="button"
                                    className={`${styles['panel-tab']} ${activePanelTab === tab ? styles['panel-tab-active'] : ''}`}
                                    onClick={() => setActivePanelTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </Flex>
                        {isLoading ? (
                            <Flex className={styles['initial-loader-container']}>
                                <AnimatedLoaders id="initial-loader" type="page" />
                            </Flex>
                        ) : error ? (
                            <div className={styles['empty-state-container']}>
                                <span className={styles['empty-text']}>Error </span>
                                <span>
                                    {typeof error === 'string'
                                        ? error
                                        : (error as { message?: string })?.message ||
                                          'Something went wrong'}
                                </span>
                            </div>
                        ) : (
                            <div className={styles['panel-content']}>{renderPanelContent()}</div>
                        )}
                    </div>
                </Flex>
            }
            customActions={customActions}
            iconForCancel={{ icon: 'x-close', onClick: handleClose }}
            cancelIconClick={handleClose}
        />
    );
};

export default TableCustomizationPanel;
