
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const toggleTaskCompletion = async (input: ToggleTaskInput): Promise<Task> => {
  try {
    // First, get the current task to determine its completion status
    const existingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (existingTasks.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    const existingTask = existingTasks[0];

    // Toggle the completion status and update the task
    const result = await db.update(tasksTable)
      .set({
        completed: !existingTask.completed,
        updated_at: new Date()
      })
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task toggle completion failed:', error);
    throw error;
  }
};
