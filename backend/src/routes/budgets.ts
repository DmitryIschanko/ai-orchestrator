import { Router } from "express";
import { budgetService } from "../services/budget.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const budgets = await budgetService.list(req.user!.companyId);
    res.json({ budgets });
  } catch (error) {
    logger.error("Failed to list budgets", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const stats = await budgetService.getStats(req.user!.companyId);
    res.json(stats);
  } catch (error) {
    logger.error("Failed to get budget stats", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/alerts", async (req: AuthRequest, res) => {
  try {
    const alerts = await budgetService.getAlerts(req.user!.companyId);
    res.json({ alerts });
  } catch (error) {
    logger.error("Failed to get budget alerts", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const budget = await budgetService.getById(req.params.id, req.user!.companyId);
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }
    res.json(budget);
  } catch (error) {
    logger.error("Failed to get budget", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/breakdown", async (req: AuthRequest, res) => {
  try {
    const breakdown = await budgetService.getCostBreakdown(req.params.id, req.user!.companyId);
    res.json({ breakdown });
  } catch (error) {
    logger.error("Failed to get cost breakdown", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const budget = await budgetService.create(req.user!.companyId, req.body);
    res.status(201).json(budget);
  } catch (error: any) {
    logger.error("Failed to create budget", error);
    res.status(400).json({ error: error.message || "Failed to create budget" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const budget = await budgetService.update(req.params.id, req.user!.companyId, req.body);
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }
    res.json(budget);
  } catch (error: any) {
    logger.error("Failed to update budget", error);
    res.status(400).json({ error: error.message || "Failed to update budget" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    await budgetService.delete(req.params.id, req.user!.companyId);
    res.json({ message: "Budget deleted" });
  } catch (error: any) {
    logger.error("Failed to delete budget", error);
    res.status(400).json({ error: error.message || "Failed to delete budget" });
  }
});

// Track cost
router.post("/:id/track", async (req: AuthRequest, res) => {
  try {
    const { amount, model } = req.body;
    const budget = await budgetService.getById(req.params.id, req.user!.companyId);
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }
    
    const updated = await budgetService.trackCost(
      req.user!.companyId,
      budget.entityType,
      budget.entityId,
      amount,
      model
    );
    res.json(updated);
  } catch (error: any) {
    logger.error("Failed to track cost", error);
    res.status(400).json({ error: error.message || "Failed to track cost" });
  }
});

// Pause budget
router.post("/:id/pause", async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    await budgetService.pauseBudget(req.params.id, req.user!.companyId, reason);
    res.json({ message: "Budget paused" });
  } catch (error: any) {
    logger.error("Failed to pause budget", error);
    res.status(400).json({ error: error.message || "Failed to pause budget" });
  }
});

// Unpause budget
router.post("/:id/unpause", async (req: AuthRequest, res) => {
  try {
    await budgetService.unpauseBudget(req.params.id, req.user!.companyId);
    res.json({ message: "Budget unpaused" });
  } catch (error: any) {
    logger.error("Failed to unpause budget", error);
    res.status(400).json({ error: error.message || "Failed to unpause budget" });
  }
});

export default router;
