import axios from "axios";
import { logger } from "../../utils/logger.js";

export class TelegramService {
  private botToken: string | null = null;
  private webhookUrl: string | null = null;

  initialize(botToken: string, webhookUrl?: string) {
    this.botToken = botToken;
    this.webhookUrl = webhookUrl || null;
    logger.info("[Telegram] Service initialized");
  }

  async sendMessage(chatId: string, text: string, options?: any): Promise<boolean> {
    if (!this.botToken) {
      logger.error("[Telegram] Bot token not set");
      return false;
    }

    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        ...options,
      });
      return true;
    } catch (error: any) {
      logger.error("[Telegram] Failed to send message:", error.response?.data || error.message);
      return false;
    }
  }

  async sendNotification(chatId: string, title: string, message: string, link?: string): Promise<boolean> {
    const text = `<b>${title}</b>\n\n${message}` + (link ? `\n\n<a href="${link}">Открыть</a>` : "");
    return this.sendMessage(chatId, text);
  }

  async setWebhook(webhookUrl: string): Promise<boolean> {
    if (!this.botToken) return false;

    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/setWebhook`,
        { url: webhookUrl }
      );
      logger.info("[Telegram] Webhook set:", response.data);
      return true;
    } catch (error: any) {
      logger.error("[Telegram] Failed to set webhook:", error.response?.data || error.message);
      return false;
    }
  }

  async getBotInfo(): Promise<any | null> {
    if (!this.botToken) return null;

    try {
      const response = await axios.get(`https://api.telegram.org/bot${this.botToken}/getMe`);
      return response.data.result;
    } catch (error: any) {
      logger.error("[Telegram] Failed to get bot info:", error.response?.data || error.message);
      return null;
    }
  }
}

export const telegramService = new TelegramService();
