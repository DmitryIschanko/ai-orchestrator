import { Router } from "express";
import { goalService } from "../services/goal.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const goals = await goalService.list(req.user!.companyId);
    res.json({ goals });
  } catch (error) {
    logger.error("Failed to list goals", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/hierarchy", async (req: AuthRequest, res) => {
  try {
    const goals = await goalService.getHierarchy(req.user!.companyId);
    res.json({ goals });
  } catch (error) {
    logger.error("Failed to get goal hierarchy", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const goal = await goalService.getById(req.params.id, req.user!.companyId);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }
    res.json(goal);
  } catch (error) {
    logger.error("Failed to get goal", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const goal = await goalService.create(req.user!.companyId, req.body);
    res.status(201).json(goal);
  } catch (error) {
    logger.error("Failed to create goal", error);
    res.status(400).json({ error: "Failed to create goal" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const goal = await goalService.update(req.params.id, req.user!.companyId, req.body);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }
    res.json(goal);
  } catch (error) {
    logger.error("Failed to update goal", error);
    res.status(400).json({ error: "Failed to update goal" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    await goalService.delete(req.params.id, req.user!.companyId);
    res.json({ message: "Goal deleted" });
  } catch (error) {
    logger.error("Failed to delete goal", error);
    res.status(400).json({ error: "Failed to delete goal" });
  }
});

export default router;
