import { Avatar, Flex } from 'antd';
import { Tab } from 'konnect-react-components';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { getUserNameInitials } from '../../../utils/helpers';
import { Label } from '../../atoms';
import UserProfileSettingsRoleSection from '../user-profile-settings-role-section/UserProfileSettingsRoleSection';
import UserProfileSettingsGlobalFilters from '../user-profile-settings-global-fliter-section/UserProfileSettingsGlobalFilters';
import styles from './UserProfileSettings.module.scss';
import UserProfileSettingsNotificationAlertSection from '../user-profile-settings-notification-alert-section/UserProfileSettingsNotificationAlertSection';
import UserProfileSettingsDelegationSection from '../user-profile-settings-delegation-section/UserProfileSettingsDelegationSection';
import { useSearchParams } from 'react-router-dom';
import UserProfileSettingsRoleSectionNew from '../user-profile-settings-role-section/UserProfileSettingsRoleSection-new';
import UserProfileSettingsApprovalSection from '../user-profile-setting-approvals-section/UserProfileSettingsApprovalsSections';

import UserProfileSettingsDelegationSectionNew from '../user-profile-settings-delegation-section/UserProfileSettingsDelegationSectionNew';
import UserProfileSettingsSideNavSection from '../user-profile-settings-side-nav/UserProfileSettingsSideNavSection';
enum TabNamesEnum {
    Roles = 'Roles',
    NewRoles = 'New Roles',
    GlobalFilters = 'Global Filters',
    Delegation = 'Delegation',
    NewDelegation = 'New Delegation',
    NotificationsAlerts = 'Notifications',
    SideNav = 'Side Nav',
    Approvals = 'Approvals',
}

function RenderTabContent(selectedTab: string) {
    switch (selectedTab) {
        case TabNamesEnum.Roles:
            return <UserProfileSettingsRoleSection />;
        case TabNamesEnum.NewRoles:
            return <UserProfileSettingsRoleSectionNew />;
        case TabNamesEnum.NotificationsAlerts:
            return <UserProfileSettingsNotificationAlertSection />;
        case TabNamesEnum.GlobalFilters:
            return <UserProfileSettingsGlobalFilters />;
        case TabNamesEnum.Delegation:
            return <UserProfileSettingsDelegationSection />;
        case TabNamesEnum.Approvals:
            return <UserProfileSettingsApprovalSection/>;
        case TabNamesEnum.NewDelegation:
            return <UserProfileSettingsDelegationSectionNew />;
        case TabNamesEnum.SideNav:
            return <UserProfileSettingsSideNavSection />;
        default:
            return selectedTab;
    }
}

function UserProfileSettings() {
    const [searchParams] = useSearchParams();
    const tab = searchParams.get('tab') ?? TabNamesEnum.Roles;
    const [selectedTab, setSelectedTab] = useState<string>(tab);
 
    const onUserSelectTab = useCallback(({ label }: { label: string }) => {
        setSelectedTab(label);
    }, []);

    const profilePicture = useSelector((state: RootState) => state.profilePicture.imageUrl);

    return (
        <>
            <Flex vertical gap={8} className={styles['profile-settings-container']}>
                <Flex align="center" gap={16}>
                    {profilePicture ? (
                        <Avatar size={60} src={profilePicture} />
                    ) : (
                        <div className={styles['username-initials']}>{getUserNameInitials()}</div>
                    )}
                    <Flex justify="flex-start" vertical gap={8}>
                        <Label type="h2">
                            <span className="">Settings</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['profile-settings-description']}>
                                Configuration of user roles and other user settings
                            </span>
                        </Label>
                    </Flex>
                </Flex>
                <Flex className={styles['tabs-wrapper']}>
                    <Tab
                        DefaultSelected={{
                            label: tab,
                        }}
                        items={[
                            {
                                label: TabNamesEnum.Roles,
                                icon: 'users-01',
                            },
                            {
                                label: TabNamesEnum.NewRoles,
                                icon: 'users-01',
                            },
                            {
                                label: TabNamesEnum.GlobalFilters,
                                icon: 'filter-funnel-01',
                            },
                            {
                                label: TabNamesEnum.Delegation,
                                icon: 'users-down',
                                isDisabledTab: false,
                            },
                            {
                                label: TabNamesEnum.NewDelegation,
                                icon: 'users-down',
                                isDisabledTab: false,
                            },
                            {
                                label: TabNamesEnum.NotificationsAlerts,
                                icon: 'bell-ringing-02',
                            },
                            {
                                label: TabNamesEnum.SideNav,
                                icon: 'navigation-pointer-01',
                            },
                            {
                                label: TabNamesEnum.Approvals,
                                icon: 'check-tick',
                            },
                        ]}
                        onClick={onUserSelectTab}
                    />
                </Flex>
            </Flex>
            <div>{RenderTabContent(selectedTab)}</div>
        </>
    );
}

export default UserProfileSettings;
