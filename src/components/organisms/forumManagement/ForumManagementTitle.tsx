import { useState, useCallback } from 'react';
import { Flex } from 'antd';
import { AnimatedButton, Toast } from 'konnect-react-components';
import { Link } from 'react-router-dom';
import { BackArrowIcon } from '../../../assets/icons/icons';
import Label from '../../atoms/label/Label';
import styles from './ForumManagementTitle.module.scss';
import { IForumData } from '../../../types/response';
import ForumManagementTable from '../forumManagement/ForumManagementTable';
import { useNavigate } from 'react-router-dom';
import { formatRefreshText } from '../../../utils/helpers';

function ForumManagement() {
     const navigate = useNavigate();
    const [, setSelectedForumData] = useState<IForumData | null>(null);
     const [lastRefreshDate, setLastRefreshDate] = useState<Date | null>(null);

    const handleRefreshDate = useCallback((date: Date) => {
        setLastRefreshDate(date);
    }, []);
    const [toastConfig, setToastConfig] = useState({
        visible: false,
        message: '',
        type: 'Success' as 'Success' | 'Error' | 'Delete',
    });

     const handleOpenFlyout = () => {
  navigate('/admin-hub/forum-management/add-new-forum');
};


    const triggerToast = useCallback((message: string, type: 'Success' | 'Error' | 'Delete') => {
        setToastConfig(prev => {
            if (prev.visible && prev.message === message && prev.type === type) return prev;
            return { visible: true, message, type };
        });
    }, []);
    

    return (
        <Flex vertical gap={24}>
            <Flex vertical gap={8} className={styles['forum-title']}>
                <Flex align="center" gap={8} justify="space-between">
                    <Flex align="flex-start" gap={16}>
                        <div className={styles['header-back-button']}>
                            <Link to="/admin-hub">{BackArrowIcon(8, 12)}</Link>
                        </div>
                        <Flex justify="flex-start" vertical gap={8}>
                            <Label type="h2">
                                <span className={styles['forum-heading']}>
                                    <strong>Forum Management</strong>
                                </span>
                            </Label>
                            <Label type="body2">
                                <span className={styles['forum-description']}>
                                   {formatRefreshText(lastRefreshDate)}
                                </span>
                            </Label>
                        </Flex>
                    </Flex>
                    <AnimatedButton
                        icon="plus"
                        id="forum-add-forum-button"
                        onClick={handleOpenFlyout}
                        size="M"
                        text="Add New Forum"
                    />
                </Flex>                                
            </Flex>

            <ForumManagementTable
                // key={refreshKey}
                onEditForum={(forum: IForumData) => {
                    setSelectedForumData(forum);                    
                }}
                triggerToast={triggerToast}
                onRefreshDate={handleRefreshDate}
            />

            {toastConfig.visible && (
                <Toast
                    distance="x5l"
                    message={toastConfig.message}
                    mode="Top Right"
                    onCloseToast={() => setToastConfig(prev => ({ ...prev, visible: false }))}
                    toggle
                    type={toastConfig.type}
                    timer={5000}
                    className={styles['toast-configuration']}
                />
            )}
        </Flex>
    );
}

export default ForumManagement;
