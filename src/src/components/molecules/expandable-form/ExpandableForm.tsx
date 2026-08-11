import { Label } from '../../atoms';
import { Flex } from 'antd';
import styles from './ExpandableForm.module.scss';

type Props = {
    title: React.ReactNode;
    description: string;
    isOpen: boolean;
    content: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    additionalContentInTitleContainer?: React.ReactNode;
    headerAction?: React.ReactNode
    applyCustomSpacing?: boolean;
    customStyle?: string;
};

function ExpandableForm({
    title,
    description,
    isOpen = false,
    content,
    onClick,
    disabled = false,
    additionalContentInTitleContainer,
    headerAction,
    applyCustomSpacing = false,
    customStyle,
}: Readonly<Props>) {
    return (
        <div
            className={`${customStyle || (!disabled ? styles['content-container'] : styles['content-container-disabled'])} ${
                applyCustomSpacing ? styles['custom-spacing'] : ''
            }`}
        >
            <div
                className={`${styles['content-title-container']} ${
                    applyCustomSpacing ? styles['custom-title-spacing'] : ''
                }`}
            >
                <div className={styles['content-title-left-container']}>
                    <Label type="body2">
                        <span
                            className={                                
                                !disabled ? styles['content-title'] : styles['content-disabled']
                            }
                        >
                            {title}
                        </span>
                    </Label>
                    <div className={styles['space-v-8']} />
                    <Label type="body3">
                        <span
                            className={
                                !disabled
                                    ? styles['content-title-description']
                                    : styles['content-disabled']
                            }
                        >
                            {description}
                        </span>
                    </Label>
                </div>
                <div
                    onClick={!disabled ? onClick : () => null}
                    className={styles['content-title-right-container']}
                >
                    
<Flex align="center" gap="8px">


    {isOpen && headerAction}

    {additionalContentInTitleContainer}

</Flex>

                </div>
            </div>
            <div
                className={`${styles['content-body-container']} ${
                    isOpen ? styles['content-body-container-opened'] : ''
                } ${applyCustomSpacing ? styles['custom-body-spacing'] : ''}`}
            >
                {content}
            </div>
        </div>
    );
}

export default ExpandableForm;
