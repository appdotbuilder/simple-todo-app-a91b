
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test input for creating a task to delete
const testCreateInput: CreateTaskInput = {
  title: 'Task to Delete',
  description: 'This task will be deleted in tests',
  priority: 'high',
  category: 'test',
  due_date: null
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a task first
    const createResult = await db.insert(tasksTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description,
        priority: testCreateInput.priority,
        category: testCreateInput.category,
        due_date: testCreateInput.due_date
      })
      .returning()
      .execute();

    const createdTask = createResult[0];
    const deleteInput: DeleteTaskInput = { id: createdTask.id };

    // Delete the task
    const result = await deleteTask(deleteInput);

    // Should return success
    expect(result.success).toBe(true);

    // Verify task was actually deleted from database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return false for non-existent task', async () => {
    const deleteInput: DeleteTaskInput = { id: 9999 };

    // Attempt to delete non-existent task
    const result = await deleteTask(deleteInput);

    // Should return failure
    expect(result.success).toBe(false);
  });

  it('should not affect other tasks when deleting', async () => {
    // Create multiple tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        priority: 'low',
        category: 'work',
        due_date: null
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task',
        priority: 'medium',
        category: 'personal',
        due_date: null
      })
      .returning()
      .execute();

    const task1 = task1Result[0];
    const task2 = task2Result[0];

    // Delete only the first task
    const deleteInput: DeleteTaskInput = { id: task1.id };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify first task is deleted
    const deletedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task1.id))
      .execute();

    expect(deletedTasks).toHaveLength(0);

    // Verify second task still exists
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task2.id))
      .execute();

    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].title).toEqual('Task 2');
  });
});
