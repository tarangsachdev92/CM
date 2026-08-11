import React from 'react';
import { Switch } from 'konnect-react-components';
import styles from './AddNewForumFlyout.module.scss';
import ForumDetailsForm from './ForumDetailsForm';

type OptionType = { label: string; value: string };

type Props = {
    forumName: string;
    setForumName: (val: string) => void;
    forumNameError: string;
    selectedForumLevel: string;
    setSelectedForumLevel: (val: string) => void;
    selectedForumPeriod: string;
    setSelectedForumPeriod: (val: string) => void;
    forumLevelOptions: OptionType[];
    forumPeriodOptions: OptionType[];
    applicationLocations: any[];
    selectedGeographies: any[];
    handleGeographyChange: (option: any) => void;
    functionDD: OptionType[];
    selectedFunctions: string[];
    setSelectedFunctions: (val: string[]) => void;
    forumOwner1Options: OptionType[];
    forumOwner2Options: OptionType[];
    collaboratorOptions: OptionType[];
    selectedForumOwner1: string[];
    setSelectedForumOwner1: (val: string[]) => void;
    selectedForumOwner2: string[];
    setSelectedForumOwner2: (val: string[]) => void;
    selectedCollaborators: string[];
    setSelectedCollaborators: (val: string[]) => void;
    status: number;
    setStatus: (val: number) => void;
    setSelectedForumLevelId: (val: string) => void;
    setSelectedForumPeriodId: (val: string) => void;
};

const AddForumFlyoutBody: React.FC<Props> = ({
    forumName,
    setForumName,
    selectedForumLevel,
    setSelectedForumLevel,
    selectedForumPeriod,
    setSelectedForumPeriod,
    forumLevelOptions,
    forumPeriodOptions,
    forumNameError,
    applicationLocations,
    selectedGeographies,
    handleGeographyChange,
    functionDD,
    selectedFunctions,
    setSelectedFunctions,
    forumOwner1Options,
    forumOwner2Options,
    collaboratorOptions,
    selectedForumOwner1,
    setSelectedForumOwner1,
    selectedForumOwner2,
    setSelectedForumOwner2,
    selectedCollaborators,
    setSelectedCollaborators,
    status,
    setStatus,
    setSelectedForumLevelId,
    setSelectedForumPeriodId,
}) => {
    return (
        <div className={styles.container}>
            <ForumDetailsForm
                forumName={forumName}
                setForumName={setForumName}
                forumNameError={forumNameError}
                selectedForumLevel={selectedForumLevel}
                setSelectedForumLevel={setSelectedForumLevel}
                selectedForumPeriod={selectedForumPeriod}
                setSelectedForumPeriod={setSelectedForumPeriod}
                forumLevelOptions={forumLevelOptions}
                forumPeriodOptions={forumPeriodOptions}
                selectedGeographies={selectedGeographies}
                applicationLocations={applicationLocations}
                handleGeographyChange={handleGeographyChange}
                functionDD={functionDD}
                selectedFunctions={selectedFunctions}
                setSelectedFunctions={setSelectedFunctions}
                forumOwner1Options={forumOwner1Options}
                selectedForumOwner1={selectedForumOwner1}
                setSelectedForumOwner1={setSelectedForumOwner1}
                forumOwner2Options={forumOwner2Options}
                selectedForumOwner2={selectedForumOwner2}
                setSelectedForumOwner2={setSelectedForumOwner2}
                collaboratorOptions={collaboratorOptions}
                selectedCollaborators={selectedCollaborators}
                setSelectedCollaborators={setSelectedCollaborators}
                styles={styles}
                setSelectedForumLevelId={setSelectedForumLevelId}
                setSelectedForumPeriodId={setSelectedForumPeriodId}
            />

            <div className={styles.switchContainer}>
                <label className={styles.label}>Forum Status</label>
                <Switch
                    checked={status === 1}
                    onToggle={(checked: boolean) => setStatus(checked ? 1 : 0)}
                />
            </div>
        </div>
    );
};

export default AddForumFlyoutBody;