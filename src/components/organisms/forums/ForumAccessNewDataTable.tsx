import { useCallback, useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import { Flex } from 'antd';
import { Table, CheckBox, Button } from 'konnect-react-components';
import styles from './ForumAccessDataTable.module.scss';

export interface TableRowData {
    // rowSelected: boolean;
    rowId: number;
    regionId?: number;
    regionName?: string;
    clusterId?: number;
    clusterName?: string;
    marketId?: number;
    marketName?: string;
    siteId?: number;
    siteName?: string;
    roles: any;
    users: any;
}

type Props = {
    forumAccessTableData: TableRowData[],
    setRoleFlyoutOpenClicked: Dispatch<SetStateAction<boolean | undefined>>
    setUsersFlyoutOpenClicked: Dispatch<SetStateAction<boolean | undefined>>
    setSelectedForumAccessRows: Dispatch<SetStateAction<TableRowData[]>>
    clearTableSelection: boolean,
    setSelectedRoleFlyoutRow: Dispatch<SetStateAction<TableRowData | undefined>>
};


function ForumAccessNewDataTable({
    forumAccessTableData,
    setRoleFlyoutOpenClicked,
    setUsersFlyoutOpenClicked,
    setSelectedForumAccessRows,
    clearTableSelection,
    setSelectedRoleFlyoutRow
}: Props) { 

    const tableRef = useRef<any>(null);
    const [selectedRows, setSelectedRows] = useState<TableRowData[]>([]);

    useEffect(() => {
        setSelectedForumAccessRows([...selectedRows])
        console.log('selectedRows: ', selectedRows)
    }, [selectedRows])

    useEffect(() => {
        if(clearTableSelection)
            setSelectedRows([]);      
    }, [clearTableSelection])

    const handleOpenRoleFlyout = (record : TableRowData) => {
        setSelectedRoleFlyoutRow({...record});
        setRoleFlyoutOpenClicked(true);
    }

    const handleOpenUsersFlyout = (record : TableRowData) => {
        setSelectedRoleFlyoutRow({...record});
        setUsersFlyoutOpenClicked(true);
    }

    const isAllSelected = forumAccessTableData.length > 0 && selectedRows.length === forumAccessTableData.length;

    const getColumns = useCallback(() => {
        return [{
                    key: 'rowId' as keyof TableRowData,
                    // key: 'checkbox',
                    dataIndex: 'rowId' as keyof TableRowData,
                    title: 'Select',
                    width: '60px',
                    rowSpan: 1,
                    // sticky: 'left',
                    renderHeader() {
                        return <CheckBox 
                        checked={isAllSelected} 
                        onChange={(checked: boolean) => {
                            if(checked){
                                setSelectedRows(prev => [...prev, ...forumAccessTableData]);
                            }
                            else
                            {
                                setSelectedRows([]);
                            }
                        }} />;
                    },
                    render: (_value: any, record: TableRowData) => {
                        return (
                            <Flex justify="center">
                                <CheckBox
                                    checked={selectedRows.some(item => item.rowId === record.rowId)} 
                                    onChange={(checked: boolean) => {
                                        if(checked)
                                            setSelectedRows(prev => [...prev, record])
                                        else
                                            setSelectedRows(prev => prev.filter(row => row.rowId !== record.rowId));
                                        }}/>                                        
                            </Flex>
                        )
                    }
                },
                {
                key: 'regionId' as keyof TableRowData,
                dataIndex: 'regionName' as keyof TableRowData,
                title: 'Region',
                resizable: true,
                },
                {
                    key: 'clusterId' as keyof TableRowData,
                    dataIndex: 'clusterName' as keyof TableRowData,
                    title: 'Cluster',
                    resizable: true,
                },
                {
                    key: 'marketId' as keyof TableRowData,
                    dataIndex: 'marketName' as keyof TableRowData,
                    title: 'Market',
                    resizable: true,
                },
                {
                    key: 'siteId' as keyof TableRowData,
                    dataIndex: 'siteName' as keyof TableRowData,
                    title: 'Site',
                    resizable: true,
                },
                {
                    key: 'role' as keyof TableRowData,
                    dataIndex: 'role' as keyof TableRowData,
                    title: 'Role',
                    resizable: true,
                    render: (_value: any, record: TableRowData) => {
                        return (
                    <>
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                            }}
                            onClick={() => handleOpenRoleFlyout(record)}
                        >                           
                            <span
                                style={{
                                    fontSize: '13px',
                                    color: record.roles.length > 0 ? '#333' : '#999',
                                }}
                            >
                                {record.roles.length > 0
                                    ? `Roles : ${record.roles.length} Selected`
                                    : 'Roles : Not selected'}
                            </span>
                            <Button
                                variant="Subtle2"
                                icon="chevron-down"
                                iconSize="Medium"
                                onClick={(event: any) => {
                                    event?.stopPropagation?.();
                                    handleOpenRoleFlyout(record);
                                }}
                            />
                        </div>
                    </>
                );
                    }
                },
                {
                    key: 'forumOwner' as keyof TableRowData,
                    dataIndex: 'forumOwner' as keyof TableRowData,
                    title: 'Forum Owner',
                    resizable: true,
                    render: (_value: any, record: TableRowData) => {
                        return (
                    <>
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                            }}
                            onClick={() => handleOpenUsersFlyout(record)}
                        >
                            {/* <TagSelector
                                key={record.rowId}
                                dataTestId="drop-down"
                                id="role-drop-down"
                                className={styles['application-tag-selector']}
                                onChange={value =>
                                    // handlePersonaChange(value as ICustomOptionType, record)
                                    console.log(value)
                                }
                                options={[]}
                                // selectedOptions={
                                //     record.isFromApi
                                //         ? getSelectedPersonaFromApi(record.persona)
                                //         : getSelectedPersona(record.key)
                                // }
                                placeholder="Users : Not selected"
                                size="L"
                                showCloseIcon={false}
                                optionsContainerClassName={
                                    styles['application-tag-selector-dropdown-container']
                                }
                                portal={true}
                            /> */}
                            <span
                                style={{
                                    fontSize: '13px',
                                    color: record?.users?.filter((item:any) => item.checked)?.length > 0 ? '#333' : '#999',
                                }}
                            >
                                {record.roles.length > 0
                                    ? `Users : ${record?.users?.filter((item:any) => item.checked)?.length} Selected`
                                    : 'Users : Not selected'}
                            </span>
                            <Button
                                variant="Subtle2"
                                icon="chevron-down"
                                iconSize="Medium"
                                onClick={(event: any) => {
                                    event?.stopPropagation?.();
                                    handleOpenUsersFlyout(record);
                                }}
                            />
                        </div>
                    </>
                );
                    }
                }]
        }, [forumAccessTableData, selectedRows])

    const renderTable = useCallback(() => {
            return (
                <Table
                    columns={ getColumns()}
                    // data={getTableData()}
                    data = {forumAccessTableData}
                    className={styles['table-comp']}
                    ref={tableRef}
                />
            );
        }, [
            getColumns, forumAccessTableData
        ]);

    return (
        <Flex>
            <div className={styles['table-container']}>
                {renderTable()}
            </div>
        </Flex>
    )
}

export default ForumAccessNewDataTable;