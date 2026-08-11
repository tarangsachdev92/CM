import { Flex } from 'antd';
import { AnimatedButton, Tab } from 'konnect-react-components';
import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BackArrowIcon } from '../../../assets/icons/icons';
import Label from '../../atoms/label/Label';
import styles from './RoleManagementTitle.module.scss';
import RoleManagementTable from '../role-management-table/RoleManagementTable';
import UserManagementTable from '../user-management-table/UserManagementTable';
import UserGroupManagementTable from '../user-groups/UserGroupManagementTable';
import AllUserTable from '../role-all-user-table/RoleAllUserTable';
import { formatRefreshText } from '../../../utils/helpers';

enum TabNamesEnum {
    AllRoles = 'All Roles',
    UserGroupsManagement = 'User Groups',
    UserManagement = 'User Management',
    AllUsers = 'All Users',
}

function RoleManagementTitle() {
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState<string>(TabNamesEnum.AllRoles);
    const [lastRefreshDate, setLastRefreshDate] = useState<Date | null>(null);

    const handleRefreshDate = useCallback((date: Date) => {
        setLastRefreshDate(date);
    }, []);

    function RenderTabContent() {
        switch (selectedTab) {
            case TabNamesEnum.AllRoles:
                return <RoleManagementTable onRefreshDate={handleRefreshDate} />;
            case TabNamesEnum.UserGroupsManagement:
                return <UserGroupManagementTable />;
            case TabNamesEnum.UserManagement:
                return <UserManagementTable />;
            case TabNamesEnum.AllUsers:
                return <AllUserTable />;
            default:
                return selectedTab;
        }
    }

    const openAddNewRolePage = useCallback(() => {
        navigate('add-new-role');
        return true;
    }, []);

    const onUserSelectTab = useCallback(({ label }: any) => {
        setSelectedTab(label);
    }, []);

    return (
        <Flex vertical gap={24}>
            <Flex vertical gap={8} className={styles['role-management-title']}>
                <Flex align="center" gap={8} justify="space-between">
                    <Flex align="flex-start" gap={16}>
                        <div className={styles['header-back-button']}>
                            <Link to="/admin-hub">{BackArrowIcon(8, 12)}</Link>
                        </div>
                        <Flex justify="flex-start" vertical gap={8}>
                            <Label type="h2">
                                <span className={styles['role-management-heading']}>
                                    Role Management
                                </span>
                            </Label>
                            <Label type="body2">
                                <span className={styles['role-management-description']}>
                                    {formatRefreshText(lastRefreshDate)}
                                </span>
                            </Label>
                        </Flex>
                    </Flex>
              {selectedTab != TabNamesEnum.UserGroupsManagement && (      <Flex className={styles['add-role-button-container']}>
                        <AnimatedButton
                            icon="plus"
                            id="role-management-add-role-button"
                            onClick={openAddNewRolePage}
                            size="M"
                            text="Add New Role"
                        />
                    </Flex>)}
                </Flex>

                <Flex className={styles['tabs-wrapper']}>
                    <Tab
                        items={[
                            {
                                label: TabNamesEnum.AllRoles,
                                icon: 'users-01',
                            },
                            {
                                label: TabNamesEnum.UserGroupsManagement,
                                icon: 'users-down',
                            },
                            {
                                label: TabNamesEnum.UserManagement,
                                icon: 'users-check',
                            },
                            {
                                label: TabNamesEnum.AllUsers,
                                icon: 'users-check',
                            },
                        ]}
                        onClick={onUserSelectTab}
                    />
                </Flex>
            </Flex>
            <div>{RenderTabContent()}</div>
        </Flex>
    );
}

export default RoleManagementTitle;
