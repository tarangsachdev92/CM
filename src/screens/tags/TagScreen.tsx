import { useState } from 'react';
import { Flex } from 'antd';
import { BackArrowIcon } from '../../assets/icons/icons';
import { Link } from 'react-router-dom';
import { Label } from '../../components/atoms';
import styles from './TagScreen.module.scss';
import { AnimatedButton } from 'konnect-react-components';
import TagTable from '../../components/organisms/tags/TagTable';
import AddNewTagFlyout from '../../components/organisms/add-new-tag/AddNewTagFlyout';

const TagScreen = () => {
    const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
    const [refreshTags, setRefreshTags] = useState(false);
    const [newlyAddedTagCategoryId, setNewlyAddedTagCategoryId] = useState<null | number>(null);

    const handleTagAdded = (addedTagCategoryId: number) => {
        // Refresh the Tags Table whenever new tag is added or existing tag is edited
        setRefreshTags(!refreshTags);
        // Set the newly added tag category in the state
        setNewlyAddedTagCategoryId(addedTagCategoryId);
        setIsFlyoutOpen(false);
    };

    const onClickHandlerForFlyoutCancelIcon = () => {
        // Set the newly added tag category as NULL on click of close flyout
        setNewlyAddedTagCategoryId(null);
        setIsFlyoutOpen(false);
    };

    return (
        <>
            <Flex vertical gap={24}>
                <Flex vertical gap={8} className={styles['tag-title']}>
                    <Flex align="center" gap={8} justify="space-between">
                        <Flex align="flex-start" gap={16}>
                            <div className={styles['header-back-button']}>
                                <Link to="/admin-hub">{BackArrowIcon(8, 12)}</Link>
                            </div>
                            <Flex justify="flex-start" vertical gap={8}>
                                <Label type="h2">
                                    <span className={styles['tag-heading']}>Tags</span>
                                </Label>
                                <Label type="body2">
                                    <span className={styles['tag-description']}>
                                        Control all the tags across Command Center that feed into
                                        all modules{' '}
                                    </span>
                                </Label>
                            </Flex>
                        </Flex>
                        <Flex className={styles['add-role-button-container']}>
                            <AnimatedButton
                                icon="plus"
                                id="tag-add-role-button"
                                onClick={() => {
                                    setIsFlyoutOpen(true);
                                    setNewlyAddedTagCategoryId(null);
                                }}
                                size="M"
                                text="Add New Tag"
                            />
                        </Flex>
                    </Flex>
                </Flex>
                <div>
                    <TagTable
                        refreshTags={refreshTags}
                        newlyAddedTagCategoryId={newlyAddedTagCategoryId}
                        setNewlyAddedTagCategoryId={setNewlyAddedTagCategoryId}
                    />
                </div>
            </Flex>
            <AddNewTagFlyout
                isFlyoutOpen={isFlyoutOpen}
                onClickHandlerForFlyoutCancelIcon={onClickHandlerForFlyoutCancelIcon}
                onTagAdded={handleTagAdded}
            />
        </>
    );
};
export default TagScreen;
