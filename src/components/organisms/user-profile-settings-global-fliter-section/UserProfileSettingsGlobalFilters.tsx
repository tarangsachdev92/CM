import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Card, Flex, Skeleton } from 'antd';
import { TextButton } from '../../atoms';
import {
    DropDown,
    Icon,
    IconButton,
    CheckBox,
    FilterChip,
    Button,
    Toast,
} from 'konnect-react-components';
import { ExpandableForm } from '../../../components';
import styles from './UserProfileSettingsGlobalFilters.module.scss';
import {
    upsertFilterGroup,
    applySelectedFilterGroup,
    checkDuplicateFilterGroup,
    getProductHeirarchy,
    getGeographyHeirarchy,
    getChannelHeirarchy,
} from '../../../services/users';
import { useDispatch, useSelector } from 'react-redux';
import {
    type AppDispatch,
    type RootState,
    fetchPrimaryRole,
    getUserGlobalFilters,
} from '../../../store';
import {
    fetchFilterGroupDetails,
    fetchFilterHierarchies,
    fetchFilterFinancialCycle,
} from '../../../store/thunks/fetchFilterGroupDetails';
import { fetchAfUserRoleFilterDetails } from '../../../store';
import RoleBasedFilterCard from '../../molecules/role-based-filter-card/RoleBasedFilterCard';
import { getRoleBasedFilter } from '../../../services/roles';
import { RoleBasedFilterRole } from '../../../types/response';
import DeleteFilterGroup from './DeleteFilterGroup';
import FilterGroupFlyout from './FilterGroupFlyout';
import type {
    IFilterGroupItem,
    FilterGroupRequest,
    FilterGroupDataModel,
} from '../../../types/request';
import { validateForumName } from '../../../utils/validation';
import { ROLE_TYPE } from '../../../utils/constants';
import { logError, removeLeadingZeros } from '../../../utils/helpers';

type Option = {
    label: string;
    value: string;
    desc?: string;
    siteType?: string; //  used only for Site / SiteCode
};
type DropdownConfig = {
    label: string;
    isDisabled: boolean;
    options: Option[];
    selectedOptions: Option[];
    setSelected: (value: Option[]) => void;
    onChangeExtra?: () => void;
    onApply?: (selectedTree: Option[]) => void;
    onScroll?: () => void;
    onSearch?: (term: string) => void;
};

interface VarientProps {
    variant?: 'default' | 'flyout';
    handleCheckboxChange?: (checked: boolean, filterGroup: IFilterGroupItem) => void;
    handleFilterGroupCheckboxChange?: (checked: boolean, filterGroup: IFilterGroupItem) => void;
    onFiltersSelected?: (filters: FilterGroupRequest) => void;
    onDirtyChange?: (dirty: boolean) => void;
}

