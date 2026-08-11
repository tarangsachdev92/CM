export type Priority = "Critical" | "High" | "Medium" | "Low";

export interface Task {
  id: string;
  title: string;
  status?: "Open" | "Overdue" | "Completed";
  dueDate: string; // ISO date
  priority: Priority;
  assignee: string;
  source: string;
}
