import { useCallback, useState } from 'react';
import { Flex } from 'antd';
import { Label } from '../../../atoms';
import { Dialog, IconButton } from 'konnect-react-components';
import { BlankTableState } from '../../../../assets/images/images';
import styles from './TablePlaceHolder.module.scss';

type Props = {
    onDelete?: () => void;
    onEdit?: () => void;
    state: 'empty' | 'invalid';
};

const EmptyTableState = ({ onDelete, onEdit, state }: Props) => {
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
            <BlankTableState />

            {state === 'empty' && (
                <>
                    <Flex vertical align="center" className={styles.labels}>
                        <Label type="body2">No Data Selected</Label>
                        <Label type="body3">
                            Edit setup to customize the data table and populate the visuals
                        </Label>
                    </Flex>

                    {isHovered && (
                        <Flex align="center" justify="center" className={styles.actions}>
                            <IconButton icon="trash-01" size="Small" onClick={onDeleteClick} />
                            <IconButton
                                icon="edit-02"
                                size="Small"
                                onClick={() => (onEdit ? onEdit() : () => {})}
                            />
                        </Flex>
                    )}

                    {isDeleteOpen && (
                        <Dialog
                            title="Delete Widget"
                            content="Are you sure you want to delete the selected widget from your report ?"
                            isOpen
                            onClose={onDialogClose}
                            onPrimaryButtonClick={() => (onDelete ? onDelete() : () => {})}
                            onSecondaryButtonClick={onDialogClose}
                            primaryButtonText="Delete"
                            secondaryButtonText="Continue to edit report"
                        />
                    )}
                </>
            )}

            {state === 'invalid' && (
                <Flex vertical align="center" className={styles.labels}>
                    <Label type="body2">Invalid Selections</Label>
                    <Label type="body3">
                        The selected parameters don’t return any data. Try adjusting your selections
                        to view the table.
                    </Label>
                </Flex>
            )}
        </Flex>
    );
};

export default EmptyTableState;
