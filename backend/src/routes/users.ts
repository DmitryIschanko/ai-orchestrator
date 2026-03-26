import { Router } from "express";
import { prisma } from "../index.js";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth.js";
import { authService } from "../services/auth.service.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users - List users in company
router.get("/", async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user!.companyId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Get user by ID
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { 
        id: req.params.id,
        companyId: req.user!.companyId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Create new user (admin only)
router.post("/", requireRole(["admin"]), async (req: AuthRequest, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password, and role are required" });
    }

    if (!["admin", "manager", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be admin, manager, or viewer" });
    }

    const user = await authService.createUser(email, password, role, req.user!.companyId);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/users/:id - Update user (admin only)
router.put("/:id", requireRole(["admin"]), async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;

    if (role && !["admin", "manager", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Prevent self-demotion from admin
    if (req.params.id === req.user!.id && role !== "admin") {
      const adminCount = await prisma.user.count({
        where: { 
          companyId: req.user!.companyId,
          role: "admin",
        },
      });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot remove the last admin" });
      }
    }

    const user = await prisma.user.update({
      where: { 
        id: req.params.id,
      },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete("/:id", requireRole(["admin"]), async (req: AuthRequest, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }

    // Check if user exists in company
    const user = await prisma.user.findFirst({
      where: { 
        id: req.params.id,
        companyId: req.user!.companyId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
