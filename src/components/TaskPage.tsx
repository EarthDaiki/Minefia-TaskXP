import { useState } from "react";
// import { invoke } from "@tauri-apps/api/core";
import TaskDialog from "./TaskDialog";
import "./TaskPage.css"
import type { SortMode } from "../types/sort";
import { sortOptions } from "../types/sort";
import { sortTasks } from "../utils/taskSorts";
import type { Task } from "../types/task";

type TaskPageProps = {
  tasks: Task[];
  onSelectTask: (taskId: number) => void;
  onLoadTasks: () => void | Promise<void>;
  exceptMessage: string;
};

function TaskPage({tasks, onSelectTask, onLoadTasks, exceptMessage}: TaskPageProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [sortMode, setSortMode] = useState<SortMode>("smart");
    const sortedTasks = sortTasks(tasks, sortMode);

    function formatDue(timestamp: number | null, due_has_time: boolean) {
        if (timestamp === null) return "No Due Date";
        if (due_has_time) {
            console.log("display: due has time");
            return new Date(timestamp * 1000).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
        console.log("display: date only")
        return new Date(timestamp * 1000).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    // async function taskDone(task_id: number) {
    //     await invoke("complete_task", {
    //         taskId: task_id
    //     });
    //     await onLoadTasks();
    // }

    // async function taskUndone(task_id: number) {
    //     await invoke("uncomplete_task", {
    //         taskId: task_id
    //     });
    //     await onLoadTasks();
    // }

    return (
        <div className="task-page">
            <h1>TaskXP</h1>
            <section id="todo-list">
                <div className="task-toolbar">
                    <button className="add-task" onClick={() => setIsDialogOpen(true)}>
                        Add Task +
                    </button>
                    <select 
                        className="sort-select" 
                        value={sortMode} 
                        onChange={(e) => setSortMode(e.target.value as SortMode)}
                    >
                        {sortOptions.map((option) => (
                            <option value={option.value} key={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="tasks-container">
                    {sortedTasks.length > 0 ? (
                        sortedTasks.map((task) => (
                        <article className="task-container" key={task.id} onClick={() => onSelectTask(task.id)}>
                            {/* {task.completed === 1 ? (
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
                            ) : (
                                <button 
                                    type="button" 
                                    className="icon" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        taskDone(task.id);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                                        <path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"/>
                                    </svg>
                                </button>
                            )} */}
                            <div className="task-info">
                                <div className="task-main">
                                    <h3 className="task-title">{task.title}</h3>
                                    {task.description && (
                                        <p className="task-description">{task.description}</p>
                                    )}
                                </div>

                                <div className="task-tags">
                                    {task.tags.map((tag) => (
                                        <span className="task-tag" key={tag.id}>
                                        {tag.name}
                                        </span>
                                    ))}
                                </div>

                                <div className="task-meta">
                                    <span>Priority {task.priority}</span>
                                    <span>Difficulty {task.difficulty}</span>
                                    {task.estimated_minutes !== null && (
                                        <span>Estimated: {
                                            task.estimated_minutes <= 1 ? `${task.estimated_minutes} min` : `${task.estimated_minutes} mins` 
                                        }
                                        </span>
                                    )}
                                    <span>Due: {formatDue(task.due_at, task.due_has_time)}</span>
                                </div>
                            </div>
                        </article>
                        ))
                    ) : (
                        <p className="empty-tasks">{exceptMessage}</p>
                    )}
                </div>
                
            </section>

            {isDialogOpen && (
                <TaskDialog 
                onSave={async () => {
                    await onLoadTasks();
                    setIsDialogOpen(false);
                }}
                onClose={() => setIsDialogOpen(false)}
                />
            )}
        </div>
    );
}

export default TaskPage;