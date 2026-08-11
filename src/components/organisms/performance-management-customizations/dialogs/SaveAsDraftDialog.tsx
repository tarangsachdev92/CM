import React from 'react';
import { Dialog } from 'konnect-react-components';

type SaveAsDraftDialogProps = {
    isOpen: boolean;
    onClose: () => void;
};

const SaveAsDraftDialog: React.FC<SaveAsDraftDialogProps> = ({ isOpen, onClose }) => {
    const handlePrimary = () => {
        alert('Report saved as draft.');
        onClose();
    };

    const handleSecondary = () => {
        onClose();
    };

    return (
        <Dialog
            size="Small"
            variant="HeaderTitleIcon"
            iconName="save-01"
            isOpen={isOpen}
            title="Save as Draft"
            description={null}
            content={
                <p style={{ margin: 0 }}>
                    You are saving the report as a draft. The updates on the report will only be
                    visible to you. To share the updates with other collaborators, please click on
                    share.
                </p>
            }
            primaryButtonText="Save as Draft"
            secondaryButtonText="Continue to edit report"
            onClose={onClose}
            onPrimaryButtonClick={handlePrimary}
            onSecondaryButtonClick={handleSecondary}
            data-testid="save-as-draft-dialog"
            id="save-as-draft-dialog"
            showCloseIcon={true}
        />
    );
};

export default SaveAsDraftDialog;
