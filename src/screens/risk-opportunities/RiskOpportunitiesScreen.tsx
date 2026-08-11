// import styles from "./RiskOpportunities.module.scss";
// import { ComingSoon, ComingSoonCircle } from '../../assets/images/images';
// import { Card, Label } from '../../components/atoms';
import { Flex } from 'antd';
import { AnimatedLoaders } from 'konnect-react-components';
import React, { Suspense } from 'react';
import styles from '../issue-management/IssueManagaement.module.scss';
import { ModuleTypeForIssueAndExceptionManagement } from "../../utils/constants";

const RoMfe = React.lazy(() => import('riskAndOpportunity/App'));

function RiskScreen() {
    return (
        <Flex vertical className={styles['im-container']} gap={24}>
            <Suspense
                fallback={
                    <div className={styles['overlay']}>
                        <AnimatedLoaders id="lazy-loader" type="page" />
                    </div>
                }
            >
                <RoMfe API_URL={process.env.VITE_RISK_AND_OPPORTUNITY_BASE_URL} 
                    moduleType={ModuleTypeForIssueAndExceptionManagement.ExceptionManagement} 
                />
            </Suspense>
        </Flex>
    );
}

export default RiskScreen;
