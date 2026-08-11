import { Col, Row } from 'antd';
import { Link } from 'react-router';
import {
    QuickLinkWidgetHelpAndSupportIcon,
    QuickLinkWidgetSettingsIcon,
    HelpAndSupportIcon,
} from '../../../assets/icons/icons';
import { Card, Label } from '../../atoms';
import styles from './QuickLinkWidget.module.scss';
import { KARE_INCIDENT_LINK, TRAINING_MATERIAL_LINK } from '../../../utils/constants';
import { useTranslation } from 'react-i18next';

function QuickLinkWidget() {
    const { t } = useTranslation('user-home-translation');

    return (
        <Card title={t('quickLinks.title')} style={{ height: '124px' }}>
            <div className={styles['quick-link-widget-children']}>
                <Row>
                    <Col span={12}>
                        <div className={styles['quick-link-widget-card-children-col']}>
                            <QuickLinkWidgetSettingsIcon />
                            <Link to="/user-profile-settings">
                                <Label type="body2">
                                    <span className={styles['quick-link-widget-typography']}>
                                        {t('quickLinks.Settings')}
                                    </span>
                                </Label>
                            </Link>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles['quick-link-widget-card-children-col']}>
                            <QuickLinkWidgetHelpAndSupportIcon />
                            <Link to={TRAINING_MATERIAL_LINK} target="_blank">
                                <Label type="body2">
                                    <span className={styles['quick-link-widget-typography']}>
                                        {t('quickLinks.trainingManual')}
                                    </span>
                                </Label>
                            </Link>
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col span={12}>
                        <div className={styles['quick-link-widget-card-children-col']}>
                            <HelpAndSupportIcon />
                            <Link to={KARE_INCIDENT_LINK} target="_blank">
                                <Label type="body2">
                                    <span className={styles['quick-link-widget-typography']}>
                                        Help & Support
                                    </span>
                                </Label>
                            </Link>
                        </div>
                    </Col>
                </Row>
            </div>
        </Card>
    );
}

export default QuickLinkWidget;
