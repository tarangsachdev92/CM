import {
  Box,
  List,
  ListItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  type BoxProps,
} from "@mui/material";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  ol: ({ children }) => (
    <List component="ol" sx={{ listStyleType: "decimal", pl: 6, my: 0.5 }}>
      {children}
    </List>
  ),
  ul: ({ children }) => (
    <List component="ul" sx={{ listStyleType: "disc", pl: 6, my: 0.5 }}>
      {children}
    </List>
  ),
  li: ({ children }) => <ListItem sx={{ display: "list-item", py: 0, px: 0 }}>{children}</ListItem>,
  p: ({ children }) => (
    <Typography component="p" variant="body2" sx={{ mb: 1 }}>
      {children}
    </Typography>
  ),
  h2: ({ children }) => (
    <Typography component="h2" variant="h6" sx={{ fontWeight: 600, mt: 1.5, mb: 0.5 }}>
      {children}
    </Typography>
  ),
  h3: ({ children }) => (
    <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600, mt: 1.5, mb: 0.5 }}>
      {children}
    </Typography>
  ),
  h4: ({ children }) => (
    <Typography component="h4" variant="subtitle2" sx={{ fontWeight: 600, mt: 1, mb: 0.5 }}>
      {children}
    </Typography>
  ),
  strong: ({ children }) => (
    <Box component="strong" sx={{ fontWeight: 600 }}>
      {children}
    </Box>
  ),
  table: ({ children }) => (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, borderRadius: 1, overflowX: "auto" }}>
      <Table size="small">{children}</Table>
    </TableContainer>
  ),
  thead: ({ children }) => (
    <TableHead sx={{ backgroundColor: "action.hover" }}>{children}</TableHead>
  ),
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow hover>{children}</TableRow>,
  th: ({ children }) => (
    <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" }}>
      {children}
    </TableCell>
  ),
  td: ({ children }) => (
    <TableCell sx={{ fontSize: "0.8125rem" }}>{children}</TableCell>
  ),
};

type MarkdownContentProps = {
  content: string;
  className?: string;
} & Omit<BoxProps, "children">;

export function MarkdownContent({ content, className, ...boxProps }: MarkdownContentProps) {
  return (
    <Box className={className ?? "markdown-body"} sx={{ fontSize: "0.875rem" }} {...boxProps}>
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </Box>
  );
}