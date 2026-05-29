import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  useListApplications, 
  useListLgas,
  getListApplicationsQueryKey,
  getListLgasQueryKey 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Filter } from "lucide-react";

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("paid");
  const [lgaFilter, setLgaFilter] = useState("all");

  const tenantId = user?.tenantId ?? 0;

  const { data: lgas } = useListLgas(tenantId, {
    query: { enabled: !!user?.tenantId, queryKey: getListLgasQueryKey(tenantId) }
  });

  const appParams = {
    tenantId: user?.tenantId ?? undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    lgaId: lgaFilter === "all" ? undefined : parseInt(lgaFilter),
    search: search || undefined
  };

  const { data: applications, isLoading } = useListApplications(appParams, {
    query: {
      enabled: !!user?.tenantId,
      queryKey: getListApplicationsQueryKey(appParams)
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Queue</h1>
          <p className="text-muted-foreground">Review and process indigene certificate applications.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or NIN..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Needs Review (Paid)</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={lgaFilter} onValueChange={setLgaFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All LGAs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All LGAs</SelectItem>
                  {lgas?.map(lga => (
                    <SelectItem key={lga.id} value={lga.id.toString()}>{lga.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>LGA & Ward</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 mb-1" /><Skeleton className="h-3 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : applications && applications.length > 0 ? (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-xs">#{app.id.toString().padStart(6, '0')}</TableCell>
                    <TableCell>
                      <div className="font-medium">{app.applicantName}</div>
                      <div className="text-xs text-muted-foreground">NIN: {app.nin}</div>
                    </TableCell>
                    <TableCell>
                      <div>{app.lgaName}</div>
                      <div className="text-xs text-muted-foreground">{app.wardName}</div>
                    </TableCell>
                    <TableCell>
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/officer/${app.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-4 w-4" /> Review
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No applications found matching your filters.
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
