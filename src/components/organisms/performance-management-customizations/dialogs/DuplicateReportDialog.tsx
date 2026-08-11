import React, { useState } from 'react';
import { Dialog, SelectBox2, InputField } from 'konnect-react-components';

type DuplicateReportDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    initialName?: string;
    initialLevel?: string;
    initialFrequency?: string;
    initialDescription?: string;
};

const DuplicateReportDialog: React.FC<DuplicateReportDialogProps> = ({
    isOpen,
    onClose,
    initialName = 'Copy of Report1',
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
            action: 'create-duplicate',
            data: {
                reportName,
                reportLevel,
                reportFrequency,
                description,
            },
        };
        alert('Duplicate report has been created.');
        //this payload is required for later implementation & at that time console will be removed
        console.log('[Dialog] Duplicate Report CTA clicked', payload);
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
                    placeholder="Copy of Report1"
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
            iconName="copy-04"
            size="Medium"
            title="Duplicate Report"
            content={content}
            primaryButtonText="Create Duplicate"
            onPrimaryButtonClick={handlePrimary}
            data-testid="duplicate-report-dialog"
            id="duplicate-report-dialog"
            centerActions={false}
        />
    );
};

export default DuplicateReportDialog;
