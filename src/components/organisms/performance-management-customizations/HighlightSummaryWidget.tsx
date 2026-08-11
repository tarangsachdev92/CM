import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Tooltip } from 'antd';
import { Button, Dialog, Icon, IconButton } from 'konnect-react-components';
import { useDispatch, useSelector } from 'react-redux';
import styles from './HighlightSummaryWidget.module.scss';
import HighlightSummaryEditFlyout from './HighlightSummaryEditFlyout';
import { AppDispatch, RootState } from '../../../store';
import {
    HighlightSummarySectionState,
    HighlightSummaryState,
    appendToWidgetOrder,
    removeFromWidgetOrder,
    selectTabWidgetsState,
    setHighlightSummaryState,
} from '../../../store/slice/performanceWidgetsByTabSlice';
import { saveTabWidgetsState } from '../../../store/thunks/performanceWidgetsByTab';

type BaseHighlightSection = Omit<HighlightSummarySectionState, 'status'>;

const HIGHLIGHT_SECTIONS: BaseHighlightSection[] = [
    {
        id: 'supply-chain',
        title: 'Section 1 Title Goes Here',
        points: [
            'OTIF-D fell by 4.8%, mainly due to increased late deliveries in Southeast Asia, with over 60% linked to third-party carrier.',
            'OTIF-S held steady at 92.7%, but 15% of shipments marked "on-time" had customer-reported delivery delays.',
            'Average delivery lead time in East Asia rose by 1.4 days, driven by supply bottlenecks and reduced carrier availability along with reduced resources available for carriers.',
        ],
    },
    {
        id: 'inventory',
        title: 'Section 1 Title Goes Here',
        points: [
            'OTIF-D fell by 4.8%, mainly due to increased late deliveries in Southeast Asia, with over 60% linked to third-party carrier.',
            'OTIF-S held steady at 92.7%, but 15% of shipments marked "on-time" had customer-reported delivery delays.',
            'Average delivery lead time in East Asia rose by 1.4 days, driven by supply bottlenecks and reduced carrier availability along with reduced resources available for carriers.',
        ],
    },
    {
        id: 'operations',
        title: 'Section 1 Title Goes Here',
        points: [
            'OTIF-D fell by 4.8%, mainly due to increased late deliveries in Southeast Asia, with over 60% linked to third-party carrier.',
            'OTIF-S held steady at 92.7%, but 15% of shipments marked "on-time" had customer-reported delivery delays.',
            'Average delivery lead time in East As...',
        ],
    },
    {
        id: 'quality',
        title: 'Section 1 Title Goes Here',
        points: [
            'OTIF-D fell by 4.8%, mainly due to increased late deliveries in Southeast Asia, with over 60% linked to third-party carrier.',
            'OTIF-S held steady at 92.7%, but 15% of shipments marked "on-time" had customer-reported delivery delays.',
            'Average delivery lead time in East As...',
        ],
    },
];

interface HighlightSummaryWidgetProps {
    defaultExpanded?: boolean;
    editorName?: string;
    activeTabId?: number | string;
    widgetToken?: string;
    mode?: 'preview' | 'dashboard';
    isSelected?: boolean;
    onSelect?: () => void;
}

type FeedbackValue = 'up' | 'down' | null;
type HighlightSummaryLayoutState = {
    showSectionTitles: boolean;
    sectionsPerRow: number;
};

const DEFAULT_EDITOR_NAME = 'John Doe'; // To be replaced once integrated with API and report editor name is received
const HIGHLIGHT_SUMMARY_PREFIX = 'highlight-summary';

const getBaseToken = (token: string) => token.split('@')[0] || token;

const nextDuplicateToken = (baseToken: string, existing: string[]): string => {
    let maxN = 0;
    const baseExact = getBaseToken(baseToken);
    const pattern = new RegExp(`^${baseExact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:@(\\d+))?$`);

    for (const token of existing) {
        const match = token.match(pattern);
        if (!match) {
            continue;
        }

        const n = match[1] ? parseInt(match[1], 10) : 1;
        if (!Number.isNaN(n)) {
            maxN = Math.max(maxN, n);
        }
    }

    return `${baseExact}@${maxN + 1}`;
};

