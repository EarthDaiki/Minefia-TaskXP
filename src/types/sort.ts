export const sortOptions = [
  { value: "smart", label: "Smart" },
  { value: "due-asc", label: "Due Date ↑" },
  { value: "due-desc", label: "Due Date ↓" },
  { value: "priority-desc", label: "Priority" },
  { value: "difficulty-desc", label: "Difficulty" },
  { value: "created-desc", label: "Newest" },
  { value: "created-asc", label: "Oldest" },
] as const;

export type SortMode = (typeof sortOptions)[number]["value"];