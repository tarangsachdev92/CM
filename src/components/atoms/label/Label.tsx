import { LabelType } from '../../../types/common';
import styles from './Label.module.scss';

function Label({ children, type }: Readonly<LabelType>) {
    return <div className={styles[type]}>{children}</div>;
}

export default Label;
