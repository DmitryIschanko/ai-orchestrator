import { Router } from "express";
import { orgService } from "../services/org.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const nodes = await orgService.list(req.user!.companyId);
    res.json({ nodes });
  } catch (error) {
    logger.error("Failed to list org nodes", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/hierarchy", async (req: AuthRequest, res) => {
  try {
    const nodes = await orgService.getHierarchy(req.user!.companyId);
    res.json({ nodes });
  } catch (error) {
    logger.error("Failed to get org hierarchy", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

router.post("/", async (req: AuthRequest, res) => {
  try {
    const node = await orgService.create(req.user!.companyId, req.body);
    res.status(201).json(node);
  } catch (error) {
    logger.error("Failed to create org node", error);
    res.status(400).json({ error: "Failed to create org node" });
  }
});

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
