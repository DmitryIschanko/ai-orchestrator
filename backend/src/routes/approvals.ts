import { Router } from "express";
import { approvalService } from "../services/approval.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const approvals = await approvalService.list(req.user!.companyId);
    res.json({ approvals });
  } catch (error) {
    logger.error("Failed to list approvals", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/pending", async (req: AuthRequest, res) => {
  try {
    const approvals = await approvalService.getPendingForApprover(req.user!.companyId, req.user!.id);
    res.json({ approvals });
  } catch (error) {
    logger.error("Failed to list pending approvals", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const approval = await approvalService.getById(req.params.id, req.user!.companyId);
    if (!approval) {
      return res.status(404).json({ error: "Approval not found" });
    }
    res.json(approval);
  } catch (error) {
    logger.error("Failed to get approval", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const approval = await approvalService.create(req.user!.companyId, req.body);
    res.status(201).json(approval);
  } catch (error) {
    logger.error("Failed to create approval", error);
    res.status(400).json({ error: "Failed to create approval" });
  }
});

router.post("/:id/approve", async (req: AuthRequest, res) => {
  try {
    const approval = await approvalService.decide(req.params.id, req.user!.companyId, {
      decision: "approved",
      approverId: req.user!.id,
    });
    if (!approval) {
      return res.status(404).json({ error: "Approval not found" });
    }
    res.json(approval);
  } catch (error) {
    logger.error("Failed to approve", error);
    res.status(400).json({ error: "Failed to approve" });
  }
});

router.post("/:id/reject", async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const approval = await approvalService.decide(req.params.id, req.user!.companyId, {
      decision: "rejected",
      approverId: req.user!.id,
      reason,
    });
    if (!approval) {
      return res.status(404).json({ error: "Approval not found" });
    }
    res.json(approval);
  } catch (error) {
    logger.error("Failed to reject", error);
    res.status(400).json({ error: "Failed to reject" });
  }
});

export default router;

// POST /api/approvals/:id/approve
router.post("/:id/approve", async (req: AuthRequest, res) => {
  try {
    const { comment } = req.body;
    const approval = await approvalService.approve(
      req.params.id,
      req.user!.companyId,
      req.user!.id,
      comment
    );
    if (!approval) {
      return res.status(404).json({ error: "Approval not found or already decided" });
    }
    res.json(approval);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// POST /api/approvals/:id/reject
router.post("/:id/reject", async (req: AuthRequest, res) => {
  try {
    const { comment } = req.body;
    const approval = await approvalService.reject(
      req.params.id,
      req.user!.companyId,
      req.user!.id,
      comment
    );
    if (!approval) {
      return res.status(404).json({ error: "Approval not found or already decided" });
    }
    res.json(approval);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});
