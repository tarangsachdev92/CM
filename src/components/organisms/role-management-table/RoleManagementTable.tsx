import { Flex } from 'antd';
import { SearchInput, Toast } from 'konnect-react-components';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, fetchRoleData, RootState } from '../../../store';
import { convertOptions, removeElementByKey } from '../../../utils/helpers';
import { Label } from '../../atoms';
import { AppliedFilters } from '../../molecules';
import { FilterType } from '../../molecules/applied-filters/AppliedFilters';
import DataTable from '../../molecules/data-Table/DataTable';
import styles from './RoleManagementTable.module.scss';
import { IColumnFilterData } from '../../../types/response';
import {
  setCurrentPage,
  setCurrentPageSize,
  setSearchKeyword,
  setSortColumnName,
  setSortDirection,
  setSearchColumn,
} from '../../../store/slice/roleDataSlice';

type Props = {
  onRefreshDate?: (date: Date) => void;
};

function RoleManagementTable({ onRefreshDate }: Props) {
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [defaultFilters, setDefaultFilters] = useState<any>({
    role: [],
    function: [],
    rolelevel: [],
    department : [],
    subDepartment: [],
    region: [],
    market: [],
    site: [],
    isactive: [],
    usercount: [],
  });

  const [searchText, setSearchText] = useState('');
  const [appliedFilters, setAppliedFilters] =
    useState<IColumnFilterData[]>([]);

  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    message: string;
    type: 'Success' | 'Warning';
  }>({ visible: false, message: '', type: 'Success' });

  const dispatch = useDispatch<AppDispatch>();
  const {
    data: roleData,
    loading,
    columnFilters,
    paginationData,
    pageNumber,
    pageSize,
    searchKeyword,
    sortColumnName,
    sortDirection,
    searchColumn,
  } = useSelector((state: RootState) => state.roleData);

  const roles = roleData || [];
  const totalRows = paginationData?.totalRows ?? 0;

  useEffect(() => {
    const refreshDate =
      roles.length > 0 && (roles[0] as any)?.refreshDate
        ? new Date((roles[0] as any).refreshDate)
        : new Date();

    onRefreshDate?.(refreshDate);
  }, [roles, onRefreshDate]);

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(setCurrentPage(1));
      dispatch(setSearchKeyword(searchText));
    }, 500);

    return () => clearTimeout(t);
  }, [searchText, dispatch]);

  useEffect(() => {
    const applied: IColumnFilterData[] = [];

    filters.forEach(filter => {
      filter.selectedFilters.forEach(sel => {
        const columnMapping: Record<string, string> = {
        isactive: 'Status',
        roleLevel: 'Responsibility Level',
        department: 'Department',
        function: 'Function',
        subFunction: 'Sub-Function',
        geographyLevel: 'Geography Level',
      };
        applied.push({
          columnName: columnMapping[filter.id] || filter.id,
          columnValue: sel.label,
          id: String(sel.value),
        });
      });
    });

    setAppliedFilters(applied);
    dispatch(setCurrentPage(1));
  }, [filters, dispatch]);

  useEffect(() => {
    dispatch(
      fetchRoleData({
        pageNumber,
        pageSize,
        sortColumnName,
        sortDirection,
        searchKeyword,
        searchTerm: searchKeyword ? searchColumn : '',
        filters: appliedFilters,
        gridFilters: appliedFilters,
        userEmail: '',
        forumLevel: '',
        forumPeriod: '',
      }),
    );
  }, [
    dispatch,
    pageNumber,
    pageSize,
    sortColumnName,
    sortDirection,
    searchKeyword,
    searchColumn,
    appliedFilters,
  ]);

  const onRemoveFilter = (key: string, arr: FilterType[]) => {
    setFilters(removeElementByKey(arr, 'id', key));
    dispatch(setCurrentPage(1));
  };

  const setNewFilters = (
    filterName: string,
    filterTitle: string,
    newFiltersData: any[],
    existingFilters: FilterType[],
    defaultExistingFilters: any,
  ) => {
    let next = [...existingFilters];

    if (newFiltersData.length > 0) {
      const filter: FilterType = {
        id: filterName,
        title: filterTitle,
        selectedFilters: newFiltersData,
        defaultFilters: defaultExistingFilters[filterName],
        onClose: onRemoveFilter,
      };

      const idx = next.findIndex(f => f.id === filterName);
      if (idx === -1) next.push(filter);
      else next[idx] = filter;
    } else {
      next = next.filter(f => f.id !== filterName);
    }

    setFilters(next);
  };

  useEffect(() => {
    if (!columnFilters) return;

    setDefaultFilters({
      role: convertOptions(columnFilters.role, 'columnValue', 'id'),
      department: convertOptions(columnFilters.department, 'columnValue', 'id'),
      subDepartment: convertOptions(columnFilters.subdepartment, 'columnValue', 'id'),
      function: convertOptions(columnFilters.function, 'columnValue', 'id'),
      subFunction: convertOptions(columnFilters.subfunction, 'columnValue', 'id'),
      roleLevel: convertOptions(columnFilters.roleLevel, 'columnValue', 'id'),
      geographyLevel : convertOptions(columnFilters.region, 'columnValue', 'id'),
      usercount: convertOptions(
        columnFilters.usercount,
        'columnValue',
        'columnValue',
      ),
      isactive: convertOptions(
        columnFilters.isactive,
        'columnValue',
        'columnValue',
      ),
    });
  }, [columnFilters]);

  return (
    <Flex vertical className={styles['rm-container']} gap={24}>
      {/* Header */}
      <Flex justify="space-between">
        <Flex vertical gap={8}>
          <Label type="body1">
            <span className={styles['rm-card-title']}>
              View all Roles
            </span>
          </Label>
          <Label type="body2">
            <span className={styles['rm-card-description']}>
              Click on a role to view more details about it
            </span>
          </Label>
        </Flex>

        <div className={styles['search-box']}>
          <SearchInput
            isAnimatedSearch
            menuButton
            menuButtonProps={{
              onClick: c => dispatch(setSearchColumn(c.value)),
              options: [
                { label: 'Role', value: 'role' },
                { label: 'Function', value: 'function' },
                { label: 'Level', value: 'responsibilityLevel' },
                { label: 'Region', value: 'region' },
                { label: 'Market', value: 'market' },
                { label: 'Site', value: 'site' },
              ],
              text: searchColumn || 'Role',
            }}
            onChange={v =>
              typeof v === 'string' && setSearchText(v)
            }
            placeholder="Search"
            defaultValue={searchKeyword}
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

      <DataTable
              roleData={roleData}
              defaultFilters={defaultFilters}
              filtersData={columnFilters}
              existingFilters={filters}
              setNewFilters={setNewFilters}
              appliedFilters={appliedFilters}
              pageSize={pageSize}
              pageNumber={pageNumber}
              totalRows={totalRows}
              handlePageChange={p => dispatch(setCurrentPage(p))}
              handlePageSizeChange={s => dispatch(setCurrentPageSize(s))}
              handleSorting={(c, o) => {
                  dispatch(setSortColumnName(c));
                  dispatch(setSortDirection(o));
              } }
              searchText={searchText} loading={loading} refreshData={function (): void {
                  throw new Error('Function not implemented.');
              } }      />

      {toastConfig.visible && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          toggle
          onCloseToast={() =>
            setToastConfig({ ...toastConfig, visible: false })
          }
        />
      )}
    </Flex>
  );
}

export default RoleManagementTable;