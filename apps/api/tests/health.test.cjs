const request = require("supertest");

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
