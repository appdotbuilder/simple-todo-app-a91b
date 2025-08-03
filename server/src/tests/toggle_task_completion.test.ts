
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskInput, type CreateTaskInput } from '../schema';
import { toggleTaskCompletion } from '../handlers/toggle_task_completion';
import { eq } from 'drizzle-orm';

const testTaskInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  priority: 'medium',
  category: 'test',
  due_date: null
};

describe('toggleTaskCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle task from incomplete to complete', async () => {
    // Create a task (defaults to completed: false)
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testTaskInput.title,
        description: testTaskInput.description,
        priority: testTaskInput.priority,
        category: testTaskInput.category,
        due_date: testTaskInput.due_date
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;
    expect(createdTask[0].completed).toBe(false);

    const toggleInput: ToggleTaskInput = { id: taskId };
    const result = await toggleTaskCompletion(toggleInput);

    // Task should now be completed
    expect(result.id).toEqual(taskId);
    expect(result.completed).toBe(true);
    expect(result.title).toEqual(testTaskInput.title);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should toggle task from complete to incomplete', async () => {
    // Create a completed task
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testTaskInput.title,
        description: testTaskInput.description,
        priority: testTaskInput.priority,
        category: testTaskInput.category,
        due_date: testTaskInput.due_date,
        completed: true
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;
    expect(createdTask[0].completed).toBe(true);

    const toggleInput: ToggleTaskInput = { id: taskId };
    const result = await toggleTaskCompletion(toggleInput);

    // Task should now be incomplete
    expect(result.id).toEqual(taskId);
    expect(result.completed).toBe(false);
    expect(result.title).toEqual(testTaskInput.title);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Create a task
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testTaskInput.title,
        description: testTaskInput.description,
        priority: testTaskInput.priority,
        category: testTaskInput.category,
        due_date: testTaskInput.due_date
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;
    const originalUpdatedAt = createdTask[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const toggleInput: ToggleTaskInput = { id: taskId };
    const result = await toggleTaskCompletion(toggleInput);

    // updated_at should be newer
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should save changes to database', async () => {
    // Create a task
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testTaskInput.title,
        description: testTaskInput.description,
        priority: testTaskInput.priority,
        category: testTaskInput.category,
        due_date: testTaskInput.due_date
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;
    const toggleInput: ToggleTaskInput = { id: taskId };
    
    await toggleTaskCompletion(toggleInput);

    // Verify the change was persisted in the database
    const updatedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(updatedTasks).toHaveLength(1);
    expect(updatedTasks[0].completed).toBe(true);
    expect(updatedTasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent task', async () => {
    const toggleInput: ToggleTaskInput = { id: 999 };
    
    await expect(toggleTaskCompletion(toggleInput))
      .rejects.toThrow(/task with id 999 not found/i);
  });
});
