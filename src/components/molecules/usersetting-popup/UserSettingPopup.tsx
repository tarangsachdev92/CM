import { useMsal } from '@azure/msal-react';
import { Flex } from 'antd';
import { Button, Dialog } from 'konnect-react-components';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import {
    KareIncidentIcon,
    LeftArrowIcon,
    ProfileSettings,
    SignOut,
} from '../../../assets/icons/icons';
import customAxios from '../../../services/interceptor';
import { AppDispatch, fetchPrimaryRole, fetchUserSecondaryRole, RootState } from '../../../store';
import { ACCCESS_TOKEN_GRAPH, ACCCESS_TOKEN_POWERBI, CURRENT_USER_EMAIL, ROLE_TYPE } from '../../../utils/constants';
import { getCurrentUserFullName } from '../../../utils/helpers';
import { Label } from '../../atoms';
import FeedbackFlyout from './FeedbackFlyout';
import ProfileCard from './ProfileCard';
import styles from './UserSettingPopup.module.scss';

function UserSettingPopup({ closePopup, isOpen }: { closePopup: () => void; isOpen: boolean }) {
    const flyoutRef = useRef<HTMLDivElement>(null);
    const feedbackFlyoutRef = useRef<HTMLDivElement>(null);
    const { instance } = useMsal();
    const [isSignOut, setIsSignOut] = useState<boolean>(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                flyoutRef.current &&
                !flyoutRef.current.contains(event.target as Node) &&
                feedbackFlyoutRef.current &&
                !feedbackFlyoutRef.current.contains(event.target as Node)
            ) {
                closePopup();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, closePopup]);

    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        dispatch(fetchPrimaryRole());
        dispatch(fetchUserSecondaryRole({ roleType: ROLE_TYPE.SECONDARY }));
    }, [dispatch]);

    const userRole = useSelector((state: RootState) => state.primaryRole.data);
    const userSecondaryRoles: string[] = useSelector(
        (state: RootState) => state.primaryRole.data.secondaryRoles ?? [],
    );

    const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            const clickedOutsideMainPopup =
                flyoutRef.current && !flyoutRef.current.contains(target);

            if (isOpen && clickedOutsideMainPopup && !isFlyoutOpen) {
                closePopup();
                setIsFlyoutOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, isFlyoutOpen, closePopup]);

    const handleSignOut = () => {
        sessionStorage.removeItem(CURRENT_USER_EMAIL);
        sessionStorage.removeItem(ACCCESS_TOKEN_GRAPH);
        sessionStorage.removeItem(ACCCESS_TOKEN_POWERBI);
        delete customAxios.defaults.headers.Authorization;
        instance.setActiveAccount(null);
        instance.logoutRedirect({ postLogoutRedirectUri: "/" });
    }

    return (
        <>
            <div className={styles['usersetting-popup-main']}>
                <Flex ref={flyoutRef} className={styles['usersetting-popup-container']} vertical>
                    <div className={styles['header']}>
                        <div className={styles['header-content']}>
                            <div className={styles['header-logo']}></div>
                            <div className={styles['version-text']}>Version {__APP_VERSION__}</div>
                            <div className={styles['close-button']} onClick={closePopup}>
                                {LeftArrowIcon()}
                            </div>
                        </div>
                    </div>
                    <div className={styles['usersetting-card-container']}>
                        {userRole && (
                            <ProfileCard
                                title="Profile Details"
                                primaryRole={userRole?.role}
                                secondaryRoles={userSecondaryRoles}
                                level={userRole?.roleLevel}
                                function={userRole?.function}
                                location={userRole?.region}
                                language="English"
                            />
                        )}
                        <Flex vertical gap={24}>
                            <a
                                href={import.meta.env.VITE_KARE_INCIDENT_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={closePopup}
                                data-testid="kare-raise-incident-link"
                            >
                                <Flex className={styles['profile-options']} gap={8} align="center">
                                    <KareIncidentIcon />
                                    <span className={styles['title']}>KARE : Raise an Incident</span>
                                </Flex>
                            </a>
                            <Link to={'/user-profile-settings'} onClick={closePopup}>
                                <Flex className={styles['profile-options']} gap={8} align='center'>
                                    <ProfileSettings />
                                    <span className={styles['title']}>Settings</span>
                                </Flex>
                            </Link>
                        </Flex>
                    </div>
                    <div className={styles['footer']}>
                        <div className={styles['footer-left']}>
                            <Label type="h2">
                                <span className={styles['usersetting-username']}>
                                    {getCurrentUserFullName()}
                                </span>
                            </Label>
                            <Label type="body2">
                                <span className={styles['usersetting-text']}>
                                    {'Sign out of Command Center?'}
                                </span>
                            </Label>
                        </div>
                        <div className={styles['footer-right']}>
                            <Button
                                icon="power-01"
                                text="Sign Out"
                                onClick={() => setIsSignOut(true)}
                            />
                        </div>
                    </div>
                    <Dialog
                        content={
                            <>
                                <Flex vertical gap={16} align="center">
                                    <SignOut />
                                    <span>
                                        Your session will end and any unsaved changes may be lost. You can log back in at any time.
                                    </span>
                                </Flex>
                            </>
                        }
                        isOpen={isSignOut}
                        onClose={() => { setIsSignOut(false) }}
                        onPrimaryButtonClick={() => { handleSignOut(); }}
                        onSecondaryButtonClick={() => { setIsSignOut(false) }}
                        primaryButtonText="Sign Out"
                        secondaryButtonText="Stay Signed In"
                        title="Sign Out of Command Center?"
                    />
                </Flex>
                <FeedbackFlyout
                    anchorRef={flyoutRef}
                    flyoutRef={feedbackFlyoutRef}
                    isOpen={isFlyoutOpen}
                    onClose={() => setIsFlyoutOpen(false)}
                />
            </div>
        </>
    );
}

export default UserSettingPopup;
