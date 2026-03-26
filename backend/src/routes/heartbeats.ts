import { Router } from "express";
import { heartbeatService } from "../services/heartbeat.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const heartbeats = await heartbeatService.list(req.user!.companyId);
    res.json({ heartbeats });
  } catch (error) {
    logger.error("Failed to list heartbeats", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const heartbeat = await heartbeatService.getById(req.params.id, req.user!.companyId);
    if (!heartbeat) {
      return res.status(404).json({ error: "Heartbeat not found" });
    }
    res.json(heartbeat);
  } catch (error) {
    logger.error("Failed to get heartbeat", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const heartbeat = await heartbeatService.create(req.user!.companyId, req.body);
    res.status(201).json(heartbeat);
  } catch (error) {
    logger.error("Failed to create heartbeat", error);
    res.status(400).json({ error: "Failed to create heartbeat" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const heartbeat = await heartbeatService.update(req.params.id, req.user!.companyId, req.body);
    if (!heartbeat) {
      return res.status(404).json({ error: "Heartbeat not found" });
    }
    res.json(heartbeat);
  } catch (error) {
    logger.error("Failed to update heartbeat", error);
    res.status(400).json({ error: "Failed to update heartbeat" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    await heartbeatService.delete(req.params.id, req.user!.companyId);
    res.json({ message: "Heartbeat deleted" });
  } catch (error) {
    logger.error("Failed to delete heartbeat", error);
    res.status(400).json({ error: "Failed to delete heartbeat" });
  }
});

export default router;
