import React from 'react';
import { Dialog } from 'konnect-react-components';

type SaveAndShareDialogProps = {
    isOpen: boolean;
    onClose: () => void;
};

const SaveAndShareDialog: React.FC<SaveAndShareDialogProps> = ({ isOpen, onClose }) => {
    const handlePrimary = () => {
        alert('Report shared with collaborators.');

        onClose();
    };

    const handleSecondary = () => {
        onClose();
    };

    return (
        <Dialog
            size="Small"
            variant="HeaderTitleIcon"
            iconName="share-07"
            isOpen={isOpen}
            title="Save and Share"
            description={null}
            content={
                <p style={{ margin: 0 }}>
                    Share the report with all the collaborators of the forum.
                </p>
            }
            primaryButtonText="Share"
            secondaryButtonText="Continue to edit report"
            onClose={onClose}
            onPrimaryButtonClick={handlePrimary}
            onSecondaryButtonClick={handleSecondary}
            data-testid="save-and-share-dialog"
            id="save-and-share-dialog"
        />
    );
};

export default SaveAndShareDialog;
