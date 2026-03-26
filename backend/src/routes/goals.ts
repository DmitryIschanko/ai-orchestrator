import { Router } from "express";
import { goalService } from "../services/goal.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: Goal management and OKR tracking
 */

/**
 * @swagger
 * /goals:
 *   get:
 *     summary: List all goals for company
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of goals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 goals:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Goal"
 */
router.get("/", async (req: AuthRequest, res) => {
  try {
    const goals = await goalService.list(req.user!.companyId);
    res.json({ goals });
  } catch (error) {
    logger.error("Failed to list goals", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /goals/hierarchy:
 *   get:
 *     summary: Get goals hierarchy
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hierarchical goal structure
 */
router.get("/hierarchy", async (req: AuthRequest, res) => {
  try {
    const goals = await goalService.getHierarchy(req.user!.companyId);
    res.json({ goals });
  } catch (error) {
    logger.error("Failed to get goal hierarchy", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /goals/{id}:
 *   get:
 *     summary: Get goal by ID
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Goal data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Goal"
 *       404:
 *         description: Goal not found
 */
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

/**
 * @swagger
 * /goals:
 *   post:
 *     summary: Create a new goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *             properties:
 *               type:
 *                 type: string
 *                 description: "Goal type: company, department, team, personal"
 *                 enum: [company, department, team, personal]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent goal ID for hierarchy
 *               assignedToId:
 *                 type: string
 *                 format: uuid
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Goal created
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.post("/", async (req: AuthRequest, res) => {
  try {
    // Validate required fields
    const { type, title } = req.body;
    const missingFields: string[] = [];
    
    if (!type) missingFields.push("type (required: company, department, team, personal)");
    if (!title) missingFields.push("title");
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Validation failed: Missing required fields",
        details: missingFields,
      });
    }
    
    const goal = await goalService.create(req.user!.companyId, req.body);
    res.status(201).json(goal);
  } catch (error) {
    logger.error("Failed to create goal", error);
    res.status(400).json({ error: "Failed to create goal" });
  }
});

/**
 * @swagger
 * /goals/{id}:
 *   put:
 *     summary: Update a goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, completed, cancelled]
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Goal updated
 *       404:
 *         description: Goal not found
 */
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

/**
 * @swagger
 * /goals/{id}:
 *   delete:
 *     summary: Delete a goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Goal deleted
 */
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
