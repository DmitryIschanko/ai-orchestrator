import axios from "axios";
import { prisma } from "../index.js";
import { logger } from "../utils/logger.js";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export class LLMService {
  private async getApiKey(companyId: string, provider: string): Promise<string | null> {
    const apiKey = await prisma.apiKey.findFirst({
      where: { companyId, provider, isDefault: true },
    });
    return apiKey?.keyEncrypted || null;
  }

  async chat(companyId: string, provider: string, request: LLMRequest): Promise<LLMResponse> {
    const apiKey = await this.getApiKey(companyId, provider);
    
    if (!apiKey) {
      throw new Error(`No API key configured for ${provider}`);
    }

    switch (provider) {
      case "anthropic":
        return this.callAnthropic(apiKey, request);
      case "openai":
        return this.callOpenAI(apiKey, request);
      case "gemini":
        return this.callGemini(apiKey, request);
      case "kimi":
        return this.callKimi(apiKey, request);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async callAnthropic(apiKey: string, request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: request.model || "claude-3-sonnet-20240229",
          messages: request.messages,
          max_tokens: request.maxTokens || 1024,
          temperature: request.temperature ?? 0.7,
        },
        {
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          },
        }
      );

      return {
        content: response.data.content[0].text,
        usage: response.data.usage,
        model: response.data.model,
      };
    } catch (error: any) {
      logger.error("Anthropic API error:", error.response?.data || error.message);
      throw new Error("Failed to call Anthropic API");
    }
  }

  private async callOpenAI(apiKey: string, request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: request.model || "gpt-4",
          messages: request.messages,
          max_tokens: request.maxTokens || 1024,
          temperature: request.temperature ?? 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model,
      };
    } catch (error: any) {
      logger.error("OpenAI API error:", error.response?.data || error.message);
      throw new Error("Failed to call OpenAI API");
    }
  }

  private async callGemini(apiKey: string, request: LLMRequest): Promise<LLMResponse> {
    // Google Gemini API implementation
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${request.model || "gemini-pro"}:generateContent`,
        {
          contents: request.messages.map(m => ({
            role: m.role === "assistant" ? "model" : m.role,
            parts: [{ text: m.content }],
          })),
        },
        {
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        content: response.data.candidates[0].content.parts[0].text,
        model: request.model || "gemini-pro",
      };
    } catch (error: any) {
      logger.error("Gemini API error:", error.response?.data || error.message);
      throw new Error("Failed to call Gemini API");
    }
  }

  private async callKimi(apiKey: string, request: LLMRequest): Promise<LLMResponse> {
    // Kimi API implementation
    try {
      const response = await axios.post(
        "https://api.kimi.com/v1/chat/completions",
        {
          model: request.model || "kimi-latest",
          messages: request.messages,
          max_tokens: request.maxTokens || 1024,
          temperature: request.temperature ?? 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model,
      };
    } catch (error: any) {
      logger.error("Kimi API error:", error.response?.data || error.message);
      throw new Error("Failed to call Kimi API");
    }
  }

  // Store API key
  async storeApiKey(
    companyId: string, 
    provider: string, 
    key: string, 
    name?: string,
    isDefault: boolean = false
  ) {
    // In production, encrypt the key before storing
    if (isDefault) {
      await prisma.apiKey.updateMany({
        where: { companyId, provider },
        data: { isDefault: false },
      });
    }

    return prisma.apiKey.create({
      data: {
        companyId,
        provider,
        name: name || `${provider} key`,
        keyEncrypted: key, // TODO: Encrypt this
        isDefault,
      },
    });
  }

  // List API keys
  async listApiKeys(companyId: string) {
    return prisma.apiKey.findMany({
      where: { companyId },
      select: {
        id: true,
        provider: true,
        name: true,
        isDefault: true,
        createdAt: true,
      },
    });
  }

  // Delete API key
  async deleteApiKey(id: string, companyId: string) {
    await prisma.apiKey.deleteMany({
      where: { id, companyId },
    });
  }
}

export const llmService = new LLMService();
