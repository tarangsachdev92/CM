import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Flyout } from 'konnect-react-components';
import { useDispatch, useSelector } from 'react-redux';
import { isEqual, cloneDeep } from 'lodash';
import { GEO } from '../../../utils/constants';

import styles from './AddNewForumFlyout.module.scss';
import AddForumFlyoutBody from './FlyoutBody';
import PrefilledDataHandler from './PrefilledDataHandler';

import {
    addNewForum,
    editForumDetails,
    fetchRoleLocations,
    fetchFunctions,
    addForumOwner,
    forumLevel,
    forumPeriod,
} from '../../../store';

import type { AppDispatch, RootState } from '../../../store';
import type { IAddForumRequest } from '../../../types/request';
import type { IForumData } from '../../../types/response';

type AddForumFlyoutProps = {
    isOpen: boolean;
    onCancelClick: () => void;
    onForumAdded?: (forumName: string) => void;
    mode?: 'add' | 'edit';
    prefilledData?: IForumData;
    onToastTrigger?: (payload: { message: string; type: 'Success' | 'Error' | 'Delete' }) => void;
};

type GeographyType = {
    label: string[];
    value: string;
    type: 'region' | 'cluster' | 'market' | 'site' | '';
};

type GeoKey = (typeof GEO)[keyof typeof GEO];
const EMPTY = '';

const EMPTY_GEO: Record<GeoKey, string> = {
    [GEO.REGION]: EMPTY,
    [GEO.CLUSTER]: EMPTY,
    [GEO.MARKET]: EMPTY,
    [GEO.SITE]: EMPTY,
};

