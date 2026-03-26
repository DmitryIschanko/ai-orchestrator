import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { agentService } from "../services/agent.service.js";
import { logger } from "../utils/logger.js";

const router = Router();

// GET /api/agents - Get all agents
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    const agents = await agentService.getAgents(companyId);
    res.json({ agents });
  } catch (error: any) {
    logger.error("[Agents] Get agents error:", error);
    res.status(500).json({ error: error.message || "Failed to get agents" });
  }
});

// POST /api/agents - Create agent
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    const { name, agentId, schedule } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const agent = await agentService.createAgent(companyId, {
      name,
      agentId,
      schedule,
    });

    res.status(201).json(agent);
  } catch (error: any) {
    logger.error("[Agents] Create agent error:", error);
    res.status(500).json({ error: error.message || "Failed to create agent" });
  }
});

// PUT /api/agents/:id - Update agent
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { name, schedule, enabled } = req.body;

    const agent = await agentService.updateAgent(companyId, id, {
      name,
      schedule,
      enabled,
    });

    res.json(agent);
  } catch (error: any) {
    logger.error("[Agents] Update agent error:", error);
    res.status(500).json({ error: error.message || "Failed to update agent" });
  }
});

// DELETE /api/agents/:id - Delete agent
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    await agentService.deleteAgent(companyId, id);
    res.json({ success: true });
  } catch (error: any) {
    logger.error("[Agents] Delete agent error:", error);
    res.status(500).json({ error: error.message || "Failed to delete agent" });
  }
});

export default router;
