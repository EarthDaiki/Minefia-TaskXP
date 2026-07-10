import { Tag } from "./tag"

export type Task = {
  id: number;
  title: string;
  description: string | null;
  due_at: number | null;
  due_has_time: boolean;
  started_at: number | null;
  priority: number;
  difficulty: number;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  completed: number;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
  tags: Tag[];
};