/**
 * Command Center design system adapter (placeholder).
 *
 * When @command-center/ui (internal Storybook package) is available:
 * 1. Implement renderers using the same component `type` keys as ui_components.yaml
 * 2. Set UI_LIBRARY_PROVIDER=command-center-ui in orchestration + demo-ui
 * 3. Replace imports below with the internal package
 */
import { createUIAdapter } from "../material/registry";
import type { UiLibraryAdapter } from "../types";

/** Until internal package ships, delegate to Chakra with CC provider id for wiring tests. */
export function createCommandCenterAdapter(): UiLibraryAdapter {
  const base = createUIAdapter();
  return {
    ...base,
    provider: "command-center-ui",
    displayName: "Command Center UI (stub — swap createUIAdapter for @command-center/ui)",
  };
}
