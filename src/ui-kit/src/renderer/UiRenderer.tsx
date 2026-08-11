import { useCallback } from "react";
import { getUiLibraryAdapter } from "../adapter";
import type { UiComponentNode, UiLibraryProvider } from "../types";
import { UiNode } from "./UiNode";

export type UiRendererProps = {
  nodes: UiComponentNode[];
  provider?: UiLibraryProvider;
  onAction?: (payload: Record<string, unknown>) => void;
};

export function UiRenderer({ nodes, provider, onAction }: UiRendererProps) {
  const adapter = getUiLibraryAdapter(provider);
  const renderNode = useCallback(
    (node: UiComponentNode) => (
      <UiNode key={`${node.componentId}-${node.type}`} node={node} adapter={adapter} onAction={onAction} />
    ),
    [adapter, onAction]
  );
  return <>{nodes.map((n) => renderNode(n))}</>;
}
