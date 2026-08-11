import { Avatar, Flex, Skeleton } from 'antd';
import { getCurrentUserFullName, getUserNameInitials } from '../../../utils/helpers';
import { Label } from '../../atoms';
import styles from './Navbar.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Button } from 'konnect-react-components';

type props = {
    saveHandler: () => void;
    resetHandler: () => void;
    itemCount: number;
    addHandler: () => void;
};

function LayoutNavbar({ saveHandler, resetHandler, itemCount, addHandler }: props) {
    const profilePicture = useSelector((state: RootState) => state.profilePicture.imageUrl);
    const userRole = useSelector((state: RootState) => state.primaryRole.data);

    const formatUserRole = (role: typeof userRole): JSX.Element => {
        const levelAndRole = `${role.roleLevel ?? ''} - ${role.role ?? ''}`;
        const geography = role.roleGeoName ?? '';
        const subFunction = role.subFunction ?? '';
        const department = role.department ?? '';

        return (
            <>
                {levelAndRole}
                <br />
                {`${geography} ${subFunction} ${department}`}
            </>
        );
    };

    return (
        <div className={styles['navbar']}>
            <Flex justify="space-between" align="center" gap={16}>
                <Flex justify="space-between" align="center" gap={16}>
                    {profilePicture ? (
                        <Avatar size={60} src={profilePicture} />
                    ) : (
                        <div className={styles['username-initials']}>{getUserNameInitials()}</div>
                    )}
                    <div>
                        <Label type="h2">
                            <span className={styles['navbar-username']}>
                                {getCurrentUserFullName()}
                            </span>
                        </Label>

                        <Label type="body2">
                            {userRole ? (
                                <span className={styles['navbar-userrole']}>
                                    {formatUserRole(userRole)}
                                </span>
                            ) : (
                                <Skeleton.Node active style={{ height: '0.875rem' }} />
                            )}
                        </Label>
                    </div>
                </Flex>
                <Flex justify="space-between" align="center" gap={16}>
                    <Button text="Add Widget" onClick={addHandler} variant="Secondary" />
                    <Button
                        text="Reset"
                        onClick={resetHandler}
                        variant="Secondary"
                        disabled={itemCount === 0}
                    />
                    <Button text="Save" onClick={saveHandler} variant="Primary" />
                </Flex>
            </Flex>
        </div>
    );
}

export default LayoutNavbar;
