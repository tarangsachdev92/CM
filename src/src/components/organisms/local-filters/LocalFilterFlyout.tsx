import { AnimatedLoaders, DropDown, Flyout } from 'konnect-react-components';
import styles from './LocalFilterFlyout.module.scss';
import { useEffect, useRef, useState } from 'react';
import { Flex } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { setLocalFilters } from '../../../store/slice/localFilterSlice';
import { BusinessUnitLocalFilter, LineLocalFilter } from '../../../store/thunks/localFilterData';
interface LocalFilterFlyoutProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onCancelClick: () => void;
}

const LocalFilterFlyout = ({
    isOpen,
    setIsOpen,
    onCancelClick,
}: LocalFilterFlyoutProps) => {
    const flyoutRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch<AppDispatch>();
    const [lineSearchTerm, setLineSearchTerm] = useState('');
    const [buSearchTerm, setBuSearchTerm] = useState('');

    const filterAttributes = useSelector((state: RootState) => state.localFilter);
    const businessUnit = filterAttributes.buData;
    const line = filterAttributes.lineData;

    const [isBuLoading, setIsBuLoading] = useState(false);
    const [isLineLoading, setIsLineLoading] = useState(false);

    const [selectedFilters, setSelectedFilters] = useState<
        Record<string, { label: string; value: string }[]>
    >({});

    const saveSelectedFilter = () => {
        dispatch(setLocalFilters(selectedFilters));
        setIsOpen(false);
    };

    useEffect(() => {
        setSelectedFilters(filterAttributes.selectedLocalFilters);
    }, [filterAttributes.selectedLocalFilters]);

    useEffect(() => {
        if (!lineSearchTerm.trim()) return;

        setIsLineLoading(true);
        const delay = setTimeout(async () => {
            await dispatch(LineLocalFilter(lineSearchTerm));
            setIsLineLoading(false);
        }, 2000);

        return () => clearTimeout(delay);
    }, [lineSearchTerm, dispatch]);

    useEffect(() => {
        if (!buSearchTerm.trim()) return;

        setIsBuLoading(true);
        const delay = setTimeout(async () => {
            await dispatch(BusinessUnitLocalFilter(buSearchTerm));
            setIsBuLoading(false);
        }, 2000);

        return () => clearTimeout(delay);
    }, [buSearchTerm, dispatch]);

    return (
        <div className={styles['outer-container']} ref={flyoutRef}>
            <Flyout
                heading="Local Filters"
                subHeading="View and manage your pre-saved filters. Turn filters on/off to adjust displayed data or create a new filter."
                flyoutOpen={isOpen}
                iconForCancel={{ icon: 'x-close', onClick: onCancelClick }}
                iconForHeading="filter-lines"
                primaryBtnProps={{
                    text: 'Apply Filter',
                    variant: 'Primary',
                    onClick: saveSelectedFilter,
                    disabled: false,
                    loading: isBuLoading || isLineLoading,
                }}
                direction="right"
                content={
                    <Flex vertical gap={16} className={styles['outer-container-dropdown']}>
                        <DropDown
                            id="business-unit"
                            className={styles.dropdownField}
                            dropdown={{
                                label: 'Business Unit',
                                options: businessUnit || [],
                                reset: false,
                                placeholder: 'Select',
                                required: false,
                                size: 'L',
                                type: 'checkbox',
                                onChange: (_option, _checked, tree) => {
                                    setSelectedFilters(prev => ({
                                        ...prev,
                                        businessUnit: tree,
                                    }));
                                },
                                selectedOptions: selectedFilters?.businessUnit || [],
                                showSelectAll: false,
                                onSearch: (value: string) => setBuSearchTerm(value),
                            }}
                            searchInput={{
                                searchPlaceholder: 'Search',
                                searchSize: 'L',
                                searchWholeString: true,
                            }}
                        />

                        <DropDown
                            id="line"
                            className={styles.dropdownField}
                            dropdown={{
                                label: 'Line',
                                options: line || [],
                                reset: false,
                                placeholder: 'Select',
                                required: false,
                                size: 'L',
                                type: 'checkbox',
                                onChange: (_option, _checked, tree) => {
                                    setSelectedFilters(prev => ({
                                        ...prev,
                                        line: tree,
                                    }));
                                },
                                selectedOptions: selectedFilters?.line || [],
                                showSelectAll: false,
                                onSearch: (value: string) => setLineSearchTerm(value),
                            }}
                            searchInput={{
                                searchPlaceholder: 'Search',
                                searchSize: 'L',
                                searchWholeString: true,
                            }}
                        />

                        <div className={styles['loader-section']}>
                            {(isBuLoading || isLineLoading) && (
                                <AnimatedLoaders
                                    id="page-loader"
                                    text="Loading"
                                    type="page"
                                     className={styles['loader']}
                                />
                            )}
                        </div>

                    </Flex>
                }
                cancelIconClick={() => setIsOpen(false)}
                onBackDropClick={() => setIsOpen(false)}
            />
        </div>
    );
};

export default LocalFilterFlyout;
