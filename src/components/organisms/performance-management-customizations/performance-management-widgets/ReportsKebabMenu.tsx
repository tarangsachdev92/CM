import React, { useState } from 'react';
import { SideMenu, Icon } from 'konnect-react-components';
import styles from '../PerformanceManagementCustomisations.module.scss';
import SaveAsDraftDialog from '../dialogs/SaveAsDraftDialog';
import SaveAndShareDialog from '../dialogs/SaveAndShareDialog';
import DuplicateReportDialog from '../dialogs/DuplicateReportDialog';
import UpdateReportDialog from '../dialogs/UpdateReportDialog';
import DeleteReportDialog from '../dialogs/DeleteReportDialog';
import { logWarning } from '../../../../utils/helpers';

const options = [
    {
        label: (
            <div className={styles['report-kebab-menu-label']}>
                <Icon name="reverse-left" color="black-color" size="xm" />
                <p style={{ margin: 0 }}>Revert all changes</p>
            </div>
        ),
        value: 'revert-all-changes',
    },
    {
        label: (
            <div className={styles['report-kebab-menu-label']}>
                <Icon name="save-01" color="black-color" size="xm" />
                <p style={{ margin: 0 }}>Save as Draft</p>
            </div>
        ),
        value: 'save-as-draft',
    },
    {
        label: (
            <div className={styles['report-kebab-menu-label']}>
                <Icon name="share-07" color="black-color" size="xm" />
                <p style={{ margin: 0 }}>Save and Share</p>
            </div>
        ),
        value: 'save-and-share',
    },
    {
        label: (
            <div className={styles['report-kebab-menu-label']}>
                <Icon name="copy-04" color="black-color" size="xm" />
                <p style={{ margin: 0 }}>Duplicate</p>
            </div>
        ),
        value: 'duplicate',
    },
    {
        label: (
            <div className={styles['report-kebab-menu-label']}>
                <Icon name="settings-01" color="black-color" size="xm" />
                <p style={{ margin: 0 }}>Report Settings</p>
            </div>
        ),
        value: 'report-settings',
    },
    {
        label: (
            <div className={styles['report-kebab-menu-label']}>
                <Icon name="trash-01" color="black-color" size="xm" />
                <p style={{ margin: 0 }}>Delete Report</p>
            </div>
        ),
        value: 'delete-report',
    },
];

export const ReportsKebabMenu: React.FC = () => {
    const [isSaveAsDraftOpen, setSaveAsDraftOpen] = useState(false);
    const [isSaveAndShareOpen, setSaveAndShareOpen] = useState(false);
    const [isDuplicateOpen, setDuplicateOpen] = useState(false);
    const [isUpdateOpen, setUpdateOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);

    const handleMenuSelect = (option: { label: React.ReactNode; value: string }) => {
        switch (option.value) {
            case 'revert-all-changes':
                //implementation pending
                break;
            case 'save-as-draft':
                setSaveAsDraftOpen(true);
                break;
            case 'save-and-share':
                setSaveAndShareOpen(true);
                break;
            case 'duplicate':
                setDuplicateOpen(true);
                break;
            case 'report-settings':
                setUpdateOpen(true);
                break;
            case 'delete-report':
                setDeleteOpen(true);
                break;
            default:
                logWarning(`No action for option: ${option.value}`);
                break;
        }
    };

    return (
        <>
            <div className={styles['reports-kebab-menu-dropdown']}>
                <SideMenu
                    enhancedMenu
                    action={
                        <div className={styles['report-kebab-icon']}>
                            <Icon name="dots-vertical" color="black-color" />
                        </div>
                    }
                    onOptionSelect={handleMenuSelect}
                    options={options}
                />
            </div>

            <SaveAsDraftDialog
                isOpen={isSaveAsDraftOpen}
                onClose={() => setSaveAsDraftOpen(false)}
            />
            <SaveAndShareDialog
                isOpen={isSaveAndShareOpen}
                onClose={() => setSaveAndShareOpen(false)}
            />
            <DuplicateReportDialog
                isOpen={isDuplicateOpen}
                onClose={() => setDuplicateOpen(false)}
            />
            <UpdateReportDialog isOpen={isUpdateOpen} onClose={() => setUpdateOpen(false)} />
            <DeleteReportDialog isOpen={isDeleteOpen} onClose={() => setDeleteOpen(false)} />
        </>
    );
};

export default ReportsKebabMenu;
