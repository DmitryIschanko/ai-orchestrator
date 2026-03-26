import { Router } from "express";
import { skillService } from "../services/skill.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const skills = await skillService.list(req.user!.companyId);
    res.json({ skills });
  } catch (error) {
    logger.error("Failed to list skills", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const skill = await skillService.getById(req.params.id, req.user!.companyId);
    if (!skill) {
      return res.status(404).json({ error: "Skill not found" });
    }
    res.json(skill);
  } catch (error) {
    logger.error("Failed to get skill", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const skill = await skillService.create(req.user!.companyId, req.body);
    res.status(201).json(skill);
  } catch (error) {
    logger.error("Failed to create skill", error);
    res.status(400).json({ error: "Failed to create skill" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const skill = await skillService.update(req.params.id, req.user!.companyId, req.body);
    if (!skill) {
      return res.status(404).json({ error: "Skill not found" });
    }
    res.json(skill);
  } catch (error) {
    logger.error("Failed to update skill", error);
    res.status(400).json({ error: "Failed to update skill" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    await skillService.delete(req.params.id, req.user!.companyId);
    res.json({ message: "Skill deleted" });
  } catch (error) {
    logger.error("Failed to delete skill", error);
    res.status(400).json({ error: "Failed to delete skill" });
  }
});

export default router;
