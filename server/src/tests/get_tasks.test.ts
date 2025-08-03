
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTasksInput, type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';
import { eq } from 'drizzle-orm';

// Helper function to create test tasks
const createTestTask = async (task: CreateTaskInput) => {
  const result = await db.insert(tasksTable)
    .values({
      title: task.title,
      description: task.description,
      priority: task.priority || 'medium',
      category: task.category,
      due_date: task.due_date
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all tasks when no filters provided', async () => {
    // Create test tasks
    await createTestTask({
      title: 'Task 1',
      description: 'First task',
      priority: 'high',
      category: 'work',
      due_date: null
    });
    
    await createTestTask({
      title: 'Task 2',
      description: 'Second task',
      priority: 'low',
      category: 'personal',
      due_date: null
    });

    const result = await getTasks();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Task 2'); // Newest first due to ordering
    expect(result[1].title).toEqual('Task 1');
  });

  it('should filter tasks by completion status', async () => {
    // Create completed and incomplete tasks
    const completedTask = await createTestTask({
      title: 'Completed Task',
      description: 'This is done',
      priority: 'medium',
      category: 'work',
      due_date: null
    });

    const incompleteTask = await createTestTask({
      title: 'Incomplete Task',
      description: 'This is not done',
      priority: 'medium',
      category: 'work',
      due_date: null
    });

    // Mark one task as completed
    await db.update(tasksTable)
      .set({ completed: true })
      .where(eq(tasksTable.id, completedTask.id))
      .execute();

    // Filter for completed tasks
    const completedTasks = await getTasks({ completed: true });
    expect(completedTasks).toHaveLength(1);
    expect(completedTasks[0].title).toEqual('Completed Task');
    expect(completedTasks[0].completed).toBe(true);

    // Filter for incomplete tasks
    const incompleteTasks = await getTasks({ completed: false });
    expect(incompleteTasks).toHaveLength(1);
    expect(incompleteTasks[0].title).toEqual('Incomplete Task');
    expect(incompleteTasks[0].completed).toBe(false);
  });

  it('should filter tasks by priority', async () => {
    await createTestTask({
      title: 'High Priority Task',
      description: 'Important task',
      priority: 'high',
      category: 'work',
      due_date: null
    });

    await createTestTask({
      title: 'Low Priority Task',
      description: 'Less important task',
      priority: 'low',
      category: 'personal',
      due_date: null
    });

    const highPriorityTasks = await getTasks({ priority: 'high' });
    expect(highPriorityTasks).toHaveLength(1);
    expect(highPriorityTasks[0].title).toEqual('High Priority Task');
    expect(highPriorityTasks[0].priority).toEqual('high');
  });

  it('should filter tasks by category', async () => {
    await createTestTask({
      title: 'Work Task',
      description: 'Office work',
      priority: 'medium',
      category: 'work',
      due_date: null
    });

    await createTestTask({
      title: 'Personal Task',
      description: 'Personal stuff',
      priority: 'medium',
      category: 'personal',
      due_date: null
    });

    const workTasks = await getTasks({ category: 'work' });
    expect(workTasks).toHaveLength(1);
    expect(workTasks[0].title).toEqual('Work Task');
    expect(workTasks[0].category).toEqual('work');
  });

  it('should filter tasks by due date', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    await createTestTask({
      title: 'Due Tomorrow',
      description: 'Due soon',
      priority: 'medium',
      category: 'work',
      due_date: tomorrow
    });

    await createTestTask({
      title: 'Due Next Week',
      description: 'Due later',
      priority: 'medium',
      category: 'work',
      due_date: nextWeek
    });

    // Filter for tasks due before next week
    const dueSoonTasks = await getTasks({ due_before: new Date(nextWeek.getTime() - 1000) });
    expect(dueSoonTasks).toHaveLength(1);
    expect(dueSoonTasks[0].title).toEqual('Due Tomorrow');
  });

  it('should apply multiple filters correctly', async () => {
    await createTestTask({
      title: 'High Priority Work Task',
      description: 'Important work task',
      priority: 'high',
      category: 'work',
      due_date: null
    });

    await createTestTask({
      title: 'High Priority Personal Task',
      description: 'Important personal task',
      priority: 'high',
      category: 'personal',
      due_date: null
    });

    await createTestTask({
      title: 'Low Priority Work Task',
      description: 'Less important work task',
      priority: 'low',
      category: 'work',
      due_date: null
    });

    const filteredTasks = await getTasks({
      priority: 'high',
      category: 'work'
    });

    expect(filteredTasks).toHaveLength(1);
    expect(filteredTasks[0].title).toEqual('High Priority Work Task');
    expect(filteredTasks[0].priority).toEqual('high');
    expect(filteredTasks[0].category).toEqual('work');
  });

  it('should return tasks ordered by creation date (newest first)', async () => {
    // Create tasks with slight delay to ensure different timestamps
    const task1 = await createTestTask({
      title: 'First Task',
      description: 'Created first',
      priority: 'medium',
      category: 'work',
      due_date: null
    });

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const task2 = await createTestTask({
      title: 'Second Task',
      description: 'Created second',
      priority: 'medium',
      category: 'work',
      due_date: null
    });

    const result = await getTasks();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Second Task'); // Newest first
    expect(result[1].title).toEqual('First Task');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should return empty array when no tasks match filters', async () => {
    await createTestTask({
      title: 'Work Task',
      description: 'Office work',
      priority: 'medium',
      category: 'work',
      due_date: null
    });

    const result = await getTasks({ category: 'nonexistent' });
    expect(result).toHaveLength(0);
  });
});
