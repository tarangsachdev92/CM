import React, { useCallback } from 'react';
import styles from './ToolPersonaEditCard.module.scss';
import { Icon, DropDown } from 'konnect-react-components';
import type { OptionType } from '../../../types/common';
import { Flex } from 'antd';

export interface PersonaCardProps {
    title: string;
    description: string;
    adGroupOptions: OptionType[];
    selectedAdGroup: OptionType[];
    onAdGroupChange: (option: OptionType) => void;

    dataAccessOptions: OptionType[];
    selectedDataAccess: OptionType[];
    onDataAccessChange: (option: OptionType) => void;
    toolType?: string;
    roles?: number;
    isLeadership?: boolean;
    isViewer?: boolean;
    onRolesClick?: () => void;

    onEdit?: () => void;
    onDelete?: () => void;
}

const PersonaCard: React.FC<PersonaCardProps> = ({
    title,
    description,
    adGroupOptions,
    selectedAdGroup,
    onAdGroupChange,
    dataAccessOptions,
    selectedDataAccess,
    onDataAccessChange,
    toolType,
    roles,
    onRolesClick,
    isLeadership = false,
    isViewer = false,
    onEdit,
    onDelete,
}) => {

    const isDisabled = isLeadership;
    const isDisabledEditDelete = isLeadership || isViewer;
    const iconClass = `${styles.iconBtn} ${isDisabledEditDelete ? styles.disabled : ''}`;

    const handleDeleteClick = useCallback(() => {
        if (!isDisabledEditDelete) onDelete?.();
    }, [isDisabledEditDelete, onDelete]);

    const handleEditClick = useCallback(() => {
        if (!isDisabledEditDelete) onEdit?.();
    }, [isDisabledEditDelete, onEdit]);

    const handleRoleClick = useCallback(() => {
        if (!isDisabled) onRolesClick?.();
    }, [isDisabled, onRolesClick]);


    const adDropdownConfig = {
        isLabelInline: true,
        label: 'AD Group',
        options: adGroupOptions,
        selectedOptions: selectedAdGroup,
        placeholder: 'Select AD Group',
        reset: false,
        isDisabled,
        onChange: onAdGroupChange,
    };

    const dataAccessDropdownConfig = {
        isLabelInline: true,
        label: 'Data Access',
        options: dataAccessOptions,
        selectedOptions: selectedDataAccess,
        placeholder: 'Select Data Access',
        reset: false,
        isDisabled,
        onChange: onDataAccessChange,
    };

    return (
        <div className={styles['card']}>
            {/* HEADER */}
            <div className={styles['header']}>
                <h5>{title}</h5>

                <div className={styles['actions']}>
                    {onDelete && (
                        <div onClick={handleDeleteClick} className={iconClass}>
                            <Icon name={'trash-01'} size="xm" color="neutrals-B800" />
                        </div>
                    )}
                    {onEdit && (
                        <div onClick={handleEditClick} className={iconClass}>
                            <Icon name={'edit-01'} size="xm" color="neutrals-B800" />
                        </div>
                    )}
                </div>
            </div>

            {/* DESCRIPTION */}
            <p className={styles['description']}>{description}</p>
            <Flex vertical gap="12px">
                {/* AD GROUP DROPDOWN */}
                <div className={styles['persona-dropdown-option']}>

                    <DropDown id={`persona-ad-${title}`} dropdown={adDropdownConfig} />

                </div>

                {/* DATA ACCESS DROPDOWN */}
                <div className={styles['persona-dropdown-option']}>
                    <DropDown id={`persona-da-${title}`} dropdown={dataAccessDropdownConfig} />
                </div>

                {/* ROLES CLICKABLE */}

                {toolType?.toLowerCase() !== 'performance management' && (
                    <div
                        className={`${styles['persona-dropdown-option-role']} ${isDisabled ? styles.disabled : ''}`}
                        onClick={handleRoleClick}
                    >
                        Roles: {roles}
                    </div>
                )}
            </Flex>
        </div>
    );
};

export default PersonaCard;
