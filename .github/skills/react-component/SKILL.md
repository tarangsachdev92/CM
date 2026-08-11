---
name: react-component
description: Create or modify a React component in Command Center Web — correct atoms/molecules/organisms/screens layer, SCSS module, barrel export, design system, i18n, loading and empty states. Use when adding a component, flyout, table, card, widget or screen.
argument-hint: <ComponentName> [atom|molecule|organism|screen]
---

# Building a component

## 1. Layer

| Layer | Test | Path |
|---|---|---|
| **atom** | No store, no API, no business logic. Pure props → JSX. | `components/atoms/<kebab>/` |
| **molecule** | Composes atoms + design system. Local UI state ok. Feature-agnostic. | `components/molecules/<kebab>/` |
| **organism** | Feature-specific; connects to the store, dispatches thunks. | `components/organisms/<kebab>/` |
| **screen** | Route target. Thin — layout + organisms, under ~150 lines. | `screens/<feature>/<Name>Screen.tsx` |

Lowest layer that works. Needs `useSelector` → organism. Folder `kebab-case`, file and export
`PascalCase`. (Strays like `data-Table` exist; use kebab-case for new work.)

## 2. Files

```
components/organisms/persona-mapping-table/
├── PersonaMappingTable.tsx
├── PersonaMappingTable.module.scss
└── PersonaMappingTable.test.tsx      → unit-tests skill
```

## 3. Component

```tsx
import { useEffect, useMemo } from 'react';
import { Flex } from 'antd';
import { Table, AnimatedLoaders } from 'konnect-react-components';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import styles from './PersonaMappingTable.module.scss';
import { EmptyStateOfComponent, Label } from '../../atoms';
import { RootState, AppDispatch, fetchForumPersonaMappings } from '../../../store';

interface PersonaMappingTableProps {
    forumId: number;
    onRowSelect?: (personaId: number) => void;
}

const PersonaMappingTable = ({ forumId, onRowSelect }: PersonaMappingTableProps) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const { data, loading, error } = useSelector((s: RootState) => s.forumPersonaMappings);

    useEffect(() => {
        dispatch(fetchForumPersonaMappings({ forumId }));
    }, [dispatch, forumId]);

    const rows = useMemo(() => data.map(/* … */), [data]);

    if (loading) return <AnimatedLoaders />;
    if (error) return <EmptyStateOfComponent emptyStateTitle={error} />;
    if (!rows.length) return <EmptyStateOfComponent emptyStateTitle={t('persona.empty')} />;

    return (
        <Flex vertical className={styles.container}>
            <Label>{t('persona.title')}</Label>
            <Table data={rows} onRowClick={onRowSelect} />
        </Flex>
    );
};

export default PersonaMappingTable;
```

**Default export** (barrels and `React.lazy` expect it). Props typed with an interface —
nothing in `eslint.config.js` enforces this, do it anyway. Always render loading / error /
empty; happy-path-only gets rejected in review. `useMemo`/`useCallback` for derived lists and
handlers passed into design-system tables.

## 4. Design system first

`konnect-react-components` exports **117** components — check before building anything.
Common picks and the aliasing traps: [design-system.md](./design-system.md).
Full list: `node_modules/konnect-react-components/dist/index.d.ts`.

## 5. Styling

```scss
@import '../../../assets/css/colors.scss';
@import '../../../assets/css/sizes.scss';

.container { gap: 12px; padding: 16px; background: $white; }
```

Tokens, not hex. Third-party overrides go in the existing `ant-select-overrides.scss` /
`quill-overrides.scss`, never in a module file.

## 6. Barrel, i18n, routing

Atoms/molecules re-export from the folder's `index.ts` (import-then-export style). Organisms
have one too — check whether the area uses it.

Strings via `t('key')`, added to **all four** locales in `public/locales/`. Namespaces in use:
`user-home-translation`, `performance-mangment-translation` (typo is the real filename — don't
"fix" it), `digital-tools-library`. New namespace → create the JSON in every locale dir.
Only ~13 components are translated today; translate what you add, don't migrate neighbours.

Screens: register in `src/Router.tsx`, wrap in `ProtectedRoute` (gates on
`rolePermissions.isAdmin`) if admin-only. Federated remotes use the existing lazy pattern.

Verify: `npm run lint && npm run build-dev`.
