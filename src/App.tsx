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
import QuickAddTaskPage from "./components/AIQuickAddPage";
import SettingsPage from "./components/SettingsPage";
import type { SettingsPageId, ApiKeyPageId} from "./types/settingPage";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<View>("list");
  const [settingsInitialPage, setSettingsInitialPage] =
    useState<SettingsPageId>("root");

  const [apiKeyInitialPage, setApiKeyInitialPage] =
    useState<ApiKeyPageId>("root");
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
    if (task.completed !== 0) {
      continue;
    }
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
  function openAddApiKeyPage() {
    setSettingsInitialPage("api_keys");
    setApiKeyInitialPage("add_api_key");
    setCurrentView("settings");
  }

  function renderCurrentView() {
    if (currentView === "list") {
      if (selectedTask) {
        return (
          <TaskDetail
            task={selectedTask}
            tags={tags}
            onBack={() => setSelectedTaskId(null)}
            onLoadTasks={getTasks}
            onLoadTags={getTags}
          />
        );
      }
      return (
        <TaskPage
          tasks={listTasks}
          tags={tags}
          onSelectTask={(taskId: number) => setSelectedTaskId(taskId)}
          onLoadTasks={getTasks}
          onLoadTags={getTags}
          exceptMessage="No tasks yet."
        />
      );
    }

    if (currentView === "today") {
      if (selectedTask) {
        return (
          <TaskDetail
            task={selectedTask}
            tags={tags}
            onBack={() => setSelectedTaskId(null)}
            onLoadTasks={getTasks}
            onLoadTags={getTags}
          />
        );
      }
      return (
        <TaskPage
          tasks={todayTasks}
          tags={tags}
          onSelectTask={(taskId: number) => setSelectedTaskId(taskId)}
          onLoadTasks={getTasks}
          onLoadTags={getTags}
          exceptMessage="No today's tasks."
        />
      );
    }

    if (currentView === "upcoming") {
      if (selectedTask) {
        return (
          <TaskDetail
            task={selectedTask}
            tags={tags}
            onBack={() => setSelectedTaskId(null)}
            onLoadTasks={getTasks}
            onLoadTags={getTags}
          />
        );
      }
      return (
        <TaskPage
          tasks={upcomingTasks}
          tags={tags}
          onSelectTask={(taskId: number) => setSelectedTaskId(taskId)}
          onLoadTasks={getTasks}
          onLoadTags={getTags}
          exceptMessage="No upcoming tasks."
        />
      )
    }

    if (currentView === "calendar") {
      if (selectedTask) {
        return (
          <TaskDetail
            task={selectedTask}
            tags={tags}
            onBack={() => setSelectedTaskId(null)}
            onLoadTasks={getTasks}
            onLoadTags={getTags}
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
            tags={tags}
            onBack={() => setSelectedTaskId(null)}
            onLoadTasks={getTasks}
            onLoadTags={getTags}
          />
        );
      }
      return (
        <TaskPage
          tasks={completedTasks}
          tags={tags}
          onSelectTask={(taskId: number) => setSelectedTaskId(taskId)}
          onLoadTasks={getTasks}
          onLoadTags={getTags}
          exceptMessage="No completed tasks."
        />
      )
    }
    if (currentView === "ai-quick-add") {
      return(
        <QuickAddTaskPage
          tags={tags}
          onLoadTasks={getTasks}
          onLoadTags={getTags}
          onAddApiKey={openAddApiKeyPage}
        />
      );
    }

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
            tags={tags}
            onBack={() => setSelectedTaskId(null)}
            onLoadTasks={getTasks}
            onLoadTags={getTags}
          />
        );
      }
      return (
        <TaskPage
          tasks={tagTasks}
          tags={tags}
          onSelectTask={(taskId: number) => setSelectedTaskId(taskId)}
          onLoadTasks={getTasks}
          onLoadTags={getTags}
          exceptMessage="No tasks for this tag."
        />
      )
    }

    if (currentView === "settings") {
      return (
        <SettingsPage 
          tags={tags}
          initialPage={settingsInitialPage}
          initialApiKeyPage={apiKeyInitialPage}
          onLoadTags={async () => {
            await getTags()
            await getTasks()
          }}
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
