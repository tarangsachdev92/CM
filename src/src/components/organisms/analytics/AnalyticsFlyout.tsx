import {
    AnimatedLoaders,
    Flyout,
} from 'konnect-react-components';
import Flex from 'antd/es/flex';
import { Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

import styles from './AnalyticsFlyout.module.scss';

import { AppDispatch, RootState } from '../../../store';
import {
    AdvForecasting,
    Allocation,
    CasualTree,
    LeftArrowIcon,
    Simulation,
} from '../../../assets/icons/icons';
import { resetSelectedAFToDo } from '../../../store/slice/selectedAFToDoSlice';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    setIsOpen: (open: boolean) => void;
}

const AnalyticsFlyout: React.FC<Props> = ({ isOpen, setIsOpen }) => {
    const { loading, error } = useSelector(
        (state: RootState) => state.exceptionFlyoutIssuesDetails,
    );

    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const flyoutRef = useRef<HTMLDivElement>(null);

    /** ✅ Accordion state */
    const [activeSection, setActiveSection] = useState<string | null>('causal');

    useEffect(() => {
        dispatch(resetSelectedAFToDo());
    }, []);

    const handleCardClick = (path: string) => {
        setIsOpen(false);
        navigate(path);
    };

    const toggleSection = (section: string) => {
        setActiveSection(prev => (prev === section ? null : section));
    };

    const getCustomActionsForFlyout = () => (
        <Flex justify="space-between" align="center" className={styles['custom-action-container']}>
            <span className={styles['header']}>Analytics</span>
            <Tooltip title="Collapse flyout">
                <div className={styles['button']} onClick={() => setIsOpen(false)}>
                    {LeftArrowIcon()}
                </div>
            </Tooltip>
        </Flex>
    );

    /** ✅ Outside click */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <Flyout
            containerMaxWidth="28rem"
            flyoutOpen={isOpen}
            direction="left"
            cancelIconClick={() => setIsOpen(false)}
            heading=""
            flyoutBgColor="#F4F6F7"
            id="advanceforecast-fly-out"
            className={styles['flyout-container-main']}
            customActions={getCustomActionsForFlyout()}
            content={
                <div className={styles['content-container']}>
                    {loading ? (
                        <Flex className={styles['initial-loader-container']}>
                            <AnimatedLoaders id="initial-loader" type="page" />
                        </Flex>
                    ) : error ? (
                        <div className={styles['empty-state-container']}>
                            <span className={styles['empty-text']}>Error</span>
                            <span>{error}</span>
                        </div>
                    ) : (
                        <div className={styles['analytics-wrapper']}>

                            {/* ✅ Causal Analysis */}
                            <div className={styles['section-card']}>
                                <div
                                    className={styles['section-header']}
                                    onClick={() => toggleSection('causal')}
                                >
                                    <Flex align="center" justify="space-between">
                                        <Flex align="center" gap="8px">
                                            <CasualTree />
                                            <span>Causal Analysis</span>
                                        </Flex>
                                        <span>{activeSection === 'causal' ? '▴' : '▾'}</span>
                                    </Flex>
                                </div>

                                {activeSection === 'causal' && (
                                    <div className={styles['sub-items']}>
                                        <div
                                            className={`${styles['sub-item']} ${styles['active']}`}
                                            onClick={() => handleCardClick('/causal-analysis/kpi-tree')}
                                        >
                                            KPI Tree
                                        </div>
                                        <div
                                            className={styles['sub-item']}
                                            onClick={() => handleCardClick('/causal-analysis/network')}
                                        >
                                            Network Analysis
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ✅ Scenario Builder */}
                            <div className={styles['section-card']}>
                                <div
                                    className={styles['section-header']}
                                    onClick={() => toggleSection('scenario')}
                                >
                                    <Flex align="center" justify="space-between">
                                        <Flex align="center" gap="8px">
                                            <Simulation />
                                            <span>Scenario Builder</span>
                                        </Flex>
                                        <span>{activeSection === 'scenario' ? '▴' : '▾'}</span>
                                    </Flex>
                                </div>

                                {activeSection === 'scenario' && (
                                    <div className={styles['sub-items']}>
                                        <div
                                            className={styles['sub-item']}
                                            onClick={() => handleCardClick('/scenario-builder')}
                                        >
                                            Run Simulation
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ✅ Advanced Forecasting */}
                            <div className={styles['section-card']}>
                                <div
                                    className={styles['section-header']}
                                    onClick={() => toggleSection('forecast')}
                                >
                                    <Flex align="center" justify="space-between">
                                        <Flex align="center" gap="8px">
                                            <AdvForecasting />
                                            <span>Advanced Forecasting</span>
                                        </Flex>
                                        <span>{activeSection === 'forecast' ? '▴' : '▾'}</span>
                                    </Flex>
                                </div>

                                {activeSection === 'forecast' && (
                                    <div className={styles['sub-items']}>
                                        <div
                                            className={styles['sub-item']}
                                            onClick={() => handleCardClick('/advanced-forecasting')}
                                        >
                                            Open Forecasting
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ✅ Allocation */}
                            <div className={styles['section-card']}>
                                <div
                                    className={styles['section-header']}
                                    onClick={() => toggleSection('allocation')}
                                >
                                    <Flex align="center" justify="space-between">
                                        <Flex align="center" gap="8px">
                                            <Allocation />
                                            <span>Allocation</span>
                                        </Flex>
                                        <span>{activeSection === 'allocation' ? '▴' : '▾'}</span>
                                    </Flex>
                                </div>

                                {activeSection === 'allocation' && (
                                    <div className={styles['sub-items']}>
                                        <div
                                            className={styles['sub-item']}
                                            onClick={() => handleCardClick('/allocation')}
                                        >
                                            Run Allocation
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>
            }
        />
    );
};

export default AnalyticsFlyout;