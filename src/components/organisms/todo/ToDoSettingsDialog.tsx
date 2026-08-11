// ToDoSettingsDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, Icon } from 'konnect-react-components';
import styles from './ToDoSettingsDialog.module.scss';

//  Import the embedded content (no Flyout)
import IgnoredContentPane from './IgnoredContentPane';
import SnoozedContentPane from './SnoozedContentPane';
import FlyoutTaskDetails from './ToDoFlyoutCard/ToDoFlyoutTaskDetails';

type SettingsTab = 'ignored' | 'snooze';

export interface ToDoSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    primaryButtonText?: string;
    secondaryButtonText?: string;
    absolutePosition?: { top: number; left: number };
    radiusPx?: number;
}

const ToDoSettingsDialog: React.FC<ToDoSettingsDialogProps> = ({
    isOpen,
    onClose,
    title = (
        <div className={styles.titleWrap}>
            <Icon name="settings-01" size="xl" aria-label="Settings icon" color="black-color" />
            <span>To‑Do Settings</span>
        </div>
    ),
    primaryButtonText = 'Close',
    secondaryButtonText = 'Cancel',
    absolutePosition,
    radiusPx = 8,
}) => {
    const [tab, setTab] = useState<SettingsTab>('ignored');
    const [isSettingsDetailsOpen, setIsSettingsDetailsOpen] = useState(false);
    const [settingsSelectedId, setSettingsSelectedId] = useState<string>('');

    const [settingsMode, setSettingsMode] = useState<'ignored' | 'snoozed'>('ignored');
    const [settingsTasks, setSettingsTasks] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            setTab('ignored');
        }
    }, [isOpen]);

    const handleOpenSettingsFlyout = (
        todoId: number,
        mode: 'ignored' | 'snoozed',
        tasks: any[],
    ) => {
        setSettingsSelectedId(String(todoId));
        setSettingsMode(mode);
        setSettingsTasks(tasks);
        setIsSettingsDetailsOpen(true);
    };

    const shellInlinePos: React.CSSProperties | undefined =
        absolutePosition && !isSettingsDetailsOpen
            ? { position: 'fixed', top: absolutePosition.top, left: absolutePosition.left }
            : undefined;

    return (
        <>
            <Dialog
                customWidth={650}
                title={title}
                isOpen={isOpen}
                onClose={onClose}
                primaryButtonText={primaryButtonText}
                secondaryButtonText={secondaryButtonText}
                onPrimaryButtonClick={onClose}
                onSecondaryButtonClick={onClose}
                hidePrimaryButton={true}
                hideSecondaryButton={true}
                hideFooter={true}
                content={
                    <div
                        className={styles.shell}
                        style={{ ...shellInlinePos, borderRadius: radiusPx }}
                    >
                        <div className={styles.navButtonsTopRule} />
                        <div className={styles.row}>
                            {/* Left nav */}
                            <nav className={styles.nav}>
                                <button
                                    onClick={() => setTab('ignored')}
                                    aria-pressed={tab === 'ignored'}
                                    className={`${styles.navBtn} ${tab === 'ignored' ? styles.navBtnActive : ''}`}
                                >
                                    Ignored
                                    <Icon color="black-color" name="chevron-right" size="xl" />
                                </button>
                                <button
                                    onClick={() => setTab('snooze')}
                                    aria-pressed={tab === 'snooze'}
                                    className={`${styles.navBtn} ${tab === 'snooze' ? styles.navBtnActive : ''}`}
                                >
                                    Snooze{' '}
                                    <Icon color="black-color" name="chevron-right" size="xl" />
                                </button>
                            </nav>

                            {/* Right pane */}
                            <section className={styles.content} aria-live="polite">
                                {tab === 'ignored' ? (
                                    <IgnoredContentPane
                                        onOpenFlyout={(todoId, tasks) =>
                                            handleOpenSettingsFlyout(todoId, 'ignored', tasks)
                                        }
                                    />
                                ) : (
                                    <SnoozedContentPane
                                        onOpenFlyout={(todoId, tasks) =>
                                            handleOpenSettingsFlyout(todoId, 'snoozed', tasks)
                                        }
                                    />
                                )}
                            </section>
                        </div>
                    </div>
                }
            />
            <FlyoutTaskDetails
                tasks={settingsTasks as any}
                selectedId={settingsSelectedId}
                isOpen={isSettingsDetailsOpen}
                setIsOpen={setIsSettingsDetailsOpen}
                onClose={() => setIsSettingsDetailsOpen(false)}
                onRefresh={() => {}}
                origin={settingsMode === 'snoozed' ? 'settingsSnoozed' : 'settingsIgnored'}
            />
            <style>
                {`
                    #to-do-details-fly-out-o .flyout-body{
                        padding: 0px;
                    }
                `}
            </style>
        </>
    );
};

export default ToDoSettingsDialog;
