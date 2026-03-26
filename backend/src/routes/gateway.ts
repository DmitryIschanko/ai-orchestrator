import { Router } from "express";
import { gatewayService } from "../services/gateway.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();
router.use(authenticate);

router.get("/status", async (req: AuthRequest, res) => {
  try {
    const status = gatewayService.getStatus();
    res.json(status);
  } catch (error) {
    logger.error("Failed to get gateway status", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/agents", async (req: AuthRequest, res) => {
  try {
    const agents = gatewayService.getAgents();
    res.json({ agents });
  } catch (error) {
    logger.error("Failed to list agents", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/agents/:id", async (req: AuthRequest, res) => {
  try {
    const agent = gatewayService.getAgent(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json(agent);
  } catch (error) {
    logger.error("Failed to get agent", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/agents/:id/execute", async (req: AuthRequest, res) => {
  try {
    const { command } = req.body;
    const result = await gatewayService.executeCommand(req.params.id, command);
    res.json(result);
  } catch (error) {
    logger.error("Failed to execute command", error);
    res.status(400).json({ error: "Failed to execute command" });
  }
});

export default router;
