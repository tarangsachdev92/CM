import { Flex } from 'antd';
import { BlackTickMark, UsersBlack } from '../../../assets/icons/icons';
import styles from './CustomSwitch.module.scss';
import Label from '../label/Label';

interface CustomSwitchProps {
    count?: number;
    toggleSwitch: () => void;
    isOn: boolean;
    type: string;
}

const CustomSwitch = ({ count = 0, toggleSwitch, isOn, type = 'users' }: CustomSwitchProps) => {
    return (
        <Flex
            className={`${styles['switch-container']} ${isOn ? styles['switch-on'] : ''} `}
            align="center"
            justify="center"
            gap={8}
            onClick={toggleSwitch}
        >
            {type === 'tick' ? <BlackTickMark /> : <UsersBlack />}
            <Label type="body2">
                <span className={styles['perm-counter']}>{count}</span>
            </Label>
        </Flex>
    );
};

export default CustomSwitch;
