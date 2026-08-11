import React, { useCallback } from 'react';
import { Flyout, SearchInput, CheckBox, Counter } from 'konnect-react-components';
import { Flex } from 'antd';
import styles from './RoleSelectionFlyout.module.scss';
import { SCROLL_THRESHOLD } from '../../../utils/constants';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

export interface FlyoutCheckboxItemForum {
    roleId?: string;
    roleLevelName?: string;
    role?: string;
    checked?: boolean;
    numberOfUsers?: number;
    roleGeoName?: string;
    roleLevelId?: string;
    departmentName?: string;
    functionId?: string;
    functionName?: string;
    subFunctionId?: string;
    subFunctionName?: string;
    responsibilityLevelName?: string;
    roleName?: string;
    users?: any;
    rowIndex?: string;
}
export interface FlyoutUserCheckboxItem {
    id: string;
    roleId: string;
    userEmail: string;
    checked: boolean;
    fullName: string;
    disabled?: boolean;
}

export interface RoleSelectionFlyoutProps {
    flyoutOpen: boolean;
    setIsFlyoutOpen?: (val: boolean) => void;
    heading: string;
    subHeading?: string;
    isRoleDataLoading?: boolean;

    showSearch?: boolean;
    searchPlaceholder?: string;
    userSearchPlaceholder?: string;
    onSearchChange?: (value: string | string[]) => void;

    dropdownFilter?: React.ReactNode;

    items: FlyoutCheckboxItemForum[];
    onItemToggle?: (id: string, type: string, roleId?: string) => void;

    hasMoreItems?: boolean;
    isLoadingMore?: boolean;
    onLoadMore?: () => void;

    showSelectAll?: boolean;
    onSelectAllToggle?: (checked: boolean, type: string) => void;
    isAllSelected?: boolean;
    isAllRolesSelected?: boolean;
    isAllUsersSelected?: boolean;
    primaryBtnProps: any;
    secondaryBtnProps?: any;
    cancelBtnProps?: any;
    iconForCancel?: any;
    onSelectUserCounter: any;
    userFlyoutOpen: boolean;
    primaryBtnPropsUsersFlyout: any;
    cancelBtnPropsUsersFlyout?: any;
    secondaryBtnPropsUserFlyout?: any;
    userFlyoutData?: any;
    totalUsers?: FlyoutUserCheckboxItem[];
    userFlyoutHeading?: string;
    userFlyoutSubHeading?: string;
    onUserFlyoutBack?: (checked: boolean) => void;
    userDropdownFilter?: React.ReactNode;
    isRoleOnlyMode?: boolean;
    isEditable?: boolean
}

