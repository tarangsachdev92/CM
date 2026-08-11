 
import { Flex, Tooltip } from 'antd';
import {
  AnimatedLoaders,
  FilterChip,
  SearchInput,
  Status,
  Table,
  Toast,
} from 'konnect-react-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  AppDispatch,
  fetchUserData,
} from '../../../store';
import { useDebounce } from '../../../utils/customHooks';
import { removeElementByKey } from '../../../utils/helpers';
import { EllipsisWithTooltip, Label } from '../../atoms';
import { AppliedFilters } from '../../molecules';
import { FilterType } from '../../molecules/applied-filters/AppliedFilters';
import styles from './UserManagementTable.module.scss';
import {
  IColumnFilterData,
  IUserData,
  IUserFiltersData,
} from '../../../types/response';
import { NoMatchesFound } from '../../../assets/images/images';

type RoleUserManagementTableProps = {
  roleId: number;
};

const emptyPagination = {
  totalRows: 0,
  totalPages: 0,
};

const emptyColumnFilters: IUserFiltersData = {
  function: [],
  name: [],
  email: [],
  primaryRoleId: [],
  primaryRole: [],
  rolelevel: [],
  region: [],
  market: [],
  site: [],
  isactive: [],
  usercount: [],
  geography: [],
  attribute: [],
  UserName: [],
};

const getDefaultRoleUserFilters = () => ({
  name: [],
  email: [],
  region: [],
  isActive: [],
});

const toFilterOptions = (items: any[] = [], valueKey?: string) =>
  items.map(item => ({
    label: String(item?.columnValue ?? ''),
    value: String(
      item?.[valueKey ?? 'id'] ?? item?.id ?? item?.columnValue ?? '',
    ),
  }));

const toStatusFilterOptions = (items: any[] = []) =>
  items.map(item => {
    const statusValue = String(item?.columnValue ?? '');
    return {
      label: statusValue,
      value: statusValue,
    };
  });

const filterColumnNames: Record<string, string> = {
  name: 'UserName',
  email: 'useremail',
  region: 'geographyLevel',
  isActive: 'status',
};

const getFilterColumnName = (columnName: string) =>
  filterColumnNames[columnName] ?? columnName;

const getAttributeValueText = (
  attribute: NonNullable<IUserData['attributes']>[number],
) =>
  attribute.AttributeValueNames || attribute.AttributeValueIds || '';

const mapRoleUsers = (apiUsers: any[] = []): IUserData[] =>
  (Array.isArray(apiUsers) ? apiUsers : []).map((user: any) => {
    const {
      userID,
      userName,
      userEmail,
      primaryRoleName,
      geographyLevel,
      isActive,
      attributes,
      totalRows,
      totalPages,
    } = user;

    return {
      userId: userID,
      name: userName,
      email: userEmail,
      primaryRole: primaryRoleName,
      geography: geographyLevel,
      region: geographyLevel,
      isActive,
      attributes: attributes ?? [],
      totalRows,
      totalPages,
    };
  });

const mapRoleColumnFilters = (apiFilters: any): IUserFiltersData => {
  const {
    UserName = [],
    UserEmail = [],
    PrimaryRoleName = [],
    Geography = [],
    Status = [],
  } = apiFilters ?? {};

  return {
    ...emptyColumnFilters,
    name: UserName,
    email: UserEmail,
    primaryRole: PrimaryRoleName,
    region: Geography,
    geography: Geography,
    isactive: Status,
  };
};