const clampSectionsPerRow = (value: number, sectionCount: number) => {
    const safeSectionCount = Math.max(sectionCount, 1);
    const maxSectionsPerRow = Math.min(4, safeSectionCount);

    return Math.max(1, Math.min(value, maxSectionsPerRow));
};

const getDefaultLayoutState = (sectionCount = HIGHLIGHT_SECTIONS.length): HighlightSummaryLayoutState => ({
    showSectionTitles: true,
    sectionsPerRow: clampSectionsPerRow(Math.min(4, Math.max(sectionCount, 1)), sectionCount),
});

const getLayoutState = (
    summaryState?: HighlightSummaryState,
    sectionCount = HIGHLIGHT_SECTIONS.length,
): HighlightSummaryLayoutState => ({
    showSectionTitles: summaryState?.showSectionTitles ?? true,
    sectionsPerRow: clampSectionsPerRow(
        summaryState?.sectionsPerRow ?? Math.min(4, Math.max(sectionCount, 1)),
        sectionCount,
    ),
});

const getDefaultSections = (): HighlightSummarySectionState[] =>
    HIGHLIGHT_SECTIONS.map(section => ({
        ...section,
        status: 'ai',
    }));

const resolveSummaryState = (
    savedState?: HighlightSummaryState,
): HighlightSummaryState => {
    const savedSections = new Map((savedState?.sections ?? []).map(section => [section.id, section]));
    const defaultLayoutState = getDefaultLayoutState(HIGHLIGHT_SECTIONS.length);

    return {
        sections: HIGHLIGHT_SECTIONS.map(section => {
            const savedSection = savedSections.get(section.id);

            return {
                ...section,
                title: savedSection?.title?.trim() || section.title,
                points: savedSection?.points?.length ? savedSection.points : section.points,
                status: savedSection?.status ?? 'ai',
                editedAt: savedSection?.editedAt,
                editedBy: savedSection?.editedBy,
            };
        }),
        showSectionTitles: savedState?.showSectionTitles ?? defaultLayoutState.showSectionTitles,
        sectionsPerRow: clampSectionsPerRow(
            savedState?.sectionsPerRow ?? defaultLayoutState.sectionsPerRow,
            HIGHLIGHT_SECTIONS.length,
        ),
    };
};

const formatEditedMeta = (section: HighlightSummarySectionState) => {
    if (section.status === 'ai' || !section.editedAt) {
        return '';
    }

    return `Edited by ${section.editedBy || DEFAULT_EDITOR_NAME}, ${dayjs(section.editedAt).format('DD MMM YYYY')}`;
};

const serialisePoints = (points: string[]) => points.join('\n');

const parsePoints = (pointsText: string) =>
    pointsText
        .split('\n')
        .map(point => point.replace(/^[-•]\s*/, '').trim())
        .filter(Boolean);

const SparkleIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path
            d="M10 0L12.2451 7.75492L20 10L12.2451 12.2451L10 20L7.75492 12.2451L0 10L7.75492 7.75492L10 0Z"
            fill="#00B097"
        />
    </svg>
);

