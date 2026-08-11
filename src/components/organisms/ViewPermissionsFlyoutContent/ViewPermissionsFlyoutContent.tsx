
import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Status,
  CheckBox,
  Icon,
} from 'konnect-react-components';
import { useDispatch, useSelector } from 'react-redux';
import { Skeleton } from 'antd';
import {
  RootState,
  AppDispatch,
  fetchRolePermissionsFlyout,
} from '../../../store';
import styles from './ViewPermissionsFlyoutContent.module.scss';
import { PermissionStatus }from '../../../utils/constants';

/* ===================== CONSTANTS ===================== */

type Canonical = PermissionStatus;

const toCanonical = (raw?: string): Canonical | null => {
  const s = (raw || '')
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .trim();

  if (s.includes('approve')) return PermissionStatus.Approved;
  if (s.includes('pending') || s.includes('request'))
    return PermissionStatus.Pending;
  if (s.includes('reject') || s.includes('deny'))
    return PermissionStatus.AutoRejected;

  return null;
};


const statusTypeForCanonical = (
  canon: Canonical,
): 'Success' | 'Alert' | 'Warning' =>
  canon === PermissionStatus.Approved
    ? 'Success'
    : canon === PermissionStatus.Pending
    ? 'Alert'
    : 'Warning';

/* ===================== TYPES ===================== */

type PermissionRow = {
  key: string;
  module: string;
  subModule: string;
  permissionName: string;
  isActive: boolean;
};

type TableRow = {
  key: string;
  toolType: string;
  roleType: string;
  roleName: string;
  personaName: string;
  expandedRowData: PermissionRow[];
  statusSummary: Partial<Record<Canonical, number>>;
};

/* ===================== COMPONENT ===================== */

type Props = {
  roleId: number;
};

const ViewPermissionsFlyoutContent = ({ roleId }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

 const { tools, loading, pagination } = useSelector(
  (state: RootState) => state.rolePermission,
);

const [pageNumber, setPageNumber] = useState(1);
const [pageSize, setPageSize] = useState(5); 
  /* ===================== API ===================== */

  useEffect(() => {
    if (roleId) {
      dispatch(fetchRolePermissionsFlyout({ 
   roleId,
    pageNumber,
    pageSize,
 }));
    }
  }, [roleId, pageNumber, pageSize,dispatch]);

  /* ===================== DATA ===================== */

 const mappedTableData: TableRow[] = useMemo(() => {
  if (!tools?.length) return [];

  return tools.map((tool, index) => {
    const statusSummary: Partial<Record<Canonical, number>> = {
      Approved: 0,
      Pending: 0,
      AutoRejected: 0,
    };

    tool.statusChips?.forEach(chip => {
      const canon = toCanonical(chip.status);
      if (canon) {
        statusSummary[canon] =
          (statusSummary[canon] ?? 0) + (chip.statusCount || 0);
      }
    });

    const expandedRowData = tool.permissionDetails.map((p, i) => ({
      key: `child_${index}_${i}`,
      isChild: true,
      module: p.module,
      subModule: p.subModule,
      permissionName: p.permissionName,
      isActive: p.isCheckedPermission,
    }));

    return {
      key: `parent_${tool.toolId}`,
      isChild: false,
      toolType: tool.toolName,
      roleType: tool.permissionDetails?.[0]?.roleType || '',
      roleName: tool.permissionDetails?.[0]?.roleName || '',
      personaName: tool.permissionDetails?.[0]?.personaName || '',
      expandedRowData,
      statusSummary,
    };
  });
}, [tools]);
  /* ===================== PARENT COLUMNS ===================== */

  const columns = [
    {
      key: 'tool',
      title: 'Tools & Permissions',
      dataIndex: 'toolType',
      customExpandableColumn: true,
     render: (_: any, record: any) => {
  if (record.isChild) {
    return (
      <div className={styles['text-wrapper']}>
       <div className={styles['header-title']}>
        <span>{record.module} / {record.subModule}</span>
      </div>
      <div className={styles['header-subtitle']}>
        <span>{record.permissionName}</span>
      </div>
      </div>
    );
  }

  return (

    <div className={styles['application-cell-container']}>
            <Icon name="chevron-down" size="xm" />
           <div className={styles['text-wrapper']}>

       <div className={styles['header-title']}>
        <span>{record.toolType} {record.roleType}</span>
      </div>
      <div className={styles['header-subtitle']}>
        <span>{record.roleName}</span>
      </div>
    </div>
    </div>
  );
},
    },
    {
      key: 'persona',
      title: 'Demand Planner',
      subTitle: 'Plan Excellance',
      dataIndex: 'personaName',
      render: (_: any, record: any) => {

  if (record.isChild) {
  return (
   <div className={styles['centered-checkbox-container']}>
      <CheckBox
        checked={record.isActive}
        disabled
        onChange={() => {}}
      />
    </div>
  );
}



    return (
    <div className={styles['application-cell-container']}>

      <div className={styles['header-title']}>
        <span>{record.personaName}</span>
      </div>
    </div>
  );
},
    },
    {
      key: 'adGroup',
      title: 'AD Group Access Status',
      dataIndex: 'personaName',
      render: (_: any, record: any) => {




  return (
    <div className={styles['status-summary']}>
      {Object.entries(record.statusSummary || {}).map(([key, count]) => {
        if (!count) return null;

        return (
          <Status
            key={key}
            text={
             key === PermissionStatus.AutoRejected
                ? `Auto Reject (${count})`
                : `${key} (${count})`
            }
            type={statusTypeForCanonical(key as Canonical)}
          />
        );
      })}
    </div>
  );
},
    },

  ];


  /* ===================== EMPTY / LOADING ===================== */

  const renderCustomRow = () => {
    if (loading) {
      return <Skeleton active paragraph={{ rows: 3 }} />;
    }
    if (!mappedTableData.length) {
      return <span>No permissions found.</span>;
    }
    return <></>;
  };

  /* ===================== UI ===================== */

  return loading ? (
    <Skeleton active paragraph={{ rows: 5 }} />
  ) : (
    <div className={styles['primary-permission-flyout']}>
      <Table
        columns={columns as any}
        data={mappedTableData as any[]}
        expandableRows
        customRow={renderCustomRow()}
        
 pagination={{
    totalItems: pagination?.totalRows || 0,
    pageSize: pageSize,
    currentPage: pageNumber,

    onPageChange: (page: number) => {
      setPageNumber(page);
    },

    onPageSizeChange: (size: number) => {
      setPageSize(size);  
      setPageNumber(1);   
    },
  }}
      />
    </div>
  );
};

export default ViewPermissionsFlyoutContent;

