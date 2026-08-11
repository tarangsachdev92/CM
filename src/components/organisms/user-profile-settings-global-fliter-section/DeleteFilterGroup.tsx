// DeleteFilterGroup.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { deleteFilterGroup } from '../../../services/users';
import { fetchFilterGroupDetails } from '../../../store/thunks/fetchFilterGroupDetails';
import { Toast, Dialog } from 'konnect-react-components';
import { AppDispatch } from '../../../store';
import Styles from './UserProfileSettingsGlobalFilters.module.scss';

interface DeleteFilterGroupProps {
    isOpen: boolean;
    onClose: () => void;
    filterName: string;
    filterId: number | null;
}

const DeleteFilterGroup: React.FC<DeleteFilterGroupProps> = ({
    isOpen,
    onClose,
    filterName,
    filterId,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [toastConfig, setToastConfig] = React.useState({
        visible: false,
        message: '',
        type: 'Error' as 'Error' | 'Success' | 'Delete',
    });
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDelete = async () => {
        if (filterId) {
            try {
                setIsDeleting(true);
                await deleteFilterGroup(filterId);
                await dispatch(fetchFilterGroupDetails());
                setToastConfig({
                    visible: true,
                    message: `Filter Group ${filterName} deleted.`,
                    type: 'Delete',
                });
                setIsDeleting(false);
            } catch {
                setToastConfig({
                    visible: true,
                    message: `Failed to delete ${filterName}.`,
                    type: 'Error',
                });
                setIsDeleting(false);
            }
        }
        onClose(); // Close the dialog after the operation
    };

    return (
        <>
            <Dialog
                content={`Are you sure you want to delete "${filterName}"?`}
                isOpen={isOpen}
                onClose={onClose}
                onPrimaryButtonClick={handleDelete}
                onSecondaryButtonClick={onClose}
                primaryButtonText="Delete"
                secondaryButtonText="Don't Delete"
                title="Confirm Deletion"
                loading ={isDeleting}
            />
            {toastConfig.visible && (
                <Toast
                    distance="x5l"
                    message={toastConfig.message}
                    mode="Top Right"
                    onCloseToast={() => setToastConfig({ ...toastConfig, visible: false })}
                    toggle
                    type={toastConfig.type}
                    timer={3000}
                    className={Styles['toast-configuration']}
                />
            )}
        </>
    );
};

export default DeleteFilterGroup;
