import { createUIAdapter } from "./material/registry";
import { createCommandCenterAdapter } from "./command-center/registry";
import type { UiLibraryAdapter } from "./types";
import type { UiLibraryProvider } from "../types";

const factories: Record<UiLibraryProvider, () => UiLibraryAdapter> = {
  "material-ui": createUIAdapter,
  "command-center-ui": createCommandCenterAdapter,
};

let activeProvider: UiLibraryProvider = "material-ui";

export function setUiLibraryProvider(provider: UiLibraryProvider): void {
  activeProvider = provider;
}

export function getUiLibraryProvider(): UiLibraryProvider {
  return activeProvider;
}

export function getUiLibraryAdapter(provider?: UiLibraryProvider): UiLibraryAdapter {
  const key = provider ?? activeProvider;
  return factories[key]();
}

export type { UiLibraryAdapter, NodeRenderer, NodeRendererProps } from "./types";
