import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

const errorResponse = {
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  },
};

export const openApiDocument = {
  info: {
    description: "Interactive documentation for the routes currently implemented in GestCon.",
    title: "GestCon API",
    version: "0.1.0",
  },
  openapi: "3.0.3",
  paths: {
    "/api/auth/csrf": {
      get: {
        responses: {
          "200": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/CsrfResponse" } } },
            description: "CSRF token for the current session.",
          },
          "500": { ...errorResponse, description: "Unable to create the session token." },
        },
        summary: "Get a CSRF token",
        tags: ["Authentication"],
      },
    },
    "/api/auth/login": {
      post: {
        parameters: [{ $ref: "#/components/parameters/CsrfToken" }],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } },
          required: true,
        },
        responses: {
          "200": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } },
            description: "Authenticated session created.",
            headers: { "RateLimit-Limit": { schema: { type: "integer" } }, "RateLimit-Remaining": { schema: { type: "integer" } } },
          },
          "400": { ...errorResponse, description: "Invalid input." },
          "401": { ...errorResponse, description: "Invalid credentials or inactive user." },
          "403": { ...errorResponse, description: "Invalid CSRF token." },
          "429": { ...errorResponse, description: "Rate limit exceeded." },
          "503": { ...errorResponse, description: "Rate limit storage unavailable." },
        },
        summary: "Create an authenticated session",
        tags: ["Authentication"],
      },
    },
    "/api/auth/register": {
      post: {
        parameters: [{ $ref: "#/components/parameters/CsrfToken" }],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegistrationInput" } } },
          required: true,
        },
        responses: {
          "202": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/RegistrationResponse" } } },
            description: "Pending operator request created. The tracking token is returned only once.",
          },
          "400": { ...errorResponse, description: "Invalid input." },
          "403": { ...errorResponse, description: "Invalid CSRF token." },
          "409": { ...errorResponse, description: "Registration cannot be created." },
          "429": { ...errorResponse, description: "Rate limit exceeded." },
          "503": { ...errorResponse, description: "Rate limit storage unavailable." },
        },
        summary: "Request operator access",
        tags: ["Registration"],
      },
    },
    "/api/auth/logout": {
      post: {
        parameters: [{ $ref: "#/components/parameters/CsrfToken" }],
        responses: {
          "204": { description: "Session ended." },
          "401": { ...errorResponse, description: "Unauthenticated." },
          "403": { ...errorResponse, description: "Invalid CSRF token." },
        },
        security: [{ sessionCookie: [] }],
        summary: "End the current session",
        tags: ["Authentication"],
      },
    },
    "/api/auth/me": {
      get: {
        responses: {
          "200": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/CurrentUserResponse" } } },
            description: "Current authenticated user.",
          },
          "401": { ...errorResponse, description: "Unauthenticated or inactive user." },
        },
        security: [{ sessionCookie: [] }],
        summary: "Get the current user",
        tags: ["Authentication"],
      },
    },
    "/api/health": {
      get: {
        responses: {
          "200": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } },
            description: "API is running.",
          },
        },
        summary: "Check API health",
        tags: ["System"],
      },
    },
  },
  components: {
    parameters: {
      CsrfToken: {
        description: "Token returned by GET /api/auth/csrf.",
        in: "header",
        name: "X-CSRF-Token",
        required: true,
        schema: { type: "string" },
      },
    },
    schemas: {
      CsrfResponse: {
        properties: { data: { properties: { csrfToken: { type: "string" } }, required: ["csrfToken"], type: "object" } },
        required: ["data"],
        type: "object",
      },
      CurrentUserResponse: {
        properties: { data: { properties: { user: { $ref: "#/components/schemas/User" } }, required: ["user"], type: "object" } },
        required: ["data"],
        type: "object",
      },
      ErrorResponse: {
        properties: {
          error: {
            properties: { code: { type: "string" }, message: { type: "string" }, requestId: { type: "string" } },
            required: ["code", "message", "requestId"],
            type: "object",
          },
        },
        required: ["error"],
        type: "object",
      },
      HealthResponse: {
        properties: { data: { properties: { status: { example: "ok", type: "string" } }, required: ["status"], type: "object" } },
        required: ["data"],
        type: "object",
      },
      LoginInput: {
        properties: { email: { format: "email", type: "string" }, password: { format: "password", type: "string" } },
        required: ["email", "password"],
        type: "object",
      },
      LoginResponse: {
        properties: {
          data: {
            properties: { csrfToken: { type: "string" }, user: { $ref: "#/components/schemas/User" } },
            required: ["csrfToken", "user"],
            type: "object",
          },
        },
        required: ["data"],
        type: "object",
      },
      RegistrationInput: {
        properties: {
          email: { format: "email", type: "string" },
          name: { type: "string" },
          password: { format: "password", minLength: 12, type: "string" },
        },
        required: ["name", "email", "password"],
        type: "object",
      },
      RegistrationResponse: {
        properties: {
          data: {
            properties: { status: { enum: ["PENDING"], type: "string" }, trackingToken: { type: "string" } },
            required: ["status", "trackingToken"],
            type: "object",
          },
        },
        required: ["data"],
        type: "object",
      },
      User: {
        properties: {
          email: { format: "email", type: "string" },
          id: { format: "uuid", type: "string" },
          name: { type: "string" },
          role: { enum: ["ADMIN", "OPERATOR"], type: "string" },
          status: { enum: ["ACTIVE"], type: "string" },
        },
        required: ["id", "name", "email", "role", "status"],
        type: "object",
      },
    },
    securitySchemes: {
      sessionCookie: { in: "cookie", name: "gestcon.sid", type: "apiKey" },
    },
  },
} as const;

export const registerOpenApiDocs = (app: Express, environment: string) => {
  if (environment !== "development") {
    return;
  }

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: "GestCon API Documentation" }));
};