const HighlightSummaryWidget = ({
    defaultExpanded = true,
    editorName = DEFAULT_EDITOR_NAME,
    activeTabId,
    widgetToken = HIGHLIGHT_SUMMARY_PREFIX,
    mode = 'dashboard',
    isSelected = false,
    onSelect,
}: HighlightSummaryWidgetProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const persistedSummaryState = useSelector((state: RootState) => {
        if (activeTabId === undefined) {
            return undefined;
        }

        const tabState = selectTabWidgetsState(state, activeTabId);
        return (
            tabState.highlightSummaryByToken?.[widgetToken] ??
            (widgetToken === HIGHLIGHT_SUMMARY_PREFIX ? tabState.highlightSummary : undefined)
        );
    });
    const currentTabState = useSelector((state: RootState) =>
        activeTabId === undefined ? undefined : selectTabWidgetsState(state, activeTabId),
    );

    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showWidgetActions, setShowWidgetActions] = useState(false);
    const [expandedSections, setExpandedSections] = useState<string[]>([]);
    const [summaryState, setSummaryState] = useState<HighlightSummaryState>(() =>
        resolveSummaryState(persistedSummaryState),
    );
    const [setupDraft, setSetupDraft] = useState<HighlightSummaryLayoutState>(() =>
        getLayoutState(resolveSummaryState(persistedSummaryState)),
    );
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [draftTitle, setDraftTitle] = useState('');
    const [draftPoints, setDraftPoints] = useState('');
    const [feedback, setFeedback] = useState<FeedbackValue>(null);

    useEffect(() => {
        const resolvedSummaryState = resolveSummaryState(persistedSummaryState);

        setSummaryState(resolvedSummaryState);
        setSetupDraft(
            getLayoutState(
                resolvedSummaryState,
                resolvedSummaryState.sections?.length ?? HIGHLIGHT_SECTIONS.length,
            ),
        );
    }, [persistedSummaryState]);

    const sections = useMemo(
        () => summaryState.sections ?? getDefaultSections(),
        [summaryState.sections],
    );
    const savedLayout = getLayoutState(summaryState, sections.length);
    const previewLayout = {
        showSectionTitles: setupDraft.showSectionTitles,
        sectionsPerRow: clampSectionsPerRow(setupDraft.sectionsPerRow, sections.length),
    };

    const isPreviewMode = mode === 'preview';
    const hasDraftSections = sections.some(section => section.status === 'draft');
    const allSectionsManuallyEdited = sections.every(section => section.status !== 'ai');

    const actionTooltip = isExpanded ? 'Collapse Summary' : 'Generate Summary';

    const persistSummaryState = (nextSummaryState: HighlightSummaryState) => {
        setSummaryState(nextSummaryState);

        if (activeTabId === undefined) {
            return;
        }

        dispatch(
            setHighlightSummaryState({
                tabId: activeTabId,
                token: widgetToken,
                summary: nextSummaryState,
            }),
        );

        void (async () => {
            try {
                const nextHighlightSummaryByToken = {
                    ...(currentTabState?.highlightSummaryByToken ?? {}),
                    [widgetToken]: nextSummaryState,
                };

                await dispatch(
                    saveTabWidgetsState({
                        tabId: activeTabId,
                        data: {
                            ...(currentTabState ?? {}),
                            highlightSummary:
                                widgetToken === HIGHLIGHT_SUMMARY_PREFIX
                                    ? nextSummaryState
                                    : currentTabState?.highlightSummary,
                            highlightSummaryByToken: nextHighlightSummaryByToken,
                            updatedAt: new Date().toISOString(),
                        },
                    }),
                ).unwrap();
            } catch {
                // Preserve local UX if API persistence fails.
            }
        })();
    };

    const onDuplicate = useCallback(() => {
        if (activeTabId === undefined) {
            return;
        }

        const widgetOrder = currentTabState?.widgetOrder ?? [];
        const duplicatedToken = nextDuplicateToken(getBaseToken(widgetToken), widgetOrder);
        const duplicatedSummary: HighlightSummaryState = {
            ...summaryState,
            sections: (summaryState.sections ?? []).map(section => ({
                ...section,
                points: [...section.points],
            })),
        };

        dispatch(appendToWidgetOrder({ tabId: activeTabId, items: [duplicatedToken] }));
        dispatch(
            setHighlightSummaryState({
                tabId: activeTabId,
                token: duplicatedToken,
                summary: duplicatedSummary,
            }),
        );

        void (async () => {
            try {
                const nextWidgetOrder = [...widgetOrder, duplicatedToken];
                const nextHighlightSummaryByToken = {
                    ...(currentTabState?.highlightSummaryByToken ?? {}),
                    [duplicatedToken]: duplicatedSummary,
                };

                await dispatch(
                    saveTabWidgetsState({
                        tabId: activeTabId,
                        data: {
                            ...(currentTabState ?? {}),
                            widgetOrder: nextWidgetOrder,
                            highlightSummaryByToken: nextHighlightSummaryByToken,
                            updatedAt: new Date().toISOString(),
                        },
                    }),
                ).unwrap();
            } catch {
                // Preserve local UX if API persistence fails.
            }
        })();

        setIsMenuOpen(false);
    }, [activeTabId, currentTabState, dispatch, summaryState, widgetToken]);

    const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
    const closeSetupPane = useCallback(() => {
        setIsSetupOpen(false);
        setIsMenuOpen(false);
        setSetupDraft(savedLayout);
    }, [savedLayout]);
    const openSetupPane = useCallback(() => {
        setIsMenuOpen(false);
        setShowWidgetActions(false);
        setIsModalOpen(false);
        setExpandedSections([]);
        setEditingSectionId(null);
        setIsExpanded(true);
        setSetupDraft(savedLayout);
        setIsSetupOpen(true);
    }, [savedLayout]);
    const updateSetupDraft = useCallback(
        (nextLayout: HighlightSummaryLayoutState) => {
            setSetupDraft({
                showSectionTitles: nextLayout.showSectionTitles,
                sectionsPerRow: clampSectionsPerRow(nextLayout.sectionsPerRow, sections.length),
            });
        },
        [sections.length],
    );
    const saveSetupPane = useCallback((nextLayout: HighlightSummaryLayoutState) => {
        persistSummaryState({
            ...summaryState,
            showSectionTitles: nextLayout.showSectionTitles,
            sectionsPerRow: clampSectionsPerRow(nextLayout.sectionsPerRow, sections.length),
        });
        setIsSetupOpen(false);
        setIsMenuOpen(false);
    }, [sections.length, summaryState]);
    const onDeleteClick = useCallback(() => {
        setIsMenuOpen(false);
        setIsDeleteOpen(true);
    }, []);
    const onDialogClose = useCallback(() => setIsDeleteOpen(false), []);
    const onConfirmDelete = useCallback(() => {
        if (activeTabId !== undefined) {
            dispatch(removeFromWidgetOrder({ tabId: activeTabId, items: [widgetToken] }));
        }
        setIsDeleteOpen(false);
        setIsMenuOpen(false);
        setIsSetupOpen(false);
    }, [activeTabId, dispatch, widgetToken]);

    const openExpandedView = (sectionId?: string) => {
        if (isPreviewMode) {
            return;
        }

        setIsExpanded(true);
        setIsModalOpen(true);

        const initialSectionId = sectionId ?? sections[0]?.id;
        if (initialSectionId) {
            setExpandedSections([initialSectionId]);
        }
    };

    const closeExpandedView = () => {
        setIsModalOpen(false);
        setExpandedSections([]);
        setEditingSectionId(null);
    };

    const toggleSectionExpanded = (sectionId: string) => {
        setExpandedSections(prev =>
            prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId],
        );
    };

    const startEditingSection = (sectionId: string) => {
        if (isPreviewMode) {
            return;
        }

        const section = sections.find(item => item.id === sectionId);
        if (!section) {
            return;
        }

        setIsExpanded(true);
        setIsSetupOpen(false);
        setIsModalOpen(true);
        setExpandedSections(prev => (prev.includes(sectionId) ? prev : [...prev, sectionId]));
        setEditingSectionId(sectionId);
        setDraftTitle(section.title);
        setDraftPoints(serialisePoints(section.points));
    };

    const upsertEditedSection = (
        sectionId: string,
        status: HighlightSummarySectionState['status'],
    ) => {
        const defaultSection = HIGHLIGHT_SECTIONS.find(section => section.id === sectionId);
        if (!defaultSection) {
            return;
        }

        const title = draftTitle.trim() || defaultSection.title;
        const points = parsePoints(draftPoints);
        const nextSummaryState: HighlightSummaryState = {
            ...summaryState,
            sections: sections.map(section =>
                section.id === sectionId
                    ? {
                        ...section,
                        title,
                        points: points.length > 0 ? points : defaultSection.points,
                        status,
                        editedAt: new Date().toISOString(),
                        editedBy: editorName,
                    }
                    : section,
            ),
        };

        persistSummaryState(nextSummaryState);
        setEditingSectionId(null);
    };

    const resetSectionToAiSummary = (sectionId: string) => {
        const defaultSection = HIGHLIGHT_SECTIONS.find(section => section.id === sectionId);
        if (!defaultSection) {
            return;
        }

        const nextSummaryState: HighlightSummaryState = {
            ...summaryState,
            sections: sections.map(section =>
                section.id === sectionId
                    ? {
                        ...defaultSection,
                        status: 'ai',
                    }
                    : section,
            ),
        };

        persistSummaryState(nextSummaryState);

        if (editingSectionId === sectionId) {
            setEditingSectionId(null);
        }
    };

    const renderPreviewCard = (
        section: HighlightSummarySectionState,
        options?: {
            layout?: HighlightSummaryLayoutState;
            disableInteraction?: boolean;
            hideEditAction?: boolean;
        },
    ) => {
        const layout = options?.layout ?? savedLayout;
        const disableInteraction = options?.disableInteraction ?? false;
        const hideEditAction = options?.hideEditAction ?? false;
        const editedMeta = formatEditedMeta(section);

        return (
            <div
                key={section.id}
                className={styles['highlight-summary-widget__card']}
                onClick={
                    isPreviewMode || disableInteraction ? undefined : () => openExpandedView(section.id)
                }
                onKeyDown={
                    isPreviewMode || disableInteraction
                        ? undefined
                        : event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                openExpandedView(section.id);
                            }
                        }
                }
                role={isPreviewMode || disableInteraction ? undefined : 'button'}
                tabIndex={isPreviewMode || disableInteraction ? undefined : 0}
            >
                <div className={styles['highlight-summary-widget__card-header']}>
                    <div className={styles['highlight-summary-widget__card-title-row']}>
                        {section.status === 'ai' && (
                            <span
                                className={styles['highlight-summary-widget__section-icon']}
                                data-testid={`ai-icon-${section.id}`}
                            >
                                <SparkleIcon />
                            </span>
                        )}
                        {layout.showSectionTitles && (
                            <h4 className={styles['highlight-summary-widget__card-title']}>
                                {section.title}
                            </h4>
                        )}
                    </div>

                    {!isPreviewMode && !hideEditAction && (
                        <button
                            type="button"
                            className={`${styles['highlight-summary-widget__icon-btn']} ${styles['highlight-summary-widget__card-edit-btn']}`}
                            aria-label={`Edit preview ${section.id}`}
                            onClick={event => {
                                event.stopPropagation();
                                startEditingSection(section.id);
                            }}
                        >
                            <Icon name="edit-02" size="xm" color="neutrals-B400" />
                        </button>
                    )}
                </div>

                <ul className={styles['highlight-summary-widget__card-points']}>
                    {section.points.slice(0, 3).map(point => (
                        <li key={point} className={styles['highlight-summary-widget__card-point']}>
                            <span className={styles['highlight-summary-widget__card-point-text']}>
                                {point}
                            </span>
                        </li>
                    ))}
                </ul>

                {editedMeta && (
                    <div className={styles['highlight-summary-widget__card-meta']}>{editedMeta}</div>
                )}
            </div>
        );
    };

    const renderWidgetHeader = ({
        showWidgetActions,
        showToggleControl,
    }: {
        showWidgetActions: boolean;
        showToggleControl: boolean;
    }) => (
        <div className={styles['highlight-summary-widget__header']}>
            <div className={styles['highlight-summary-widget__header-left']}>
                {!allSectionsManuallyEdited && (
                    <span data-testid={showWidgetActions ? 'highlight-summary-ai-icon' : undefined}>
                        <SparkleIcon />
                    </span>
                )}
                <span className={styles['highlight-summary-widget__title']}>Highlights</span>
                {hasDraftSections && (
                    <span className={styles['highlight-summary-widget__draft-tag']}>Draft</span>
                )}
                {showToggleControl && (
                    <Tooltip title={actionTooltip} placement="top">
                        <button
                            type="button"
                            className={styles['highlight-summary-widget__toggle-btn']}
                            onClick={event => {
                                event.stopPropagation();
                                setIsExpanded(prev => !prev);
                            }}
                            aria-label={actionTooltip}
                        >
                            <Icon name="file-05" size="xm" color="neutrals-B100" />
                        </button>
                    </Tooltip>
                )}
            </div>

            <div className={styles['highlight-summary-widget__header-right']}>
                {isExpanded && !allSectionsManuallyEdited && (
                    <>
                        <span className={styles['highlight-summary-widget__disclaimer']}>
                            AI generated content may contain inaccuracies
                        </span>

                        <div className={styles['highlight-summary-widget__feedback']}>
                            <button
                                type="button"
                                className={`${styles['highlight-summary-widget__feedback-btn']} ${feedback === 'up'
                                    ? styles['highlight-summary-widget__feedback-btn--up-active']
                                    : ''
                                    }`}
                                onClick={() => setFeedback('up')}
                                aria-label="Thumbs up"
                            >
                                <Icon
                                    name="thumbs-up"
                                    size="xm"
                                    color={feedback === 'up' ? 'primary-green-color' : 'neutrals-B100'}
                                />
                            </button>
                            <button
                                type="button"
                                className={`${styles['highlight-summary-widget__feedback-btn']} ${feedback === 'down'
                                    ? styles['highlight-summary-widget__feedback-btn--down-active']
                                    : ''
                                    }`}
                                onClick={() => setFeedback('down')}
                                aria-label="Thumbs down"
                            >
                                <Icon
                                    name="thumbs-down"
                                    size="xm"
                                    color={
                                        feedback === 'down'
                                            ? 'secondary-coral-color'
                                            : 'neutrals-B100'
                                    }
                                />
                            </button>
                        </div>
                    </>
                )}

                {showWidgetActions && !isPreviewMode && (showWidgetActions || isMenuOpen) && (
                    <div
                        className={styles['highlight-summary-widget__actions-anchor']}
                        data-testid="highlight-summary-widget-actions"
                    >
                        <div className={styles['highlight-summary-widget__actions-trigger']}>
                            <IconButton
                                icon={isMenuOpen ? 'chevron-down' : 'chevron-up'}
                                size="Small"
                                onClick={toggleMenu}
                            />
                        </div>

                        {isMenuOpen && (
                            <div className={styles['highlight-summary-widget__actions-menu']}>
                                <IconButton icon="trash-01" size="Small" onClick={onDeleteClick} />
                                <IconButton icon="copy-04" size="Small" onClick={onDuplicate} />
                                <IconButton icon="edit-02" size="Small" onClick={openSetupPane} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    const renderWidgetBody = ({
        layout,
        disableInteraction,
        hideEditAction,
    }: {
        layout: HighlightSummaryLayoutState;
        disableInteraction: boolean;
        hideEditAction: boolean;
    }) => (
        <div className={styles['highlight-summary-widget__body-layout']}>
            <div className={styles['highlight-summary-widget__preview-pane']}>
                <div
                    className={styles['highlight-summary-widget__content-card']}
                    onClick={isPreviewMode ? event => event.stopPropagation() : undefined}
                    style={{
                        gridTemplateColumns: `repeat(${layout.sectionsPerRow}, minmax(0, 1fr))`,
                    }}
                >
                    {sections.map(section =>
                        renderPreviewCard(section, {
                            layout,
                            disableInteraction,
                            hideEditAction,
                        }),
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div
                className={`${styles['highlight-summary-widget']} ${isPreviewMode ? styles['highlight-summary-widget--preview'] : ''} ${isSelected ? styles['highlight-summary-widget--selected'] : ''} ${!isExpanded ? styles['highlight-summary-widget--collapsed'] : ''}`}
                onClick={isPreviewMode ? onSelect : undefined}
                onMouseEnter={isPreviewMode ? undefined : () => setShowWidgetActions(true)}
                onMouseLeave={
                    isPreviewMode
                        ? undefined
                        : () => {
                            setShowWidgetActions(false);
                            setIsMenuOpen(false);
                        }
                }
                onKeyDown={
                    isPreviewMode
                        ? event => {
                            if ((event.key === 'Enter' || event.key === ' ') && onSelect) {
                                event.preventDefault();
                                onSelect();
                            }
                        }
                        : undefined
                }
                role={isPreviewMode ? 'button' : undefined}
                tabIndex={isPreviewMode ? 0 : undefined}
                aria-pressed={isPreviewMode ? isSelected : undefined}
                data-testid="highlight-summary-widget"
            >
                {renderWidgetHeader({
                    showWidgetActions: showWidgetActions || isMenuOpen,
                    showToggleControl: true,
                })}

                {isExpanded &&
                    renderWidgetBody({
                        layout: savedLayout,
                        disableInteraction: isPreviewMode,
                        hideEditAction: isPreviewMode,
                    })}

                {isDeleteOpen && (
                    <Dialog
                        title="Delete Widget"
                        content="Are you sure you want to delete the selected widget from your report?"
                        isOpen
                        onClose={onDialogClose}
                        onPrimaryButtonClick={onConfirmDelete}
                        onSecondaryButtonClick={onDialogClose}
                        primaryButtonText="Delete"
                        secondaryButtonText="Cancel"
                    />
                )}
            </div>

            <HighlightSummaryEditFlyout
                isOpen={!isPreviewMode && isSetupOpen}
                onClose={closeSetupPane}
                layout={previewLayout}
                defaultLayout={getDefaultLayoutState(sections.length)}
                sectionCount={sections.length}
                onLiveUpdate={updateSetupDraft}
                onSave={saveSetupPane}
                preview={
                    <div className={`${styles['highlight-summary-widget']} ${styles['highlight-summary-widget--setup-preview']}`}>
                        {renderWidgetHeader({
                            showWidgetActions: false,
                            showToggleControl: false,
                        })}
                        {renderWidgetBody({
                            layout: previewLayout,
                            disableInteraction: true,
                            hideEditAction: true,
                        })}
                    </div>
                }
            />

            {isModalOpen && !isPreviewMode && (
                <div
                    className={styles['highlight-summary-widget__modal-overlay']}
                    onClick={closeExpandedView}
                >
                    <div
                        className={styles['highlight-summary-widget__modal']}
                        onClick={event => event.stopPropagation()}
                    >
                        <div className={styles['highlight-summary-widget__modal-header']}>
                            <div className={styles['highlight-summary-widget__header-left']}>
                                {!allSectionsManuallyEdited && (
                                    <span data-testid="highlight-summary-modal-ai-icon">
                                        <SparkleIcon />
                                    </span>
                                )}
                                <span className={styles['highlight-summary-widget__title']}>
                                    Highlights
                                </span>
                                {hasDraftSections && (
                                    <span className={styles['highlight-summary-widget__draft-tag']}>
                                        Draft
                                    </span>
                                )}
                            </div>

                            <div className={styles['highlight-summary-widget__modal-actions']}>
                                {!allSectionsManuallyEdited && (
                                    <div className={styles['highlight-summary-widget__feedback']}>
                                        <button
                                            type="button"
                                            className={`${styles['highlight-summary-widget__feedback-btn']} ${feedback === 'up'
                                                ? styles['highlight-summary-widget__feedback-btn--up-active']
                                                : ''
                                                }`}
                                            onClick={() => setFeedback('up')}
                                            aria-label="Thumbs up"
                                        >
                                            <Icon
                                                name="thumbs-up"
                                                size="xm"
                                                color={feedback === 'up' ? 'primary-green-color' : 'neutrals-B100'}
                                            />
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles['highlight-summary-widget__feedback-btn']} ${feedback === 'down'
                                                ? styles['highlight-summary-widget__feedback-btn--down-active']
                                                : ''
                                                }`}
                                            onClick={() => setFeedback('down')}
                                            aria-label="Thumbs down"
                                        >
                                            <Icon
                                                name="thumbs-down"
                                                size="xm"
                                                color={
                                                    feedback === 'down'
                                                        ? 'secondary-coral-color'
                                                        : 'neutrals-B100'
                                                }
                                            />
                                        </button>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className={styles['highlight-summary-widget__icon-btn']}
                                    onClick={closeExpandedView}
                                    aria-label="Close Highlights"
                                >
                                    <Icon name="x-close" size="xm" color="neutrals-B400" />
                                </button>
                            </div>
                        </div>

                        {!allSectionsManuallyEdited && (
                            <div className={styles['highlight-summary-widget__modal-disclaimer']}>
                                AI generated content may contain inaccuracies
                            </div>
                        )}

                        <div className={styles['highlight-summary-widget__modal-content']}>
                            {sections.map(section => {
                                const isSectionExpanded = expandedSections.includes(section.id);
                                const isEditing = editingSectionId === section.id;
                                const editedMeta = formatEditedMeta(section);

                                return (
                                    <div
                                        key={section.id}
                                        className={styles['highlight-summary-widget__section']}
                                    >
                                        <button
                                            type="button"
                                            className={styles['highlight-summary-widget__section-header']}
                                            onClick={() => toggleSectionExpanded(section.id)}
                                        >
                                            <span
                                                className={styles['highlight-summary-widget__section-header-left']}
                                            >
                                                {section.status === 'ai' && (
                                                    <span
                                                        className={styles['highlight-summary-widget__section-icon']}
                                                    >
                                                        <SparkleIcon />
                                                    </span>
                                                )}
                                                {savedLayout.showSectionTitles && (
                                                    <span
                                                        className={styles['highlight-summary-widget__section-title']}
                                                    >
                                                        {section.title}
                                                    </span>
                                                )}
                                            </span>
                                            <Icon
                                                name={isSectionExpanded ? 'chevron-up' : 'chevron-down'}
                                                size="m"
                                                color="neutrals-B400"
                                            />
                                        </button>

                                        {isSectionExpanded && (
                                            <div
                                                className={styles['highlight-summary-widget__section-body']}
                                            >
                                                {isEditing ? (
                                                    <>
                                                        <div
                                                            className={styles['highlight-summary-widget__editor-grid']}
                                                        >
                                                            <label
                                                                className={styles['highlight-summary-widget__field']}
                                                            >
                                                                <span>Section Title</span>
                                                                <input
                                                                    aria-label="Section Title"
                                                                    className={styles['highlight-summary-widget__input']}
                                                                    value={draftTitle}
                                                                    onChange={event =>
                                                                        setDraftTitle(event.target.value)
                                                                    }
                                                                />
                                                            </label>

                                                            <label
                                                                className={styles['highlight-summary-widget__field']}
                                                            >
                                                                <span>Highlights</span>
                                                                <textarea
                                                                    aria-label="Section Summary Points"
                                                                    className={styles['highlight-summary-widget__textarea']}
                                                                    rows={8}
                                                                    value={draftPoints}
                                                                    onChange={event =>
                                                                        setDraftPoints(event.target.value)
                                                                    }
                                                                />
                                                            </label>
                                                        </div>

                                                        <div
                                                            className={styles['highlight-summary-widget__editor-actions']}
                                                        >
                                                            <Button
                                                                variant="Subtle2"
                                                                size="S"
                                                                text="Cancel"
                                                                onClick={() => {
                                                                    setEditingSectionId(null);
                                                                }}
                                                            />
                                                            <Button
                                                                variant="Secondary"
                                                                size="S"
                                                                text="Save as Draft"
                                                                onClick={() => {
                                                                    void upsertEditedSection(section.id, 'draft');
                                                                }}
                                                            />
                                                            <Button
                                                                variant="Primary"
                                                                size="S"
                                                                text="Submit"
                                                                onClick={() => {
                                                                    upsertEditedSection(section.id, 'submitted');
                                                                }}
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div
                                                            className={styles['highlight-summary-widget__section-body-header']}
                                                        >
                                                            <div>
                                                                {editedMeta && (
                                                                    <span
                                                                        className={styles['highlight-summary-widget__section-meta']}
                                                                    >
                                                                        {editedMeta}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div
                                                                className={styles['highlight-summary-widget__section-actions']}
                                                            >
                                                                {section.status !== 'ai' && (
                                                                    <Button
                                                                        variant="Secondary"
                                                                        size="S"
                                                                        text="Reset to AI Summary"
                                                                        onClick={() => {
                                                                            void resetSectionToAiSummary(section.id);
                                                                        }}
                                                                    />
                                                                )}
                                                                <Button
                                                                    variant="Primary"
                                                                    size="S"
                                                                    text="Edit"
                                                                    onClick={() => startEditingSection(section.id)}
                                                                />
                                                            </div>
                                                        </div>

                                                        <ul
                                                            className={styles['highlight-summary-widget__section-points']}
                                                        >
                                                            {section.points.map(point => (
                                                                <li
                                                                    key={`${section.id}-${point}`}
                                                                    className={styles['highlight-summary-widget__section-point']}
                                                                >
                                                                    {point}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default HighlightSummaryWidget;