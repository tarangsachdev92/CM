# konnect-react-components v1.7.29 — 117 exports

Authoritative list: `node_modules/konnect-react-components/dist/index.d.ts`.

| Need | Use |
|---|---|
| Table / grid | `Table`, `Pagination` |
| Dialog / panel | `Dialog`, `DeleteDialog`, `RenameDialog`, `Flyout`, `FloatingSidePanel` |
| Inputs | `InputField`, `TextArea`, `SelectBox`, `SelectBox2`, `DropDown`, `DropDown2`, `CheckBox`, `CheckList`, `Radio`, `Switch`, `SegmentedControl`, `DropdownWithCustomInput`, `CombinedDropdowns`, `DropdownSwitch` |
| Search & filter | `SearchInput`, `FilterChip`, `FilterChipDropDown`, `MultiFilterChipSelector`, `ActionChip`, `TagSelector` |
| Dates | `Calendar`, `DateRangePicker`, `FiscalCalendar`, `FiscalDatePicker` |
| Feedback | `Toast`, `FixedToast`, `CustomToast`, `Status`, `ProgressBar`, `UserRating` |
| Loading | `AnimatedLoaders`, `KpiCardSkeleton`, `AdvanceForcastingSkeleton` |
| Cards | `Card`, `KpiCards`, `HighlightCard`, `AppReportCard`, `ReadOnlyCard`, `SnapListCard`, `CommentCard`, `ResolutionCard`, `ExceptionsCards`, `InspectionDetailCard` |
| Charts | `BarChartComponent`, `LineChartComponent`, `AreaChartComponent`, `PieCharts`, `PieChartsWithNeedle`, `ConcentricPieChart`, `PieChartKpiCard`, `StackedBarChartComponent`, `HorizontalColumnChart`, `WaterFallBarChartComponent`, `TrendChart`, `TrendBarChart`, `MapChart`, `RootCauseChart`, `SnapShotChart`, `CustomScatterChart`, `ContinuousLineChart`, `LineRunningChart`, `LineChartWithTargetMarkers`, `MultiLineChartWithTargetMarkers`, `ColumnChartWithCustomizeHeader`, `ColumnChartWithOneLineShowingTarget`, `ColumnChartWithTwoLines`, `AggregatedChart`, `TimeSeriesAggregated`, `TimeSeriesDecomposition`, `DynamicHierarchicalBarChart`, `AdvanceForcastingBarChart`, `ChartTypeButton` |
| Nav & layout | `SideMenu`, `Tab`, `Breadcrumb`, `Accordion`, `AccordionGroup`, `Divider`, `Footer`, `MenuButton` |
| Chat / Kai | `ChatInterface`, `ChatInput`, `ChatMessage`, `ChatTabButton`, `ConversationList`, `ConversationView`, `ConversationCard`, `CommentBox` |
| Files | `FileUploader`, `CustomizedFileUploader` |
| Text editing | `TextEditor`, `AdvanceTextEditor` |
| Misc | `Icon` (+ `IconNames`), `IconButton`, `Button`, `AnimatedButton`, `Avatar`, `Counter`, `Tag`, `ToolTip`, `Summary`, `AutoInsightsPopup`, `InspectionList`, `Colors`, `Sizes` |

## Traps

- **`HierarchyColumnChart`** is an alias of `DynamicHierarchicalBarChart`.
- **`HashBarChart`** is an alias of a second internal `BarChartComponent`.
- Both **`ToolTip`** and **`Tooltip`** exist — the latter is exported as `ToolTip2`. Import
  the name the surrounding code already uses.
- `Colors` and `Sizes` are exported as **values** — prefer them over redefining tokens where
  a component takes them as props.
- `Test` is exported. It is not a component you want.
