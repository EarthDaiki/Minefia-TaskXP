import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import TaskPage from "./components/TaskPage";
import TaskDetail from "./components/TaskDetail";
import Sidebar from "./components/Sidebar";
import type { View } from "./types/view";
import type { Task } from "./types/task";
import type { Tag } from "./types/tag";
import { getVisibleTasks } from "./utils/taskFilters";
import { SidebarInfo } from "./types/sidebarInfo";
import CalendarView from "./components/Calendar";
import TagManagementPage from "./components/TagManagementPage";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<View>("list");
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

  // console.log(tasks);

  useEffect(() => {
    getTasks();
    getTags();
  }, []);

  async function getTasks() {
    try {
      const loadedTasks = await invoke<Task[]>("get_tasks");
      setTasks(loadedTasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  }

  async function getTags() {
    try {
        const loadedTags = await invoke<Tag[]>("get_tags");
        setTags(loadedTags);
    } catch (error) {
        console.error("Failed to load tags:", error);
    }
  }

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  const listTasks = getVisibleTasks(tasks, "list", null);
  const todayTasks = getVisibleTasks(tasks, "today", null);
  const upcomingTasks = getVisibleTasks(tasks, "upcoming", null);
  const completedTasks = getVisibleTasks(tasks, "completed", null);
  const tagTasks = getVisibleTasks(tasks, "tag", selectedTagId);


  const sidebarInfo: SidebarInfo = {
    list: {
      count: listTasks.length,
    },
    today: {
      count: todayTasks.length,
      hasNotification: todayTasks.length > 0,
    },
    upcoming: {
      count: upcomingTasks.length,
    },
    completed: {
      count: completedTasks.length,
    }
  };

  const tagTaskCounts = new Map<number, number>();
  for (const task of tasks) {
    for (const tag of task.tags) {
      tagTaskCounts.set(tag.id, (tagTaskCounts.get(tag.id) ?? 0) + 1);
    }
  }

  function handleChangeView(view: View) {
    setCurrentView(view);
    setSelectedTaskId(null);
    setSelectedTagId(null);
  }

  function handleSelectedTagId(tagId: number) {
    setCurrentView("tag");
    setSelectedTaskId(null);
    setSelectedTagId(tagId);
  }

  function handleEventClick(task_id: number) {
    setSelectedTaskId(task_id);
  }

  async function reloadAfterTagDelete() {
    await getTags();
    await getTasks();
  }

  function renderCurrentView() {
    if (currentView === "list") {
      if (selectedTask) {
        return (
          <TaskDetail
            task={selectedTask}
            onBack={() => setSelectedTaskId(null)}
            onLoadTasks={getTasks}
          />
        );
      }
      return (
        <TaskPage
          tasks={listTasks}
          onSelectTask={(taskId: number) => setSelectedTaskId(taskId)}
          onLoadTasks={getTasks}
          exceptMessage="No tasks yet."
        />
      );
    }

    if (currentView === "today") {
      if (selectedTask) {
        return (
          <TaskDetail
            task={selectedTask}
            onBack={() => setSelectedTaskId(null)}
            onLoadTasks={getTasks}
          />
        );
      }
      return (
        <TaskPage
          tasks={todayTasks}
          onSelectTask={(taskId: number) => setSelectedTaskId(taskId)}
          onLoadTasks={getTasks}
          exceptMessage="No today's tasks."
        />
      );
    }

    if (currentView === "upcoming") {
      if (selectedTask) {
        return (
          <TaskDetail
            task={selectedTask}
            onBack={() => setSelectedTaskId(null)}
            onLoadTasks={getTasks}
          />
        );
      }
      return (
        <TaskPage
          tasks={upcomingTasks}
          onSelectTask={(taskId: number) => setSelectedTaskId(taskId)}
          onLoadTasks={getTasks}
          exceptMessage="No upcoming tasks."
        />
      )
    }

    if (currentView === "calendar") {
      if (selectedTask) {
        return (
          <TaskDetail
            task={selectedTask}
            onBack={() => setSelectedTaskId(null)}
            onLoadTasks={getTasks}
          />
        );
      }
      return (
        <CalendarView
          tasks={tasks}
          eventOnClick={handleEventClick}
        />
      )
    }

    if (currentView === "completed") {
      if (selectedTask) {
        return (
          <TaskDetail
            task={selectedTask}
            onBack={() => setSelectedTaskId(null)}
            onLoadTasks={getTasks}
          />
        );
      }
      return (
        <TaskPage
          tasks={completedTasks}
          onSelectTask={(taskId: number) => setSelectedTaskId(taskId)}
          onLoadTasks={getTasks}
          exceptMessage="No completed tasks."
        />
      )
    }
    // if (currentView === "ai-quick-add") {
    //   return(
    //     <p>This page is not available.</p>
    //   );
    // }

    // if (currentView === "ai-break-down") {
    //   return(
    //     <p>This page is not available.</p>
    //   );
    // }

    // if (currentView === "ai-prioritize") {
    //   return(
    //     <p>This page is not available.</p>
    //   );
    // }
    if (currentView === "tag") {
      if (selectedTask) {
        return (
          <TaskDetail
            task={selectedTask}
            onBack={() => setSelectedTaskId(null)}
            onLoadTasks={getTasks}
          />
        );
      }
      return (
        <TaskPage
          tasks={tagTasks}
          onSelectTask={(taskId: number) => setSelectedTaskId(taskId)}
          onLoadTasks={getTasks}
          exceptMessage="No tasks for this tag."
        />
      )
    }

    // if (currentView === "settings") {
    //   return (
    //     <p>This page is not available.</p>
    //   )
    // }

    if (currentView === "tag-management") {
      return (
        <TagManagementPage 
          tags={tags}
          onLoadTags={reloadAfterTagDelete}
        />
      )
    }

    return <p>This page is not available.</p>;
  }

  return (
    <main className="container">
      <Sidebar
        currentView={currentView}
        onSelectView={handleChangeView}
        selectedTagId={selectedTagId}
        onSelectTagId={handleSelectedTagId}
        info={sidebarInfo}
        tags={tags}
        tagTaskCounts={tagTaskCounts}
      />
      <section className="app-content">
        {renderCurrentView()}
      </section>
    </main>
  );
}

export default App;
