import { logError } from './helpers';

export function safeParse<T = any>(maybeJson: unknown, context = 'unknown'): T | null {
    if (typeof maybeJson !== 'string') return null;
    const s = maybeJson.trim();
    if (!s || s.toLowerCase() === 'null') return null;

    try {
        return JSON.parse(s) as T;
    } catch (e) {
        // keeping this log , so if it’s the one that will tell us if the server sent HTML
        logError(`[safeParse] invalid JSON in ${context}`, { snippet: s.slice(0, 300) }, e);
        return null;
    }
}
