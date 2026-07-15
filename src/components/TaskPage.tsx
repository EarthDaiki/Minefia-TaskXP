import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import TaskDialog from "./TaskDialog";
import "./TaskPage.css"
import type { SortMode } from "../types/sort";
import { sortOptions } from "../types/sort";
import { sortTasks } from "../utils/taskSorts";
import type { Task } from "../types/task";
import { Tag } from "../types/tag";
import DeleteIcon from "./DeleteIcon";

type TaskPageProps = {
  tasks: Task[];
  tags: Tag[];
  onSelectTask: (taskId: number) => void;
  onLoadTasks: () => void | Promise<void>;
  onLoadTags: () => void | Promise<void>;
  exceptMessage: string;
};

function TaskPage({tasks, tags, onSelectTask, onLoadTasks, onLoadTags, exceptMessage}: TaskPageProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [sortMode, setSortMode] = useState<SortMode>("smart");
    const [selectedDeleteTask, setSelectedDeleteTask] = useState<Task | null>(null);
    const sortedTasks = sortTasks(tasks, sortMode);

    async function deleteTask(id: number) {
        try {
            await invoke("delete_task", {
                taskId: id
            });
        } catch (error) {
            console.error("Failed to load tags:", error);
        }
    }

    async function handleDelete() {
        if (selectedDeleteTask === null) {
            return;
        } else {
            deleteTask(selectedDeleteTask.id)
        }
        await onLoadTasks();
        setIsDeleteDialogOpen(false);
    }
    function handleCancel() {
        setIsDeleteDialogOpen(false);
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
                            <div className="task-info">
                                <div className="task-main">
                                    <h3 className="task-title">{task.title}</h3>
                                </div>

                                {task.description && (
                                    <div>
                                        <p className="task-description">{task.description}</p>
                                    </div>
                                )}
                                
                                {task.tags.length > 0 && (
                                    <div className="task-tags">
                                        {task.tags.map((tag) => (
                                            <span className="task-tag" key={tag.id}>
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}

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
                            <button 
                                className="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDeleteDialogOpen(true);
                                    setSelectedDeleteTask(task);
                                }}
                            >
                                <DeleteIcon/>
                            </button>
                        </article>
                        ))
                    ) : (
                        <p className="empty-tasks">{exceptMessage}</p>
                    )}
                </div>
                
            </section>

            {isDialogOpen && (
                <TaskDialog 
                tags={tags}
                onLoadTags={onLoadTags}
                onSave={async () => {
                    await onLoadTasks();
                    setIsDialogOpen(false);
                }}
                onClose={() => setIsDialogOpen(false)}
                />
            )}
            {isDeleteDialogOpen ? (
                <div className="overlay">
                    <div className="dialog">
                        <h2>Are you sure you want to delete "{selectedDeleteTask?.title}" task?</h2>
                        <div className="button-container">
                            <button onClick={handleDelete}>
                                Delete
                            </button>
                            <button onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                </div>
            )}
        </div>
    );
}

export default TaskPage;