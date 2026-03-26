import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Loader2, Key, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface ApiKey {
  id: string;
  provider: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

const PROVIDERS = [
  { id: "anthropic", name: "Anthropic (Claude)", color: "bg-orange-100 text-orange-800" },
  { id: "openai", name: "OpenAI (GPT)", color: "bg-green-100 text-green-800" },
  { id: "gemini", name: "Google (Gemini)", color: "bg-blue-100 text-blue-800" },
  { id: "kimi", name: "Kimi", color: "bg-purple-100 text-purple-800" },
];

export function LLMProviders() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    provider: "",
    name: "",
    key: "",
    isDefault: false,
  });

  const fetchApiKeys = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/llm/keys");
      setApiKeys(res.data.keys || []);
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provider || !formData.key) {
      toast.error("Provider and API key are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/llm/keys", {
        provider: formData.provider,
        name: formData.name || `${formData.provider} key`,
        key: formData.key,
        isDefault: formData.isDefault,
      });

      toast.success("API key added successfully");
      setFormData({ provider: "", name: "", key: "", isDefault: false });
      setShowAddForm(false);
      fetchApiKeys();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add API key");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      await api.delete(`/llm/keys/${id}`);
      toast.success("API key deleted");
      fetchApiKeys();
    } catch (error) {
      toast.error("Failed to delete API key");
    }
  };


  const getProviderInfo = (providerId: string) => {
    return PROVIDERS.find((p) => p.id === providerId) || { name: providerId, color: "bg-gray-100" };
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">LLM Providers</h1>
          <p className="text-gray-500">Manage API keys for AI providers</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add API Key
        </Button>
      </div>

      {/* Add API Key Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(v) =>
                      setFormData((f) => ({ ...f, provider: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Name (optional)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g., Production Key"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, key: e.target.value }))
                  }
                  placeholder="Enter your API key"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, isDefault: e.target.checked }))
                  }
                />
                <Label>Set as default for this provider</Label>
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  Save API Key
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No API keys configured</p>
              <p className="text-sm">Add your first API key to start using LLM features</p>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((key) => {
            const provider = getProviderInfo(key.provider);
            return (
              <Card key={key.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Key className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{key.name}</span>
                          <Badge className={provider.color}>{provider.name}</Badge>
                          {key.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Added {new Date(key.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(key.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Provider Info */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {PROVIDERS.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Badge className={p.color}>{p.name}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
