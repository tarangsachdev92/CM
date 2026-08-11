import { useEffect, useState } from 'react';
import { Card, Flex, Skeleton } from 'antd';
import { AccordionGroup, Toast } from 'konnect-react-components';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState, fetchNotificationsAndAlerts } from '../../../store';
import NotificationAlertRuleCard from './NotificationAlertRuleCard';
import styles from './UserProfileSettingsNotificationAlertSection.module.scss';
import NotificationAddNewRuleFlyout from './add-new-rule-flyout/NotificationAddNewRuleFlyout';
import { Notification_And_Alert_RuleTypes } from '../../../utils/constants';
import { toggleRuleDetail } from '../../../services/alertnotificationRules';
import { useIsGuestUser } from '../../../utils/customHooks';

function UserProfileSettingsNotificationAlertSection() {
    const dispatch = useDispatch<AppDispatch>();

    const { data: notificationsAndAlerts, isLoading } = useSelector(
        (state: RootState) => state.notificationsAndAlerts,
    );

    const [addRuleFlyoutOpen, setAddRuleFlyoutOpen] = useState<boolean>(false);
    const [selectedRuleId, setSelectedRuleId] = useState<number>(0);
    const [toggleToast, setToggleToast] = useState<boolean>(false);
    const [deleteToast, setDeleteToast] = useState<boolean>(false);
    const [showLoader, setShowLoader] = useState<boolean>(false);
    const [deletedRuleTitle, setdeletedRuleTitle] = useState<string>('');
    const isGuestUser = useIsGuestUser();
    const [lastOperatedRuleType, setLastOperatedRuleType] = useState<number>(0);

    useEffect(() => {
        dispatch(fetchNotificationsAndAlerts());
    }, []);

    //refresh the page on close of flyout
    useEffect(() => {
        if (!addRuleFlyoutOpen) {
            dispatch(fetchNotificationsAndAlerts());
        }
    }, [addRuleFlyoutOpen]);

    const getTemplateForAccordian = () => {
        if (!notificationsAndAlerts.length) {
            return (
                <div className={styles['notification-card-label']}>
                    Setup customised notifications for yourself.
                </div>
            );
        }
        return (
            <AccordionGroup
                accordions={getDataForAccordionGroup()}
                gap={1}
                className={styles['accordion-group-custom']}
            />
        );
    };

    const handleRuleEdit = (ruleId: number) => {
        setSelectedRuleId(ruleId);
        setAddRuleFlyoutOpen(true);
    };

    const showToastOnRuleDelete = (ruleTitle: string) => {
        setDeleteToast(true);
        setdeletedRuleTitle(ruleTitle);
    };

    const getDataForAccordionGroup = () => {
        return notificationsAndAlerts.map(value => {
            const rules =
                value.ruleTypeId === Notification_And_Alert_RuleTypes['KPI']
                    ? value.kpiRule
                    : value.otherTypeRule;
            return {
                children: rules?.map(rule => (
                    <NotificationAlertRuleCard
                        key={rule.ruleId}
                        {...rule}
                        ruleTypeId={value.ruleTypeId}
                        onChangeHandlerOfRule={onChangeHandlerOfRule}
                        handleEditRule={handleRuleEdit}
                        showToastOnSuccess={(ruleTitle: string) =>
                            showToastOnRuleDelete(
                                `${value.ruleType} Rule deleted for '${ruleTitle}'`,
                            )
                        }
                    />
                )),
                outlined: true,
                title: `${value.ruleType} Rules (${value.ruleCount})`,
                isExpanded: value.ruleTypeId === lastOperatedRuleType,
            };
        });
    };

    const onChangeHandlerOfRule = (_isChecked: boolean, ruleId: number) => {
        toggleActiveStatusOfRule(ruleId);
    };

    const toggleActiveStatusOfRule = async (ruleId: number) => {
        try {
            setShowLoader(true);
            const response = await toggleRuleDetail(ruleId);
            if (response.statusCode === 200) {
                setToggleToast(true);
                dispatch(fetchNotificationsAndAlerts());
            }
        } catch (error) {
            alert(error);
        } finally {
            setShowLoader(false);
        }
    };

    return (
        <>
            <NotificationAddNewRuleFlyout
                flyoutOpen={addRuleFlyoutOpen}
                handleFlyoutOpen={setAddRuleFlyoutOpen}
                ruleId={selectedRuleId}
                setLastOperatedRule={setLastOperatedRuleType}
            />

            <Card className={styles['user-profile-settings-card']}>
                <Flex
                    justify="space-between"
                    className={styles['user-profile-settings-card-notification-heading']}
                >
                    <div className={styles['notification-card-title']}>My Notifications</div>
                    <button
                        type="button"
                        className={`${isGuestUser ? styles['text-only-button-disabled'] : styles['text-only-button']} `}
                        onClick={() => {
                            setSelectedRuleId(0);
                            setAddRuleFlyoutOpen(true);
                        }}
                        disabled={isGuestUser}
                    >
                        <div>+ Add Rule</div>
                    </button>
                </Flex>
                {isLoading || showLoader ? (
                    <Skeleton active paragraph={{ rows: 10, width: '100%' }} />
                ) : (
                    getTemplateForAccordian()
                )}
            </Card>

            <Toast
                toggle={toggleToast}
                type="Success"
                message="Rule toggled successfully"
                mode="Top Right"
                distance="x5l"
                onCloseToast={() => setToggleToast(false)}
                timer={5000}
            />
            <Toast
                toggle={deleteToast}
                type="Delete"
                message={deletedRuleTitle}
                mode="Top Right"
                distance="x5l"
                onCloseToast={() => setDeleteToast(false)}
                timer={5000}
            />
        </>
    );
}

export default UserProfileSettingsNotificationAlertSection;
