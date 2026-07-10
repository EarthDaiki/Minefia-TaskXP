import type { View } from "./view";

export type SidebarInfo = Partial<Record<View, {
  count?: number;
  hasNotification?: boolean;
}>>;



