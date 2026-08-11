import { useEffect, Dispatch, SetStateAction, useRef } from 'react';

interface OptionType {
    label: string;
    value: string;
}

type GeographyLevel = 'region' | 'cluster' | 'market' | 'site' | '';

interface GeographyType {
    label: string[];
    value: string;
    type: GeographyLevel;
}

export interface ILocationsData {
    regionId: number;
    regionName: string;
    geographyTypeId: number;
    clusters?: {
        clusterId: number;
        clusterName: string;
        geographyTypeId: number;
        markets?: {
            marketId: number;
            marketName: string;
            geographyTypeId: number;
            sites?: {
                siteId: number;
                siteName: string;
                geographyTypeId: number;
            }[];
        }[];
    }[];
}

interface PrefilledDataHandlerProps {
    mode: string;
    prefilledData: Record<string, any>;
    functionDD: OptionType[];
    forumOwner1Options: OptionType[];
    forumOwner2Options: OptionType[];
    collaboratorOptions: OptionType[];
    applicationLocations: ILocationsData[];
    forumLevelOptions: OptionType[];
    forumPeriodOptions: OptionType[];
    setForumName: (value: string) => void;
    setSelectedFunctions: (values: string[]) => void;
    setSelectedForumOwner1: (values: string[]) => void;
    setSelectedForumOwner2: (values: string[]) => void;
    setSelectedCollaborators: (values: string[]) => void;
    setSelectedGeographies: (values: GeographyType[]) => void;
    setSelectedForumLevel: (value: string) => void;
    setSelectedForumPeriod: (value: string) => void;
    setStatus: Dispatch<SetStateAction<number>>;
    setSelectedForumLevelId: (value: string) => void;
    setSelectedForumPeriodId: (value: string) => void;
}

const PrefilledDataHandler: React.FC<PrefilledDataHandlerProps> = props => {
    const hasPrefilled = useRef(false);
    useEffect(() => {
        if (
            props.mode === 'edit' &&
            props.prefilledData &&
            areOptionsLoaded(props) &&
            !hasPrefilled.current
        ) {
            hasPrefilled.current = true;

            props.setForumName(props.prefilledData.forumName ?? '');

            setMappedValues(
                props.prefilledData,
                props.functionDD,
                props.setSelectedFunctions,
                'functionName',
            );
            setMappedValues(
                props.prefilledData,
                props.forumOwner1Options,
                props.setSelectedForumOwner1,
                'forumOwner1',
            );
            setMappedValues(
                props.prefilledData,
                props.forumOwner2Options,
                props.setSelectedForumOwner2,
                'forumOwner2',
            );
            setMappedValues(
                props.prefilledData,
                props.collaboratorOptions,
                props.setSelectedCollaborators,
                'collaborators',
            );

            setDirectValues(props);

            const enrichedGeos = getGeographies(props.prefilledData, props.applicationLocations);
            props.setSelectedGeographies(enrichedGeos);
        }
    }, [
        props.mode,
        props.prefilledData,
        props.functionDD,
        props.forumOwner1Options,
        props.forumOwner2Options,
        props.collaboratorOptions,
        props.applicationLocations,
        props.forumLevelOptions,
        props.forumPeriodOptions,
    ]);

    return null;
};

const areOptionsLoaded = (props: PrefilledDataHandlerProps) =>
    Array.isArray(props.functionDD) &&
    props.functionDD.length > 0 &&
    Array.isArray(props.forumOwner1Options) &&
    props.forumOwner1Options.length > 0 &&
    Array.isArray(props.forumOwner2Options) &&
    props.forumOwner2Options.length > 0 &&
    Array.isArray(props.collaboratorOptions) &&
    props.collaboratorOptions.length > 0 &&
    Array.isArray(props.forumLevelOptions) &&
    props.forumLevelOptions.length > 0 &&
    Array.isArray(props.forumPeriodOptions) &&
    props.forumPeriodOptions.length > 0 &&
    Array.isArray(props.applicationLocations)
    && props.applicationLocations.length > 0;

