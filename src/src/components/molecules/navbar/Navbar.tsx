import { Avatar, Flex, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router';
import { AppDispatch, fetchPrimaryRole, RootState } from '../../../store';
import { NAVBAR_ITEMS } from '../../../utils/constants';
import { getCurrentUserFullName, getUserNameInitials } from '../../../utils/helpers';
import { Label } from '../../atoms';
import styles from './Navbar.module.scss';
import { useTranslation } from 'react-i18next';
import { EditLayoutIcon } from '../../../assets/icons/icons';
import { ButtonBase } from '@mui/material';

function Navbar() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [showLayout, setShowLayout] = useState<boolean>(true);

    useEffect(() => {
        dispatch(fetchPrimaryRole());
    }, [dispatch]);

    const userRole = useSelector((state: RootState) => state.primaryRole.data);

    const formatUserRole = (role: typeof userRole): JSX.Element => {
        const levelAndRole =
            role.role?.toLowerCase() === 'guest user'
                ? 'Guest User'
                : `${role.roleLevel ?? ''} - ${role.role ?? ''}`;

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

    const { t } = useTranslation('user-home-translation');

    function onClickHandlerForNavbarItem(navigation: string) {
        if (navigation === '/home' || navigation === '/my-dashboard') {
            setShowLayout(true);
        } else {
            setShowLayout(false);
        }
    }

    const profilePicture = useSelector((state: RootState) => state.profilePicture.imageUrl);

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
                    {NAVBAR_ITEMS.map(item => {
                        const isDisabled = false;
                        // (item.id === 6 && item.link === '') || ![1,2, 3, 4, 5].includes(item.id);

                        return (
                            <NavLink
                                id="navbar-nav-link"
                                key={item.id}
                                to={item.link}
                                className={({ isActive }) =>
                                    isActive ? styles['active'] : styles['inactive']
                                }
                                onClick={() => onClickHandlerForNavbarItem(item.link)}
                                style={isDisabled ? { pointerEvents: 'none', color: 'gray' } : {}}
                            >
                                {item.value !== '' ? t(item.value) : item.label}
                            </NavLink>
                        );
                    })}
                    {showLayout && (
                        <ButtonBase
                            onClick={() => {
                                navigate('/edit-layout');
                            }}
                        >
                            <EditLayoutIcon />
                        </ButtonBase>
                    )}
                </Flex>
            </Flex>
        </div>
    );
}

export default Navbar;
