import styles from './TextButton.module.scss';

interface ITextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    disabled? : boolean
}

function TextButton({ children, onClick, disabled }: Readonly<ITextButtonProps>) {
    return (
        <button className={styles['text-button']} type="button" onClick={onClick} disabled ={disabled}>
            {children}
        </button>
    );
}

export default TextButton;
