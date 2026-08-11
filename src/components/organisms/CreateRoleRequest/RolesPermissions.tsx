import { Flyout, Icon, Table, CheckBox } from 'konnect-react-components';
import styles from './RequestNewRole.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, fetchToolPersonaPermissionByRole, RootState } from '../../../store';
import { useEffect, useState } from 'react';

interface props {
    flyoutOpen: boolean;
    handleClose: (state: boolean) => void;
    roleId: number;
}

interface TableRow {
    key: number;
    application?: string;
    applicationId?: string;
    toolType?: string;
    appFeature?: string;
    appModuleName?: string;    
    isActive?: boolean | null;    
    expandedRowData?: TableRow[];
    persona:string
}

function RolesPermissions({ flyoutOpen,handleClose,roleId }: props) {
    const dispatch = useDispatch<AppDispatch>();
    const [paginatedData, setPaginatedData] = useState<TableRow[]>([]);
    const [tableRowData, setTableRowData] = useState<TableRow[]>([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const rolePermissionState = useSelector((state: RootState) => state.rolePermissions);
    const existingToolPersonaPermissions =
        rolePermissionState.toolPersonaData.existingToolPersonaPermissions;        

    useEffect(() => {
        if (!flyoutOpen) return;
        dispatch(fetchToolPersonaPermissionByRole({ roleId: roleId, pageNumber: 1, pageSize: 10 }));
        setTableRowData([]);
    }, [flyoutOpen]);

    useEffect(()=>{
        loadExistingApplicationsForRole();
    },[existingToolPersonaPermissions])

    useEffect(() => {
        const _paginatedData = tableRowData.slice(
            (pageNumber - 1) * pageSize,
            pageNumber * pageSize,
        );
        setPaginatedData(_paginatedData);
    }, [tableRowData, pageNumber, pageSize]);
    

    const renderCustomRow = () => {
        if (!tableRowData.length) {
            return <span>No mapped permissions found for the selected role.</span>;
        }
        return <></>;
    };

    const handlePageChange = (page: number) => {
        setPageNumber(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
    };

    function transformToTableRows(existingToolPersonaPermissions: any[]): TableRow[] {        
    if (!Array.isArray(existingToolPersonaPermissions)) {        
        return [];
    }

    const tableRows: TableRow[] = [];

    existingToolPersonaPermissions.forEach((application) => {
        const toolDetails = application?.toolDetails;

        if (!toolDetails || !Array.isArray(application?.personas)) {            
            return;
        }

        const { toolName, toolId, toolType } = toolDetails;

        application.personas.forEach((persona:any) => {
            const expandedRowData: TableRow[] = [];

            if (Array.isArray(persona?.modules)) {
                persona.modules.forEach((module:any) => {
                    const moduleName = module?.module ?? "Unknown Module";

                    if (Array.isArray(module?.permission)) {
                        module.permission.forEach((perm:any, permIndex:number) => {
                            expandedRowData.push({
                                key: permIndex,
                                toolType: moduleName, // Module Name
                                application: module?.subModules ?? '',
                                isActive: perm?.isActiveToolPermission ?? false,
                                persona: persona?.personaName ?? "Unknown Persona",
                                expandedRowData: []
                            });
                        });
                    }
                });
            }

            tableRows.push({
                key: tableRows.length,
                application: toolName ?? "Unknown App",
                applicationId: toolId?.toString() ?? "",
                toolType: toolType ?? "",
                persona: persona?.personaName ?? "Unknown Persona",
                expandedRowData
            });
        });
    });

    return tableRows;
}

    const loadExistingApplicationsForRole = () => {               
        const newTableRowData = transformToTableRows(existingToolPersonaPermissions)        
        setTableRowData(newTableRowData);
    };

    const toggleRow = (key: number) => {
    setExpandedRows(prev =>
        prev.includes(key)
            ? prev.filter(k => k !== key)
            : [...prev, key]
    );
};

    const TableColumns = [
        {
            key: 'application',
            dataIndex: 'application',
            title: 'Tools & Permissions',
            externalStyles: { alignItems: 'center' },
            customExpandableColumn: true,
            render: (_value: string, record: TableRow) => {
                const isParentRow = !!record.expandedRowData?.length;

                return (
                    <>
                        {isParentRow ? (
                            <div className={styles['application-cell-container']}
                                onClick={() => toggleRow(record.key)}
                            >
                                <Icon
                                    name={expandedRows.includes(record.key)
                                        ? 'chevron-up'
                                        : 'chevron-down'}
                                    size="xm"
                                    color="neutrals-B300"
                                />
                                <div className={styles['header-title']}>
                                    <span className={styles['application-permissions-cell-title']}>
                                        {record.toolType} {record.applicationId} 
                                        {/* column1 data - type of tool and it's id */}
                                    </span>
                                    <span className={styles['application-permissions-cell-content']}>
                                        {record.application}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className={styles['header-title']}>
                                <span className={styles['application-permissions-cell-title']}>
                                    {record.toolType}
                                </span>
                                <span className={styles['application-permissions-cell-content']}>
                                    {record.application}
                                </span>
                            </div>
                        )}
                    </>
                );
            },
        },
        {
            key: 'persona',
            dataIndex: 'persona',
            title: 'Persona',      
            render: (_value: string, record: TableRow) => {
                const isParentRow = !!record.expandedRowData?.length;

                return isParentRow ? (
                    <div className={styles['role_permissions_column']}>
                        {record.persona}
                    </div>
                ) : (
                    <div className={styles['role_permissions_column']}

                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        {record.isActive ? (
                            <CheckBox
                                checked={record.isActive}
                                disabled={true}
                                onChange={() => { }}
                            />
                        ) : (
                            <Icon
                                name="x-close"
                                size="l"
                                color="neutrals-B80"
                            />
                        )}
                    </div>
                );
            },
        },
    ];

    const permissionTable = () => {
        return (
            <>
                <Table
                    columns={TableColumns as any}
                    expandableRows={true}
                    data={paginatedData}
                    customRow={renderCustomRow()}
                    pagination={{
                        totalItems: tableRowData.length > 0 ? tableRowData.length : 1,
                        pageSize,
                        currentPage: pageNumber,
                        onPageChange: handlePageChange,
                        onPageSizeChange: handlePageSizeChange,
                        blankOut: 10,
                    }}
                />
            </>
        );
    };
    

    return (
        <Flyout
            flyoutOpen={flyoutOpen}
            heading={'View Permissions for Role'}
            content={permissionTable()}
            cancelIconClick={() => {}}
            containerMaxWidth={'26.50rem'}
            direction="right"
            dataTestId="flyout-filter"
            id="primary-role-request-flyout"
            className={styles['role-selection-flyout']}
            iconForCancel={{
                icon: 'x-close',
                onClick: () => {
                    handleClose(false);
                },
            }}
            showfooter={false}
        />
    );
}

export default RolesPermissions;
