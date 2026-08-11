import { Dialog, InputField, Radio } from 'konnect-react-components';
import { useEffect, useMemo, useState } from 'react';
import Styles from './TriggerFrequency.module.scss';
import { Select } from 'antd';
import { NOTI_FREQ_CAT, NOTI_FREQ_DAYS } from '../../../../utils/constants';
import TriggerFrequencyCalendar from './TriggerFrequencyCalendar';
import dayjs from 'dayjs';
import { ITriggerFrequencyPayload } from '../../../../types/request';
import { ITriggerFrequency } from '../../../../types/response';

type triggerFrequency = {
    calendarType: string;
    triggerInterval: number | null;
    triggerCategory: string | null;
    weekDays: string[];
    starting: string | null;
    on:string|null
};

type ITriggerFrequencyProps={
    isOpen:boolean;
    handleClose:(state:boolean)=> void,
    saveTriggerFrequency:React.Dispatch<React.SetStateAction<ITriggerFrequencyPayload|null>>,
    existingTriggerFreq:ITriggerFrequency |null
}

function TriggerFrequency({ isOpen, handleClose,saveTriggerFrequency,existingTriggerFreq }: ITriggerFrequencyProps) {    
    const numberOptions = Array.from({ length: 99 }, (_, i) => i + 1).map(o => ({
        value: o,
        label: o,
    }));
     const getOrdinalLabel = (num: number): string => {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const v = num % 100;
        return `${num}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
    };

    const dateRangeOptions = Array.from({ length: 31 }, (_, i) => i + 1).map(o => ({
        value: o.toString(),
        label: getOrdinalLabel(o),
    }));

    const fiscalRangeOptions = Array.from({ length: 25 }, (_, i) => i + 1).map(o => ({
        value: 'C+'+o,
        label: 'C+'+o,
    }));

    const [triggerFreq, setTriggerFreq] = useState<triggerFrequency>({
        calendarType: 'StandardCalendar',
        triggerInterval: 1,
        triggerCategory: NOTI_FREQ_CAT.Shift,
        weekDays: [],
        starting: null,
        on: null,
    });

      const [triggerMessage, setTriggerMessage] = useState<string>('');
      const [selectedDate, setSelectedDate] = useState<string>(''); 
      const [selectedFiscalValue, setSelectedFiscalValue] = useState<string|null>(''); 
      const [isSaveDisabled,setIsSaveDisabled] = useState(true);

    useEffect(()=>{  
        if (existingTriggerFreq && isOpen) {              
            setTriggerFreq({
                calendarType: existingTriggerFreq.calendarType,
                triggerInterval: existingTriggerFreq.every,
                triggerCategory: existingTriggerFreq.frequencyType,
                weekDays:
                    existingTriggerFreq.selectedValues !== null &&
                    existingTriggerFreq.selectedValues !== ''
                        ? existingTriggerFreq.selectedValues?.split(',')
                        : [],
                starting: existingTriggerFreq.starting,
                on: existingTriggerFreq.on,
            });  
                        
            setSelectedDate(
                existingTriggerFreq.starting !== ''
                    ? dayjs(existingTriggerFreq?.starting).format('DD MMM YYYY')
                    : '',
            );
        }

        if(!isOpen){
            setSelectedDate('');
        }
        
    },[isOpen])
       

    
    
    const handleSaveFrequency = ()=>{     
        
        const parsedDate = selectedDate && selectedDate!==null && selectedDate!=='' && dayjs(selectedDate).format("YYYY-MM-DDTHH:mm:ss") !=='Invalid Date' ? dayjs(selectedDate).format("YYYY-MM-DDTHH:mm:ss") : null;
        saveTriggerFrequency({
            every:triggerFreq.triggerInterval ?? 0,
            frequencyType:triggerFreq.triggerCategory ?? '',
            on:triggerFreq.on,
            selectedValues: triggerFreq.weekDays ?? null,
            starting:parsedDate,
            calendarType:triggerFreq.calendarType,
            fiscalValue: triggerFreq.calendarType === 'StandardCalendar' ? null : selectedFiscalValue
        });        
        handleClose(false);        

    }
    
    

    useEffect(() => {
        if (triggerFreq.triggerInterval && triggerFreq.triggerCategory) {
            let intervalMessage =
                triggerFreq.triggerInterval === 1
                    ? `Triggers every ${triggerFreq.triggerCategory.toLowerCase()}`
                    : triggerFreq.triggerInterval === 2
                      ? `Triggers every other ${triggerFreq.triggerCategory.toLowerCase()}`
                      : `Triggers every ${triggerFreq.triggerInterval} ${triggerFreq.triggerCategory.toLowerCase()}`;

            if (
                triggerFreq.triggerCategory == NOTI_FREQ_CAT.Week.toString() &&
                triggerFreq.weekDays.length > 0
            ) {
                intervalMessage = `${intervalMessage} on ${NOTI_FREQ_DAYS.filter(d =>
                    triggerFreq.weekDays.includes(d.day),
                )
                    .sort((a, b) => a.index - b.index)
                    .map(m => m.day)
                    .join(', ')}`;
            }
            if (triggerFreq.triggerCategory == NOTI_FREQ_CAT.Month.toString()) {
                intervalMessage = `${intervalMessage} on ${triggerFreq.calendarType === 'KenvueCalendar' ? (triggerFreq.on??'') : triggerFreq.on ===null ? '' : getOrdinalLabel(parseInt(triggerFreq.on ?? '0'))}`;
            }

            if(triggerFreq.triggerCategory == NOTI_FREQ_CAT.Year.toString()){
                const date = dayjs(selectedDate).format('DD MMMM');               
                intervalMessage = `${intervalMessage} on ${date} `
            }

            setTriggerMessage(intervalMessage);
        } else {
            setTriggerMessage('');
        }
    }, [triggerFreq.triggerInterval, triggerFreq.triggerCategory, triggerFreq.weekDays,triggerFreq.on,selectedDate]);



    //disable save button when all data is not filled
    useEffect(() => {                   
        if (
            [NOTI_FREQ_CAT.Day, NOTI_FREQ_CAT.Shift, NOTI_FREQ_CAT.Week].includes(
                triggerFreq.triggerCategory as NOTI_FREQ_CAT,
            ) &&
            (!selectedDate || selectedDate === '' || selectedDate === null || selectedDate === 'Invalid Date')
        ) {
            setIsSaveDisabled(true);
            return;
        }

        if(triggerFreq.triggerCategory === NOTI_FREQ_CAT.Week && triggerFreq.weekDays.length === 0){
            setIsSaveDisabled(true);
            return;
        }

        if (
            [NOTI_FREQ_CAT.Month].includes(
                triggerFreq.triggerCategory as NOTI_FREQ_CAT,
            ) &&
            (!triggerFreq.on || triggerFreq.on === '' || triggerFreq.on === null)
        ) {
            setIsSaveDisabled(true);
            return;
        }
        setIsSaveDisabled(false);
    }, [
        triggerFreq.triggerInterval,
        triggerFreq.triggerCategory,
        triggerFreq.weekDays,
        triggerFreq.on,
        selectedDate,
        triggerFreq.starting,
    ]);

    

    const toggleDay = (day: string) => {                
        setTriggerFreq(prev => ({
            ...prev,
            weekDays: prev.weekDays.includes(day)
                ? prev.weekDays.filter(d => d !== day)
                : [...prev.weekDays, day],
        }));
    };
    
    const handleCalendarTypeRadioChange = (type: string) => {
        setTriggerFreq(prev => ({
            ...prev,
            calendarType: type,
            on:null,    
            starting:null                 
        }));

        setSelectedDate('');
    };

    const handleTriggerIntervalChange = (interval: number) => {
        setTriggerFreq(prev => ({
            ...prev,
            triggerInterval: interval,
        }));
    };

    const handleTriggerCategoryChange = (cat: string) => {
        setTriggerFreq(prev => ({
            ...prev,
            triggerInterval: 1,
            triggerCategory: cat,
            weekDays: [],
            starting:null,
            on:null
        }));
        setSelectedDate('');
       
    };

    const handleOnDdlChange = (on: string) => {
        setTriggerFreq(prev => ({
            ...prev,
            on: on,
        }));
    };
        
    const TriggerFrequencyDialogueContent = useMemo(() => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label className="inputfield-label-container">Select Calendar Type</label>
                    <div className={Styles['calendar-radio-group']}>
                        <Radio
                            key={'KenvueCalendar'}
                            label={'Kenvue Calendar'}
                            value={'KenvueCalendar'}
                            checked={triggerFreq.calendarType === 'KenvueCalendar'}
                            onChange={() => {
                                handleCalendarTypeRadioChange('KenvueCalendar');
                            }}
                        />
                        <Radio
                            key={'StandardCalendar'}
                            label={'Standard Calendar'}
                            value={'StandardCalendar'}
                            checked={triggerFreq.calendarType === 'StandardCalendar'}
                            onChange={() => {
                                handleCalendarTypeRadioChange('StandardCalendar');
                            }}
                        />
                    </div>
                </div>

                <div>
                    <label className="inputfield-label-container">Triggers Every</label>

                    <div style={{ marginTop: '0.5rem' }}>
                        <Select
                            placeholder="Every"
                            getPopupContainer={trigger => trigger.parentNode}
                            onChange={option => {
                                handleTriggerIntervalChange(option);
                            }}
                            options={numberOptions}
                            className="noti-rule-trigger-freq"
                            value={triggerFreq.triggerInterval}
                            size="large"
                            disabled={triggerFreq.triggerCategory == NOTI_FREQ_CAT.Year}
                        />
                        <Select
                            placeholder={Object.values(NOTI_FREQ_CAT)
                                .filter(v => typeof v === 'string')
                                .map(n => n)
                                .join(',')}
                            getPopupContainer={trigger => trigger.parentNode}
                            onChange={cat => {
                                handleTriggerCategoryChange(cat);
                            }}
                            options={Object.values(NOTI_FREQ_CAT)
                                .filter(v => typeof v === 'string')
                                .map(n => ({ value: n, label: n }))}
                            className="noti-rule-trigger-freq-cat"
                            value={triggerFreq.triggerCategory}
                            size="large"                            
                        />
                    </div>
                </div>

                {triggerFreq && triggerFreq.triggerCategory === 'Week' && (
                    <div className={Styles.daySelector}>
                        {NOTI_FREQ_DAYS.map((day, index) => (
                            <div
                                key={index}
                                className={`${Styles.dayCircle} ${triggerFreq.weekDays.includes(day.day) ? Styles.active : ''}`}
                                onClick={() => toggleDay(day.day)}
                            >
                                {day.dayLetter}
                            </div>
                        ))}
                    </div>
                )}

                <div>
                    <label className="inputfield-label-container">
                        {[NOTI_FREQ_CAT.Day, NOTI_FREQ_CAT.Shift, NOTI_FREQ_CAT.Week].includes(
                            triggerFreq.triggerCategory as NOTI_FREQ_CAT,
                        )
                            ? 'Starting'
                            : 'On'}
                    </label>

                    <div style={{ marginTop: '0.5rem' }}>
                        {[NOTI_FREQ_CAT.Day, NOTI_FREQ_CAT.Shift, NOTI_FREQ_CAT.Week, NOTI_FREQ_CAT.Year].includes(
                            triggerFreq.triggerCategory as NOTI_FREQ_CAT,
                        ) ? (
                            <div style={{ position: 'relative', width: '100%' }}>
                                <InputField
                                    placeholder=""
                                    required={false}
                                    value={selectedDate === 'Invalid Date' ? '':selectedDate}
                                    onChange={() => {}}
                                />

                                {/* Calendar positioned inside InputField */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        right: '40px',
                                        top: '7px',
                                        bottom: '17px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div className={''}>
                                        <TriggerFrequencyCalendar
                                            onDateSelect={(date,fiscalValue) => {
                                                const formattedDate =
                                                    dayjs(date).format('DD MMM YYYY');
                                                setSelectedDate(formattedDate);  
                                                setSelectedFiscalValue(fiscalValue ?? null);                                             
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Select
                                placeholder="Select On"
                                getPopupContainer={trigger => trigger.parentNode}
                                onChange={on => {
                                    handleOnDdlChange(on);
                                }}
                                options={triggerFreq.calendarType == 'KenvueCalendar' ? fiscalRangeOptions : dateRangeOptions}
                                className="noti-rule-trigger-starting"
                                value={triggerFreq.on}
                                size="large"
                            />
                        )}
                    </div>
                </div>
                <label className={Styles['trigger-freq-message']}>{triggerMessage}</label>
            </div>
        );
    }, [triggerFreq,triggerMessage, selectedDate]);

    return (
        <Dialog
            isOpen={isOpen}
            content={TriggerFrequencyDialogueContent}
            onClose={() => {
                handleClose(false);
            }}
            title="Set Trigger Frequency"
            primaryButtonText="Save"
            onPrimaryButtonClick={() => {
                handleSaveFrequency();
            }}
            secondaryButtonText="Discard"
            onSecondaryButtonClick={() => {
                handleClose(false);
            }}
            // size="Medium"
            isPrimaryDisabled={isSaveDisabled}
        ></Dialog>
    );
}

export default TriggerFrequency;
