import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
    FORMAT_LAST_REFRESHED_DATE,
    FORMAT_LAST_REFRESHED_DATE_TODAY,
} from './constants';
import {
    formatLastRefreshedDate,
    formatLastRefreshedDateWithToday,
} from './helpers';

dayjs.extend(utc);

describe('last refreshed date helpers', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-01-15T10:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('formats using the standard last refreshed format', () => {
        const input = '2026-01-15T10:20:30Z';
        const expected = dayjs.utc(input).local().format(FORMAT_LAST_REFRESHED_DATE);

        expect(formatLastRefreshedDate(input)).toBe(expected);
    });

    it('uses Today format when the input is in the current UTC day', () => {
        const input = dayjs.utc().toISOString();
        const expected = dayjs.utc(input).local().format(FORMAT_LAST_REFRESHED_DATE_TODAY);

        expect(formatLastRefreshedDateWithToday(input)).toBe(expected);
    });

    it('uses standard format when the input is not in the current UTC day', () => {
        const input = dayjs.utc().subtract(2, 'day').toISOString();
        const expected = dayjs.utc(input).local().format(FORMAT_LAST_REFRESHED_DATE);

        expect(formatLastRefreshedDateWithToday(input)).toBe(expected);
    });
});
