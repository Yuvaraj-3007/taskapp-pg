// ============================================
// Tests for Task Manager API
// Tool: Jest + Supertest
// Purpose: Automated testing in CI/CD pipeline
// ============================================

const request = require("supertest");
const { app, pool } = require("../app");

// -------- SETUP & CLEANUP --------

// Before all tests: create the tasks table
beforeAll(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      done BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
});

// After each test: clean the table so tests don't affect each other
afterEach(async () => {
  await pool.query("DELETE FROM tasks");
});

// After all tests: close database connection
afterAll(async () => {
  await pool.query("DROP TABLE IF EXISTS tasks");
  await pool.end();
});

// -------- TEST 1: Homepage --------
describe("GET /", () => {
  test("should return app info with correct fields", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.app).toBe("Task Manager API");
    expect(response.body.database).toBe("PostgreSQL");
    expect(response.body.author).toBe("Yuvaraj Pandian");
    expect(response.body.endpoints).toBeDefined();
  });
});

// -------- TEST 2: Create Task --------
describe("POST /tasks", () => {
  test("should create a new task", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({ title: "Learn Docker" });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Learn Docker");
    expect(response.body.done).toBe(false);
    expect(response.body.id).toBeDefined();
  });

  test("should reject empty title", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Title is required");
  });
});

// -------- TEST 3: List Tasks --------
describe("GET /tasks", () => {
  test("should return empty list when no tasks", async () => {
    const response = await request(app).get("/tasks");

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
    expect(response.body.tasks).toEqual([]);
  });

  test("should return all tasks", async () => {
    // Create 2 tasks first
    await request(app).post("/tasks").send({ title: "Task 1" });
    await request(app).post("/tasks").send({ title: "Task 2" });

    const response = await request(app).get("/tasks");

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.tasks[0].title).toBe("Task 1");
    expect(response.body.tasks[1].title).toBe("Task 2");
  });
});

// -------- TEST 4: Mark Task Done --------
describe("PUT /tasks/:id/done", () => {
  test("should mark task as done", async () => {
    // Create a task first
    const created = await request(app)
      .post("/tasks")
      .send({ title: "Complete me" });

    const response = await request(app)
      .put(`/tasks/${created.body.id}/done`);

    expect(response.status).toBe(200);
    expect(response.body.done).toBe(true);
  });

  test("should return 404 for non-existent task", async () => {
    const response = await request(app).put("/tasks/99999/done");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });
});

// -------- TEST 5: Delete Task --------
describe("DELETE /tasks/:id", () => {
  test("should delete a task", async () => {
    // Create a task first
    const created = await request(app)
      .post("/tasks")
      .send({ title: "Delete me" });

    const response = await request(app)
      .delete(`/tasks/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Task deleted");
  });

  test("should return 404 for non-existent task", async () => {
    const response = await request(app).delete("/tasks/99999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });
});
