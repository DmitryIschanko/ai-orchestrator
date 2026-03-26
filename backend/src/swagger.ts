import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Orchestrator API",
      version: "1.0.0",
      description: "API documentation for AI Orchestrator Platform",
      contact: {
        name: "Support",
        email: "support@ai-orchestrator.local",
      },
    },
    servers: [
      {
        url: "/api",
        description: "API server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string", nullable: true },
            role: { type: "string", enum: ["admin", "manager", "user"] },
            companyId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Goal: {
          type: "object",
          required: ["type", "title"],
          properties: {
            id: { type: "string", format: "uuid" },
            type: { type: "string", description: "Goal type: company, department, team, personal" },
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string", enum: ["active", "completed", "cancelled"] },
            progress: { type: "integer", minimum: 0, maximum: 100 },
            parentId: { type: "string", format: "uuid", nullable: true },
            assignedToId: { type: "string", format: "uuid", nullable: true },
            dueDate: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Ticket: {
          type: "object",
          required: ["title"],
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string", enum: ["todo", "in_progress", "review", "done", "cancelled"] },
            priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
            assigneeId: { type: "string", format: "uuid", nullable: true },
            goalId: { type: "string", format: "uuid", nullable: true },
            createdById: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Budget: {
          type: "object",
          required: ["entityType", "entityId", "monthlyLimit"],
          properties: {
            id: { type: "string", format: "uuid" },
            entityType: { type: "string", description: "Type: org_node, company, etc." },
            entityId: { type: "string", format: "uuid" },
            monthlyLimit: { type: "number", description: "Budget limit in currency" },
            spentMonthly: { type: "number" },
            spentTotal: { type: "number" },
            alertThreshold: { type: "integer", default: 80 },
            pausedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Approval: {
          type: "object",
          required: ["type", "title", "requesterId", "data"],
          properties: {
            id: { type: "string", format: "uuid" },
            type: { type: "string", enum: ["budget_override", "access_request", "deployment", "data_access"] },
            title: { type: "string" },
            description: { type: "string" },
            requesterId: { type: "string", format: "uuid" },
            data: { type: "object", description: "Additional request data" },
            status: { type: "string", enum: ["pending", "approved", "rejected"] },
            approverId: { type: "string", format: "uuid", nullable: true },
            decidedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Skill: {
          type: "object",
          required: ["name"],
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            source: { type: "string", nullable: true },
            sourceUrl: { type: "string", nullable: true },
            content: { type: "string", nullable: true },
            enabled: { type: "boolean", default: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        OrgNode: {
          type: "object",
          required: ["title"],
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string", description: "Department/team name" },
            department: { type: "string", nullable: true },
            level: { type: "integer", default: 0 },
            reportsToId: { type: "string", format: "uuid", nullable: true },
            metadata: { type: "object" },
            children: { type: "array", items: { $ref: "#/components/schemas/OrgNode" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Agent: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            status: { type: "string", enum: ["idle", "busy", "error", "offline"] },
            lastHeartbeat: { type: "string", format: "date-time" },
            schedule: { type: "string" },
            runCount: { type: "integer" },
            failCount: { type: "integer" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: { type: "array", items: { type: "string" }, nullable: true },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/routes/**/*.ts"],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "AI Orchestrator API Docs",
  }));
  
  // JSON endpoint
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
}
