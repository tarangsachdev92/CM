import { Fade } from '@mui/material';
import styles from './PromptChip.module.scss'

type props = {
    prompt: string;
    onPromptClick: (prompt: string) => void;
    customStyle?: any;
};

function PromptChip({ prompt, onPromptClick, customStyle }: props) {
    return (
        <Fade in={true} mountOnEnter unmountOnExit>
            <button
                key={prompt}
                className={customStyle || styles.promptChip}
                onClick={() => onPromptClick(prompt)}
            >
                {prompt}
            </button>
        </Fade>
    );
}

export default PromptChip;
