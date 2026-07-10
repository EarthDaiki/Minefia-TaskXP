import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DateSelector.css";

type DateSelectorProps = {
    value: string;
    htmlFor: string;
    onChange: (value: string) => void;
}

function DateSelector({value, htmlFor, onChange}: DateSelectorProps) {
    function formatDate(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function parseDate(value: string) {
        if (value === "") return null;

        const [year, month, day] = value.split("-").map(Number);
        return new Date(year, month - 1, day);
    }
    return (
        <div className="date-time-selector-container">
            <div className="date-selector">
                <DatePicker
                    id={htmlFor === "" ? "" : htmlFor}
                    className="date-input"
                    selected={parseDate(value)}
                    onChange={(date: Date | null) => {
                        if (date === null) {
                            onChange("");
                            return;
                        }
                        onChange(formatDate(date));
                    }}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="YYYY-MM-DD"
                />
            </div>
        </div>
    );
}

export default DateSelector;