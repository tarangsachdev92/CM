import { useCallback, useEffect, useRef, useState } from 'react';
import { Flex } from 'antd';
import { Table, Icon } from 'konnect-react-components';
import styles from './ForumAccessDataTable.module.scss';
import { FlyoutCheckboxItemForum } from '../role-selection-flyout/RoleSelectionFlyoutForum';

export type TableDataType = {
    name?: string,
    geographyTypeId?: number,
    geographyId?: number,
    role?: string,
    roles?: any,
    level: number,
    rowIndex?: string,
    inherited?: number,
    selected?: number,
    expandedRowData?: TableDataType[]
}

export type SavedPermissionType = TableDataType & {
    roles: FlyoutCheckboxItemForum[]
}

type Props = {
    tableType: string
    region: {
        label: string,
        value: number
    }[], cluster: {
        label: string,
        value: number
    }[], market: {
        label: string,
        value: number
    }[], site: {
        label: string,
        value: number
    }[],
    geoLevel: {
        label: string,
        value: number
    },
    openFlyout: (record: TableDataType) => void,
    forumAccessPermissionData: any
};

function ForumAccessDataTable({
    tableType,
    region, cluster, market, site,
    geoLevel,
    openFlyout,
    forumAccessPermissionData
}: Props) {

    const tableRef = useRef<any>(null);

    const [tableDataHierarchy, setTableDataHierarchy] = useState<TableDataType[]>([])

    const flattenHierarchy = (
        data: TableDataType[] = [],
        parentPath: any = {}
    ): any[] => {

        let rows: any[] = [];
        data.forEach((item) => {
            const currentPath = {
                ...parentPath
            };
            // map hierarchy level
            if (!parentPath.region) {
                currentPath.region = item.name;
            } else if (!parentPath.cluster) {
                currentPath.cluster = item.name;
            } else if (!parentPath.market) {
                currentPath.market = item.name;
            } else {
                currentPath.site = item.name;
            }

            currentPath.role = item.role
            // if children exist -> recurse
            if (
                item.expandedRowData &&
                item.expandedRowData.length > 0
            ) {
                rows = rows.concat(
                    flattenHierarchy(item.expandedRowData, currentPath)
                );
            } else {
                // leaf node
                rows.push(currentPath);
            }
        });
        return rows;
    };

    useEffect(() => {
        setHierarchicalData()
    }, [site, market, cluster, region, geoLevel, forumAccessPermissionData])

    const getRolesAndUserCount = (rowIndex: string) => {
        if (forumAccessPermissionData?.length) {
            const forumObject = forumAccessPermissionData.find((item: any) => item.rowIndex === rowIndex)
            return forumObject?.roles ? forumObject?.roles?.length : 0
        } else {
            return 0
        }
    }

    const setHierarchicalData = () => {
        const data : TableDataType[] = [{
            name: 'Global',
            geographyTypeId: 1,
            geographyId: 1,
            role: getRolesAndUserCount('g') > 0 ? `Roles: ${getRolesAndUserCount('g')} Selected` : `Roles: Not selected`,
            roles: '',
            level: 1,
            rowIndex: 'g',
            inherited: 0,
            selected: getRolesAndUserCount('g'),
        }]

        data.forEach(element => {
            element.expandedRowData = region.map(((regionItem, index) => {
                const rowIndexValue = `r${index}`
                let forumOwnerText = 'Roles: Not selected'
                if (getRolesAndUserCount('g') > 0) {
                    forumOwnerText = `Roles: ${getRolesAndUserCount('g')} Inherited`
                    if (getRolesAndUserCount(rowIndexValue) > 0) {
                        forumOwnerText = `Roles: ${getRolesAndUserCount('g')} Inherited + ${getRolesAndUserCount(rowIndexValue)} Selected`
                    }
                } else if (getRolesAndUserCount(rowIndexValue) > 0) {
                    forumOwnerText = `Roles: ${getRolesAndUserCount(rowIndexValue)} Selected`
                }
                return {
                    inherited: getRolesAndUserCount('g'),
                    selected: getRolesAndUserCount(rowIndexValue),
                    geographyTypeId: 1,
                    geographyId: regionItem.value, "name": regionItem.label, role: forumOwnerText, level: 2, rowIndex: rowIndexValue, roles: getRolesAndUserCount('g') + getRolesAndUserCount(rowIndexValue)
                }
            }))
        });

        if (geoLevel?.value === 2) {
            data.forEach(element => {
                element?.expandedRowData?.forEach((regionItem) => {
                    regionItem.expandedRowData = cluster?.map(((clusterItem, index) => {
                        const rowIndexValue = `${regionItem.rowIndex}-c${index}`
                        let forumOwnerText = 'Users: Not select'
                        if (regionItem.roles > 0) {
                            forumOwnerText = `Users: ${regionItem.roles} Inherited`
                            if (getRolesAndUserCount(rowIndexValue) > 0) {
                                forumOwnerText = `Users: ${regionItem.roles} Inherited + ${getRolesAndUserCount(rowIndexValue)} Selected`
                            }
                        } else if (getRolesAndUserCount(rowIndexValue) > 0) {
                            forumOwnerText = `Users: ${getRolesAndUserCount(rowIndexValue)} Selected`
                        }
                        return {
                            inherited: regionItem.roles,
                            selected: getRolesAndUserCount(rowIndexValue),
                            geographyTypeId: 2,
                            geographyId: clusterItem.value, "name": clusterItem.label, role: forumOwnerText, level: 3, rowIndex: rowIndexValue, roles: regionItem.roles + getRolesAndUserCount(rowIndexValue)
                        }
                    }
                    ))
                })
            });
        }

        if (geoLevel?.value === 3) {
            data.forEach(element => {
                element.expandedRowData?.forEach((regionItem) => {
                    regionItem.expandedRowData = cluster?.map(((clusterItem, index) => {
                        const rowIndexValue = `${regionItem.rowIndex}-c${index}`
                        let forumOwnerText = 'Roles: Not selected'
                        if (regionItem.roles > 0) {
                            forumOwnerText = `Roles: ${regionItem.roles} Inherited`
                            if (getRolesAndUserCount(rowIndexValue) > 0) {
                                forumOwnerText = `Roles: ${regionItem.roles} Inherited + ${getRolesAndUserCount(rowIndexValue)} Selected`
                            }
                        } else if (getRolesAndUserCount(rowIndexValue) > 0) {
                            forumOwnerText = `Roles: ${getRolesAndUserCount(rowIndexValue)} Selected`
                        }
                        return {
                            inherited: regionItem.roles,
                            selected: getRolesAndUserCount(rowIndexValue),
                            geographyTypeId: 2,
                            geographyId: clusterItem.value, "name": clusterItem.label, role: forumOwnerText, level: 3, rowIndex: `${regionItem.rowIndex}-c${index}`, roles: regionItem.roles + getRolesAndUserCount(rowIndexValue)
                        }
                    }
                    ))
                })
            });

            data.forEach(element => {
                element.expandedRowData?.forEach((regionItem) => {
                    regionItem.expandedRowData?.forEach((clusterItem) => {
                        clusterItem.expandedRowData = market?.map(((marketItem, index) => {
                            const rowIndexValue = `${regionItem.rowIndex}-${clusterItem.rowIndex}-m${index}`
                            let forumOwnerText = 'Users: Not selected'
                            if (clusterItem.roles > 0) {
                                forumOwnerText = `Users: ${clusterItem.roles} Inherited`
                                if (getRolesAndUserCount(rowIndexValue) > 0) {
                                    forumOwnerText = `Users: ${clusterItem.roles} Inherited + ${getRolesAndUserCount(rowIndexValue)} Selected`
                                }
                            } else if (getRolesAndUserCount(rowIndexValue) > 0) {
                                forumOwnerText = `Users: ${getRolesAndUserCount(rowIndexValue)} Selected`
                            }
                            return {
                                inherited: clusterItem.roles,
                                selected: getRolesAndUserCount(rowIndexValue),
                                geographyTypeId: 3,
                                geographyId: marketItem.value, "name": marketItem.label, role: forumOwnerText, level: 4, rowIndex: rowIndexValue, roles: clusterItem.roles + getRolesAndUserCount(rowIndexValue)
                            }
                        }
                        ))
                    })
                })
            });
        }

        if (geoLevel?.value === 4) {
            data.forEach(element => {
                element.expandedRowData?.forEach((regionItem) => {
                    regionItem.expandedRowData = cluster?.map(((clusterItem, index) => {
                        const rowIndexValue = `${regionItem.rowIndex}-c${index}`
                        let forumOwnerText = 'Roles: Not selected'
                        if (regionItem.roles > 0) {
                            forumOwnerText = `Roles: ${regionItem.roles} Inherited`
                            if (getRolesAndUserCount(rowIndexValue) > 0) {
                                forumOwnerText = `Roles: ${regionItem.roles} Inherited + ${getRolesAndUserCount(rowIndexValue)} Selected`
                            }
                        } else if (getRolesAndUserCount(rowIndexValue) > 0) {
                            forumOwnerText = `Roles: ${getRolesAndUserCount(rowIndexValue)} Selected`
                        }
                        return {
                            inherited: regionItem.roles,
                            selected: getRolesAndUserCount(rowIndexValue),
                            geographyTypeId: 2,
                            geographyId: clusterItem.value, "name": clusterItem.label, role: forumOwnerText, level: 3, rowIndex: rowIndexValue, roles: regionItem.roles + getRolesAndUserCount(rowIndexValue)
                        }
                    }
                    ))
                })
            });


            data.forEach(element => {
                element.expandedRowData?.forEach((regionItem) => {
                    regionItem.expandedRowData?.forEach((clusterItem) => {
                        clusterItem.expandedRowData = market?.map(((marketItem, index) => {
                            const rowIndexValue = `${regionItem.rowIndex}-${clusterItem.rowIndex}-m${index}`
                            let forumOwnerText = 'Roles: Not selected'
                            if (clusterItem.roles > 0) {
                                forumOwnerText = `Roles: ${clusterItem.roles} Inherited`
                                if (getRolesAndUserCount(rowIndexValue) > 0) {
                                    forumOwnerText = `Roles: ${clusterItem.roles} Inherited + ${getRolesAndUserCount(rowIndexValue)} Selected`
                                }
                            } else if (getRolesAndUserCount(rowIndexValue) > 0) {
                                forumOwnerText = `Roles: ${getRolesAndUserCount(rowIndexValue)} Selected`
                            }
                            return {
                                inherited: clusterItem.roles,
                                selected: getRolesAndUserCount(rowIndexValue),
                                geographyTypeId: 3,
                                geographyId: marketItem.value, "name": marketItem.label, role: forumOwnerText, level: 4, rowIndex: rowIndexValue, roles: clusterItem.roles + getRolesAndUserCount(rowIndexValue)
                            }
                        }
                        ))
                    })
                })
            });

            data.forEach(element => {
                element.expandedRowData?.forEach((regionItem) => {
                    regionItem.expandedRowData?.forEach((clusterItem) => {
                        clusterItem.expandedRowData?.forEach((marketItem) => {
                            marketItem.expandedRowData = site?.map(((siteItem, index) => {
                                const rowIndexValue = `${regionItem.rowIndex}-${clusterItem.rowIndex}-${marketItem.rowIndex}-s${index}`
                                let forumOwnerText = 'Users: Not selected'
                                if (marketItem.roles > 0) {
                                    forumOwnerText = `Users: ${marketItem.roles} Inherited`
                                    if (getRolesAndUserCount(rowIndexValue) > 0) {
                                        forumOwnerText = `Users: ${marketItem.roles} Inherited + ${getRolesAndUserCount(rowIndexValue)} Selected`
                                    }
                                } else if (getRolesAndUserCount(rowIndexValue) > 0) {
                                    forumOwnerText = `Users: ${getRolesAndUserCount(rowIndexValue)} Selected`
                                }
                                return {
                                    inherited: marketItem.roles,
                                    selected: getRolesAndUserCount(rowIndexValue),
                                    geographyTypeId: 4,
                                    geographyId: siteItem.value, "name": siteItem.label, role: forumOwnerText, level: 5, rowIndex: rowIndexValue, roles: marketItem.roles + getRolesAndUserCount(rowIndexValue)
                                }
                            }
                            ))
                        })
                    })
                })
            });
        }

        setTableDataHierarchy(data)
    }

    const getTableData = () => {
        if (tableType === 'flat') {
            return flattenHierarchy(tableDataHierarchy[0]?.expandedRowData)
        }
        return tableDataHierarchy
    }

    const getColumns = useCallback(() => {
        return [{
            key: 'name',
            dataIndex: 'name',
            title: 'Report Geography',
            resizable: true,
            customExpandableColumn: true,
            render: (_value: string, record: TableDataType, isExpanded: boolean) => {
                return (
                    <Flex gap={5} align='center' style={{ marginLeft: 10 * record.level }}>
                        {record.expandedRowData && <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} color='black-color' size='l' />}
                        <span style={record.expandedRowData ? { marginLeft: 0 } : { marginLeft: 15 }}>{_value}</span>
                    </Flex>
                )
            }
        }, {
            key: 'role',
            dataIndex: 'role',
            title: 'Forum Owner',
            resizable: true,
            render: (_value: string, record: TableDataType) => {
                return (
                    <Flex onClick={() => {
                        openFlyout(record)
                    }} justify='space-between'>
                        <span className={styles['forumOwnerText']}>{_value}</span>
                        <Icon name='chevron-down' color='black-color' />
                    </Flex>
                )
            }
        }];
    },[tableDataHierarchy])

    const getColumnsForFlatTable = useCallback(() => {
        let column = [{
            key: 'region',
            dataIndex: 'region',
            title: 'Region',
            // width: '200px',
            resizable: true,
        }]
        if (geoLevel.value === 2 || geoLevel.value === 3 || geoLevel.value === 4) {
            column = [...column, {
                key: 'cluster',
                dataIndex: 'cluster',
                title: 'Cluster',
                // width: '200px',
                resizable: true
            }]
        }
        if (geoLevel.value === 3 || geoLevel.value === 4) {
            column = [...column, {
                key: 'market',
                dataIndex: 'market',
                title: 'Market',
                // width: '200px',
                resizable: true
            }]
        } if (geoLevel.value === 4) {
            column = [...column, {
                key: 'site',
                dataIndex: 'site',
                title: 'Site',
                // width: '200px',
                resizable: true
            }]
        }
        return [...column, {
            key: 'role',
            dataIndex: 'role',
            title: 'Forum Owner',
            // width: '100px',
            resizable: true,
            render: (_value: string) => {
                return (
                    <div className={styles['roles-row']}>

                        <span>{_value}</span>
                        <Icon name='chevron-down' color='black-color' />

                    </div>
                )
            }
        }]
    },[tableDataHierarchy])

    const renderTable = useCallback(() => {
        return (
            <Table
                expandableRows={tableType !== 'flat'}
                columns={tableType === 'flat' ? getColumnsForFlatTable() : getColumns()}
                data={getTableData()}
                className={styles['table-comp']}
                ref={tableRef}
            />
        );
    }, [
        getColumns, tableType
    ]);


    return (
        <div className={styles['table-container']}>
            {renderTable()}
        </div>
    );
}

export default ForumAccessDataTable;
