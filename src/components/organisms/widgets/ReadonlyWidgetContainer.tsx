import styles from './ReadonlyWidgetContainer.module.scss'

type Props = {
  children: React.ReactNode;
};

export const ReadonlyWidgetContainer = ({ children }: Props) => (
  <div className={styles["readonly-widget"]}>{children}</div>
);
