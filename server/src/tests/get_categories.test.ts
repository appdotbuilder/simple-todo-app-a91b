
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getCategories();
    expect(result).toEqual([]);
  });

  it('should return unique categories from tasks', async () => {
    // Create tasks with different categories
    await db.insert(tasksTable).values([
      {
        title: 'Task 1',
        category: 'work',
        priority: 'medium'
      },
      {
        title: 'Task 2', 
        category: 'personal',
        priority: 'high'
      },
      {
        title: 'Task 3',
        category: 'work', // Duplicate category
        priority: 'low'
      }
    ]).execute();

    const result = await getCategories();
    
    expect(result).toHaveLength(2);
    expect(result).toContain('work');
    expect(result).toContain('personal');
  });

  it('should exclude null categories', async () => {
    // Create tasks with mix of categories and null values
    await db.insert(tasksTable).values([
      {
        title: 'Task 1',
        category: 'work',
        priority: 'medium'
      },
      {
        title: 'Task 2',
        category: null, // Should be excluded
        priority: 'high'
      },
      {
        title: 'Task 3',
        category: 'personal',
        priority: 'low'
      }
    ]).execute();

    const result = await getCategories();
    
    expect(result).toHaveLength(2);
    expect(result).toContain('work');
    expect(result).toContain('personal');
    expect(result).not.toContain(null);
  });

  it('should return categories in consistent order', async () => {
    // Create tasks with categories
    await db.insert(tasksTable).values([
      {
        title: 'Task 1',
        category: 'zebra',
        priority: 'medium'
      },
      {
        title: 'Task 2',
        category: 'apple',
        priority: 'high'
      },
      {
        title: 'Task 3',
        category: 'banana',
        priority: 'low'
      }
    ]).execute();

    const result1 = await getCategories();
    const result2 = await getCategories();
    
    // Results should be consistent between calls
    expect(result1).toEqual(result2);
    expect(result1).toHaveLength(3);
  });

  it('should handle empty string categories', async () => {
    // Create task with empty string category
    await db.insert(tasksTable).values([
      {
        title: 'Task 1',
        category: '',
        priority: 'medium'
      },
      {
        title: 'Task 2',
        category: 'work',
        priority: 'high'
      }
    ]).execute();

    const result = await getCategories();
    
    expect(result).toHaveLength(2);
    expect(result).toContain('');
    expect(result).toContain('work');
  });
});
