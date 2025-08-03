
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  priority: 'high',
  category: 'work',
  due_date: new Date('2024-12-31')
};

// Test input with minimal fields
const minimalInput: CreateTaskInput = {
  title: 'Minimal Task',
  description: null,
  priority: 'medium', // Default value
  category: null,
  due_date: null
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with all fields', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toEqual(false); // Default value
    expect(result.priority).toEqual('high');
    expect(result.category).toEqual('work');
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with minimal fields', async () => {
    const result = await createTask(minimalInput);

    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.priority).toEqual('medium');
    expect(result.category).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    const savedTask = tasks[0];
    expect(savedTask.title).toEqual('Test Task');
    expect(savedTask.description).toEqual('A task for testing');
    expect(savedTask.completed).toEqual(false);
    expect(savedTask.priority).toEqual('high');
    expect(savedTask.category).toEqual('work');
    expect(savedTask.due_date).toEqual(new Date('2024-12-31'));
    expect(savedTask.created_at).toBeInstanceOf(Date);
    expect(savedTask.updated_at).toBeInstanceOf(Date);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreate = new Date();
    const result = await createTask(testInput);
    const afterCreate = new Date();

    expect(result.created_at >= beforeCreate).toBe(true);
    expect(result.created_at <= afterCreate).toBe(true);
    expect(result.updated_at >= beforeCreate).toBe(true);
    expect(result.updated_at <= afterCreate).toBe(true);
  });

  it('should handle different priority levels', async () => {
    const lowPriorityInput: CreateTaskInput = {
      ...testInput,
      priority: 'low'
    };

    const result = await createTask(lowPriorityInput);
    expect(result.priority).toEqual('low');
  });
});
