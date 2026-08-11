import React, { useEffect, useState } from 'react';
import { Flyout, InputField, DropDown, Toast } from 'konnect-react-components';
import { useSelector } from 'react-redux';
import { Flex } from 'antd';
import { addNewTagService, editTagService } from '../../../services/tags';
import { RootState } from '../../../store';
import { convertOptions, logError } from '../../../utils/helpers';
import styles from './AddNewTagFlyout.module.scss';
import type { OptionType } from '../../../types/common';
import { validateRoleName } from '../../../utils/validation';

type AddNewTagFlyoutProps = {
    isFlyoutOpen: boolean;
    onClickHandlerForFlyoutCancelIcon: () => void;
    onTagAdded?: (addedTagCategoryId: number) => void;
    onTagEddited?: () => void;
    editMode?: boolean;
    existingTag?: { tagId: number; tagName: string; tagCategoryId: number; instances: number };
};

function AddNewTagFlyout({
    isFlyoutOpen,
    onClickHandlerForFlyoutCancelIcon,
    onTagAdded,
    onTagEddited,
    editMode = false,
    existingTag,
}: Readonly<AddNewTagFlyoutProps>) {
    const forceUpdate: () => void = React.useState({})[1].bind(null, {});
    const [newTagName, setNewTagName] = useState('');
    const [newTagSelectedCategory, setNewTagSelectedCategory] = useState({
        label: '',
        value: '',
    });
    const [isFormComplete, setIsFormComplete] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [inputFieldCaptionSettings, setInputFieldCaptionSettings] = useState<{
        captionMessage: string;
        captionMessageType: 'default' | 'error' | 'sucess';
    }>({
        captionMessage: '0/40 Characters',
        captionMessageType: 'default',
    });
    const [tagName, setTagName] = useState(existingTag?.tagName ?? '');
    const [selectedCategory, setSelectedCategory] = useState<{ label: string; value: string }>({
        label: '',
        value: '',
    });
    const [isSaveDisabled, setIsSaveDisabled] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const tagCategoryDetails = useSelector(
        (state: RootState) => state.tagDetails.data.tagCategoryDetails,
    );
    useEffect(() => {
        if (editMode && existingTag) {
            setTagName(existingTag.tagName ?? '');
        }
    }, [editMode, existingTag]);

    useEffect(() => {
        if (existingTag?.tagCategoryId) {
            const selectedCategory = tagCategoryDetails.find(
                cat => cat.tagCategoryId === existingTag.tagCategoryId,
            );
            setSelectedCategory({
                label: selectedCategory?.tagCategoryName || '',
                value:
                    selectedCategory?.tagCategoryId !== undefined
                        ? String(selectedCategory.tagCategoryId)
                        : '',
            });
        }
    }, [existingTag, tagCategoryDetails]);

    useEffect(() => {
        const hasChanges =
            tagName !== existingTag?.tagName ||
            selectedCategory.value !== String(existingTag?.tagCategoryId);
        setIsSaveDisabled(!hasChanges || !!errorMessage);
    }, [tagName, selectedCategory, existingTag, errorMessage]);

    useEffect(() => {
        if (newTagName && newTagSelectedCategory.value) {
            setIsFormComplete(true);
        } else {
            setIsFormComplete(false);
        }
        getAndSetCharacterLengthForTagName();
    }, [newTagName, tagName, newTagSelectedCategory]);

    useEffect(() => {
        setMaxlengthForInputField();
    }, []);

    const handleTagNameChange = (value: string) => {
        if (value.length > 40) {
            return;
        }
        editMode ? setTagName(value) : setNewTagName(value);
        setErrorMessage('');
    };

    const setMaxlengthForInputField = () => {
        const inputField = document.getElementsByClassName(
            'inputfield-text-container add-new-tag-flyout-input-field',
        );
        inputField[0]?.setAttribute('maxlength', '40');
    };

    const getAndSetCharacterLengthForTagName = () => {
        setInputFieldCaptionSettings({
            captionMessage: editMode
                ? `${tagName.length}/40 Characters`
                : `${newTagName.length}/40 Characters`,
            captionMessageType: 'default',
        });
        forceUpdate();
    };

    const getTagCategoryOptions = () => {
        const convertedOptions: OptionType[] = convertOptions(
            tagCategoryDetails,
            'tagCategoryName',
            'tagCategoryId',
        );
        return convertedOptions;
    };

    const onClickHandlerForAddTagButton = async () => {
        try {
            setShowLoader(true);
            const response = await addNewTagService({
                tagName: newTagName,
                tagCategoryId: Number(newTagSelectedCategory.value),
            });

            if (response.statusCode === 200) {
                setToastMessage(`Tag '${newTagName}' added successfully.`);
                setShowSuccessToast(true);
                onClickHandlerForFlyoutCancelIcon();
                onTagAdded?.(Number(newTagSelectedCategory.value));
                setTimeout(() => {
                    clearFormFields();
                }, 4000);
            } else if (response.statusCode === 409) {
                const { categoryName } = response.data;
                setInputFieldCaptionSettings(oldState => {
                    oldState.captionMessage = `This tag already exists in ${categoryName} category. Please modify the name to continue adding.`;
                    oldState.captionMessageType = 'error';
                    return oldState;
                });
                forceUpdate();
                setIsFormComplete(false);
            }
        } catch (error: any) {
            logError(error);
        } finally {
            setShowLoader(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!existingTag?.tagId || !tagName || !selectedCategory.value) return;

        setShowLoader(true);

        try {
            const response = await editTagService({
                tagName,
                tagCategoryId: Number(selectedCategory.value),
                tagId: existingTag.tagId,
            });
            if (response.statusCode === 200) {
                setToastMessage(`Tag "${tagName}" updated successfully.`);
                setShowSuccessToast(true);
                onTagEddited?.();
                onClickHandlerForFlyoutCancelIcon();
                onTagAdded?.(Number(selectedCategory.value));
                setTimeout(() => {
                    clearFormFields();
                }, 4000);
            } else if (response.statusCode === 400) {
                const categoryName = response.data;
                setInputFieldCaptionSettings(old => {
                    old.captionMessage = `This tag already exists in ${categoryName} category. Please modify the name to continue updating.`;
                    old.captionMessageType = 'error';
                    return old;
                });
                forceUpdate?.();
                setIsFormComplete?.(false);
            } else {
                setErrorMessage(response.message || 'Failed to update tag.');
            }
        } catch (error: any) {
            logError(error);
            setErrorMessage('Something went wrong while updating the tag.');
        } finally {
            setShowLoader(false);
        }
    };

    const clearFormFields = () => {
        setNewTagName('');
        setNewTagSelectedCategory({
            label: '',
            value: '',
        });
    };

    const getFlyoutContent = () => {
        return (
            <Flex
                justify="flex-start"
                align="flex-start"
                gap={'16px'}
                className={styles['new-tag-flyout-container']}
            >
                <InputField
                    className="add-new-tag-flyout-input-field"
                    label="Tag Name"
                    onChange={event => {
                        const { value } = event.target;
                        if (validateRoleName(value)) {
                            handleTagNameChange(value);
                        }
                    }}
                    value={editMode ? tagName : newTagName}
                    required={true}
                    placeholder="Enter Name"
                    captionIcon="alert-circle"
                    captionMessage={inputFieldCaptionSettings.captionMessage}
                    captionMessageType={inputFieldCaptionSettings.captionMessageType}
                    isDisabled={editMode && (existingTag?.instances ?? 0) > 0}
                />
                {editMode && (
                    <>
                        {(existingTag?.instances ?? 0) > 0 && (
                            <span className={styles['info']}>
                                Tag name cannot be edited as it is being used in the command centre.
                            </span>
                        )}
                        {errorMessage && <div className={styles['error']}>{errorMessage}</div>}
                    </>
                )}

                <DropDown
                    dropdown={{
                        required: true,
                        label: 'Category',
                        placeholder: 'Select Category',
                        showRadio: false,
                        type: 'radio',
                        onChange: selectedOption =>
                            editMode
                                ? setSelectedCategory(selectedOption)
                                : setNewTagSelectedCategory(selectedOption),
                        options: getTagCategoryOptions(),
                        selectedOptions: editMode ? [selectedCategory] : [newTagSelectedCategory],
                    }}
                    className={styles['new-tag-category-dropdown']}
                    searchInput={{
                        searchPlaceholder: 'Search',
                        searchSize: 'L',
                        searchWholeString: true,
                    }}
                />
            </Flex>
        );
    };
    return (
        <div className={styles['add-new-tag-flyout-outer-container']}>
            <Flyout
                id="add-new-tag-flyout"
                flyoutOpen={isFlyoutOpen}
                direction="right"
                heading={editMode ? 'Edit Tag' : 'Add New Tag'}
                content={getFlyoutContent()}
                cancelIconClick={() => {
                    onClickHandlerForFlyoutCancelIcon();
                    clearFormFields();
                }}
                iconForCancel={{
                    icon: 'x-close',
                    onClick: () => {
                        onClickHandlerForFlyoutCancelIcon();
                        clearFormFields();
                    },
                }}
                className={styles['add-new-tag-flyout']}
                containerMaxWidth="420px"
                primaryBtnProps={{
                    text: editMode ? 'Save' : 'Add Tag',
                    variant: 'Primary',
                    onClick: editMode ? handleSaveEdit : onClickHandlerForAddTagButton,
                    loading: showLoader,
                    disabled: editMode ? isSaveDisabled : !isFormComplete,
                }}
                cancelBtnProps={{
                    text: 'Cancel',
                    variant: 'Subtle2',
                    onClick: () => {
                        onClickHandlerForFlyoutCancelIcon();
                        clearFormFields();
                    },
                }}
                onBackDropClick={() => {
                    onClickHandlerForFlyoutCancelIcon();
                    clearFormFields();
                }}
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
                    className={styles['toast-configuration']}
                />
            )}
        </div>
    );
}

export default AddNewTagFlyout;
