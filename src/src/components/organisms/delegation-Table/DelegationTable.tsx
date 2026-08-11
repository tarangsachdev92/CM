import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DelegationDataTable from './DelegationDataTable';
import type { RootState, AppDispatch } from '../../../store';
import { fetchDelegations } from '../../../store/thunks/delegationThunks';
import { setPaging } from '../../../store/slice/delegationSlice';

export default function DelegationTable() {
    const dispatch = useDispatch<AppDispatch>();
    const { data, loading, totalRows, pageNumber, pageSize } = useSelector(
        (s: RootState) => s.delegation,
    );

    const refreshData = () => {
        // If you later implement server paging, pass { pageNumber, pageSize } here
        dispatch(fetchDelegations({ pageNumber: pageNumber, pageSize: pageSize }));
    };

    useEffect(() => {
        refreshData();
    }, [pageNumber, pageSize]); // keep if you want UI paging to re-fetch

    return (
        <DelegationDataTable
            delegationData={data}
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalRows={totalRows}
            loading={loading}
            onPageChange={p => dispatch(setPaging({ pageNumber: p }))}
            onPageSizeChange={s => dispatch(setPaging({ pageSize: s }))}
            refreshData={() => dispatch(fetchDelegations({ pageNumber, pageSize }))}
        />
    );
}