const AddForumFlyout: React.FC<AddForumFlyoutProps> = ({
    isOpen,
    onCancelClick,
    onForumAdded,
    mode = 'add',
    prefilledData,
    onToastTrigger,
}) => {
    const dispatch = useDispatch<AppDispatch>();

    const forumOwners = useSelector((state: RootState) => state.forumOwner.forumOwners);

    //  HARDEN: locationData may become {} / null on API error (401) => must coerce to []
    const applicationLocationsRaw = useSelector(
        (state: RootState) => state.roleFunctions.locationData,
    );
    const applicationLocations = Array.isArray(applicationLocationsRaw)
        ? applicationLocationsRaw
        : [];

    //  HARDEN: functions may become {} / null on API error (401) => must coerce to []
    const allFunctionsRaw = useSelector(
        (state: RootState) => state.fetchFunctionSubfunctionInformation.data.functions,
    );
    const allFunctions = Array.isArray(allFunctionsRaw) ? allFunctionsRaw : [];

    const forumLevels = useSelector((state: RootState) => state.forumLevel?.data);
    const forumPeriods = useSelector((state: RootState) => state.forumPeriod?.data);

    const [forumName, setForumName] = useState('');
    const [forumNameError, setForumNameError] = useState('');
    const [selectedForumLevel, setSelectedForumLevel] = useState('');
    const [selectedForumLevelId, setSelectedForumLevelId] = useState('');
    const [selectedForumPeriod, setSelectedForumPeriod] = useState('');
    const [selectedForumPeriodId, setSelectedForumPeriodId] = useState('');
    const [selectedGeographies, setSelectedGeographies] = useState<GeographyType[]>([]);
    const [functionDD, setFunctionDD] = useState<{ label: string; value: string }[]>([]);
    const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
    const [selectedForumOwner1, setSelectedForumOwner1] = useState<string[]>([]);
    const [selectedForumOwner2, setSelectedForumOwner2] = useState<string[]>([]);
    const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState(1);

    const prevLevelRef = useRef<string>('');
    const [geoVersion, setGeoVersion] = useState(0);

    useEffect(() => {
        if (!selectedForumLevel) return;
        if (prevLevelRef.current && prevLevelRef.current !== selectedForumLevel) {
            setSelectedGeographies([]);
            setGeoVersion(v => v + 1);
        }
        prevLevelRef.current = selectedForumLevel;
    }, [selectedForumLevel]);

    useEffect(() => {
        dispatch(forumLevel());
        dispatch(forumPeriod());
        dispatch(fetchRoleLocations());
        dispatch(addForumOwner());
        dispatch(fetchFunctions());
    }, [dispatch]);

    useEffect(() => {
        const mappedFunctions = allFunctions.map((func: any) => ({
            label: func.functionName ?? '',
            value: String(func.functionId),
        }));
        setFunctionDD(mappedFunctions);
    }, [allFunctions]);

    const handleGeographyChange = (option: any) => {
        const arr = Array.isArray(option) ? option : [option];
        const cleaned = arr.filter(Boolean).filter((g: any) => {
            const labels = Array.isArray(g?.label) ? g.label : [g?.label];
            return labels.some((l: any) => (l ?? '').toString().trim().length > 0);
        });
        setSelectedGeographies(cleaned as GeographyType[]);
    };

    const forumOwner1Options = useMemo(
        () =>
            forumOwners?.forumOwner1?.map((owner: any) => ({
                label: owner.name,
                value: String(owner.id),
                email: owner.email ?? '',
            })) ?? [],
        [forumOwners],
    );

    const forumOwner2Options = useMemo(
        () =>
            forumOwners?.forumOwner2?.map((owner: any) => ({
                label: owner.name,
                value: String(owner.id),
                email: owner.email ?? '',
            })) ?? [],
        [forumOwners],
    );

    const collaboratorOptions = useMemo(
        () =>
            forumOwners?.collaborator?.map((collab: any) => ({
                label: collab.name,
                value: String(collab.id),
                email: collab.email ?? '',
            })) ?? [],
        [forumOwners],
    );

    const owner1IdToEmail = useMemo(
        () => new Map(forumOwner1Options.map(o => [o.value, o.email])),
        [forumOwner1Options],
    );
    const owner2IdToEmail = useMemo(
        () => new Map(forumOwner2Options.map(o => [o.value, o.email])),
        [forumOwner2Options],
    );
    const collabIdToEmail = useMemo(
        () => new Map(collaboratorOptions.map(o => [o.value, o.email])),
        [collaboratorOptions],
    );

    const forumLevelOptions = Array.isArray(forumLevels)
        ? forumLevels.map((level: any) => ({
              label: level.forumLevelName ?? '',
              value: String(level.forumLevelId),
          }))
        : [];

    const forumPeriodOptions = Array.isArray(forumPeriods)
        ? forumPeriods.map((period: any) => ({
              label: period.forumPeriodName ?? '',
              value: String(period.forumPeriodId),
          }))
        : [];

    const extractGeographyNames = (
        selected: GeographyType[],
    ): { region: string[]; cluster: string[]; market: string[]; site: string[] } => {
        const result = {
            region: [] as string[],
            cluster: [] as string[],
            market: [] as string[],
            site: [] as string[],
        };

        selected?.forEach(item => {
            const { label } = item;
            const labels = Array.isArray(label) ? label : [label];

            const hierarchy = ['region', 'cluster', 'market', 'site'] as const;

            labels.forEach((entry, index) => {
                const geoType = hierarchy[index];
                if (geoType && entry && !result[geoType].includes(entry)) {
                    result[geoType].push(entry);
                }
            });
        });

        return result;
    };

    const getGeoPayload = (selected: GeographyType[]) => {
        const geo = { ...EMPTY_GEO };

        const item = Array.isArray(selected) && selected.length > 0 ? selected[0] : null;
        if (!item) return geo;

        const id = String(item.value ?? EMPTY).trim();
        const type = (item.type as GeoKey) || '';
        const firstLabel = Array.isArray(item.label)
            ? String(item.label[0] ?? '').trim()
            : String(item.label ?? '').trim();

        const isGlobal = id.toLowerCase() === 'global' || firstLabel.toLowerCase() === 'global';
        if (isGlobal) {
            const globalRegion = applicationLocations.find(
                (r: any) =>
                    String(r?.regionName ?? '')
                        .trim()
                        .toLowerCase() === 'global',
            );
            if (globalRegion) {
                geo[GEO.REGION] = String(globalRegion.regionId);
            }
            return geo;
        }

        if (id && type && Object.values(GEO).includes(type)) {
            geo[type] = id;
        }

        return geo;
    };

    const geoNames = useMemo(
        () => extractGeographyNames(selectedGeographies),
        [selectedGeographies],
    );

    const functionMap = new Map(functionDD.map(f => [f.value, f.label]));
    const collaboratorMap = new Map(collaboratorOptions.map(c => [c.value, c.label]));

    const getValueFromLabel = (options: any[], label: string) =>
        options.find(opt => opt.label.trim().toLowerCase() === (label ?? '').trim().toLowerCase())
            ?.value ?? '';

    const prefilledForumOwner1Value = getValueFromLabel(
        forumOwner1Options,
        prefilledData?.forumOwner1 ?? '',
    );
    const prefilledForumOwner2Value = getValueFromLabel(
        forumOwner2Options,
        prefilledData?.forumOwner2 ?? '',
    );

    const isValidGeographySelection = (geos: GeographyType[]): boolean => {
        if (!Array.isArray(geos) || geos.length === 0) return false;
        return geos.some((g: any) => {
            if (!g) return false;
            const labels = Array.isArray(g.label) ? g.label : [g.label];
            const hasLabel = labels.some((l: any) => (l ?? '').toString().trim().length > 0);
            const hasTypeOrValue =
                ((g.type ?? '') as string).trim().length > 0 ||
                ((g.value ?? '') as string).trim().length > 0;
            return hasLabel && hasTypeOrValue;
        });
    };

    const isFormValid = (): boolean => {
        const isForumNameValid =
            forumName.trim() !== '' &&
            forumName.length <= 200 &&
            /^[a-zA-Z\s_-]{1,200}$/.test(forumName.trim());
        const isForumLevelValid = selectedForumLevel.length > 0;
        const isForumPeriodValid = selectedForumPeriod.length > 0;
        const isGeographyValid = isValidGeographySelection(selectedGeographies);
        const isForumOwner1Valid = selectedForumOwner1.length > 0;

        return (
            isForumNameValid &&
            isForumLevelValid &&
            isForumPeriodValid &&
            isGeographyValid &&
            isForumOwner1Valid
        );
    };

    const isForumEdited = () => {
        const cloned = cloneDeep(prefilledData);

        const functionsChanged =
            selectedFunctions.length > 0 &&
            !isEqual(
                new Set(
                    selectedFunctions.map(f => (functionMap.get(f) ?? '').trim().toLowerCase()),
                ),
                new Set(
                    String((cloned as any)?.functionName ?? '')
                        .split(',')
                        .map(s => s.trim().toLowerCase())
                        .filter(Boolean),
                ),
            );

        const gSel = getGeoPayload(selectedGeographies);
        const geoChanged = !isEqual(
            {
                regionId: String((gSel as any).region ?? ''),
                clusterId: String((gSel as any).cluster ?? ''),
                marketId: String((gSel as any).market ?? ''),
                siteId: String((gSel as any).site ?? ''),
            },
            {
                regionId: String((cloned as any)?.regionId ?? ''),
                clusterId: String((cloned as any)?.clusterId ?? ''),
                marketId: String((cloned as any)?.marketId ?? ''),
                siteId: String((cloned as any)?.siteId ?? ''),
            },
        );

        const checks = {
            forumName:
                forumName.length > 0 &&
                !isEqual(forumName.trim(), String((cloned as any)?.forumName ?? '').trim()),

            selectedFunctions: functionsChanged,

            forumLevel:
                selectedForumLevel.length > 0 &&
                !isEqual(
                    selectedForumLevel.trim().toLowerCase(),
                    String((cloned as any)?.forumLevel ?? '')
                        .trim()
                        .toLowerCase(),
                ),

            forumPeriod:
                selectedForumPeriod.length > 0 &&
                !isEqual(
                    selectedForumPeriod.trim().toLowerCase(),
                    String((cloned as any)?.forumPeriod ?? '')
                        .trim()
                        .toLowerCase(),
                ),

            geography: geoChanged,

            selectedForumOwner1:
                selectedForumOwner1.length > 0 &&
                !isEqual(
                    selectedForumOwner1.map(String).join(',').trim(),
                    (prefilledForumOwner1Value ?? '').trim(),
                ),

            selectedForumOwner2:
                selectedForumOwner2.length > 0 &&
                !isEqual(
                    selectedForumOwner2.map(String).join(',').trim(),
                    (prefilledForumOwner2Value ?? '').trim(),
                ),

            selectedCollaborators:
                selectedCollaborators.length > 0 &&
                !isEqual(
                    new Set(
                        selectedCollaborators.map(c =>
                            (collaboratorMap.get(c) ?? '').trim().toLowerCase(),
                        ),
                    ),
                    new Set(
                        String((cloned as any)?.collaborators ?? '')
                            .split(',')
                            .map(c => c.trim().toLowerCase())
                            .filter(Boolean),
                    ),
                ),

            status: !isEqual(Number(status ?? 0), Number((cloned as any)?.status ?? 0)),
        };

        return Object.values(checks).some(Boolean);
    };

    const isForumButtonEnabled = () => {
        const functionSelected = selectedFunctions.length > 0;
        const formValid = isFormValid();

        return mode === 'edit'
            ? isForumEdited() && formValid && functionSelected && !isSubmitting
            : mode === 'add'
              ? formValid && functionSelected && !isSubmitting
              : false;
    };

    const createForumPayload = (): IAddForumRequest => {
        const geo = getGeoPayload(selectedGeographies);

        // translate selected IDs -> emails
        const forumOwner1Email =
            selectedForumOwner1.map(id => owner1IdToEmail.get(id) || '').filter(Boolean)[0] || '';
        const forumOwner2Email =
            selectedForumOwner2.map(id => owner2IdToEmail.get(id) || '').filter(Boolean)[0] || '';
        const collaboratorEmails = selectedCollaborators
            .map(id => collabIdToEmail.get(id) || '')
            .filter(Boolean);

        const functionNames = selectedFunctions
            .map(id => functionMap.get(id) ?? '')
            .filter(Boolean)
            .join(',');

        const regionNames = (geoNames.region ?? []).join(',');
        const clusterNames = (geoNames.cluster ?? []).join(',');
        const marketNames = (geoNames.market ?? []).join(',');
        const siteNames = (geoNames.site ?? []).join(',');

        return {
            forumId: mode === 'edit' && prefilledData?.forumId ? prefilledData.forumId : 0,

            forumName: forumName.trim(),
            forumLevelId: (selectedForumLevelId as any) || 0,
            forumPeriodId: (selectedForumPeriodId as any) || 0,
            functionId: selectedFunctions.join(','),

            regionId: (geo as any).region || '',
            clusterId: (geo as any).cluster || '',
            marketId: (geo as any).market || '',
            siteId: (geo as any).site || '',

            forumLevel: selectedForumLevel || '',
            forumPeriod: selectedForumPeriod || '',
            FunctionName: functionNames,

            region: regionNames,
            cluster: clusterNames,
            market: marketNames,
            site: siteNames,

            forumOwner1: forumOwner1Email,
            forumOwner2: forumOwner2Email,
            collaborators: collaboratorEmails.join(','),

            status,
        };
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        if (!isValidGeographySelection(selectedGeographies)) {
            onToastTrigger?.({ message: 'Please select Geography before saving.', type: 'Error' });
            return;
        }

        if (!isFormValid()) {
            onToastTrigger?.({
                message: 'Please complete all required fields before submitting.',
                type: 'Error',
            });
            return;
        }

        const payload = createForumPayload();
        setIsSubmitting(true);
        const action = mode === 'edit' ? editForumDetails : addNewForum;

        try {
            await dispatch(action(payload)).unwrap();

            onToastTrigger?.({
                message: `Forum ${forumName} ${mode === 'edit' ? 'updated' : 'added'} successfully`,
                type: 'Success',
            });

            onForumAdded?.(forumName);
            onCancelClick();
        } catch (error: any) {
            const errorMessage =
                error?.message === 'Forum name already exists'
                    ? 'The selected Forum name, level, period, and geography combination already exists. Please modify the selections or use the existing forum.'
                    : '';

            setForumNameError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles['outer-container']}>
            <PrefilledDataHandler
                mode={mode}
                prefilledData={prefilledData ?? {}}
                functionDD={functionDD}
                forumOwner1Options={forumOwner1Options}
                forumOwner2Options={forumOwner2Options}
                collaboratorOptions={collaboratorOptions}
                applicationLocations={applicationLocations}
                setForumName={setForumName}
                setSelectedForumLevel={setSelectedForumLevel}
                setSelectedForumPeriod={setSelectedForumPeriod}
                forumLevelOptions={forumLevelOptions ?? []}
                forumPeriodOptions={forumPeriodOptions ?? []}
                setSelectedFunctions={setSelectedFunctions}
                setSelectedForumOwner1={setSelectedForumOwner1}
                setSelectedForumOwner2={setSelectedForumOwner2}
                setSelectedCollaborators={setSelectedCollaborators}
                setStatus={setStatus}
                setSelectedGeographies={setSelectedGeographies}
                setSelectedForumLevelId={setSelectedForumLevelId}
                setSelectedForumPeriodId={setSelectedForumPeriodId}
            />

            <div className={styles['outer-container']}>
                <Flyout
                    heading={mode === 'edit' ? 'Edit Forum' : 'Add Forum'}
                    flyoutOpen={isOpen}
                    direction="right"
                    cancelIconClick={onCancelClick}
                    primaryBtnProps={{
                        text: mode === 'edit' ? 'Save' : 'Add Forum',
                        onClick: handleSubmit,
                        disabled: !isForumButtonEnabled(),
                        loading: isSubmitting,
                    }}
                    cancelBtnProps={{
                        disabled: false,
                        onClick: onCancelClick,
                        text: 'Cancel',
                        variant: 'Subtle2',
                    }}
                    content={
                        <AddForumFlyoutBody
                            key={`flyout-body-${geoVersion}`}
                            forumName={forumName}
                            setForumName={setForumName}
                            forumNameError={forumNameError}
                            selectedForumLevel={selectedForumLevel}
                            setSelectedForumLevel={setSelectedForumLevel}
                            forumLevelOptions={forumLevelOptions}
                            forumPeriodOptions={forumPeriodOptions}
                            selectedForumPeriod={selectedForumPeriod}
                            setSelectedForumPeriod={setSelectedForumPeriod}
                            setSelectedForumLevelId={setSelectedForumLevelId}
                            setSelectedForumPeriodId={setSelectedForumPeriodId}
                            applicationLocations={applicationLocations}
                            selectedGeographies={selectedGeographies}
                            handleGeographyChange={handleGeographyChange}
                            functionDD={functionDD}
                            status={status}
                            setStatus={setStatus}
                            selectedFunctions={selectedFunctions}
                            setSelectedFunctions={setSelectedFunctions}
                            forumOwner1Options={forumOwner1Options}
                            forumOwner2Options={forumOwner2Options}
                            collaboratorOptions={collaboratorOptions}
                            selectedForumOwner1={selectedForumOwner1}
                            setSelectedForumOwner1={setSelectedForumOwner1}
                            selectedForumOwner2={selectedForumOwner2}
                            setSelectedForumOwner2={setSelectedForumOwner2}
                            selectedCollaborators={selectedCollaborators}
                            setSelectedCollaborators={setSelectedCollaborators}
                        />
                    }
                    id="add-forum-flyout"
                    iconForCancel={{ icon: 'x-close', onClick: onCancelClick }}
                    onBackDropClick={() => onCancelClick()}
                />
            </div>
        </div>
    );
};

export default AddForumFlyout;
