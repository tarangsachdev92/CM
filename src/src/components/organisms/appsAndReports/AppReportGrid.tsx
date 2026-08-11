import { Flex, Button } from 'antd';
import styles from './AppsAndReportsLandingPage.module.scss';
import {
    SearchInput,
    AppReportCard,
    Pagination,
    AnimatedLoaders,
    IconButton,
} from 'konnect-react-components';
import { HeartOutlined } from '@ant-design/icons';
import { FilterType } from '../../molecules/applied-filters/AppliedFilters';
import { AppliedFilters } from '../../molecules';
import { AppReport } from '../../../types/request';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useTranslation } from 'react-i18next';

interface AppReportGridProps {
    selectedCategory: string;
    setSelectedCategory: (value: string) => void;
    handleCategoryChange: (value: string) => void;
    handleSearchChange: (value: string) => void;
    isFavoriteClicked: boolean;
    handleFavoriteButtonToggle: () => void;
    setIsFilterFlyoutOpen: (value: boolean) => void;
    setIsResetButtonClicked: (value: boolean) => void;
    setPreviousFilterSelection: (value: any) => void;
    selectedRegion: { label: string; value: number }[];
    selectedFunction: { label: string; value: number }[];
    selectedSubfunction: { label: string; value: number }[];
    selectedReportType: { label: string; value: number }[];
    loading: boolean;
    totalItems: number;
    paginatedData: any[];
    handleFavoriteToggle: (item: any, category: string) => void;
    currentPage: number;
    handlePageChange: (page: number) => void;
    handlePageSizeChange: (size: number) => void;
    pageSize: number;
    noFavoritesFound: () => JSX.Element;
    noRecordsFound: () => JSX.Element;
    filters: FilterType[];
    setNewFilters: (
        filterName: string,
        filterTitle: string,
        filterArray: { label: string; value: number }[],
    ) => void;
    onReset: () => void;
    filterRenderKey: number;
    regionDD: { label: string; value: number }[];
    functionDD: { label: string; value: number }[];
    subfunctionDD: { label: string; value: number }[];
    reportTypeDD: { label: string; value: number }[];
    openApplicationOrReport: (
        id: string,
        toolName: string,
        toolType: string,
        description?: string,
    ) => void;
    totalFavouriteCount: number;
}

