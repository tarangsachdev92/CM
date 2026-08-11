import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Table as MUITable
} from "@mui/material";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiCards, Table } from 'konnect-react-components';
import { useState } from "react";
import type { NodeRenderer, NodeRendererProps, UiLibraryAdapter, KpiCardData } from "../types";
import { MarkdownContent } from "../../markdown/MarkdownContent";
import { UiComponentNode } from "../../types";

function asString(v: unknown, fallback = ""): string {
  return v == null ? fallback : String(v);
}

function TextNode({ node }: NodeRendererProps) {
  const variant = asString(node.props.variant, "body");
  const content = asString(node.props.content);
  if (variant === "heading") {
    return (
      <Typography variant="h6">
        {content}
      </Typography>
    );
  }
  if (variant === "caption") {
    return (
      <Typography variant="body2" color="text.secondary">
        {content}
      </Typography>
    );
  }
  return <Typography variant="body2">{content}</Typography>;
}


function MarkdownNode({ node }: NodeRendererProps) {
  return <MarkdownContent content={asString(node.props.content)} />;
}

function AlertNode({ node }: NodeRendererProps) {
  const severity = asString(node.props.severity, "info");
  const color = (["info", "warning", "error", "success"].includes(severity)
    ? severity
    : "info") as "info" | "warning" | "error" | "success";
  return (
    <Alert severity={color} sx={{ mb: 2, borderRadius: 1 }}>
      <Box>
        {node.props.title ? <AlertTitle>{asString(node.props.title)}</AlertTitle> : null}
        {asString(node.props.message)}
      </Box>
    </Alert>
  );
}

function ButtonNode({ node, onAction }: NodeRendererProps) {
  const variant = node.props.variant === "secondary" ? "outlined" : "contained";
  return (
    <Button
      size="small"
      variant={variant}
      color="primary"
      sx={{ mb: 1, mr: 1 }}
      onClick={() => onAction?.((node.props.payload as Record<string, unknown>) || {})}
    >
      {asString(node.props.label, "Action")}
    </Button>
  );
}

