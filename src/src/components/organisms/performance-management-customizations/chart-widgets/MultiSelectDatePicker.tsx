import { Calendar } from "antd";
import { Dayjs } from "dayjs";
import { useState } from "react";
interface MultiDatePickerProps {
    setSelectedValues?: (v: string[]) => void;
}
export const MultiDatePicker = ({ setSelectedValues }: MultiDatePickerProps) => {
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const onSelect = (date: Dayjs) => {
        const formatted = date.format("YYYY-MM-DD");

        // 1. Calculate the new array first
        const getNewDates = (prev: string[]) =>
            prev.includes(formatted)
                ? prev.filter((d) => d !== formatted) // unselect
                : [...prev, formatted]; // select

        // 2. Pass the evaluated array into both setters
        setSelectedDates((prev) => {
            const newDates = getNewDates(prev);
            if(newDates)setSelectedValues?.(newDates);
              
            return newDates;
        });
    };
    const dateFullCellRender = (date: Dayjs) => {
        const formatted = date.format("YYYY-MM-DD");
        const isSelected = selectedDates.includes(formatted);
        return (
            <div
                style={{
                    background: isSelected ? "#DFF5F2" : "transparent",
                    borderColor: isSelected ? "#00B097" : "transparent",
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderRadius: "50%",
                    textAlign: "center",
                    height: 25,
                    width: 25
                }}
            >
                {date.date()}
            </div>
        );
    };
    return (
        <Calendar
            fullscreen={false}
            onSelect={onSelect}
            headerRender={() => null}
            dateFullCellRender={dateFullCellRender}
        />
    );
};