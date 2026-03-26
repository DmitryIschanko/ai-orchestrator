import { Router } from "express";
import { ticketService } from "../services/ticket.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const tickets = await ticketService.list(req.user!.companyId);
    res.json({ tickets });
  } catch (error) {
    logger.error("Failed to list tickets", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

router.post("/", async (req: AuthRequest, res) => {
  try {
    const ticket = await ticketService.create(
      req.user!.companyId,
      req.user!.id,
      req.body
    );
    res.status(201).json(ticket);
  } catch (error) {
    logger.error("Failed to create ticket", error);
    res.status(400).json({ error: "Failed to create ticket" });
  }
});

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
