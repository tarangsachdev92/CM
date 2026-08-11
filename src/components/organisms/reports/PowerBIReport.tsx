import { Flex } from 'antd';
import dayjs from 'dayjs';
import { AnimatedLoaders } from 'konnect-react-components';
import * as powerbi from 'powerbi-client';
import { models } from 'powerbi-client';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { ReportAccessDeniedState } from '../../../assets/images/images';
import { checkUserAccessForReport } from '../../../services/application';
import { RootState } from '../../../store';
import { IReportFilterJSONType } from '../../../types/common';
import { ACCCESS_TOKEN_POWERBI, FORMAT_MONTH_YEAR, ROLE_TYPE } from '../../../utils/constants';
import { getLastMonth, logError } from '../../../utils/helpers';
import { Label } from '../../atoms';
import styles from './PowerBIReport.module.scss';

interface PowerBIReportProps {
    toolId: number;
    filters: IReportFilterJSONType[];
}

function PowerBIReport({ toolId, filters }: PowerBIReportProps) {
    const [embedConfig, setEmbedConfig] = useState<any>(null);
    const reportRef = useRef<any>(null);
    const dateDetails = useSelector((state: RootState) => state.setSelectedCalendar.data);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const roleType = useSelector((state: RootState) => state.primaryRole.data?.roleType);
    const [currentDate, setCurrentDate] = useState<string>('');
    const globalFilters = useSelector((state: RootState) => state.userGlobalFilters.data);
    type JsonObject = { [key: string]: any };
    const { tabName } = useParams();

    useEffect(() => {
        setIsLoading(true);
        setEmbedConfig(null);
        reportRef.current = null;

        const selectedDate = dateDetails
            ? dayjs(
                  getLastMonth(String(dateDetails.month), Number(dateDetails.year)),
                  FORMAT_MONTH_YEAR,
              ).format(filters?.[0]?.dateFormat ?? FORMAT_MONTH_YEAR)
            : dayjs().format(FORMAT_MONTH_YEAR);

        const getEmbedToken = async () => {
            try {
                const response = await checkUserAccessForReport(toolId);

                if (response.hasAccess && roleType !== ROLE_TYPE.GUEST) {
                    setIsAuthorized(true);

                    setCurrentDate(selectedDate);

                    setEmbedConfig({
                        type: 'report',
                        reportId: response.reportId,
                        embedUrl: response.reportEmbedUrl,
                        accessToken: sessionStorage.getItem(ACCCESS_TOKEN_POWERBI),
                        viewMode: models.ViewMode.View,
                        permissions: models.Permissions.All,
                        tokenType: powerbi.models.TokenType.Aad,
                        settings: {
                            panes: {
                                filters: { visible: false },
                                pageNavigation: {
                                    visible: true,
                                    position: 1,
                                },
                            },
                        },
                        bars: {
                            actionBar: {
                                visible: true,
                            },
                        },
                    });
                }
            } catch (error) {
                logError(error)
                setIsAuthorized(false);
            } finally {
                setIsLoading(false);
            }
        };

        getEmbedToken();
    }, [toolId, dateDetails, globalFilters]);

    useEffect(() => {
        if (!embedConfig || !reportRef.current) return;

        const fetchReportDetails = async () => {
            try {
                const powerbiService = new powerbi.service.Service(
                    powerbi.factories.hpmFactory,
                    powerbi.factories.wpmpFactory,
                    powerbi.factories.routerFactory,
                );

                powerbiService.reset(reportRef.current);

                const embedReport: any = {
                    type: embedConfig.type,
                    id: embedConfig.reportId,
                    embedUrl: embedConfig.embedUrl,
                    accessToken: embedConfig.accessToken,
                    tokenType: embedConfig.tokenType,
                    settings: embedConfig.settings,
                };

                const report = powerbiService.embed(
                    reportRef.current,
                    embedReport,
                ) as powerbi.Report;

                reportRef.current.powerBIReport = report;

                report.on('pageChanged', async () => {
                    if (filters && filters.length > 0) {
                        const page = await report.getActivePage();

                        const visuals = await page?.getVisuals();

                        const slicers = visuals.filter(v => v.type === 'slicer');

                        for (const filter of filters) {
                            const values =
                                filter.propertyKey === 'Date'
                                    ? [currentDate]
                                    : findValuesByKey(globalFilters, filter.propertyKey);

                            if (values && values.length > 0) {
                                const slicer = slicers.find(s => s.title === filter.slicerName);
                                if (slicer && slicer.setSlicerState) {
                                    const slicerFilter: models.ISlicerFilter[] = [
                                        {
                                            $schema: 'http://powerbi.com/product/schema#basic',
                                            target: {
                                                table: filter.tableName,
                                                column: filter.columnName,
                                            },
                                            operator: 'In',
                                            values: values,
                                            filterType: models.FilterType.Basic,
                                        },
                                    ];

                                    slicer?.setSlicerState({ filters: slicerFilter });
                                }
                            }
                        }
                    }
                });

                report.on('loaded', async () => {
                    const pages = await report.getPages();
                    const targetPage = pages.find(p => p.displayName === tabName);

                    if (targetPage) {
                        await targetPage.setActive();
                    }
                });
            } catch (error) {
                logError('Error fetching Power BI token:', error);
            }
        };

        fetchReportDetails();
    }, [embedConfig]);

    const renderEmptyState = () => {
        return (
            <Flex vertical align="center" justify="center" gap={4}>
                <ReportAccessDeniedState />
                <Flex vertical align="center" justify="center" gap={4}>
                    <Label type="body1">
                        <span className={styles['report-empty-state-title']}>
                            You don’t have access to this report.
                        </span>
                    </Label>
                </Flex>
            </Flex>
        );
    };

    function findValuesByKey<T extends JsonObject, K extends keyof any>(obj: T, key: K): string[] {
        const results: string[] = [];

        function search(current: any) {
            if (typeof current !== 'object' || current === null) return;

            for (const [k, v] of Object.entries(current)) {
                if (k === key) {
                    results.push(String(v));
                }
                if (typeof v === 'object') {
                    search(v);
                }
            }
        }

        search(obj);

        return results;
    }

    return (
        <Flex className={styles['container']} align="center" justify="center">
            {isLoading && (
                <div className={styles['overlay']}>
                    <AnimatedLoaders id="lazy-loader" type="page" />
                </div>
            )}

            {!isLoading && embedConfig && <div ref={reportRef} className={styles['container']} />}

            {!isLoading && (!isAuthorized || !embedConfig) && renderEmptyState()}
        </Flex>
    );
}

export default PowerBIReport;
