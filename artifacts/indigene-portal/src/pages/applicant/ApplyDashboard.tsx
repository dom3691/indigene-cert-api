import { useAuth } from "@/lib/auth";
import { useListApplications, getListApplicationsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, ArrowRight, Clock, AlertCircle } from "lucide-react";

export default function ApplyDashboard() {
  const { user } = useAuth();
  
  const { data: applications, isLoading } = useListApplications({ applicantId: user?.id }, {
    query: {
      enabled: !!user?.id,
      queryKey: getListApplicationsQueryKey({ applicantId: user?.id })
    }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">Track and manage your indigene certificate applications.</p>
        </div>
        <Link href="/apply/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Application
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : applications && applications.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {applications.map((app) => (
            <Card key={app.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{app.tenantName} State</CardTitle>
                    <CardDescription>LGA: {app.lgaName || "Not specified"}</CardDescription>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Application #{app.id.toString().padStart(6, '0')}</span>
                  </div>
                  {app.createdAt && (
                    <div className="flex items-center text-muted-foreground gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Started: {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {app.status === "rejected" && app.rejectionReason && (
                    <div className="flex items-start text-destructive gap-2 mt-2 p-2 bg-destructive/10 rounded-md">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{app.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t">
                <Link href={`/apply/${app.id}`} className="w-full">
                  <Button variant="secondary" className="w-full justify-between">
                    View Details <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center shadow-sm border-dashed">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            You haven't started any indigene certificate applications yet. Click the button below to start your first application.
          </p>
          <Link href="/apply/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" /> Start New Application
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
