// src/components/.../UserProfileSettingsDelegationSection.tsx

import { useEffect, useMemo, useState } from 'react';
import { Card } from 'antd';
import { useSelector, useDispatch } from 'react-redux';

import { Label, TextButton } from '../../atoms';
import { PermissionDataEmptyState } from '../../../assets/images/images';
import { RootState, AppDispatch, fetchPrimaryRole, fetchDelegationsNew } from '../../../store';
import styles from './UserProfileSettingsDelegationSection.module.scss';
import { AnimatedLoaders } from 'konnect-react-components';
import DelegationRoleFlyoutNew from '../delegate-role-flyout/DelegationRoleFlyoutNew';
import DelegationTableNew from '../delegation-Table/DelegationTableNew';

function UserProfileSettingsDelegationSectionNew() {
    const dispatch = useDispatch<AppDispatch>();

    const userPrimaryRole = useSelector((state: RootState) => state.userRole.primary);

    const delegationRows = useSelector((state: RootState) => state.delegationNew.data);

    const hasPrimaryRole = Boolean(userPrimaryRole?.role);
    const hasDelegations = delegationRows.length > 0;

    const [showDelegationFlyout, setShowDelegationFlyout] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                // Wait for both to settle before ending the loader
                await Promise.allSettled([
                    dispatch(fetchPrimaryRole() as any),
                    dispatch(fetchDelegationsNew({ pageNumber: 1, pageSize: 10 }) as any),
                ]);
            } finally {
                if (alive) setLoading(false); //  turn off loader only after both finished
            }
        })();
        return () => {
            alive = false;
        };
    }, [dispatch]);

    const loaderComponent = useMemo(() => {
        return loading ? (
            <div>
                <AnimatedLoaders id="lazy-loader" type="page" />
            </div>
        ) : null;
    }, [loading]);

    const renderEmptyState = (title: string, subtitle: string) => (
        <div className={styles['delegation-card-children']}>
            <PermissionDataEmptyState />
            <Label type="h2">
                <span className={styles['delegation-card-children-title']}>{title}</span>
            </Label>
            <Label type="body3">
                <span className={styles['delegation-card-children-label']}>{subtitle}</span>
            </Label>
        </div>
    );

    let cardBody = null;

    if (!hasPrimaryRole) {
        cardBody = renderEmptyState(
            'No roles Added',
            'Setup your primary / secondary roles to start delegating',
        );
    } else if (!hasDelegations) {
        cardBody = renderEmptyState(
            'No Delegations Assigned',
            "To add delegations, click on the 'Delegate Role' button.",
        );
    } else {
        cardBody = (
            <div className={styles['delegation-card-children']}>
                <DelegationTableNew />
            </div>
        );
    }

    return (
        <Card className={styles['user-profile-settings-card']}>
            <div className={styles['delegation-card-header']}>
                <div className={styles['delegation-card-title']}>Delegation History New</div>

                {!loading && (
                    <TextButton
                        onClick={() => setShowDelegationFlyout(true)}
                        disabled={!hasPrimaryRole}
                    >
                        <div
                            className={
                                hasPrimaryRole
                                    ? styles['secondary-role-card-title']
                                    : styles['secondary-role-card-title-disabled']
                            }
                        >
                            + Delegate Role New
                        </div>
                    </TextButton>
                )}
            </div>
            {loading ? loaderComponent : cardBody}

            <DelegationRoleFlyoutNew
                isOpen={showDelegationFlyout}
                isEditModeOn={false}
                onCancelClick={() => setShowDelegationFlyout(false)}
                isAddingSecondaryRole={showDelegationFlyout}
            />
        </Card>
    );
}

export default UserProfileSettingsDelegationSectionNew;
