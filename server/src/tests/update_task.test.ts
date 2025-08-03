
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a test task directly in database
  const createTestTask = async () => {
    const result = await db.insert(tasksTable)
      .values({
        title: 'Original Task',
        description: 'Original description',
        priority: 'low',
        category: 'work',
        due_date: new Date('2024-12-31'),
        completed: false
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update a task with all fields', async () => {
    const originalTask = await createTestTask();
    const newDueDate = new Date('2025-01-15');
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Updated Task',
      description: 'Updated description',
      completed: true,
      priority: 'high',
      category: 'personal',
      due_date: newDueDate
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(originalTask.id);
    expect(result.title).toEqual('Updated Task');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.priority).toEqual('high');
    expect(result.category).toEqual('personal');
    expect(result.due_date).toEqual(newDueDate);
    expect(result.created_at).toEqual(originalTask.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTask.updated_at.getTime());
  });

  it('should update only specified fields', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Partially Updated',
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.title).toEqual('Partially Updated');
    expect(result.completed).toEqual(true);
    // Other fields should remain unchanged
    expect(result.description).toEqual(originalTask.description);
    expect(result.priority).toEqual(originalTask.priority);
    expect(result.category).toEqual(originalTask.category);
    expect(result.due_date).toEqual(originalTask.due_date);
  });

  it('should handle nullable fields correctly', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      description: null,
      category: null,
      due_date: null
    };

    const result = await updateTask(updateInput);

    expect(result.description).toBeNull();
    expect(result.category).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.title).toEqual(originalTask.title); // Should remain unchanged
  });

  it('should persist changes to database', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Database Test',
      priority: 'high'
    };

    await updateTask(updateInput);

    // Verify changes in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, originalTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Test');
    expect(tasks[0].priority).toEqual('high');
    expect(tasks[0].updated_at.getTime()).toBeGreaterThan(originalTask.updated_at.getTime());
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999,
      title: 'This should fail'
    };

    expect(updateTask(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should always update the updated_at timestamp', async () => {
    const originalTask = await createTestTask();
    
    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: originalTask.title // Same title, but should still update timestamp
    };

    const result = await updateTask(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalTask.updated_at.getTime());
  });
});
