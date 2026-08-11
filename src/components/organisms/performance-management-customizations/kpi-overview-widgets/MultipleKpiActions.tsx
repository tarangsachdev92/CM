import React, { useCallback, useState } from 'react';
import { Dialog, IconButton } from 'konnect-react-components';
import MultipleKpiEditFlyout, { LocalKpiCategory } from './MultipleKpiEditFlyout';
import styles from '../PerformanceManagementCustomisations.module.scss';

type Props = {
    showButtons: boolean;
    preview?: React.ReactNode;
    availableMetrics?: Array<{ label: string; value: string; category?: string }>;
    gridViewEnabled?: boolean;
    tableViewEnabled?: boolean;
    showMTDTarget?: boolean;
    chartEnabled?: boolean;
    chartType?: string;
    trendPeriod?: string;
    projectionsEnabled?: boolean;
    mainValue?: string;
    showMTD?: boolean;
    showQTD?: boolean;
    showYTD?: boolean;
    tabId: number;
    kpiCategories?: LocalKpiCategory[];
    /** Callbacks */
    onLiveUpdate?: (payload: any) => void;
    onSaveConfig?: (payload: any) => void;
    onResetConfig?: () => void;
    onDeleteConfirm?: () => void;
};

const MultipleKpiActions: React.FC<Props> = ({
    showButtons,
    preview,
    availableMetrics,
    gridViewEnabled = true,
    tableViewEnabled = false,
    showMTDTarget = true,
    chartEnabled = true,
    chartType = 'area',
    trendPeriod = '1Y',
    projectionsEnabled = false,
    mainValue = 'MTD',
    showMTD = false,
    showQTD = false,
    showYTD = true,
    tabId,
    kpiCategories,
    onLiveUpdate,
    onSaveConfig,
    onDeleteConfirm,
    onResetConfig,
}) => {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const onEdit = useCallback(() => {
        setIsMenuOpen(false);
        setIsEditOpen(true);
    }, []);
    const onDeleteClick = useCallback(() => setIsDeleteOpen(true), []);
    const onDialogClose = useCallback(() => setIsDeleteOpen(false), []);
    const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);

    const onConfirmDelete = useCallback(() => {
        if (onDeleteConfirm) onDeleteConfirm();
        setIsDeleteOpen(false);
    }, [onDeleteConfirm]);

    return (
        <>
            {(showButtons || isMenuOpen || isEditOpen) && (
                <div className={styles['multiple-kpi-actions-anchor']}>
                    <div className={styles['multiple-kpi-actions-trigger']}>
                        <IconButton
                            icon={isMenuOpen ? 'chevron-down' : 'chevron-up'}
                            size="Small"
                            onClick={toggleMenu}
                        />
                    </div>
                    {isMenuOpen && (
                        <div className={styles['multiple-kpi-actions-menu']}>
                            <IconButton
                                icon="trash-01"
                                size="Small"
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    onDeleteClick();
                                }}
                            />
                            <IconButton icon="edit-02" size="Small" onClick={onEdit} />
                        </div>
                    )}
                </div>
            )}

            {/* 2. DELETE DIALOG */}
            {isDeleteOpen && (
                <Dialog
                    title="Delete Widget"
                    content="Are you sure you want to delete?"
                    isOpen
                    onClose={onDialogClose}
                    onPrimaryButtonClick={onConfirmDelete}
                    onSecondaryButtonClick={onDialogClose}
                    primaryButtonText="Delete"
                    secondaryButtonText="Cancel"
                />
            )}

            {/* 3. FLYOUT: Notice this is OUTSIDE the showButtons condition! */}
            <MultipleKpiEditFlyout
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                preview={preview}
                gridViewEnabled={gridViewEnabled}
                tableViewEnabled={tableViewEnabled}
                showMTDTarget={showMTDTarget}
                chartEnabled={chartEnabled}
                chartType={chartType}
                trendPeriod={trendPeriod}
                projectionsEnabled={projectionsEnabled}
                mainValue={mainValue}
                showMTD={showMTD}
                showQTD={showQTD}
                showYTD={showYTD}
                availableMetrics={availableMetrics}
                kpiCategories={kpiCategories}
                kpiData={{ hasMTD: true, hasQTD: true, hasYTD: true }}
                tabId={tabId}
                onLiveUpdate={(payload) => {
                    if (onLiveUpdate) onLiveUpdate(payload);
                }}
                onSave={(payload) => {
                    if (onSaveConfig) onSaveConfig(payload);
                    setIsEditOpen(false); // Close flyout on save
                }}
                onReset={() => {
                    if (onResetConfig) onResetConfig();
                }}
            />
        </>
    );
};

export default MultipleKpiActions;