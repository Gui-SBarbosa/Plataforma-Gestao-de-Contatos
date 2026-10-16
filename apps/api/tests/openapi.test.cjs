const express = require("express");
const request = require("supertest");

describe("OpenAPI documentation", () => {
  let registerOpenApiDocs;
  let openApiDocument;

  beforeAll(async () => {
    ({ openApiDocument, registerOpenApiDocs } = await import("../dist/config/openapi.js"));
  });

  it("documents the implemented administrative user creation route", () => {
    expect(openApiDocument.paths["/api/admin/users"].post.responses["201"]).toBeDefined();
    expect(openApiDocument.paths["/api/admin/users"].post.security).toEqual([{ sessionCookie: [] }]);
  });

  it("documents implemented pending request decisions", () => {
    expect(openApiDocument.paths["/api/admin/users"].get.responses["200"]).toBeDefined();
    expect(openApiDocument.paths["/api/admin/users/{id}/approve"].patch.responses["409"]).toBeDefined();
    expect(openApiDocument.paths["/api/admin/users/{id}/reject"].patch.responses["409"]).toBeDefined();
  });

  it("documents the registration status route", () => {
    expect(openApiDocument.paths["/api/auth/registration-status"].get.responses["200"]).toBeDefined();
    expect(openApiDocument.paths["/api/auth/registration-status"].get.responses["429"]).toBeDefined();
  });

  it("documents the implemented contact creation route", () => {
    expect(openApiDocument.paths["/api/contacts"].post.responses["201"]).toBeDefined();
    expect(openApiDocument.paths["/api/contacts"].post.security).toEqual([{ sessionCookie: [] }]);
  });

  it("documents the contact ownership route", () => {
    expect(openApiDocument.paths["/api/contacts/{id}"].get.responses["404"]).toBeDefined();
    expect(openApiDocument.paths["/api/contacts/{id}"].get.security).toEqual([{ sessionCookie: [] }]);
  });

  it("documents the paginated contacts route", () => {
    expect(openApiDocument.paths["/api/contacts"].get.responses["200"]).toBeDefined();
    expect(openApiDocument.paths["/api/contacts"].get.security).toEqual([{ sessionCookie: [] }]);
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
