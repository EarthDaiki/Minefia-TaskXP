import { useState } from "react";
import "./TaskDetail.css"
import type { Tag } from "../types/tag";
import type { Task } from "../types/task";
import { IconRating } from "./IconRating";
import { SelectTag } from "./SelectTag";
import { invoke } from "@tauri-apps/api/core";

import FireIcon from "./FireIcon";
import BrainIcon from "./BrainIcon";

import DateSelector from "./DateSelector";
import TimeSelector from "./TimeSelector";

type TaskDetailProps = {
    task: Task;
    tags: Tag[];
    onBack: () => void;
    onLoadTasks: () => void | Promise<void>;
    onLoadTags: () => void | Promise<void>;
};

type EditButtonProps = {
    onClick: () => void;
}

type EditingField = 
    | null
    | "title"
    | "description"
    | "tags"
    | "priority"
    | "difficulty"
    | "estimated_minutes"
    | "actual_minutes"
    | "due_at";

function EditButton({ onClick }: EditButtonProps) {
    return (
        <button type="button" className="icon" onClick={onClick}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M535.6 85.7C513.7 63.8 478.3 63.8 456.4 85.7L432 110.1L529.9 208L554.3 183.6C576.2 161.7 576.2 126.3 554.3 104.4L535.6 85.7zM236.4 305.7C230.3 311.8 225.6 319.3 222.9 327.6L193.3 416.4C190.4 425 192.7 434.5 199.1 441C205.5 447.5 215 449.7 223.7 446.8L312.5 417.2C320.7 414.5 328.2 409.8 334.4 403.7L496 241.9L398.1 144L236.4 305.7zM160 128C107 128 64 171 64 224L64 480C64 533 107 576 160 576L416 576C469 576 512 533 512 480L512 384C512 366.3 497.7 352 480 352C462.3 352 448 366.3 448 384L448 480C448 497.7 433.7 512 416 512L160 512C142.3 512 128 497.7 128 480L128 224C128 206.3 142.3 192 160 192L256 192C273.7 192 288 177.7 288 160C288 142.3 273.7 128 256 128L160 128z" />
            </svg>
        </button>
    );
}

