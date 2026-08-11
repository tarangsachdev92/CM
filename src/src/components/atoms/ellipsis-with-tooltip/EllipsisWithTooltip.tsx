import { useRef, useState, useEffect } from 'react';
import { Tooltip } from 'antd';
import styles from './EllipsisWithTooltip.module.scss';

interface EllipsisWithTooltipProps {
    text: string;
    onClick?: () => void;
}

function EllipsisWithTooltip({ text, onClick }: Readonly<EllipsisWithTooltipProps>) {
    const textRef = useRef<HTMLDivElement>(null);
    const [isOverflowed, setIsOverflowed] = useState(false);
    useEffect(() => {
        const el = textRef.current;
        if (el) {
            setIsOverflowed(el.scrollWidth > el.clientWidth);
        }
    }, [text]);
    return (
        <Tooltip
            title={text}
            placement="bottom"
            overlayClassName="custom-tooltip"
            open={isOverflowed ? undefined : false}
        >
            <div
                ref={textRef}
                className={`${styles.role} ${styles.roleText}`}
                onClick={onClick}
                role="none"
            >
                {text}
            </div>
        </Tooltip>
    );
}

export default EllipsisWithTooltip;
