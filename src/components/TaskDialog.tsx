import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./DialogRoot.css"
import "./TaskDialog.css"
import type { Tag, SuggestedTag } from "../types/tag";
import FireIcon from "./FireIcon";
import BrainIcon from "./BrainIcon";
import { IconRating } from "./IconRating";
import { SelectTag } from "./SelectTag";

import DateSelector from "./DateSelector";
import TimeSelector from "./TimeSelector";

type TaskDialogDraft = {
    title?: string;
    description?: string | null;
    priority?: number;
    difficulty?: number;
    due_at?: string | null;
    due_has_time?: boolean;
    estimated_minutes?: number | null;
    tags?: Tag[];
    suggestedTags?: SuggestedTag[];
};

type TaskDialogProps = {
    tags: Tag[];
    onLoadTags: () => void | Promise<void>;
    onSave: () => void | Promise<void>;
    onClose: () => void;
    initialDraft?: TaskDialogDraft;
};

function TaskDialog({tags, onLoadTags, onSave, onClose, initialDraft}: TaskDialogProps) {
    const [title, setTitle] = useState(initialDraft?.title ?? "");
    const [description, setDescription] = useState(initialDraft?.description ?? "");
    const [priority, setPriority] = useState(initialDraft?.priority ?? 1);
    const [difficulty, setDifficulty] = useState(initialDraft?.difficulty ?? 1);
    const [estimatedMinutes, setEstimatedMinutes] = useState(
        initialDraft?.estimated_minutes?.toString() ?? ""
    );
    const [selectedTags, setSelectedTags] = useState<Tag[]>(initialDraft?.tags ?? []);
    const [selectedAiTags, setSelectedAiTags] = useState<SuggestedTag[]>(initialDraft?.suggestedTags ?? []);

    const initialDue = splitDraftDue(initialDraft?.due_at);
    const [dueDate, setDueDate] = useState(initialDue.date);
    const [dueTime, setDueTime] = useState(initialDue.time);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);

    function splitDraftDue(dueAt?: string | null) {
        if (!dueAt) {
            return { date: "", time: "" };
        }

        const [date, time = ""] = dueAt.split("T");

        return { date, time };
    }

    async function handleSave() {
        const errors = [];
        const trimmedTitle = title.trim();
        let dueHasTime = false;
        if (trimmedTitle === "") {
            errors.push("Title is required.")
        }
        const trimmedDescription = description.trim() === "" ? null : description.trim();

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
        setErrorMessages([]);

        // let finalSelectedTags = [...selectedTags];
        // if (selectedAiTags.length > 0) {
        //     for (const tag of selectedAiTags) {
        //         await invoke("add_tag", {
        //             name: tag.name
        //         })
        //     }
        //     const tags = await invoke<Tag[]>("get_tags", {});
        //     const createdAiTags = tags.filter((tag) => 
        //         selectedAiTags.some((aiTag) => aiTag.name === tag.name)
        //     );
        //     finalSelectedTags = [
        //         ...finalSelectedTags,
        //         ...createdAiTags,
        //     ];
        // }
        try {
            await invoke("add_task", {
                title: trimmedTitle,
                description: trimmedDescription,
                priority: priority,
                difficulty: difficulty,
                dueAt: dueAt,
                dueHasTime: dueHasTime,
                estimatedMinutes: estimated,
                selectedTagIds: selectedTags.map((tag) => tag.id),
            });
        } catch (error) {
            setErrorMessages([String(error)]);
            return;
        }
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
    // function removeAiTag(id: string) {
    //     setSelectedAiTags((prev) => prev.filter((tag) => tag.tempId !== id))
    // }

    async function addAiTag(tempId: string) {
        const aiTag = selectedAiTags.find((aiTag) => aiTag.tempId === tempId);
        if (!aiTag) {
            return;
        }

        let targetTag = tags.find((tag) => tag.name === aiTag.name);
        if (targetTag) {
            return;
        }
        await invoke("add_tag", {
            name: aiTag.name
        })

        const loadedTags = await invoke<Tag[]>("get_tags");

        const createdTag = loadedTags.find((tag) => tag.name === aiTag.name);

        if (!createdTag) {
            return;
        }

        setSelectedTags((prev) => {
            if (prev.some((tag) => tag.id === createdTag.id)) {
                return prev;
            }

            return [...prev, createdTag];
        });

        setSelectedAiTags((prev) =>
            prev.filter((tag) => tag.tempId !== tempId)
        );

        await onLoadTags();
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
                            tags={tags}
                            onLoadTags={onLoadTags}
                            selectedTags={selectedTags}
                            setSelectedTags={setSelectedTags}
                        />
                    </div>
                    {selectedAiTags.length > 0 && (
                        <div className="task-dialog-field">
                            <span className="task-dialog-label">New Suggested Tags</span>
                            {selectedAiTags.map((tag) => (
                                <div key={tag.tempId} className="suggested-tag-container">
                                    <span>{tag.name}</span>
                                    <button
                                        className="icon"
                                        onClick={() => addAiTag(tag.tempId)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                                            <path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z"/>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div> 
                    )}

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
