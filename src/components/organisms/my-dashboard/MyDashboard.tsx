import { MyDashboardEmptyState } from '../../../assets/images/images';
import { Card, Label } from '../../atoms';
import { Link } from 'react-router';
import styles from './MyDashboard.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Flex } from 'antd';
import { useTranslation } from 'react-i18next';

export function MyDashboardFirstTimeLogin() {
    const { t } = useTranslation('user-home-translation');
    return (
        <Flex className={styles['my-dashboard-card-children']} gap={24}>
            <MyDashboardEmptyState />
            <Label type="body3">
                <span className={styles['card-children-content-text']}>
                    {t('kpi.goto')}{' '}
                    <Link
                        to="/user-profile-settings"
                        className={styles['card-children-content-text-anchor']}
                    >
                        {t('kpi.userRoleSettings')}
                    </Link>
                    {''}, {t('kpi.addPrAndSecRole')}
                </span>
            </Label>
        </Flex>
    );
}

export function NoKPIs() {
    const { t } = useTranslation('user-home-translation');

    return (
        <Flex className={styles['my-dashboard-card-children']} gap={24}>
            <MyDashboardEmptyState />
            <Label type="body3">
                <span className={styles['card-children-content-text']}>
                    {t('kpi.noKpi')}
                </span>
            </Label>
        </Flex>
    );
}

function MyDashboard({ cardHeight = '664px' }: Readonly<{ cardHeight?: string }>) {
    const userPrimaryRole = useSelector((state: RootState) => state.userRole.primary);
    const isPrimaryRoleAdded = userPrimaryRole?.isAnyADGroupRequested;   
        
    const { t } = useTranslation('user-home-translation');
        
    return (
        <Card
            title={t('kpi.myKpis')}
            label={ !isPrimaryRoleAdded ? t('kpi.setUpProfile') : t('kpi.trackCommingSoon')}
            style={{ height: cardHeight }}
        >
            {!isPrimaryRoleAdded ? <MyDashboardFirstTimeLogin /> : <NoKPIs />}
        </Card>
    );
}

export default MyDashboard;