const setMappedValues = (
    data: Record<string, any>,
    options: OptionType[],
    setter: (values: string[]) => void,
    key: string,
) => {
    if (data[key]) {
        const selected = data[key].split(',').map((s: string) => s?.trim().toLowerCase());
        const matched = options
            .filter(o => selected.includes(o.label?.trim().toLowerCase()))
            .map(o => o.value);
        setter(matched);
    }
};

const setDirectValues = (props: PrefilledDataHandlerProps) => {
    const mappings: Record<string, (value: any) => void> = {
        status: val => props.setStatus(Number(val)),
        forumLevel: val => {
            const match = props.forumLevelOptions.find(
                opt => opt.label.trim().toLowerCase() === val.trim().toLowerCase(),
            );
            if (match) {
                props.setSelectedForumLevel(match.label);
                (props as any).setSelectedForumLevelId?.(match.value);
            }
        },
        forumPeriod: val => {
            const match = props.forumPeriodOptions.find(
                opt => opt.label.trim().toLowerCase() === val.trim().toLowerCase(),
            );
            if (match) {
                props.setSelectedForumPeriod(match.label);
                (props as any).setSelectedForumPeriodId?.(match.value);
            }

        },
    };

    Object.entries(mappings).forEach(([key, setter]) => {
        if (props.prefilledData[key] !== undefined && props.prefilledData[key] !== null) {
            setter(props.prefilledData[key]);
        }
    });
};

const getGeographies = (
    data: Record<string, any>,
    applicationLocations: ILocationsData[],
): GeographyType[] => {
    const result: GeographyType[] = [];

    const normalize = (str: string) => str?.trim().toLowerCase();

    const findPath = (
        locations: ILocationsData[],
        targetLabel: string,
        type: GeographyLevel,
        path: string[] = [],
    ): GeographyType | null => {
        for (const region of locations) {
            const regionPath = [...path, region.regionName];
            if (type === 'region' && normalize(region.regionName) === normalize(targetLabel)) {
                return { label: regionPath, value: region.regionId.toString(), type };
            }
            for (const cluster of region.clusters || []) {
                const clusterPath = [...regionPath, cluster.clusterName];
                if (
                    type === 'cluster' &&
                    normalize(cluster.clusterName) === normalize(targetLabel)
                ) {
                    return { label: clusterPath, value: cluster.clusterId.toString(), type };
                }
                for (const market of cluster.markets || []) {
                    const marketPath = [...clusterPath, market.marketName];
                    if (
                        type === 'market' &&
                        normalize(market.marketName) === normalize(targetLabel)
                    ) {
                        return { label: marketPath, value: market.marketId.toString(), type };
                    }
                    for (const site of market.sites || []) {
                        const sitePath = [...marketPath, site.siteName];
                        if (
                            type === 'site' &&
                            normalize(site.siteName) === normalize(targetLabel)
                        ) {
                            return { label: sitePath, value: site.siteId.toString(), type };
                        }
                    }
                }
            }
        }
        return null;
    };

    const geographyLevels: GeographyLevel[] = ['region', 'cluster', 'market', 'site'];

    geographyLevels.forEach(type => {
        const raw = data[type];
        if (!raw || typeof raw !== 'string') return;

        const entries = type === 'site' ? [raw.trim()] : raw.split(',').map(s => s.trim());
        entries.forEach(label => {
            const match = findPath(applicationLocations, label, type);
            if (match) result.push(match);
        });
    });

    const handleGlobalFallback = (): GeographyType[] => {
        const allLabels = geographyLevels
            .map(key => data[key])
            .filter(Boolean)
            .flatMap(val => (typeof val === 'string' ? val.split(',').map(s => s.trim()) : []));

        const hasGlobal = allLabels.some(label => normalize(label) === 'global');

        return hasGlobal ? [{ label: ['Global'], value: 'global', type: '' }] : [];
    };

    const globalFallback = handleGlobalFallback();
    if (globalFallback.length > 0) return globalFallback;

    const finalResult = result.findLast(i => i);
    return finalResult ? [finalResult] : [{ label: [], value: '', type: '' }];
};

export default PrefilledDataHandler;
