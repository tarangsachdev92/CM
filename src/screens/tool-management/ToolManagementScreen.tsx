import { Flex } from 'antd';
import { BackArrowIcon } from '../../assets/icons/icons';
import { Link, useNavigate } from 'react-router-dom';
import { Label } from '../../components/atoms';
import styles from './ToolManagementScreen.module.scss';
import { AnimatedButton } from 'konnect-react-components';
import { useCallback, useState } from 'react';
import ToolManagementTable from '../../components/organisms/tool-management-table/ToolManagementTable';
import { formatRefreshText } from '../../utils/helpers';

const ToolManagementScreen = () => {
    const navigate = useNavigate();

    const openAddNewRolePage = useCallback(() => {
        navigate('add-new-tool');
        return true;
    }, []);

    const [lastRefreshDate, setLastRefreshDate] = useState<Date | null>(null);

    const handleRefreshDate = useCallback((date: Date) => {
        setLastRefreshDate(date);
    }, []);

    return (
        <Flex vertical gap={24}>
            <Flex vertical gap={8} className={styles['app-management-title']}>
                <Flex align="center" gap={8} justify="space-between">
                    <Flex align="flex-start" gap={16}>
                        <div className={styles['header-back-button']}>
                            <Link to="/admin-hub">{BackArrowIcon(8, 12)}</Link>
                        </div>
                        <Flex justify="flex-start" vertical gap={8}>
                            <Label type="h2">
                                <span className={styles['app-management-heading']}>
                                    Tool Management
                                </span>
                            </Label>
                            <Label type="body2">
                                <span className={styles['app-management-description']}>
                                    {formatRefreshText(lastRefreshDate)}
                                </span>
                            </Label>
                        </Flex>
                    </Flex>
                    <Flex className={styles['add-role-button-container']}>
                        <AnimatedButton
                            icon="plus"
                            id="app-management-add-role-button"
                            onClick={openAddNewRolePage}
                            size="M"
                            text="Add New Tool"
                        />
                    </Flex>
                </Flex>
            </Flex>
            <div>
                <ToolManagementTable onRefreshDate={handleRefreshDate}/>
            </div>
        </Flex>
    );
};
export default ToolManagementScreen;
