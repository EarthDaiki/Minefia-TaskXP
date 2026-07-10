import type { SortMode } from "../types/sort";
import type { Task } from "../types/task";

export function sortTasks(tasks: Task[], sortOption: SortMode) {
    const sortedTasks = [...tasks];
    if (sortOption === "smart") {
        return sortedTasks;
    }
    if (sortOption === "due-asc") {
        sortedTasks.sort((a, b) => {
            if (a.due_at === null && b.due_at === null) {
                return 0;
            }
            if (a.due_at === null) {
                return 1;
            }
            if (b.due_at === null) {
                return -1;
            }
            return a.due_at - b.due_at;
        });
        return sortedTasks;
    }

    if (sortOption === "due-desc") {
        sortedTasks.sort((a, b) => {
            if (a.due_at === null && b.due_at === null) {
                return 0;
            }
            if (a.due_at === null) {
                return 1;
            }
            if (b.due_at === null) {
                return -1;
            }
            return b.due_at - a.due_at;
        });
        return sortedTasks;
    }

    if (sortOption === "priority-desc") {
        sortedTasks.sort((a, b) => {
            return b.priority - a.priority;
        });
        return sortedTasks;
    }

    if (sortOption === "difficulty-desc") {
        sortedTasks.sort((a, b) => {
            return b.difficulty - a.difficulty;
        })
        return sortedTasks;
    }

    if (sortOption === "created-asc") {
        sortedTasks.sort((a, b) => {
            return a.created_at - b.created_at;
        })
        return sortedTasks;
    }

    if (sortOption === "created-desc") {
        sortedTasks.sort((a, b) => {
            return b.created_at - a.created_at;
        })
        return sortedTasks;
    }
    return [];
}