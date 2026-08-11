import type { PermissionMatrixRow } from './PermissionMatrixTable';
import {
    applyPersonaPermissionToggleToRows,
    isPersonaPermissionSelectable,
} from './permissionMatrixUtils';

describe('permissionMatrixUtils', () => {
    describe('isPersonaPermissionSelectable', () => {
        it('returns true only for boolean values', () => {
            expect(isPersonaPermissionSelectable(true)).toBe(true);
            expect(isPersonaPermissionSelectable(false)).toBe(true);
            expect(isPersonaPermissionSelectable(null)).toBe(false);
            expect(isPersonaPermissionSelectable(undefined as unknown as boolean | null)).toBe(false);
        });
    });

    describe('applyPersonaPermissionToggleToRows', () => {
        const baseRows: PermissionMatrixRow[] = [
            {
                key: 'persona-selector-row',
                isPersonaSelectorRow: true,
                personaAccess: { p1: false },
            },
            {
                key: 'm1-s1-p1',
                personaAccess: { p1: true },
            },
            {
                key: 'm1-s1-p2',
                personaAccess: { p1: false },
            },
            {
                key: 'm1-s1-p3',
                personaAccess: { p1: null },
            },
            {
                key: 'm1-s1-p4',
                personaAccess: {} as any,
            },
        ];

        it('toggles only eligible rows for ALL selection', () => {
            const updated = applyPersonaPermissionToggleToRows(baseRows, 'ALL', 'p1', true);

            expect(updated[0].personaAccess.p1).toBe(false);
            expect(updated[1].personaAccess.p1).toBe(true);
            expect(updated[2].personaAccess.p1).toBe(true);
            expect(updated[3].personaAccess.p1).toBe(null);
            expect(updated[4].personaAccess.p1).toBeUndefined();
        });

        it('toggles only eligible rows for single row selection', () => {
            const updatedAllowed = applyPersonaPermissionToggleToRows(baseRows, 'm1-s1-p1', 'p1', false);
            expect(updatedAllowed[1].personaAccess.p1).toBe(false);

            const updatedRestricted = applyPersonaPermissionToggleToRows(
                baseRows,
                'm1-s1-p3',
                'p1',
                true,
            );
            expect(updatedRestricted[3].personaAccess.p1).toBe(null);

            const updatedMissing = applyPersonaPermissionToggleToRows(baseRows, 'm1-s1-p4', 'p1', true);
            expect(updatedMissing[4].personaAccess.p1).toBeUndefined();
        });
    });
});
