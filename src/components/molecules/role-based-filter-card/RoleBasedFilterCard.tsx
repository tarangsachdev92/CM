import { Card, Flex } from 'antd';
import { ExpandableForm, Label } from '../../../components';
import styles from './RoleBasedFilterCard.module.scss';
import { CheckBox, FilterChip, Icon, AnimatedLoaders } from 'konnect-react-components';
import { useCallback } from 'react';
import { RoleBasedFilterRole } from '../../../types/response';
import { UserProfileSettingsPrimaryRole } from '../../../assets/images/images';

type Props = {
    roles: RoleBasedFilterRole[];
    handleDetailsViewClicked: (roleId: number) => void;
    variant?: string;
    handleCheckboxChange?: (checked: boolean, role: RoleBasedFilterRole) => void;
    isLoading?: boolean;
};

function RoleBasedFilterCard({
    roles,
    handleDetailsViewClicked,
    variant,
    handleCheckboxChange,
    isLoading = false,
}: Readonly<Props>) {
    const truncateLabel = (items: string[]) => {
        const label = items.slice(0, 2).join(',');
        return label.length > 15 ? label.slice(0, 15) + '...' : label;
    };

    const renderAllFilterGroups = useCallback((role: RoleBasedFilterRole) => {
        return (
            <Flex className={styles['all-hierarchy-warpper']}>
                <Flex className={styles['fliter-group-content-warpper']}>
                    <Flex wrap="wrap" gap="0.5rem">
                        {role.region.length > 0 && (
                            <FilterChip
                                key="filter-chip-region"
                                counter={role.region.length > 2 ? role.region.length - 2 : 0}
                                label={truncateLabel(role.region)}
                                title="Region:"
                                tooltipText={'Region: ' + role.region.join(',')}
                                showCloseIcon={false}
                            />
                        )}
                        {role.cluster.length > 0 && (
                            <FilterChip
                                key="filter-chip-cluster"
                                counter={role.cluster.length > 2 ? role.cluster.length - 2 : 0}
                                label={truncateLabel(role.cluster)}
                                title="Cluster:"
                                tooltipText={'Cluster: ' + role.cluster.join(',')}
                                showCloseIcon={false}
                            />
                        )}
                        {role.market.length > 0 && (
                            <FilterChip
                                key="filter-chip-market"
                                counter={role.market.length > 2 ? role.market.length - 2 : 0}
                                label={truncateLabel(role.market)}
                                title="Market:"
                                tooltipText={'Market: ' + role.market.join(',')}
                                showCloseIcon={false}
                            />
                        )}
                        {role.site.length > 0 && (
                            <FilterChip
                                key="filter-chip-site-code"
                                counter={role.site.length > 2 ? role.site.length - 2 : 0}
                                label={truncateLabel(role.site)}
                                title="Site Code:"
                                tooltipText={'Site Code: ' + role.site.join(',')}
                                showCloseIcon={false}
                            />
                        )}
                    </Flex>
                </Flex>
            </Flex>
        );
    }, []);

    const EmptyState = () => {
        return (
            <div className={styles['role-card-children']}>
                <UserProfileSettingsPrimaryRole />
                <Label type="h2">
                    <span className={styles['role-card-children-title']}>No Roles Added</span>{' '}
                </Label>
                <Label type="body3">
                    {' '}
                    <span className={styles['role-card-children-label']}>
                        Geographical filters based on added roles will be visible here
                    </span>
                </Label>
            </div>
        );
    };

    const RenderRoles = () => {
        return (
            <>
                {roles.length == 0 ? (
                    <>{EmptyState()}</>
                ) : (
                    <>
                        {roles.map(role => {
                            const isPrimary = role.roleType === 'Primary';
                            const checked = isPrimary ? true : !!role.isFilterApplied;
                            const disabled = isPrimary;
                            return (
                                <div key={role.roleId} className="fliter-group-wrapper">
                                    <ExpandableForm
                                        isOpen={role.isOpen}
                                        applyCustomSpacing={true}
                                        description=""
                                        title={
                                            <Flex
                                                align="center"
                                                gap="1rem"
                                                className={styles['filter-title-wrapper']}
                                            >
                                                <span
                                                    onClick={e => e.stopPropagation()}
                                                    onMouseDown={e => e.stopPropagation()}
                                                >
                                                    <CheckBox
                                                        checked={checked}
                                                        disabled={disabled}
                                                        onChange={(next: boolean) => {
                                                            if (disabled) return; // Primary cannot be toggled
                                                            handleCheckboxChange?.(next, role);
                                                        }}
                                                    />
                                                </span>
                                                <span className={styles['filter-title']}>
                                                    {`${role?.levelName ?? ''} - ${role?.roleName ?? ''}`}
                                                    <br />
                                                    {`${role?.roleGeoName ?? ''} ${role?.subFunctionName ?? ''} ${role?.departmentName ?? ''}`}
                                                </span>
                                            </Flex>
                                        }
                                        content={renderAllFilterGroups(role)}
                                        onClick={() => handleDetailsViewClicked(role.roleId)}
                                        additionalContentInTitleContainer={
                                            <div
                                                className={
                                                    styles['role-based-card-additional-container']
                                                }
                                            >
                                                {isPrimary && (
                                                    <div
                                                        className={styles['primary-role']}
                                                        onClick={e => e.stopPropagation()}
                                                        title="Primary role is always applied"
                                                    >
                                                        Primary role
                                                    </div>
                                                )}
                                                <Icon
                                                    name={
                                                        role.isOpen ? 'chevron-up' : 'chevron-down'
                                                    }
                                                    size="l"
                                                    color="neutrals-B800"
                                                />
                                            </div>
                                        }
                                    />
                                </div>
                            );
                        })}
                    </>
                )}
            </>
        );
    };

    return (
        <>
            {variant === 'flyout' ? (
                <Flex vertical className={styles['flyout-outer-container']}>
                    <Flex
                        justify="space-between"
                        className={styles['user-profile-settings-card-filter-group']}
                    >
                        <div className={styles['filter-group-title']}>Role Based Filters</div>
                    </Flex>

                    {roles.length == 0 ? (
                        <AnimatedLoaders
                            id="lazy-loader"
                            type="page"
                            className={styles['loader']}
                        />
                    ) : (
                        <>
                            {roles.map(role => {
                                const isPrimary = role.roleType === 'Primary';
                                const checked = isPrimary ? true : !!role.isFilterApplied;
                                const disabled = isPrimary;

                                return (
                                    <div key={role.roleId} className="fliter-group-wrapper">
                                        <ExpandableForm
                                            isOpen={role.isOpen}
                                            applyCustomSpacing={true}
                                            description=""
                                            title={
                                                <Flex align="center" gap="1rem">
                                                    <CheckBox
                                                        checked={checked}
                                                        disabled={disabled}
                                                        onChange={(next: boolean) => {
                                                            if (disabled) return; // Primary is fixed
                                                            handleCheckboxChange?.(next, role);
                                                        }}
                                                    />
                                                    <div>
                                                        <span className={styles['RoleName']}>
                                                            {`${role?.levelName ?? ''} - ${role?.roleName ?? ''}`}
                                                        </span>
                                                        <br />
                                                        <span
                                                            className={styles['role-name-subtext']}
                                                        >
                                                            {`${role?.roleGeoName ?? ''} ${role?.subFunctionName ?? ''} ${role?.departmentName ?? ''}`}
                                                        </span>
                                                    </div>
                                                </Flex>
                                            }
                                            content={renderAllFilterGroups(role)}
                                            onClick={() => handleDetailsViewClicked(role.roleId)}
                                            additionalContentInTitleContainer={
                                                <div
                                                    className={
                                                        styles[
                                                            'role-based-card-additional-container'
                                                        ]
                                                    }
                                                >
                                                    {isPrimary && (
                                                        <div
                                                            className={
                                                                styles['primary-role-flyout']
                                                            }
                                                            onClick={e => e.stopPropagation()}
                                                            title="Primary role is always applied"
                                                        >
                                                            Primary role
                                                        </div>
                                                    )}
                                                    <Icon
                                                        name={
                                                            role.isOpen
                                                                ? 'chevron-up'
                                                                : 'chevron-down'
                                                        }
                                                        size="l"
                                                        color="neutrals-B800"
                                                    />
                                                </div>
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </>
                    )}
                </Flex>
            ) : (
                <Card className={styles['user-profile-settings-card']}>
                    <Flex
                        justify="space-between"
                        className={styles['user-profile-settings-card-filter-group']}
                    >
                        <div className={styles['filter-group-title']}>Role Based Filters</div>
                    </Flex>

                    {isLoading ? (
                        <AnimatedLoaders
                            id="lazy-loader"
                            type="page"
                            className={styles['loader']}
                        />
                    ) : (
                        RenderRoles()
                    )}
                </Card>
            )}
        </>
    );
}

export default RoleBasedFilterCard;
