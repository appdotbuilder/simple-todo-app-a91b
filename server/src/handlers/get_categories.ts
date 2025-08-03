
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { isNotNull, sql } from 'drizzle-orm';

export const getCategories = async (): Promise<string[]> => {
  try {
    // Query for distinct categories that are not null
    const result = await db.select({
      category: tasksTable.category
    })
    .from(tasksTable)
    .where(isNotNull(tasksTable.category))
    .groupBy(tasksTable.category)
    .execute();

    // Extract category strings from the result
    return result.map(row => row.category as string);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};
