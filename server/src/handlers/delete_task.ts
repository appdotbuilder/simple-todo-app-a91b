
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (input: DeleteTaskInput): Promise<{ success: boolean }> => {
  try {
    // Attempt to delete the task by ID
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    // Return success based on whether a task was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};
