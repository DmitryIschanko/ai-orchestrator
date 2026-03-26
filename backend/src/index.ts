const PORT = process.env.PORT || 3000;
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { createServer } from "http";
import { Server } from "socket.io";

// Import routes
// Import heartbeat queue to initialize it
import "./services/heartbeat.queue.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import companiesRoutes from "./routes/companies.js";
import goalsRoutes from "./routes/goals.js";
import ticketsRoutes from "./routes/tickets.js";
import budgetsRoutes from "./routes/budgets.js";
import orgRoutes from "./routes/org.js";
import heartbeatsRoutes from "./routes/heartbeats.js";
import approvalsRoutes from "./routes/approvals.js";
import auditRoutes from "./routes/audit.js";
import skillsRoutes from "./routes/skills.js";
import llmRoutes from "./routes/llm.js";
import agentsRoutes from "./routes/agents.js";
import channelRoutes from "./routes/channels/index.js";
import gatewayRoutes from "./routes/gateway.js";

// Import swagger
import { setupSwagger } from "./swagger.js";

// Import services  
import { gatewayService } from "./services/gateway.service.js";
import { budgetService } from "./services/budget.service.js";
import { heartbeatService } from "./services/heartbeat.service.js";

dotenv.config();

const logger = { info: console.log, error: console.error, warn: console.warn };

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
  },
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-in-production") as any;
    socket.data.user = decoded;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const user = socket.data.user;
  logger.info(`Socket connected: ${socket.id} (user: ${user.userId})`);
  
  // Join company room
  socket.join(`company:${user.companyId}`);
  
  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});


export const prisma = new PrismaClient();
import { getCompanyId } from "./utils/company.js";

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "60000"),
  max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
});
app.use("/api/", limiter);

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Public routes (no auth required)
app.use("/api/auth", authRoutes);

// Protected routes (auth required) - middleware applied in route files
app.use("/api/users", usersRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/org", orgRoutes);
app.use("/api/heartbeats", heartbeatsRoutes);
app.use("/api/approvals", approvalsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/llm", llmRoutes);
app.use("/api/agents", agentsRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/gateway", gatewayRoutes);

// Setup Swagger documentation
setupSwagger(app);

// Redirect root to API docs
app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

app.get("/api/health", async (req, res) => {
  const gatewayStatus = gatewayService.getStatus();
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "0.1.0", gateway: gatewayStatus });
});

app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const companySlug = req.headers["x-company-id"] as string || "default";
    const companyId = await getCompanyId(companySlug);
    const [budgetStats, ticketStats, heartbeatStats, approvalStats, goalCount, agents] = await Promise.all([
      budgetService.getStats(companyId),
      (async () => { const { ticketService } = await import("./services/ticket.service.js"); return ticketService.getStats(companyId); })(),
      heartbeatService.getStats(companyId),
      (async () => { const { approvalService } = await import("./services/approval.service.js"); return approvalService.getStats(companyId); })(),
      prisma.goal.count({ where: { companyId } }),
      Promise.resolve(gatewayService.getAgents()),
    ]);
    
    res.json({
      agents: { total: agents.length, active: agents.filter((a: any) => a.status === "active").length, idle: agents.filter((a: any) => a.status === "idle").length, busy: agents.filter((a: any) => a.status === "busy").length, error: agents.filter((a: any) => a.status === "error").length },
      goals: { total: goalCount, active: goalCount, completed: 0 },
      tickets: { total: ticketStats.total, open: ticketStats.open, inProgress: ticketStats.inProgress, review: ticketStats.review },
      budget: budgetStats,
      heartbeats: heartbeatStats,
      approvals: { pending: approvalStats.pending },
    });
  } catch (error) {
    logger.error("Failed to get dashboard stats", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  logger.info("Client connected:", socket.id);
  
  socket.on("disconnect", () => {
    logger.info("Client disconnected:", socket.id);
  });
});

// Gateway event forwarding
gatewayService.onEvent("agent.status", (payload) => {
  io.emit("agent.status", payload);
});

gatewayService.onEvent("terminal.output", (payload) => {
  io.emit("terminal.output", payload);
});


const server = httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Connect to OpenClaw Gateway
  gatewayService.connect();
});
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info("HTTP server closed");
  });
  
  try {
    await prisma.$disconnect();
    logger.info("Database connections closed");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { io };
