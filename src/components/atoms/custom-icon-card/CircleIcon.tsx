import { Avatar } from 'antd';
import { Icon } from 'konnect-react-components';
import '../../../assets/css/colors.scss';

const CircleIcon = ({
    givenSize = 50,
    givenBackgroundColor = '#00b097',
    iconName = 'globe-01',
}) => {
    return (
        <Avatar
            size={givenSize}
            icon={<Icon color="white-color" name={iconName as any} size="xl" />}
            style={{
                backgroundColor: givenBackgroundColor,
                color: 'white',
                //border: '2px dashed purple',
            }}
        />
    );
};

export default CircleIcon;
