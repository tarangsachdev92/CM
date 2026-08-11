import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Flex } from 'antd';
import { Button, Flyout, Switch } from 'konnect-react-components';
import styles from './HighlightSummaryWidget.module.scss';

type HighlightSummaryLayoutConfig = {
    showSectionTitles: boolean;
    sectionsPerRow: number;
};

type HighlightSummaryEditFlyoutProps = {
    isOpen: boolean;
    onClose: () => void;
    preview?: React.ReactNode;
    layout: HighlightSummaryLayoutConfig;
    defaultLayout: HighlightSummaryLayoutConfig;
    sectionCount: number;
    onLiveUpdate: (layout: HighlightSummaryLayoutConfig) => void;
    onSave: (layout: HighlightSummaryLayoutConfig) => void;
};

const FLYOUT_ID = 'highlight-summary-setup-flyout';

const HighlightSummaryEditFlyout: React.FC<HighlightSummaryEditFlyoutProps> = ({
    isOpen,
    onClose,
    preview,
    layout,
    defaultLayout,
    sectionCount,
    onLiveUpdate,
    onSave,
}) => {
    const [localLayout, setLocalLayout] = useState<HighlightSummaryLayoutConfig>(layout);

    useEffect(() => {
        if (isOpen) {
            setLocalLayout(layout);
        }
    }, [isOpen, layout]);

    const sectionPerRowOptions = useMemo(
        () => Array.from({ length: Math.min(4, Math.max(sectionCount, 1)) }, (_, index) => index + 1),
        [sectionCount],
    );

    const updateLayout = useCallback(
        (nextLayout: HighlightSummaryLayoutConfig) => {
            setLocalLayout(nextLayout);
            onLiveUpdate(nextLayout);
        },
        [onLiveUpdate],
    );

    const handleReset = useCallback(() => {
        updateLayout(defaultLayout);
    }, [defaultLayout, updateLayout]);

    const customActions = (
        <div className={styles['highlight-summary-widget__flyout-actions']}>
            <Button variant="Secondary" size="S" text="Reset" onClick={handleReset} />
            <Button
                variant="Primary"
                size="S"
                text="Save Widget"
                onClick={() => onSave(localLayout)}
            />
        </div>
    );

    return (
        <Flex className={styles['highlight-summary-widget__flyout-wrapper']}>
            <Flyout
                heading="Setup your widget"
                dataTestId="highlight-summary-flyout"
                flyoutOpen={isOpen}
                direction="left"
                cancelIconClick={onClose}
                iconForCancel={{ icon: 'x-close', onClick: onClose }}
                className={styles['highlight-summary-widget__flyout-container']}
                id={FLYOUT_ID}
                containerMaxWidth="100%"
                showfooter={false}
                customActions={customActions}
                content={
                    <Flex className={styles['highlight-summary-widget__flyout-layout']}>
                        <Flex
                            className={styles['highlight-summary-widget__flyout-preview-area']}
                            align="flex-start"
                            justify="flex-start"
                        >
                            {preview}
                        </Flex>

                        <Flex
                            vertical
                            className={styles['highlight-summary-widget__flyout-settings-area']}
                            gap={16}
                        >
                            <div className={styles['highlight-summary-widget__setup-panel']}>
                                <span className={styles['highlight-summary-widget__setup-panel-title']}>
                                    Sections Setup
                                </span>

                                <div className={styles['highlight-summary-widget__setup-section']}>
                                    <span className={styles['highlight-summary-widget__setup-section-title']}>
                                        Sections
                                    </span>

                                    <div className={styles['highlight-summary-widget__setup-option']}>
                                        <span>Sections Title</span>
                                        <Switch
                                            checked={localLayout.showSectionTitles}
                                            onToggle={(checked: boolean) =>
                                                updateLayout({
                                                    ...localLayout,
                                                    showSectionTitles: checked,
                                                })
                                            }
                                            position="right"
                                            aria-label="Section Title Toggle"
                                        />
                                    </div>

                                    <div className={styles['highlight-summary-widget__setup-option-stack']}>
                                        <span>Sections per row</span>
                                        <div
                                            className={styles['highlight-summary-widget__segment-group']}
                                            role="group"
                                            aria-label="Sections per row"
                                        >
                                            {sectionPerRowOptions.map(count => (
                                                <button
                                                    key={count}
                                                    type="button"
                                                    className={`${styles['highlight-summary-widget__segment-btn']} ${localLayout.sectionsPerRow === count
                                                        ? styles['highlight-summary-widget__segment-btn--active']
                                                        : ''
                                                        }`}
                                                    onClick={() =>
                                                        updateLayout({
                                                            ...localLayout,
                                                            sectionsPerRow: count,
                                                        })
                                                    }
                                                    aria-label={`Show ${count} sections per row`}
                                                    aria-pressed={localLayout.sectionsPerRow === count}
                                                >
                                                    {count}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Flex>
                    </Flex>
                }
            />
        </Flex>
    );
};

export default HighlightSummaryEditFlyout;