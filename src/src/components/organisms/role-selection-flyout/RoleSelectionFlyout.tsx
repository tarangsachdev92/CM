import React from 'react';
import { Flyout, SearchInput, CheckBox, Counter } from 'konnect-react-components';
import { Flex } from 'antd';
import styles from './RoleSelectionFlyout.module.scss';

export interface FlyoutCheckboxItem {
    id: string;
    label: string;
    subLabel?: string;
    checked: boolean;
    counterValue?: string;
}

export interface RoleSelectionFlyoutProps {
    flyoutOpen: boolean;
    setIsFlyoutOpen: (val: boolean) => void;
    heading: string;
    subHeading?: string;

    showSearch?: boolean;
    searchPlaceholder?: string;
    onSearchChange?: (value: string | string[]) => void;

    dropdownFilter?: React.ReactNode;

    items: FlyoutCheckboxItem[];
    onItemToggle: (id: string) => void;

    showSelectAll?: boolean;
    onSelectAllToggle?: (checked: boolean) => void;
    isAllSelected?: boolean;

    primaryBtnProps: any;
    secondaryBtnProps?: any;
    cancelBtnProps?: any;
    iconForCancel?: any;
}

export const RoleSelectionFlyout: React.FC<RoleSelectionFlyoutProps> = ({
    flyoutOpen,
    setIsFlyoutOpen,
    heading,
    subHeading,
    showSearch = true,
    searchPlaceholder = 'Search',
    onSearchChange,
    dropdownFilter,
    items,
    onItemToggle,
    showSelectAll,
    onSelectAllToggle,
    isAllSelected,
    primaryBtnProps,
    secondaryBtnProps,
    cancelBtnProps,
    iconForCancel,
}) => {
    const content = (
        <Flex vertical className={styles['flyout-bod1y']}>
            {showSearch && (
                <SearchInput
                    placeholder={searchPlaceholder}
                    onChange={val => onSearchChange?.(val)}
                    className={styles['search-input']}
                />
            )}

            <div className={styles['content-wrapper']}>
                {dropdownFilter && (
                    <div className={styles['dropdown-wrapper']}>{dropdownFilter}</div>
                )}

                <Flex vertical className={styles['checkbox-list']} gap={12}>
                    {showSelectAll && (
                        <CheckBox
                            label="Select All"
                            checked={isAllSelected}
                            onChange={val => onSelectAllToggle?.(val)}
                        />
                    )}

                    {items.map(item => (
                        <Flex
                            key={item.id}
                            align="start"
                            justify="space-between"
                            className={styles['checkbox-row']}
                        >
                            <CheckBox
                                label={
                                    <Flex vertical gap={2}>
                                        <span className={styles['checkbox-label']}>
                                            {item.label}
                                        </span>
                                        {item.subLabel && (
                                            <span className={styles['checkbox-sub-label']}>
                                                {item.subLabel}
                                            </span>
                                        )}
                                    </Flex>
                                }
                                checked={item.checked}
                                onChange={() => onItemToggle(item.id)}
                            />

                            {typeof item.counterValue === 'string' && (
                                <Counter
                                    value={item.counterValue}
                                    colorVariant="Neutral-1"
                                    className={styles['checkbox-counter']}
                                />
                            )}
                        </Flex>
                    ))}
                </Flex>
            </div>
        </Flex>
    );

    return (
        <div className={styles['role-selection-flyout']}>
            <Flyout
                flyoutOpen={flyoutOpen}
                onBackDropClick={() => setIsFlyoutOpen(false)}
                heading={heading}
                subHeading={subHeading}
                content={content}
                cancelBtnProps={cancelBtnProps}
                primaryBtnProps={primaryBtnProps}
                secondaryBtnProps={secondaryBtnProps}
                iconForCancel={iconForCancel}
                cancelIconClick={() => {}}
                containerMaxWidth={'35rem'}
                direction="right"
                dataTestId="flyout-filter"
                id="flyout-filter"
                className={styles['role-selection-flyout']}
            />
        </div>
    );
};
