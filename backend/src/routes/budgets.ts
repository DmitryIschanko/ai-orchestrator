import { Router } from "express";
import { budgetService } from "../services/budget.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Budgets
 *   description: Budget management and tracking
 */

// GET /api/budgets - List all budgets
router.get("/", async (req: AuthRequest, res) => {
  try {
    const budgets = await budgetService.list(req.user!.companyId);
    res.json({ budgets });
  } catch (error) {
    logger.error("Failed to list budgets", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /budgets:
 *   post:
 *     summary: Create a new budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - entityId
 *               - monthlyLimit
 *             properties:
 *               entityType:
 *                 type: string
 *                 description: "Type of entity: org_node, company, etc."
 *               entityId:
 *                 type: string
 *                 format: uuid
 *               monthlyLimit:
 *                 type: number
 *                 description: Budget limit per month
 *               alertThreshold:
 *                 type: integer
 *                 default: 80
 *                 description: Alert when spending exceeds this percentage
 *     responses:
 *       201:
 *         description: Budget created successfully
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
    const { entityType, entityId, monthlyLimit } = req.body;
    const missingFields: string[] = [];
    
    if (!entityType) missingFields.push("entityType (required: org_node, company)");
    if (!entityId) missingFields.push("entityId (required: valid UUID of org node or company)");
    if (monthlyLimit === undefined || monthlyLimit === null) {
      missingFields.push("monthlyLimit (required: number, budget amount)");
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Validation failed: Missing required fields",
        details: missingFields,
        note: "You must first create an Org Node (/api/org) to get a valid entityId",
        example: {
          entityType: "org_node",
          entityId: "uuid-from-org-node",
          monthlyLimit: 50000,
          alertThreshold: 80
        }
      });
    }
    
    const budget = await budgetService.create(req.user!.companyId, req.body);
    res.status(201).json(budget);
  } catch (error: any) {
    logger.error("Failed to create budget", error);
    if (error.message?.includes("Foreign key constraint")) {
      return res.status(400).json({
        error: "Invalid entityId",
        details: ["The provided entityId does not exist"],
        suggestion: "Create an Org Node first via POST /api/org"
      });
    }
    res.status(400).json({ error: "Failed to create budget" });
  }
});

// PUT /api/budgets/:id - Update budget
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const budget = await budgetService.update(req.params.id, req.user!.companyId, req.body);
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }
    res.json(budget);
  } catch (error) {
    logger.error("Failed to update budget", error);
    res.status(400).json({ error: "Failed to update budget" });
  }
});

// DELETE /api/budgets/:id - Delete budget
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    await budgetService.delete(req.params.id, req.user!.companyId);
    res.json({ message: "Budget deleted" });
  } catch (error) {
    logger.error("Failed to delete budget", error);
    res.status(400).json({ error: "Failed to delete budget" });
  }
});

export default router;
