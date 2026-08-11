import React, { useCallback, useEffect, useRef } from 'react';
import { Flyout, DropDown, IconButton } from 'konnect-react-components';
import styles from './AppsAndReportsLandingPage.module.scss';
import { Flex } from 'antd';

import { AppDispatch } from '../../../store';
import { useTranslation } from 'react-i18next';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    setIsOpen: (open: boolean) => void;

    regionDD: { label: string; value: number }[];
    functionDD: { label: string; value: number }[];
    subfunctionDD: { label: string; value: number }[];
    reportTypeDD: { label: string; value: number }[];

    selectedRegion: { label: string; value: number }[];
    setSelectedRegion: React.Dispatch<React.SetStateAction<{ label: string; value: number }[]>>;

    selectedFunction: { label: string; value: number }[];
    setSelectedFunction: React.Dispatch<React.SetStateAction<{ label: string; value: number }[]>>;

    selectedSubfunction: { label: string; value: number }[];
    setSelectedSubfunction: React.Dispatch<
        React.SetStateAction<{ label: string; value: number }[]>
    >;
    setIsFavoriteClicked: React.Dispatch<React.SetStateAction<boolean>>;
    selectedReportType: { label: string; value: number }[];
    setSelectedReportType: React.Dispatch<React.SetStateAction<{ label: string; value: number }[]>>;

    setSubfunctionDD: React.Dispatch<React.SetStateAction<{ label: string; value: number }[]>>;
    setSelectedCategory: React.Dispatch<React.SetStateAction<'App' | 'Report'>>;

    previousFilterSelection: {
        region: { label: string; value: number }[];
        function: { label: string; value: number }[];
        subFunction: { label: string; value: number }[];
        reportType: { label: string; value: number }[];
    };
    setPreviousFilterSelection: React.Dispatch<
        React.SetStateAction<{
            region: { label: string; value: number }[];
            function: { label: string; value: number }[];
            subFunction: { label: string; value: number }[];
            reportType: { label: string; value: number }[];
        }>
    >;

    searchTerm: string;
    currentPage: number;
    pageSize: number;
    isFavoriteClicked: boolean;
    selectedCategory: string;

    dispatch: AppDispatch;
    setFilterRenderKey: React.Dispatch<React.SetStateAction<number>>;
    setAppliedFilters: React.Dispatch<
        React.SetStateAction<{
            region: { label: string; value: number }[];
            function: { label: string; value: number }[];
            subFunction: { label: string; value: number }[];
            reportType: { label: string; value: number }[];
        }>
    >;
    syncSelectedToAppliedFilters: () => void;
}

