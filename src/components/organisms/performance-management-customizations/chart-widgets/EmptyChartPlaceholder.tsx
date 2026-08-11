import { useCallback, useState } from 'react';
import { Flex } from 'antd';
import { Label } from '../../../atoms';
import { Dialog, IconButton } from 'konnect-react-components';
import styles from './EmptyChartPlaceholder.module.scss';

type Props = {
    icon: React.ReactNode;
    onDelete?: () => void;
    onEdit?: () => void;
    state: 'empty' | 'invalid';
    isLoadedInPreview?: boolean
};

const EmptyChartPlaceholder = ({ icon, onDelete, onEdit, state, isLoadedInPreview = false }: Props) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const onDeleteClick = useCallback(() => setIsDeleteOpen(true), []);
    const onDialogClose = useCallback(() => setIsDeleteOpen(false), []);

    return (
        <Flex
            vertical
            align="center"
            justify="center"
            className={styles.root}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {icon}

            {state === 'empty' && (
                
                <Flex vertical align="center" className={styles.labels}>
                    <Label type="body2">No Data Selected</Label>
                    <Label type="body3">
                        Select edit to customize the chart and populate the visuals
                    </Label>
                </Flex>
            )}

            {state === 'invalid' && (
                <Flex vertical align="center" className={styles.labels}>
                    <Label type="body2">Invalid Selections</Label>
                    <Label type="body3">
                        The selected parameters don’t return any data. Adjust your selections.
                    </Label>
                </Flex>
            )}

            {isHovered && !isLoadedInPreview && (
                <Flex align="center" justify="center" className={styles.actions}>
                    <IconButton icon="trash-01" size="Small" onClick={onDeleteClick} />
                    <IconButton icon="edit-02" size="Small" onClick={() => (onEdit ? onEdit() : () => { })} />
                </Flex>
            )}

            {isDeleteOpen && (
                <Dialog
                    title="Delete Widget"
                    content="Are you sure you want to delete this widget?"
                    isOpen
                    onClose={onDialogClose}
                    onPrimaryButtonClick={() => (onDelete ? onDelete() : () => { })}
                    onSecondaryButtonClick={onDialogClose}
                    primaryButtonText="Delete"
                    secondaryButtonText="Cancel"
                />
            )}
        </Flex>
    );
};

export default EmptyChartPlaceholder;