import { FiscalCalendar, Icon } from "konnect-react-components";
import { useRef, useState } from "react";
import styles from './EditMenuFiscalCalendar.module.css';

type EditMenuFiscalCalendarProps = {
  onSaveDate: (dateObj: any) => void, 
  selectedDateProp: string,
  dateRangeStart?: any
}

export const EditMenuFiscalCalendar: React.FC<EditMenuFiscalCalendarProps> = ({onSaveDate, selectedDateProp, dateRangeStart = null}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const parentRef = useRef<HTMLButtonElement>(null);

  const handleDateChange = (dateObj: any) => {
    setCalendarOpen(false);
    onSaveDate(dateObj)
  };

  return <div>
    <button
      ref={parentRef}
      type="reset"
      className={styles.calendarButton}
      // aria-expanded={open}
      onClick={() => setCalendarOpen(prev => !prev)}
    >
      <span className={selectedDateProp ? styles.subTextActive : styles.subText}>
        {selectedDateProp || 'Select Month'}
      </span>
      <Icon
        name="calendar"
        size={'m'}
        color="neutrals-B100"
        aria-label="Open calendar"
      />
    </button>
    <FiscalCalendar
      dateRangeStart={dateRangeStart}
      showPicker={calendarOpen}
      setShowPicker={setCalendarOpen}
      style={{
        position: 'fixed',
        marginTop: '3%',
        marginLeft: '75%',
        marginRight: '10%',
        transform: 'translateX(-40%)',
        zIndex: 9999,
      }}
      className={styles['calendar-container']}
      disableExtendedCalendarDefaults={true}
      parentRef={parentRef}
      calendarType="extended-picker"
      currentDate={new Date()}
      showDay={false}
      showMonth={true}
      showQuarter={false}
      showYear={true}
      showWeek={false}
      showShifts={false}
      defaultView={"month"}
      enableDefautSelection={true}
      enableFiscalToggle={false}
      disableButton={false}
      confirmSelection={{
        apply: {
          variant: 'Primary',
          disabled: false,
          size: 'M',
          text: 'Apply',
          onClick: (date: any) => {
            handleDateChange(date);
          },
        },
        cancel: {
          variant: 'Primary',
          disabled: false,
          size: 'M',
          text: 'Cancel',
          onClick: () => {
            setCalendarOpen(false);
          },
        },
      }}
    />
  </div>;
}