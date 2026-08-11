import React, { useState } from 'react';
import styles from './ChatbotPromptGuide.module.scss';
import { Icon, IconButton } from 'konnect-react-components';
import { IconsChatBot, PromptGuidelines } from './ChatUtils';
import { Label } from '../../atoms';
import { Flex } from 'antd';
import ExpandableForm from '../expandable-form/ExpandableForm';


type Props = {
    onCloseClick: (open: boolean) => void;
    fullScreen: boolean
    showHistory: boolean
};

type PromptGuidelines = {
    id: number,
    title: string,
    icon: string,
    guidelines: string[]
    isOpen: boolean
}

const ChatbotPromptGuide: React.FC<Props> = ({
    onCloseClick,
    fullScreen,
    showHistory
}) => {
    const [promptGuidelines, setPromptGuidelines] = useState<PromptGuidelines[]>(PromptGuidelines)

    const getFullScreenOverlayWidth = () => showHistory ? { width: '95%', left: "6.5%"} : { width: '100%', left: 0 }

    return (
        <div style={fullScreen ? getFullScreenOverlayWidth() : { width: '100%' }} className={styles['overlay']}>
            <div style={fullScreen ? { width: '500px' } : { width: '80%' }} className={styles['mainContainer']}>
                <div className={styles['headerContainer']}>
                    <div className={styles['header']}>
                        <Icon size='xm' name='color-star01' />
                        <div className={styles['headerTitle']}>Prompt Guide</div>
                    </div>
                    <IconButton icon="x-close" onClick={() => { onCloseClick(false) }} size="Small" />
                </div>
                {promptGuidelines.map((item: PromptGuidelines) =>
                    <ExpandableForm
                        customStyle={item.isOpen ? styles['content-container-selected'] : styles['content-container-deselected']}
                        description=''
                        onClick={() => {
                            const promptGuidelinesTemp = promptGuidelines.map(itm => {
                                if (item.id === itm.id) {
                                    itm.isOpen = !itm.isOpen
                                }
                                return itm
                            })
                            setPromptGuidelines(promptGuidelinesTemp)
                        }}
                        key={item.id}
                        title={<Flex
                            gap={5}
                            align="center"
                        >
                            <Icon size='xm' name={item.icon as IconsChatBot} color={'neutrals-B800'}/>
                            <span
                                className={
                                    styles['customTitleStyle']
                                }
                            >
                                {item?.title}
                            </span>
                        </Flex>}
                        isOpen={item.isOpen}
                        content={<Flex vertical gap={12}>
                            {item.guidelines.map((guidelineItem) =>
                                <div className={styles['guidelineRow']} key={guidelineItem}>
                                    <Label type="body3">
                                        <span className={styles['placeholder-text']}>
                                            {guidelineItem}
                                        </span>
                                    </Label>
                                </div>)}
                        </Flex>}
                        additionalContentInTitleContainer={
                            <div
                                className={
                                    styles[
                                    'role-based-card-additional-container'
                                    ]
                                }
                            >

                                <Icon
                                    name={
                                        item.isOpen
                                            ? 'chevron-up'
                                            : 'chevron-down'
                                    }
                                    size="l"
                                    color="neutrals-B800"
                                />
                            </div>
                        }
                    />
                )}
            </div>
        </div>
    );
};

export default ChatbotPromptGuide;