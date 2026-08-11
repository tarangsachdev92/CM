import { useMemo, useState } from 'react';
import { SearchInput, Icon, Flyout } from 'konnect-react-components';
import { useGroupedWidgets, WidgetDefinition, widgetRegistry } from './registery';
import { WidgetThumbnailCard } from './WidgetThumbnailCard';
import { Empty } from 'antd';
import styles from './LayoutAddWidgetFlyout.module.scss';
import { SelectWidgetIcon } from '../../../assets/icons/widget-menu';

type Props = {
    isOpen: boolean;
    onAdd: (type: string[]) => void;
    onClose: () => void;
};

function LayoutAddWidgetFlyout({ isOpen, onAdd, onClose }: Props) {
    const [query, setQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);

    const normalize = (v: string) => v.replace(/\s+/g, ' ').trim();

    const groups = useGroupedWidgets(widgetRegistry);

    const activeGroup = selectedGroup;

    const widgetsInSelectedGroup = groups.find(([name]) => name === activeGroup)?.[1] ?? [];

    const normalizedQuery = useMemo(() => normalize(query.toLowerCase()), [query]);

    const searchResults = useMemo(() => {
        if (!normalizedQuery) return [];

        return Object.values(widgetRegistry).filter(w =>
            (w.title ?? '').toLowerCase().includes(normalizedQuery),
        );
    }, [normalizedQuery]);

    const toggleWidgetSelection = (widget: WidgetDefinition) => {
        if (widget.disabled) return;

        setSelectedWidgets(prev =>
            prev.includes(widget.type)
                ? prev.filter(id => id !== widget.type)
                : [...prev, widget.type],
        );
    };

    const FlyoutContent = () => {
        const isSearching = normalizedQuery.length > 0;

        return (
            <div className={styles['flyout-body']}>
                <div className={styles['group-menu']}>
                    <div className={styles['flyout-search-div']}>
                        <SearchInput
                            placeholder="Search by metric or widget"
                            defaultValue={query}
                            onChange={value => {
                                const v = typeof value === 'string' ? value : '';
                           const handler =  setTimeout(() => {
                                setQuery(v);
                            }, 1000);
                            return ()=> clearTimeout(handler);
                            }}
                        />
                    </div>

                    {!isSearching &&
                        groups.map(([groupName, widgets]) => {
                            const IconComponent = widgets[0]?.menuIcon;
                            const hasWidgets = widgets.some(widget => !widget.disabled);

                            return (
                                <div
                                    key={groupName}
                                    className={`
                                        ${styles['menu-item']}
                                        ${activeGroup === groupName ? styles['menu-item-active'] : ''}
                                        ${!hasWidgets ? styles['menu-item-disabled'] : ''}`}
                                    onClick={() => {
                                        if (!hasWidgets) return;
                                        setSelectedGroup(groupName);
                                    }}
                                >
                                    <div className={styles['menu-item-left']}>
                                        {IconComponent && (
                                            <span className={styles['menu-icon']}>
                                                <IconComponent />
                                            </span>
                                        )}

                                        <span className={styles['group-title']}>{groupName}</span>
                                    </div>

                                    <span className={styles['menu-chevron']}>
                                        <Icon name="chevron-right" size="l" color="neutrals-B800" />
                                    </span>
                                </div>
                            );
                        })}
                </div>

                {/* RIGHT PANEL */}
                <div className={styles['widget-content']}>
                    {isSearching ? (
                        <>
                            <div className={styles['widget-header']}>
                                <h4>Search Results</h4>
                                <span>
                                    {searchResults.length} widget
                                    {searchResults.length !== 1 ? 's' : ''} found
                                </span>
                            </div>

                            {searchResults.length > 0 ? (
                                <div className={styles['widget-grid']}>
                                    {searchResults.map((w: WidgetDefinition) => (
                                        <WidgetThumbnailCard
                                            key={w.type}
                                            title={w.title}
                                            thumbnailUrl={w.thumbnail}
                                            selected={selectedWidgets.includes(w.type)}
                                            disabled={w.disabled}
                                            onClick={() => toggleWidgetSelection(w)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <span>
                                            No widgets match <strong>"{query.trim()}"</strong>
                                        </span>
                                    }
                                />
                            )}
                        </>
                    ) : !activeGroup ? (
                        <div className={styles['empty-state']}>
                            <SelectWidgetIcon className={styles['empty-state-icon']} />

                            <p className={styles['empty-state-text']}>
                                Select a Category to see available Widgets
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className={styles['widget-header']}>
                                <h4>Available Widgets</h4>

                                <span>Select and add widgets to continue</span>
                            </div>

                            <div className={styles['widget-grid']}>
                                {widgetsInSelectedGroup.map(w => (
                                    <WidgetThumbnailCard
                                        key={w.type}
                                        title={w.title}
                                        thumbnailUrl={w.thumbnail}
                                        selected={selectedWidgets.includes(w.type)}
                                        disabled={w.disabled}
                                        onClick={() => toggleWidgetSelection(w)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Flyout
            flyoutOpen={isOpen}
            direction="left"
            heading="Select Widget"
            content={<FlyoutContent />}
            id="layout-add-fly-out"
            className={styles['flyout-container-main']}
            containerMaxWidth="100%"
            showfooter
            onBackDropClick={onClose}
            cancelIconClick={onClose}
            iconForCancel={{
                icon: 'x-close',
                onClick: onClose,
            }}
            cancelBtnProps={{
                disabled: true,
                onClick: () => {},
                text: `${selectedWidgets.length} Selected`,
                variant: 'Subtle2',
            }}
            secondaryBtnProps={{
                disabled: selectedWidgets.length === 0 && !query && !activeGroup,
                text: 'Reset',
                variant: 'Secondary',
                onClick: () => {
                    setSelectedGroup('');
                    setSelectedWidgets([]);
                    setQuery('');
                },
            }}
            primaryBtnProps={{
                disabled: selectedWidgets.length === 0,
                text: 'Add Widget',
                variant: 'Primary',
                onClick: () => {
                    if (selectedWidgets.length === 0) return;
                    onAdd(selectedWidgets);
                    setSelectedWidgets([]);
                    onClose();
                    
                },
            }}
        />
    );
}

export default LayoutAddWidgetFlyout;
