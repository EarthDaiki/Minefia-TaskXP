export const sidebarSections = [
  {
    id: "tasks",
    label: "Tasks",
    items: [
      { value: "list", label: "List", showCount: true, showNotification: false },
      { value: "today", label: "Today", showCount: true, showNotification: true },
      { value: "upcoming", label: "Upcoming", showCount: true, showNotification: false },
      { value: "calendar", label: "Calendar", showCount: false, showNotification: false },
      { value: "completed", label: "Completed", showCount: true, showNotification: false },
    ],
  },
  {
    id: "ai",
    label: "AI Agent",
    items: [
      { value: "ai-quick-add", label: "Quick Add", showCount: false, showNotification: false },
      // { value: "ai-break-down", label: "Break Down", showCount: false, showNotification: false },
      // { value: "ai-prioritize", label: "Prioritize", showCount: false, showNotification: false },
    ],
  },
  {
    id: "tags",
    label: "Tags",
    items: [
      { value: "tag", label: "Tags", showCount: false, showNotification: false },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      { value: "settings", label: "Settings", showCount: false, showNotification: false },
    ],
  },
] as const;

export type View = (typeof sidebarSections)[number]["items"][number]["value"];
export type sidebarSectionId = (typeof sidebarSections)[number]["id"];