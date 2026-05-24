"use client";

import { create } from "zustand";
import type { Column, Task } from "@/lib/types";

type BoardState = {
  columns: Column[];
  tasks: Task[];
  selectedTask: Task | null;
  draggingTask: Task | null;
  setBoard: (columns: Column[], tasks: Task[]) => void;
  setTasks: (tasks: Task[]) => void;
  moveTask: (taskId: string, columnId: string, position: number) => void;
  upsertTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  setSelectedTask: (task: Task | null) => void;
  setDraggingTask: (task: Task | null) => void;
};

export const useBoardStore = create<BoardState>((set) => ({
  columns: [],
  tasks: [],
  selectedTask: null,
  draggingTask: null,
  setBoard: (columns, tasks) => set({ columns, tasks }),
  setTasks: (tasks) => set({ tasks }),
  moveTask: (taskId, columnId, position) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, column_id: columnId, position } : task))
    })),
  upsertTask: (task) =>
    set((state) => ({
      tasks: state.tasks.some((item) => item.id === task.id)
        ? state.tasks.map((item) => (item.id === task.id ? { ...item, ...task } : item))
        : [...state.tasks, task]
    })),
  removeTask: (taskId) => set((state) => ({ tasks: state.tasks.filter((task) => task.id !== taskId) })),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setDraggingTask: (task) => set({ draggingTask: task })
}));
