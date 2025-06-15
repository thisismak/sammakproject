import express from 'express';
import cors from 'cors';
import { db } from './db';
import { Request, Response } from 'express';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

interface Task {
  id?: number;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  due_date: string;
}

// Get all tasks
app.get('/api/tasks', async (req: Request, res: Response) => {
  try {
    const tasks = await db('tasks').select('*');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create a task
app.post('/api/tasks', async (req: Request, res: Response) => {
  const { title, description, status, due_date } = req.body;
  try {
    const [id] = await db('tasks').insert({ title, description, status, due_date });
    res.status(201).json({ id, title, description, status, due_date });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task
app.put('/api/tasks/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, status, due_date } = req.body;
  try {
    await db('tasks').where({ id }).update({ title, description, status, due_date });
    res.json({ id, title, description, status, due_date });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db('tasks').where({ id }).del();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Search tasks
app.get('/api/tasks/search', async (req: Request, res: Response) => {
  const { q } = req.query;
  try {
    const tasks = await db('tasks')
      .where('title', 'like', `%${q}%`)
      .orWhere('description', 'like', `%${q}%`);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search tasks' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));