function RoleUserManagementTable({ roleId }: RoleUserManagementTableProps) {
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [defaultFilters, setDefaultFilters] = useState<any>(
    getDefaultRoleUserFilters,
  );

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const searchKeyword = useDebounce(searchText, 500);
  const [searchColumn, setSearchColumn] =
    useState<'name' | 'email'>('name');

  const [sortColumnName, setSortColumnName] = useState('name');
  const [sortDirection, setSortDirection] =
    useState<'asc' | 'desc' | 'unsort'>('asc');

  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    message: string;
    type: 'Success' | 'Error';
  }>({ visible: false, message: '', type: 'Success' });

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const tableRef = useRef<any>(null);
  const requestIdRef = useRef(0);
  const hasMountedRef = useRef(false);

  const [userData, setUserData] = useState<IUserData[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [columnFilters, setColumnFilters] = useState<IUserFiltersData>(emptyColumnFilters);
  const totalRows = pagination?.totalRows ?? 0;
  const appliedFilters = useMemo<IColumnFilterData[]>(() => {
    const applied: IColumnFilterData[] = [];

    filters.forEach(f => {
      f.selectedFilters.forEach(s => {
        applied.push({
          columnName: getFilterColumnName(f.id),
          columnValue: s.label,
          id: String(s.value),
        });
      });
    });

    return applied;
  }, [filters]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    requestIdRef.current += 1;
    setUserData([]);
    setPagination(emptyPagination);
    setColumnFilters(emptyColumnFilters);
    setFilters([]);
    setDefaultFilters(getDefaultRoleUserFilters());
    setPageNumber(1);
    setPageSize(10);
    setSearchText('');
    setSearchColumn('name');
    setSortColumnName('name');
    setSortDirection('asc');
  }, [roleId]);

  useEffect(() => {
    setPageNumber(1);
  }, [searchText]);

  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestIdRef.current;

    const fetchRoleUsers = async () => {
      setLoading(true);
      setUserData([]);
      setPagination(emptyPagination);
      try {
        const response = await dispatch(
          fetchUserData({
            pageSize,
            pageNumber,
            sortColumnName,
            sortDirection,
            searchKeyword,
            searchTerm: searchKeyword ? searchColumn : '',
            filters: appliedFilters,
            gridFilters: appliedFilters.map(filter => ({
              ColumnName: filter.columnName,
              ColumnValue: filter.columnValue,
            })) as any,
            roleId,
          }),
        );

        if (cancelled || requestId !== requestIdRef.current) return;

        const apiData = (response as any)?.payload;
        setUserData(mapRoleUsers(apiData?.user));
        setPagination(apiData?.pagination ?? emptyPagination);
        setColumnFilters(mapRoleColumnFilters(apiData?.distinctFilters));
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchRoleUsers();
    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    pageSize,
    pageNumber,
    sortColumnName,
    sortDirection,
    searchKeyword,
    searchColumn,
    appliedFilters,
    roleId,
  ]);

  useEffect(() => {
    const f: Partial<IUserFiltersData> = columnFilters || {};
    setDefaultFilters({
      name: toFilterOptions(f.name || []),
      email: toFilterOptions(f.email || [], 'UserEmail'),
      region: toFilterOptions(f.geography || []),
      isActive: toStatusFilterOptions(f.isactive || []),
    });
  }, [columnFilters]);

  const onRemoveFilter = (key: string, arr: FilterType[]) =>
    setFilters(removeElementByKey(arr, 'id', key));

  const setNewFilters = (
    id: string,
    title: string,
    selected: any[],
    existing: FilterType[],
    defaults?: any,
  ) => {
    let next = [...existing];
    if (selected.length > 0) {
      const item: FilterType = {
        id,
        title,
        selectedFilters: selected,
        defaultFilters: defaults?.[id],
        onClose: onRemoveFilter,
      };
      const idx = next.findIndex(f => f.id === id);
      if (idx === -1) next.push(item);
      else next[idx] = item;
    } else {
      next = next.filter(f => f.id !== id);
    }
    setPageNumber(1);
    setFilters(next);
  };

  const columns = useMemo(() => {
    const selected = (id: string) =>
      filters.find(f => f.id === id)?.selectedFilters ?? [];

    const colFilter = (id: string, title: string) => ({
      sortColumnOptions: true,
      filter: {
        options: defaultFilters[id] ?? [],
        selectedOptions: selected(id),
        onChange: () => {},
        onSubmit: (list: any[]) =>
          setNewFilters(id, title, list, filters, defaultFilters),
        onCancel: () => {},
        onClear: () => setNewFilters(id, title, [], filters),
      },
    });

    return [
      {
        key: 'name',
        dataIndex: 'name',
        title: 'ID & Name',
        width: '240px',
        sortable: true,
        sticky: 'left',
        columnFilterProps: colFilter('name', 'Name'),
        render: (_: any, r: IUserData) => (
          <Flex justify="space-between">
            <Flex vertical>
              <Label type="body4">{r.userId}</Label>
              <EllipsisWithTooltip
                text={r.name}
                onClick={() =>
                  navigate(`${r.userId}/${encodeURIComponent(r.name)}`)
                }
              />
            </Flex>
          </Flex>
        ),
      },
      {
        key: 'email',
        dataIndex: 'email',
        title: 'Email',
        width: '260px',
        sortable: true,
        columnFilterProps: colFilter('email', 'Email'),
        render: (v: string) => (
          <Tooltip title={v}>
            <span>{v}</span>
          </Tooltip>
        ),
      },
      {
        key: 'geography',
        dataIndex: 'geography',
        title: 'Geography',
        width: '160px',
        sortable: true,
        columnFilterProps: colFilter('region', 'Region'),
        render: (v: string) => <span>{v || 'Global'}</span>,
      },
      {
        key: 'attributes',
        dataIndex: 'attributes',
        title: 'Attribute Values',
        width: '380px',
        sortable: false,
        render: (attrs: IUserData['attributes']) => {
          if (!attrs || attrs.length === 0) return '-';
          return (
            <Flex wrap="wrap" gap={6}>
              {attrs.map(a => {
                const valueText = getAttributeValueText(a);
                if (!valueText) return null;
                const parts = valueText.split(',');
                const visible = parts.slice(0, 2).join(', ');
                const more = parts.length - 2;
                return (
                  <Tooltip key={a.AttributeId} title={valueText}>
                    <FilterChip
                            title={`${a.AttributeName}:`}
                            label={more > 0
                                ? `${visible} +${more} more`
                                : visible}
                            showCloseIcon={false} key={''}                    />
                  </Tooltip>
                );
              })}
            </Flex>
          );
        },
      },
      {
        key: 'isActive',
        dataIndex: 'isActive',
        title: 'Status',
        width: '120px',
        sortable: true,
        columnFilterProps: colFilter('isActive', 'Status'),
        render: (v: boolean) => (
          <Status
            size="S"
            text={v ? 'Active' : 'Inactive'}
            type={v ? 'Success' : 'Warning'}
          />
        ),
      },
    ];
  }, [filters, defaultFilters, navigate]);

  return (
    <Flex vertical className={styles['rm-container']} gap={24}>
      {/* Header */}
      <Flex justify="space-between" align="center">
           <Flex vertical gap={8}>
                  <Label type="body1">User Access</Label>
                  <Label type="body2">View all the list of Users who have access for this role</Label>
                </Flex>

        <SearchInput
          isAnimatedSearch
          menuButton
          menuButtonProps={{
            onClick: c => setSearchColumn(c.value),
            options: [
              { label: 'ID & Name', value: 'name' },
              { label: 'Email', value: 'email' },
            ],
            text: 'User',
          }}
          onChange={v => typeof v === 'string' && setSearchText(v)}
          placeholder="Search"
        />
      </Flex>

      {filters.length > 0 && (
        <AppliedFilters
          filters={filters}
          existingFilters={filters}
          defaultFilters={defaultFilters}
          setNewFilters={setNewFilters}
          onReset={() => setFilters([])}
        />
      )}

      <div className={styles['table-container']}>
        {loading && (
          <div className={styles['overlay']}>
            <AnimatedLoaders type="page" id={''} />
          </div>
        )}

        {!loading && searchText && userData.length === 0 && (
          <NoMatchesFound />
        )}

        <Table
          key={`role-users-${roleId}-${loading ? 'loading' : 'ready'}`}
          ref={tableRef}
          data={userData}
          columns={columns as any}
          sort={(order, column) => {
            if (order === 'unsort') return;
            const col = String(column);
            if (order !== sortDirection || col !== sortColumnName) {
              setSortColumnName(col);
              setSortDirection(order);
            }
          }}
          pagination={{
            totalItems: totalRows,
            pageSize,
            currentPage: pageNumber,
            onPageChange: setPageNumber,
            onPageSizeChange: setPageSize,
            blankOut: 10,
          }}
          className={styles['table-class']}
        />
      </div>

      {toastConfig.visible && (
        <Toast
          distance="x5l"
          message={toastConfig.message}
          mode="Top Right"
          onCloseToast={() =>
            setToastConfig({ ...toastConfig, visible: false })
          }
          toggle
          type={toastConfig.type}
          timer={5000}
        />
      )}
    </Flex>
  );
}

export default RoleUserManagementTable;
