import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./DialogRoot.css"
import "./TaskDialog.css"
import type { Tag } from "../types/tag";
import FireIcon from "./FireIcon";
import BrainIcon from "./BrainIcon";
import { IconRating } from "./IconRating";
import { SelectTag } from "./SelectTag";

import DateSelector from "./DateSelector";
import TimeSelector from "./TimeSelector";


type TaskDialogProps = {
    onSave: () => void | Promise<void>;
    onClose: () => void;
}

function TaskDialog({onSave, onClose}: TaskDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState(1);
    const [difficulty, setDifficulty] = useState(1);
    const [dueDate, setDueDate] = useState("");
    const [dueTime, setDueTime] = useState("");
    // const [dueHasTime, setDueHasTime] = useState(false);
    const [estimatedMinutes, setEstimatedMinutes] = useState("");
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);

    async function handleSave() {
        const errors = [];
        const trimmedTitle = title.trim();
        let dueHasTime = false;
        if (trimmedTitle === "") {
            errors.push("Title is required.")
        }

        const estimated = 
            estimatedMinutes.trim() === ""
                ? null
                : Number(estimatedMinutes);

        if (estimated !== null && estimated < 0) {
            errors.push("Estimated minutes must be 0 or greater.");
        }

        if (dueDate === "" && dueTime !== "") {
            errors.push("Due date is required when due time is set.");
        }

        const [hour = "", minute = ""] = dueTime.split(":");
        if (hour === "" && minute !== "") {
            errors.push("Hour is required.");
        }
        if (minute === "" && hour !== "") {
            errors.push("Minute is required.");
        }
        if (dueTime !== "") {
            // setDueHasTime(true)
            dueHasTime = true;
        }

        const dueAt = combineDue();
        if (dueAt !== null) {
            console.log(dueAt);
        }

        if (errors.length > 0) {
            setErrorMessages(errors);
            return;
        }

        console.log(`DueDate: ${dueDate}`);
        console.log(`DueTime: ${dueTime}`);
        console.log(`DueAt: ${dueAt}`);

        await invoke("add_task", {
            title: title,
            description: description || null,
            priority: priority || null,
            difficulty: difficulty || null,
            dueAt: dueAt,
            dueHasTime: dueHasTime,
            estimatedMinutes: estimated,
            selectedTagIds: selectedTags.map((tag) => tag.id),
        });
        await onSave();
    }

    function handleCancel() {
        onClose();
    }

    function combineDue() {
        if (dueDate === "") {
            console.log("due null");
            return null;
        }
        if (dueTime === "") {
            console.log("due date");
            return dueDate
        }
        console.log("due date and time");
        return `${dueDate}T${dueTime}`
    }

    return (
        <div className="overlay">
            <div className="dialog task-dialog">
                <div className="task-dialog-header">
                    <h2 className="task-dialog-title">Add New Task</h2>
                </div>

                <section className="task-dialog-card">
                    <div className="task-dialog-field">
                        <label className="task-dialog-label" htmlFor="title">Title</label>
                        <input
                            id="title"
                            className="task-dialog-input title"
                            placeholder="Enter a title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="task-dialog-field">
                        <label className="task-dialog-label" htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            className="task-dialog-textarea description"
                            placeholder="Enter a description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="task-dialog-field">
                        <span className="task-dialog-label">Tags</span>
                        <SelectTag
                            selectedTags={selectedTags}
                            setSelectedTags={setSelectedTags}
                        />
                    </div>

                    <div className="task-dialog-grid">
                        <div className="task-dialog-field">
                            <span className="task-dialog-label">Priority</span>
                            <IconRating
                            Icon={FireIcon}
                            value={priority}
                            onChange={setPriority}
                            max={5}
                            />
                        </div>

                        <div className="task-dialog-field">
                            <span className="task-dialog-label">Difficulty</span>
                            <IconRating
                            Icon={BrainIcon}
                            value={difficulty}
                            onChange={setDifficulty}
                            max={5}
                            />
                        </div>

                        <div className="task-dialog-field">
                            <label className="task-dialog-label" htmlFor="due-at-date">Due Date</label>
                            <DateSelector
                                value={dueDate}
                                onChange={setDueDate}
                                htmlFor="due-at-date"
                            />
                        </div>
                        <div className="task-dialog-field">
                            <label className="task-dialog-label" htmlFor="due-at-time">Due Time</label>
                            <TimeSelector
                                value={dueTime}
                                onChange={setDueTime}
                                htmlFor="due-at-time"
                            />
                        </div>

                        <div className="task-dialog-field">
                            <label className="task-dialog-label" htmlFor="estimated-minutes">
                                Estimated Minutes
                            </label>
                            <input
                                id="estimated-minutes"
                                className="task-dialog-input estimated-minutes"
                                type="number"
                                value={estimatedMinutes}
                                min="0"
                                onChange={(e) => setEstimatedMinutes(e.target.value)}
                                onBlur={() => {
                                    if (estimatedMinutes === "") {
                                        setEstimatedMinutes("");
                                    }
                                }}
                            />
                        </div>
                    </div>
                </section>

                {errorMessages.length > 0 && (
                    <div className="task-dialog-errors">
                    {errorMessages.map((message, index) => (
                        <p key={index}>{message}</p>
                    ))}
                    </div>
                )}

                <div className="task-dialog-actions">
                    <button className="task-dialog-save" onClick={() => handleSave()}>
                        Save
                    </button>
                    <button className="task-dialog-cancel" onClick={handleCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TaskDialog;