const UserProfileSettingsGlobalFilters = ({
    variant = 'default',
    // handleCheckboxChange,
    handleFilterGroupCheckboxChange,
    onDirtyChange,
    onFiltersSelected,
}: VarientProps) => {
    const [roleChecked, setRoleChecked] = useState<Record<number, boolean>>({});
    const [initialRoleChecked, setInitialRoleChecked] = useState<Record<number, boolean>>({});

    const [roles, setRoles] = useState<RoleBasedFilterRole[]>([]);
    const [financialCycles, setFinancialCycles] = useState<Option[]>([]);

    const [geoLoading, setGeoLoading] = useState(false);
    const [productLoading, setProductLoading] = useState(false);
    const [customerLoading, setCustomerLoading] = useState(false);

    const dispatch = useDispatch<AppDispatch>();
    const filterGroupDetailsData = useSelector((state: RootState) => state.filterGroupDetails.data);

    const userPrimaryRole = useSelector((state: RootState) => state.primaryRole.data);
    const isFilterGroupDisabled =
        userPrimaryRole?.roleType === 'Guest' ||
        !userPrimaryRole ||
        Object.keys(userPrimaryRole).length === 0;

    const hierarchies = useSelector(
        (state: RootState) => state.filterGroupDetails.hierarchies ?? [],
    );

    const [dropdowns, setDropdowns] = useState({
        region: [] as Option[],
        cluster: [] as Option[],
        market: [] as Option[],
        siteType: [
            { label: 'Manufacturing Site', value: 'Manufacturing Site' },
            { label: 'Non Manufacturing Site', value: 'Non Manufacturing Site' },
        ],
        site: [] as Option[],
        siteCode: [] as Option[],
        organization: [] as Option[],
        segment: [] as Option[],
        category: [] as Option[],
        brand: [] as Option[],
        subBrand: [] as Option[],
        sku: [] as Option[],
        subSegment: [] as Option[],
        state: [] as Option[],
        subCategoryId: [] as Option[],
        masterCodeId: [] as Option[],
        rootCodeId: [] as Option[],
        variantId: [] as Option[],
        channel: [] as Option[],
        customer: [] as Option[],
        shipCustomer: [] as Option[],
        soldCustomer: [] as Option[],
        mrpController: [] as Option[],
        subCategory: [] as Option[],
        masterCode: [] as Option[],
        rootCode: [] as Option[],
        variant: [] as Option[],
        skUs: [] as Option[],
        financialCycle: financialCycles,
    });
    const [initialCheckedFilters, setInitialCheckedFilters] = useState<Record<number, boolean>>({});
    const [selected, setSelected] = useState({
        region: [] as Option[],
        cluster: [] as Option[],
        market: [] as Option[],
        siteType: [] as Option[],
        site: [] as Option[],
        siteCode: [] as Option[],
        organization: [] as Option[],
        segment: [] as Option[],
        category: [] as Option[],
        brand: [] as Option[],
        subBrand: [] as Option[],
        sku: [] as Option[],
        subSegmentId: [] as Option[],
        stateId: [] as Option[],
        subCategoryId: [] as Option[],
        masterCodeId: [] as Option[],
        rootCodeId: [] as Option[],
        variantId: [] as Option[],
        channel: [] as Option[],
        customer: [] as Option[],
        shipCustomer: [] as Option[],
        soldCustomer: [] as Option[],
        mrpController: [] as Option[],
        financialCycle: [] as Option[],
        subCategory: [] as Option[],
        masterCode: [] as Option[],
        rootCode: [] as Option[],
        variant: [] as Option[],
        skUs: [] as Option[],
    });

    const [filterGroupName, setFilterGroupName] = useState<string>('');
    const [hoveredFilterId, setHoveredFilterId] = useState<number | null>(null);
    const [isAddingFilterGroup, setIsAddingFilterGroup] = useState(false);
    const [isEditFilterGroup, setIsEditFilterGroup] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [toastConfig, setToastConfig] = useState({
        visible: false,
        message: '',
        type: 'Error' as 'Error' | 'Success' | 'Delete',
    });
    const [selectedFilterId, setSelectedFilterId] = useState<number | null>(null);
    const [toBeDeletedFilterName, setToBeDeletedFilterName] = useState<string>('');
    const [selectedHierarchies, setSelectedHierarchies] = useState<string>('');
    const [isFilterContainerVisible, setIsFilterContainerVisible] = useState(false);
    const [openFilterSections, setOpenFilterSections] = useState({
        geography: true,
        product: false,
        customer: false,
    });
    const [openSections, setOpenSections] = useState<Record<number, boolean>>({});
    const [checkedFilters, setCheckedFilters] = useState<Record<number, boolean>>({});
    const [selectedFinancialCycle, setSelectedFinancialCycle] = useState<Option[]>([]);
    const [latestAddedFilterName, setLatestAddedFilterName] = useState<string | null>(null);
    const [nameError, setNameError] = useState('');
    const [filterError, setFilterError] = useState('');
    const [loading, setLoading] = useState(false);

    const haveRoleChanges = useMemo(() => {
        return roles
            .filter(r => r.roleType !== 'Primary')
            .some(
                r => (roleChecked[r.roleId] ?? false) !== (initialRoleChecked[r.roleId] ?? false),
            );
    }, [roles, roleChecked, initialRoleChecked]);

    const haveFilterGroupChanges = useMemo(() => {
        return JSON.stringify(checkedFilters) !== JSON.stringify(initialCheckedFilters);
    }, [checkedFilters, initialCheckedFilters]);

    const [isDirty, setIsDirty] = useState(false);
    const isApplyEnabled = isDirty || haveRoleChanges || haveFilterGroupChanges;

    const [custPageNumber, setCustPageNumber] = useState(1);
    const [, setCustHasMore] = useState(true);
    const custLoading = useRef(false);
    const productRequestSeq = useRef(0);

    const customerPageSize = 20;

    const [custPageByField, setCustPageByField] = useState<Record<CustomerField, number>>({
        channel: 1,
        customer: 1,
        shipCustomer: 1,
        soldCustomer: 1,
    });

    const [custHasMoreByField, setCustHasMoreByField] = useState<Record<CustomerField, boolean>>({
        channel: true,
        customer: true,
        shipCustomer: true,
        soldCustomer: true,
    });

    const [productPageByField, setProductPageByField] = useState<Record<ProductField, number>>({
        segment: 1,
        subSegment: 1,
        state: 1,
        category: 1,
        subCategory: 1,
        brand: 1,
        subBrand: 1,
        rootCode: 1,
        variant: 1,
        masterCode: 1,
        sku: 1,
    });

    const [productHasMoreByField, setProductHasMoreByField] = useState<
        Record<ProductField, boolean>
    >({
        segment: true,
        subSegment: true,
        state: true,
        category: true,
        subCategory: true,
        brand: true,
        subBrand: true,
        rootCode: true,
        variant: true,
        masterCode: true,
        sku: true,
    });

    const [activeCustField, setActiveCustField] = useState<CustomerField | null>(null);
    const [custSearchKeyword, setCustSearchKeyword] = useState('');

    const CUSTOMER_SEARCH_COLUMN: Record<CustomerField, string> = {
        channel: 'Channel',
        customer: 'Customer',
        shipCustomer: 'ShipToCustName',
        soldCustomer: 'soldToCustName',
    };
    const [, setProductPageNumber] = useState(1);
    const [, setProductHasMore] = useState(true);
    const ProductLoading = useRef(false);
    const ProductPageSize = 20;

    const [activeProductField, setActiveProductField] = useState<ProductField | null>(null);
    const [ProductSearchKeyword, setProductSearchKeyword] = useState('');

    const PRODUCT_FIELD_MAP: Record<
        ProductField,
        { arrayKey: keyof any; idKey: string; labelKey: string; searchColumn: string }
    > = {
        segment: {
            arrayKey: 'segments',
            idKey: 'segmentId',
            labelKey: 'segment',
            searchColumn: 'segment',
        },
        subSegment: {
            arrayKey: 'subSegements',
            idKey: 'subSegmentId',
            labelKey: 'subSegment',
            searchColumn: 'subSegment',
        },
        state: {
            arrayKey: 'needStates',
            idKey: 'needStateId',
            labelKey: 'state',
            searchColumn: 'State',
        },
        category: {
            arrayKey: 'categories',
            idKey: 'categoryId',
            labelKey: 'category',
            searchColumn: 'category',
        },
        subCategory: {
            arrayKey: 'subCategorys',
            idKey: 'subCategoryId',
            labelKey: 'subCategory',
            searchColumn: 'subCategory',
        },
        brand: { arrayKey: 'brands', idKey: 'brandId', labelKey: 'brand', searchColumn: 'brand' },
        subBrand: {
            arrayKey: 'subBrands',
            idKey: 'subBrandId',
            labelKey: 'subBrand',
            searchColumn: 'subBrand',
        },
        rootCode: {
            arrayKey: 'rootCodes',
            idKey: 'rootCodeId',
            labelKey: 'rootCode',
            searchColumn: 'rootCode',
        },
        variant: {
            arrayKey: 'variants',
            idKey: 'variantId',
            labelKey: 'variant',
            searchColumn: 'variant',
        },
        masterCode: {
            arrayKey: 'masterCodes',
            idKey: 'masterCodeId',
            labelKey: 'masterCode',
            searchColumn: 'masterCode',
        },
        sku: { arrayKey: 'skUs', idKey: 'skuId', labelKey: 'sku', searchColumn: 'SKU' },
    };

    const fetchCustomerOptions = async (field: CustomerField, page: number, keyword = '') => {
        const isTyping = (keyword ?? '').trim().length > 0;

        const manageLoading = !isTyping;
        if (manageLoading) custLoading.current = true;

        const seqAtCall = custRequestSeq.current;

        const ctx = {
            channelId: fetchIds(selected.channel),
            customerId: field === 'customer' ? null : fetchIds(selected.customer),
            shippedToId: field === 'shipCustomer' ? null : fetchIds(selected.shipCustomer),
            soldToId: field === 'soldCustomer' ? null : fetchIds(selected.soldCustomer),
        };

        const payload = isTyping
            ? {
                  ...ctx,
                  pageSize: customerPageSize,
                  pageNumber: page,
                  searchKeyword: keyword,
                  searchColumn: CUSTOMER_SEARCH_COLUMN[field],
              }
            : {
                  channelId: fetchIds(selected.channel),
                  customerId: fetchIds(selected.customer),
                  shippedToId: fetchIds(selected.shipCustomer),
                  soldToId: fetchIds(selected.soldCustomer),
                  pageSize: customerPageSize,
                  pageNumber: page,
                  searchKeyword: undefined,
                  searchColumn: null,
              };

        try {
            const res = await getChannelHeirarchy(payload);
            if (seqAtCall !== custRequestSeq.current) return;

            const data = res?.[0] ?? {};
            let items: any[] = [];
            if (field === 'channel') items = data.channels || [];
            if (field === 'customer') items = data.customers || [];
            if (field === 'shipCustomer') items = data.shipCustomers || data.shipCustomer || [];
            if (field === 'soldCustomer') items = data.soldCustomers || data.soldcustomers || [];

            const incoming =
                field === 'channel'
                    ? items
                          .filter((o: any) => o?.channelId != null)
                          .map((o: any) => ({
                              label: String(o.channelId),
                              value: String(o.channelId),
                              desc: String(o.channel ?? ''),
                          }))
                    : field === 'customer'
                      ? items
                            .filter((o: any) => o?.customerId != null)
                            .map((o: any) => ({
                                label: String(o.customerId),
                                value: String(o.customerId),
                                desc: String(o.customer ?? ''),
                            }))
                      : field === 'shipCustomer'
                        ? items
                              .filter((o: any) => o?.shippedToId != null)
                              .map((o: any) => ({
                                  label: String(o.shippedToId),
                                  value: String(o.shippedToId),
                                  desc: String(o.shipToCustName ?? ''),
                              }))
                        : items
                              .filter((o: any) => (o?.soldToId ?? o?.soldToID) != null)
                              .map((o: any) => ({
                                  label: String(o.soldToId ?? o.soldToID),
                                  value: String(o.soldToId ?? o.soldToID),
                                  desc: String(o.soldToCustName ?? ''),
                              }));

            setDropdowns(prev => {
                if (seqAtCall !== custRequestSeq.current) return prev;
                const selectedForField = (selected as any)[field] ?? [];

                const baseline =
                    isTyping && page === 1 ? [...selectedForField] : (prev[field] ?? []);

                const seen = new Set(baseline.map(p => p.value));
                const merged = [...baseline, ...incoming.filter(n => !seen.has(n.value))];
                return { ...prev, [field]: merged };
            });

            setCustHasMoreByField(prev => ({
                ...prev,
                [field]: incoming.length === customerPageSize,
            }));
            setCustHasMore(incoming.length === customerPageSize);
        } catch (e) {
            logError('Error fetching customer options:', e);
        } finally {
            if (manageLoading) custLoading.current = false;
        }
    };

    const safeFinancialCycleId = () => {
        const v = selectedFinancialCycle?.[0]?.value;
        return v && v !== 'undefined' && v !== 'null' && v !== '' ? String(v) : null;
    };

    const keepIfPresent = (cur: Option[], next: Option[]) => {
        if (!cur || cur.length === 0) return [];
        const hasAll = cur.some(o => o.value === 'ALL' || o.value === 'all');
        if (hasAll) {
            return cur;
        }
        return (cur || []).filter(o => (next || []).some(n => String(n.value) === String(o.value)));
    };

    useEffect(() => {
        if (variant !== 'flyout') return;

        onDirtyChange?.(isApplyEnabled);
        const filterGroupJson = Object.keys(checkedFilters).map(fid => ({
            filterId: Number(fid),
            isFilterApplied: !!checkedFilters[Number(fid)],
        }));

        const roleBasedJSON = roles.map(r => ({
            roleId: r.roleId,
            isFilterApplied: r.roleType === ROLE_TYPE.PRIMARY ? true : !!roleChecked[r.roleId],
        }));

        onFiltersSelected?.({ filterGroupJson, roleBasedJSON });
    }, [
        variant,
        isApplyEnabled,
        checkedFilters,
        roles,
        roleChecked,
        onDirtyChange,
        onFiltersSelected,
    ]);

    const MAX_LENGTH = 200;

    const handleFilterGroupNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (value.length <= MAX_LENGTH && validateForumName(value)) {
            setFilterGroupName(value);
        }
    };

    const handleDetailsViewClicked = (roleId: number) => {
        setRoles(prevList =>
            prevList.map(item =>
                item.roleId === roleId ? { ...item, isOpen: !item.isOpen } : { ...item },
            ),
        );
    };
    const fetchRoleBasedFilter = async () => {
        setLoading(true);
        try {
            const response = await getRoleBasedFilter('Standard', 'Role Based');
            if (response && Array.isArray(response)) {
                const newResponse = response.map(obj => ({
                    ...obj,
                    isOpen: false,
                }));
                newResponse.sort((role, nextRole) =>
                    role.roleType.localeCompare(nextRole.roleType),
                );
                setRoles(newResponse);
                const checkedById = newResponse.reduce((acc: Record<number, boolean>, r) => {
                    acc[r.roleId] = r.roleType === 'Primary' ? true : !!r.isFilterApplied;
                    return acc;
                }, {});

                setRoleChecked(checkedById);
                setInitialRoleChecked(checkedById);
            }
        } catch (error) {
            logError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoleBasedFilter();
    }, []);

    useEffect(() => {
        const fetchFinancialCycles = async () => {
            const response = await dispatch(fetchFilterFinancialCycle()).unwrap();
            const cycles = response.map(
                (cycle: { financialCycleId: number; financialTypeName: string | null }) => ({
                    label: cycle.financialTypeName || '',
                    value: cycle.financialCycleId.toString(),
                }),
            );
            setFinancialCycles(cycles);
        };

        fetchFinancialCycles();
    }, [dispatch]);

    useEffect(() => {
        if (filterGroupDetailsData.length) {
            const initialFilters = filterGroupDetailsData.reduce(
                (acc, filterGroup) => {
                    acc[filterGroup.filterId] =
                        typeof filterGroup.isFilterApplied === 'boolean'
                            ? filterGroup.isFilterApplied
                            : filterGroup.isFilterApplied === 'true';
                    return acc;
                },
                {} as Record<number, boolean>,
            );
            setInitialCheckedFilters(initialFilters);
            setCheckedFilters(initialFilters);
        }
    }, [filterGroupDetailsData]);

    const handleCancelFilters = () => {
        setCheckedFilters(initialCheckedFilters);
        setRoleChecked(initialRoleChecked);
        setRoles(prev =>
            prev.map(r => ({
                ...r,
                isFilterApplied:
                    r.roleType === ROLE_TYPE.PRIMARY ? true : !!initialRoleChecked[r.roleId],
            })),
        );

        setIsFilterContainerVisible(false);
        setIsDirty(false);
    };

    useEffect(() => {
        if (latestAddedFilterName && filterGroupDetailsData?.length) {
            const newlyAdded = filterGroupDetailsData.find(
                fg => fg.filterName === latestAddedFilterName,
            );

            if (newlyAdded) {
                const { filterId } = newlyAdded;

                setCheckedFilters(prev => ({
                    ...prev,
                    [filterId]: true,
                }));

                setIsFilterContainerVisible(true);
                setLatestAddedFilterName(null);

                const filterGroupItem = {
                    filterId,
                    isFilterApplied: true,
                };
                handleFilterGroupCheckboxChange?.(true, filterGroupItem);
            }
        }
    }, [filterGroupDetailsData, latestAddedFilterName]);

    useEffect(() => {
        if (filterGroupDetailsData.length === 0) {
            setIsFilterContainerVisible(false);
        }
    }, [filterGroupDetailsData]);

    useEffect(() => {
        setDropdowns(prev => ({
            ...prev,
            financialCycle: financialCycles,
        }));
    }, [financialCycles]);

    // ----- dropdown helpers (unchanged) -----

    const fetchProductHierarchyDropdowns = (
        productHeirarchy: any,
        opts: { preserveKeys?: DropdownKey[] } = {},
    ) => {
        const allSegments: Option[] = (productHeirarchy.segments || []).map(
            (obj: { segment: string; segmentId: number }) => ({
                label: `${obj.segment ?? ''}`,
                value: String(obj.segmentId),
                id: obj.segmentId,
                desc: `${obj.segment ?? ''}`,
            }),
        );

        const allCategory: Option[] = (productHeirarchy.categories || []).map(
            (obj: { category: string; categoryId: number }) => ({
                label: `${obj.category ?? ''}`,
                value: String(obj.categoryId),
                desc: `${obj.category ?? ''}`,
            }),
        );

        const allbrands: Option[] = (productHeirarchy.brands || []).map(
            (obj: { brand: string; brandId: number }) => ({
                label: `${obj.brand ?? ''}`,
                value: String(obj.brandId),
                desc: `${obj.brand ?? ''}`,
            }),
        );

        const allskUs: Option[] = (productHeirarchy.skUs || [])
            .filter((obj: { sku?: string; skuId?: string }) => obj.sku && obj.skuId !== undefined)
            .map((obj: { sku: string; skuId: string }) => ({
                label: `${obj.sku ?? ''}`,
                value: String(obj.skuId),
                desc: `${obj.sku ?? ''}`,
            }));

        const allsubBrands: Option[] = (productHeirarchy.subBrands || []).map(
            (obj: { subBrand: string; subBrandId: number }) => ({
                label: `${obj.subBrand ?? ''}`,
                value: String(obj.subBrandId),
                desc: `${obj.subBrand ?? ''}`,
            }),
        );

        const allsubSegements: Option[] = (productHeirarchy.subSegements || []).map(
            (obj: { subSegment: string; subSegmentId: number }) => ({
                label: `${obj.subSegment ?? ''}`,
                value: String(obj.subSegmentId),
                desc: `${obj.subSegment ?? ''}`,
            }),
        );

        const allneedStates: Option[] = (productHeirarchy.needStates || []).map(
            (obj: { state: string; needStateId: number }) => ({
                label: `${obj.state ?? ''}`,
                value: String(obj.needStateId),
                desc: `${obj.state ?? ''}`,
            }),
        );

        const allsubCategorys: Option[] = (productHeirarchy.subCategorys || []).map(
            (obj: { subCategory: string; subCategoryId: number }) => ({
                label: `${obj.subCategory ?? ''}`,
                value: String(obj.subCategoryId),
                desc: `${obj.subCategory ?? ''}`,
            }),
        );

        const allmasterCodes: Option[] = (productHeirarchy.masterCodes || []).map(
            (obj: { masterCode: string; masterCodeId: number }) => ({
                label: `${obj.masterCode ?? ''}`,
                value: String(obj.masterCodeId),
                desc: `${obj.masterCode ?? ''}`,
            }),
        );

        const allrootCodes: Option[] = (productHeirarchy.rootCodes || []).map(
            (obj: { rootCode: string; rootCodeId: number }) => ({
                label: `${obj.rootCode ?? ''}`,
                value: String(obj.rootCodeId),
                desc: `${obj.rootCode ?? ''}`,
            }),
        );

        const allvariants: Option[] = (productHeirarchy.variants || []).map(
            (obj: { variant: string; variantId: number }) => ({
                label: `${obj.variant ?? ''}`,
                value: String(obj.variantId),
                desc: `${obj.variant ?? ''}`,
            }),
        );

        updateDropdownState(
            {
                segment: allSegments,
                category: allCategory,
                brand: allbrands,
                subBrand: allsubBrands,
                sku: allskUs,
                subSegment: allsubSegements,
                state: allneedStates,
                subCategoryId: allsubCategorys,
                masterCodeId: allmasterCodes,
                rootCodeId: allrootCodes,
                variantId: allvariants,
            },
            opts.preserveKeys, // e.g. ['brand'] if Brand triggered the fetch
        );
        const preserved = new Set(opts.preserveKeys ?? []);
        setSelected(prev => {
            const next = { ...prev };

            if (!preserved.has('segment')) next.segment = keepIfPresent(prev.segment, allSegments);
            if (!preserved.has('category'))
                next.category = keepIfPresent(prev.category, allCategory);
            if (!preserved.has('brand')) next.brand = keepIfPresent(prev.brand, allbrands);
            if (!preserved.has('subBrand'))
                next.subBrand = keepIfPresent(prev.subBrand, allsubBrands);
            if (!preserved.has('sku')) next.sku = keepIfPresent(prev.sku, allskUs);
            if (!preserved.has('subSegment'))
                next.subSegmentId = keepIfPresent(prev.subSegmentId, allsubSegements);
            if (!preserved.has('state')) next.stateId = keepIfPresent(prev.stateId, allneedStates);
            if (!preserved.has('subCategoryId'))
                next.subCategoryId = keepIfPresent(prev.subCategoryId, allsubCategorys);
            if (!preserved.has('masterCodeId'))
                next.masterCodeId = keepIfPresent(prev.masterCodeId, allmasterCodes);
            if (!preserved.has('rootCodeId'))
                next.rootCodeId = keepIfPresent(prev.rootCodeId, allrootCodes);
            if (!preserved.has('variantId'))
                next.variantId = keepIfPresent(prev.variantId, allvariants);

            return next;
        });
    };

    const fetchProductHeirarchy = async (
        payload: any,
        opts: { preserveKeys?: DropdownKey[] } = {},
        pageSize: number = 20,
        pageNumber: number = 1,
    ) => {
        try {
            setProductLoading(true);
            const res = await getProductHeirarchy({ ...payload, pageSize, pageNumber });

            const data = Array.isArray(res) ? (res[0] ?? {}) : (res ?? {});
            fetchProductHierarchyDropdowns(data, opts);
        } catch (error) {
            logError('Error fetching product hierarchy:', error);
        } finally {
            setProductLoading(false);
        }
    };

    const fetchCustomerHierarchyDropdowns = (
        customerHeirarchy: any,
        opts: { preserveKeys?: DropdownKey[] } = {},
    ) => {
        const allCustomer: Option[] = (customerHeirarchy.customers || []).map(
            (obj: { customer?: string; customerId: number }) => ({
                label: `${obj.customerId ?? ''}`,
                value: String(obj.customerId),
                id: obj.customerId,
                desc: `${obj.customer ?? ''}`,
            }),
        );

        const allChannels: Option[] = (customerHeirarchy.channels || []).map(
            (obj: { channel?: string; channelId: number }) => ({
                label: `${obj.channelId ?? ''}`,
                value: String(obj.channelId),
                id: obj.channelId,
                desc: `${obj.channel ?? ''}`,
            }),
        );
        const shipArr = customerHeirarchy.shipCustomers || customerHeirarchy.shipCustomer || [];
        const soldArr = customerHeirarchy.soldCustomers || customerHeirarchy.soldcustomers || [];

        const allShip: Option[] = (shipArr as any[]).map((o: any) => ({
            label: `${o.shippedToId ?? o.shippedToId}`,
            value: String(o.shippedToId ?? o.shippedToId ?? ''),
            desc: `${o.shipToCustName ?? ''}`,
        }));

        const allSold: Option[] = (soldArr as any[]).map((o: any) => ({
            label: `${o.soldToId ?? o.soldToID}`,
            value: String(o.soldToId ?? o.soldToID ?? ''),
            desc: `${o.soldToCustName ?? ''}`,
        }));

        updateDropdownState(
            {
                customer: allCustomer,
                channel: allChannels,
                shipCustomer: allShip,
                soldCustomer: allSold,
            },
            opts.preserveKeys, // e.g. ['channel'] or ['customer']
        );

        const preserved = new Set(opts.preserveKeys ?? []);
        setSelected(prev => {
            const next = { ...prev };
            if (!preserved.has('channel')) next.channel = keepIfPresent(prev.channel, allChannels);
            if (!preserved.has('customer'))
                next.customer = keepIfPresent(prev.customer, allCustomer);
            if (!preserved.has('shipCustomer'))
                next.shipCustomer = keepIfPresent(prev.shipCustomer, allShip);
            if (!preserved.has('soldCustomer'))
                next.soldCustomer = keepIfPresent(prev.soldCustomer, allSold);
            return next;
        });

        const pageFull = allShip.length === customerPageSize || allSold.length === customerPageSize;
        setCustHasMore(pageFull);
    };

    const custHierarchyLoading = useRef(false);

    const fetchCustomerHeirarchy = async (
        payload: any,
        opts: { preserveKeys?: DropdownKey[] } = {},
        pageSize: number = customerPageSize,
        pageNumber: number = custPageNumber,
    ) => {
        if (custHierarchyLoading.current) return;
        custHierarchyLoading.current = true;
        try {
            setCustomerLoading(true);
            const res = await getChannelHeirarchy({ ...payload, pageSize, pageNumber });
            const data = res?.[0] ?? {};
            fetchCustomerHierarchyDropdowns(data, opts);
        } finally {
            custHierarchyLoading.current = false;
            setCustomerLoading(false);
        }
    };

    // const normalizeOptions = (opts: Option[] = []): Option[] =>
    //     (opts || []).map(o => ({ label: o.label ?? '', value: String(o.value), desc: o.desc }));
    const normalizeOptions = (opts: Option[] = []): Option[] =>
        (opts || []).map((o: Option) => ({
            ...o, // keep siteType and desc
            label: o.label ?? '',
            value: String(o.value),
        }));

    const mergeUnique = (prev: Option[], next: Option[]): Option[] => {
        const map = new Map<string, Option>();
        normalizeOptions(prev).forEach(o => map.set(String(o.value), o));
        normalizeOptions(next).forEach(o => map.set(String(o.value), o));
        return Array.from(map.values());
    };

    type DropdownKey = keyof typeof dropdowns;
    const updateDropdownState = (
        updates: Partial<typeof dropdowns>,
        preserveKeys: DropdownKey[] = [],
    ) => {
        setDropdowns(prev => {
            const next = { ...prev };

            (Object.keys(updates) as DropdownKey[]).forEach(k => {
                const incoming = normalizeOptions((updates as any)[k]);
                const selectedForKey = (selected as any)[k] ?? [];

                const isInitialFill = (prev[k]?.length ?? 0) === 0 && !preserveKeys.includes(k);
                if (isInitialFill && incoming.length && !initialOptionsRef.current[k]?.length) {
                    initialOptionsRef.current[k] = incoming;
                }

                const mergedWithSelected = mergeUnique(incoming, selectedForKey);

                next[k] = preserveKeys.includes(k)
                    ? mergeUnique(prev[k], mergedWithSelected)
                    : mergedWithSelected;
            });

            return next;
        });
    };

    const fetchGeographyHierarchyDropdowns = (
        geographyHeirarchy: any,
        opts: { preserveKeys?: DropdownKey[] } = {},
    ) => {
        const allRegions: Option[] = (geographyHeirarchy.regions || []).map(
            (obj: { region?: string; regionId: number }) => ({
                label: `${obj.region ?? ''}`,
                value: String(obj.regionId),
                id: obj.regionId,
            }),
        );

        const allClusters: Option[] = (geographyHeirarchy.clusters || []).map(
            (obj: { cluster?: string; clusterId: number }) => ({
                label: `${obj.cluster ?? ''}`,
                value: String(obj.clusterId),
                id: obj.clusterId,
            }),
        );

        const allMarkets: Option[] = (geographyHeirarchy.markets || []).map(
            (obj: { market?: string; marketId: number }) => ({
                label: `${obj.market ?? ''}`,
                value: String(obj.marketId),
                id: obj.marketId,
            }),
        );

        // ---------- SITES (carry siteType) ----------
        type RawSite = {
            siteId: number;
            manufacturingSite?: string;
            siteCode?: string;
            siteType?: string;
        };

        const rawSites: RawSite[] = (geographyHeirarchy.sites || []) as RawSite[];

        const allSites: Option[] = rawSites.map(s => ({
            label: s.manufacturingSite ?? '',
            value: String(s.siteId),
            siteType: s.siteType ?? '',
        }));

        const allSiteCodes: Option[] = rawSites.map(s => ({
            label: s.siteCode ?? '',
            value: String(s.siteId),
            siteType: s.siteType ?? '',
        }));

        // ---------- SITE TYPES (derived from sites in response) ----------
        const uniqueSiteTypes: string[] = Array.from(
            new Set(rawSites.map(s => s.siteType).filter((x): x is string => Boolean(x))),
        );

        const allSiteTypes: Option[] = uniqueSiteTypes.map(
            (st: string): Option => ({
                label: st,
                value: st,
            }),
        );

        // ---------- UPDATE DROPDOWNS ----------
        updateDropdownState(
            {
                region: allRegions,
                cluster: allClusters,
                market: allMarkets,
                site: allSites,
                siteCode: allSiteCodes,
                siteType: allSiteTypes,
            },
            opts.preserveKeys ?? [],
        );

        // ---------- UPDATE SELECTED VALUES ----------
        setSelected(prev => {
            const next = { ...prev };
            const preserved = new Set(opts.preserveKeys ?? []);

            if (!preserved.has('region')) next.region = keepIfPresent(prev.region, allRegions);
            if (!preserved.has('cluster')) next.cluster = keepIfPresent(prev.cluster, allClusters);
            if (!preserved.has('market')) next.market = keepIfPresent(prev.market, allMarkets);
            if (!preserved.has('site')) next.site = keepIfPresent(prev.site, allSites);
            if (!preserved.has('siteCode'))
                next.siteCode = keepIfPresent(prev.siteCode, allSiteCodes);

            // clean + auto-set siteType based on what backend returned
            const cleanedSiteType: Option[] = (prev.siteType || []).filter(st =>
                allSiteTypes.some(t => t.value === st.value),
            );

            if (!cleanedSiteType.length && allSiteTypes.length === 1) {
                const only = allSiteTypes[0];
                if (only) {
                    next.siteType = [only];
                }
            } else {
                next.siteType = cleanedSiteType;
            }

            return next;
        });
    };

    const fetchGeographyHeirarchy = async (
        payload: any,
        opts: { preserveKeys?: DropdownKey[] } = {},
    ) => {
        setGeoLoading(true);
        const geographyHeirarchyResponse = await getGeographyHeirarchy(payload);
        fetchGeographyHierarchyDropdowns(geographyHeirarchyResponse[0], opts);
        setGeoLoading(false);
    };

    const fetchDefaultDropDownOptions = () => {
        fetchProductHeirarchy({
            segmentId: null,
            categoryId: null,
            brandId: null,
            subBrandId: null,
            skuId: null,
            pageSize: null,
            pageNumber: null,
            stateId: null,
            subCategoryId: null,
            subSegmentId: null,
            variantId: null,
            rootCodeId: null,
            masterCodeId: null,
            searchColumn: null,
        });
        fetchCustomerHeirarchy({
            channelId: null,
            customerId: null,
            shippedToId: null,
            soldToId: null,
        });
        fetchGeographyHeirarchy(
            {
                regionId: null,
                clusterId: null,
                marketId: null,
                siteId: null,
            },
            { preserveKeys: [] },
        );
    };

    useEffect(() => {
        if (!activeCustField) return;

        if (customerDebounceTimer.current) clearTimeout(customerDebounceTimer.current);

        customerDebounceTimer.current = setTimeout(() => {
            custRequestSeq.current += 1;
            const seq = custRequestSeq.current;

            if (!custSearchKeyword) {
                setSearching(s =>
                    s.label === CUSTOMER_LABEL[activeCustField]
                        ? { label: null, term: '', loading: false }
                        : s,
                );
                return;
            }

            fetchCustomerOptions(activeCustField, 1, custSearchKeyword).finally(() => {
                if (seq === custRequestSeq.current) {
                    setSearching(s =>
                        s.label === CUSTOMER_LABEL[activeCustField]
                            ? { label: null, term: '', loading: false }
                            : s,
                    );
                }
            });
        }, 400);

        return () => {
            if (customerDebounceTimer.current) clearTimeout(customerDebounceTimer.current);
        };
    }, [activeCustField, custSearchKeyword]);

    useEffect(() => {
        if (!activeProductField) return;

        if (productDebounceTimer.current) clearTimeout(productDebounceTimer.current);

        productDebounceTimer.current = setTimeout(() => {
            const field = activeProductField;
            const term = (ProductSearchKeyword ?? '').trim();
            productRequestSeq.current += 1;
            const seq = productRequestSeq.current;
            if (!term) {
                setSearching(s =>
                    s.label === PRODUCT_LABEL[field]
                        ? { label: null, term: '', loading: false }
                        : s,
                );
                return;
            }
            // showing loader for this field, irrespective of any in-flight calls
            setSearching({ label: PRODUCT_LABEL[field], term, loading: true });
            // force = true lets us fire even if another product call is in flight
            fetchProductOptions(field, 1, term, { seq, force: true }).finally(() => {
                // only the latest request may turn off the loader
                if (seq === productRequestSeq.current) {
                    setSearching(s =>
                        s.label === PRODUCT_LABEL[field]
                            ? { label: null, term, loading: false }
                            : s,
                    );
                }
            });
        }, 400);

        return () => {
            if (productDebounceTimer.current) clearTimeout(productDebounceTimer.current);
        };
    }, [activeProductField, ProductSearchKeyword]);

    useEffect(() => {
        fetchDefaultDropDownOptions();
    }, []);

    useEffect(() => {
        dispatch(fetchFilterGroupDetails());
        dispatch(fetchPrimaryRole());
        dispatch(fetchFilterHierarchies());
        dispatch(fetchAfUserRoleFilterDetails());
    }, [dispatch]);

    useEffect(() => {
        if (hierarchies.length > 0) {
            const defaultHierarchy = hierarchies.find(h => h.hierarchy === 'Standard');
            if (defaultHierarchy) {
                setSelectedHierarchies(defaultHierarchy.hierarchyId.toString());
            }
        }
    }, [hierarchies]);

    useEffect(() => {
        resetFilterGroup();
    }, [isAddingFilterGroup]);

    const handleApplyFilters = useCallback(async () => {
        const filterGroupJson = Object.keys(checkedFilters).map(filterId => ({
            filterId: Number(filterId),
            isFilterApplied: !!checkedFilters[Number(filterId)],
        }));

        const roleBasedJSON = roles.map(r => ({
            roleId: r.roleId,
            isFilterApplied: r.roleType === ROLE_TYPE.PRIMARY ? true : !!roleChecked[r.roleId],
        }));

        const payload = { filterGroupJson, roleBasedJSON };

        try {
            await applySelectedFilterGroup(payload);

            setInitialCheckedFilters(checkedFilters);
            setInitialRoleChecked(roleChecked);

            setRoles(prev =>
                prev.map(r => ({
                    ...r,
                    isFilterApplied:
                        r.roleType === ROLE_TYPE.PRIMARY ? true : !!roleChecked[r.roleId],
                })),
            );

            await dispatch(fetchFilterGroupDetails());
            await dispatch(fetchAfUserRoleFilterDetails());
            await fetchRoleBasedFilter();

            setToastConfig({
                visible: true,
                message: `Global Filters Applied.`,
                type: 'Success',
            });

            setIsDirty(false);
            setIsFilterContainerVisible(false);
            setSelected(prev => ({ ...prev }));
        } catch {
            setToastConfig({
                visible: true,
                message: `Failed to add Applied Selected Group`,
                type: 'Error',
            });
        }
    }, [checkedFilters, roles, roleChecked]);

    const resetFilterGroup = () => {
        setSelectedFinancialCycle([]);
        setFilterGroupName('');
        setSelected({
            region: [],
            cluster: [],
            market: [],
            siteType: [],
            site: [],
            siteCode: [],
            organization: [],
            segment: [],
            category: [],
            brand: [],
            subBrand: [],
            sku: [],
            subSegmentId: [],
            stateId: [],
            subCategoryId: [],
            masterCodeId: [],
            rootCodeId: [],
            variantId: [],
            channel: [],
            customer: [],
            shipCustomer: [],
            soldCustomer: [],
            mrpController: [],
            financialCycle: [],
            subCategory: [],
            masterCode: [],
            rootCode: [],
            variant: [],
            skUs: [],
        });
        resetAllCustomerPaging();
        resetAllProductPaging();
    };

    const buildGeographies = () => {
        const regions =
            selected.region.length > 0
                ? selected.region.map(region => {
                      return {
                          regionId: region.value,
                          region: region.label,
                      };
                  })
                : [];
        const clusters =
            selected.cluster.length > 0
                ? selected.cluster.map(cluster => {
                      return {
                          clusterId: cluster.value,
                          cluster: cluster.label,
                      };
                  })
                : [];
        const markets =
            selected.market.length > 0
                ? selected.market.map(market => {
                      return {
                          marketId: market.value,
                          market: market.label,
                      };
                  })
                : [];
        const siteType =
            selected.siteType.length > 0
                ? selected.siteType.map(type => ({
                      siteType: type.value,
                  }))
                : [];
        const sites =
            selected.site.length > 0
                ? selected.site.map(site => {
                      return {
                          siteId: site.value,
                          site: site.label,
                          manufacturingSite: site.label,
                      };
                  })
                : [];
        const siteCodes =
            selected.siteCode.length > 0
                ? selected.siteCode.map(siteCode => {
                      return {
                          siteId: siteCode.value,
                          siteCodes: siteCode.label,
                      };
                  })
                : [];
        return {
            regions: regions,
            clusters: clusters,
            markets: markets,
            sites: sites,
            siteCode: siteCodes,
            siteType: siteType,
        };
    };

    const buildProducts = () => {
        const segments =
            selected.segment.length > 0
                ? selected.segment.map(segment => {
                      return {
                          segmentId: segment.value,
                          segment: segment.desc,
                      };
                  })
                : [];

        const categories =
            selected.category.length > 0
                ? selected.category.map(category => {
                      return {
                          categoryId: category.value,
                          category: category.desc,
                      };
                  })
                : [];

        const brands =
            selected.brand.length > 0
                ? selected.brand.map(brand => {
                      return {
                          brandId: brand.value,
                          brand: brand.desc,
                      };
                  })
                : [];

        const subBrands =
            selected.subBrand.length > 0
                ? selected.subBrand.map(subBrand => {
                      return {
                          subBrandId: subBrand.value,
                          subBrand: subBrand.desc,
                      };
                  })
                : [];

        const skus =
            selected.sku.length > 0
                ? selected.sku.map(sku => {
                      return {
                          skuId: sku.value,
                          sku: sku.desc,
                      };
                  })
                : [];

        const subSegements =
            selected.subSegmentId.length > 0
                ? selected.subSegmentId.map(subSegements => {
                      return {
                          subSegmentId: subSegements.value,
                          subSegment: subSegements.desc,
                      };
                  })
                : [];

        const needStates =
            selected.stateId.length > 0
                ? selected.stateId.map(needStates => {
                      return {
                          needStateId: needStates.value,
                          state: needStates.desc,
                      };
                  })
                : [];

        const subCategorys =
            selected.subCategoryId.length > 0
                ? selected.subCategoryId.map(subCategorys => {
                      return {
                          subCategoryId: subCategorys.value,
                          subCategory: subCategorys.desc,
                      };
                  })
                : [];

        const masterCodes =
            selected.masterCodeId.length > 0
                ? selected.masterCodeId.map(masterCodes => {
                      return {
                          masterCodeId: masterCodes.value,
                          masterCode: masterCodes.label,
                      };
                  })
                : [];

        const rootCodes =
            selected.rootCodeId.length > 0
                ? selected.rootCodeId.map(rootCodes => {
                      return {
                          rootCodeId: rootCodes.value,
                          rootCode: rootCodes.label,
                      };
                  })
                : [];

        const variants =
            selected.variantId.length > 0
                ? selected.variantId.map(variants => {
                      return {
                          variantId: variants.value,
                          variant: variants.desc,
                      };
                  })
                : [];

        return {
            segments: segments,
            categories: categories,
            brands: brands,
            subBrands: subBrands,
            skus: skus,
            subSegements: subSegements,
            needStates: needStates,
            subCategorys: subCategorys,
            masterCodes: masterCodes,
            rootCodes: rootCodes,
            variants: variants,
        };
    };

    const buildCustomers = () => {
        const channels =
            selected.channel.length > 0
                ? selected.channel.map(channel => {
                      return {
                          channelId: channel.value,
                          channel: channel.desc,
                      };
                  })
                : [];
        const customers =
            selected.customer.length > 0
                ? selected.customer.map(customer => {
                      return {
                          customerId: customer.value,
                          customer: customer.desc,
                      };
                  })
                : [];
        const shipCustomers = selected.shipCustomer.length
            ? selected.shipCustomer.map(x => ({ shippedToId: x.value, shipToCustName: x.desc }))
            : [];
        const soldCustomers = selected.soldCustomer.length
            ? selected.soldCustomer.map(x => ({ soldToId: x.value, soldToCustName: x.desc }))
            : [];
        return {
            channels: channels,
            customers: customers,
            shipCustomers,
            soldCustomers,
        };
    };

    const toggleSection = (filterId: number) => {
        setOpenSections(prev => ({
            ...prev,
            [filterId]: !prev[filterId],
        }));
    };

    const toggleFilterSection = (section: keyof typeof openFilterSections) => {
        setOpenFilterSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const fetchIds = (selectedTree: Option[]) => {
        if (selectedTree.some(item => item.value === 'ALL' || item.value === 'all')) {
            return 'ALL';
        }
        const filtered = selectedTree.filter(item => item.label !== '');
        if (filtered.length === 0) return null;

        const joined = filtered.map(item => item.value).join(',');
        return joined === '' ? null : joined;
    };

    const handleEditFilterGroup = (filterGroup: FilterGroupDataModel) => {
        setIsEditFilterGroup(true);
        setSelectedFilterId(filterGroup.filterId);
        setFilterGroupName(filterGroup.filterName);

        const hierarchy = filterGroup.userGlobalFilters;
        if (hierarchy) {
            const { geographies, products, customers } = hierarchy;

            const fcId =
                filterGroup?.financialCycleId !== undefined &&
                filterGroup?.financialCycleId !== null &&
                filterGroup?.financialCycleId !== ''
                    ? String(filterGroup.financialCycleId)
                    : null;

            const fcLabel = (filterGroup?.financialCycle ?? '').trim();

            const financialCycle: Option[] = fcId ? [{ label: fcLabel, value: fcId }] : [];
            const region =
                geographies?.regions?.map(r => ({ label: r.region, value: r.regionId })) ?? [];
            const cluster =
                geographies?.clusters?.map(c => ({ label: c.cluster, value: c.clusterId })) ?? [];
            const market =
                geographies?.markets?.map(m => ({ label: m.market, value: m.marketId })) ?? [];
            const site =
                geographies?.sites?.map(s => ({ label: s.manufacturingSite, value: s.siteId })) ??
                [];
            const siteType =
                geographies?.siteType?.map(s => ({ label: s.siteType, value: s.siteType })) ?? [];
            const siteCode =
                geographies?.siteCode?.map(s => ({ label: s.siteCodes, value: s.siteId })) ?? [];
            const organization: never[] = [];
            const segment =
                products?.segments?.map(s => ({
                    label: s.segment,
                    value: s.segmentId,
                    desc: s.segment,
                })) ?? [];
            const category =
                products?.categories?.map(c => ({
                    label: c.category,
                    value: c.categoryId,
                    desc: c.category,
                })) ?? [];
            const brand =
                products?.brands?.map(b => ({ label: b.brand, value: b.brandId, desc: b.brand })) ??
                [];
            const subBrand =
                products?.subBrands?.map(sb => ({
                    label: sb.subBrand,
                    value: sb.subBrandId,
                    desc: sb.subBrand,
                })) ?? [];
            const sku =
                products?.skUs?.map(sku => ({ label: sku.sku, value: sku.skuId, desc: sku.sku })) ??
                [];

            const subSegmentId =
                products?.subSegements?.map(subSegment => ({
                    label: subSegment.subSegment,
                    desc: subSegment.subSegment, // Now using desc
                    value: subSegment.subSegmentId,
                })) ?? [];
            const stateId =
                products?.needStates?.map(stateId => ({
                    label: stateId.state,
                    value: stateId.needStateId,
                    desc: stateId.state,
                })) ?? [];
            const subCategoryId =
                products?.subCategorys?.map(subCategoryId => ({
                    label: subCategoryId.subCategory,
                    value: subCategoryId.subCategoryId,
                    desc: subCategoryId.subCategory,
                })) ?? [];
            const masterCodeId =
                products?.masterCodes?.map(masterCodeId => ({
                    label: masterCodeId.masterCode,
                    value: masterCodeId.masterCodeId,
                    desc: masterCodeId.masterCode,
                })) ?? [];
            const rootCodeId =
                products?.rootCodes?.map(rootCodeId => ({
                    label: rootCodeId.rootCode,
                    value: rootCodeId.rootCodeId,
                    desc: rootCodeId.rootCode,
                })) ?? [];
            const variantId =
                products?.variants?.map(variantId => ({
                    label: variantId.variant,
                    value: variantId.variantId,
                    desc: variantId.variant,
                })) ?? [];
            const channel =
                customers?.channels?.map(cc => ({
                    label: cc.channel,
                    value: cc.channelId,
                    desc: cc.channel,
                })) ?? [];
            const customer =
                customers?.customers?.map(c => ({
                    label: c.customer,
                    value: c.customerId,
                    desc: c.customer,
                })) ?? [];
            const mrpController = [] as Option[];
            const shipCustomer =
                customers?.shipCustomers?.map(s => ({
                    label: s.shipToCustName,
                    value: s.shippedToId,
                    desc: s.shipToCustName,
                })) ?? [];

            const soldCustomer =
                customers?.soldCustomers?.map(s => ({
                    label: s.soldToCustName,
                    value: s.soldToId,
                    desc: s.soldToCustName,
                })) ?? [];
            setSelected(prev => ({
                ...prev,
                brand: brand,
                category: category,
                channel: channel,
                cluster: cluster,
                customer: customer,
                shipCustomer: shipCustomer,
                soldCustomer: soldCustomer,
                financialCycle: financialCycle,
                market: market,
                mrpController: mrpController,
                organization: organization,
                region: region,
                segment: segment,
                site: site,
                siteType: siteType,
                siteCode: siteCode,
                sku: sku,
                subBrand: subBrand,
                subSegmentId: subSegmentId,
                stateId: stateId,
                subCategoryId: subCategoryId,
                masterCodeId: masterCodeId,
                rootCodeId: rootCodeId,
                variantId: variantId,
            }));
            setSelectedFinancialCycle(financialCycle);

            const getUniqueSiteIds = (site: Option[], siteCode: Option[]): string => {
                const uniqueIds = new Set<string>();
                site.forEach(s => {
                    if (s.value) uniqueIds.add(String(s.value));
                });
                siteCode.forEach(sc => {
                    if (sc.value) uniqueIds.add(String(sc.value));
                });
                return Array.from(uniqueIds).join(',');
            };

            const geographyPayload = {
                regionId: geoFetchIds(region),
                clusterId: geoFetchIds(cluster),
                marketId: geoFetchIds(market),
                siteId: getUniqueSiteIds(site, siteCode),
            };

            const productPayload = {
                segmentId: fetchIds(segment),
                categoryId: fetchIds(category),
                brandId: fetchIds(brand),
                subBrandId: fetchIds(subBrand),
                skuId: fetchIds(sku),
                subSegmentId: fetchIds(subSegmentId),
                stateId: fetchIds(stateId),
                subCategoryId: fetchIds(subCategoryId),
                masterCodeId: fetchIds(masterCodeId),
                rootCodeId: fetchIds(rootCodeId),
                variantId: fetchIds(variantId),
            };

            const customerPayload = {
                channelId: fetchIds(channel),
                customerId: fetchIds(customer),
                shippedToId: fetchIds(shipCustomer),
                soldToId: fetchIds(soldCustomer),
            };
            fetchGeographyHeirarchy(geographyPayload, { preserveKeys: [] });
            fetchProductHeirarchy(productPayload, { preserveKeys: [] });
            fetchCustomerHeirarchy(customerPayload, { preserveKeys: [] });
        }
    };

    const isDuplicateFilterGroup = async (): Promise<{
        isNameDuplicate: boolean;
        isFilterDuplicate: boolean;
    }> => {
        const payload = {
            filterId: selectedFilterId ?? -1,
            filterName: filterGroupName,
            financialCycle: safeFinancialCycleId(),
            filterJSON: JSON.stringify({
                geographies: buildGeographies(),
                products: buildProducts(),
                customerChannels: buildCustomers(),
            }),
            userGlobalFilters: {
                geographies: buildGeographies(),
                products: buildProducts(),
                customers: buildCustomers(),
            },
            hierarchy: {
                geographies: {
                    regions: [],
                },
                products: {
                    segments: [],
                },
                customers: {
                    channelCustomers: [],
                },
            },
            isFilterApplied: true,
        };
        try {
            const response = await checkDuplicateFilterGroup(payload);
            const result = response?.data?.data?.[0];
            return {
                isNameDuplicate: result?.filterNameExists === 'True',
                isFilterDuplicate: result?.filterGroupExists === 'True',
            };
        } catch {
            return {
                isNameDuplicate: false,
                isFilterDuplicate: false,
            };
        }
    };

    const handleSaveOrEditFilterGroup = async () => {
        const payload = {
            filterId: isEditFilterGroup && selectedFilterId ? selectedFilterId : 0,
            filterName: filterGroupName,
            financialCycle: safeFinancialCycleId(), // null when none selected
            userGlobalFilters: {
                geographies: buildGeographies(),
                products: buildProducts(),
                customers: buildCustomers(),
            },
            hierarchy: {
                geographies: {
                    regions: [],
                },
                products: {
                    segments: [],
                },
                customers: {
                    channelCustomers: [],
                },
            },
        };
        try {
            await upsertFilterGroup(payload);
            setToastConfig({
                visible: true,
                message: isEditFilterGroup
                    ? `Filter group ${filterGroupName} updated successfully.`
                    : `Filter group ${filterGroupName} added successfully.`,
                type: 'Success',
            });
            return true;
        } catch {
            setToastConfig({
                visible: true,
                message: isEditFilterGroup
                    ? `Failed to update '${filterGroupName}'.`
                    : `Failed to add '${filterGroupName}'.`,
                type: 'Error',
            });
            return false;
        }
    };

    const geoPreserveMap: Record<string, DropdownKey[]> = {
        Region: ['region'],
        Cluster: ['cluster'],
        Market: ['market'],
        Site: ['site'],
        'Site Code': ['siteCode'],
    };

    const isAllSelected = (field: DropdownKey, selectedList: Option[]) => {
        const optionsForField = dropdowns[field] ?? [];
        if (!selectedList?.length || !optionsForField.length) return false;

        const selectedValues = new Set(selectedList.map(o => String(o.value)));
        const optionValues = optionsForField.map(o => String(o.value));

        if (selectedValues.size !== optionValues.length) return false;
        return optionValues.every(v => selectedValues.has(v));
    };

    const dropdownFetchIds = (field: DropdownKey, list: Option[]) => {
        if (isAllSelected(field, list)) {
            return 'ALL';
        }
        const filtered = (list || []).filter(item => item.label !== '');
        if (filtered.length === 0) return null;

        const joined = filtered.map(item => item.value).join(',');
        return joined === '' ? null : joined;
    };

    const geographyHierarchyPayload = (label: string, selectedTree: Option[]) => {
        const isDeselection = (selectedTree ?? []).length === 0;
        //This clears the UI state so the old Site Type doesn’t remain visible when user switch clusters
        if (label === 'Cluster') {
            setSelected(prev => ({ ...prev, siteType: [] }));
        }
        const payload = {
            regionId:
                label === 'Region'
                    ? geoFetchIds(selectedTree)
                    : label === 'Cluster' && isDeselection
                      ? null
                      : geoFetchIds(selected.region),
            clusterId:
                label === 'Cluster'
                    ? geoFetchIds(selectedTree)
                    : label === 'Market' && isDeselection
                      ? null
                      : geoFetchIds(selected.cluster),
            marketId:
                label === 'Market'
                    ? geoFetchIds(selectedTree)
                    : (label === 'Site' || label === 'Site Code') && isDeselection
                      ? null
                      : geoFetchIds(selected.market),
            siteId:
                label === 'Site' || label === 'Site Code'
                    ? geoFetchIds(selectedTree)
                    : geoFetchIds(selected.site),
            // On Region/Cluster/Market modification, recompute site types
            siteType:
                label === 'Region' || label === 'Cluster' || label === 'Market'
                    ? null
                    : geoFetchIds(selected.siteType),
        };

        if (label === 'Market' && isDeselection) {
            setSelected(prev => ({ ...prev, siteType: [] }));
        }
        const preserve = geoPreserveMap[label] ?? [];
        fetchGeographyHeirarchy(payload, { preserveKeys: preserve });
    };

    const geographyDropdowns: DropdownConfig[] = [
        {
            label: 'Region',
            isDisabled: false,
            options: dropdowns.region,
            selectedOptions: selected.region,
            setSelected: val => setSelected(prev => ({ ...prev, region: val })),
            onApply: (selectedTree: Option[]) => geographyHierarchyPayload('Region', selectedTree),
        },
        {
            label: 'Clusters',
            isDisabled: false,
            options: dropdowns.cluster,
            selectedOptions: selected.cluster,
            setSelected: val => setSelected(prev => ({ ...prev, cluster: val })),
            onApply: (selectedTree: Option[]) => geographyHierarchyPayload('Cluster', selectedTree),
        },
        {
            label: 'Market',
            isDisabled: false,
            options: dropdowns.market,
            selectedOptions: selected.market,
            setSelected: val => setSelected(prev => ({ ...prev, market: val })),
            onApply: (selectedTree: Option[]) => geographyHierarchyPayload('Market', selectedTree),
        },
        {
            label: 'Site Type',
            isDisabled: false,
            options: dropdowns.siteType,
            selectedOptions: selected.siteType,
            setSelected: val => setSelected(prev => ({ ...prev, siteType: val })),
            onApply: (selectedTree: Option[]) => {
                const selectedValues = selectedTree.map(item => item.value).join(',');
                // Fetch or filter based on the selected site type
                const payload = {
                    regionId: geoFetchIds(selected.region),
                    clusterId: geoFetchIds(selected.cluster),
                    marketId: geoFetchIds(selected.market),
                    siteId: geoFetchIds(selected.site),
                    siteType: selectedValues, // Include site type in the payload
                };

                // Call the function to fetch the geography hierarchy with the new payload
                fetchGeographyHeirarchy(payload, { preserveKeys: ['siteType'] });
            },
        },
        {
            label: 'Site',
            isDisabled: false,
            options: dropdowns.site,
            selectedOptions: selected.site,
            setSelected: val => setSelected(prev => ({ ...prev, site: val })),
            onApply: (selectedTree: Option[]) => geographyHierarchyPayload('Site', selectedTree),
        },
        {
            label: 'Site Code',
            isDisabled: false,
            options: dropdowns.siteCode,
            selectedOptions: selected.siteCode,
            setSelected: val => setSelected(prev => ({ ...prev, siteCode: val })),
            onApply: (selectedTree: Option[]) =>
                geographyHierarchyPayload('Site Code', selectedTree),
        },
        {
            label: 'Sales Organization',
            isDisabled: true,
            options: dropdowns.organization,
            selectedOptions: selected.organization,
            setSelected: val => setSelected(prev => ({ ...prev, organization: val })),
            onApply: (selectedTree: Option[]) =>
                geographyHierarchyPayload('Sales Organization', selectedTree),
        },
        {
            label: 'MRP Controller',
            isDisabled: true,
            options: dropdowns.mrpController,
            selectedOptions: selected.mrpController,
            setSelected: val => setSelected(prev => ({ ...prev, mrpController: val })),
            onApply: (selectedTree: Option[]) =>
                geographyHierarchyPayload('MRP Controller', selectedTree),
        },
    ];

    const prodPreserveMap: Record<string, DropdownKey[]> = {
        Segment: ['segment'],
        Category: ['category'],
        Brand: ['brand'],
        SubBrand: ['subBrand'],
        SKU: ['sku'],
        SubSegment: ['subSegment'],
        needStates: ['state'],
        SubCategoryId: ['subCategoryId'],
        MasterCodeId: ['masterCodeId'],
        RootCodeId: ['rootCodeId'],
        VariantId: ['variantId'],
    };
    const productHierarchyPayload = (
        label: string,
        selectedTree: Option[],
        pageSize = 20,
        pageNumber = 1,
    ) => {
        const payload = {
            segmentId:
                label === 'Segment'
                    ? dropdownFetchIds('segment', selectedTree)
                    : dropdownFetchIds('segment', selected.segment),
            categoryId:
                label === 'Category'
                    ? dropdownFetchIds('category', selectedTree)
                    : dropdownFetchIds('category', selected.category),
            brandId:
                label === 'Brand'
                    ? dropdownFetchIds('brand', selectedTree)
                    : dropdownFetchIds('brand', selected.brand),
            subBrandId:
                label === 'Sub-Brand'
                    ? dropdownFetchIds('subBrand', selectedTree)
                    : dropdownFetchIds('subBrand', selected.subBrand),
            skuId:
                label === 'SKU'
                    ? dropdownFetchIds('sku', selectedTree)
                    : dropdownFetchIds('sku', selected.sku),
            subSegmentId:
                label === 'SubSegment'
                    ? dropdownFetchIds('subSegment', selectedTree)
                    : dropdownFetchIds('subSegment', selected.subSegmentId),
            stateId:
                label === 'needStates'
                    ? dropdownFetchIds('state', selectedTree)
                    : dropdownFetchIds('state', selected.stateId),
            subCategoryId:
                label === 'SubCategoryId'
                    ? dropdownFetchIds('subCategoryId', selectedTree)
                    : dropdownFetchIds('subCategoryId', selected.subCategoryId),
            masterCodeId:
                label === 'MasterCodeId'
                    ? dropdownFetchIds('masterCodeId', selectedTree)
                    : dropdownFetchIds('masterCodeId', selected.masterCodeId),
            rootCodeId:
                label === 'RootCodeId'
                    ? dropdownFetchIds('rootCodeId', selectedTree)
                    : dropdownFetchIds('rootCodeId', selected.rootCodeId),
            variantId:
                label === 'VariantId'
                    ? dropdownFetchIds('variantId', selectedTree)
                    : dropdownFetchIds('variantId', selected.variantId),
            pageSize,
            pageNumber,
        };

        const preserve = prodPreserveMap[label] ?? [];
        fetchProductHeirarchy(payload, { preserveKeys: preserve }, pageSize, pageNumber);
        resetAllProductPaging();
    };

    const [, setPageNumber] = useState(1);
    const [, setHasMore] = useState(true);
    const [, setSearchKeyword] = useState('');
    const initialOptionsRef = useRef<Partial<Record<DropdownKey, Option[]>>>({});

    //--. loading
    const [searching, setSearching] = useState<{
        label: string | null;
        term: string;
        loading: boolean;
    }>({ label: null, term: '', loading: false });

    const [pendingByLabel, setPendingByLabel] = useState<Record<string, Option[]>>({});
    const setPending = (label: string, updater: (prev: Option[]) => Option[]) =>
        setPendingByLabel(prev => ({ ...prev, [label]: updater(prev[label] || []) }));

    const clearPending = (label: string) =>
        setPendingByLabel(prev => {
            const copy = { ...prev };
            delete copy[label];
            return copy;
        });

    const customerDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const productDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const CUSTOMER_LABEL: Record<CustomerField, string> = {
        channel: 'Channel',
        customer: 'Key Customer',
        shipCustomer: 'Ship to customer',
        soldCustomer: 'Sold to customer',
    };

    const PRODUCT_LABEL: Record<ProductField, string> = {
        segment: 'Segment',
        subSegment: 'Sub-Segment',
        state: 'Need State',
        category: 'Category',
        subCategory: 'Sub-Category',
        brand: 'Brand',
        subBrand: 'Sub-Brand',
        rootCode: 'Root Code',
        variant: 'Variant',
        masterCode: 'Master Code',
        sku: 'SKU',
    };

    const custRequestSeq = useRef(0);
    // ---- Require at least ONE selection across Geography OR Product Hierarchy OR Customer

    type CustomerField = 'channel' | 'customer' | 'shipCustomer' | 'soldCustomer';

    type ProductField =
        | 'segment'
        | 'subSegment'
        | 'state'
        | 'category'
        | 'subCategory'
        | 'brand'
        | 'subBrand'
        | 'rootCode'
        | 'variant'
        | 'masterCode'
        | 'sku';

    const fetchProductOptions = async (
        field: ProductField,
        page: number,
        keyword = '',
        opts?: { seq?: number; force?: boolean },
    ) => {
        const isTyping = !!keyword;
        const mySeq = opts?.seq ?? productRequestSeq.current;
        if (!isTyping) {
            if (ProductLoading.current || (!productHasMoreByField[field] && !keyword)) return;
        }

        if (!isTyping) ProductLoading.current = true;

        const activeOr = (f: ProductField, ids: string | null) =>
            isTyping && field === f ? null : ids;

        const payload = {
            segmentId: activeOr('segment', fetchIds(selected.segment)),
            subSegmentId: activeOr('subSegment', fetchIds(selected.subSegmentId)),
            stateId: activeOr('state', fetchIds(selected.stateId)),
            categoryId: activeOr('category', fetchIds(selected.category)),
            subCategoryId: activeOr('subCategory', fetchIds(selected.subCategoryId)),
            brandId: activeOr('brand', fetchIds(selected.brand)),
            subBrandId: activeOr('subBrand', fetchIds(selected.subBrand)),
            rootCodeId: activeOr('rootCode', fetchIds(selected.rootCodeId)),
            variantId: activeOr('variant', fetchIds(selected.variantId)),
            masterCodeId: activeOr('masterCode', fetchIds(selected.masterCodeId)),
            skuId: activeOr('sku', fetchIds(selected.sku)),

            pageSize: ProductPageSize,
            pageNumber: page,
            searchKeyword: isTyping ? keyword : undefined,
            searchColumn: isTyping ? PRODUCT_FIELD_MAP[field].searchColumn : null,
        };

        try {
            const res = await getProductHeirarchy(payload);
            if (mySeq !== productRequestSeq.current) return;
            const data = res?.[0] ?? {};
            const map = PRODUCT_FIELD_MAP[field];
            const arr: any[] = (data as any)[map.arrayKey] || [];

            const incoming = arr
                .filter((o: any) => o?.[map.idKey] != null)
                .map((o: any) => ({
                    label: String(o[map.idKey] ?? ''),
                    value: String(o[map.idKey]),
                    desc: String(o[map.labelKey] ?? ''),
                }));

            setDropdowns(prev => {
                const selectedForField = (selected as any)[field] ?? [];
                const base = isTyping && page === 1 ? [...selectedForField] : (prev[field] ?? []);
                const seen = new Set(base.map((p: Option) => p.value));
                const merged = [...base, ...incoming.filter(n => !seen.has(n.value))];
                return { ...prev, [field]: merged };
            });

            const hasMore = incoming.length === ProductPageSize;
            // still only update if latest
            if (mySeq === productRequestSeq.current) {
                setProductHasMoreByField(prev => ({ ...prev, [field]: hasMore }));
                setProductHasMore(hasMore);
            }
        } catch (e) {
            logError('Error fetching product options:', e);
        } finally {
            if (!isTyping) ProductLoading.current = false;
        }
    };

    const handleSearch = (term: string) => {
        setSearchKeyword(term);
        setPageNumber(1);
        setHasMore(true);

        setDropdowns(prev => ({
            ...prev,
            sku: [],
        }));
    };

    const resetAllCustomerPaging = () => {
        setCustPageByField({ channel: 1, customer: 1, shipCustomer: 1, soldCustomer: 1 });
        setCustHasMoreByField({
            channel: true,
            customer: true,
            shipCustomer: true,
            soldCustomer: true,
        });
        setCustPageNumber(1);
        setCustHasMore(true);
    };

    const handleCustomerSearch = (field: CustomerField, term: string) => {
        const next = term ?? '';
        setActiveCustField(field);
        resetAllCustomerPaging();
        setCustSearchKeyword(next);
        setSearching({ label: CUSTOMER_LABEL[field], term: next, loading: !!next });
        setDropdowns(prev => ({
            ...prev,
            [field]: mergeUnique(
                initialOptionsRef.current[field] ?? [],
                (selected as any)[field] || [],
            ),
        }));
    };

    const resetAllProductPaging = () => {
        setProductPageByField({
            segment: 1,
            subSegment: 1,
            state: 1,
            category: 1,
            subCategory: 1,
            brand: 1,
            subBrand: 1,
            rootCode: 1,
            variant: 1,
            masterCode: 1,
            sku: 1,
        });
        setProductHasMoreByField({
            segment: true,
            subSegment: true,
            state: true,
            category: true,
            subCategory: true,
            brand: true,
            subBrand: true,
            rootCode: true,
            variant: true,
            masterCode: true,
            sku: true,
        });
        setProductPageNumber(1);
        setProductHasMore(true);
    };

    const handleProductSearch = (field: ProductField, term: string) => {
        setActiveProductField(field);
        resetAllProductPaging();

        const next = (term ?? '').trim();
        setProductSearchKeyword(next);

        if (next) {
            setSearching({ label: PRODUCT_LABEL[field], term: next, loading: true });
        } else {
            // restore default options for this field
            setDropdowns(prev => ({
                ...prev,
                [field]: initialOptionsRef.current[field] ?? [],
            }));
            setSearching(s =>
                s.label === PRODUCT_LABEL[field] ? { label: null, term: '', loading: false } : s,
            );
        }
    };

    useEffect(() => {
        setSelected(prev => ({ ...prev, financialCycle: selectedFinancialCycle || [] }));
    }, [selectedFinancialCycle]);

    const makeProductScrollHandler = (field: ProductField) => () => {
        if (activeProductField !== field) {
            setActiveProductField(field);
            setProductSearchKeyword('');
            setProductPageByField(prev => ({ ...prev, [field]: 1 }));
            setProductHasMoreByField(prev => ({ ...prev, [field]: true }));
            setProductPageNumber(1);
            setProductHasMore(true);
        }

        if (!productHasMoreByField[field] || ProductLoading.current) return;

        const next = (productPageByField[field] ?? 1) + 1;
        setProductPageByField(prev => ({ ...prev, [field]: next }));
        setProductPageNumber(next);

        const keyword = activeProductField === field ? ProductSearchKeyword || '' : '';
        fetchProductOptions(field, next, keyword);
    };

    const productHierarchyDropdowns: DropdownConfig[] = [
        {
            label: 'Segment',
            isDisabled: false,
            options: dropdowns.segment,
            selectedOptions: selected.segment,
            setSelected: val => setSelected(prev => ({ ...prev, segment: val })),
            onApply: (selectedTree: Option[]) => productHierarchyPayload('Segment', selectedTree),
            onScroll: makeProductScrollHandler('segment'),
            onSearch: term => handleProductSearch('segment', term),
        },
        {
            label: 'Sub-Segment',
            isDisabled: false,
            options: dropdowns.subSegment,
            selectedOptions: selected.subSegmentId,
            setSelected: val => setSelected(prev => ({ ...prev, subSegmentId: val })),
            onApply: (selectedTree: Option[]) =>
                productHierarchyPayload('SubSegment', selectedTree),
            onScroll: makeProductScrollHandler('subSegment'),
            onSearch: term => handleProductSearch('subSegment', term),
        },
        {
            label: 'Need State',
            isDisabled: false,
            options: dropdowns.state,
            selectedOptions: selected.stateId,
            setSelected: val => setSelected(prev => ({ ...prev, stateId: val })),
            onApply: (selectedTree: Option[]) =>
                productHierarchyPayload('needStates', selectedTree),
            onScroll: makeProductScrollHandler('state'),
            onSearch: term => handleProductSearch('state', term),
        },
        {
            label: 'Category',
            isDisabled: false,
            options: dropdowns.category,
            selectedOptions: selected.category,
            setSelected: val => setSelected(prev => ({ ...prev, category: val })),
            onApply: (selectedTree: Option[]) => productHierarchyPayload('Category', selectedTree),
            onScroll: makeProductScrollHandler('category'),
            onSearch: term => handleProductSearch('category', term),
        },
        {
            label: 'Sub-Category',
            isDisabled: false,
            options: dropdowns.subCategoryId,
            selectedOptions: selected.subCategoryId,
            setSelected: val => setSelected(prev => ({ ...prev, subCategoryId: val })),
            onApply: (selectedTree: Option[]) =>
                productHierarchyPayload('SubCategoryId', selectedTree),
            onScroll: makeProductScrollHandler('subCategory'),
            onSearch: term => handleProductSearch('subCategory', term),
        },
        {
            label: 'Brand',
            isDisabled: false,
            options: dropdowns.brand,
            selectedOptions: selected.brand,
            setSelected: val => setSelected(prev => ({ ...prev, brand: val })),
            onApply: (selectedTree: Option[]) => productHierarchyPayload('Brand', selectedTree),
            onScroll: makeProductScrollHandler('brand'),
            onSearch: term => handleProductSearch('brand', term),
        },
        {
            label: 'Sub-Brand',
            isDisabled: false,
            options: dropdowns.subBrand,
            selectedOptions: selected.subBrand,
            setSelected: val => setSelected(prev => ({ ...prev, subBrand: val })),
            onApply: (selectedTree: Option[]) => productHierarchyPayload('Sub-Brand', selectedTree),
            onScroll: makeProductScrollHandler('subBrand'),
            onSearch: term => handleProductSearch('subBrand', term),
        },
        {
            label: 'Master Code',
            isDisabled: false,
            options: dropdowns.masterCodeId,
            selectedOptions: selected.masterCodeId,
            setSelected: val => setSelected(prev => ({ ...prev, masterCodeId: val })),
            onApply: (selectedTree: Option[]) =>
                productHierarchyPayload('MasterCodeId', selectedTree),
            onScroll: makeProductScrollHandler('masterCode'),

            onSearch: term => handleProductSearch('masterCode', term),
        },
        {
            label: 'Root Code',
            isDisabled: false,
            options: dropdowns.rootCodeId,
            selectedOptions: selected.rootCodeId,
            setSelected: val => setSelected(prev => ({ ...prev, rootCodeId: val })),
            onApply: (selectedTree: Option[]) =>
                productHierarchyPayload('RootCodeId', selectedTree),
            onScroll: makeProductScrollHandler('rootCode'),

            onSearch: term => handleProductSearch('rootCode', term),
        },
        {
            label: 'Variant',
            isDisabled: false,
            options: dropdowns.variantId,
            selectedOptions: selected.variantId,
            setSelected: val => setSelected(prev => ({ ...prev, variantId: val })),
            onApply: (selectedTree: Option[]) => productHierarchyPayload('VariantId', selectedTree),
            onScroll: makeProductScrollHandler('variant'),

            onSearch: term => handleProductSearch('variant', term),
        },
        {
            label: 'SKU',
            isDisabled: false,
            options: dropdowns.sku,
            selectedOptions: selected.sku,
            setSelected: val => setSelected(prev => ({ ...prev, sku: val })),
            onApply: (selectedTree: Option[]) => productHierarchyPayload('SKU', selectedTree),
            onScroll: makeProductScrollHandler('sku'),

            onSearch: term => handleProductSearch('sku', term),
        },
    ];
    const custPreserveMap: Record<string, DropdownKey[]> = {
        Channel: ['channel'],
        Customer: ['customer'],
        'Ship to customer': ['shipCustomer'],
        'Sold to customer': ['soldCustomer'],
    };

    const customerHierarchyPayload = (label: string, selectedTree: Option[]) => {
        const payload = {
            channelId:
                label === 'Channel'
                    ? dropdownFetchIds('channel', selectedTree)
                    : dropdownFetchIds('channel', selected.channel),

            customerId:
                label === 'Customer'
                    ? dropdownFetchIds('customer', selectedTree)
                    : dropdownFetchIds('customer', selected.customer),

            shippedToId:
                label === 'Ship to customer'
                    ? dropdownFetchIds('shipCustomer', selectedTree)
                    : dropdownFetchIds('shipCustomer', selected.shipCustomer),

            soldToId:
                label === 'Sold to customer'
                    ? dropdownFetchIds('soldCustomer', selectedTree)
                    : dropdownFetchIds('soldCustomer', selected.soldCustomer),
        };

        const preserve = custPreserveMap[label] ?? [];
        fetchCustomerHeirarchy(payload, { preserveKeys: preserve }, customerPageSize, 1);
        setCustPageNumber(1);
        resetAllCustomerPaging();
    };

    const makeCustomerScrollHandler = (field: CustomerField) => () => {
        if (activeCustField !== field) {
            setActiveCustField(field);
            setCustSearchKeyword('');
            setCustPageByField(prev => ({ ...prev, [field]: 1 }));
            setCustHasMoreByField(prev => ({ ...prev, [field]: true }));
            setCustPageNumber(1);
            setCustHasMore(true);
        }

        if (!custHasMoreByField[field] || custLoading.current) return;

        const next = (custPageByField[field] ?? 1) + 1;
        setCustPageByField(prev => ({ ...prev, [field]: next }));
        setCustPageNumber(next);
        const keyword = activeCustField === field ? custSearchKeyword || '' : '';
        fetchCustomerOptions(field, next, keyword);
    };

    const customerHierarchyDropdowns: DropdownConfig[] = [
        {
            label: 'Channel',
            isDisabled: false,
            options: dropdowns.channel,
            selectedOptions: selected.channel,
            setSelected: val => setSelected(prev => ({ ...prev, channel: val })),
            onApply: (selectedTree: Option[]) => customerHierarchyPayload('Channel', selectedTree),
            onSearch: term => handleCustomerSearch('channel', term),
            onScroll: makeCustomerScrollHandler('channel'),
        },
        {
            label: 'Key Customer',
            isDisabled: false,
            options: dropdowns.customer,
            selectedOptions: selected.customer,
            setSelected: val => setSelected(prev => ({ ...prev, customer: val })),
            onApply: (selectedTree: Option[]) => customerHierarchyPayload('Customer', selectedTree),
            onSearch: term => handleCustomerSearch('customer', term),
            onScroll: makeCustomerScrollHandler('customer'),
        },
        {
            label: 'Ship to customer',
            isDisabled: false,
            options: dropdowns.shipCustomer,
            selectedOptions: selected.shipCustomer,
            setSelected: val => setSelected(prev => ({ ...prev, shipCustomer: val })),
            onApply: (selectedTree: Option[]) =>
                customerHierarchyPayload('Ship to customer', selectedTree),
            onScroll: makeCustomerScrollHandler('shipCustomer'),

            onSearch: term => handleCustomerSearch('shipCustomer', term),
        },
        {
            label: 'Sold to customer',
            isDisabled: false,
            options: dropdowns.soldCustomer,
            selectedOptions: selected.soldCustomer,
            setSelected: val => setSelected(prev => ({ ...prev, soldCustomer: val })),
            onApply: (selectedTree: Option[]) =>
                customerHierarchyPayload('Sold to customer', selectedTree),
            onScroll: makeCustomerScrollHandler('soldCustomer'),

            onSearch: term => handleCustomerSearch('soldCustomer', term),
        },
    ];

    const geoFetchIds = (list: Option[] = []): string | null => {
        const filtered = (list ?? []).filter(item => item.label !== '');
        if (filtered.length === 0) return null;
        return filtered.map(item => String(item.value)).join(',');
    };

    const renderDropdowns = (configs: DropdownConfig[], loading: boolean) =>
        configs.map(config => {
            const isSearchingThis = searching.loading && searching.label === config.label;

            //  Start from raw options
            let rawOptions: Option[] = config.options;

            //  If Site Type is selected, filter Site / Site Code by that type
            if (
                (config.label === 'Site' || config.label === 'Site Code') &&
                selected.siteType &&
                selected.siteType.length > 0
            ) {
                const allowedTypes = new Set(selected.siteType.map(st => st.value));
                rawOptions = rawOptions.filter(opt =>
                    opt.siteType ? allowedTypes.has(opt.siteType) : true,
                );
            }

            const dropdownOptions = isSearchingThis
                ? []
                : rawOptions.map(item => ({
                      label: config.label === 'SKU' ? removeLeadingZeros(item.label) : item.label,
                      value: String(item.value),
                      desc: item.desc,
                  }));

            const selectedOptionsForDropdown = (() => {
                const draft = pendingByLabel[config.label];
                const source = draft !== undefined ? draft : (config.selectedOptions ?? []);

                //  Also keep selected Site / Site Code consistent with current Site Type
                if (
                    (config.label === 'Site' || config.label === 'Site Code') &&
                    selected.siteType &&
                    selected.siteType.length > 0
                ) {
                    const allowedTypes = new Set(selected.siteType.map(st => st.value));
                    return source
                        .filter(o => !o.siteType || allowedTypes.has(o.siteType))
                        .map(o => ({
                            label: o.label,
                            value: String(o.value),
                            desc: o.desc,
                        }));
                }

                return source.map(o => ({
                    label: o.label,
                    value: String(o.value),
                    desc: o.desc,
                }));
            })();

            return (
                <div key={config.label}>
                    {loading ? (
                        <Skeleton.Input block active style={{ height: '40px' }} />
                    ) : (
                        <DropDown
                            className="drop-down"
                            dataTestId="dropd-down"
                            confirmSelection={{
                                apply: {
                                    onClick: tree => {
                                        const selectedTree = (tree as Option[]).map(item => ({
                                            label: item.label,
                                            value: String(item.value),
                                            desc: item.desc,
                                            siteType: item.siteType, // keep siteType
                                        }));
                                        config.setSelected(selectedTree);
                                        config.onApply?.(selectedTree);
                                        setPending(config.label, () => selectedTree);
                                        clearPending(config.label);
                                    },
                                },
                                cancel: { onClick: () => clearPending(config.label) },
                            }}
                            dropdown={{
                                onChecked: (obj, checked) => {
                                    const label = config.label;
                                    const value = String(obj.value);

                                    //detect whether a draft exists for this label
                                    const hasDraft = pendingByLabel[label] !== undefined;
                                    setPending(label, prev => {
                                        const base = hasDraft
                                            ? [...prev]
                                            : [...(config.selectedOptions ?? [])];
                                        if (value === 'all') {
                                            if (checked) {
                                                return dropdownOptions.map(opt => ({
                                                    label: opt.label,
                                                    value: String(opt.value),
                                                    desc: opt.desc,
                                                }));
                                            } else {
                                                // Explicitly clear ALL from both pending and config
                                                config.setSelected([]);
                                                return [];
                                            }
                                        }

                                        const exists = base.some(p => String(p.value) === value);

                                        if (checked && !exists) {
                                            return [
                                                ...base,
                                                {
                                                    label: obj.label,
                                                    value,
                                                    desc: obj.desc,
                                                    siteType: (obj as any).siteType, // keep siteType if present
                                                },
                                            ];
                                        }
                                        if (!checked && exists) {
                                            return base.filter(p => String(p.value) !== value);
                                        }
                                        return base;
                                    });
                                },
                                isDisabled: config.isDisabled,
                                isLabelInline: false,
                                label: config.label,
                                onChange: () => {},
                                options: dropdownOptions,
                                showSelectAll:
                                    config.options.length > 1 &&
                                    config.label.toLowerCase() !== 'sku',
                                selectAllOption:
                                    config.label.toLowerCase() !== 'sku'
                                        ? { label: 'ALL', value: 'all' }
                                        : undefined,
                                placeholder: `Select ${config.label}`,
                                required: false,
                                reset: false,
                                selectedOptions: selectedOptionsForDropdown,
                                handleClickOutsideEvent: () => clearPending(config.label),
                                size: 'L',
                                type: 'checkbox',
                                onScroll: config.onScroll,
                                onSearch: (term: string) =>
                                    config.onSearch ? config.onSearch(term) : handleSearch(term),
                                showCheckboxDescriptionLabel: true,
                                showDescription: true,
                                isLabelMuted: true,
                            }}
                            id="drop-down"
                            searchInput={
                                dropdownOptions.length >= 10
                                    ? {
                                          searchPlaceholder: 'Search',
                                          searchSize: 'L',
                                          searchWholeString: true,
                                          loading:
                                              searching.loading && searching.label === config.label,
                                          loadingMessage:
                                              searching.loading && searching.label === config.label
                                                  ? `Searching for`
                                                  : 'Searching…',
                                      }
                                    : undefined
                            }
                        />
                    )}
                    <div className={styles['space-v-16']} />
                </div>
            );
        });

    const renderAllFilterGroups = useCallback(
        (filterGroup: FilterGroupDataModel) => {
            if (!filterGroup?.userGlobalFilters) return null;

            const { geographies, products, customers } = filterGroup.userGlobalFilters;

            const getLabel = (obj: any) =>
                typeof obj === 'string' ? obj : Object.keys(obj || {})[0] || 'Unknown';

            // NOTE: items is optional and can contain undefined/null
            const renderChips = (
                items: Array<string | undefined | null> = [],
                title: string,
                prefix: string,
            ) => {
                const clean = items.filter(i => i != null && i !== '');
                if (clean.length === 0) return null;

                const truncate = (text: string, maxLength: number = 40) => {
                    if (!text) return '';
                    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
                };

                const firstLabel = truncate(getLabel(clean[0]));
                const tooltipText = clean.map(getLabel).join(', ');
                const counter = clean.length > 1 ? clean.length - 1 : 0;

                return (
                    <FilterChip
                        key={`${prefix}-0`}
                        counter={counter}
                        label={firstLabel}
                        title={`${title}:`}
                        tooltipText={tooltipText}
                        showCloseIcon={false}
                    />
                );
            };

            // Geography
            const regions = geographies?.regions?.map(r => r.region);
            const clusters = geographies?.clusters?.map(c => c.cluster);
            const markets = geographies?.markets?.map(m => m.market);
            const sites = geographies?.sites?.map(s => s.manufacturingSite);
            const siteCodes = geographies?.siteCode?.map(s => s.siteCodes);
            const siteType = geographies?.siteType?.map(s => s.siteType);

            // Product
            const segments = products?.segments?.map(s => s.segment);
            const subSegments = products?.subSegements?.map(s => s.subSegment);
            const needState = products?.needStates?.map(s => s.state);
            const categories = products?.categories?.map(c => c.category);
            const subcategories = products?.subCategorys?.map(c => c.subCategory);
            const brands = products?.brands?.map(b => b.brand);
            const subBrands = products?.subBrands?.map(sb => sb.subBrand);
            const masterCode = products?.masterCodes?.map(c => c.masterCode);
            const rootCode = products?.rootCodes?.map(c => c.rootCode);
            const varients = products?.variants?.map(c => c.variant);
            const skus = products?.skUs
                ?.flatMap(s => removeLeadingZeros(s?.sku))
                .filter(Boolean) as string[] | undefined;

            // Customer (NEW fields included)
            const channels = customers?.channels?.map(cc => cc.channel);
            const customerList = customers?.customers?.flatMap(cc => cc.customer);
            const shipList = customers?.shipCustomers?.map(s => s.shipToCustName);
            const soldList = customers?.soldCustomers?.map(s => s.soldToCustName);

            return (
                <Flex className={styles['all-hierarchy-warpper']}>
                    <Flex className={styles['fliter-group-content-warpper']}>
                        <Flex wrap="wrap" gap="0.5rem">
                            {filterGroup.financialCycle &&
                                filterGroup.financialCycle !== 'undefined' &&
                                filterGroup.financialCycle !== '' &&
                                renderChips(
                                    [filterGroup.financialCycle],
                                    'Financial Cycle',
                                    'financial-cycle',
                                )}
                        </Flex>
                    </Flex>

                    <Flex className={styles['fliter-group-content-warpper']}>
                        <div>Geography:</div>
                        <Flex wrap="wrap" gap="0.5rem">
                            {renderChips(regions ?? [], 'Region', 'region')}
                            {renderChips(clusters ?? [], 'Cluster', 'cluster')}
                            {renderChips(markets ?? [], 'Market', 'market')}
                            {renderChips(sites ?? [], 'Site', 'site')}
                            {renderChips(siteType ?? [], 'SiteType', 'siteType')}
                            {renderChips(siteCodes ?? [], 'SiteCode', 'site-code')}
                            {renderChips([], 'SalesOrg', 'sales-org')}
                        </Flex>
                    </Flex>

                    <Flex className={styles['fliter-group-content-warpper']}>
                        <div>Product Hierarchy:</div>
                        <Flex wrap="wrap" gap="0.5rem">
                            {renderChips(segments ?? [], 'Segment', 'segment')}
                            {renderChips(subSegments ?? [], 'Sub-Segements', 'subSegements')}
                            {renderChips(needState ?? [], 'Need State', 'needState')}
                            {renderChips(categories ?? [], 'Category', 'category')}
                            {renderChips(subcategories ?? [], 'Sub-Category', 'subCategories')}
                            {renderChips(brands ?? [], 'Brand', 'brand')}
                            {renderChips(subBrands ?? [], 'Sub-Brand', 'subbrand')}
                            {renderChips(masterCode ?? [], 'Master Code', 'masterCode')}
                            {renderChips(rootCode ?? [], 'Root Code', 'rootCode')}
                            {renderChips(varients ?? [], 'Varient', 'Varient')}
                            {renderChips(skus ?? [], 'SKU', 'sku')}
                        </Flex>
                    </Flex>

                    <Flex className={styles['fliter-group-content-warpper']}>
                        <div>Customer Hierarchy:</div>
                        <Flex wrap="wrap" gap="0.5rem">
                            {renderChips(channels ?? [], 'Channel', 'channel')}
                            {renderChips(customerList ?? [], 'Key Customer', 'customer')}
                            {renderChips(shipList ?? [], 'Ship to Customer', 'ship-customer')}
                            {renderChips(soldList ?? [], 'Sold to Customer', 'sold-customer')}
                        </Flex>
                    </Flex>
                </Flex>
            );
        },
        [selected],
    );

    const handleDeleteFilterGroup = (filterGroup: FilterGroupDataModel) => {
        setSelectedFilterId(filterGroup.filterId);
        setToBeDeletedFilterName(filterGroup.filterName);
        setIsDialogOpen(true);
        dispatch(getUserGlobalFilters());
    };

    const mode = isEditFilterGroup ? 'edit' : 'add';

    return (
        <>
            <Flex vertical className={styles['outer-container-hierarchy-dropdown']}>
                {variant === 'flyout' ? (
                    <Flex vertical>
                        <DropDown
                            id="hierarchy-dropdown"
                            className={styles.dropdownField}
                            dropdown={{
                                label: 'Command Center Hierarchy',
                                options: hierarchies.map(hr => ({
                                    label: hr.hierarchy ?? '',
                                    value: hr.hierarchyId.toString(),
                                })),
                                reset: false,
                                placeholder: 'Select',
                                required: false,
                                onChange: option => {
                                    const selectedValue = option.value;
                                    setSelectedHierarchies(selectedValue);
                                },
                                selectedOptions: hierarchies.length
                                    ? hierarchies
                                          .filter(
                                              hr =>
                                                  hr.hierarchyId.toString() === selectedHierarchies,
                                          )
                                          .map(hr => ({
                                              label: hr.hierarchy || 'Unknown',
                                              value: hr.hierarchyId.toString(),
                                          }))
                                    : [],
                            }}
                            searchInput={
                                Array.isArray(hierarchies) && hierarchies.length > 10
                                    ? {
                                          searchPlaceholder: 'Search',
                                          searchSize: 'L',
                                          searchWholeString: true,
                                      }
                                    : undefined
                            }
                        />
                        <div className={styles['info-icon-container']}>
                            <IconButton icon="info-circle" size="Tiny" onClick={() => {}} />
                            <span className={styles['info-text']}>
                                All filters will be based on the selected hierarchy
                            </span>
                        </div>
                    </Flex>
                ) : (
                    <Card className={styles['user-profile-settings-card']}>
                        <Flex vertical>
                            <DropDown
                                id="hierarchy-dropdown"
                                className={styles.dropdownField}
                                dropdown={{
                                    label: 'Command Center Hierarchy',
                                    options: hierarchies.map(hr => ({
                                        label: hr.hierarchy ?? '',
                                        value: hr.hierarchyId.toString(),
                                    })),
                                    reset: false,
                                    placeholder: 'Select',
                                    required: false,
                                    onChange: option => {
                                        const selectedValue = option.value;
                                        setSelectedHierarchies(selectedValue);
                                    },
                                    selectedOptions: hierarchies.length
                                        ? hierarchies
                                              .filter(
                                                  hr =>
                                                      hr.hierarchyId.toString() ===
                                                      selectedHierarchies,
                                              )
                                              .map(hr => ({
                                                  label: hr.hierarchy || 'Unknown',
                                                  value: hr.hierarchyId.toString(),
                                              }))
                                        : [],
                                }}
                                searchInput={
                                    Array.isArray(hierarchies) && hierarchies.length > 10
                                        ? {
                                              searchPlaceholder: 'Search',
                                              searchSize: 'L',
                                              searchWholeString: true,
                                          }
                                        : undefined
                                }
                            />
                            <div className={styles['info-icon-container']}>
                                <IconButton icon="info-circle" size="Tiny" onClick={() => {}} />
                                <span className={styles['info-text']}>
                                    All filters will be based on the selected hierarchy
                                </span>
                            </div>
                        </Flex>
                    </Card>
                )}

                <RoleBasedFilterCard
                    roles={roles}
                    handleDetailsViewClicked={handleDetailsViewClicked}
                    variant={variant}
                    handleCheckboxChange={(checked, role) => {
                        setRoleChecked(prev => ({ ...prev, [role.roleId]: checked }));
                        setRoles(prev =>
                            prev.map(r =>
                                r.roleId === role.roleId ? { ...r, isFilterApplied: checked } : r,
                            ),
                        );
                        // keep bar visible/enabled until Apply/Cancel
                        setIsFilterContainerVisible(true);
                        setIsDirty(true);
                    }}
                    isLoading={loading}
                />

                {variant === 'flyout' ? (
                    <>
                        <Flex
                            justify="space-between"
                            className={styles['user-profile-settings-card-filter-group']}
                        >
                            <div className={styles['filter-group-title']}>Filter Groups</div>
                            <TextButton
                                onClick={() => setIsAddingFilterGroup(true)}
                                disabled={isFilterGroupDisabled}
                            >
                                <div
                                    className={
                                        isFilterGroupDisabled
                                            ? styles.textButtonDisabled
                                            : styles['add-filter-group']
                                    }
                                >
                                    + Filter Group
                                </div>
                            </TextButton>
                        </Flex>

                        {filterGroupDetailsData?.length ? (
                            <div className="fliter-group-wrapper">
                                {filterGroupDetailsData?.map(
                                    (filterGroup: FilterGroupDataModel) => (
                                        <div
                                            key={filterGroup.filterId}
                                            onMouseEnter={() =>
                                                setHoveredFilterId(filterGroup.filterId)
                                            }
                                            onMouseLeave={() => setHoveredFilterId(null)}
                                        >
                                            <ExpandableForm
                                                key={filterGroup.filterId}
                                                isOpen={!!openSections[filterGroup.filterId]}
                                                description=""
                                                title={
                                                    <Flex
                                                        justify="space-between"
                                                        align="center"
                                                        style={{ width: '100%' }}
                                                    >
                                                        <Flex align="center" gap="0.5rem">
                                                            <CheckBox
                                                                onChange={(checked: boolean) => {
                                                                    const updatedCheckedFilters = {
                                                                        ...checkedFilters,
                                                                        [filterGroup.filterId]:
                                                                            checked,
                                                                    };
                                                                    setCheckedFilters(
                                                                        updatedCheckedFilters,
                                                                    );
                                                                    setIsFilterContainerVisible(
                                                                        true,
                                                                    );
                                                                    setIsDirty(true);
                                                                    const filterGroupItem: IFilterGroupItem =
                                                                        {
                                                                            filterId:
                                                                                filterGroup.filterId,
                                                                            isFilterApplied:
                                                                                checked,
                                                                        };
                                                                    handleFilterGroupCheckboxChange?.(
                                                                        checked,
                                                                        filterGroupItem,
                                                                    );
                                                                }}
                                                                checked={
                                                                    checkedFilters[
                                                                        filterGroup.filterId
                                                                    ] ?? filterGroup.isFilterApplied
                                                                }
                                                            />

                                                            <span
                                                                className={
                                                                    styles[
                                                                        'filter-group-title-accordion'
                                                                    ]
                                                                }
                                                            >
                                                                {filterGroup.filterName}
                                                            </span>
                                                        </Flex>
                                                    </Flex>
                                                }
                                                content={renderAllFilterGroups(filterGroup)}
                                                onClick={() => toggleSection(filterGroup.filterId)}
                                                additionalContentInTitleContainer={
                                                    <div className="hover-container">
                                                        <Flex gap="0.5rem">
                                                            <div className="icon-buttons">
                                                                {hoveredFilterId ===
                                                                    filterGroup.filterId && (
                                                                    <>
                                                                        <IconButton
                                                                            icon="edit-02"
                                                                            onClick={() =>
                                                                                handleEditFilterGroup(
                                                                                    filterGroup,
                                                                                )
                                                                            }
                                                                            size="Tiny"
                                                                        />
                                                                        <IconButton
                                                                            icon="trash-01"
                                                                            onClick={() =>
                                                                                handleDeleteFilterGroup(
                                                                                    filterGroup,
                                                                                )
                                                                            }
                                                                            size="Tiny"
                                                                        />
                                                                    </>
                                                                )}
                                                            </div>
                                                            <Icon
                                                                name={
                                                                    openSections[
                                                                        filterGroup.filterId
                                                                    ]
                                                                        ? 'chevron-up'
                                                                        : 'chevron-down'
                                                                }
                                                                size="l"
                                                                color="neutrals-B800"
                                                            />
                                                        </Flex>
                                                    </div>
                                                }
                                                applyCustomSpacing={true}
                                            />
                                        </div>
                                    ),
                                )}
                            </div>
                        ) : (
                            <div className={styles['no-filtergroup-text']}>
                                No filter group added yet. Click “Add New Filter Group” to add a
                                filter group.
                            </div>
                        )}
                    </>
                ) : (
                    <Card className={styles['user-profile-settings-card']}>
                        <Flex
                            justify="space-between"
                            className={styles['user-profile-settings-card-filter-group']}
                        >
                            <div className={styles['filter-group-title']}>Filter Groups</div>
                            <TextButton
                                onClick={() => setIsAddingFilterGroup(true)}
                                disabled={isFilterGroupDisabled}
                            >
                                <div
                                    className={
                                        isFilterGroupDisabled
                                            ? styles.textButtonDisabled
                                            : styles['add-filter-group']
                                    }
                                >
                                    + Filter Group
                                </div>
                            </TextButton>
                        </Flex>

                        {filterGroupDetailsData?.length ? (
                            <div className="fliter-group-wrapper">
                                {filterGroupDetailsData?.map((filterGroup: any) => (
                                    <div
                                        key={filterGroup.filterId}
                                        onMouseEnter={() =>
                                            setHoveredFilterId(filterGroup.filterId)
                                        }
                                        onMouseLeave={() => setHoveredFilterId(null)}
                                    >
                                        <ExpandableForm
                                            key={filterGroup.filterId}
                                            isOpen={!!openSections[filterGroup.filterId]}
                                            description=""
                                            title={
                                                <Flex
                                                    justify="space-between"
                                                    align="center"
                                                    style={{ width: '100%' }}
                                                >
                                                    <Flex align="center" gap="0.5rem">
                                                        <CheckBox
                                                            checked={
                                                                checkedFilters[
                                                                    filterGroup.filterId
                                                                ] ?? filterGroup.isFilterApplied
                                                            }
                                                            onChange={(checked: boolean) => {
                                                                const updatedCheckedFilters = {
                                                                    ...checkedFilters,
                                                                    [filterGroup.filterId]: checked,
                                                                };
                                                                setCheckedFilters(
                                                                    updatedCheckedFilters,
                                                                );

                                                                // keep bar visible/enabled until Apply/Cancel
                                                                setIsFilterContainerVisible(true);
                                                                setIsDirty(true);
                                                            }}
                                                        />

                                                        <span
                                                            className={
                                                                styles[
                                                                    'filter-group-title-accordion'
                                                                ]
                                                            }
                                                        >
                                                            {filterGroup.filterName}
                                                        </span>
                                                    </Flex>
                                                </Flex>
                                            }
                                            content={renderAllFilterGroups(filterGroup)}
                                            onClick={() => toggleSection(filterGroup.filterId)}
                                            additionalContentInTitleContainer={
                                                <div className="hover-container">
                                                    <Flex gap="0.5rem">
                                                        <div className="icon-buttons">
                                                            {hoveredFilterId ===
                                                                filterGroup.filterId && (
                                                                <>
                                                                    <IconButton
                                                                        icon="edit-02"
                                                                        onClick={() =>
                                                                            handleEditFilterGroup(
                                                                                filterGroup,
                                                                            )
                                                                        }
                                                                        size="Tiny"
                                                                    />
                                                                    <IconButton
                                                                        icon="trash-01"
                                                                        onClick={() =>
                                                                            handleDeleteFilterGroup(
                                                                                filterGroup,
                                                                            )
                                                                        }
                                                                        size="Tiny"
                                                                    />
                                                                </>
                                                            )}
                                                        </div>
                                                        <Icon
                                                            name={
                                                                openSections[filterGroup.filterId]
                                                                    ? 'chevron-up'
                                                                    : 'chevron-down'
                                                            }
                                                            size="l"
                                                            color="neutrals-B800"
                                                        />
                                                    </Flex>
                                                </div>
                                            }
                                            applyCustomSpacing={true}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>
                                No filter groups added. Click"+Filter Group" to begin the process.
                            </div>
                        )}
                    </Card>
                )}

                {/* Flyout for Add/Edit */}
                {(isAddingFilterGroup || isEditFilterGroup) && (
                    <FilterGroupFlyout
                        isOpen={isAddingFilterGroup || isEditFilterGroup}
                        isEditMode={isEditFilterGroup}
                        filterGroupName={filterGroupName}
                        selected={selected}
                        mode={mode}
                        dropdowns={dropdowns}
                        onReset={() => {
                            resetFilterGroup();
                            setSelectedFinancialCycle([]);
                            setNameError('');
                            setFilterError('');
                            fetchDefaultDropDownOptions();
                        }}
                        onClose={() => {
                            setIsAddingFilterGroup(false);
                            setIsEditFilterGroup(false);
                            resetFilterGroup();
                            setSelectedFinancialCycle([]);
                            setNameError('');
                            setFilterError('');
                            fetchDefaultDropDownOptions();
                        }}
                        onSave={async () => {
                            const { isNameDuplicate, isFilterDuplicate } =
                                await isDuplicateFilterGroup();

                            setNameError('');
                            setFilterError('');

                            if (isNameDuplicate || isFilterDuplicate) {
                                if (isNameDuplicate) {
                                    setNameError('This filter name already exists.');
                                }
                                if (isFilterDuplicate) {
                                    setFilterError(
                                        'A Filter Group with the same filters already exists. Please modify the filters or use the existing group.',
                                    );
                                }

                                return {
                                    success: false,
                                    error: 'Validation failed',
                                };
                            }

                            const success = await handleSaveOrEditFilterGroup();

                            if (!success) {
                                setToastConfig({
                                    visible: true,
                                    message: `Failed to save the filter group '${filterGroupName}'.`,
                                    type: 'Error',
                                });

                                return {
                                    success: false,
                                    error: 'Failed to save the filter group.',
                                };
                            }

                            await dispatch(fetchFilterGroupDetails());
                            await dispatch(fetchAfUserRoleFilterDetails());
                            setLatestAddedFilterName(filterGroupName);
                            setIsAddingFilterGroup(false);
                            setIsEditFilterGroup(false);
                            resetFilterGroup();
                            setSelectedFinancialCycle([]);

                            return { success: true };
                        }}
                        onFilterGroupNameChange={handleFilterGroupNameChange}
                        renderDropdowns={renderDropdowns}
                        openFilterSections={openFilterSections}
                        toggleFilterSection={toggleFilterSection}
                        geographyDropdowns={geographyDropdowns}
                        productHierarchyDropdowns={productHierarchyDropdowns}
                        customerHierarchyDropdowns={customerHierarchyDropdowns}
                        onBackDropClickForFlyout={() => {
                            setIsAddingFilterGroup(false);
                            setIsEditFilterGroup(false);
                            resetFilterGroup();
                            setSelectedFinancialCycle([]);
                        }}
                        selectedFinancialCycle={selectedFinancialCycle}
                        setSelectedFinancialCycle={setSelectedFinancialCycle}
                        nameError={nameError}
                        filterError={filterError}
                        geoLoading={geoLoading}
                        productLoading={productLoading}
                        customerLoading={customerLoading}
                    />
                )}

                <DeleteFilterGroup
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    filterName={toBeDeletedFilterName}
                    filterId={selectedFilterId}
                />

                {toastConfig.visible && (
                    <div onClick={e => e.stopPropagation()}>
                        <Toast
                            distance="x5l"
                            message={toastConfig.message}
                            mode="Top Right"
                            onCloseToast={() => setToastConfig({ ...toastConfig, visible: false })}
                            toggle
                            type={toastConfig.type}
                            timer={5000}
                            className={styles['toast-configuration']}
                        />
                    </div>
                )}
            </Flex>

            {isFilterContainerVisible && variant === 'default' && (
                <Flex
                    className={`${styles['applyFilters-buttons-container']} ${
                        isFilterContainerVisible ? styles.visible : ''
                    }`}
                >
                    <Button
                        onClick={handleCancelFilters}
                        variant="Secondary"
                        size="M"
                        text="Cancel"
                        className={styles['cancel-buttons']}
                    />
                    <Button
                        text="Apply Selected Filters"
                        className={styles['applyFilters-buttons']}
                        variant="Primary"
                        size="L"
                        onClick={handleApplyFilters}
                        disabled={!isApplyEnabled}
                    />
                </Flex>
            )}
        </>
    );
};

export default UserProfileSettingsGlobalFilters;
