import { useState, useCallback } from 'react';
import { Flex } from 'antd';
import { AnimatedButton, Toast } from 'konnect-react-components';
import { Link } from 'react-router-dom';
import { BackArrowIcon } from '../../../assets/icons/icons';
import Label from '../../atoms/label/Label';
import styles from './ForumsTitle.module.scss';
import AddForumFlyout from '../add-new-forum/AddNewForumFlyout';
import { IForumData } from '../../../types/response';
import ForumsTable from './ForumsTable';

function Forums() {
    const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
    const [isEditFlyoutOpen, setIsEditFlyoutOpen] = useState(false);
    const [selectedForumData, setSelectedForumData] = useState<IForumData | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const [toastConfig, setToastConfig] = useState({
        visible: false,
        message: '',
        type: 'Success' as 'Success' | 'Error' | 'Delete',
    });

    const handleOpenFlyout = () => setIsFlyoutOpen(true);
    const handleCloseFlyout = () => setIsFlyoutOpen(false);

    const triggerToast = useCallback((message: string, type: 'Success' | 'Error' | 'Delete') => {
        setToastConfig(prev => {
            if (prev.visible && prev.message === message && prev.type === type) return prev;
            return { visible: true, message, type };
        });
    }, []);

    const handleAddSuccess = (forumName: string) => {
        setIsFlyoutOpen(false);
        setRefreshKey(prev => prev + 1);
        triggerToast(`Forum ${forumName} added successfully!`, 'Success');
    };

    const handleEditSuccess = () => {
        setIsEditFlyoutOpen(false);
        setRefreshKey(prev => prev + 1);
        triggerToast(`Forum ${selectedForumData?.forumName} updated successfully!`, 'Success');
    };

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
                                    <strong>Forums</strong>
                                </span>
                            </Label>
                            <Label type="body2">
                                <span className={styles['forum-description']}>
                                    Setup all the forums across Kenvue
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

                {isFlyoutOpen && (
                    <AddForumFlyout
                        isOpen={isFlyoutOpen}
                        onCancelClick={handleCloseFlyout}
                        onForumAdded={handleAddSuccess}
                        onToastTrigger={payload => triggerToast(payload.message, payload.type)}
                    />
                )}

                {isEditFlyoutOpen && selectedForumData && (
                    <AddForumFlyout
                        isOpen={isEditFlyoutOpen}
                        onCancelClick={() => setIsEditFlyoutOpen(false)}
                        onForumAdded={handleEditSuccess}
                        mode="edit"
                        prefilledData={selectedForumData}
                        onToastTrigger={payload => triggerToast(payload.message, payload.type)}
                    />
                )}
            </Flex>
             
            <ForumsTable
                key={refreshKey}
                onEditForum={(forum: IForumData) => {
                    setSelectedForumData(forum);
                    setIsEditFlyoutOpen(true);
                }}
                triggerToast={triggerToast}
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

export default Forums;
