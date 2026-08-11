import { useState, useEffect } from 'react';
import { CheckBox, Dialog, IconButton, Toast } from 'konnect-react-components';
import { Flex } from 'antd';
import styles from './UserProfileSettingsNotificationAlertSection.module.scss';
import { Notification_And_Alert_RuleTypes } from '../../../utils/constants';
import type { INotificationsAndAlerts, TNotificationAlertRules } from '../../../types/response';
import { deleteRuleById } from '../../../services/alertnotificationRules';
import { AppDispatch, fetchNotificationsAndAlerts } from '../../../store';
import { useDispatch } from 'react-redux';
import { logError } from '../../../utils/helpers';

interface NotificationAlertRuleCardProps extends TNotificationAlertRules {
    ruleTypeId: INotificationsAndAlerts['ruleTypeId'];
    onChangeHandlerOfRule: (isChecked: boolean, ruleId: number) => void;
    handleEditRule: (ruleId: number) => void;
    showToastOnSuccess: (ruleTitle: string) => void;
}

function NotificationAlertRuleCard({
    ruleTypeId,
    ruleId,
    kpiName,
    dimensions,
    notificationsCount,
    warningsCount,
    alertsCount,
    isEnabled,
    onChangeHandlerOfRule,
    handleEditRule,
    showToastOnSuccess,
}: Readonly<NotificationAlertRuleCardProps>) {
    const dispatch = useDispatch<AppDispatch>();

    const [showActionIcons, setShowActionIcons] = useState(false);
    const [showDeletePopup, setshowDeletePopup] = useState(false);
    const [toggleErrorToast, settoggleErrorToast] = useState(false);
    const [isloading, setisloading] = useState(false);

    const displayActionIcons = (e: any) => {
        e.preventDefault();
        setShowActionIcons(true);
    };

    const hideActionIcons = (e: any) => {
        e.preventDefault();
        setShowActionIcons(false);
    };

    const handlerForRuleEdit = (ruleId: number) => {
        handleEditRule(ruleId);
    };

    const getRuleTitle = () => {
        if (ruleTypeId === Notification_And_Alert_RuleTypes['KPI']) {
            return kpiName;
        } else {
            const geography = dimensions.Geography?.split(',')
                .map((g: string) => g.split('-').at(-1))
                .join(',');
            const nonGeograpgy = Object.entries(dimensions)
                .filter(([key]) => key !== 'Geography')
                .map(([, value]) => value)
                .join(' | ');
            const otherRuleTitle =
                geography +
                (nonGeograpgy && nonGeograpgy.toString() != '' ? ' | ' + nonGeograpgy : '');
            return otherRuleTitle;
        }
    };

    const handlerForRuleDelete = async (ruleId: number) => {
        try {
            setisloading(true);
            const ruleTitle = getRuleTitle();
            const response = await deleteRuleById(ruleId);
            if (response.statusCode == 200) {
                showToastOnSuccess(ruleTitle ?? '');
                setshowDeletePopup(false);
                dispatch(fetchNotificationsAndAlerts());
            } else {
                settoggleErrorToast(true);
                setshowDeletePopup(false);
            }
            setisloading(false);
        } catch (error) {
            logError(error);
            setisloading(false);
            settoggleErrorToast(true);
        }
    };

    useEffect(() => {
        // Remove the mouse event listeners on component unmount
        return () => {
            document.removeEventListener('mouseenter', displayActionIcons);
            document.removeEventListener('mouseleave', hideActionIcons);
        };
    });

    return (
        <div
            className={styles['notification-alert-rule-card']}
            onMouseEnter={displayActionIcons}
            onMouseLeave={hideActionIcons}
            role="none"
            onClick={() => {
                handlerForRuleEdit(ruleId);
            }}
        >
            <Flex justify="space-between" align="center" style={{ marginBottom: '8px' }}>
                <Flex gap={8} justify="flex-start" align="center">
                    <CheckBox
                        checked={isEnabled}
                        onChange={checked => {
                            onChangeHandlerOfRule(checked, ruleId);
                        }}
                    />
                    <span className={styles['notification-alert-rule-typography']}>
                        {getRuleTitle()}
                    </span>
                </Flex>
                <Flex gap={8}>
                    {showActionIcons && (
                        <>
                            <IconButton
                                icon="edit-02"
                                size="Tiny"
                                onClick={() => {
                                    handlerForRuleEdit(ruleId);
                                }}
                            />
                            <IconButton
                                icon="trash-01"
                                size="Tiny"
                                onClick={() => {
                                    setshowDeletePopup(true);
                                }}
                            />
                        </>
                    )}
                </Flex>
            </Flex>
            <Flex gap={8} justify="flex-start" align="center">
                <div className={styles['notification-alert-typography']}>
                    <Flex gap={4}>
                        <span>Notice</span>
                        <span className={styles['notification-alert-count']}>
                            {notificationsCount}
                        </span>
                    </Flex>
                </div>{' '}
                <span className={styles['vertical-divider']}>|</span>{' '}
                <div className={styles['notification-alert-typography']}>
                    <Flex gap={4}>
                        <span>Warnings</span>
                        <span className={styles['notification-alert-count']}>{warningsCount}</span>
                    </Flex>
                </div>{' '}
                <span className={styles['vertical-divider']}>|</span>{' '}
                <div className={styles['notification-alert-typography']}>
                    <Flex gap={4}>
                        <span>Alerts</span>
                        <span className={styles['notification-alert-count']}>{alertsCount}</span>
                    </Flex>
                </div>
            </Flex>

            <Dialog
                content="Are you sure you want to delete this rule? All notifications and alerts related to the rule will be removed."
                isOpen={showDeletePopup}
                onClose={() => {
                    setshowDeletePopup(false);
                }}
                onPrimaryButtonClick={() => {
                    handlerForRuleDelete(ruleId);
                }}
                onSecondaryButtonClick={() => {
                    setshowDeletePopup(false);
                }}
                primaryButtonText="Delete Rule"
                secondaryButtonText="Don’t Delete"
                title="Confirm Deletetion"
                loading={isloading}
            />

            <Toast
                distance="l"
                message="Error Occured. Please try again."
                mode="Top Right"
                onCloseToast={() => {
                    settoggleErrorToast(false);
                }}
                title="Warning"
                toggle={toggleErrorToast}
                type="Warning"
                timer={3000}
            />
        </div>
    );
}

export default NotificationAlertRuleCard;
