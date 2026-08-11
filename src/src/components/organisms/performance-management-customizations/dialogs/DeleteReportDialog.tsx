import React from 'react';
import { Dialog } from 'konnect-react-components';

type DeleteReportDialogProps = {
    isOpen: boolean;
    onClose: () => void;
};

const DeleteReportDialog: React.FC<DeleteReportDialogProps> = ({ isOpen, onClose }) => {
    const handlePrimary = () => {
        alert('Report deleted from Command Center.');

        onClose();
    };

    const handleSecondary = () => {
        onClose();
    };

    return (
        <Dialog
            size="Small"
            variant="HeaderTitleIcon"
            iconName="trash-01"
            isOpen={isOpen}
            title="Delete Report"
            description={null}
            content={
                <p style={{ margin: 0 }}>
                    Are you sure you want to delete this report from command center? All forum
                    collaborators will lose access to the report once deleted.
                </p>
            }
            primaryButtonText="Delete"
            secondaryButtonText="Continue to edit report"
            onClose={onClose}
            onPrimaryButtonClick={handlePrimary}
            onSecondaryButtonClick={handleSecondary}
            data-testid="delete-report-dialog"
            id="delete-report-dialog"
        />
    );
};

export default DeleteReportDialog;
