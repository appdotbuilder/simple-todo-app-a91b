
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Edit3, Plus, Trash2, Filter, X } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Task, CreateTaskInput, UpdateTaskInput, Priority, GetTasksInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form state for creating tasks
  const [createFormData, setCreateFormData] = useState<CreateTaskInput>({
    title: '',
    description: null,
    priority: 'medium',
    category: null,
    due_date: null
  });

  // Form state for editing tasks
  const [editFormData, setEditFormData] = useState<UpdateTaskInput>({
    id: 0,
    title: '',
    description: null,
    priority: 'medium',
    category: null,
    due_date: null
  });

  const loadTasks = useCallback(async () => {
    try {
      // Build filter parameters with proper typing
      const filters: GetTasksInput = {};
      if (statusFilter !== 'all') {
        filters.completed = statusFilter === 'completed';
      }
      if (priorityFilter !== 'all') {
        filters.priority = priorityFilter;
      }
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }

      const result = await trpc.getTasks.query(Object.keys(filters).length > 0 ? filters : undefined);
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, [statusFilter, priorityFilter, categoryFilter]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadCategories();
  }, [loadTasks, loadCategories]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.title.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.createTask.mutate(createFormData);
      setTasks((prev: Task[]) => [response, ...prev]);
      setCreateFormData({
        title: '',
        description: null,
        priority: 'medium',
        category: null,
        due_date: null
      });
      setIsCreateDialogOpen(false);
      loadCategories(); // Refresh categories in case a new one was added
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title?.trim() || !editingTask) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.updateTask.mutate(editFormData);
      setTasks((prev: Task[]) => prev.map((task: Task) => 
        task.id === response.id ? response : task
      ));
      setIsEditDialogOpen(false);
      setEditingTask(null);
      loadCategories(); // Refresh categories in case a new one was added
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (taskId: number) => {
    try {
      const response = await trpc.toggleTaskCompletion.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.map((task: Task) => 
        task.id === taskId ? response : task
      ));
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      due_date: task.due_date
    });
    setIsEditDialogOpen(true);
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString();
  };

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const completedTasks = tasks.filter((task: Task) => task.completed);
  const pendingTasks = tasks.filter((task: Task) => !task.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✅ Task Manager</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/70 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-800">{tasks.length}</p>
                </div>
                <div className="text-3xl">📋</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingTasks.length}</p>
                </div>
                <div className="text-3xl">⏳</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Create Task Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <Input
                  placeholder="Task title *"
                  value={createFormData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={createFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateTaskInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={createFormData.priority}
                    onValueChange={(value: Priority) =>
                      setCreateFormData((prev: CreateTaskInput) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="high">🔴 High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Category"
                    value={createFormData.category || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateTaskInput) => ({
                        ...prev,
                        category: e.target.value || null
                      }))
                    }
                  />
                </div>
                <Input
                  type="date"
                  placeholder="Due date"
                  value={createFormData.due_date ? new Date(createFormData.due_date).toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateTaskInput) => ({
                      ...prev,
                      due_date: e.target.value ? new Date(e.target.value) : null
                    }))
                  }
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Task'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={(value: 'all' | 'completed' | 'pending') => setStatusFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value: Priority | 'all') => setPriorityFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">🔴 High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">🟢 Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter || 'all'} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                }}
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Tasks Display */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">All Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <TaskList 
              tasks={tasks} 
              onToggleComplete={handleToggleComplete}
              onEdit={openEditDialog}
              onDelete={handleDeleteTask}
              getPriorityColor={getPriorityColor}
              getPriorityIcon={getPriorityIcon}
              formatDate={formatDate}
              isOverdue={isOverdue}
            />
          </TabsContent>
          
          <TabsContent value="pending">
            <TaskList 
              tasks={pendingTasks} 
              onToggleComplete={handleToggleComplete}
              onEdit={openEditDialog}
              onDelete={handleDeleteTask}
              getPriorityColor={getPriorityColor}
              getPriorityIcon={getPriorityIcon}
              formatDate={formatDate}
              isOverdue={isOverdue}
            />
          </TabsContent>
          
          <TabsContent value="completed">
            <TaskList 
              tasks={completedTasks} 
              onToggleComplete={handleToggleComplete}
              onEdit={openEditDialog}
              onDelete={handleDeleteTask}
              getPriorityColor={getPriorityColor}
              getPriorityIcon={getPriorityIcon}
              formatDate={formatDate}
              isOverdue={isOverdue}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <Input
                placeholder="Task title *"
                value={editFormData.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateTaskInput) => ({ ...prev, title: e.target.value }))
                }
                required
              />
              <Textarea
                placeholder="Description (optional)"
                value={editFormData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateTaskInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={editFormData.priority || 'medium'}
                  onValueChange={(value: Priority) =>
                    setEditFormData((prev: UpdateTaskInput) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🔴 High</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Category"
                  value={editFormData.category || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateTaskInput) => ({
                      ...prev,
                      category: e.target.value || null
                    }))
                  }
                />
              </div>
              <Input
                type="date"
                placeholder="Due date"
                value={editFormData.due_date ? new Date(editFormData.due_date).toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateTaskInput) => ({
                    ...prev,
                    due_date: e.target.value ? new Date(e.target.value) : null
                  }))
                }
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  getPriorityColor: (priority: Priority) => string;
  getPriorityIcon: (priority: Priority) => string;
  formatDate: (date: Date | null) => string | null;
  isOverdue: (date: Date | null) => boolean;
}

function TaskList({ 
  tasks, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  getPriorityColor, 
  getPriorityIcon, 
  formatDate,
  isOverdue 
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Card className="bg-white/70 backdrop-blur text-center py-12">
        <CardContent>
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-500 text-lg">No tasks found</p>
          <p className="text-gray-400">Create your first task to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task: Task) => (
        <Card key={task.id} className={`bg-white/70 backdrop-blur transition-all hover:shadow-md ${task.completed ? 'opacity-75' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center pt-1">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleComplete(task.id)}
                  className="w-5 h-5"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                        {getPriorityIcon(task.priority)} {task.priority}
                      </Badge>
                      
                      {task.category && (
                        <Badge variant="outline" className="text-xs">
                          🏷️ {task.category}
                        </Badge>
                      )}
                      
                      {task.due_date && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${isOverdue(task.due_date) ? 'border-red-300 text-red-700 bg-red-50' : ''}`}
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(task.due_date)}
                          {isOverdue(task.due_date) && ' (Overdue)'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(task)}
                      disabled={task.completed}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Task</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{task.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(task.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>Created: {formatDate(task.created_at)}</span>
                  {task.updated_at.getTime() !== task.created_at.getTime() && (
                    <span>Updated: {formatDate(task.updated_at)}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default App;
