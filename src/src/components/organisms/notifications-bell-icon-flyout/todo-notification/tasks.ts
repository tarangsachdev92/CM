import { Task } from "./types";

export const tasks: Task[] = [
  {
    id: "1",
    title: "Finalize Q3 Report",
    status: "Overdue",
    dueDate: "2025-07-30",
    priority: "High",
    assignee: "Meghana",
    source: "Email"
  },
  {
    id: "2",
    title: "Team Meeting",
    status: "Open",
    dueDate: "2025-08-06",
    priority: "Medium",
    assignee: "Pavithra",
    source: "Calendar"
  },
  {
    id: "3",
    title: "Code Review",
    status: "Completed",
    dueDate: "2025-08-01",
    priority: "Low",
    assignee: "Latesh",
    source: "Jira"
  },
  {
    id: "4",
    title: "Client Feedback",
    status: "Overdue",
    dueDate: "2025-07-28",
    priority: "Critical",
    assignee: "Meghana",
    source: "Slack"
  }
];
