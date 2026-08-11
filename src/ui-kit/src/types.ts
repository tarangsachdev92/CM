/** Mirrors orchestration API UiComponentNode contract. */
export interface UiComponentNode {
  componentId: string;
  type: string;
  props: Record<string, unknown>;
  children?: UiComponentNode[];
}

export interface SuggestedAction {
  type: string;
  label?: string;
  payload?: Record<string, unknown>;
}

export interface AssistantMessageUi {
  contentMarkdown?: string;
  ui?: UiComponentNode[];
  templateId?: string;
  suggestedActions?: SuggestedAction[];
}

export type UiLibraryProvider = "material-ui" | "command-center-ui";
