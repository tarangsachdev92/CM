import { Flex } from 'antd';
import { Tab } from 'konnect-react-components';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { BackArrowIcon } from '../../assets/icons/icons';
import { Label } from '../../components/atoms';
import styles from './PermissionManagementScreen.module.scss';
import PermissionManagementTable from '../../components/organisms/permission-management-table/PermissionManagementTable';

enum TabNamesEnum {
    Tools = 'Tools',
    KPI = 'KPI',
}

const PermissionManagementScreen = () => {
    const [selectedTab, setSelectedTab] = useState<string>(TabNamesEnum.Tools);

    const RenderTabContent = useCallback(() => {
        switch (selectedTab) {
            case TabNamesEnum.Tools:
                return <PermissionManagementTable />;
            default:
                return selectedTab;
        }
    }, [selectedTab]);

    const onUserSelectTab = ({ label }: any) => {
        setSelectedTab(label);
    };

    return (
        <Flex vertical gap={24}>
            <Flex vertical gap={8} className={styles['perm-management-title']}>
                <Flex align="center" gap={8} justify="space-between">
                    <Flex align="flex-start" gap={16}>
                        <div className={styles['header-back-button']}>
                            <Link to="/admin-hub">{BackArrowIcon(8, 12)}</Link>
                        </div>
                        <Flex justify="flex-start" vertical gap={8}>
                            <Label type="h2">
                                <span className={styles['perm-management-heading']}>
                                    Permission Management
                                </span>
                            </Label>
                            <Label type="body2">
                                <span className={styles['perm-management-description']}>
                                    Configuration of tool permissions for all roles on Command
                                    Centre
                                </span>
                            </Label>
                        </Flex>
                    </Flex>
                </Flex>

                <Flex className={styles['tabs-wrapper']}>
                    <Tab
                        items={[
                            {
                                label: TabNamesEnum.Tools,
                                icon: 'code-browser',
                            },
                            {
                                label: TabNamesEnum.KPI,
                                icon: 'file-07',
                                isDisabledTab: true,
                            },
                        ]}
                        onClick={onUserSelectTab}
                    />
                </Flex>
            </Flex>
            <div>{RenderTabContent()}</div>
        </Flex>
    );
};

export default PermissionManagementScreen;
