const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Temporary in-memory task data
const tasks = [
  {
    id: 1,
    title: 'Set up project',
    description: 'Create the initial backend structure for the task manager app.',
    priority: 'high',
    completed: false,
  },
  {
    id: 2,
    title: 'Build task list API',
    description: 'Return tasks from a simple in-memory array for now.',
    priority: 'medium',
    completed: false,
  },
];

// Test route
app.get('/', (req, res) => {
  res.send('Task Manager API is running');
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

// Create a new task
app.post('/api/tasks', (req, res) => {
  const { title, description, priority } = req.body;

  // Title is required for every task
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Create a new unique numeric id
  const nextId = tasks.length > 0 ? Math.max(...tasks.map((task) => task.id)) + 1 : 1;

  const newTask = {
    id: nextId,
    title: title.trim(),
    description: description || '',
    priority: priority || 'medium',
    completed: false,
  };

  tasks.push(newTask);

  return res.status(201).json(newTask);
});

// Update an existing task
app.put('/api/tasks/:id', (req, res) => {
  const taskId = Number(req.params.id);
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, description, priority, completed } = req.body;

  // If title is provided, it cannot be empty
  if (title !== undefined && !title.trim()) {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  task.title = title !== undefined ? title.trim() : task.title;
  task.description = description !== undefined ? description : task.description;
  task.priority = priority !== undefined ? priority : task.priority;
  task.completed = completed !== undefined ? completed : task.completed;

  return res.status(200).json(task);
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = Number(req.params.id);
  const taskIndex = tasks.findIndex((item) => item.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks.splice(taskIndex, 1);

  return res.status(200).json({ message: 'Task deleted successfully' });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app };