import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../stores/auth";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Loader2, Filter, Download } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: any;
  createdAt: string;
}

export function AuditLog() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    entityType: "",
    action: "",
    startDate: "",
    endDate: "",
  });
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());
      if (filters.entityType) params.append("entityType", filters.entityType);
      if (filters.action) params.append("action", filters.action);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const res = await api.get(`/audit?${params.toString()}`);
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [offset, filters]);

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "LOGIN":
        return "bg-purple-100 text-purple-800";
      case "APPROVE":
        return "bg-green-100 text-green-800";
      case "REJECT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (user?.role !== "admin") {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Only administrators can view audit logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-gray-500">
            Track all actions performed in your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchLogs}>
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>Entity Type</Label>
            <Select
              value={filters.entityType}
              onValueChange={(v: string) =>
                setFilters((f) => ({ ...f, entityType: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="GOAL">Goal</SelectItem>
                <SelectItem value="TICKET">Ticket</SelectItem>
                <SelectItem value="BUDGET">Budget</SelectItem>
                <SelectItem value="APPROVAL">Approval</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Action</Label>
            <Select
              value={filters.action}
              onValueChange={(v: string) => setFilters((f) => ({ ...f, action: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="APPROVE">Approve</SelectItem>
                <SelectItem value="REJECT">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, startDate: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, endDate: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.userId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entityType}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.entityId.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {log.metadata ? (
                          <pre className="text-xs bg-gray-50 p-1 rounded">
                            {JSON.stringify(log.metadata, null, 2).slice(0, 100)}
                            ...
                          </pre>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {logs.length} of {total} logs
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset((o) => Math.max(0, o - limit))}
                  disabled={offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset((o) => o + limit)}
                  disabled={offset + limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
