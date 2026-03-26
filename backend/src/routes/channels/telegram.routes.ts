import { Router } from "express";
import { authenticate, AuthRequest } from "../../middleware/auth.js";
import { telegramService } from "../../services/channels/telegram.service.js";
import { prisma } from "../../index.js";
import { logger } from "../../utils/logger.js";

const router = Router();

router.post("/setup", authenticate, async (req: AuthRequest, res) => {
  try {
    const { botToken, webhookUrl } = req.body;
    const companyId = req.user!.companyId;

    if (!botToken) {
      return res.status(400).json({ error: "Bot token is required" });
    }

    // Validate token by getting bot info
    telegramService.initialize(botToken, webhookUrl);
    const botInfo = await telegramService.getBotInfo();

    if (!botInfo) {
      return res.status(400).json({ error: "Invalid bot token" });
    }

    // Save to company settings
    await prisma.company.update({
      where: { id: companyId },
      data: {
        telegramBotToken: botToken,
        telegramWebhookUrl: webhookUrl,
      },
    });

    // Set webhook if provided
    if (webhookUrl) {
      await telegramService.setWebhook(webhookUrl);
    }

    res.json({
      success: true,
      bot: {
        name: botInfo.first_name,
        username: botInfo.username,
      },
    });
  } catch (error: any) {
    logger.error("[Telegram Routes] Setup error:", error);
    res.status(500).json({ error: error.message || "Failed to setup Telegram" });
  }
});

router.post("/test", authenticate, async (req: AuthRequest, res) => {
  try {
    const { chatId, message } = req.body;
    const companyId = req.user!.companyId;

    if (!chatId) {
      return res.status(400).json({ error: "Chat ID is required" });
    }

    // Get bot token from company settings
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { telegramBotToken: true },
    });

    if (!company?.telegramBotToken) {
      return res.status(400).json({ error: "Telegram bot not configured" });
    }

    telegramService.initialize(company.telegramBotToken);
    const success = await telegramService.sendNotification(
      chatId,
      "Test Notification",
      message || "Hello from AI Orchestrator!"
    );

    if (success) {
      res.json({ success: true, message: "Test message sent" });
    } else {
      res.status(500).json({ error: "Failed to send message" });
    }
  } catch (error: any) {
    logger.error("[Telegram Routes] Test error:", error);
    res.status(500).json({ error: error.message || "Failed to send test message" });
  }
});

export default router;
