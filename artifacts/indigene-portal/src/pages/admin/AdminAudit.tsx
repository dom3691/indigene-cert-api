import { useAuth } from "@/lib/auth";
import { useListAuditLogs, getListAuditLogsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

export default function AdminAudit() {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 0;

  const { data: logs, isLoading } = useListAuditLogs({ tenantId, limit: 100 }, {
    query: {
      enabled: !!tenantId,
      queryKey: getListAuditLogsQueryKey({ tenantId, limit: 100 })
    }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">Recent activity and administrative actions.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Activity History</CardTitle>
          <CardDescription>A chronological record of operations within your tenant.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
                  </TableRow>
                ))
              ) : logs && logs.length > 0 ? (
                logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.actorName}</div>
                      <div className="text-xs text-muted-foreground">{log.actorRole?.replace('_', ' ')}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.detail || '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No activity logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
