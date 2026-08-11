import styles from './AppliedFilters.module.scss';
import { Label } from '../../atoms';
import { TagSelector } from 'konnect-react-components';

export type FilterType = {
    id: string;
    title: string;
    selectedFilters: Array<{ label: string; value: string }>;
    defaultFilters: Array<{ label: string; value: string }>;
    onClose: (key: string, arr: any[]) => void;
};

type Props = {
    onReset: () => void;
    filters: FilterType[];
    setNewFilters: (
        filterName: string,
        filterTitle: string,
        filterArray: Array<{ label: string; value: number }>,
        existingData: Array<FilterType>,
        defaultExistingFilters?: Array<FilterType['selectedFilters']>,
    ) => void;
    existingFilters: Array<FilterType>;
    defaultFilters: any;
};

function AppliedFilters({
    onReset,
    filters,
    setNewFilters,
    existingFilters,
    defaultFilters,
}: Props) {
    return (
        <div className={styles.container}>
            <div className={styles.filters}>
                <Label type="body3">
                    <span className={styles.filterLabel}>Applied Filters :</span>
                </Label>
                {filters.length > 0 &&
                    filters.map((filter: FilterType) => {
                        return (
                            <>
                                <div key={filter.title} className={styles['space-h-8']} />
                                <TagSelector
                                    confirmSelection={{
                                        onApply: (selectedList: any) => {
                                            setNewFilters(
                                                filter.id,
                                                filter.title,
                                                selectedList,
                                                existingFilters,
                                                defaultFilters,
                                            );
                                        },
                                        onCancel: () => {},
                                    }}
                                    dataTestId="dropd-down"
                                    filterChipProps={{
                                        showTooltip: false,
                                        title: filter.title + ' : ',
                                        onClose: () => filter.onClose(filter.id, filters),
                                    }}
                                    filterChipVariant
                                    id="drop-down"
                                    onChange={() => {}}
                                    options={defaultFilters[filter.id]}
                                    searchInput={{
                                        searchPlaceholder: 'Search',
                                        searchSize: 'L',
                                        searchWholeString: true,
                                    }}
                                    selectedOptions={filter.selectedFilters}
                                    showSelectAll
                                    size="L"
                                    type="checkbox"
                                    portal={true}
                                />
                            </>
                        );
                    })}
            </div>
            <div onClick={onReset}>
                <Label type="body2">
                    <span className={styles.filterReset}>Reset</span>
                </Label>
            </div>
        </div>
    );
}

export default AppliedFilters;
