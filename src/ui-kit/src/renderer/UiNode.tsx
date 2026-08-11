import { Box, Typography } from "@mui/material";
import type { UiLibraryAdapter } from "../adapter/types";
import type { UiComponentNode } from "../types";

type Props = Readonly<{
  node: UiComponentNode;
  adapter: UiLibraryAdapter;
  onAction?: (payload: Record<string, unknown>) => void;
}>;

export function UiNode({ node, adapter, onAction }: Props) {
  const Renderer = adapter.getRenderer(node.type);
  if (!Renderer) {
    return (
      <Box mb={2} p={2} sx={{ bgcolor: "grey.100", borderRadius: 1, fontSize: "0.75rem" }}>
        <Typography sx={{ color: "text.secondary" }}>Unknown component type: {node.type}</Typography>
      </Box>
    );
  }

  const renderChild = (child: UiComponentNode) => (
    <UiNode key={`${child.componentId}-${child.type}`}  node={child} adapter={adapter} onAction={onAction} />
  );

  return <Renderer node={node} renderChild={renderChild} onAction={onAction} />;
}
