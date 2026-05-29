import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  useGetApplication, 
  useApproveApplication,
  useRejectApplication,
  useUpdateApplication,
  getGetApplicationQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, CheckCircle, XCircle, AlertCircle, Info, Download } from "lucide-react";

export default function OfficerDetail() {
  const { id } = useParams();
  const appId = parseInt(id || "0");
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);

  const { data: app, isLoading } = useGetApplication(appId, {
    query: {
      enabled: !!appId,
      queryKey: getGetApplicationQueryKey(appId)
    }
  });

  const approveApp = useApproveApplication();
  const rejectApp = useRejectApplication();
  const updateApp = useUpdateApplication();

  const handleStartReview = () => {
    updateApp.mutate({
      applicationId: appId,
      data: { status: "under_review" }
    }, {
      onSuccess: () => {
        toast({ title: "Application moved to Under Review" });
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(appId) });
      }
    });
  };

  const handleApprove = () => {
    if (!user) return;
    approveApp.mutate({
      applicationId: appId,
      data: { officerId: user.id }
    }, {
      onSuccess: () => {
        toast({ title: "Application approved and certificate generated" });
        setApproveOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(appId) });
      }
    });
  };

  const handleReject = () => {
    if (!user || !rejectReason.trim()) return;
    rejectApp.mutate({
      applicationId: appId,
      data: { officerId: user.id, reason: rejectReason }
    }, {
      onSuccess: () => {
        toast({ title: "Application rejected", variant: "destructive" });
        setRejectOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(appId) });
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 space-y-4 max-w-5xl mx-auto"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!app) {
    return <div className="p-8 text-center">Application not found</div>;
  }

  const needsReview = app.status === "paid" || app.status === "under_review";

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/officer">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Review Application #{app.id}</h1>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-muted-foreground">Applicant: {app.applicantName}</p>
          </div>
        </div>
        
        {app.status === "paid" && (
          <Button onClick={handleStartReview} disabled={updateApp.isPending}>
            Start Review
          </Button>
        )}
        
        {app.status === "under_review" && (
          <div className="flex gap-2">
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2"><XCircle className="h-4 w-4" /> Reject</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Application</DialogTitle>
                  <DialogDescription>Please provide a reason for rejecting this application. This will be visible to the applicant.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea 
                    placeholder="e.g. The provided birth certificate does not match the names..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={4}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || rejectApp.isPending}>
                    {rejectApp.isPending ? "Rejecting..." : "Confirm Rejection"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="h-4 w-4" /> Approve & Issue</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Application</DialogTitle>
                  <DialogDescription>Approving this application will immediately generate a verifiable Indigene Certificate for {app.applicantName}.</DialogDescription>
                </DialogHeader>
                <div className="bg-muted/30 p-4 rounded-lg my-4 text-sm space-y-2">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Origin</span>
                    <span className="font-medium">{app.lgaName} LGA, {app.wardName} Ward</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">Issuing Officer</span>
                    <span className="font-medium">{user?.name}</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setApproveOpen(false)}>Cancel</Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove} disabled={approveApp.isPending}>
                    {approveApp.isPending ? "Processing..." : "Approve & Generate Certificate"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {app.status === "rejected" && app.rejectionReason && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Application Rejected</h3>
            <p className="text-sm mt-1">{app.rejectionReason}</p>
            <p className="text-xs opacity-80 mt-2">Reviewed by {app.reviewedByName || "Officer"} on {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : "Unknown date"}</p>
          </div>
        </div>
      )}

      {['approved', 'issued'].includes(app.status) && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex gap-3">
          <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Certificate Issued</h3>
            <p className="text-sm mt-1">Application was approved and certificate generated.</p>
            <p className="text-xs opacity-80 mt-2">Approved by {app.reviewedByName || "Officer"} on {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : "Unknown date"}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg">Applicant Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div><span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">Full Name</span><span className="font-medium">{app.firstName} {app.middleName} {app.lastName}</span></div>
              <div><span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">Gender</span><span className="font-medium">{app.gender}</span></div>
              <div><span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">Date of Birth</span><span className="font-medium">{app.dateOfBirth}</span></div>
              <div><span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">NIN</span><span className="font-medium font-mono">{app.nin}</span></div>
              <div><span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">Email</span><span className="font-medium">{app.email}</span></div>
              <div><span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">Phone</span><span className="font-medium">{app.phone}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">Address</span><span className="font-medium">{app.residentialAddress}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg">Claim of Origin</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div><span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">State</span><span className="font-medium">{app.stateOfOrigin}</span></div>
              <div><span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">LGA</span><span className="font-medium">{app.lgaName}</span></div>
              <div><span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">Ward</span><span className="font-medium">{app.wardName}</span></div>
              <div><span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">Community</span><span className="font-medium">{app.community}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">Father's Name</span><span className="font-medium">{app.fatherName}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">Mother's Name</span><span className="font-medium">{app.motherName}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Supporting Documents</CardTitle>
          <Badge variant="outline">{app.documents?.length || 0} Files</Badge>
        </CardHeader>
        <CardContent className="pt-4">
          {app.documents && app.documents.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {app.documents.map(doc => (
                <div key={doc.id} className="border rounded-md p-3 flex flex-col gap-2 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded text-primary shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase">{doc.type.replace('_', ' ')}</Badge>
                  </div>
                  <div>
                    <p className="font-medium text-sm truncate" title={doc.name}>{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.fileName} • {doc.sizeKb}KB</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2 gap-2 text-xs">
                    <Download className="h-3 w-3" /> View File
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 border border-dashed rounded-md bg-muted/10 text-muted-foreground">
              No supporting documents attached.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
