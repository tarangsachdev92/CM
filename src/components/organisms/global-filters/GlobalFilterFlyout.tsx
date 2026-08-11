import { Flyout, Toast } from 'konnect-react-components';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getUserGlobalFilters, type AppDispatch } from '../../../store';
import { ApplyFilterGroup } from '../../../store/thunks/globalFilterApplyFilterGroup';
import type { FilterGroupRequest, IFilterGroupItem } from '../../../types/request';
import UserProfileSettingsGlobalFilters from '../user-profile-settings-global-fliter-section/UserProfileSettingsGlobalFilters';
import styles from './GlobalFilterFlyout.module.scss';

interface GlobalFilterFlyoutProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onCancelClick: () => void;
    isFilterEnabled: boolean;
    handleCheckboxChange: (checked: boolean) => void;
    isFilterGroupSelected: boolean;
    handleFilterGroupCheckboxChange: (checked: boolean, filterGroup: IFilterGroupItem) => void;
    selectedFilterGroups: FilterGroupRequest;
}

const GlobalFilterFlyout = ({
    isOpen,
    setIsOpen,
    onCancelClick,
    handleCheckboxChange,
    handleFilterGroupCheckboxChange,
}: GlobalFilterFlyoutProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const flyoutRef = useRef<HTMLDivElement>(null);

    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [childDirty, setChildDirty] = useState(false); // Apply enabled?
    const [childFilters, setChildFilters] = useState<FilterGroupRequest>({
        filterGroupJson: [],
        roleBasedJSON: [],
    });

    useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
                    setIsOpen(false);                    
                }
            };
    
            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            }
    
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [isOpen]);
    

    const handleApplyFilter = () => {
        if (!childDirty) return;
        setIsLoading(true);

        const uniqueFilterGroupJson = Array.from(
            new Map(
                (childFilters.filterGroupJson ?? []).map(item => [item.filterId, item]),
            ).values(),
        );
        dispatch(
            ApplyFilterGroup({
                filterGroupJson: uniqueFilterGroupJson,
                roleBasedJSON: childFilters.roleBasedJSON ?? [],
            }),
        ).finally(() => {
            setIsLoading(false);

            setToastMessage('Global Filters Applied.');
            setShowSuccessToast(true);
        });
        dispatch(getUserGlobalFilters());
    };

    const onClickOutsideFlyoutContainer = () => {
        if (isOpen) {
            setIsOpen(false);            
        }
    };

    useEffect(() => {
        
        const flyoutWrapper = document.getElementById('global-filter-flyout-container');
        if (!flyoutWrapper) return;

        const handleClick = (event: MouseEvent) => {            
            const target = event.target as HTMLElement;

            if (target.closest('[class^="flyout-container"]')) return;

            onClickOutsideFlyoutContainer();
        };

        flyoutWrapper.addEventListener('click', handleClick);
        return () => flyoutWrapper.removeEventListener('click', handleClick);
    }, [onClickOutsideFlyoutContainer]);

    return (
        <div className={styles['outer-container']}>
            <Flyout
                heading="Global Filters"
                subHeading="View and manage your pre-saved filters. Turn filters on/off to adjust displayed data or create a new filter."
                flyoutOpen={isOpen}
                iconForCancel={{ icon: 'x-close', onClick: onCancelClick }}
                iconForHeading="filter-funnel-01"
                dataTestId='global-filter-flyout-container'
                id='global-filter-flyout-container'
                primaryBtnProps={{
                    text: 'Apply Filter',
                    variant: 'Primary',
                    onClick: handleApplyFilter,
                    disabled: !childDirty, // was: !(isFilterEnabled || isFilterGroupSelected)
                    loading: isLoading,
                }}
                direction="right"
                content={
                    <UserProfileSettingsGlobalFilters
                        variant="flyout"
                        handleCheckboxChange={handleCheckboxChange}
                        handleFilterGroupCheckboxChange={handleFilterGroupCheckboxChange}
                        onDirtyChange={setChildDirty} // ➕ add
                        onFiltersSelected={setChildFilters}
                    />
                }
                cancelIconClick={() => setIsOpen(false)}
                // onBackDropClick={() => {
                //     setIsOpen(false);
                // }}
                className='global-filter-flyout-container-out'
            />

            {showSuccessToast && (
                <Toast
                    toggle={showSuccessToast}
                    type="Success"
                    message={toastMessage}
                    mode="Top Right"
                    distance="x5l"
                    onCloseToast={() => setShowSuccessToast(false)}
                    timer={3000}
                />
            )}
            {showErrorToast && (
                <Toast
                    toggle={showErrorToast}
                    type="Error"
                    message={toastMessage}
                    mode="Top Right"
                    distance="x5l"
                    onCloseToast={() => setShowErrorToast(false)}
                    timer={3000}
                />
            )}
        </div>
    );
};

export default GlobalFilterFlyout;
