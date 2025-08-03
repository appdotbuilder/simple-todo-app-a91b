
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTasksInput, type Task } from '../schema';
import { eq, lte, desc, and, type SQL } from 'drizzle-orm';

export const getTasks = async (input?: GetTasksInput): Promise<Task[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input?.completed !== undefined) {
      conditions.push(eq(tasksTable.completed, input.completed));
    }

    if (input?.priority) {
      conditions.push(eq(tasksTable.priority, input.priority));
    }

    if (input?.category) {
      conditions.push(eq(tasksTable.category, input.category));
    }

    if (input?.due_before) {
      conditions.push(lte(tasksTable.due_date, input.due_before));
    }

    // Build the final query
    const baseQuery = db.select().from(tasksTable);
    
    const queryWithFilters = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const finalQuery = queryWithFilters.orderBy(desc(tasksTable.created_at));

    const results = await finalQuery.execute();

    return results;
  } catch (error) {
    console.error('Get tasks failed:', error);
    throw error;
  }
};
