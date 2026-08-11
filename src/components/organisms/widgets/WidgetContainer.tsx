import { Button, IconButton } from 'konnect-react-components';
import styles from './WidgetContainer.module.scss';
import { memo } from 'react';

type Props = {
    title: string;
    onRemove: () => void;
    children: React.ReactNode;
    disableMoveOverlay?: boolean;
    hideControls?: boolean;
};

export const WidgetContainer = memo(({
    onRemove,
    children,
    disableMoveOverlay = false,
    hideControls,
}: Props) => {
    return (
    <>
        {!hideControls && (
            <div className={styles['close-btn']}>
                <IconButton
                    size="Tiny"
                    icon="x-close"
                    onClick={onRemove}
                />
            </div>
       )}

        <div
            className={`${styles['widget-container']} ${
                disableMoveOverlay
                    ? styles['widget-container-no-overlay']
                    : ''
            }`}
        >
            <div className={styles['widget-content']}>
                {children}
            </div>

            {!disableMoveOverlay && (
                <div className={styles['hover-overlay']}>
                    <Button
                        onClick={() => {}}
                        text="Move"
                        icon="move"
                        size="S"
                        variant="Secondary"
                    />
                </div>
            )}
        </div>
    </>
)});
