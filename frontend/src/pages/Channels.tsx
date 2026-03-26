import { useState } from "react";
import { api } from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Loader2, Send, MessageCircle, Bot } from "lucide-react";
import toast from "react-hot-toast";

export function Channels() {
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleSaveTelegram = async () => {
    if (!telegramToken) {
      toast.error("Bot token is required");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/channels/telegram/setup", {
        botToken: telegramToken,
      });
      toast.success("Telegram bot configured");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to configure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramChatId) {
      toast.error("Chat ID is required");
      return;
    }

    setIsTesting(true);
    try {
      await api.post("/channels/telegram/test", {
        chatId: telegramChatId,
        message: "Test message from AI Orchestrator! 🚀",
      });
      toast.success("Test message sent");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send test");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Channel Integrations</h1>
        <p className="text-gray-500">Connect messaging platforms for notifications</p>
      </div>

      {/* Telegram */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Telegram</CardTitle>
              <p className="text-sm text-gray-500">Get notifications via Telegram bot</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bot Token</Label>
            <Input
              type="password"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            />
            <p className="text-xs text-gray-500">
              Get token from @BotFather on Telegram
            </p>
          </div>

          <div className="space-y-2">
            <Label>Chat ID (for testing)</Label>
            <Input
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="123456789"
            />
            <p className="text-xs text-gray-500">
              Your Telegram user ID or group chat ID
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveTelegram} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Configuration
            </Button>
            <Button variant="outline" onClick={handleTestTelegram} disabled={isTesting}>
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Discord - placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Discord</CardTitle>
              <Badge variant="outline">Coming soon</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Discord integration will be available in the next update.</p>
        </CardContent>
      </Card>

      {/* Slack - placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Slack</CardTitle>
              <Badge variant="outline">Coming soon</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Slack integration will be available in the next update.</p>
        </CardContent>
      </Card>
    </div>
  );
}
