import { Router } from "express";
import { llmService } from "../services/llm.service.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = Router();
router.use(authenticate);

// GET /api/llm - List available providers
router.get("/", async (req: AuthRequest, res) => {
  res.json({
    providers: [
      { id: "claude", name: "Anthropic Claude", models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"] },
      { id: "openai", name: "OpenAI GPT", models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"] },
      { id: "gemini", name: "Google Gemini", models: ["gemini-pro", "gemini-ultra"] },
      { id: "kimi", name: "Moonshot Kimi", models: ["kimi-chat"] },
    ],
  });
});

// POST /api/llm/chat - Send chat message
router.post("/chat", async (req: AuthRequest, res) => {
  try {
    const { provider, messages, model, temperature, maxTokens } = req.body;
    
    if (!provider || !messages) {
      return res.status(400).json({ error: "Provider and messages are required" });
    }

    const response = await llmService.chat(req.user!.companyId, provider, {
      messages,
      model,
      temperature,
      maxTokens,
    });

    res.json(response);
  } catch (error: any) {
    logger.error("LLM chat error:", error);
    res.status(500).json({ error: error.message || "Failed to process request" });
  }
});

// GET /api/llm/keys - List API keys
router.get("/keys", async (req: AuthRequest, res) => {
  try {
    const keys = await llmService.listApiKeys(req.user!.companyId);
    res.json({ keys });
  } catch (error: any) {
    logger.error("List API keys error:", error);
    res.status(500).json({ error: "Failed to list API keys" });
  }
});

// POST /api/llm/keys - Store API key
router.post("/keys", async (req: AuthRequest, res) => {
  try {
    const { provider, key, name, isDefault } = req.body;
    
    if (!provider || !key) {
      return res.status(400).json({ error: "Provider and key are required" });
    }

    const apiKey = await llmService.storeApiKey(
      req.user!.companyId,
      provider,
      key,
      name,
      isDefault
    );

    res.status(201).json(apiKey);
  } catch (error: any) {
    logger.error("Store API key error:", error);
    res.status(500).json({ error: "Failed to store API key" });
  }
});

// DELETE /api/llm/keys/:id - Delete API key
router.delete("/keys/:id", async (req: AuthRequest, res) => {
  try {
    await llmService.deleteApiKey(req.params.id, req.user!.companyId);
    res.json({ message: "API key deleted" });
  } catch (error: any) {
    logger.error("Delete API key error:", error);
    res.status(500).json({ error: "Failed to delete API key" });
  }
});

export default router;
