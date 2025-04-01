const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger configuration options
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "LinkUp API",
      version: "1.0.0",
      description: "API for LinkUp Social Media Application",
      contact: {
        name: "API Support",
        email: "support@linkup.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.linkup.com",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Profile",
        description: "User profile management",
      },
      {
        name: "Auth",
        description: "Authentication endpoints",
      },
      {
        name: "Posts",
        description: "User posts management",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'",
        },
      },
      schemas: {
        Highlight: {
          type: "object",
          properties: {
            HighlightID: {
              type: "integer",
              example: 1,
            },
            Title: {
              type: "string",
              example: "Summer Adventures",
            },
            CoverImage: {
              type: "string",
              example: "https://example.com/cover.jpg",
            },
            UserID: {
              type: "integer",
              example: 1,
            },
            CreatedAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00Z",
            },
            Stories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  StoryID: {
                    type: "integer",
                    example: 1,
                  },
                  MediaURL: {
                    type: "string",
                    example: "https://example.com/story1.jpg",
                  },
                },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            UserID: {
              type: "integer",
              example: 1,
            },
            Username: {
              type: "string",
              example: "johndoe",
            },
            Email: {
              type: "string",
              example: "john@example.com",
            },
            ProfilePicture: {
              type: "string",
              example: "https://example.com/profile.jpg",
            },
            Bio: {
              type: "string",
              example: "Software developer from New York",
            },
            IsPrivate: {
              type: "boolean",
              example: false,
            },
            CreatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Follower: {
          type: "object",
          properties: {
            UserID: {
              type: "integer",
              example: 1,
            },
            Username: {
              type: "string",
              example: "johndoe",
            },
            ProfilePicture: {
              type: "string",
              example: "https://example.com/profile.jpg",
            },
          },
        },
        FollowRequest: {
          type: "object",
          properties: {
            FollowerID: {
              type: "integer",
              example: 1,
            },
            UserID: {
              type: "integer",
              example: 2,
            },
            FollowerUser: {
              $ref: "#/components/schemas/User",
            },
            Status: {
              type: "string",
              enum: ["PENDING", "ACCEPTED", "REJECTED"],
              example: "PENDING",
            },
            CreatedAt: {
              type: "string",
              format: "date-time",
            },
            UpdatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Post: {
          type: "object",
          properties: {
            PostID: {
              type: "integer",
              example: 1,
            },
            Content: {
              type: "string",
              example: "This is a sample post",
            },
            ImageURL: {
              type: "string",
              example: "https://example.com/image.jpg",
            },
            CreatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "Error message",
            },
            details: {
              type: "string",
              example: "Additional error details",
            },
          },
        },
      },
      parameters: {
        userIdParam: {
          in: "path",
          name: "userId",
          required: true,
          schema: {
            type: "integer",
          },
          description: "ID of the user",
        },
        requestIdParam: {
          in: "path",
          name: "requestId",
          required: true,
          schema: {
            type: "integer",
          },
          description: "ID of the follow request",
        },
      },
      responses: {
        UnauthorizedError: {
          description:
            "Unauthorized - Authentication token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                error: "Unauthorized",
                details: "Authentication token is missing or invalid",
              },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                error: "Not Found",
                details: "The requested resource was not found",
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // File paths for Swagger to scan and generate API docs
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

// Generated Swagger documentation object
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Custom options for Swagger UI branding and functionality
const swaggerUiOptions = {
  explorer: true,
  customSiteTitle: "LinkUp API Documentation",
  customCss: `
    .topbar-wrapper img { content:url('https://linkup.com/logo.png'); height:60px; }
    .swagger-ui .topbar { background-color: #2d3e50; }
  `,
  customfavIcon: "https://linkup.com/favicon.ico",
};

/**
 * Configures Swagger UI and JSON endpoints for API documentation
 * @param {Express} app - Express application instance
 */
module.exports = (app) => {
  // Serve Swagger UI at /api-docs with custom styling
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocs, swaggerUiOptions)
  );

  // Expose raw Swagger JSON for external tools or debugging
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerDocs);
  });
};
