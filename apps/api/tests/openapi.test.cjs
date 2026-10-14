const express = require("express");
const request = require("supertest");

describe("OpenAPI documentation", () => {
  let registerOpenApiDocs;

  beforeAll(async () => {
    ({ registerOpenApiDocs } = await import("../dist/config/openapi.js"));
  });

  it("serves Swagger UI only in development", async () => {
    const app = express();
    registerOpenApiDocs(app, "development");

    const response = await request(app).get("/docs/");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toContain("GestCon API Documentation");
  });

  it("does not register Swagger UI outside development", async () => {
    const app = express();
    registerOpenApiDocs(app, "production");

    const response = await request(app).get("/docs/");

    expect(response.status).toBe(404);
  });
});
