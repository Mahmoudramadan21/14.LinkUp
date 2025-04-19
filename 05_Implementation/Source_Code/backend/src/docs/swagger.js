const swaggerJsDoc = require("swagger-jsdoc");
const express = require("express");
const path = require("path");
const glob = require("glob");

// Log scanned files for debugging
const projectRoot = path.resolve(__dirname, "../../");
const routeFiles = glob.sync(path.join(projectRoot, "src/routes/*.js"));
const controllerFiles = glob.sync(
  path.join(projectRoot, "src/controllers/*.js")
);
console.log("Swagger scanned route files:", routeFiles);
console.log("Swagger scanned controller files:", controllerFiles);

if (!routeFiles.length && !controllerFiles.length) {
  console.error("Swagger failed to load route or controller files");
}

// Swagger configuration options
const swaggerOptions = {
  definition: {
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
        url: "http://52.200.206.235:3000/api/",
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
      { name: "Admin", description: "Admin management endpoints" },
      {
        name: "Notifications",
        description: "Notification management endpoints",
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
        ReportedPost: {
          type: "object",
          properties: {
            postId: { type: "integer" },
            content: { type: "string" },
            reportCount: { type: "integer" },
            reporterUsernames: {
              type: "array",
              items: { type: "string" },
            },
            createdAt: { type: "string", format: "date-time" },
            owner: { type: "string" },
          },
        },
        UserDetails: {
          type: "object",
          properties: {
            userId: { type: "integer" },
            username: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["USER", "ADMIN", "BANNED"] },
            isBanned: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            postCount: { type: "integer" },
            filedReportCount: { type: "integer" },
            reportedPostCount: { type: "integer" },
          },
        },
        AdminAction: {
          type: "object",
          properties: {
            actionType: {
              type: "string",
              enum: ["DELETE_POST", "WARN_USER", "BAN_USER", "DISMISS_REPORT"],
            },
            postId: { type: "integer" },
            userId: { type: "integer" },
            reason: { type: "string" },
          },
        },
        UpdateUser: {
          type: "object",
          properties: {
            userId: { type: "integer" },
            role: { type: "string", enum: ["USER", "ADMIN", "BANNED"] },
            isBanned: { type: "boolean" },
            reason: { type: "string" },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
        VerifyCodeRequest: {
          type: "object",
          required: ["email", "code"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            code: {
              type: "string",
              pattern: "^[0-9]{4}$",
              example: "1234",
            },
          },
        },
        PasswordResetWithToken: {
          type: "object",
          required: ["resetToken", "newPassword"],
          properties: {
            resetToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            newPassword: {
              type: "string",
              minLength: 8,
              example: "NewP@ssw0rd123",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            codeSent: { type: "boolean" },
            resetToken: { type: "string" },
            data: { type: "object" },
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
          name: "postId",
          in: "path",
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
  apis: [
    path.join(__dirname, "../../src/routes/*.js"),
    path.join(__dirname, "../../src/controllers/*.js"),
  ],
};

// Generated Swagger documentation object
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Log the actual routes Swagger found for debugging
console.log("Swagger scanned routes:", Object.keys(swaggerDocs.paths));

module.exports = (app) => {
  // Serve Swagger UI static files from swagger-ui-dist
  app.use(
    "/swagger-ui",
    express.static(path.join(__dirname, "../../node_modules/swagger-ui-dist"))
  );

  // Serve Swagger UI with custom configuration
  app.get("/api-docs", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LinkUp API Documentation</title>
        <link rel="stylesheet" href="/swagger-ui/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="/swagger-ui/swagger-ui-bundle.js"></script>
        <script src="/swagger-ui/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = () => {
            try {
              window.ui = SwaggerUIBundle({
                url: '/api-docs.json',
                dom_id: '#swagger-ui',
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],
                layout: "StandaloneLayout"
              });
            } catch (error) {
              console.error('Swagger UI initialization failed:', error);
            }
          };
        </script>
      </body>
      </html>
    `);
  });

  // Serve Swagger JSON
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerDocs);
  });
};