export const RoleSelectionFlyoutForum: React.FC<RoleSelectionFlyoutProps> = ({
    isEditable = true,
    flyoutOpen,
    setIsFlyoutOpen,
    heading,
    subHeading,
    isRoleDataLoading = false,
    showSearch = true,
    searchPlaceholder = 'Search',
    userSearchPlaceholder = 'Search Users',
    onSearchChange,
    dropdownFilter,
    items,
    onItemToggle,
    hasMoreItems = false,
    isLoadingMore = false,
    onLoadMore,
    showSelectAll,
    onSelectAllToggle,
    isAllSelected,
    isAllRolesSelected,
    isAllUsersSelected,
    primaryBtnProps,
    secondaryBtnProps,
    cancelBtnProps,
    onSelectUserCounter,
    userFlyoutOpen,
    primaryBtnPropsUsersFlyout,
    cancelBtnPropsUsersFlyout,
    secondaryBtnPropsUserFlyout,
    userFlyoutData,
    totalUsers,
    userFlyoutHeading,
    userFlyoutSubHeading,
    onUserFlyoutBack,
    userDropdownFilter,
    isRoleOnlyMode,
}) => {
    const { scrollRef: roleListRef, handleScroll: handleRoleListScroll } = useInfiniteScroll({
        threshold: SCROLL_THRESHOLD,
        hasMoreItems: hasMoreItems || false,
        isLoadingMore: isLoadingMore || false,
        onLoadMore: onLoadMore || (() => {}),
    });

    const handleRoleFlyoutClose = useCallback(() => {
        setIsFlyoutOpen?.(false);
    }, [setIsFlyoutOpen]);

    const handleUserFlyoutClose = useCallback(() => {
        onUserFlyoutBack?.(false);
    }, [onUserFlyoutBack]);

    const contentRole = (
        <Flex vertical className={styles['flyout-bod1y']}>
            {showSearch && (
                <SearchInput
                    border={false}
                    placeholder={searchPlaceholder}
                    onChange={val => onSearchChange?.(val)}
                    className={styles['search-input-forum']}
                />
            )}

            <div className={styles['content-wrapper']}>
                {dropdownFilter && (
                    <div className={styles['dropdown-wrapper']}>{dropdownFilter}</div>
                )}

                <div
                    ref={roleListRef}
                    className={styles['checkbox-list']}
                    style={{ overflowY: 'auto' }}
                    onScroll={handleRoleListScroll}
                >
                    <Flex vertical gap={12}>
                        {isRoleDataLoading ? (
                            <div className={styles['loading-state']}>Loading roles...</div>
                        ) : (
                            <>
                                {showSelectAll && items.length > 0 && (
                                    <CheckBox
                                        disabled={!isEditable}
                                        label="Select All"
                                        checked={isAllRolesSelected ?? isAllSelected}
                                        onChange={val => onSelectAllToggle?.(val, 'Roles')}
                                    />
                                )}

                                {items.map(item => {
                                    const usersForCounter =
                                        totalUsers?.filter(
                                            userItem =>
                                                String(userItem.roleId) === String(item.roleId),
                                        ) || item?.users || [];
                                    const selectedUsersCount = usersForCounter.filter(
                                        (userItem: any) => userItem.checked,
                                    ).length;
                                    const totalUsersInRole = item?.users?.length || usersForCounter.length || 0;
                                    const checkedUsersInRole = item?.users?.filter(
                                        (u: any) => u.checked,
                                    ).length;
                                    const isIntermediate =
                                        checkedUsersInRole > 0 &&
                                        checkedUsersInRole < totalUsersInRole;

                                    const functionAndSubFunction = [
                                        item.functionName,
                                        item.subFunctionName,
                                    ]
                                        .filter(Boolean)
                                        .join(' ')
                                        .trim();
                                    const roleLevel = String(item.roleLevelName ?? '').trim();
                                    const subLabel = [functionAndSubFunction, roleLevel]
                                        .filter(Boolean)
                                        .join(', ');

                                    return (
                                        <Flex
                                            key={item.roleId}
                                            align="start"
                                            justify="space-between"
                                            className={styles['checkbox-row']}
                                        >
                                            <CheckBox
                                                disabled={!isEditable}
                                                label={
                                                    <Flex vertical gap={2}>
                                                        <span
                                                            className={styles['checkbox-label']}
                                                        >
                                                            {item.responsibilityLevelName}{' '}
                                                            {item.roleName}
                                                        </span>
                                                        {subLabel && (
                                                            <span
                                                                className={
                                                                    styles['checkbox-sub-label']
                                                                }
                                                            >
                                                                {subLabel}
                                                            </span>
                                                        )}
                                                    </Flex>
                                                }
                                                checked={item.checked}
                                                intermediate={isIntermediate}
                                                onChange={() =>
                                                    onItemToggle &&
                                                    onItemToggle(item.roleId || '', 'Roles')
                                                }
                                            />
                                            {!isRoleOnlyMode &&
                                            item.checked &&
                                            selectedUsersCount !== undefined &&
                                            item.users?.length !== undefined && item.users.length > 0 
                                            && (
                                                    <Counter
                                                        onClick={() => {
                                                            if (!isRoleOnlyMode) {
                                                                onSelectUserCounter(item);
                                                            }
                                                        }}
                                                        value={`${selectedUsersCount}/${item?.users?.length}`}
                                                        colorVariant="Neutral-1"
                                                        className={styles['checkbox-counter']}
                                                    />
                                                )}
                                        </Flex>
                                    );
                                })}
                            </>
                        )}
                        {isLoadingMore && (
                            <div
                                className={styles['loading-state']}
                                style={{ textAlign: 'center', padding: '8px 0' }}
                            >
                                Loading more...
                            </div>
                        )}
                    </Flex>
                </div>
            </div>
        </Flex>
    );

    const contentUser = (
        <Flex vertical className={styles['flyout-bod1y']}>
            {showSearch && (
                <SearchInput
                    border={false}
                    placeholder={userSearchPlaceholder}
                    onChange={val => onSearchChange?.(val)}
                    className={styles['search-input']}
                />
            )}

            <div className={styles['content-wrapper']}>
                {userDropdownFilter && (
                    <div className={styles['dropdown-wrapper']}>{userDropdownFilter}</div>
                )}

                <Flex vertical className={styles['checkbox-list']} gap={12}>
                    {showSelectAll && (
                        <CheckBox
                        disabled={!isEditable}
                            label="Select All"
                            checked={isAllUsersSelected ?? isAllSelected}
                            onChange={val => onSelectAllToggle?.(val, 'Users')}
                        />
                    )}

                    {(userFlyoutData || []).map((item: FlyoutUserCheckboxItem) => (
                        <Flex
                            key={item.id}
                            align="start"
                            justify="start"
                            className={styles['checkbox-row']}
                        >
                            <CheckBox
                            disabled={!isEditable || !!item.disabled}
                                label={
                                    <Flex vertical gap={2}>
                                        <span className={styles['checkbox-label']}>
                                            {item.fullName}
                                        </span>
                                        {item.userEmail && (
                                            <span className={styles['checkbox-sub-label']}>
                                                {item.userEmail}
                                            </span>
                                        )}
                                    </Flex>
                                }
                                checked={item.checked}
                                onChange={() =>
                                    onItemToggle && onItemToggle(item.userEmail, 'Users', item.roleId)
                                }
                            />
                        </Flex>
                    ))}
                </Flex>
            </div>
        </Flex>
    );

    return (
        <div className={styles['role-selection-flyout']}>
            <Flyout
                key={'role'}
                flyoutOpen={flyoutOpen}
                onBackDropClick={() => {
                    if (!userFlyoutOpen) {
                        handleRoleFlyoutClose();
                    }
                }}
                heading={heading}
                subHeading={subHeading}
                content={contentRole}
                cancelBtnProps={cancelBtnProps}
                primaryBtnProps={primaryBtnProps}
                secondaryBtnProps={
                    secondaryBtnProps
                        ? {
                              ...secondaryBtnProps,
                              onClick: () => {
                                  secondaryBtnProps?.onClick?.();
                                  handleRoleFlyoutClose();
                              },
                          }
                        : secondaryBtnProps
                }
                iconForCancel={{
                    icon: 'x-close',
                    size: 'Small',
                    onClick: handleRoleFlyoutClose,
                }}
                cancelIconClick={() => {}}
                containerMaxWidth={'35rem'}
                direction="right"
                dataTestId="flyout-filter"
                id="flyout-filter"
                className={styles['role-flyout']}
            />
            <Flyout
                key={'users'}
                flyoutOpen={userFlyoutOpen}
                // onBackDropClick={() => onUserFlyoutBack?.(false)}
                heading={userFlyoutHeading ?? ''}
                subHeading={userFlyoutSubHeading ?? ''}
                content={contentUser}
                cancelBtnProps={cancelBtnPropsUsersFlyout}
                primaryBtnProps={primaryBtnPropsUsersFlyout}
                secondaryBtnProps={
                    secondaryBtnPropsUserFlyout
                        ? {
                              ...secondaryBtnPropsUserFlyout,
                              onClick: () => {
                                  secondaryBtnPropsUserFlyout?.onClick?.();
                                  handleUserFlyoutClose();
                              },
                          }
                        : secondaryBtnPropsUserFlyout
                }
                iconForCancel={{
                    icon: 'chevron-left',
                    size: 'Medium',
                    onClick: handleUserFlyoutClose,
                }}
                cancelIconClick={() => {}}
                containerMaxWidth={'35rem'}
                direction="right"
                dataTestId="flyout-filter"
                id="flyout-filter"
                className={styles['users-flyout']}
            />
        </div>
    );
};
