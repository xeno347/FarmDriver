import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Task {
  id: string;
  title: string;
  field: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in progress' | 'completed';
  vehicle: string;
  startTime: string;
  duration: string;
  instructions: string;
}

interface TasksContextProps {
  tasks: Task[];
  activeTask: Task | null;
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
}

const mockTasks: Task[] = [
  {
    id: 'TSK-001',
    title: 'Field Ploughing - North Section',
    field: 'Field A2',
    type: 'Ploughing',
    priority: 'high',
    status: 'pending',
    vehicle: 'TRC-2024-01',
    startTime: '08:00',
    duration: '4 hours',
    instructions: 'Prepare field for wheat sowing',
  },
];

const TasksContext = createContext<TasksContextProps | undefined>(undefined);

export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const startTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: 'in progress' } : t
      )
    );
    setActiveTask(tasks.find((t) => t.id === taskId) || null);
  };

  const completeTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: 'completed' } : t
      )
    );
    setActiveTask(null);
  };

  return (
    <TasksContext.Provider value={{ tasks, activeTask, startTask, completeTask }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) throw new Error('useTasks must be used within TasksProvider');
  return context;
};
