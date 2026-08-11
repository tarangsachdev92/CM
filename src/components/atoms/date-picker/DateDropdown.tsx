import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Icon } from 'konnect-react-components';
import dayjs from 'dayjs';
import styles from './DateDropdown.module.scss';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

export type DateDropdownClasses = {
    root?: string;
    button?: string;
    text?: string;
    icon?: string;
    popover?: string;
};

type DateDropdownProps = {
    id?: string;
    value?: Date | null; // single date picker value
    onChange?: (date: Date | null) => void;
    placeholder?: string;
    format?: string; // display format
    disabled?: boolean;
    minDate?: Date; // (not in interface; we won’t pass)
    maxDate?: Date; // (not in interface; we won’t pass)
    classes?: DateDropdownClasses;
    isDateDisabled?: (date: Date) => boolean; // keep calendar open if returns true
    /** if you plan to use range in future */
    enableRangeSelection?: boolean;
    /** Block dates earlier than today (00:00 local). Default: true */
};

const DateDropdown: React.FC<DateDropdownProps> = ({
    id,
    value = null,
    onChange,
    placeholder = 'Select date',
    //format = CALANDER_DATE_FORMAT ?? 'DD-MMM-YYYY',
    disabled = false,
    classes,
    isDateDisabled,
    minDate,
    enableRangeSelection = false,
}) => {
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Controlled-visible state for Calendar (required by the library)
    const [open, setOpen] = useState(false);

    // Internal selected value mirrors prop
    const [internal, setInternal] = useState<Date | null>(value);
    // replace the existing effect that only setInternal(value)
    useEffect(() => {
        setInternal(value ?? null);
        setDisplayDate(value ?? null);
    }, [value]);

    const [displayDate, setDisplayDate] = useState<Date | null>(null);
    const [, setApiDate] = useState<string | null>(null);

    // Close when clicking outside (extra safety; Calendar also gets setShowPicker)
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    dayjs.extend(customParseFormat);
    // (Optional)
    dayjs.extend(utc);
    dayjs.extend(timezone);

    // Commit a selected date (Calendar provides string)
    const commitStringDate = (dateStr: string) => {
        // store this EXACT value for API usage
        setApiDate(dateStr);

        // parse for display only
        const parsed = dayjs(dateStr);
        if (!parsed.isValid()) return;

        const jsDate = parsed.toDate();

        // Validate (weekends etc.)
        if (isDateDisabled?.(jsDate)) return;
        // Block past dates (keep calendar open for another try)

        // store parsed date for showing in UI
        setDisplayDate(jsDate);

        // close calendar
        setOpen(false);
        onChange?.(jsDate);
    };

    const displayText = displayDate
        ? dayjs(displayDate).format('DD MMM YYYY') // e.g., "29 Jan 2026"
        : placeholder;

    // near the top of the component:
    const FUTURE_MAX = new Date(9999, 11, 31); // 31-Dec-9999 (months are 0-based)

    /** Build a valid disableBeyondRange when we only have a minimum bound */
    function buildRangeFromMin(min?: Date) {
        if (!min) return undefined; // do not pass the prop at all
        const from = new Date(min);
        from.setHours(0, 0, 0, 0); // normalize to start-of-day
        return { fromDate: from, toDate: FUTURE_MAX }; // both required -> no undefineds
    }
    const rangeForCalendar = buildRangeFromMin(minDate);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return (
        <div className={`${styles.root} ${classes?.root ?? ''}`} ref={wrapperRef}>
            <button
                id={id}
                type="button"
                className={`${styles.button} ${disabled ? styles.disabled : ''} ${classes?.button ?? ''}`}
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => setOpen(prev => !prev)}
            >
                <span className={`${styles.text} ${classes?.text ?? ''}`}>{displayText}</span>
                <Icon
                    name="calendar"
                    size={'xl'}
                    color="neutrals-B100"
                    aria-label="Open calendar"
                />
            </button>

            {/* Render Calendar only when we have an anchor ref (prevents 'reading current' crash) */}
            {open && wrapperRef.current && (
                <div
                    className={`${styles.popover} ${classes?.popover ?? ''}`}
                    role="dialog"
                    aria-label="Date picker"
                >
                    <Calendar
                        /* 🔑 Controlled open/close as per your interface */
                        showPicker={open}
                        setShowPicker={setOpen}
                        parentRef={wrapperRef}
                        calendarType="single-picker"
                        currentDate={internal ?? new Date()}
                        onDateSelect={commitStringDate}
                        enableRangeSelection={enableRangeSelection}
                        showDay
                        showMonth
                        showYear
                        useReactPortal={false}
                        paddingToPreventOverflow={8}
                        disablePastOrFutureDate={{ pastDate: todayStart }}
                        {...(rangeForCalendar ? { disableBeyondRange: rangeForCalendar } : {})}
                    />
                </div>
            )}
        </div>
    );
};

export default DateDropdown;
