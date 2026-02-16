// ============================================
// Task Manager API - Node.js + PostgreSQL
// Author: Yuvaraj Pandian
// Purpose: DevOps Docker Practice
// Stack: Express.js + PostgreSQL
// ============================================

const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// Database connection - reads from environment variables (for Coolify)
// Falls back to Docker Compose service name "db" for local development
const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "yuvaraj",
  password: process.env.DB_PASSWORD || "devops123",
  database: process.env.DB_NAME || "taskdb",
});

// Create table on startup
async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      done BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("Database table ready!");
}
init();

// GET / - App info
app.get("/", (req, res) => {
  res.json({
    app: "Task Manager API",
    database: "PostgreSQL",
    server: "Contabo VPS",
    author: "Yuvaraj Pandian",
    endpoints: {
      "GET /": "This info",
      "GET /tasks": "List all tasks",
      "POST /tasks": "Create a task (send {title: 'your task'})",
      "PUT /tasks/:id/done": "Mark task as done",
      "DELETE /tasks/:id": "Delete a task",
    },
  });
});

// GET /tasks - List all tasks
app.get("/tasks", async (req, res) => {
  const result = await pool.query("SELECT * FROM tasks ORDER BY id");
  res.json({ total: result.rows.length, tasks: result.rows });
});

// POST /tasks - Create a new task
app.post("/tasks", async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });
  const result = await pool.query(
    "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
    [title]
  );
  res.status(201).json(result.rows[0]);
});

// PUT /tasks/:id/done - Mark task as done
app.put("/tasks/:id/done", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    "UPDATE tasks SET done = true WHERE id = $1 RETURNING *",
    [id]
  );
  if (result.rows.length === 0)
    return res.status(404).json({ error: "Task not found" });
  res.json(result.rows[0]);
});

// DELETE /tasks/:id - Delete a task
app.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    "DELETE FROM tasks WHERE id = $1 RETURNING *",
    [id]
  );
  if (result.rows.length === 0)
    return res.status(404).json({ error: "Task not found" });
  res.json({ message: "Task deleted", task: result.rows[0] });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Task Manager API running on port ${PORT}`);
  console.log(`Database: PostgreSQL`);
  console.log(`Author: Yuvaraj Pandian`);
});
