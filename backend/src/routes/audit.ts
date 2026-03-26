import { Router } from "express";
import { auditService } from "../services/audit.service.js";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

// GET /api/audit - Get audit logs (admin only)
router.get("/", requireRole(["admin"]), async (req: AuthRequest, res) => {
  try {
    const {
      actorId,
      entityType,
      action,
      startDate,
      endDate,
      limit = "50",
      offset = "0",
    } = req.query;

    const result = await auditService.getLogs(req.user!.companyId, {
      actorId: actorId as string,
      entityType: entityType as string,
      action: action as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    res.json(result);
  } catch (error: any) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ error: "Failed to get audit logs" });
  }
});

// GET /api/audit/my - Get current user activity
router.get("/my", async (req: AuthRequest, res) => {
  try {
    const logs = await auditService.getUserActivity(
      req.user!.companyId,
      req.user!.id,
      20
    );
    res.json({ logs });
  } catch (error: any) {
    console.error("Get user activity error:", error);
    res.status(500).json({ error: "Failed to get user activity" });
  }
});

export default router;
