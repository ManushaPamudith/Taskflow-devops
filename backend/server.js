const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const taskSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    priority: { type: String, default: 'medium' },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

taskSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = document.id;
    delete returnedObject._id;
    delete returnedObject.__v;
    return returnedObject;
  },
});

const Task = mongoose.model('Task', taskSchema);

async function connectToDatabase() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }

 try {
  await mongoose.connect(MONGODB_URI, {
    family: 4
  });

  console.log('Database:', mongoose.connection.name);
  console.log('Connected to MongoDB successfully.');

} catch (error) {
  console.error('MongoDB connection failed:', error.message);
  process.exit(1);
}
}

// Test route
app.get('/', (req, res) => {
  res.send('Task Manager API is running');
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ id: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch tasks.' });
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  const { title, description, priority } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const lastTask = await Task.findOne().sort({ id: -1 }).limit(1);
    const nextId = lastTask ? lastTask.id + 1 : 1;

    const newTask = new Task({
      id: nextId,
      title: title.trim(),
      description: description || '',
      priority: priority || 'medium',
      completed: false,
    });

    const savedTask = await newTask.save();

    return res.status(201).json(savedTask.toJSON());
  } catch (error) {
    return res.status(500).json({ error: 'Unable to create task.' });
  }
});

// Update an existing task
app.put('/api/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id);

  try {
    const task = await Task.findOne({ id: taskId });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, description, priority, completed } = req.body;

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    task.title = title !== undefined ? title.trim() : task.title;
    task.description = description !== undefined ? description : task.description;
    task.priority = priority !== undefined ? priority : task.priority;
    task.completed = completed !== undefined ? completed : task.completed;

    const updatedTask = await task.save();
    return res.status(200).json(updatedTask.toJSON());
  } catch (error) {
    return res.status(500).json({ error: 'Unable to update task.' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id);

  try {
    const task = await Task.findOneAndDelete({ id: taskId });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to delete task.' });
  }
});

async function startServer() {
  await connectToDatabase();

  if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
}

module.exports = { app, Task, startServer };