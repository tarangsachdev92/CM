import { AnimatedLoaders } from 'konnect-react-components';
import React, { Suspense } from 'react';
import styles from './LogNewIssueScreen.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import { Flex } from 'antd';

const LogNewIssueMfe = React.lazy(() => import('issueManagement/issueLogNewFlyout'));
type Props = {
    handleClose: () => void;
    onSubmit: () => void;
};

function LogNewIssueScreen({ handleClose, onSubmit }: Props) {
    const globalFilters = useSelector((state: RootState) => state.userGlobalFilters.data);

    return (
        <>
            <Flex vertical gap={24}>
                <Suspense
                    fallback={
                        <div className={styles['overlay']}>
                            <AnimatedLoaders id="lazy-loader" type="page" />
                        </div>
                    }
                >
                    <LogNewIssueMfe
                        API_URL={process.env.VITE_ISSUE_MANAGEMENT_BASE_URL}
                        isOpen={true}
                        handleClose={handleClose}
                        onSubmit={onSubmit}
                        globalFilters={globalFilters}
                    />
                </Suspense>
            </Flex>
        </>
    );
}

export default LogNewIssueScreen;
