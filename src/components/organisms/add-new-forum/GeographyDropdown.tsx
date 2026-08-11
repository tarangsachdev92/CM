import React, { useCallback, useState } from 'react';
import { DropDown } from 'konnect-react-components';
import type { TreeDropDownOptionType } from '../../../types/common';
import type { ILocationsData } from '../../../types/response';

type GeographyLevel = 'global' | 'region' | 'cluster' | 'market' | 'site';

type EnrichedGeography = {
    label: string[];
    value: string;
    type: GeographyLevel;
};

type Props = {
    applicationLocations: ILocationsData[];
    selectedValue: EnrichedGeography[];
    onChange: (option: EnrichedGeography) => void;
    isReset?: boolean;
    forumLevel?: string;
};

const GeographyDropdownComponent: React.FC<Props> = ({
    applicationLocations,
    selectedValue,
    onChange,
    isReset = false,
    forumLevel = '',
}) => {
    //  HARDEN: never allow non-arrays to flow into tree builder / DropDown
    const safeLocations = Array.isArray(applicationLocations) ? applicationLocations : [];
    const safeSelectedValue = Array.isArray(selectedValue) ? selectedValue : [];

    const fl = (forumLevel || '').toLowerCase(); // global | region | cluster | market | site

    const levelToId = { global: '0', region: '1', cluster: '2', market: '3', site: '4' } as const;

    const targetTypeId =
        fl === 'global'
            ? levelToId.global
            : fl === 'region'
              ? levelToId.region
              : fl === 'cluster'
                ? levelToId.cluster
                : fl === 'market'
                  ? levelToId.market
                  : fl === 'site'
                    ? levelToId.site
                    : undefined;

    const targetDepth =
        fl === 'global' ? 0 : fl === 'region' ? 1 : fl === 'cluster' ? 2 : fl === 'market' ? 3 : 4;

    const [version, setVersion] = useState(0);

    const getLocationOptionsConversion = useCallback((): TreeDropDownOptionType[] => {
        const out: TreeDropDownOptionType[] = [];

        const decorate = (label: string, levelId: string) =>
            !targetTypeId || targetTypeId === levelId ? label : `${label}`;

        const push = (
            arr: TreeDropDownOptionType[],
            label: string,
            value: string | number,
            levelId: '1' | '2' | '3' | '4',
        ) => {
            const selectable = !targetTypeId || targetTypeId === levelId;
            const node: TreeDropDownOptionType = {
                label: decorate(label, levelId),
                value: String(value),
                typeId: levelId,
                disabled: !selectable,
                hideCheckbox: !selectable,
                subOption: [],
            };
            arr.push(node);
            return node;
        };

        if (targetTypeId === levelToId.global) {
            return [
                {
                    label: 'Global',
                    value: 'global',
                    typeId: levelToId.global,
                    disabled: false,
                    hideCheckbox: false,
                    subOption: [],
                },
            ];
        }

        safeLocations.forEach((region: any) => {
            const r = push(out, region.regionName, region.regionId, levelToId.region);
            if (targetDepth === 1) return;

            (region.clusters ?? []).forEach((cluster: any) => {
                const c = push(
                    r.subOption!,
                    cluster.clusterName,
                    cluster.clusterId,
                    levelToId.cluster,
                );
                if (targetDepth === 2) return;

                (cluster.markets ?? []).forEach((market: any) => {
                    const m = push(
                        c.subOption!,
                        market.marketName,
                        market.marketId,
                        levelToId.market,
                    );
                    if (targetDepth === 3) return;

                    (market.sites ?? []).forEach((site: any) => {
                        push(m.subOption!, site.siteName, site.siteId, levelToId.site);
                    });
                });
            });
        });

        function stripGlobal(nodes: TreeDropDownOptionType[]): TreeDropDownOptionType[] {
            const isGlobalish = (n: TreeDropDownOptionType) => {
                const label = String((n as any).label ?? '')
                    .trim()
                    .toLowerCase();
                const value = String((n as any).value ?? '')
                    .trim()
                    .toLowerCase();
                const typeId = String((n as any).typeId ?? '');
                return typeId === levelToId.global || value === 'global' || label === 'global';
            };

            return nodes
                .filter(n => !isGlobalish(n))
                .map(n => ({
                    ...n,
                    subOption: n.subOption
                        ? stripGlobal(n.subOption as TreeDropDownOptionType[])
                        : [],
                }));
        }

        return stripGlobal(out);
    }, [
        safeLocations,
        levelToId.cluster,
        levelToId.market,
        levelToId.region,
        levelToId.site,
        levelToId.global,
        targetDepth,
        targetTypeId,
    ]);

    const getGeographyTypeName = (typeId: string): GeographyLevel => {
        switch (typeId) {
            case '0':
                return 'global';
            case '1':
                return 'region';
            case '2':
                return 'cluster';
            case '3':
                return 'market';
            case '4':
                return 'site';
            default:
                return 'region';
        }
    };

    const findOptionByValue = (
        opts: TreeDropDownOptionType[],
        val: string,
    ): TreeDropDownOptionType | null => {
        for (const o of opts) {
            if (o.value === val) return o;
            if (o.subOption?.length) {
                const r = findOptionByValue(o.subOption, val);
                if (r) return r;
            }
        }
        return null;
    };

    const findPath = (
        opts: TreeDropDownOptionType[],
        val: string,
        acc: TreeDropDownOptionType[] = [],
    ): TreeDropDownOptionType[] | null => {
        for (const o of opts) {
            const next = [...acc, o];
            if (o.value === val) return next;
            if (o.subOption?.length) {
                const r = findPath(o.subOption, val, next);
                if (r) return r;
            }
        }
        return null;
    };

    const handleChange = (selectedItem: any) => {
        const opts = getLocationOptionsConversion();

        let selTypeId = String(selectedItem?.typeId ?? selectedItem?.type ?? '');
        if (!selTypeId) {
            const n = findOptionByValue(opts, String(selectedItem?.value ?? ''));
            selTypeId = String((n as any)?.typeId ?? '');
        }

        if (targetTypeId && selTypeId !== targetTypeId) {
            setVersion(v => v + 1);
            return;
        }

        const path = findPath(opts, selectedItem.value);
        if (!path) return;

        const last = path[path.length - 1]!;
        const clean = (s: string) => s.replace(/\s*\(view only\)\s*$/i, '');

        const enriched: EnrichedGeography = {
            label: path.map(p => clean(String(p.label))),
            value: String(selectedItem.value),
            type: getGeographyTypeName(String((last as any).typeId ?? '1')),
        };

        onChange(enriched);
    };

    const options = getLocationOptionsConversion();
    const countSelectableOptions = (nodes: TreeDropDownOptionType[] = []): number => {
        let count = 0;

        const walk = (items: TreeDropDownOptionType[]) => {
            items.forEach(item => {
                if (!item.disabled) {
                    count += 1;
                }
                if (item.subOption?.length) {
                    walk(item.subOption);
                }
            });
        };

        walk(nodes);
        return count;
    };
    const showSearch = countSelectableOptions(options) > 10;

    const filteredSelectedValue =
        fl === 'global'
            ? safeSelectedValue
            : safeSelectedValue.filter(
                  sv =>
                      sv.type !== 'global' &&
                      String(sv.value).toLowerCase() !== 'global' &&
                      sv.label.every(l => l.trim().toLowerCase() !== 'global'),
              );

    const selectedOptions = (
        filteredSelectedValue
            .map(geo => findOptionByValue(options, geo.value))
            .filter(Boolean) as TreeDropDownOptionType[]
    )
        .filter(o => String((o as any).typeId) === (targetTypeId ?? String((o as any).typeId)))
        .map(o => ({ ...o, label: String(o.label).replace(/\s*\(view only\)\s*$/i, '') }));

    return (
        <DropDown
            id="geography-dropdown"
            key={`${isReset ? 'reset' : 'normal'}-${forumLevel || 'default'}-${version}`}
            dropdown={{
                isDisabled: false,
                label: 'Geography',
                reset: isReset,
                required: true,
                onChange: handleChange,

                //  ALWAYS arrays — this is what prevents Z.filter crash inside DropDown
                options: Array.isArray(options) ? options : [],
                selectedOptions: Array.isArray(selectedOptions) ? selectedOptions : [],

                placeholder: 'Select',
                size: 'L',
                type: 'tree',
                onlyLeafSelectableInSingleSelectTreeView: true,
            }}
            // searchInput={{ searchPlaceholder: 'Search', searchSize: 'S', searchWholeString: true }}

            searchInput={
                showSearch
                    ? {
                          searchPlaceholder: 'Search',
                          searchSize: 'L',
                          searchWholeString: true,
                      }
                    : undefined
            }
        />
    );
};

export default GeographyDropdownComponent;
