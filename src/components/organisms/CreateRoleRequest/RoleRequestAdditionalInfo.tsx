import { DropDown, Flyout, TextArea } from 'konnect-react-components';
import styles from './RequestNewRole.module.scss';
import { Flex, Skeleton } from 'antd';
import { IROleAttributeRequest } from '../../../types/request';
import { useEffect, useState } from 'react';
import { RoleAttributeOptions, RoleResponse } from '../../../types/response';
import { getAttributeOptions, getRoleDetailsByIId } from '../../../services/roles';

interface AdditionalInfoFlyoutProps {
    readonly flyoutOpen: boolean;
    readonly setIsAddDetFlyoutOpen: (val: boolean) => void;
    readonly role?: RoleResponse;
    readonly roleLocation: { label: string; value: string };
    readonly handleSaveRequestAccess: (
        attributes: IROleAttributeRequest[],
        comment: string,
    ) => void;
    readonly isSaving: boolean;
    readonly roleAttributes?: IROleAttributeRequest[];
}

interface IRoleAttributesDropDown {
    attributeId: number;
    attributeName: string;
    attributeValue?: string;
    options?: { label: string; value: string }[];
}

interface DropdownOption {
    label: string;
    value: string;
}

function RoleRequestAdditionalInfo(props: AdditionalInfoFlyoutProps) {
    const {
        flyoutOpen,
        setIsAddDetFlyoutOpen,
        role,
        roleLocation,
        handleSaveRequestAccess,
        isSaving,
        roleAttributes = [],
    } = props;
    const [localAttributes, setLocalAttributes] = useState<IRoleAttributesDropDown[]>([]);
    const [roleRequestComment, setRoleRequestComment] = useState<string>('');
    const [loadingAttributes, setLoadingAttributes] = useState(false);

    const fetchAttr = async (roleId: number) => {
        setLoadingAttributes(true);
        const response = await getRoleDetailsByIId({
            roleId,
        });

        if (response && response?.userAttributes?.length > 0) {
            setLocalAttributes(
                response.userAttributes.map(a => {
                    const selectedRoleAttribute = roleAttributes.find(
                        ra => ra.attributeId === a.userAttributeId,
                    );

                    return {
                        attributeId: a.userAttributeId,
                        attributeName: a.userAttribute,
                        attributeValue: selectedRoleAttribute?.attributeValue ?? '',
                    };
                }),
            );
        } else {
            setLoadingAttributes(false);
        }
    };

    useEffect(() => {
        if (localAttributes.length === 0) return;

        setLoadingAttributes(true);

        Promise.all(
            localAttributes.map(a =>
                getAttributeOptions({
                    attributeId: a.attributeId,
                    pageNumber: 1,
                    pageSize: 4,
                }).then((resp: RoleAttributeOptions[]) => ({
                    attributeId: a.attributeId,
                    options: resp.map(o => ({
                        label: o.valueName,
                        value: o.valueId,
                    })),
                })),
            ),
        ).then(results => {
            setLocalAttributes(prev =>
                prev.map(attr => {
                    const found = results.find(r => r.attributeId === attr.attributeId);
                    return found ? { ...attr, options: found.options } : attr;
                }),
            );

            setLoadingAttributes(false);
        });
    }, [localAttributes.length]);

    useEffect(() => {
        if (!flyoutOpen) return;
        if (role?.roleId) fetchAttr(role.roleId);
    }, [role]);

    //handle the change in attribute
    const handleAttributeValueChange = (attrId: number, value: string) => {
        const attrs = localAttributes.map(item =>
            item.attributeId === attrId ? { ...item, attributeValue: value } : item,
        );
        setLocalAttributes(attrs);
    };

    //scroll behavior for drop downs
    const handleScroll = (attributeId: number) => {
        const attr = localAttributes.find(a => a.attributeId === attributeId);
        const optionsLength = attr?.options?.length ?? 0;
        const nextPage = Math.floor(optionsLength / 20);

        void getAttributeOptions({
            attributeId: attributeId,
            pageNumber: nextPage > 0 ? nextPage + 1 : 2,
            pageSize: 20,
        }).then((resp: RoleAttributeOptions[]) => {
            if (resp.length === 0) return;

            const options = resp.map(r => ({ label: r.valueName, value: r.valueId }));
            updateAttributeOptions(attributeId, options);
        });
    };

    const updateAttributeOptions = (attributeId: number, options: { label: string; value: string }[]) => {
        setLocalAttributes(prev =>
            prev.map(attr =>
                attr.attributeId === attributeId
                    ? {
                          ...attr,
                          options: [...(attr.options || []), ...options], // append new options
                      }
                    : attr,
            ),
        );
    };

    //get selected option of the attribute
    function getSelectedOptions(attributeId: number): { label: string; value: string }[] {
        const attr = localAttributes.find(a => a.attributeId === attributeId);

        if (!attr || !attr.attributeValue || !attr.options) return [];

        const selectedValues = attr.attributeValue.split(',');

        return attr.options.filter(opt => selectedValues.includes(opt.value));
    }

    //handle callback invoke for save role request
    const handleSave = () => {
        const attributes: IROleAttributeRequest[] = localAttributes
            .filter(f => f.attributeValue && f.attributeValue !== '')
            .map(a => ({ attributeId: a.attributeId, attributeValue: a.attributeValue! }));
        handleSaveRequestAccess(attributes, roleRequestComment);
    };

    function pluralize(word: string): string {
        if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) {
            return word.slice(0, -1) + 'ies';
        }
        return word + 's';
    }

    const FlyoutContent = () => {
        return (
            <Flex vertical>
                <div className={styles['role-name-banner']}>
                    <p className={styles['role-name-header']}>Requested Role</p>
                    <p className={styles['role-name']}>
                        {role?.role} - {role?.subFunction ?? ''} {role?.department ?? ''},{' '}
                        {role?.roleGeoName ?? ''}{' '}
                    </p>
                </div>
                <div className={styles['additional-info-content']}>
                    <DropDown
                        id="role-selection-popup-dropdown-one"
                        dropdown={{
                            label: 'Role Location',
                            options: [roleLocation],
                            placeholder: 'Select',
                            onChange: (__, _) => {},
                            selectedOptions: roleLocation ? [roleLocation] : [],
                            isDisabled: true,
                            required: true,
                        }}
                    />

                    {loadingAttributes && (
                        <>
                            <Skeleton.Input style={{ width: '100%' }} />
                            <Skeleton.Input style={{ width: '100%' }} />
                            <Skeleton.Input style={{ width: '100%' }} />
                        </>
                    )}

                    {!loadingAttributes &&
                        localAttributes.map(a => (
                            <DropDown
                                key={a.attributeId}
                                id="role-selection-popup-dropdown-one"
                                dropdown={{
                                    label: pluralize(a.attributeName) + ' Managed by you',
                                    options: a.options ?? [],
                                    placeholder: 'Select',
                                    onChange: (__, _,  selected: DropdownOption[]) => {
                                        handleAttributeValueChange(
                                            a.attributeId,
                                            selected.map(s => s.value).join(','),
                                        );
                                    },
                                    selectedOptions: getSelectedOptions(a.attributeId),
                                    type: 'checkbox',
                                    onScroll: () => {
                                        handleScroll(a.attributeId);
                                    },
                                }}
                                searchInput={{
                                    searchPlaceholder: 'Search',
                                    searchSize: 'L',
                                    searchWholeString: true,
                                }}
                            />
                        ))}

                    <TextArea
                        label="Please provide a brief reason for requesting this role "
                        placeholder="Enter here"
                        value={roleRequestComment}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setRoleRequestComment(e.target.value)
                        }
                        required={true}
                        maxCharacters={500}
                        customheight={40}
                    />
                </div>
            </Flex>
        );
    };

    return (
        <Flyout
            flyoutOpen={flyoutOpen}
            heading={'Additional Details'}
            subHeading={
                'The selected attributes will allow you to get edit access for the same across command center.'
            }
            content={FlyoutContent()}
            primaryBtnProps={{
                variant: 'Primary',
                onClick: () => {
                    handleSave();
                },
                text: 'Request Access',
                disabled: roleRequestComment === '',
                loading: isSaving,
            }}
            secondaryBtnProps={{
                variant: 'Secondary',
                onClick: () => {
                    setIsAddDetFlyoutOpen(false);
                },
                text: 'Back to role selection',
            }}
            cancelIconClick={() => {}}
            containerMaxWidth={'26.5rem'}
            direction="right"
            dataTestId="flyout-filter"
            id="role-additional-info"
            className={styles['role-additional-info-flyout']}
        />
    );
}

export default RoleRequestAdditionalInfo;
