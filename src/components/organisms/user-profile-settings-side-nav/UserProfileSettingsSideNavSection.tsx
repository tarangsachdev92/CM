import { Flex } from 'antd';
import { Icon, SearchInput, Switch } from 'konnect-react-components';
import type { DragEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {fetchUserNavigationPreferences,saveSideNavigationPinnedItems,type AppDispatch,type RootState,} from '../../../store';
import { CUSTOMIZABLE_SIDE_NAV_ITEMS, type SideNavItem } from '../../../utils/sideNavItems';
import styles from './UserProfileSettingsSideNavSection.module.scss';
 
type EmptyStateIconProps = {
    large?: boolean;
};
 
const EmptyStateIcon = ({ large }: EmptyStateIconProps) => (
    <div
        className={large ? styles['empty-icon-large'] : styles['empty-icon']}
        aria-hidden="true"
    >
        <svg width="108" height="108" viewBox="0 0 108 108" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M70.6863 31.2762C77.3259 30.9465 82.2273 37.3851 80.1419 43.6973C79.0869 46.8908 79.8059 50.4042 82.0307 52.9265C86.4281 57.912 84.4501 65.7584 78.2149 68.0636C75.0603 69.2299 72.7617 71.9826 72.1769 75.2946C71.0208 81.8411 63.653 85.1868 57.9631 81.7492C55.0844 80.01 51.4991 79.9292 48.545 81.5369C42.706 84.7147 35.4964 81.0403 34.6365 74.4485C34.2014 71.1135 32.0292 68.26 28.9304 66.9528C22.8053 64.369 21.1829 56.4414 25.8005 51.6591C28.1366 49.2396 29.0132 45.7621 28.1032 42.5244C26.3044 36.1246 31.4909 29.9134 38.1088 30.5419C41.457 30.8598 44.7224 29.377 46.6863 26.6468C50.5683 21.2503 58.6582 21.4326 62.293 26.9986C64.132 29.8145 67.3272 31.443 70.6863 31.2762Z" fill="#FFC033"/>
<g opacity="0.15" filter="url(#filter0_f_83618_22062)">
<ellipse cx="54.3528" cy="96.8476" rx="27.1867" ry="3.39834" fill="#B57D00"/>
</g>
<circle cx="43.6933" cy="43.6835" r="3.39834" fill="#0D0D0D"/>
<circle cx="64.0819" cy="43.6835" r="3.39834" fill="#0D0D0D"/>
<path d="M60.3154 50.7437C59.523 51.758 58.5018 52.5703 57.3353 53.1143C56.1688 53.6582 54.8901 53.9184 53.6038 53.8734C52.3174 53.8285 51.06 53.4798 49.9343 52.8558C48.8086 52.2318 47.8465 51.3502 47.1268 50.2832" stroke="#0D0D0D" stroke-width="2.71867"/>
<defs>
<filter id="filter0_f_83618_22062" x="24.4473" y="90.7305" width="59.8109" height="12.2342" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="1.35934" result="effect1_foregroundBlur_83618_22062"/>
</filter>
</defs>
</svg>


    </div>
);
 
const PinnedItemDragIcon = () => (
    <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.33333 10.6667C0.966667 10.6667 0.652778 10.5361 0.391667 10.275C0.130556 10.0139 0 9.7 0 9.33333C0 8.96667 0.130556 8.65278 0.391667 8.39167C0.652778 8.13056 0.966667 8 1.33333 8C1.7 8 2.01389 8.13056 2.275 8.39167C2.53611 8.65278 2.66667 8.96667 2.66667 9.33333C2.66667 9.7 2.53611 10.0139 2.275 10.275C2.01389 10.5361 1.7 10.6667 1.33333 10.6667ZM5.33333 10.6667C4.96667 10.6667 4.65278 10.5361 4.39167 10.275C4.13056 10.0139 4 9.7 4 9.33333C4 8.96667 4.13056 8.65278 4.39167 8.39167C4.65278 8.13056 4.96667 8 5.33333 8C5.7 8 6.01389 8.13056 6.275 8.39167C6.53611 8.65278 6.66667 8.96667 6.66667 9.33333C6.66667 9.7 6.53611 10.0139 6.275 10.275C6.01389 10.5361 5.7 10.6667 5.33333 10.6667ZM1.33333 6.66667C0.966667 6.66667 0.652778 6.53611 0.391667 6.275C0.130556 6.01389 0 5.7 0 5.33333C0 4.96667 0.130556 4.65278 0.391667 4.39167C0.652778 4.13056 0.966667 4 1.33333 4C1.7 4 2.01389 4.13056 2.275 4.39167C2.53611 4.65278 2.66667 4.96667 2.66667 5.33333C2.66667 5.7 2.53611 6.01389 2.275 6.275C2.01389 6.53611 1.7 6.66667 1.33333 6.66667ZM5.33333 6.66667C4.96667 6.66667 4.65278 6.53611 4.39167 6.275C4.13056 6.01389 4 5.7 4 5.33333C4 4.96667 4.13056 4.65278 4.39167 4.39167C4.65278 4.13056 4.96667 4 5.33333 4C5.7 4 6.01389 4.13056 6.275 4.39167C6.53611 4.65278 6.66667 4.96667 6.66667 5.33333C6.66667 5.7 6.53611 6.01389 6.275 6.275C6.01389 6.53611 5.7 6.66667 5.33333 6.66667ZM1.33333 2.66667C0.966667 2.66667 0.652778 2.53611 0.391667 2.275C0.130556 2.01389 0 1.7 0 1.33333C0 0.966667 0.130556 0.652778 0.391667 0.391667C0.652778 0.130556 0.966667 0 1.33333 0C1.7 0 2.01389 0.130556 2.275 0.391667C2.53611 0.652778 2.66667 0.966667 2.66667 1.33333C2.66667 1.7 2.53611 2.01389 2.275 2.275C2.01389 2.53611 1.7 2.66667 1.33333 2.66667ZM5.33333 2.66667C4.96667 2.66667 4.65278 2.53611 4.39167 2.275C4.13056 2.01389 4 1.7 4 1.33333C4 0.966667 4.13056 0.652778 4.39167 0.391667C4.65278 0.130556 4.96667 0 5.33333 0C5.7 0 6.01389 0.130556 6.275 0.391667C6.53611 0.652778 6.66667 0.966667 6.66667 1.33333C6.66667 1.7 6.53611 2.01389 6.275 2.275C6.01389 2.53611 5.7 2.66667 5.33333 2.66667Z" fill="#0D0D0D"/>
    </svg>
);
 
type SideNavItemRowProps = {
    item: SideNavItem;
    checked: boolean;
    onToggle: (id: string) => void;
    showDragHandle?: boolean;
    isDragging?: boolean;
    onDragStart?: (itemId: string, event: DragEvent<HTMLSpanElement>) => void;
    onDragEnd?: () => void;
    onDragOver?: (event: DragEvent<HTMLElement>) => void;
    onDrop?: (targetItemId: string, event: DragEvent<HTMLElement>) => void;
};
 
const SideNavItemRow = ({
    item,
    checked,
    onToggle,
    showDragHandle,
    isDragging,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
}: SideNavItemRowProps) => (
    <Flex
        align="center"
        justify="space-between"
        className={`${styles['item-row']} ${isDragging ? styles['item-row-dragging'] : ''}`}
        onDragOver={onDragOver}
        onDrop={event => {
            event.preventDefault();
            onDrop?.(item.id, event);
        }}
    >
        <Flex align="center" gap={8} className={styles['item-label-wrap']}>
            {showDragHandle && (
                <span
                    className={styles['drag-handle']}
                    draggable
                    aria-label={`Reorder ${item.label}`}
                    onDragStart={event => onDragStart?.(item.id, event)}
                    onDragEnd={onDragEnd}
                >
                    <PinnedItemDragIcon />
                </span>
            )}
            <span className={styles['item-icon']}>
                <Icon name={item.iconName as any} size="s" color="neutrals-B500" />
            </span>
            <span className={styles['item-label']}>{item.label}</span>
        </Flex>
        <Switch checked={checked} onToggle={() => onToggle(item.id)} />
    </Flex>
);
 
function UserProfileSettingsSideNavSection() {
    const dispatch = useDispatch<AppDispatch>();
    const [searchText, setSearchText] = useState('');
    const [draggingPinnedItemId, setDraggingPinnedItemId] = useState<string | null>(null);
    const pinnedItemIds = useSelector((state: RootState) => state.sideNavigation.pinnedItemIds);
    const hasLoadedSideNavigation = useSelector(
        (state: RootState) => state.sideNavigation.hasLoaded,
    );
    const isSideNavigationLoading = useSelector(
        (state: RootState) => state.sideNavigation.isLoading,
    );
    const isSideNavigationSaving = useSelector(
        (state: RootState) => state.sideNavigation.isSaving,
    );
    const pinnedItems = pinnedItemIds
        .map(itemId => CUSTOMIZABLE_SIDE_NAV_ITEMS.find(item => item.id === itemId))
        .filter((item): item is SideNavItem => Boolean(item));
    const hiddenItems = CUSTOMIZABLE_SIDE_NAV_ITEMS.filter(item => !pinnedItemIds.includes(item.id));
    const normalizedSearch = searchText.trim().toLowerCase();
 
    const filteredHiddenItems = useMemo(
        () =>
            hiddenItems.filter(item => item.label.toLowerCase().includes(normalizedSearch)),
        [hiddenItems, normalizedSearch],
    );
    const filteredPinnedItems = useMemo(
        () =>
            pinnedItems.filter(item => item.label.toLowerCase().includes(normalizedSearch)),
        [pinnedItems, normalizedSearch],
    );
    const isSearching = normalizedSearch.length > 0;
 
    useEffect(() => {
        if (!hasLoadedSideNavigation && !isSideNavigationLoading) {
            dispatch(fetchUserNavigationPreferences());
        }
    }, [dispatch, hasLoadedSideNavigation, isSideNavigationLoading]);
 
    const handleToggle = (itemId: string) => {
        if (isSideNavigationLoading || isSideNavigationSaving) return;
 
        const nextPinnedItemIds = pinnedItemIds.includes(itemId)
            ? pinnedItemIds.filter(id => id !== itemId)
            : [...pinnedItemIds, itemId];
 
        dispatch(
            saveSideNavigationPinnedItems({
                nextPinnedItemIds,
                previousPinnedItemIds: pinnedItemIds,
            }),
        );
    };
 
    const persistPinnedItemOrder = (nextPinnedItemIds: string[]) => {
        dispatch(
            saveSideNavigationPinnedItems({
                nextPinnedItemIds,
                previousPinnedItemIds: pinnedItemIds,
            }),
        );
    };
 
    const handlePinnedDragStart = (itemId: string, event: DragEvent<HTMLSpanElement>) => {
        setDraggingPinnedItemId(itemId);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', itemId);
    };
 
    const handlePinnedDrop = (targetItemId: string, event: DragEvent<HTMLElement>) => {
        if (!draggingPinnedItemId || draggingPinnedItemId === targetItemId) {
            setDraggingPinnedItemId(null);
            return;
        }
 
        const nextPinnedItemIds = pinnedItemIds.filter(id => id !== draggingPinnedItemId);
        const targetIndex = nextPinnedItemIds.indexOf(targetItemId);
 
        if (targetIndex === -1) {
            setDraggingPinnedItemId(null);
            return;
        }
 
        const targetBounds = event.currentTarget.getBoundingClientRect();
        const shouldInsertAfter =
            event.clientY > targetBounds.top + targetBounds.height / 2;
        const insertIndex = shouldInsertAfter ? targetIndex + 1 : targetIndex;
 
        nextPinnedItemIds.splice(insertIndex, 0, draggingPinnedItemId);
        setDraggingPinnedItemId(null);
        persistPinnedItemOrder(nextPinnedItemIds);
    };
 
    return (
        <section className={styles['side-nav-settings-card']}>
            <Flex justify="space-between" align="flex-start" className={styles['header-row']}>
                <Flex vertical gap={4}>
                    <h3 className={styles['title']}>Side Navigation Customization</h3>
                    <p className={styles['description']}>
                        Toggle items to pin or unpin them to your side navigation for quick access
                    </p>
                </Flex>
                <div className={styles['search-wrapper']}>
                    <SearchInput
                        placeholder="Search"
                        onChange={value => setSearchText(typeof value === 'string' ? value : '')}
                    />
                </div>
            </Flex>
 
            <div className={styles['lists-grid']}>
                <div className={styles['list-card']}>
                    <Flex align="center" gap={8} className={styles['section-title-row']}>
                        <h4 className={styles['section-title']}>Hidden Items</h4>
                        <span className={styles['count-pill']}>{filteredHiddenItems.length}</span>
                    </Flex>
                    {filteredHiddenItems.length ? (
                        <div className={styles['items-list']}>
                            {filteredHiddenItems.map(item => (
                                <SideNavItemRow
                                    key={item.id}
                                    item={item}
                                    checked={false}
                                    onToggle={handleToggle}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={styles['empty-state']}>
                            <EmptyStateIcon large />
                            <h5>{isSearching ? 'No Matching Hidden Items' : 'No Hidden Items'}</h5>
                            <p>
                                {isSearching
                                    ? 'No hidden items match your current search.'
                                    : 'There are no hidden items currently, Toggle off to unpin items from the navigation bar'}
                            </p>
                        </div>
                    )}
                </div>
 
                <div className={styles['list-card']}>
                    <Flex align="center" gap={8} className={styles['section-title-row']}>
                        <h4 className={styles['section-title']}>Pinned Items</h4>
                        {filteredPinnedItems.length > 0 && (
                            <span className={styles['count-pill']}>{filteredPinnedItems.length}</span>
                        )}
                    </Flex>
                    {filteredPinnedItems.length ? (
                        <div className={styles['items-list']}>
                            {filteredPinnedItems.map(item => (
                                <SideNavItemRow
                                    key={item.id}
                                    item={item}
                                    checked
                                    onToggle={handleToggle}
                                    showDragHandle
                                    isDragging={draggingPinnedItemId === item.id}
                                    onDragStart={handlePinnedDragStart}
                                    onDragEnd={() => setDraggingPinnedItemId(null)}
                                    onDragOver={event => {
                                        if (draggingPinnedItemId) {
                                            event.preventDefault();
                                            event.dataTransfer.dropEffect = 'move';
                                        }
                                    }}
                                    onDrop={handlePinnedDrop}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={styles['empty-state']}>
                            <EmptyStateIcon large />
                            <h5>{isSearching ? 'No Matching Pinned Items' : 'No Pinned Items'}</h5>
                            <p>
                                {isSearching
                                    ? 'No pinned items match your current search.'
                                    : 'There are no pinned items currently, Toggle on to to pin items to the navigation bar'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
 
export default UserProfileSettingsSideNavSection;
 
 
 
 