function DropdownNode({ node }: NodeRendererProps) {
  const options = (node.props.options as Array<{ value?: string; label?: string } | string>) || [];
  return (
    <Box sx={{ mb: 2 }}>
      {node.props.label ? (
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
          {asString(node.props.label)}
        </Typography>
      ) : null}
      <FormControl size="small" fullWidth>
        <Select value={asString(node.props.value)} displayEmpty>
          {options.map((opt, i) => {
            const value = typeof opt === "string" ? opt : asString(opt.value ?? opt.label);
            const label = typeof opt === "string" ? opt : asString(opt.label ?? opt.value);
            return (
              <MenuItem key={i} value={value}>
                {label}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}

function TextboxNode({ node }: NodeRendererProps) {
  return (
    <Box sx={{ mb: 2 }}>
      {node.props.label ? (
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
          {asString(node.props.label)}
        </Typography>
      ) : null}
      <TextField
        size="small"
        fullWidth
        placeholder={asString(node.props.placeholder)}
        defaultValue={asString(node.props.value)}
      />
    </Box>
  );
}

type ColDef = { key: string; label?: string };
type RowDef = Record<string, unknown>;

function TableNode({ node }: NodeRendererProps) {
  const columnsData = (node.props.columns as ColDef[]) || [];
  const columns = columnsData.map((c) => ({ key: c.key, dataIndex: c.key, title: c.label || c.key, render: (value: unknown) => <div>{String(value)}</div> }));
  const rows = (node.props.rows as RowDef[]) || [];
  return (
    <Box sx={{ mb: 2, overflowX: "auto" }}>
      {node.props.title ? (
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          {asString(node.props.title)}
        </Typography>
      ) : null}
      <Table
        columns={columns}
        data={rows}
      />
    </Box>
  );
}

function ChartNode({ node }: NodeRendererProps) {
  const chartType = asString(node.props.chartType, "bar");
  const series = (node.props.series as Array<{ name: string; data: number[] }>) || [];
  const flat = series.flatMap((s) =>
    (s.data || []).map((value, i) => ({ name: `${s.name} ${i + 1}`, value, series: s.name }))
  );
  const lineData = series[0]?.data?.map((value, i) => ({ index: `P${i + 1}`, value })) || [];

  return (
    <Box sx={{ mb: 2 }}>
      {node.props.title ? (
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          {asString(node.props.title)}
        </Typography>
      ) : null}
      <ResponsiveContainer width="100%" height="85%">
        {chartType === "line" ? (
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#3182ce" strokeWidth={2} dot />
          </LineChart>
        ) : (
          <BarChart data={flat.slice(0, 12)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={10} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill="#3182ce" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
}

const getColorOfDeviation = (deviation: string | undefined): "green" | "black" | "yellow" | "red" | undefined => {
  if (!deviation) return "black";
  if (Number.parseFloat(deviation) > 95) return "green";
  if (Number.parseFloat(deviation) >= 90 && Number.parseFloat(deviation) <= 95) return "yellow";
  if (Number.parseFloat(deviation) < 90) return "red";
  return "black";
}

const getDeviation = (deviation: string | undefined): "increase" | "decrease" | undefined => {
  if (!deviation) return undefined;
   if (Number.parseFloat(deviation) >= 90) return "increase";
   if (Number.parseFloat(deviation) < 90) return "decrease";
  return undefined;
}

function KPICardNode({ node }: NodeRendererProps) {
  const chartType = asString(node.props.chartType, "bar") as 'area' | 'bar' | 'line';
  const series = (node.props.series as Array<KpiCardData>) || [];
  const metricData = series[0]?.data.map(item => {
    return {
      ...item,
      showInXAxis: true,
      forecast: false
    }
  })
  return (
    <Box sx={{ mb: 2 }}>
      <ResponsiveContainer width="100%" height={350}>
        <KpiCards
          data={{
            currentPeriodValue: series[0]?.currentPeriodValue || '',
            currentPeriodValueColor: getColorOfDeviation(series[0]?.greenWhen),
            date: series[0]?.date,
            deviation: getDeviation(series[0]?.greenWhen),
            deviationString: series[0]?.deviationString,
            deviationValueColor: getColorOfDeviation(series[0]?.greenWhen),
            kpi: asString(node.props.title),
            metricData: metricData ?? []
          }}
          graphHeight={'350px'}
          selectedPeriod={series[0]?.measurementPeriod || ''}
          selectedPeriodValue={series[0]?.measurementPeriodValue || ''}
          targetToshowOnCard={series[0]?.targetValue}
          chartType={chartType}
        />
      </ResponsiveContainer>
    </Box>
  );
}

const MUI_COLORS = ["#3182ce", "#38a169", "#e53e3e", "#d69e2e", "#805ad5", "#dd6b20"];

function KgResultsNode({ node }: NodeRendererProps) {
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  const question = asString(node.props.question);
  const cypher = asString(node.props.cypher);
  const rowCount = Number(node.props.row_count ?? 0);
  const durationMs = node.props.duration_ms != null ? Number(node.props.duration_ms) : null;
  const summary = asString(node.props.summary);
  const columns = (node.props.columns as ColDef[]) || [];
  const rows = (node.props.rows as RowDef[]) || [];

  // Auto-detect first numeric column for chart
  const numericCol = columns.find((c) =>
    rows.length > 0 &&
    rows.some((r) => r[c.key] !== "" && r[c.key] != null && !isNaN(Number(r[c.key])))
  );
  const labelCol = columns.find((c) => c !== numericCol);
  const chartData = numericCol
    ? rows.map((r, i) => ({
        name: labelCol ? asString(r[labelCol.key]).slice(0, 20) : `#${i + 1}`,
        value: Number(r[numericCol.key] ?? 0),
      }))
    : [];

  const downloadCSV = () => {
    const header = columns.map((c) => c.label || c.key).join(",");
    const dataLines = rows.map((r) =>
      columns.map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[header, ...dataLines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kg_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async () => {
    const XLSX = await import("xlsx");
    const wsData = rows.map((r) => {
      const row: Record<string, unknown> = {};
      columns.forEach((c) => {
        row[c.label || c.key] = r[c.key];
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "kg_results.xlsx");
  };

return (
  <Paper
    elevation={0}
    sx={{
      mb: 4,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      overflow: "hidden",
    }}
  >
    {/* Header */}
    <Box
      sx={{
        bgcolor: "primary.50",
        px: 2,
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "primary.100",
      }}
    >
      <Typography variant="subtitle2" color="primary.dark" gutterBottom>
        Graph Query Results
      </Typography>

      <Typography
        variant="caption"
        sx={{
          color: "primary.main",
          fontStyle: "italic",
        }}
      >
        "{question}"
      </Typography>
    </Box>

    <Box p={2}>
      {/* Summary stats */}
      <Stack direction="row" spacing={1} flexWrap="wrap" mb={3}>
        <Chip
          label={`${rowCount} Records`}
          color="success"
          size="small"
        />

        <Chip
          label={`${columns.length} Columns`}
          color="primary"
          size="small"
        />

        {durationMs != null && (
          <Chip
            label={`Query: ${durationMs}ms`}
            color="secondary"
            size="small"
          />
        )}
      </Stack>

      {summary && (
        <Typography variant="body2" color="text.secondary" mb={3}>
          {summary}
        </Typography>
      )}

      {/* Cypher path */}
      {cypher && (
        <Box mb={4}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 1,
              display: "block",
              mb: 1,
            }}
          >
            Query Path (Cypher)
          </Typography>

          <Box
            sx={{
              bgcolor: "#111827",
              color: "#86efac",
              p: 2,
              borderRadius: 1,
              fontSize: "0.75rem",
              fontFamily: "monospace",
              overflowX: "auto",
            }}
          >
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {cypher}
            </pre>
          </Box>
        </Box>
      )}

      {/* Interactive chart */}
      {numericCol && chartData.length > 0 && (
        <Box mb={4}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Chart · {numericCol.label || numericCol.key}
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant={chartType === "bar" ? "contained" : "outlined"}
                onClick={() => setChartType("bar")}
              >
                Bar
              </Button>

              <Button
                size="small"
                variant={chartType === "pie" ? "contained" : "outlined"}
                onClick={() => setChartType("pie")}
              >
                Pie
              </Button>
            </Stack>
          </Stack>

          <Box sx={{ height: 200, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "pie" ? (
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {chartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={MUI_COLORS[i % MUI_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1976d2" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Results table */}
      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Results
          </Typography>

          {rowCount > 10 && (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                color="success"
                onClick={downloadCSV}
              >
                ⬇ CSV
              </Button>

              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={downloadExcel}
              >
                ⬇ Excel
              </Button>
            </Stack>
          )}
        </Stack>

        {rows.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: "italic" }}
          >
            No results found.
          </Typography>
        ) : (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 1 }}
          >
            <MUITable size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "action.hover" }}>
                  {columns.map((c) => (
                    <TableCell
                      key={c.key}
                      sx={{ fontSize: "0.75rem", fontWeight: 600 }}
                    >
                      {c.label || c.key}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((row, ri) => (
                  <TableRow
                    key={ri}
                    hover
                    sx={{
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        {asString(row[c.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </MUITable>
          </TableContainer>
        )}
      </Box>
    </Box>
  </Paper>
);
}

function StackNode({ node, renderChild }: NodeRendererProps) {
  const gap = node.props.gap === "sm" ? 2 : node.props.gap === "lg" ? 6 : 4;
  const childNodes = node.children?.length
    ? node.children
    : ((node.props.children as UiComponentNode[]) || []);
  return (
    <Stack spacing={gap} sx={{ mb: 2, alignItems: "stretch" }}>
      {childNodes.map((child, i) => (
        <Box key={i}>{renderChild(child)}</Box>
      ))}
    </Stack>
  );
}

function CardNode({ node, renderChild }: NodeRendererProps) {
  const fromProps = (node.props.children as UiComponentNode[] | undefined) ?? [];
  const legacyPropsChildren = fromProps.filter((child) => child?.type);
  const childNodes = node.children?.length ? node.children : legacyPropsChildren;
  return (
    <Card sx={{ mb: 2 }}>
      {node.props.title ? (
        <CardHeader title={<Typography variant="subtitle2">{asString(node.props.title)}</Typography>} />
      ) : null}
      <CardContent>
        {childNodes.map((child, i) => (
          <Box key={i}>{renderChild(child)}</Box>
        ))}
      </CardContent>
    </Card>
  );
}

const UI_RENDERERS: Record<string, NodeRenderer> = {
  Text: TextNode,
  Markdown: MarkdownNode,
  Alert: AlertNode,
  Button: ButtonNode,
  Dropdown: DropdownNode,
  Textbox: TextboxNode,
  DataTable: TableNode,
  Chart: ChartNode,
  VerticalStack: StackNode,
  Card: CardNode,
  KPICard: KPICardNode,
  KgResults: KgResultsNode
};

export function createUIAdapter(): UiLibraryAdapter {
  return {
    provider: "material-ui",
    displayName: "Material UI (open-source stand-in for Command Center Storybook library)",
    getRenderer(type: string) {
      return UI_RENDERERS[type];
    },
  };
}
