import type { PermissionMatrixRow } from './PermissionMatrixTable';

/**
 * A permission cell is selectable only when the persona has an explicit
 * boolean access flag. `null` / `undefined` mean the permission is not
 * applicable for that persona (rendered as an "X") and must never become
 * selectable — not by a direct click, not through a parent/bulk selection.
 */
export const isPersonaPermissionSelectable = (value: boolean | null | undefined): boolean =>
    typeof value === 'boolean';

/**
 * Applies a permission toggle to the matrix rows.
 *
 * @param rowKey row key to update, or `'ALL'` for the parent/persona-selector checkbox
 *
 * Restricted rows (X) are returned untouched, so persona-level restrictions
 * are preserved for both single and bulk selection.
 */
export const applyPersonaPermissionToggleToRows = (
    rows: PermissionMatrixRow[],
    rowKey: string | number,
    personaId: string,
    checked: boolean,
): PermissionMatrixRow[] =>
    rows.map(row => {
        if (row.isPersonaSelectorRow) return row;
        if (rowKey !== 'ALL' && row.key !== rowKey) return row;

        if (!isPersonaPermissionSelectable(row.personaAccess?.[personaId])) return row;

        return {
            ...row,
            personaAccess: {
                ...row.personaAccess,
                [personaId]: checked,
            },
        };
    });
