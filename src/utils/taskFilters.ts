import type { View } from "../types/view";
import type { Task } from "../types/task";

export function getVisibleTasks(tasks: Task[], view: View, tagId: number | null) {
    if (view === "list") {
        return tasks.filter((task) => task.completed === 0);
    }
    if (view === "completed") {
        return tasks.filter((task) => task.completed === 1);
    }

    if (view === "today" || view === "upcoming") {
        return tasks.filter((task) => {
            if (task.completed === 1 || task.due_at === null) {
                return false;
            }

            const dueDate = new Date(task.due_at * 1000);
            const now = new Date();

            if (view === "today") {
                return dueDate.toDateString() === now.toDateString();
            }

            if (view === "upcoming") {
                return dueDate > now;
            }
            return false;
        });
    }

    if (view === "tag") {
        if (tagId === null) {
            return [];
        }
        return tasks.filter((task) => {
            if (task.completed !== 0) {
                return false;
            }
            return task.tags.some((tag) => tag.id === tagId)
        })
    }

    return [];
}