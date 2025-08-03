
import { z } from 'zod';

// Priority levels for tasks
export const prioritySchema = z.enum(['low', 'medium', 'high']);
export type Priority = z.infer<typeof prioritySchema>;

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  completed: z.boolean(),
  priority: prioritySchema,
  category: z.string().nullable(),
  due_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  priority: prioritySchema.default('medium'),
  category: z.string().nullable(),
  due_date: z.coerce.date().nullable()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  priority: prioritySchema.optional(),
  category: z.string().nullable().optional(),
  due_date: z.coerce.date().nullable().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for deleting tasks
export const deleteTaskInputSchema = z.object({
  id: z.number()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;

// Input schema for toggling task completion
export const toggleTaskInputSchema = z.object({
  id: z.number()
});

export type ToggleTaskInput = z.infer<typeof toggleTaskInputSchema>;

// Schema for filtering tasks
export const getTasksInputSchema = z.object({
  completed: z.boolean().optional(),
  priority: prioritySchema.optional(),
  category: z.string().optional(),
  due_before: z.coerce.date().optional()
}).optional();

export type GetTasksInput = z.infer<typeof getTasksInputSchema>;