const AppReportGrid: React.FC<AppReportGridProps> = ({
    selectedCategory,
    setSelectedCategory,
    handleCategoryChange,
    handleSearchChange,
    isFavoriteClicked,
    handleFavoriteButtonToggle,
    setIsFilterFlyoutOpen,
    setIsResetButtonClicked,
    loading,
    totalItems,
    paginatedData,
    handleFavoriteToggle,
    currentPage,
    handlePageChange,
    handlePageSizeChange,
    pageSize,
    noFavoritesFound,
    noRecordsFound,
    filters,
    setNewFilters,
    onReset,
    filterRenderKey,
    regionDD,
    functionDD,
    subfunctionDD,
    reportTypeDD,
    openApplicationOrReport,
    totalFavouriteCount,
}) => {
    const { t } = useTranslation('digital-tools-library', { useSuspense: false });
    const isLoading = useSelector((state: RootState) => state.appReportsCardsData.loading);

    const getHeartTooltip = (item: AppReport) =>
        totalFavouriteCount >= 5 && !item.isFavourite ? t('favouritesLimitReached') : '';

    return (
        <Flex vertical className={styles['main-container']} gap={24}>
            <Flex style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <SearchInput
                    menuButton={true}
                    menuButtonProps={{
                        onClick: column => {
                            setSelectedCategory(column.value), handlePageChange(1);
                        },
                        optionContainerClass: 'search-input-options-container',
                        options: [
                            { label: 'App', value: 'App' },
                            { label: 'Report', value: 'Report' },
                        ],
                        text: selectedCategory,
                    }}
                    onChange={value => {
                        const searchValue = (Array.isArray(value) ? value[0] : value) ?? '';
                        if (searchValue === 'App' || searchValue === 'Report') {
                            handleCategoryChange(searchValue);
                        } else {
                            handleSearchChange(searchValue ?? '');
                        }
                    }}
                    placeholder={t('search')}
                    className={styles['searchInput']}
                />
                <div className={styles['favorite-filter-container']}>
                    <Button
                        icon={<HeartOutlined />}
                        type="default"
                        className={`${styles['favorites-button']} ${
                            isFavoriteClicked ? styles['favorites-button-selected'] : ''
                        }`}
                        onClick={handleFavoriteButtonToggle}
                    >
                        {t('favorites')}
                    </Button>
                    <IconButton
                        icon="filter-funnel-01"
                        onClick={() => {
                            setIsFilterFlyoutOpen(true);
                            setIsResetButtonClicked(false);
                        }}
                        size="Medium"
                    />
                </div>
            </Flex>
            <Flex className={styles['applied-filters-container']}>
                {filters?.some(f => f.selectedFilters.length > 0) && (
                    <AppliedFilters
                        key={filterRenderKey}
                        filters={filters}
                        setNewFilters={setNewFilters}
                        onReset={onReset}
                        existingFilters={filters}
                        defaultFilters={{
                            region: regionDD.map(f => ({ ...f, value: String(f.value) })),
                            function: functionDD.map(f => ({ ...f, value: String(f.value) })),
                            subFunction: subfunctionDD.map(f => ({ ...f, value: String(f.value) })),
                            reportType: reportTypeDD.map(f => ({ ...f, value: String(f.value) })),
                        }}
                    />
                )}
            </Flex>

            {loading || isLoading ? (
                <Flex align="center" justify="center" style={{ height: '584px' }}>
                    <AnimatedLoaders id="page-loader" type="page" />
                </Flex>
            ) : (
                <>
                    <div className={styles[totalItems > 0 ? 'card-grid' : 'empty-grid']}>
                        {totalItems === 0
                            ? isFavoriteClicked
                                ? noFavoritesFound()
                                : noRecordsFound()
                            : paginatedData?.map(item => (
                                  <AppReportCard
                                      additionalDescription={
                                          <div>
                                              <div>Owner: {item.objectOwner ?? 'Unknown'}</div>
                                              <div>
                                                  <a
                                                      href={item.documentationLink ?? '#'}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                  >
                                                      Documentation & Access
                                                  </a>
                                              </div>
                                          </div>
                                      }
                                      defaultIcon="heart"
                                      tooltip={getHeartTooltip(item)}
                                      defaultIconColor={
                                          item.isFavourite ? 'secondary-coral-color' : 'black-color'
                                      }
                                      selectedIcon="heart"
                                      selectedIconColor={
                                          item.isFavourite ? 'secondary-coral-color' : 'black-color'
                                      }
                                      showIconOnHover={false}
                                      size="Large"
                                      title={item.objectName ?? 'Untitled'}
                                      description={
                                          <div
                                              style={{
                                                  cursor: 'pointer',
                                                  fontWeight: '400',
                                                  color: '#575757',
                                              }}
                                          >
                                              {item.description ?? ''}
                                          </div>
                                      }
                                      className={styles['cards']}
                                      fillColor={item.isFavourite}
                                      onRightIconClick={() =>
                                          handleFavoriteToggle(item, selectedCategory)
                                      }
                                      type={'App'}
                                      onCardClick={() =>
                                          openApplicationOrReport(
                                              item.objectId,
                                              item.objectName,
                                              item.objectType,
                                              item.description,
                                          )
                                      }
                                  />
                              ))}
                    </div>
                    {totalItems > 5 && (
                        <Pagination
                            additionalInfo={`${t('availableAppsReports')} ${totalItems}`}
                            currentPage={currentPage}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                            pageSize={Math.max(5, Math.min(pageSize, totalItems))}
                            totalItems={totalItems}
                        />
                    )}
                </>
            )}
        </Flex>
    );
};

export default AppReportGrid;