const FilterFlyout: React.FC<Props> = ({
    isOpen,
    setIsOpen,
    onClose,
    regionDD,
    functionDD,
    subfunctionDD,
    reportTypeDD,
    selectedRegion,
    setSelectedRegion,
    selectedFunction,
    setSelectedFunction,
    selectedSubfunction,
    setSelectedSubfunction,
    selectedReportType,
    setSelectedReportType,
    previousFilterSelection,
    setPreviousFilterSelection,
    setSelectedCategory,
    setFilterRenderKey,
    setAppliedFilters,
    syncSelectedToAppliedFilters,
}) => {
    const { t } = useTranslation('digital-tools-library', { useSuspense: false });
    const flyoutRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // If clicking inside the flyout, ignore the event
            if (flyoutRef.current?.contains(target)) return;

            // If clicking on interactive elements inside flyout (input, dropdowns, buttons), ignore
            if (target.closest('.flyout-container, button, .drop-down')) return;

            // Otherwise, close the flyout
            setIsOpen(false);
            setSelectedRegion(previousFilterSelection.region);
            setSelectedFunction(previousFilterSelection.function);
            setSelectedSubfunction(previousFilterSelection.subFunction);
            setSelectedReportType(previousFilterSelection.reportType);
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const popupBody = useCallback(() => {
        return (
            <div className={styles.container}>
                <div className={styles['flyout-labels']}>
                    <DropDown
                        className="drop-down"
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: false,
                            isLabelInline: false,
                            label: t('filters.region'),
                            onChange: (_option, _checked: boolean, tree: object[]) => {
                                const selectedTree = tree as { label: string; value: number }[];
                                setSelectedRegion(selectedTree);
                            },
                            options: regionDD.map(item => ({
                                label: item.label,
                                value: String(item.value),
                            })),
                            placeholder: t('filters.selectRegion'),
                            required: false,
                            reset: false,
                            showSelectAll: true,
                            selectAllOption: {
                                label: 'ALL',
                                value: 'all',
                            },
                            selectedOptions: selectedRegion.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        dropdownOptionsClassName="dropdown-options-custom"
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: t('search'),
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                    />
                    <DropDown
                        className="drop-down"
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: false,
                            isLabelInline: false,
                            label: t('filters.function'),
                            onChange: (_option, _checked: boolean, tree: object[]) => {
                                const selectedTree = tree as { label: string; value: number }[];
                                setSelectedFunction(selectedTree);
                            },
                            options: functionDD.map(item => ({
                                label: item.label,
                                value: String(item.value),
                            })),
                            placeholder: t('filters.selectFunction'),
                            required: false,
                            reset: false,
                            showSelectAll: true,
                            selectAllOption: {
                                label: 'ALL',
                                value: 'all',
                            },
                            selectedOptions: selectedFunction.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        dropdownOptionsClassName="dropdown-options-custom"
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: t('search'),
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                    />
                    <DropDown
                        className="drop-down"
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: false,
                            isLabelInline: false,
                            label: t('filters.subFunction'),
                            onChange: (_option, _checked: boolean, tree: object[]) => {
                                const selectedTree = tree as { label: string; value: number }[];
                                setSelectedSubfunction(selectedTree);
                            },
                            options: subfunctionDD.map(item => ({
                                label: item.label,
                                value: String(item.value),
                            })),
                            placeholder: t('filters.selectSubFunction'),
                            required: false,
                            reset: false,
                            showSelectAll: true,
                            selectAllOption: {
                                label: 'ALL',
                                value: 'all',
                            },
                            selectedOptions: selectedSubfunction.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        dropdownOptionsClassName="dropdown-options-custom"
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: t('search'),
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                    />
                    <DropDown
                        className="drop-down"
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: false,
                            isLabelInline: false,
                            label: t('filters.reportType'),
                            onChange: (_option, _checked: boolean, tree: object[]) => {
                                const selectedTree = tree as { label: string; value: number }[];
                                setSelectedReportType(selectedTree);
                            },
                            options: reportTypeDD.map(item => ({
                                label: item.label,
                                value: String(item.value),
                            })),
                            placeholder: t('filters.selectReportType'),
                            required: false,
                            reset: false,
                            showSelectAll: true,
                            selectAllOption: {
                                label: 'ALL',
                                value: 'all',
                            },
                            selectedOptions: selectedReportType.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        dropdownOptionsClassName="dropdown-options-custom"
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: t('search'),
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                    />
                    <div className={styles['space-v-16']} />
                </div>
            </div>
        );
    }, [
        regionDD,
        selectedRegion,
        functionDD,
        subfunctionDD,
        selectedFunction,
        selectedSubfunction,
        reportTypeDD,
        selectedReportType,
        t,
    ]);

    const getCustomActionsForFiltersFlyout = () => (
        <Flex justify="space-between" align="center" className={styles['custom-action-container']}>
            <span className={styles['header']}>{t('filters.title')}</span>
            <Flex justify="flex-end" gap="16px">
                <IconButton
                    icon="x-close"
                    onClick={() => {
                        setIsOpen(false);
                        setSelectedRegion(previousFilterSelection.region);
                        setSelectedFunction(previousFilterSelection.function);
                        setSelectedSubfunction(previousFilterSelection.subFunction);
                        setSelectedReportType(previousFilterSelection.reportType);
                    }}
                    size="Tiny"
                />
            </Flex>
        </Flex>
    );

    const handleApplyFilter = () => {
        // Determine selectedCategory based on selectedReportType
        if (selectedReportType.length === 1) {
            const label = selectedReportType[0]?.label;
            if (label === 'App' || label === 'Report') {
                setSelectedCategory(label);
            } else {
                setSelectedCategory('App'); // or 'Report' as fallback
            }
        } else {
            setSelectedCategory('App'); // or 'Report' as fallback
        }
        setAppliedFilters({
            region: selectedRegion,
            function: selectedFunction,
            subFunction: selectedSubfunction,
            reportType: selectedReportType,
        });

        setPreviousFilterSelection({
            region: selectedRegion,
            function: selectedFunction,
            subFunction: selectedSubfunction,
            reportType: selectedReportType,
        });
        setFilterRenderKey(prev => prev + 1);
        setIsOpen(false);
    };

    return (
        <div className={styles['outer-container']}>
            <Flyout
                heading={''}
                flyoutOpen={isOpen}
                direction="right"
                cancelIconClick={onClose}
                primaryBtnProps={{
                    text: t('filters.applyFilter'),
                    onClick: () => {
                        handleApplyFilter();
                        syncSelectedToAppliedFilters();
                        setIsOpen(false);
                    },
                    disabled:
                        selectedRegion.length === 0 &&
                        selectedFunction.length === 0 &&
                        selectedSubfunction.length === 0 &&
                        selectedReportType.length === 0,
                    loading: false,
                }}
                secondaryBtnProps={{
                    text: t('filters.reset'),
                    onClick: () => {
                        // Reset filters
                        setSelectedRegion([]);
                        setSelectedFunction([]);
                        setSelectedSubfunction([]);
                        setSelectedReportType([]);
                    },
                    loading: false,
                    variant: 'Secondary',
                }}
                content={popupBody()}
                id="role-selection-flyout"
                containerMaxWidth="20rem"
                customActions={getCustomActionsForFiltersFlyout()}
            />
        </div>
    );
};

export default FilterFlyout;
