const request = require("supertest");

process.env.APP_ORIGIN = "http://localhost:5173";
process.env.CSRF_SECRET = "test-csrf-secret-with-at-least-thirty-two-characters";
process.env.SESSION_SECRET = "test-session-secret-with-at-least-thirty-two-characters";

describe("GET /api/health", () => {
  let app;
  let createApp;

  beforeAll(async () => {
    ({ createApp } = await import("../dist/app.js"));
    app = createApp();
  });

  it("returns the API health status and a request identifier", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: "ok" } });
    expect(response.headers["x-request-id"]).toEqual(expect.any(String));
  });
});
