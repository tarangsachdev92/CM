
import { Flyout, AnimatedLoaders } from 'konnect-react-components';
import React, { Suspense, useState } from 'react';
import { Flex } from 'antd';
import styles from './LogNewIssueScreen.module.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';

// Lazy MFE content (form)
const RiskOpportunityMfe = React.lazy(() => import('riskAndOpportunity/RiskAndOpportunityNew'));

type Props = {
  handleClose: () => void;
  onSubmit: () => void;
  forumDetails?: any[]; // <- pass if you have it
};

export default function LogNewIssueScreen({ handleClose, onSubmit, forumDetails = [] }: Props) {
  const [flyoutOpen, setFlyoutOpen] = useState(true);
  const globalFilters = useSelector((state: RootState) => state.userGlobalFilters.data);

  const close = () => {
    setFlyoutOpen(false);
    handleClose();
  };

  return (
    <div className={styles.container}>
      <Flex vertical className={styles.content}>
        <Suspense
          fallback={
            <div className={styles.overlay}>
              <AnimatedLoaders id="lazy-loader" type="page" />
            </div>
          }
        >
          <Flyout
            style={{ padding: 0, marginTop: '6vh', zIndex: 999 }}
            direction="right"
            flyoutOpen={flyoutOpen}
            heading="Log New"
            subHeading="Log a new exception by entering the below details"
            showfooter={false}
            containerMaxWidth="calc(100% - 60vw)"
            id="risk-and-opportunity-New-fly-out"
            dataTestId="risk-and-opportunity-New-fly-out"
            iconForCancel={{
              icon: 'x-close',
              onClick: () => close(), // IMPORTANT: call setter with boolean
            }}
               cancelIconClick={close}
                 onBackDropClick={close}
            // Provide the MFE content to Flyout
            content={
              <RiskOpportunityMfe
                API_URL={import.meta.env.VITE_RISK_AND_OPPORTUNITY_BASE_URL}
                isOpen={flyoutOpen}
                handleClose={close}
                onSubmit={onSubmit}
                globalFilters={globalFilters}
                forumDetails={forumDetails} // ensure you pass this if you need forumId filtering
              />
            }
          />
        </Suspense>
      </Flex>
    </div>
  );
}
