import { Box, List, ListItem, Typography, type BoxProps } from "@mui/material";
import ReactMarkdown, { type Components } from "react-markdown";

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
  p: ({ children, node }) => {
    const inList = (node as any)?.parent?.type === "listItem";
    if (inList) {
      return <Box component="span">{children}</Box>;
    }
    return (
      <Typography component="p" variant="body2">
        {children}
      </Typography>
    );
  },
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
};

type MarkdownContentProps = {
  content: string;
  className?: string;
} & Omit<BoxProps, "children">;

export function MarkdownContent({ content, className, ...boxProps }: MarkdownContentProps) {
  return (
    <Box className={className ?? "markdown-body"} sx={{ fontSize: "0.875rem" }} {...boxProps}>
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </Box>
  );
}

/** @deprecated Use MarkdownContent — kept for imports that only need sx hook. */
export const markdownSx = {};