function TaskDetail({ task, tags, onBack, onLoadTasks, onLoadTags}: TaskDetailProps) {
    const [editingField, setEditingField] = useState<EditingField>(null);
    const [draftString, setDraftString] = useState<string>("");
    const [draftNumber, setDraftNumber] = useState<number>(1);
    const [draftTimeValue, setDraftTimeValue] = useState<string>("");
    // const [draftBoolValue, setDraftBoolValue] = useState<boolean>(false);
    const [draftTags, setDraftTags] = useState<Tag[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>("");

    function formatDate(timestamp: number) {
        return new Date(timestamp * 1000).toLocaleString();
    }

    function formatDue(timestamp: number | null, due_has_time: boolean) {
        if (timestamp === null) return "No Due Date";
        if (due_has_time) {
            return new Date(timestamp * 1000).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
        return new Date(timestamp * 1000).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function splitDue(timestamp: number | null, dueHasTime: boolean) {
        if (timestamp === null) {
            return {
                date: "",
                time: "",
            };
        }

        const date = new Date(timestamp * 1000);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        const dateValue = `${year}-${month}-${day}`;

        if (!dueHasTime) {
            return {
                date: dateValue,
                time: "",
            };
        }

        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");

        return {
            date: dateValue,
            time: `${hour}:${minute}`,
        };
    }

    function startDueEdit() {
        const due = splitDue(task.due_at, task.due_has_time);

        setDraftString(due.date);
        setDraftTimeValue(due.time);
        setEditingField("due_at");
    }

    function startStringEdit(field: EditingField, value: string | null) {
        setEditingField(field);
        setDraftString(value ?? "");
    }

    function startNumberEdit(field: EditingField, value: number | null) {
        setEditingField(field);
        setDraftNumber(value ?? 0);
    }

    function startTagsEdit(field: EditingField, value: Tag[] | null) {
        setEditingField(field);
        setDraftTags(value ?? []);
    }

    async function saveEdit() {
        switch (editingField) {
            case "title":
                const title = draftString.trim();
                if (title === "") {
                    setErrorMessage("Title required.");
                    return;
                }
                await invoke("update_task", {
                    taskId: task.id,
                    field: "title",
                    stringValue: draftString,
                });
                break;

            case "description":
                await invoke("update_task", {
                    taskId: task.id,
                    field: "description",
                    stringValue: draftString,
                });
                break;

            case "priority":
                await invoke("update_task", {
                    taskId: task.id,
                    field: "priority",
                    numberValue: draftNumber,
                });
                break;

            case "difficulty":
                await invoke("update_task", {
                    taskId: task.id,
                    field: "difficulty",
                    numberValue: draftNumber,
                });
                break;

            case "due_at":
                let dueValue = "";
                if (draftString === "") {
                    dueValue = "";
                }
                if (draftTimeValue === "") {
                    dueValue = draftString;
                }
                if (draftTimeValue !== "" && draftString !== "") {
                    dueValue = `${draftString}T${draftTimeValue}`;
                }
                if (draftString === "" && draftTimeValue !== "") {
                    setErrorMessage("Date required.");
                    return;
                }
                const [hour = "", minute = ""] = draftTimeValue.split(":");
                if (hour === "" && minute !== "") {
                    setErrorMessage("Hour is required.");
                    return;
                }
                if (minute === "" && hour !== "") {
                    setErrorMessage("Minute is required.");
                    return;
                }
                const hasTime = draftString !== "" && draftTimeValue !== "";
                await invoke("update_task", {
                    taskId: task.id,
                    field: "due_at",
                    stringValue: dueValue,
                    boolValue: hasTime,
                });
                break;

            case "estimated_minutes":
                const estimated = 
                    draftString.trim() === ""
                        ? null
                        : Number(draftString);
                if (estimated !== null && estimated < 0) {
                    setErrorMessage("Estimated minutes must be 0 or greater.");
                    return;
                }
                await invoke("update_task", {
                    taskId: task.id,
                    field: "estimated_minutes",
                    numberValue: Number(draftString),
                });
                break;

            case "tags":
                await invoke("update_task", {
                    taskId: task.id,
                    field: "tags",
                    tagIds: draftTags.map((tag) => tag.id),
                });
                break;

            default:
                break;
        }
        await onLoadTasks();
        setEditingField(null);
    }

    function EditSaveCancel() {
        return (
            <div>
                <button className="edit-save" onClick={saveEdit}>
                    Save
                </button>
                <button 
                    className="edit-cancel" 
                    onClick={() => setEditingField(null)}
                >
                    Cancel
                </button>
            </div>
        )
    }
    async function startTask(task_id: number) {
        await invoke("start_task", {
            taskId: task_id
        });
        await onLoadTasks();
    }
    async function resetStartTask(task_id: number) {
        await invoke("reset_start_task", {
            taskId: task_id
        });
        await onLoadTasks();
    }
    async function taskDone(task_id: number) {
        await invoke("complete_task", {
            taskId: task_id
        });
        await onLoadTasks();
    }

    async function taskUndone(task_id: number) {
        await invoke("uncomplete_task", {
            taskId: task_id
        });
        await onLoadTasks();
    }


    return (
        <section className="task-detail">
            <div className="task-detail-header">
                <button className="task-detail-back" onClick={onBack}>
                    Back
                </button>
                <span className="task-detail-status">
                    {task.completed === 1 ? "Completed" : "Active"}
                </span>
            </div>

            {task.started_at === null && (
                <div className="task-control">
                    <button
                        type="button"
                        className="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            startTask(task.id);
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                            <path d="M320 112C434.9 112 528 205.1 528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112zM320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM276.5 211.5C269.1 207 259.8 206.8 252.2 211C244.6 215.2 240 223.3 240 232L240 408C240 416.7 244.7 424.7 252.3 428.9C259.9 433.1 269.1 433 276.6 428.4L420.6 340.4C427.7 336 432.1 328.3 432.1 319.9C432.1 311.5 427.7 303.8 420.6 299.4L276.6 211.4zM362 320L288 365.2L288 274.8L362 320z"/>
                        </svg>
                    </button>
                </div>
            )}
            {task.started_at !== null && task.completed === 0 && (
                <div className="task-control">
                    <button
                        type="button"
                        className="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            resetStartTask(task.id);
                        }}
                    >
                        {/* reset start task */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                            <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM256 224L384 224C401.7 224 416 238.3 416 256L416 384C416 401.7 401.7 416 384 416L256 416C238.3 416 224 401.7 224 384L224 256C224 238.3 238.3 224 256 224z"/>
                        </svg>
                    </button>
                    <button
                        type="button"
                        className="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            taskDone(task.id);
                        }}
                    >
                        {/* complete task */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                            <path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/>
                        </svg>
                    </button>
                </div>
            )}

            {task.completed === 1 && (
                <div className="task-control">
                    <button 
                        type="button" 
                        className="icon" 
                        onClick={(e) => {
                            e.stopPropagation();
                            taskUndone(task.id);
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                            <path d="M320 128C426 128 512 214 512 320C512 426 426 512 320 512C254.8 512 197.1 479.5 162.4 429.7C152.3 415.2 132.3 411.7 117.8 421.8C103.3 431.9 99.8 451.9 109.9 466.4C156.1 532.6 233 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C234.3 64 158.5 106.1 112 170.7L112 144C112 126.3 97.7 112 80 112C62.3 112 48 126.3 48 144L48 256C48 273.7 62.3 288 80 288L104.6 288C105.1 288 105.6 288 106.1 288L192.1 288C209.8 288 224.1 273.7 224.1 256C224.1 238.3 209.8 224 192.1 224L153.8 224C186.9 166.6 249 128 320 128zM344 216C344 202.7 333.3 192 320 192C306.7 192 296 202.7 296 216L296 320C296 326.4 298.5 332.5 303 337L375 409C384.4 418.4 399.6 418.4 408.9 409C418.2 399.6 418.3 384.4 408.9 375.1L343.9 310.1L343.9 216z"/>
                        </svg>
                    </button>
                </div>
            )}

            <div className="task-detail-card">
                <div className="task-detail-title-row">
                    {editingField === "title" ? (
                        <div className="task-detail-edit">
                            <input 
                                value={draftString}
                                onChange={(e) => setDraftString(e.target.value)}
                            />
                            {errorMessage !== "" ? <p>{errorMessage}</p> : <p></p>}
                            <EditSaveCancel />
                        </div>
                    ) : (
                        <h2 className="task-detail-title">{task.title}</h2>
                    )}
                    {editingField !== "title" && (
                        <EditButton onClick={() => startStringEdit("title", task.title)}/>
                    )}
                </div>

                <div className="task-detail-description-row">
                    {editingField === "description" ? (
                        <div className="task-detail-edit">
                            <textarea 
                                value={draftString}
                                onChange={(e) => setDraftString(e.target.value)}
                            />
                            <EditSaveCancel />
                        </div>
                    ) : (
                        <p className="task-detail-description">{task.description ? task.description : "No description"}</p>
                    )}
                    {editingField !== "description" && (
                        <EditButton onClick={() => startStringEdit("description", task.description)}/>
                    )}
                </div>

                <div className="task-detail-tags">
                    {editingField === "tags" ? (
                        <div className="task-detail-edit">
                            <SelectTag
                                tags={tags}
                                onLoadTags={onLoadTags}
                                selectedTags={draftTags}
                                setSelectedTags={setDraftTags}
                            />
                            <EditSaveCancel />
                        </div>
                    ) : (
                        task.tags.length === 0 ? (
                            <span className="task-detail-text">
                                No tags
                            </span>
                        ) : (
                            task.tags.map((tag) => (
                                <span className="task-detail-tag" key={tag.id}>
                                    {tag.name}
                                </span>
                            ))
                        )
                    )}
                    {editingField !== "tags" && (
                        <EditButton onClick={() => startTagsEdit("tags", task.tags)}/>
                    )}
                </div>

                <dl className="task-detail-grid">
                    <div className="task-detail-item">
                        {editingField === "priority" ? (
                            <div className="task-detail-edit">
                                <dt>Priority</dt>
                                <IconRating
                                    Icon={FireIcon}
                                    value={draftNumber}
                                    onChange={setDraftNumber}
                                    max={5}
                                />
                                <EditSaveCancel />
                            </div>
                        ) : (
                            <div className="task-detail-rating">
                                <dt>Priority</dt>
                                <dd>
                                    <IconRating
                                        Icon={FireIcon}
                                        value={task.priority}
                                        max={5}
                                        readOnly={true}
                                    />
                                </dd>
                            </div>
                        )}
                        {editingField !== "priority" && (
                            <EditButton onClick={() => startNumberEdit("priority", task.priority)}/>
                        )}
                    </div>

                    <div className="task-detail-item">
                        {editingField === "difficulty" ? (
                            <div className="task-detail-edit">
                                <dt>Difficulty</dt>
                                <IconRating
                                    Icon={BrainIcon}
                                    value={draftNumber}
                                    onChange={setDraftNumber}
                                    max={5}
                                />
                                <EditSaveCancel />
                            </div>
                        ) : (
                            <div className="task-detail-rating">
                                <dt>Difficulty</dt>
                                <dd>                                
                                    <IconRating
                                        Icon={BrainIcon}
                                        value={task.difficulty}
                                        max={5}
                                        readOnly={true}
                                    />
                                </dd>
                            </div>
                        )}
                        {editingField !== "difficulty" && (
                            <EditButton onClick={() => startNumberEdit("difficulty", task.difficulty)}/>
                        )}
                    </div>

                    <div className="task-detail-item">
                        {editingField === "estimated_minutes" ? (
                            <div className="task-detail-edit">
                                <dt>Estimated Minutes</dt>
                                <input
                                    id="estimated-minutes"
                                    className="task-dialog-input estimated-minutes"
                                    type="number"
                                    value={draftString}
                                    onChange={(e) => setDraftString(e.target.value)}
                                    onBlur={() => {
                                        if (draftString === "") {
                                            setDraftString("");
                                        }
                                    }}
                                />
                                <EditSaveCancel />
                            </div>
                        ) : (
                            <div className="task-detail-value">
                                <dt>Estimated Minutes</dt>
                                <dd>{task.estimated_minutes !== null ? 
                                        task.estimated_minutes <= 1 ? `${task.estimated_minutes} min` : `${task.estimated_minutes} mins` 
                                        : "None"}
                                </dd>
                            </div>
                        )}
                        {editingField !== "estimated_minutes" && (
                            <EditButton onClick={() => startStringEdit("estimated_minutes", String(task.estimated_minutes))}/>
                        )}
                    </div>

                    <div className="task-detail-item">
                        <div className="task-detail-value">
                            <dt>Actual</dt>
                            <dd>{task.actual_minutes ?? "None"}</dd>
                        </div>
                    </div>

                    <div className="task-detail-item">
                        {editingField === "due_at" ? (
                            <div className="task-detail-edit">
                                <dt>Due</dt>
                                <DateSelector
                                    value={draftString}
                                    onChange={setDraftString}
                                    htmlFor="due-at-date"
                                />
                                <TimeSelector
                                    value={draftTimeValue}
                                    onChange={setDraftTimeValue}
                                    htmlFor="due-at-time"
                                />
                                <EditSaveCancel />
                            </div>
                        ) : (
                            <div className="task-detail-value">
                                <dt>Due</dt>
                                <dd>{formatDue(task.due_at, task.due_has_time)}</dd>
                            </div>
                        )}
                        {editingField !== "due_at" && (
                            <EditButton onClick={() => startDueEdit()}/>
                        )}
                    </div>

                    <div className="task-detail-item">
                        <div className="task-detail-value">
                            <dt>Started</dt>
                            <dd>{task.started_at !== null ? formatDate(task.started_at) : "None"}</dd>
                        </div>
                    </div>

                    <div className="task-detail-item">
                        <div className="task-detail-value">
                            <dt>Created</dt>
                            <dd>{formatDate(task.created_at)}</dd>
                        </div>
                    </div>

                    <div className="task-detail-item">
                        <div className="task-detail-value">
                            <dt>Updated</dt>
                            <dd>{formatDate(task.updated_at)}</dd>
                        </div>
                    </div>

                    <div className="task-detail-item">
                        <div className="task-detail-value">
                            <dt>Completed At</dt>
                            <dd>{task.completed_at !== null ? formatDate(task.completed_at) : "None"}</dd>
                        </div>
                    </div>
                </dl>
            </div>
        </section>
    );
}

export default TaskDetail;