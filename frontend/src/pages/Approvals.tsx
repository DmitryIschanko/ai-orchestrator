import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../stores/auth";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import toast from "react-hot-toast";

interface Approval {
  id: string;
  type: string;
  title: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  approverId?: string;
  comments?: string;
  decidedAt?: string;
  createdAt: string;
}

export function Approvals() {
  const { user } = useAuthStore();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/approvals");
      setApprovals(res.data.approvals || []);
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
      toast.error("Failed to load approvals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async () => {
    if (!selectedApproval || !action) return;

    setIsSubmitting(true);
    try {
      const endpoint = action === "approve" ? "approve" : "reject";
      await api.post(`/approvals/${selectedApproval.id}/${endpoint}`, {
        comment: comment || undefined,
      });

      toast.success(`Request ${action === "approve" ? "approved" : "rejected"} successfully`);
      setSelectedApproval(null);
      setComment("");
      setAction(null);
      fetchApprovals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to process");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const filteredApprovals = approvals.filter((a) => {
    if (activeTab === "pending") return a.status === "pending";
    if (activeTab === "approved") return a.status === "approved";
    if (activeTab === "rejected") return a.status === "rejected";
    if (activeTab === "my") return a.requestedBy === user?.id;
    return true;
  });

  const canDecide = (approval: Approval) => {
    return (
      approval.status === "pending" &&
      user?.role !== "viewer" &&
      approval.requestedBy !== user?.id
    );
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
      <div>
        <h1 className="text-2xl font-bold">Approvals</h1>
        <p className="text-gray-500">Review and manage approval requests</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="w-4 h-4 mr-2" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle className="w-4 h-4 mr-2" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <XCircle className="w-4 h-4 mr-2" />
            Rejected
          </TabsTrigger>
          <TabsTrigger value="my">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredApprovals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No {activeTab} approvals found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(approval.status)}
                        <span className="text-sm text-gray-500">{approval.type}</span>
                      </div>
                      <h3 className="font-semibold">{approval.title}</h3>
                      {approval.description && (
                        <p className="text-gray-600 text-sm mt-1">{approval.description}</p>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        Requested: {new Date(approval.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {canDecide(approval) && (
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => {
                            setSelectedApproval(approval);
                            setAction("approve");
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            setSelectedApproval(approval);
                            setAction("reject");
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>

                  {approval.status !== "pending" && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      <span className="text-gray-500">
                        {approval.status === "approved" ? "Approved" : "Rejected"} on{" "}
                        {new Date(approval.decidedAt!).toLocaleString()}
                      </span>
                      {approval.comments && (
                        <p className="text-gray-600 mt-1">Comment: {approval.comments}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve" : "Reject"} Request
            </DialogTitle>
            <DialogDescription>
              {selectedApproval?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Comment (optional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApproval(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isSubmitting}
              className={
                action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : action === "approve" ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
