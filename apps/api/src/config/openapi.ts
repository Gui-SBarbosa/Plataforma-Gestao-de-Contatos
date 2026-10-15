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
    "/api/auth/registration-status": {
      get: {
        parameters: [
          {
            description: "Opaque tracking token returned once by POST /api/auth/register.",
            in: "query",
            name: "trackingToken",
            required: true,
            schema: { minLength: 43, type: "string" },
          },
        ],
        responses: {
          "200": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/RegistrationStatusResponse" } } },
            description: "Current status of the registration request.",
          },
          "400": { ...errorResponse, description: "Invalid tracking token input." },
          "404": { ...errorResponse, description: "Registration request not found." },
          "429": { ...errorResponse, description: "Rate limit exceeded." },
          "503": { ...errorResponse, description: "Rate limit storage unavailable." },
        },
        summary: "Get registration status",
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
    "/api/admin/users": {
      get: {
        parameters: [
          { in: "query", name: "status", schema: { enum: ["PENDING"], type: "string" } },
          { in: "query", name: "page", schema: { default: 1, minimum: 1, type: "integer" } },
          { in: "query", name: "pageSize", schema: { default: 10, maximum: 50, minimum: 1, type: "integer" } },
        ],
        responses: {
          "200": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/PendingUserListResponse" } } },
            description: "Pending operator requests.",
          },
          "400": { ...errorResponse, description: "Invalid pagination input." },
          "401": { ...errorResponse, description: "Unauthenticated or inactive user." },
          "403": { ...errorResponse, description: "Administrator role required." },
        },
        security: [{ sessionCookie: [] }],
        summary: "List pending operator requests",
        tags: ["Administration"],
      },
      post: {
        parameters: [{ $ref: "#/components/parameters/CsrfToken" }],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/AdminUserInput" } } },
          required: true,
        },
        responses: {
          "201": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/AdminUserResponse" } } },
            description: "Active operator created.",
          },
          "400": { ...errorResponse, description: "Invalid input." },
          "401": { ...errorResponse, description: "Unauthenticated or inactive user." },
          "403": { ...errorResponse, description: "Administrator role or valid CSRF token required." },
          "409": { ...errorResponse, description: "User cannot be created." },
        },
        security: [{ sessionCookie: [] }],
        summary: "Create an active operator",
        tags: ["Administration"],
      },
    },
    "/api/admin/users/{id}/approve": {
      patch: {
        parameters: [{ $ref: "#/components/parameters/UserId" }, { $ref: "#/components/parameters/CsrfToken" }],
        responses: {
          "200": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/AdminUserResponse" } } },
            description: "Operator request approved.",
          },
          "400": { ...errorResponse, description: "Invalid user identifier." },
          "401": { ...errorResponse, description: "Unauthenticated or inactive user." },
          "403": { ...errorResponse, description: "Administrator role or valid CSRF token required." },
          "404": { ...errorResponse, description: "User not found." },
          "409": { ...errorResponse, description: "User is no longer pending." },
        },
        security: [{ sessionCookie: [] }],
        summary: "Approve a pending operator request",
        tags: ["Administration"],
      },
    },
    "/api/admin/users/{id}/reject": {
      patch: {
        parameters: [{ $ref: "#/components/parameters/UserId" }, { $ref: "#/components/parameters/CsrfToken" }],
        responses: {
          "200": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/AdminUserResponse" } } },
            description: "Operator request rejected.",
          },
          "400": { ...errorResponse, description: "Invalid user identifier." },
          "401": { ...errorResponse, description: "Unauthenticated or inactive user." },
          "403": { ...errorResponse, description: "Administrator role or valid CSRF token required." },
          "404": { ...errorResponse, description: "User not found." },
          "409": { ...errorResponse, description: "User is no longer pending." },
        },
        security: [{ sessionCookie: [] }],
        summary: "Reject a pending operator request",
        tags: ["Administration"],
      },
    },
    "/api/contacts": {
      get: {
        parameters: [
          { in: "query", name: "page", schema: { default: 1, minimum: 1, type: "integer" } },
          { in: "query", name: "pageSize", schema: { default: 10, maximum: 50, minimum: 1, type: "integer" } },
        ],
        responses: {
          "200": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/ContactListResponse" } } },
            description: "Visible contacts page.",
          },
          "400": { ...errorResponse, description: "Invalid pagination input." },
          "401": { ...errorResponse, description: "Unauthenticated or inactive user." },
        },
        security: [{ sessionCookie: [] }],
        summary: "List visible contacts",
        tags: ["Contacts"],
      },
      post: {
        parameters: [{ $ref: "#/components/parameters/CsrfToken" }],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/ContactInput" } } },
          required: true,
        },
        responses: {
          "201": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/ContactResponse" } } },
            description: "Contact created.",
          },
          "400": { ...errorResponse, description: "Invalid input." },
          "401": { ...errorResponse, description: "Unauthenticated or inactive user." },
          "403": { ...errorResponse, description: "Operator role and valid CSRF token required." },
        },
        security: [{ sessionCookie: [] }],
        summary: "Create a contact as an operator",
        tags: ["Contacts"],
      },
    },
    "/api/contacts/{id}": {
      get: {
        parameters: [{ $ref: "#/components/parameters/ContactId" }],
        responses: {
          "200": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/ContactResponse" } } },
            description: "Visible contact.",
          },
          "400": { ...errorResponse, description: "Invalid contact identifier." },
          "401": { ...errorResponse, description: "Unauthenticated or inactive user." },
          "404": { ...errorResponse, description: "Contact not found or not visible." },
        },
        security: [{ sessionCookie: [] }],
        summary: "Get a visible contact",
        tags: ["Contacts"],
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
      ContactId: {
        description: "Contact UUID.",
        in: "path",
        name: "id",
        required: true,
        schema: { format: "uuid", type: "string" },
      },
      CsrfToken: {
        description: "Token returned by GET /api/auth/csrf.",
        in: "header",
        name: "X-CSRF-Token",
        required: true,
        schema: { type: "string" },
      },
      UserId: {
        description: "User UUID.",
        in: "path",
        name: "id",
        required: true,
        schema: { format: "uuid", type: "string" },
      },
    },
    schemas: {
      AdminUserInput: {
        properties: {
          email: { format: "email", type: "string" },
          name: { maxLength: 120, minLength: 2, type: "string" },
          password: { format: "password", maxLength: 128, minLength: 12, type: "string" },
        },
        required: ["name", "email", "password"],
        type: "object",
      },
      AdminUserResponse: {
        properties: { data: { properties: { user: { $ref: "#/components/schemas/User" } }, required: ["user"], type: "object" } },
        required: ["data"],
        type: "object",
      },
      CsrfResponse: {
        properties: { data: { properties: { csrfToken: { type: "string" } }, required: ["csrfToken"], type: "object" } },
        required: ["data"],
        type: "object",
      },
      Contact: {
        properties: {
          city: { nullable: true, type: "string" },
          company: { nullable: true, type: "string" },
          createdAt: { format: "date-time", type: "string" },
          createdBy: { properties: { name: { type: "string" } }, required: ["name"], type: "object" },
          email: { format: "email", type: "string" },
          id: { format: "uuid", type: "string" },
          name: { type: "string" },
          phone: { type: "string" },
          source: { enum: ["WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "PHONE", "OTHER"], type: "string" },
        },
        required: ["id", "name", "email", "phone", "source", "createdAt", "createdBy"],
        type: "object",
      },
      ContactInput: {
        properties: {
          city: { maxLength: 120, type: "string" },
          company: { maxLength: 160, type: "string" },
          email: { format: "email", maxLength: 320, type: "string" },
          name: { maxLength: 120, minLength: 2, type: "string" },
          phone: { maxLength: 32, minLength: 6, type: "string" },
          source: { enum: ["WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "PHONE", "OTHER"], type: "string" },
        },
        required: ["name", "email", "phone", "source"],
        type: "object",
      },
      ContactListResponse: {
        properties: {
          data: { items: { $ref: "#/components/schemas/Contact" }, type: "array" },
          meta: { $ref: "#/components/schemas/PaginationMeta" },
        },
        required: ["data", "meta"],
        type: "object",
      },
      ContactResponse: {
        properties: { data: { properties: { contact: { $ref: "#/components/schemas/Contact" } }, required: ["contact"], type: "object" } },
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
      PendingUserListResponse: {
        properties: {
          data: { items: { $ref: "#/components/schemas/User" }, type: "array" },
          meta: { $ref: "#/components/schemas/PaginationMeta" },
        },
        required: ["data", "meta"],
        type: "object",
      },
      PaginationMeta: {
        properties: {
          page: { type: "integer" },
          pageSize: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
        },
        required: ["page", "pageSize", "total", "totalPages"],
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
      RegistrationStatusResponse: {
        properties: {
          data: {
            properties: {
              decidedAt: { format: "date-time", nullable: true, type: "string" },
              status: { enum: ["PENDING", "ACTIVE", "REJECTED"], type: "string" },
            },
            required: ["status", "decidedAt"],
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
          status: { enum: ["PENDING", "ACTIVE", "REJECTED", "DISABLED"], type: "string" },
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
