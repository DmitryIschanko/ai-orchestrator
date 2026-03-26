import { Router } from "express";
import { ticketService } from "../services/ticket.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management and Kanban board
 */

// GET /api/tickets - List all tickets
router.get("/", async (req: AuthRequest, res) => {
  try {
    const tickets = await ticketService.list(req.user!.companyId);
    res.json({ tickets });
  } catch (error) {
    logger.error("Failed to list tickets", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tickets/:id - Get ticket by ID
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const ticket = await ticketService.getById(req.params.id, req.user!.companyId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.json(ticket);
  } catch (error) {
    logger.error("Failed to get ticket", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Create a new ticket
 *     tags: [Tickets]
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
 *                 description: Ticket title
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, review, done, cancelled]
 *                 default: todo
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *               goalId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Ticket created successfully
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
 */
router.post("/", async (req: AuthRequest, res) => {
  try {
    // Validate required fields
    const { title } = req.body;
    const missingFields: string[] = [];
    
    if (!title || title.trim() === "") {
      missingFields.push("title (required: ticket title)");
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Validation failed: Missing required fields",
        details: missingFields,
        example: {
          title: "Fix login bug",
          description: "Detailed description",
          status: "todo",
          priority: "high"
        }
      });
    }
    
    const ticket = await ticketService.create(req.user!.id, req.user!.companyId, req.body);
    res.status(201).json(ticket);
  } catch (error) {
    logger.error("Failed to create ticket", error);
    res.status(400).json({ error: "Failed to create ticket" });
  }
});

// PUT /api/tickets/:id - Update ticket
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const ticket = await ticketService.update(req.params.id, req.user!.companyId, req.body);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.json(ticket);
  } catch (error) {
    logger.error("Failed to update ticket", error);
    res.status(400).json({ error: "Failed to update ticket" });
  }
});

// DELETE /api/tickets/:id - Delete ticket
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    await ticketService.delete(req.params.id, req.user!.companyId);
    res.json({ message: "Ticket deleted" });
  } catch (error) {
    logger.error("Failed to delete ticket", error);
    res.status(400).json({ error: "Failed to delete ticket" });
  }
});

export default router;
