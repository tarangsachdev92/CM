import { AnimatedLoaders } from 'konnect-react-components';
import React, { Suspense } from 'react';
import styles from './IssueManagaement.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Flex } from 'antd';
import { ModuleTypeForIssueAndExceptionManagement } from "../../utils/constants";

type IssuesScreenProps = {
  issueSourceType: number; // 1 or 2
};

const IssueMfe = React.lazy(() => import('issueManagement/App'));

function IssuesScreen({ issueSourceType }: IssuesScreenProps) {
    const globalFilters = useSelector((state: RootState) => state.userGlobalFilters.data);

    return (
        <>
            <Flex vertical className={styles['im-container']} gap={24}>
                <Suspense
                    fallback={
                        <div className={styles['overlay']}>
                            <AnimatedLoaders id="lazy-loader" type="page" />
                        </div>
                    }
                >
                    <IssueMfe
                        moduleType={ModuleTypeForIssueAndExceptionManagement.IssueManagement}
                        API_URL={process.env.VITE_ISSUE_MANAGEMENT_BASE_URL}
                        globalFilters={globalFilters}
                         source="command-center" 
                         issueSourceType={issueSourceType}  
                        
                    />
                </Suspense>
            </Flex>
        </>
    );
}

export default IssuesScreen;
