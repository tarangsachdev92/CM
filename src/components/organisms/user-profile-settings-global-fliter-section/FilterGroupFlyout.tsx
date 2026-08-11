import React, { useEffect, useState } from 'react';
import { Flyout, DropDown, InputField, Icon } from 'konnect-react-components';
import { ExpandableForm } from '../../../components';
import styles from './UserProfileSettingsGlobalFilters.module.scss';
import { Flex } from 'antd';
import { IoMdInformationCircleOutline } from 'react-icons/io';

type Option = { label: string; value: string };

type DropdownConfig = {
    label: string;
    isDisabled: boolean;
    options: Option[];
    selectedOptions: Option[];
    setSelected: (value: Option[]) => void;
    onChangeExtra?: () => void;
};

type FilterGroupFlyoutProps = {
    isOpen: boolean;
    isEditMode: boolean;
    filterGroupName: string;
    dropdowns: Record<string, Option[]>;
    selected: Record<string, Option[]>;
    onClose: () => void;
    onReset: () => void;
    onSave: () => Promise<{ success: boolean; error?: string }>;
    onFilterGroupNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    renderDropdowns: (configs: DropdownConfig[], loading: boolean) => React.ReactNode;
    openFilterSections: Record<'geography' | 'product' | 'customer', boolean>;
    toggleFilterSection: (section: 'geography' | 'product' | 'customer') => void;
    geographyDropdowns: DropdownConfig[];
    productHierarchyDropdowns: DropdownConfig[];
    customerHierarchyDropdowns: DropdownConfig[];
    mode: string;
    onBackDropClickForFlyout: () => void;
    selectedFinancialCycle: Option[];
    setSelectedFinancialCycle: (value: Option[]) => void;
    nameError?: string;
    filterError?: string;

    geoLoading?: boolean;
    productLoading?: boolean;
    customerLoading?: boolean;
};

