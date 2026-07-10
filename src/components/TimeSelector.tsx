import { useRef, useState } from "react";
import "./TimeSelector.css";

type TimeSelectorProps = {
    value: string;
    htmlFor: string;
    onChange: (value: string) => void;
}

function TimeSelector({value, htmlFor, onChange}: TimeSelectorProps) {
    const minuteRef = useRef<HTMLInputElement>(null);
    const hourRef = useRef<HTMLInputElement>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("AM");
    const [focus, setFocusState] = useState<"" | "hour" | "minute">("");

    const { hour, minute, period } = from24Hour(value);

    function normalizeHour(hourValue: string) {
        if (hourValue === "") return;

        if (Number(hourValue) === 0) {
            hourValue = "12";
        }

        hourValue = hourValue.padStart(2, "0");
        
        onChange(to24Hour(hourValue, minute, selectedPeriod));
    }

    function normalizeMinute(minuteValue: string) {
        if (minuteValue === "") return;

        onChange(to24Hour(hour, minuteValue, selectedPeriod));
    }

    function buttonOnClick() {
        const nextPeriod = period === "AM" ? "PM" : "AM";
        setSelectedPeriod(nextPeriod);
        onChange(to24Hour(hour, minute, nextPeriod));
    }

    function from24Hour(value: string) {
        if (value === "") {
            return {
                hour: "",
                minute: "",
                period: selectedPeriod,
            };
        }

        const [hourText = "", minute = ""] = value.split(":");

        if (hourText === "") {
            return {
                hour: hourText,
                minute: minute,
                period: selectedPeriod,
            }
        }
        const hour24 = Number(hourText);
        const period = hour24 >= 12 ? "PM" : "AM";

        let hour12 = hour24 % 12;

        if (focus === "hour") {
            return {
                hour: String(hour12),
                minute: minute,
                period: selectedPeriod,
            };
        }

        if (hour12 === 0) {
            hour12 = 12;
        }

        if (focus === "minute") {
            return {
                hour: String(hour12).padStart(2, "0"),
                minute: minute,
                period: selectedPeriod,
            };
        }

        return {
            hour: String(hour12).padStart(2, "0"),
            minute,
            period,
        };
    }

    function to24Hour(hour: string, minute: string, period: "AM" | "PM") {
        if (hour === "" && minute === "") {
            return "";
        }
        if (hour === "" && minute !== "") {
            return `${hour}:${minute.padStart(2, "0")}`
        }

        let h = Number(hour);

        // Checking for h is less than or equal to 12 is not required.

        if (period === "AM" && h === 12) {
            h = 0;
        }

        if (period === "PM" && h !== 12) {
            h += 12;
        }

        if (hour !== "" && minute === "") {
            return `${String(h).padStart(2, "0")}:${minute}`
        }

        return `${String(h).padStart(2, "0")}:${minute.padStart(2, "0")}`;
    }

    return (
        <div className="date-time-selector-container">
            <input
                id={htmlFor === "" ? "" : htmlFor}
                className="time-input"
                placeholder="--"
                type="text"
                ref={hourRef}
                value={hour}
                maxLength={2}
                onChange={(e) => {
                    const value = e.target.value;
                    if (!/^\d*$/.test(value)) {
                        return;
                    }

                    if (value !== "" && Number(value) > 12) {
                        return;
                    }
                    onChange(`${value}:${minute}`);
                    if (value.length === 2 && minute === "") {
                        minuteRef.current?.focus();
                    }
                }}
                onBlur={(e) => {
                    normalizeHour(e.target.value)
                    setFocusState("");
                }}
                onFocus={() => setFocusState("hour")}
            />
            <span>:</span>
            <input
                className="time-input"
                placeholder="--"
                type="text"
                ref={minuteRef}
                value={minute}
                inputMode="numeric"
                maxLength={2}
                onChange={(e) => {
                    const value = e.target.value;
                    if (!/^\d*$/.test(value)) {
                        return;
                    }

                    if (value !== "" && Number(value) > 59) {
                        return;
                    }
                    onChange(`${hour}:${value}`);

                    if (value.length === 2 && hour === "") {
                        hourRef.current?.focus();
                    }
                }}
                onBlur={(e) => {
                    normalizeMinute(e.target.value)
                    setFocusState("");
                }}
                onFocus={() => setFocusState("minute")}
            />
            <button
                type="button"
                onClick={buttonOnClick}
            >
                {period}
            </button>
        </div>
    );
}

export default TimeSelector;