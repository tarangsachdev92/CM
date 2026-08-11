import { AppReportCard, SearchInput } from 'konnect-react-components';
import styles from './PerformanceManagement.module.scss';
import { Flex } from 'antd';
import { Label } from '../../atoms';
import { Link } from 'react-router-dom';
import { useState } from 'react';

function PerformanceManagement() {
    const [, setSearchValue] = useState('');

    const handleSearchChange = (event: any) => {
        setSearchValue(event.target.value);
    };

    return (
        <div className={styles['outer-container']}>
            <Flex vertical gap={24}>
                <Flex
                    justify="flex-start"
                    className={styles['admin-console-container']}
                    vertical
                    gap={8}
                >
                    <Label type="h2">
                        <span className={styles['admin-console-header-title']}>
                            Performance Management
                        </span>
                    </Label>
                </Flex>
                <Flex justify="flex-end">
                    <SearchInput
                        menuButton={false}
                        placeholder="Search"
                        className={styles['searchInput-performanceM-page']}
                        onChange={handleSearchChange}
                    />
                </Flex>
                <Flex vertical className={styles['card-section']} gap={24}>
                    <Label type="body1">
                        <span className={styles['card-section-title']}>Standard Reports</span>
                    </Label>
                    <Flex wrap gap={10} className={styles['card-container']}>
                        <Link to="/apps-reports/performance-management/kpi-card">
                            <AppReportCard
                                additionalDescription={
                                    <div>
                                        <div>Owner: Lucas Hal</div>
                                        <div>
                                            <a href="https://example.com">Documentation & Access</a>
                                        </div>
                                    </div>
                                }
                                defaultIcon="circle"
                                defaultIconColor="primary-green-color"
                                selectedIcon="heart"
                                selectedIconColor="secondary-purple-color"
                                showIconOnHover={true}
                                size="Medium"
                                title="Digital Permission Management"
                                type="App"
                                description="Enables smarter decisions through digital performance insights."
                                className={styles['cards']}
                            />
                        </Link>
                        <AppReportCard
                            additionalDescription={
                                <div>
                                    <div>Owner: Lucas Hal</div>
                                    <div>
                                        <a href="https://example.com">Documentation & Access</a>
                                    </div>
                                </div>
                            }
                            defaultIcon="circle"
                            defaultIconColor="primary-green-color"
                            selectedIcon="heart"
                            selectedIconColor="secondary-purple-color"
                            showIconOnHover={true}
                            size="Medium"
                            title="Integrated Performance Management"
                            type="App"
                            description="Access insight, target, and forecast to manage performance across functions."
                            className={styles['cards']}
                        />
                        <AppReportCard
                            additionalDescription={
                                <div>
                                    <div>Owner: Lucas Hal</div>
                                    <div>
                                        <a href="https://example.com">Documentation & Access</a>
                                    </div>
                                </div>
                            }
                            defaultIcon="circle"
                            defaultIconColor="primary-green-color"
                            selectedIcon="heart"
                            selectedIconColor="secondary-purple-color"
                            showIconOnHover={true}
                            size="Medium"
                            title="QHS Performance Review"
                            type="App"
                            description="Monitor progress, adjust targets, and stay ahead with real-time insights."
                            className={styles['cards']}
                        />
                        <AppReportCard
                            additionalDescription={
                                <div>
                                    <div>Owner: Lucas Hal</div>
                                    <div>
                                        <a href="https://example.com">Documentation & Access</a>
                                    </div>
                                </div>
                            }
                            defaultIcon="circle"
                            defaultIconColor="primary-green-color"
                            selectedIcon="heart"
                            selectedIconColor="secondary-purple-color"
                            showIconOnHover={true}
                            size="Medium"
                            title="CRE Performance Review"
                            type="App"
                            description="Monitor progress, adjust targets, and stay ahead with real-time insights."
                            className={styles['cards']}
                        />
                    </Flex>
                </Flex>
            </Flex>
        </div>
    );
}

export default PerformanceManagement;
