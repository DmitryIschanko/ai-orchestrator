import { Router } from "express";
import { orgService } from "../services/org.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Organization
 *   description: Organization structure management
 */

// GET /api/org - List all org nodes
router.get("/", async (req: AuthRequest, res) => {
  try {
    const nodes = await orgService.list(req.user!.companyId);
    res.json({ nodes });
  } catch (error) {
    logger.error("Failed to list org nodes", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/org/hierarchy - Get org hierarchy
router.get("/hierarchy", async (req: AuthRequest, res) => {
  try {
    const nodes = await orgService.getHierarchy(req.user!.companyId);
    res.json({ nodes });
  } catch (error) {
    logger.error("Failed to get org hierarchy", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/org/:id - Get org node by ID
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const node = await orgService.getById(req.params.id, req.user!.companyId);
    if (!node) {
      return res.status(404).json({ error: "Node not found" });
    }
    res.json(node);
  } catch (error) {
    logger.error("Failed to get org node", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /org:
 *   post:
 *     summary: Create a new org node (department/team)
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Department or team name
 *               department:
 *                 type: string
 *                 description: Department category
 *               level:
 *                 type: integer
 *                 default: 0
 *                 description: Hierarchy level
 *               reportsToId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent node ID (optional)
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Org node created successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *                 note:
 *                   type: string
 */
router.post("/", async (req: AuthRequest, res) => {
  try {
    // Validate required fields
    const { title } = req.body;
    const missingFields: string[] = [];
    
    if (!title || title.trim() === "") {
      missingFields.push("title (required: department or team name)");
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Validation failed: Missing required fields",
        details: missingFields,
        note: "Field title is required (not name). Org nodes represent departments/teams.",
        example: {
          title: "Engineering Department",
          department: "Engineering",
          level: 1,
          metadata: {}
        }
      });
    }
    
    const node = await orgService.create(req.user!.companyId, req.body);
    res.status(201).json(node);
  } catch (error) {
    logger.error("Failed to create org node", error);
    res.status(400).json({ error: "Failed to create org node" });
  }
});

// PUT /api/org/:id - Update org node
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const node = await orgService.update(req.params.id, req.user!.companyId, req.body);
    if (!node) {
      return res.status(404).json({ error: "Node not found" });
    }
    res.json(node);
  } catch (error) {
    logger.error("Failed to update org node", error);
    res.status(400).json({ error: "Failed to update org node" });
  }
});

// DELETE /api/org/:id - Delete org node
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    await orgService.delete(req.params.id, req.user!.companyId);
    res.json({ message: "Node deleted" });
  } catch (error) {
    logger.error("Failed to delete org node", error);
    res.status(400).json({ error: "Failed to delete org node" });
  }
});

export default router;
