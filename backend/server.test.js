const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('./server');

async function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

test('GET /api/tasks returns 200', async () => {
  const { server, port } = await startServer();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/tasks`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body));
  } finally {
    server.close();
  }
});

test('POST /api/tasks creates a task successfully', async () => {
  const { server, port } = await startServer();

  try {
    const payload = {
      title: 'Test task',
      description: 'Created during automated test',
      priority: 'high',
    };

    const response = await fetch(`http://127.0.0.1:${port}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.title, payload.title);
    assert.equal(body.description, payload.description);
    assert.equal(body.priority, payload.priority);
    assert.equal(body.completed, false);
    assert.ok(typeof body.id === 'number');
  } finally {
    server.close();
  }
});
