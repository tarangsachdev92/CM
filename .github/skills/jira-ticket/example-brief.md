# Worked example — KBHH-4267

```
TICKET   KBHH-4267 — QA - Admin Console - Tool Management : Add New Tool - Tool Persona -2
TYPE     Story   STATUS In Progress   POINTS 1   EPIC Admin Console - Tool Management
BLOCKED BY  KBHH-6114 (delete persona not working) — confirm status before starting
PRIOR ART   clones KBHH-3202; delete flow specified in KBHH-3203; tested by KBHH-6021
GOAL     An admin can see each saved tool persona as a card and edit or delete it.

ACCEPTANCE CRITERIA
  1. Each saved persona displays as a card with: Persona Name, Persona Description,
     AD Group, Data Access, Roles Count ("Roles: 2").
  2. Card actions: Edit (pencil) re-opens the Tool Persona dialog pre-filled;
     Delete (trash) triggers a confirmation.
  3. Cards in a responsive grid/list inside the "Tool Persona's" collapsible section.
  4. If Tool Type == "Performance Management", hide the Roles chip/count on the card.
  5. For Application / Report / Analytics, the role count stays visible.

SCOPE IN CODE
  src/components/molecules/tool-persona-edit-card/ToolPersonaEditCard.tsx   — the card
  src/components/molecules/tool-persona-flyout/ToolPersonaPermissionFlyout.tsx — edit dialog
  src/screens/tool-management/edit-tool/AccessAndPermissions.tsx — collapsible section
  src/services/tool.ts — persona read/delete

DATA / API
  Persona list + delete via services/tool.ts (confirm exact endpoints)

OPEN QUESTIONS
  - AC 4 keys off "Select Tool Type" — persisted tool type, or the current form value
    while adding a new tool?
  - Delete confirmation behaviour lives in KBHH-3203, not here. Still current?
```

What this does right: AC quoted verbatim from `customfield_10236` (the description held only
*"As an Admin, I want to view and manage my created personas in a card format"* — useless as
a spec); every path verified to exist; the open blocker surfaced before any planning; and the
two real ambiguities raised as questions instead of guessed at.
