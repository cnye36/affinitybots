"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface EarlyAccessInvite {
  id: string;
  email: string;
  name: string | null;
  status: "requested" | "invited" | "accepted" | "expired" | "declined";
  invite_code: string | null;
  requested_at: string;
  invited_at: string | null;
  expires_at: string | null;
  // We might want to add accepted_by_user_id and other fields later
}

export default function AdminEarlyAccessDashboardPage() {
  const [requests, setRequests] = useState<EarlyAccessInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function fetchRequests() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/early-access-requests");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch requests: ${response.statusText}`
        );
      }
      const data = await response.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function handleIssueInvite(requestId: string) {
    setActionMessage(null);
    setActionError(null);
    try {
      const response = await fetch(
        `/api/admin/early-access-requests/${requestId}/issue-invite`,
        {
          method: "POST",
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to issue invite");
      }
      setActionMessage(
        `Invite issued successfully for request ID: ${requestId}. Invite code: ${result.data?.invite_code}`
      );
      // Refresh the list to show the updated status and invite code
      fetchRequests();
    } catch (err: any) {
      setActionError(err.message);
    }
  }

  const getStatusBadgeVariant = (status: EarlyAccessInvite["status"]) => {
    switch (status) {
      case "requested":
        return "secondary";
      case "invited":
        return "default";
      case "accepted":
        return "default";
      case "expired":
        return "destructive";
      case "declined":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return <div className="p-4">Loading early access requests...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Early Access Management</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {actionMessage && (
        <Alert
          variant="default"
          className="mb-4 bg-green-100 border-green-400 text-green-700"
        >
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{actionMessage}</AlertDescription>
        </Alert>
      )}
      {actionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Action Failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {requests.length === 0 && !error && (
        <p>No early access requests found.</p>
      )}

      {requests.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invite Code</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{req.email}</TableCell>
                <TableCell>{req.name || "-"}</TableCell>
                <TableCell>
                  {new Date(req.requested_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(req.status)}>
                    {req.status}
                  </Badge>
                </TableCell>
                <TableCell>{req.invite_code || "-"}</TableCell>
                <TableCell>
                  {req.expires_at
                    ? new Date(req.expires_at).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell>
                  {req.status === "requested" && (
                    <Button
                      size="sm"
                      onClick={() => handleIssueInvite(req.id)}
                      disabled={loading} // Disable button while any loading is happening or action is in progress
                    >
                      Issue Invite
                    </Button>
                  )}
                  {req.status === "invited" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        setActionMessage(null);
                        setActionError(null);
                        try {
                          const response = await fetch(
                            `/api/admin/early-access-requests/${req.id}/resend-invite`,
                            { method: "POST" }
                          );
                          const result = await response.json();
                          if (!response.ok) {
                            throw new Error(
                              result.error || "Failed to resend invite"
                            );
                          }
                          setActionMessage(
                            `Invite email resent successfully for ${req.email}`
                          );
                        } catch (err: any) {
                          setActionError(err.message);
                        }
                      }}
                      disabled={loading}
                    >
                      Resend Invite
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {/* TODO: Add section for user activity / last sign in - will likely need another API endpoint */}
    </div>
  );
}
