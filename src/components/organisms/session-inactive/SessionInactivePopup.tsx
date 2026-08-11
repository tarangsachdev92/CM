import { useMsal } from '@azure/msal-react';
import { Dialog } from 'konnect-react-components';
import React, { useEffect, useRef, useState } from 'react';
import { AppDispatch, fetchLastRefreshDate, fetchNotificationTotalCount, } from '../../../store';
import { useDispatch } from 'react-redux';
import style from './SessionInactivePopup.module.scss';
import { logError } from '../../../utils/helpers';

const IDLE_TIMEOUT = 50 * 60 * 1000;
const LOGOUT_TIMEOUT = 10 * 60;

function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

const SessionInactivePopup: React.FC = () => {
    const [showDialog, setShowDialog] = useState(false);
    const [countdown, setCountdown] = useState(LOGOUT_TIMEOUT);
    const [isLoggedOut, setIsLoggedOut] = useState(false);
    const idleTimer = useRef<NodeJS.Timeout | null>(null);
    const countdownTimer = useRef<NodeJS.Timeout | null>(null);
    const startTime = useRef(0);
    const { instance } = useMsal();
    const dispatch = useDispatch<AppDispatch>();

    //Rest idle timer on user activity (only if dialog is not open)
    const resetIdleTimer = () => {
        if (showDialog || isLoggedOut) return;
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(handleIdle, IDLE_TIMEOUT);
    };

    //Handle idle state
    const handleIdle = () => {
        setShowDialog(true);
        setCountdown(LOGOUT_TIMEOUT);
    };

    //start countdown when dialog is shown
    useEffect(() => {
        if (showDialog && !isLoggedOut) {
            startTime.current = Date.now();
            countdownTimer.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
                const remaining = LOGOUT_TIMEOUT - elapsed;
                setCountdown(remaining > 0 ? remaining : 0);
            }, 1000);
        } else {
            if (countdownTimer.current) {
                clearInterval(countdownTimer.current);
                countdownTimer.current = null;
            }
            setCountdown(LOGOUT_TIMEOUT);
        }
        return () => {
            if (countdownTimer.current) {
                clearInterval(countdownTimer.current);
                countdownTimer.current = null;
            }
        };
    }, [showDialog, isLoggedOut]);

    //Handle user becoming active again (when dialog is open)
    const handleActive = async () => {
        try {
            const accounts = instance.getAllAccounts();
            if (accounts.length > 0) {
                await instance.acquireTokenSilent({
                    account: accounts[0],
                    scopes: ['user.read'],
                    forceRefresh: true,
                });
            }
        } catch (err) {
            logError('Token refresh failed:', err);
            await instance.loginRedirect();
        }
        setShowDialog(false);
        setCountdown(LOGOUT_TIMEOUT);
        setIsLoggedOut(false);
        dispatch(fetchNotificationTotalCount());
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(handleIdle, IDLE_TIMEOUT);
    };

    useEffect(() => {
        if (showDialog && countdown <= 0 && !isLoggedOut) {
            setIsLoggedOut(true);
            if (countdownTimer.current) clearInterval(countdownTimer.current);
        }
    }, [countdown, showDialog, isLoggedOut, instance]);

    useEffect(() => {
        const activityEvents = [
            'mousemove',
            'mousedown',
            'keydown',
            'touchstart',
            'scroll',
            'click',
        ];
        activityEvents.forEach(event => window.addEventListener(event, resetIdleTimer));
        resetIdleTimer();
        return () => {
            activityEvents.forEach(event => window.removeEventListener(event, resetIdleTimer));
            if (idleTimer.current) clearTimeout(idleTimer.current);
            if (countdownTimer.current) clearInterval(countdownTimer.current);
        };
    }, []);

    const handleLogin = () => {
        dispatch(fetchLastRefreshDate({ toolId: undefined, isRefreshed: true }));
        window.location.reload();
    };

    return (
        <Dialog
            className={style['dialog-overlay-topmost']}
            content={
                !isLoggedOut && (
                    <div>
                        Remaining time:{' '}
                        <span
                            style={{
                                color: countdown <= 120 ? '#F42F2F' : '#00B097',
                                fontWeight: 600,
                            }}
                        >
                            {formatTime(countdown)}
                        </span>
                    </div>
                )
            }
            description={
                isLoggedOut ? (
                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        Your session has expired due to inactivity for more than 1 Hour. Please
                        login again to continue.
                    </div>
                ) : (
                    <div style={{ marginTop: '10px' }}>
                        You have been inactive for a while now, please click on continue to go back
                        to command centre. You will be automatically logged out of command centre
                        after 1 hours of inactivity.
                    </div>
                )
            }
            isOpen={showDialog}
            onClose={isLoggedOut ? handleLogin : handleActive}
            onPrimaryButtonClick={isLoggedOut ? handleLogin : handleActive}
            primaryButtonText={isLoggedOut ? 'Login' : 'Continue'}
            iconName={isLoggedOut ? 'hour-glass-04' : 'hour-glass-03'}
            title={
                isLoggedOut ? (
                    <span style={{ fontWeight: '600' }}>You've Been Logged Out</span>
                ) : (
                    'Session Inactive'
                )
            }
            variant={isLoggedOut ? 'With Illustration' : 'HeaderTitleIcon'}
            color={isLoggedOut ? 'status-warning-color' : 'black-color'}
            iconsize="x12l"
            showCloseIcon={isLoggedOut ? false : true}
            centerActions={isLoggedOut ? true : false}
        />
    );
};

export default SessionInactivePopup;
