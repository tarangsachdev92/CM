import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import DelegationDataTable from './DelegationDataTable';
import type { RootState, AppDispatch } from '../../../store';
import { fetchDelegationsNew } from '../../../store/thunks/delegationThunks';
import { setPaging } from '../../../store/slice/delegationSliceNew';
import DelegationDataTableNew from './DelegationDataTableNew';

export default function DelegationTableNew() {
    const dispatch = useDispatch<AppDispatch>();
    const { data, loading, totalRows, pageNumber, pageSize } = useSelector(
        (s: RootState) => s.delegationNew,
    );

    const refreshData = () => {
        // If you later implement server paging, pass { pageNumber, pageSize } here
        dispatch(fetchDelegationsNew({ pageNumber: pageNumber, pageSize: pageSize }));
    };

    useEffect(() => {
        refreshData();
    }, [pageNumber, pageSize]); // keep if you want UI paging to re-fetch

    return (
        <DelegationDataTableNew
            delegationData={data}
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalRows={totalRows}
            loading={loading}
            onPageChange={p => dispatch(setPaging({ pageNumber: p }))}
            onPageSizeChange={s => dispatch(setPaging({ pageSize: s }))}
            refreshData={() => dispatch(fetchDelegationsNew({ pageNumber, pageSize }))}
        />
    );
}
