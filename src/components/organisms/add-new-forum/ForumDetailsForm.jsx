import React from 'react';
import { DropDown, Icon, InputField } from 'konnect-react-components';
import GeographyDropdownComponent from './GeographyDropdown';
import { validateForumName } from '../../../utils/validation';

const ForumDetailsForm = ({
    forumName,
    setForumName,
    forumNameError,
    selectedForumLevel,
    setSelectedForumLevel,
    selectedForumPeriod,
    setSelectedForumPeriod,
    forumLevelOptions,
    forumPeriodOptions,
    selectedGeographies,
    applicationLocations,
    handleGeographyChange,
    functionDD,
    selectedFunctions,
    setSelectedFunctions,
    forumOwner1Options,
    selectedForumOwner1,
    setSelectedForumOwner1,
    forumOwner2Options,
    selectedForumOwner2,
    setSelectedForumOwner2,
    collaboratorOptions,
    selectedCollaborators,
    setSelectedCollaborators,
    styles,
    setSelectedForumLevelId,
    setSelectedForumPeriodId,
}) => {
    //  HARDEN ALL OPTION ARRAYS
    const safeForumLevelOptions = Array.isArray(forumLevelOptions) ? forumLevelOptions : [];
    const safeForumPeriodOptions = Array.isArray(forumPeriodOptions) ? forumPeriodOptions : [];
    const safeFunctionDD = Array.isArray(functionDD) ? functionDD : [];
    const safeForumOwner1Options = Array.isArray(forumOwner1Options) ? forumOwner1Options : [];
    const safeForumOwner2Options = Array.isArray(forumOwner2Options) ? forumOwner2Options : [];
    const safeCollaboratorOptions = Array.isArray(collaboratorOptions) ? collaboratorOptions : [];

    const filteredForumOwner1Options = safeForumOwner1Options.filter(
        opt =>
            !selectedForumOwner2.includes(opt.value) && !selectedCollaborators.includes(opt.value),
    );

    const filteredForumOwner2Options = safeForumOwner2Options.filter(
        opt =>
            !selectedForumOwner1.includes(opt.value) && !selectedCollaborators.includes(opt.value),
    );

    const filteredCollaboratorOptions = safeCollaboratorOptions.filter(
        opt => !selectedForumOwner1.includes(opt.value) && !selectedForumOwner2.includes(opt.value),
    );

    return (
        <>
            {forumNameError && (
                <div className={styles.infoRow}>
                    <Icon name="info-circle" size="l" color="feedback-error-color" />
                    <div className={styles.error}>{forumNameError}</div>
                </div>
            )}

            {/* Forum Name */}
            <div className={styles.fieldGroup}>
                <InputField
                    id="forum-name"
                    placeholder="Enter forum name"
                    label="Forum Name"
                    required
                    maxLength={200}
                    value={forumName}
                    onChange={e => {
                        const value = e.target.value;
                        if (validateForumName(value)) {
                            setForumName(value);
                        }
                    }}
                />
                <div className={styles.infoRow}>
                    <Icon name="info-circle" size="l" color="neutrals-B200" />
                    <span className={styles.info}>{forumName.length}/200 Characters</span>
                </div>
            </div>

            {/* Forum Level */}
            <div className={styles.fieldGroup}>
                <DropDown
                    id="forum-level"
                    dropdown={{
                        size: 'L',
                        label: 'Forum Level',
                        required: true,
                        options: safeForumLevelOptions,
                        placeholder: 'Select Level',
                        onChange: obj => {
                            setSelectedForumLevel(obj.label);
                            setSelectedForumLevelId(obj.value);
                        },
                        selectedOptions: selectedForumLevel
                            ? safeForumLevelOptions.filter(opt => opt.label === selectedForumLevel)
                            : [],
                    }}
                    searchInput={
                        Array.isArray(safeForumLevelOptions) && safeForumLevelOptions.length > 10
                            ? {
                                  searchPlaceholder: 'Search',
                                  searchSize: 'L',
                                  searchWholeString: true,
                              }
                            : undefined
                    }
                />
            </div>

            {/* Forum Period */}
            <div className={styles.fieldGroup}>
                <DropDown
                    id="forum-period"
                    dropdown={{
                        size: 'L',
                        label: 'Forum Period',
                        required: true,
                        options: safeForumPeriodOptions,
                        placeholder: 'Select Frequency',
                        onChange: obj => {
                            setSelectedForumPeriod(obj.label);
                            setSelectedForumPeriodId(obj.value);
                        },
                        //  FIXED: ALWAYS ARRAY
                        selectedOptions: selectedForumPeriod
                            ? safeForumPeriodOptions.filter(
                                  opt => opt.label === selectedForumPeriod,
                              )
                            : [],
                    }}
                    searchInput={
                        Array.isArray(safeForumPeriodOptions) && safeForumPeriodOptions.length > 10
                            ? {
                                  searchPlaceholder: 'Search',
                                  searchSize: 'L',
                                  searchWholeString: true,
                              }
                            : undefined
                    }
                />
            </div>

            {/* Geography */}
            <div className={styles.fieldGroup}>
                <GeographyDropdownComponent
                    forumLevel={selectedForumLevel}
                    applicationLocations={applicationLocations}
                    selectedValue={Array.isArray(selectedGeographies) ? selectedGeographies : []}
                    onChange={handleGeographyChange}
                />
            </div>

            {/* Function */}
            <div className={styles.fieldGroup}>
                <DropDown
                    id="function"
                    dropdown={{
                        size: 'L',
                        type: 'checkbox',
                        label: 'Function',
                        required: true,
                        options: safeFunctionDD,
                        placeholder: 'Select Function',
                        onChange: (obj, checked) => {
                            const updated = checked
                                ? [...selectedFunctions, obj.value]
                                : selectedFunctions.filter(id => id !== obj.value);
                            setSelectedFunctions(updated);
                        },
                        selectedOptions: safeFunctionDD.filter(item =>
                            selectedFunctions.includes(item.value),
                        ),
                    }}
                    searchInput={
                        Array.isArray(safeFunctionDD) && safeFunctionDD.length > 10
                            ? {
                                  searchPlaceholder: 'Search',
                                  searchSize: 'L',
                                  searchWholeString: true,
                              }
                            : undefined
                    }
                />
            </div>

            {/* Forum Owner 1 */}
            <div className={styles.fieldGroup}>
                <DropDown
                    id="forum-owner-1"
                    dropdown={{
                        size: 'L',
                        label: 'Forum Owner 1',
                        required: true,
                        options: filteredForumOwner1Options,
                        placeholder: 'Select Owner',
                        onChange: obj => setSelectedForumOwner1([obj.value]),
                        selectedOptions: filteredForumOwner1Options.filter(opt =>
                            selectedForumOwner1.includes(opt.value),
                        ),
                    }}
                    searchInput={
                        Array.isArray(filteredForumOwner1Options) &&
                        filteredForumOwner1Options.length > 10
                            ? {
                                  searchPlaceholder: 'Search',
                                  searchSize: 'L',
                                  searchWholeString: true,
                              }
                            : undefined
                    }
                />
            </div>

            {/* Forum Owner 2 */}
            <div className={styles.fieldGroup}>
                <DropDown
                    id="forum-owner-2"
                    dropdown={{
                        size: 'L',
                        label: 'Forum Owner 2',
                        options: filteredForumOwner2Options,
                        placeholder: 'Select Owner',
                        onChange: obj => setSelectedForumOwner2([obj.value]),
                        selectedOptions: filteredForumOwner2Options.filter(opt =>
                            selectedForumOwner2.includes(opt.value),
                        ),
                    }}
                    searchInput={
                        Array.isArray(filteredForumOwner2Options) &&
                        filteredForumOwner2Options.length > 10
                            ? {
                                  searchPlaceholder: 'Search',
                                  searchSize: 'L',
                                  searchWholeString: true,
                              }
                            : undefined
                    }
                />
            </div>

            {/* Collaborators */}
            <div className={styles.fieldGroup}>
                <DropDown
                    id="collaborators"
                    dropdown={{
                        size: 'L',
                        type: 'checkbox',
                        label: 'Collaborators',
                        options: filteredCollaboratorOptions,
                        placeholder: 'Select Collaborators',
                        onChange: (obj, checked) => {
                            const updated = checked
                                ? [...selectedCollaborators, obj.value]
                                : selectedCollaborators.filter(id => id !== obj.value);
                            setSelectedCollaborators(updated);
                        },
                        selectedOptions: filteredCollaboratorOptions.filter(opt =>
                            selectedCollaborators.includes(opt.value),
                        ),
                    }}
                    searchInput={
                        Array.isArray(filteredCollaboratorOptions) &&
                        filteredCollaboratorOptions.length > 10
                            ? {
                                  searchPlaceholder: 'Search',
                                  searchSize: 'L',
                                  searchWholeString: true,
                              }
                            : undefined
                    }
                />
            </div>
        </>
    );
};

export default ForumDetailsForm;
