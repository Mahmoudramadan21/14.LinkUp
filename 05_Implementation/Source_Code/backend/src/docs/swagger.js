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
        email: "linkup.101203@gmail.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "https://link-up-25.vercel.app/api/",
        description: "Production server",
      },
      { url: "http://localhost:3000/api/", description: "Development server" },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User authentication and account management",
      },
      {
        name: "Profile",
        description: "User profile management",
      },
      {
        name: "Posts",
        description: "User posts management",
      },
      {
        name: "Stories",
        description: "Story management endpoints",
      },
      {
        name: "Highlights",
        description: "Story highlights management",
      },
      {
        name: "Messages",
        description: "Real-time messaging and conversations",
      },
      { name: "Test", description: "Test endpoints" },
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
            HighlightID: { type: "integer", example: 1 },
            Title: { type: "string", example: "Summer Adventures" },
            CoverImage: {
              type: "string",
              example: "https://example.com/cover.jpg",
            },
            UserID: { type: "integer", example: 1 },
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
                  StoryID: { type: "integer", example: 1 },
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
            UserID: { type: "integer", example: 1 },
            Username: { type: "string", example: "johndoe" },
            Email: { type: "string", example: "john@example.com" },
            ProfilePicture: {
              type: "string",
              example: "https://example.com/profile.jpg",
            },
            Bio: {
              type: "string",
              example: "Software developer from New York",
            },
            IsPrivate: { type: "boolean", example: false },
            CreatedAt: { type: "string", format: "date-time" },
          },
        },
        Follower: {
          type: "object",
          properties: {
            UserID: { type: "integer", example: 1 },
            Username: { type: "string", example: "johndoe" },
            ProfilePicture: {
              type: "string",
              example: "https://example.com/profile.jpg",
            },
          },
        },
        FollowRequest: {
          type: "object",
          properties: {
            FollowerID: { type: "integer", example: 1 },
            UserID: { type: "integer", example: 2 },
            FollowerUser: { $ref: "#/components/schemas/User" },
            Status: {
              type: "string",
              enum: ["PENDING", "ACCEPTED", "REJECTED"],
              example: "PENDING",
            },
            CreatedAt: { type: "string", format: "date-time" },
            UpdatedAt: { type: "string", format: "date-time" },
          },
        },
        Post: {
          type: "object",
          properties: {
            PostID: { type: "integer", example: 1 },
            Content: { type: "string", example: "This is a sample post" },
            ImageURL: {
              type: "string",
              example: "https://example.com/image.jpg",
            },
            CreatedAt: { type: "string", format: "date-time" },
          },
        },
        UserAuth: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: {
              type: "string",
              minLength: 3,
              maxLength: 20,
              pattern: "^[a-zA-Z0-9_]+$",
              example: "john_doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "P@ssw0rd123",
            },
          },
        },
        LoginCredentials: {
          type: "object",
          required: ["usernameOrEmail", "password"],
          properties: {
            usernameOrEmail: { type: "string", example: "john_doe" },
            password: {
              type: "string",
              format: "password",
              example: "P@ssw0rd123",
            },
          },
        },
        PasswordResetRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
          },
        },
        PasswordReset: {
          type: "object",
          required: ["token", "newPassword"],
          properties: {
            token: { type: "string", example: "abc123def456" },
            newPassword: {
              type: "string",
              format: "password",
              example: "NewP@ssw0rd123",
            },
          },
        },
        Conversation: {
          type: "object",
          properties: {
            id: { type: "string", example: "conv_123" },
            title: { type: "string", example: "Chat with User1" },
            isGroup: { type: "boolean", example: false },
            participants: {
              type: "array",
              items: { $ref: "#/components/schemas/User" },
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00Z",
            },
          },
        },
        Message: {
          type: "object",
          properties: {
            MessageID: { type: "string", example: "msg_123" },
            content: { type: "string", example: "Hello, how are you?" },
            senderId: { type: "integer", example: 1 },
            conversationId: { type: "string", example: "conv_123" },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00Z",
            },
            readAt: { type: "string", format: "date-time", nullable: true },
            attachments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", example: "image" },
                  url: {
                    type: "string",
                    example: "https://example.com/image.jpg",
                  },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "Error message" },
            details: { type: "string", example: "Additional error details" },
          },
        },
      },
      parameters: {
        userIdParam: {
          in: "path",
          name: "userId",
          required: true,
          schema: { type: "integer" },
          description: "ID of the user",
        },
        requestIdParam: {
          in: "path",
          name: "requestId",
          required: true,
          schema: { type: "integer" },
          description: "ID of the follow request",
        },
        conversationIdParam: {
          in: "path",
          name: "conversationId",
          required: true,
          schema: { type: "string" },
          description: "ID of the conversation",
        },
        messageIdParam: {
          in: "path",
          name: "messageId",
          required: true,
          schema: { type: "string" },
          description: "ID of the message",
        },
        highlightIdParam: {
          in: "path",
          name: "highlightId",
          required: true,
          schema: { type: "integer" },
          description: "ID of the highlight",
        },
        postIdParam: {
          in: "path",
          name: "postId",
          required: true,
          schema: { type: "integer" },
          description: "ID of the post",
        },
        storyIdParam: {
          in: "path",
          name: "storyId",
          required: true,
          schema: { type: "integer" },
          description: "ID of the story",
        },
      },
      responses: {
        UnauthorizedError: {
          description:
            "Unauthorized - Authentication token is missing or invalid",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
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
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                error: "Not Found",
                details: "The requested resource was not found",
              },
            },
          },
        },
        UserResponse: {
          description: "User registration response",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "User registered successfully",
                  },
                  userId: { type: "integer", example: 1 },
                },
              },
            },
          },
        },
        LoginResponse: {
          description: "Successful login response",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Login successful" },
                  token: {
                    type: "string",
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  },
                },
              },
            },
          },
        },
        PasswordResetResponse: {
          description: "Password reset response",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Password reset link has been sent",
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Adjusted paths for backend/docs/
  apis: ["../src/routes/*.js", "../src/controllers/*.js"],
};

// Generated Swagger documentation object
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Custom options for Swagger UI branding
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
  // Serve Swagger UI at /api-docs
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocs, swaggerUiOptions)
  );

  // Expose raw Swagger JSON
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerDocs);
  });
};
