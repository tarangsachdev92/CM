import React, { useState, useRef, useEffect } from 'react';
import { FiscalCalendar, IconButton as KonnectButton } from 'konnect-react-components';
import dayjs from 'dayjs';


interface BtnProps {
    onClick: () => void;
}

interface ConfirmationProps {
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
    apply: BtnProps;
    cancel: BtnProps;
}

interface CalendarProps {
    id?: string;
    className?: string;
    style?: any;
    showPicker: boolean;
    setShowPicker: React.Dispatch<React.SetStateAction<boolean>>;
    parentRef: React.MutableRefObject<null>; 
    currentDate: Date;
    onDateSelect?: (date: string,fiscalValue?:string) => void;
    confirmSelection: ConfirmationProps; 
    paddingToPreventOverflow?: number;
    useReactPortal?: boolean;
    showDay?: boolean;
    disablePastOrFutureDate?: {
        pastDate?: Date;
        futureDate?: Date;
    };
    disableFiscalToggle:boolean;
    enableFiscalToggle:boolean;
    hideFiscalToggle:boolean
}

interface TriggerFrequencyCalendarProps {
    onDateSelect: (date: string,fiscalValue:string) => void;
}

const TriggerFrequencyCalendar: React.FC<TriggerFrequencyCalendarProps> = ({ onDateSelect }) => {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [, setSelectedDate] = useState('');
    const parentRef = useRef(null);

    const closeCalendarAfterDateSelect = (date: string,fiscalDate:string) => {        
        const formattedDate = dayjs(date).startOf('day').format('YYYY-MM-DD');
        const dayOfWeek = dayjs(formattedDate).day();                
        // Check if the selected date falls on a weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
           return; // Do not close the calendar
        }

        setSelectedDate(formattedDate);
        setCalendarOpen(false);
        onDateSelect(formattedDate,fiscalDate??''); 
    };

    useEffect(() => {
        setProps(prevProps => ({
            ...prevProps,            
            showPicker: calendarOpen,
            currentDate: new Date(),
            
        }));
    }, [calendarOpen]);

    const [props, setProps] = useState<CalendarProps>({
        showPicker: calendarOpen,
        setShowPicker: setCalendarOpen,
        className: 'trigger-frequency-calendar',
        id: 'ak',
        parentRef: parentRef,
        showDay: true,
        disablePastOrFutureDate: {
            pastDate: new Date(), // Disable all past dates
        },
        style: { zIndex: 1000, top: '35%' },
        currentDate: new Date(),
        onDateSelect: (date, fiscalValue) => {
            closeCalendarAfterDateSelect(date, fiscalValue ?? '');
        },
        paddingToPreventOverflow: 20,
        useReactPortal: true,
        confirmSelection: {
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            onConfirm: () => {},
            onCancel: () => {},
            apply: { onClick: () => {} },
            cancel: { onClick: () => {} },
        },    
        disableFiscalToggle:true  ,
        enableFiscalToggle: true ,
        hideFiscalToggle:true
    });    

    const btnClickHandler = () => {
        setCalendarOpen(!calendarOpen);
    };

    return (
        <div className="right-top-calendar" style={{ width: 'fit-content' }}>
            <div className="content-calendar-body">
                <div ref={parentRef} className="button-calendar">
                    <KonnectButton
                        icon="calendar"
                        onClick={btnClickHandler} 
                        size="Small"
                    />
                </div>
                <FiscalCalendar {...props} />
            </div>
        </div>
    );
};

export default TriggerFrequencyCalendar;