const FilterGroupFlyout: React.FC<FilterGroupFlyoutProps> = ({
    isOpen,
    filterGroupName,
    dropdowns,
    selected,
    onClose,
    onReset,
    onSave,
    onFilterGroupNameChange,
    renderDropdowns,
    openFilterSections,
    toggleFilterSection,
    geographyDropdowns,
    productHierarchyDropdowns,
    customerHierarchyDropdowns,
    mode,
    // onBackDropClickForFlyout,
    selectedFinancialCycle,
    setSelectedFinancialCycle,
    nameError = '',
    filterError = '',

    geoLoading,
    productLoading,
    customerLoading,
}) => {
    const [initialFilterGroupName, setInitialFilterGroupName] = useState(filterGroupName);
    const [initialSelected, setInitialSelected] = useState<Record<string, Option[]>>({});
    const [initialFinancialCycle, setInitialFinancialCycle] = useState<Option[]>([]);
    const [isSaveDisabled, setIsSaveDisabled] = useState(true);
    const [isSubmittingFilterGroup, setIsSubmittingFilterGroup] = useState(false);

    const validateAndSubmitFilterGroup = async () => {
        setIsSubmittingFilterGroup(true);
        const result = await onSave();
        setIsSubmittingFilterGroup(false);
        if (!result.success) {
            setIsSaveDisabled(true);
        }
    };

    const isAnyTopLevelSelected = () =>
        // Geography
        (selected.region?.length ?? 0) > 0 ||
        (selected.cluster?.length ?? 0) > 0 ||
        (selected.market?.length ?? 0) > 0 ||
        (selected.site?.length ?? 0) > 0 ||
        (selected.siteCode?.length ?? 0) > 0 ||
        // Product Hierarchy
        (selected.segment?.length ?? 0) > 0 ||
        (selected.category?.length ?? 0) > 0 ||
        (selected.brand?.length ?? 0) > 0 ||
        (selected.subBrand?.length ?? 0) > 0 ||
        (selected.sku?.length ?? 0) > 0 ||
        // New product fields
        //   (selected.needStates?.length ?? 0) > 0 ||
        (selected.subCategoryId?.length ?? 0) > 0 ||
        (selected.masterCodeId?.length ?? 0) > 0 ||
        (selected.rootCodeId?.length ?? 0) > 0 ||
        (selected.variantId?.length ?? 0) > 0 ||
        // Customer
        (selected.channel?.length ?? 0) > 0 ||
        (selected.customer?.length ?? 0) > 0 ||
        (selected.shipCustomer?.length ?? 0) > 0 ||
        (selected.soldCustomer?.length ?? 0) > 0;

    useEffect(() => {
        setIsSubmittingFilterGroup(false);
    }, [selected, selectedFinancialCycle]);

    useEffect(() => {
        if (isOpen && mode === 'edit') {
            setInitialFilterGroupName(filterGroupName);
            setInitialSelected(selected);
            setInitialFinancialCycle(selectedFinancialCycle);
            setIsSaveDisabled(true);
        }
    }, [isOpen, mode]);

    useEffect(() => {
        if (mode === 'edit') {
            const hasChanged =
                filterGroupName.trim() !== initialFilterGroupName.trim() ||
                Object.keys(selected).some(
                    key =>
                        JSON.stringify(selected[key] ?? []) !==
                        JSON.stringify(initialSelected[key] ?? []),
                ) ||
                JSON.stringify(selectedFinancialCycle ?? []) !==
                    JSON.stringify(initialFinancialCycle ?? []);

            setIsSaveDisabled(!hasChanged || !isAnyTopLevelSelected());
        }
    }, [filterGroupName, selected, selectedFinancialCycle, mode]);

    useEffect(() => {
        if (mode !== 'edit') return;
        const hasNameChanged = filterGroupName.trim() !== initialFilterGroupName.trim();
        const hasDropdownsChanged = Object.keys(selected).some(
            key =>
                JSON.stringify(selected[key] ?? []) !== JSON.stringify(initialSelected[key] ?? []),
        );
        const hasFinancialCycleChanged =
            JSON.stringify(selectedFinancialCycle ?? []) !==
            JSON.stringify(initialFinancialCycle ?? []);

        const hasAnyChange = hasNameChanged || hasDropdownsChanged || hasFinancialCycleChanged;
        const isNameBlank = filterGroupName.trim() === '';

        setIsSaveDisabled(!hasAnyChange || isNameBlank);
    }, [filterGroupName, selected, selectedFinancialCycle, mode]);

    useEffect(() => {
        if (mode === 'add') {
            const hasValidName = filterGroupName.trim().length > 0;
            setIsSaveDisabled(!hasValidName);
        }
    }, [filterGroupName, mode, selected]);

    useEffect(() => {
        if (!isOpen) {
            onReset();
        }
    }, [isOpen]);

    const handleDismissWithoutSave = () => {
        onReset();
        onClose();
    };
    return (
        <Flex className={styles['outer-container']}>
            <Flyout
                flyoutOpen={isOpen}
                direction="right"
                cancelIconClick={handleDismissWithoutSave}
                iconForCancel={{ icon: 'x-close', onClick: handleDismissWithoutSave }}
                heading={
                    mode === 'add'
                        ? 'Add New Filter Group'
                        : mode === 'edit'
                          ? 'Edit Filter Group'
                          : ''
                }
                iconForHeading="filter-funnel-01"
                id="role-selection-flyout"
                primaryBtnProps={{
                    text: 'Save',
                    onClick: validateAndSubmitFilterGroup,
                    disabled: isSaveDisabled || isSubmittingFilterGroup,
                    loading: isSubmittingFilterGroup,
                    size: 'L',
                }}
                secondaryBtnProps={{
                    text: 'Reset',
                    onClick: onReset,
                    disabled: false,
                    loading: false,
                    variant: 'Secondary',
                }}
                cancelBtnProps={{
                    text: 'Cancel',
                    onClick: handleDismissWithoutSave,
                    disabled: false,
                    loading: false,
                    variant: 'Secondary',
                }}
                content={
                    <div className={styles.container}>
                        {filterError && (
                            <div className={styles['custom-message']}>
                                <IoMdInformationCircleOutline className={styles['info-icon']} />
                                <span className={styles['message']}>{filterError}</span>
                            </div>
                        )}
                        <div className={styles['flyout-labels']}>
                            <InputField
                                label="Filter Group Name"
                                placeholder="Enter Filter Group Name"
                                value={filterGroupName}
                                required
                                onChange={onFilterGroupNameChange}
                                {...(nameError && {
                                    captionIcon: 'alert-circle',
                                    captionMessage: nameError,
                                    captionMessageType: 'error',
                                })}
                            />
                            <div className={styles['space-v-16']} />
                            <DropDown
                                className="drop-down"
                                dataTestId="dropd-down"
                                id="drop-down"
                                dropdown={{
                                    label: 'Financial Cycle',
                                    type: 'radio',
                                    isDisabled: false,
                                    isLabelInline: false,
                                    reset: false,
                                    required: false,
                                    placeholder: 'Select Financial Cycle',
                                    size: 'L',
                                    selectedOptions: selectedFinancialCycle,
                                    options: (dropdowns.financialCycle ?? []).map(cycle => ({
                                        label: cycle.label,
                                        value: cycle.value,
                                    })),
                                    onChange: option => {
                                        const value = option ? [option] : [];
                                        setSelectedFinancialCycle(value);
                                    },
                                }}
                                searchInput={{
                                    searchPlaceholder: 'Search',
                                    menuButton: false,
                                    menuButtonText: 'Button',
                                    searchSize: 'L',
                                    searchWholeString: true,
                                }}
                            />
                            {(['geography', 'product', 'customer'] as const).map(section => (
                                <ExpandableForm
                                    key={section}
                                    isOpen={openFilterSections[section]}
                                    description=""
                                    title={
                                        <span>
                                            {section === 'product'
                                                ? 'Product Hierarchy'
                                                : section.charAt(0).toUpperCase() +
                                                  section.slice(1)}
                                        </span>
                                    }
                                    content={
                                        <div>
                                            {renderDropdowns(
                                                section === 'geography'
                                                    ? geographyDropdowns
                                                    : section === 'product'
                                                      ? productHierarchyDropdowns
                                                      : customerHierarchyDropdowns,
                                                section === 'geography'
                                                    ? (geoLoading ?? false)
                                                    : section === 'product'
                                                      ? (productLoading ?? false)
                                                      : (customerLoading ?? false),
                                            )}
                                        </div>
                                    }
                                    onClick={() => toggleFilterSection(section)}
                                    additionalContentInTitleContainer={
                                        <Icon
                                            name={
                                                openFilterSections[section]
                                                    ? 'chevron-up'
                                                    : 'chevron-down'
                                            }
                                            size="l"
                                            color="neutrals-B800"
                                        />
                                    }
                                    applyCustomSpacing
                                />
                            ))}
                        </div>
                    </div>
                }
                onBackDropClick={handleDismissWithoutSave}
            />
        </Flex>
    );
};

export default FilterGroupFlyout;
