import React, { useState } from 'react';
import { Dialog, SelectBox2, InputField } from 'konnect-react-components';

type UpdateReportDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    initialName?: string;
    initialLevel?: string;
    initialFrequency?: string;
    initialDescription?: string;
};

const UpdateReportDialog: React.FC<UpdateReportDialogProps> = ({
    isOpen,
    onClose,
    initialName = 'Report 1',
    initialLevel = 'Site',
    initialFrequency = 'Daily',
    initialDescription = 'Analyse the daily performance of your site',
}) => {
    const [reportName, setReportName] = useState(initialName);
    const [reportLevel, setReportLevel] = useState(initialLevel);
    const [reportFrequency, setReportFrequency] = useState(initialFrequency);
    const [description, setDescription] = useState(initialDescription);

    const handlePrimary = () => {
        const payload = {
            action: 'update-report',
            data: {
                reportName,
                reportLevel,
                reportFrequency,
                description,
            },
        };
        alert('Report has been updated.');
        //this payload is required for later implementation & at that time console will be removed
        console.log('[Dialog] Update Report CTA clicked', payload);
        onClose();
    };

    const handleSecondary = () => {
        onClose();
    };

    const content = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>Report Name</div>
                <InputField
                    value={reportName}
                    onChange={e => setReportName(e.target.value)}
                    size="L"
                    placeholder="Report 1"
                />
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>Report Performance Level</div>
                    <SelectBox2
                        options={[
                            'Network',
                            'Region',
                            'Country',
                            'Plant',
                            'Site',
                            'Line',
                            'Work Center',
                            'Team',
                        ]}
                        label={reportLevel}
                        onChange={(val: string) => setReportLevel(val)}
                        showDropdownIcon
                        unassignLabel="Unassign"
                    />
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>Report Frequency</div>
                    <SelectBox2
                        options={['Hourly', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']}
                        label={reportFrequency}
                        onChange={(val: string) => setReportFrequency(val)}
                        showDropdownIcon
                        unassignLabel="Unassign"
                    />
                </div>
            </div>

            <div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>Description</div>
                <InputField
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    size="L"
                    placeholder="Analyse the daily performance of your site"
                />
            </div>
        </div>
    );

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            variant="HeaderTitleIcon"
            iconName="edit-02"
            size="Medium"
            title="Update Report"
            content={content}
            primaryButtonText="Update"
            secondaryButtonText="Continue to Report"
            onPrimaryButtonClick={handlePrimary}
            onSecondaryButtonClick={handleSecondary}
            data-testid="update-report-dialog"
            id="update-report-dialog"
            centerActions={false}
        />
    );
};

export default UpdateReportDialog;
