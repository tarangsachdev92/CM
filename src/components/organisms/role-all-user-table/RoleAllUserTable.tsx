import { Flex, Tooltip } from 'antd';
import {
  AnimatedLoaders,
  FilterChip,
  SearchInput,
  Status,
  Table,
} from 'konnect-react-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { AppDispatch, fetchAllUserData, RootState } from '../../../store';
import { convertOptions, removeElementByKey } from '../../../utils/helpers';
import { EllipsisWithTooltip, Label } from '../../atoms';
import { AppliedFilters } from '../../molecules';
import { FilterType } from '../../molecules/applied-filters/AppliedFilters';
import styles from './RoleAllUserTable.module.scss';
import {
  IColumnFilterData,
  IUserData,
  IUserFiltersData,
} from '../../../types/response';
import { NoMatchesFound } from '../../../assets/images/images';

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
  primaryRole: 'rolename',
  region: 'geographyLevel',
  isActive: 'status',
};

const getFilterColumnName = (columnName: string) =>
  filterColumnNames[columnName] ?? columnName;

const getAttributeValueText = (
  attribute: NonNullable<IUserData['attributes']>[number],
) =>
  attribute.AttributeValueNames || attribute.AttributeValueIds || '';

function AllUserTable() {
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [defaultFilters, setDefaultFilters] = useState<any>({
    name: [],
    email: [],
    primaryRole: [],
    region: [],
    isActive: [],
  });

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchColumn, setSearchColumn] = useState<'name' | 'email'>('name');

  const [sortColumnName, setSortColumnName] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | 'unsort'>(
    'asc',
  );

  const [appliedFilters, setAppliedFilters] = useState<IColumnFilterData[]>([]);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const tableRef = useRef<any>(null);

  const { users, pagination, columnFilters } = useSelector(
    (state: RootState) => state.userData,
  );

  const userData: IUserData[] = Array.isArray(users) ? users : [];
  const totalRows = pagination?.totalRows ?? 0;

  useEffect(() => {
    setPageNumber(1);
    const t = setTimeout(() => setSearchKeyword(searchText), 500);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
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

    setAppliedFilters(applied);
    setPageNumber(1);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        await dispatch(
          fetchAllUserData({
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
          }),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
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
  ]);

  useEffect(() => {
    const f: Partial<IUserFiltersData> = columnFilters || {};
    setDefaultFilters({
      name: convertOptions(f.name || [], 'columnValue', 'id'),
      email: toFilterOptions(f.email || [], 'UserEmail'),
      primaryRole: toFilterOptions(f.primaryRole || [], 'PrimaryRoleName'),
      region: convertOptions(f.geography || [], 'columnValue', 'id'),
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
    setFilters(next);
  };

  const columns = useMemo(() => {
    const selected = (id: string) =>
      filters.find(f => f.id === id)?.selectedFilters ?? [];

    const colProps = (id: string, title: string) => ({
      sortColumnOptions: true,
      pinColumnOptions: true,
      hideColumnOption: true,
      manageColumns: { onSubmit: () => {}, onCancel: () => {} },
      filter: {
        options: defaultFilters[id] ?? [],
        selectedOptions: selected(id),
        onChange: () => {},
        onSubmit: (l: any[]) =>
          setNewFilters(id, title, l, filters, defaultFilters),
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
        columnFilterProps: colProps('name', 'Name'),
        render: (_: any, r: IUserData) => (
          <Flex vertical>
            <Label type="body4">{r.userId}</Label>
            <EllipsisWithTooltip
              text={r.name}
              onClick={() =>
                navigate(`${r.userId}/${encodeURIComponent(r.name)}`)
              }
            />
          </Flex>
        ),
      },
      {
        key: 'email',
        dataIndex: 'email',
        title: 'Email',
        width: '260px',
        sortable: true,
        columnFilterProps: colProps('email', 'Email'),
        render: (v: string) => (
          <Tooltip title={v}>
            <span>{v}</span>
          </Tooltip>
        ),
      },
      {
        key: 'primaryRole',
        dataIndex: 'primaryRole',
        title: 'Primary Role',
        width: '200px',
        sortable: true,
        columnFilterProps: colProps('primaryRole', 'Primary Role'),
      },
      {
        key: 'geography',
        dataIndex: 'geography',
        title: 'Geography',
        width: '160px',
        sortable: true,
        columnFilterProps: colProps('region', 'Region'),
        render: (g: string) => <span>{g || 'Global'}</span>,
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
                const v = valueText.split(',');
                const visible = v.slice(0, 2).join(', ');
                const rest = v.length - 2;
                return (
                  <Tooltip key={a.AttributeId} title={valueText}>
                    <FilterChip
                            title={`${a.AttributeName}:`}
                            label={rest > 0 ? `${visible} +${rest} more` : visible}
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
        sticky: 'right',
        columnFilterProps: colProps('isActive', 'Status'),
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
      <Flex justify="space-between" align="center">
        <Flex vertical gap={8}>
          <Label type="body1">All Users</Label>
          <Label type="body2">View all users in the system</Label>
        </Flex>

        <div className={styles['search-box']}>
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
        </div>
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

        {!loading && searchText && userData.length === 0 && <NoMatchesFound />}

        <Table
          ref={tableRef}
          data={userData}
          columns={columns as any}
          sort={(order, column) => {
            if (order === 'unsort') return;
            const col = String(column);
            if (order !== sortDirection || col !== sortColumnName) {
              setSortColumnName(col);
              setSortDirection(order);
              setPageNumber(1);
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
    </Flex>
  );
}

export default AllUserTable;
