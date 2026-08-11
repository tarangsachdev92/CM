import { Button, Flex, Skeleton } from 'antd';
import { DropDown, Icon } from 'konnect-react-components';
import Style from './RuleFlyoutDimensionMapping.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import {
    AppDispatch,
    fetchDimension,
    fetchOtherDimensionValues,
    fetchRoleLocations,
    RootState,
} from '../../../store';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    IDimensionMappingDetails,
    INotiDimensionMapping,
    IPrimaryRoleData,
} from '../../../types/response';
import { GEOGRAPHY, GeographyTypeLabel } from '../../../utils/constants';
import { TreeDropDownOptionType } from '../../../types/common';
import { IDimensionValueRequest } from '../../../types/request';
import { logError } from '../../../utils/helpers';

type DdlOptions = {
    label: string;
    value: string;
};

type Props = {
    dimensions: INotiDimensionMapping[] | [];
    setDimension: (data: INotiDimensionMapping[]) => void;
    ruleId: number;
    openDdId: string | null;
    setOpenDdId: (id: string | null) => void;
};

function RuleFlyoutDimensionMapping({
    dimensions,
    setDimension,
    ruleId,
    openDdId,
    setOpenDdId,
}: Props) {
    const [isDisabled, setisDisabled] = useState<boolean>(false);
    const [loadingDimensionValues, setLoadingDimensionValues] = useState<boolean>(true);

    const [geographyDropdownOptions, setGeographyDropdownOptions] = useState<
        TreeDropDownOptionType[]
    >([]);
    const globalFilters = useSelector((state: RootState) => state.userGlobalFilters.data);
    const dispatch = useDispatch<AppDispatch>();
    const issueData = useSelector((state: RootState) => state.issue);
    const dimensionValues = issueData.dimensions;
    const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const primaryFunctions = useSelector((state: RootState) => state.roleFunctions);
    const applicationLocations = primaryFunctions.locationData;
    const userPrimaryRole = useSelector(
        (state: RootState) => state.primaryRole.data,
    ) as IPrimaryRoleData;
    const [primaryRoleLocation, setPrimaryRoleLocation] = useState<{
        regionId?: number | null;
        clusterId?: number | null;
        marketId?: number | null;
        siteId?: number | null;
    }>({});

    const suppressOpenRef = useRef(false);
    const reopenLockUntilRef = useRef<number>(0);

    const openHandler = (id: string) => {
        const now = Date.now();
        if (reopenLockUntilRef.current > now) return;
        if (suppressOpenRef.current) {
            suppressOpenRef.current = false;
            return;
        }
        if (openDdId !== id) setOpenDdId(id);
    };

    const closeAfterSelect = () => {
        reopenLockUntilRef.current = Date.now() + 180;
        suppressOpenRef.current = true;
        (document.activeElement as HTMLElement | null)?.blur?.();
        requestAnimationFrame(() => setOpenDdId(null));
    };

    useEffect(() => {
        setOpenDdId(null);
    }, [ruleId, setOpenDdId]);

    useEffect(() => {
        if (userPrimaryRole) {
            setPrimaryRoleLocation({
                regionId: userPrimaryRole.regionId ? Number(userPrimaryRole.regionId) : null,
                clusterId: userPrimaryRole.clusterId ? Number(userPrimaryRole.clusterId) : null,
                marketId: userPrimaryRole.marketId ? Number(userPrimaryRole.marketId) : null,
                siteId: userPrimaryRole.siteId ? Number(userPrimaryRole.siteId) : null,
            });
        }
    }, [userPrimaryRole]);

    useEffect(() => {
        dispatch(fetchDimension());
        dispatch(fetchRoleLocations());
    }, [dispatch]);

    useEffect(() => {
        setGeographyDropdownOptions(getLocationOptionsConversion() as TreeDropDownOptionType[]);
    }, [applicationLocations]);

    useEffect(() => {
        if (dimensions.length == 0) {
            const geoDimension = dimensionValues.filter(d => d.dimensionName === GEOGRAPHY)[0];
            geoDimension &&
                setDimension([
                    {
                        dimensionId: geoDimension?.dimensionId,
                        dimensionName: geoDimension.dimensionName,
                        value: '',
                        id: generateId(),
                    },
                ]);
        } else {
            const geographyDimension = dimensions.filter(d => d.dimensionName === GEOGRAPHY)[0];

            let updatedDimensions: INotiDimensionMapping[] = [];
            const fetchAllDimensions = async () => {
                for (let index = 0; index < dimensions.length; index++) {
                    const d = dimensions[index];
                    const previousMappings = [...dimensions].slice(0, index).map(item => ({
                        dimensionId: item.dimensionId,
                        dimensionName: item.dimensionName,
                        dimensionValue: item.value,
                    }));
                    if (d) {
                        if (d.dimensionName === GEOGRAPHY) continue;

                        if (geographyDimension) {
                            const payload: IDimensionValueRequest = {
                                dimensionId: d.dimensionId,
                                gridColumnSearchJson: previousMappings,
                                userGlobalFilters: globalFilters.userGlobalFilters,
                            };

                            try {
                                const response: any = await dispatch(
                                    fetchOtherDimensionValues(payload),
                                );
                                const dimensionValues =
                                    response?.payload?.dimensionCodeValues || [];

                                const mappedDimensionValues = dimensionValues.map((val: any) => ({
                                    label: val.value,
                                    value: val.code,
                                    desc: val.value,
                                }));
                                const selectedOption = d.value.split(',').map((val: any) => {
                                    if (
                                        mappedDimensionValues.findIndex(
                                            (v: any) => v.label == val,
                                        ) < 0
                                    ) {
                                        mappedDimensionValues.push({ label: val, value: val });
                                    }
                                    return { label: val, value: val };
                                });

                                updatedDimensions.push({
                                    ...d,
                                    availableValues: mappedDimensionValues,
                                    selectedValues: selectedOption,
                                });
                            } catch (error) {
                                logError(error);
                            }
                        }
                    }
                } // Set all at once after loop

                if (geographyDimension) {
                    updatedDimensions = [geographyDimension, ...updatedDimensions];
                }
                setDimension([...updatedDimensions]);
                setLoadingDimensionValues(false);
            };
            if (dimensions.some(d => d.dimensionName !== GEOGRAPHY && !d.availableValues)) {
                fetchAllDimensions();
            } else {
                setLoadingDimensionValues(false);
            }
        }
    }, [dimensionValues, applicationLocations]);

    const handleScroll = (row: any) => {
        const selectedRow = dimensions.find(r => r.dimensionName === row.dimensionName);
        if (selectedRow) {
            const nextPage = Math.floor(
                (selectedRow.availableValues ? selectedRow.availableValues.length : 0) / 20,
            );
            const payload: IDimensionValueRequest = {
                dimensionId: Number(row.dimensionId),
                gridColumnSearchJson: [], // Add filters if needed
                userGlobalFilters: globalFilters?.userGlobalFilters,
                PageNumber: nextPage > 0 ? nextPage + 1 : 2,
                PageSize: 20,
            };
            dispatch(fetchOtherDimensionValues(payload)).then((response: any) => {
                const dimensionValues = response?.payload?.dimensionCodeValues || []; // Map API result into dropdown option format

                const mappedDimensionValues = dimensionValues.map((val: any) => ({
                    label: val.value,
                    value: val.code,
                    desc: val.value,
                }));
                if (mappedDimensionValues.length > 0) {
                    // Update the selected dimension with new dropdown options
                    setDimension(
                        dimensions.map(d =>
                            d.id === row.id
                                ? {
                                      ...d,
                                      availableValues: d.availableValues
                                          ? [...d.availableValues, ...mappedDimensionValues]
                                          : [...mappedDimensionValues],
                                  }
                                : d,
                        ),
                    );
                }
            });
        }
    };

    const getAutoSelectedGeographyValues = (
        geographyOptions: TreeDropDownOptionType[],
        location: typeof primaryRoleLocation,
    ): { label: string; value: string; originalLabel: string; originalValue: string }[] => {
        const findOption = (options: any[], id: string): any => {
            for (const option of options) {
                if (option.value === id) return option;
                if (option.subOption?.length) {
                    const found = findOption(option.subOption, id);
                    if (found) return found;
                }
            }
            return null;
        };
        const selectedValues: any[] = [];
        const { regionId, clusterId, marketId, siteId } = location;
        if (regionId) {
            const region = findOption(geographyOptions, regionId.toString());
            if (region)
                selectedValues.push({
                    label: region.label,
                    value: `Region:${region.label}`,
                    originalLabel: region.label,
                    originalValue: region.value,
                });
        }
        if (clusterId) {
            const cluster = findOption(geographyOptions, clusterId.toString());
            if (cluster)
                selectedValues.push({
                    label: cluster.label,
                    value: `Cluster:${cluster.label}`,
                    originalLabel: cluster.label,
                    originalValue: cluster.value,
                });
        }
        if (marketId) {
            const market = findOption(geographyOptions, marketId.toString());
            if (market)
                selectedValues.push({
                    label: market.label,
                    value: `Market:${market.label}`,
                    originalLabel: market.label,
                    originalValue: market.value,
                });
        }
        if (siteId) {
            const site = findOption(geographyOptions, siteId.toString());
            if (site)
                selectedValues.push({
                    label: site.label,
                    value: `Site:${site.label}`,
                    originalLabel: site.label,
                    originalValue: site.value,
                });
        }
        return selectedValues;
    };

    useEffect(() => {
        if (
            dimensions.length &&
            dimensionValues.length &&
            applicationLocations.length &&
            ruleId == 0
        ) {
            const geographyDimension = dimensions.find(
                (d: { dimensionName: string }) => d.dimensionName === GEOGRAPHY,
            );
            if (!geographyDimension) return;
            const updatedDimensions = dimensions.map((row: INotiDimensionMapping, index: number) =>
                index === 0
                    ? {
                          ...row,
                          selectedDimension: String(geographyDimension.dimensionId),
                          selectedDimensionLabel: geographyDimension.dimensionName,
                          dimensionOptions: geographyDropdownOptions,
                          selectedValues: [],
                      }
                    : row,
            );

            setDimension(updatedDimensions);

            if (
                geographyDropdownOptions.length &&
                primaryRoleLocation &&
                Object.values(primaryRoleLocation).some(v => v !== null && v !== undefined)
            ) {
                const autoSelectedValues = getAutoSelectedGeographyValues(
                    geographyDropdownOptions,
                    primaryRoleLocation,
                );
                if (autoSelectedValues.length) {
                    const updatedDimensions = dimensions.map(
                        (row: INotiDimensionMapping, index: number) =>
                            index === 0
                                ? {
                                      ...row,
                                      selectedValues: autoSelectedValues,
                                      value: autoSelectedValues.map(v => v.value).join(','),
                                  }
                                : row,
                    );

                    setDimension(updatedDimensions);
                }
            }
        }
    }, [dimensionValues, applicationLocations, geographyDropdownOptions, primaryRoleLocation]);
    const getLocationOptionsConversion = useCallback(
        (selectedLocationId?: number, typeId?: number) => {
            const convertedLocations: TreeDropDownOptionType[] = [];
            let selectedHeirarchy = {};
            applicationLocations.forEach((layer1, index) => {
                pushConvertedData(
                    layer1.regionName,
                    layer1.regionId,
                    layer1.geographyTypeId,
                    convertedLocations,
                );
                if (
                    !!selectedLocationId &&
                    layer1.regionId == selectedLocationId &&
                    layer1.geographyTypeId == typeId
                ) {
                    selectedHeirarchy = {
                        value: layer1.regionId,
                        label: layer1.regionName,
                    };
                }
                if (Object.hasOwn(layer1, 'clusters') && layer1?.clusters?.length > 0) {
                    layer1.clusters.forEach((layer2: any, index1: number) => {
                        pushConvertedData(
                            layer2.clusterName,
                            layer2.clusterId,
                            layer2.geographyTypeId,
                            convertedLocations[index]?.['subOption'],
                        );
                        if (
                            !!selectedLocationId &&
                            layer2.clusterId == selectedLocationId &&
                            layer2.geographyTypeId == typeId
                        ) {
                            selectedHeirarchy = {
                                value: layer1.regionId,
                                label: layer1.regionName,
                                subOption: {
                                    value: layer2.clusterId,
                                    label: layer2.clusterName,
                                },
                            };
                        }
                        if (Object.hasOwn(layer2, 'markets') && layer2?.markets?.length > 0) {
                            layer2.markets.forEach((layer3: any, index2: number) => {
                                pushConvertedData(
                                    layer3.marketName,
                                    layer3.marketId,
                                    layer3.geographyTypeId,
                                    convertedLocations?.[index]?.['subOption']?.[index1]?.[
                                        'subOption'
                                    ],
                                );
                                if (
                                    !!selectedLocationId &&
                                    layer3.marketId == selectedLocationId &&
                                    layer3.geographyTypeId == typeId
                                ) {
                                    selectedHeirarchy = {
                                        value: layer1.regionId,
                                        label: layer1.regionName,
                                        subOption: {
                                            value: layer2.clusterId,
                                            label: layer2.clusterName,
                                            subOption: {
                                                value: layer3.marketId,
                                                label: layer3.marketName,
                                            },
                                        },
                                    };
                                }
                                if (Object.hasOwn(layer3, 'sites') && layer3?.sites?.length > 0) {
                                    layer3.sites.forEach((layer4: any) => {
                                        pushConvertedData(
                                            layer4.siteName,
                                            layer4.siteId,
                                            layer4.geographyTypeId,
                                            convertedLocations?.[index]?.['subOption']?.[index1]?.[
                                                'subOption'
                                            ]?.[index2]?.['subOption'],
                                        );
                                        if (
                                            !!selectedLocationId &&
                                            layer4.siteId == selectedLocationId
                                        ) {
                                            selectedHeirarchy = {
                                                value: layer1.regionId,
                                                label: layer1.regionName,
                                                subOption: {
                                                    value: layer2.clusterId,
                                                    label: layer2.clusterName,
                                                    subOption: {
                                                        value: layer3.marketId,
                                                        label: layer3.marketName,
                                                        subOption: {
                                                            value: layer4.siteId,
                                                            label: layer4.siteName,
                                                        },
                                                    },
                                                },
                                            };
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
            return selectedLocationId ? selectedHeirarchy : convertedLocations;
        },
        [applicationLocations],
    );

    const pushConvertedData = useCallback(
        (name: string, id: number, typeId: number, arrToPush: any) => {
            if (!!id && !!name) {
                const obj: TreeDropDownOptionType = {
                    label: name,
                    value: id.toString(),
                    typeId: typeId.toString(),
                    subOption: [],
                };
                arrToPush.push(obj);
            }
        },
        [],
    );

    //handle enable and disable of add dimension button
    useEffect(() => {
        if (dimensions.length === 0) {
            setisDisabled(false);
            return;
        }

        if (dimensions.some(d => d.dimensionName === GEOGRAPHY && d.value.length === 0)) {
            setisDisabled(true);
            return;
        }

        if (
            dimensions.some(
                d =>
                    d.value === '' ||
                    d.value.split(',').length === 0 ||
                    d.dimensionName === '' ||
                    d.dimensionName === null,
            )
        ) {
            setisDisabled(true);
            return;
        }

        setisDisabled(false);
    }, [dimensions]);

    useEffect(() => {
        const geoRow = dimensions.find(d => d.dimensionName === GEOGRAPHY);
        if (!geoRow || !geoRow.value || geoRow.selectedValues?.some(s => s.originalValue)) return;

        const findNodeIdByLabel = (options: any[], lbl: string): string | undefined => {
            for (const o of options) {
                if (o.label === lbl) return String(o.value);
                if (o.subOption?.length) {
                    const hit = findNodeIdByLabel(o.subOption, lbl);
                    if (hit) return hit;
                }
            }
            return undefined;
        };

        const selectedValues = geoRow.value
            .split(',')
            .map(v => {
                const plain = v.split(':').slice(1).join(':') ?? '';
                if (!plain) return null;

                return {
                    label: v,
                    value: v,
                    originalLabel: plain,
                    originalValue: findNodeIdByLabel(geographyDropdownOptions, plain),
                };
            })
            .filter(Boolean) as NonNullable<INotiDimensionMapping['selectedValues']>;

        setDimension(dimensions.map(d => (d.id === geoRow.id ? { ...d, selectedValues } : d)));
    }, [geographyDropdownOptions]);

    const getSelectedDimensionPayload = (): IDimensionMappingDetails[] => {
        return dimensions.slice(0, dimensions.length - 1).map(dim => ({
            dimensionId: dim.dimensionId,
            dimensionName: dim.dimensionName,
            dimensionValue: dim.value ?? '',
        }));
    };

    //added to correctly display of geography dropdown selections
    const flattenTreeOptions = (options: TreeDropDownOptionType[]): TreeDropDownOptionType[] => {
        const flat: TreeDropDownOptionType[] = [];
        const traverse = (items: TreeDropDownOptionType[]) => {
            for (const item of items) {
                flat.push({ label: item.label, value: item.value });
                if (item.subOption) {
                    traverse(item.subOption);
                }
            }
        };
        traverse(options);
        return flat;
    };
    //Handle the dimension drop down change
    //This force to change the options available in dimensions ddl
    const handleDimensionChange = (id: string, option: DdlOptions) => {
        const selectedDimensionId = Number(option.value);
        const existingDimensionAndValues = getSelectedDimensionPayload();
        setDimension(
            dimensions.map(d =>
                d.id === id
                    ? {
                          ...d,
                          dimensionId: selectedDimensionId,
                          dimensionName: option.label,
                          availableValues: [],
                          selectedValues: [],
                          isLoading: true,
                          value: '',
                      }
                    : d,
            ),
        );

        //Global Filter dimensions
        const payload: IDimensionValueRequest = {
            dimensionId: selectedDimensionId,
            gridColumnSearchJson: existingDimensionAndValues,
            userGlobalFilters: globalFilters.userGlobalFilters,
        };
        // Prevent selecting the same dimension more than once
        if (dimensions.some(d => d.dimensionId === selectedDimensionId)) {
            return;
        }

        dispatch(fetchOtherDimensionValues(payload))
            .then((response: any) => {
                const dimensionValues = response?.payload?.dimensionCodeValues || []; // Map API result into dropdown option format

                const mappedDimensionValues = dimensionValues.map((val: any) => ({
                    label: val.code,
                    value: val.code,
                    desc: val.value,
                }));
                // Update the selected dimension with new dropdown options
                setDimension(
                    dimensions.map(d =>
                        d.id === id
                            ? {
                                  ...d,
                                  dimensionId: selectedDimensionId,
                                  dimensionName: option.label,
                                  availableValues: mappedDimensionValues,
                                  selectedValues: [],
                                  isLoading: false,
                                  value: '',
                              }
                            : d,
                    ),
                );
            })
            .catch((error: any) => {
                logError(error);
            });
    };

    //Handle dimension values change
    const handleDimensionValueChange = (option: any, rowId?: string) => {
        const updatedDimensions = dimensions.map((row: INotiDimensionMapping) => {
            if (row.id !== rowId) return row;

            const currentValues = row.selectedValues || [];
            const updatedValues = [...currentValues];
            const incomingOptions = Array.isArray(option) ? option : [option];

            incomingOptions.forEach((opt: any) => {
                const originalLabel = String(opt.label);
                const originalValue = String(opt.value);

                let newValue;
                if (row.dimensionName === GEOGRAPHY) {
                    const typeId = findTypeIdByLabel(geographyDropdownOptions, originalLabel);
                    const typeLabel = typeId ? GeographyTypeLabel[parseInt(typeId)] : undefined;
                    if (!typeLabel) return;
                    const value = `${typeLabel}:${originalLabel}`;
                    newValue = { label: value, value, originalLabel, originalValue };
                } else {
                    newValue = {
                        label: originalLabel,
                        value: originalValue,
                        originalLabel,
                        originalValue,
                    };
                }

                const exists = updatedValues.some(v => v.value === newValue.value);
                if (exists) {
                    const index = updatedValues.findIndex(v => v.value === newValue.value);
                    updatedValues.splice(index, 1);
                } else {
                    updatedValues.push(newValue);
                }
            });

            return {
                ...row,
                selectedValues: updatedValues,
                value: updatedValues.map(v => v.value).join(','),
            };
        });

        setDimension(updatedDimensions);
    };

    const findTypeIdByLabel = (options: any[], targetLabel: string): string | undefined => {
        for (const option of options) {
            if (option.label === targetLabel) {
                return option.typeId;
            }

            if (option.subOption?.length) {
                const found = findTypeIdByLabel(option.subOption, targetLabel);
                if (found) return found;
            }
        }
        return undefined;
    };

    //handle dimension delete
    const handleDeleteDimesnion = (id: string) => {
        const newDimensions = dimensions.filter(d => d.id !== id);
        setDimension(newDimensions);
    };

    //Add new dimesnion
    const addNewDimension = () => {
        const newDimension: INotiDimensionMapping[] = [
            ...dimensions,
            {
                id: generateId(),
                dimensionId: 0,
                dimensionName: '',
                value: '',
            },
        ];
        setDimension(newDimension);
    };

    const getDropdownOptions = (
        availableValues: { label: string; value: string; desc: string }[] | undefined,
    ): { label: string; value: string; desc: string }[] => {
        if (!availableValues) return [];
        return availableValues.map(opt => {
            return {
                label: opt.label,
                value: opt.value,
                desc: opt.desc,
            };
        });
    };

    const getSelectedOptions = (
        value: string | undefined,
        availableValues: { label: string; value: string; desc: string }[] = [],
    ) => {
        if (!value) return [];
        return value.split(',').map(val => {
            const match = availableValues.find(opt => opt.value === val);
            return {
                label: match?.desc || val,
                value: val,
                desc: match?.desc || val,
            };
        });
    };

    return (
        <>
            <Flex justify="space-between" align="center" style={{ marginTop: '1.5rem' }}>
                <label className={Style['add-rule-dimension-title']}>
                    Mapped to
                    <span className={Style['form-required-fields']}> *</span>
                </label>
                             
                <Button
                    type="link"
                    icon={<Icon name="plus" size="xm" color="black-color" />}
                    className={Style['impact-input-grp-add-kpi-link']}
                    disabled={isDisabled}
                    onClick={() => {
                        addNewDimension();
                    }}
                >
                    Add Dimension
                </Button>
            </Flex>
            {loadingDimensionValues && <Skeleton.Input active block />}           
            {!loadingDimensionValues &&
                dimensions &&
                dimensions.map(d => {
                    const valDdId = `${d.id}-val`;
                    const geoDdId = `${d.id}-geo`;
                    return (
                        <Flex key={d.id} className={Style['dimension-row']}>
                            {/* Dimension dropdown */}
                            <div data-dd-root onClick={() => openHandler(`${d.id}-dim`)}>
                                <DropDown
                                    className={Style['dimension-drop-down']}
                                    dropdown={{
                                        isOpen: openDdId === `${d.id}-dim`,
                                        isDisabled: d.dimensionName === GEOGRAPHY,
                                        options: dimensionValues
                                            .filter(
                                                dv =>
                                                    !dimensions
                                                        .map(i => i.dimensionId)
                                                        .includes(dv.dimensionId) ||
                                                    dv.dimensionId === d.dimensionId,
                                            )
                                            .map(dv => ({
                                                label: dv.dimensionName,
                                                value: String(dv.dimensionId),
                                            })),
                                        reset: false,
                                        placeholder: 'Select Dimension',
                                        selectedOptions:
                                            d.dimensionId !== 0 && d.dimensionId
                                                ? [
                                                      {
                                                          value: String(d.dimensionId),
                                                          label: d.dimensionName + ' :',
                                                      },
                                                  ]
                                                : [],
                                        onChange: option => {
                                            handleDimensionChange(d.id ?? '', option);
                                            closeAfterSelect();
                                        },
                                        size: 'M',
                                    }}
                                    searchInput={
                                        Array.isArray(d.availableValues) &&
                                        d.availableValues.length > 10
                                            ? {
                                                  searchPlaceholder: 'Search',
                                                  searchSize: 'L',
                                                  searchWholeString: true,
                                              }
                                            : undefined
                                    }
                                />
                            </div>

                            {/* Value dropdowns */}
                            {d.dimensionName === GEOGRAPHY ? (
                                <div data-dd-root onMouseDown={() => openHandler(geoDdId)}>
                                    <DropDown
                                        dropdown={{
                                            isOpen: openDdId === geoDdId,
                                            isDisabled: false,
                                            isLabelInline: false,
                                            onChange: (option: any) => {
                                                handleDimensionValueChange(option, d.id);
                                            },
                                            options: geographyDropdownOptions,
                                            selectedOptions: d.selectedValues?.length
                                                ? flattenTreeOptions(
                                                      geographyDropdownOptions,
                                                  ).filter(opt =>
                                                      d.selectedValues!.some(
                                                          sel =>
                                                              (sel.originalValue ?? sel.value) ===
                                                              opt.value,
                                                      ),
                                                  )
                                                : [],
                                            placeholder: 'Select',
                                            reset: false,
                                            size: 'M',
                                            type: 'tree-multiselect',
                                            isMultiSelect: true,
                                            showMoreCount: true,
                                        }}
                                        dropdownOptionsClassName="geography-custom-dropdown"
                                        id="drop-down"
                                        searchInput={
                                            Array.isArray(d.availableValues) &&
                                            d.availableValues.length > 10
                                                ? {
                                                      searchPlaceholder: 'Search',
                                                      searchSize: 'L',
                                                      searchWholeString: true,
                                                  }
                                                : undefined
                                        }
                                        width="30em"
                                        maxHeight="22em"
                                    />
                                </div>
                            ) : (
                                <>
                                    {d.isLoading ? (
                                        <Skeleton.Input block active style={{ height: '40px' }} />
                                    ) : (
                                        <div data-dd-root onMouseDown={() => openHandler(valDdId)}>
                                            <DropDown
                                                className={Style['dimension-value-drop-down']}
                                                dropdown={{
                                                    isOpen: openDdId === valDdId,
                                                    isDisabled: false,
                                                    isLabelInline: false,
                                                    showDescription: true,
                                                    isLabelMuted: true,
                                                    onChange: option => {
                                                        handleDimensionValueChange(option, d.id);
                                                    },
                                                    options: getDropdownOptions(d.availableValues),
                                                    selectedOptions: getSelectedOptions(
                                                        d.value,
                                                        d.availableValues,
                                                    ),
                                                    placeholder: 'Select',
                                                    reset: false,
                                                    size: 'M',
                                                    type: 'checkbox',
                                                    showMoreCount: true,
                                                    onScroll: () => handleScroll(d),
                                                    showTooltipWithDescription: true,
                                                    truncateOptions: true,
                                                    isCounterEnable: true,
                                                    showtooltipcounter: true,
                                                }}
                                                dropdownOptionsClassName="dropdown-options-custom"
                                                id="drop-down"
                                                searchInput={
                                                    Array.isArray(d.availableValues) &&
                                                    d.availableValues.length > 10
                                                        ? {
                                                              searchPlaceholder: 'Search',
                                                              searchSize: 'L',
                                                              searchWholeString: true,
                                                          }
                                                        : undefined
                                                }
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                            <button
                                className={Style['rule-dimension-delete-icon-btn']}
                                onClick={() => {
                                    handleDeleteDimesnion(d.id ?? '');
                                    setOpenDdId(null);
                                }}
                                disabled={d.dimensionName === GEOGRAPHY}
                            >
                                <Icon
                                    size="l"
                                    name="trash-01"
                                    color={
                                        d.dimensionName === GEOGRAPHY
                                            ? 'neutrals-B100'
                                            : 'black-color'
                                    }
                                />
                            </button>
                        </Flex>
                    );
                })}
        </>
    );
}

export default RuleFlyoutDimensionMapping;
