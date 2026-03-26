import { Router } from "express";
import { prisma } from "../index.js";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      include: {
        _count: {
          select: {
            users: true,
            orgNodes: true,
            goals: true,
            tickets: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json(company);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/", requireRole(["admin"]), async (req: AuthRequest, res) => {
  try {
    const { name, mission, settings } = req.body;

    const company = await prisma.company.update({
      where: { id: req.user!.companyId },
      data: {
        name,
        mission,
        settings: settings ? JSON.stringify(settings) : undefined,
      },
    });

    res.json(company);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const stats = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      select: {
        _count: {
          select: {
            users: true,
            orgNodes: true,
            goals: true,
            tickets: true,
            budgets: true,
            heartbeats: true,
            approvals: true,
            skills: true,
          },
        },
      },
    });

    res.json(stats?._count || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
