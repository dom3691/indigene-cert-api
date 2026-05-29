import { useState } from "react";
import { Link, useParams } from "wouter";
import { 
  useGetApplication, 
  useUpdateApplication,
  useAddDocument,
  usePayApplication,
  getGetApplicationQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Upload, CreditCard, CheckCircle2, Download, Printer, ShieldCheck } from "lucide-react";

export default function ApplyDetail() {
  const { id } = useParams();
  const appId = parseInt(id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("identification");
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const { data: app, isLoading } = useGetApplication(appId, {
    query: {
      enabled: !!appId,
      queryKey: getGetApplicationQueryKey(appId)
    }
  });

  const updateApp = useUpdateApplication();
  const addDoc = useAddDocument();
  const payApp = usePayApplication();

  const handleUpload = () => {
    if (!fileSelected || !docName) return;
    
    addDoc.mutate({
      applicationId: appId,
      data: {
        name: docName,
        type: docType,
        fileName: fileSelected.name,
        sizeKb: Math.round(fileSelected.size / 1024)
      }
    }, {
      onSuccess: () => {
        toast({ title: "Document uploaded successfully" });
        setUploadOpen(false);
        setFileSelected(null);
        setDocName("");
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(appId) });
      }
    });
  };

  const handlePay = () => {
    payApp.mutate({
      applicationId: appId,
      data: {
        payerName: app?.applicantName || "Applicant",
        method: "card"
      }
    }, {
      onSuccess: () => {
        toast({ title: "Payment successful!" });
        setPayOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(appId) });
      }
    });
  };

  const handleSubmitApplication = () => {
    updateApp.mutate({
      applicationId: appId,
      data: { status: "awaiting_payment" }
    }, {
      onSuccess: () => {
        toast({ title: "Application submitted successfully" });
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(appId) });
      }
    });
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="p-8 space-y-4 max-w-4xl mx-auto"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!app) {
    return <div className="p-8 text-center">Application not found</div>;
  }

  const canSubmit = app.status === "draft" && (app.documents?.length || 0) > 0;
  const canPay = app.status === "awaiting_payment";
  const isIssued = app.status === "issued" && app.certificate;

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 print:m-0 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/apply">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Application #{app.id}</h1>
            <p className="text-muted-foreground">{app.tenantName} State</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={app.status} className="text-base py-1 px-3" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr] print:hidden">
        <div className="space-y-6">
          <Card>
            <Tabs defaultValue="details">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Application Details</TabsTrigger>
                  <TabsTrigger value="documents">Documents ({app.documents?.length || 0})</TabsTrigger>
                </TabsList>
              </div>
              <CardContent className="pt-6">
                <TabsContent value="details" className="space-y-6 m-0">
                  <div>
                    <h3 className="text-lg font-medium mb-4 border-b pb-2">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground block">Full Name</span><span className="font-medium">{app.firstName} {app.middleName} {app.lastName}</span></div>
                      <div><span className="text-muted-foreground block">NIN</span><span className="font-medium">{app.nin}</span></div>
                      <div><span className="text-muted-foreground block">Date of Birth</span><span className="font-medium">{app.dateOfBirth}</span></div>
                      <div><span className="text-muted-foreground block">Gender</span><span className="font-medium">{app.gender}</span></div>
                      <div><span className="text-muted-foreground block">Email</span><span className="font-medium">{app.email}</span></div>
                      <div><span className="text-muted-foreground block">Phone</span><span className="font-medium">{app.phone}</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4 border-b pb-2">Origin Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground block">State of Origin</span><span className="font-medium">{app.stateOfOrigin}</span></div>
                      <div><span className="text-muted-foreground block">LGA</span><span className="font-medium">{app.lgaName}</span></div>
                      <div><span className="text-muted-foreground block">Ward</span><span className="font-medium">{app.wardName}</span></div>
                      <div><span className="text-muted-foreground block">Community</span><span className="font-medium">{app.community}</span></div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="documents" className="m-0 space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Supporting Documents</h3>
                    {app.status === "draft" && (
                      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm"><Upload className="mr-2 h-4 w-4" /> Upload</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload Document</DialogTitle>
                            <DialogDescription>Attach supporting documents for your application.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Document Name</Label>
                              <Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Birth Certificate" />
                            </div>
                            <div className="space-y-2">
                              <Label>Document Type</Label>
                              <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={docType}
                                onChange={e => setDocType(e.target.value)}
                              >
                                <option value="identification">Identification (NIN/Passport)</option>
                                <option value="birth_certificate">Birth Certificate</option>
                                <option value="parent_id">Parent's ID</option>
                                <option value="letter_of_origin">Letter of Origin from Chief</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>Select File</Label>
                              <Input type="file" onChange={e => setFileSelected(e.target.files?.[0] || null)} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpload} disabled={!fileSelected || !docName || addDoc.isPending}>
                              {addDoc.isPending ? "Uploading..." : "Upload"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  {app.documents && app.documents.length > 0 ? (
                    <div className="border rounded-md divide-y">
                      {app.documents.map(doc => (
                        <div key={doc.id} className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded text-primary">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.fileName} • {doc.sizeKb}KB</p>
                            </div>
                          </div>
                          <Badge variant="outline">{doc.type.replace('_', ' ')}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 border border-dashed rounded-md bg-muted/20">
                      <p className="text-muted-foreground mb-2">No documents uploaded yet.</p>
                      <p className="text-xs text-muted-foreground">Upload identification and proof of origin to proceed.</p>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {/* Draft Step */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${app.status !== 'draft' ? 'bg-primary text-white' : 'bg-white text-muted-foreground'}`}>
                    {app.status !== 'draft' && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-white shadow-sm">
                    <div className="font-bold text-sm">Draft</div>
                    <div className="text-xs text-muted-foreground">Fill form & upload docs</div>
                  </div>
                </div>
                
                {/* Payment Step */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${['paid', 'under_review', 'approved', 'issued'].includes(app.status) ? 'bg-primary text-white' : 'bg-white text-muted-foreground'}`}>
                    {['paid', 'under_review', 'approved', 'issued'].includes(app.status) && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-white shadow-sm">
                    <div className="font-bold text-sm">Payment</div>
                    <div className="text-xs text-muted-foreground">Pay processing fee</div>
                  </div>
                </div>

                {/* Review Step */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${['approved', 'issued'].includes(app.status) ? 'bg-primary text-white' : 'bg-white text-muted-foreground'}`}>
                    {['approved', 'issued'].includes(app.status) && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-white shadow-sm">
                    <div className="font-bold text-sm">Review</div>
                    <div className="text-xs text-muted-foreground">Officer verification</div>
                  </div>
                </div>

                {/* Issued Step */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${app.status === 'issued' ? 'bg-primary text-white' : 'bg-white text-muted-foreground'}`}>
                    {app.status === 'issued' && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-white shadow-sm">
                    <div className="font-bold text-sm">Certificate</div>
                    <div className="text-xs text-muted-foreground">Ready for download</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                {app.status === "draft" && (
                  <Button 
                    className="w-full" 
                    disabled={!canSubmit || updateApp.isPending} 
                    onClick={handleSubmitApplication}
                  >
                    Submit Application
                  </Button>
                )}
                {app.status === "draft" && !canSubmit && (
                  <p className="text-xs text-center text-muted-foreground mt-2">Upload at least one document to submit.</p>
                )}
                
                {app.status === "awaiting_payment" && (
                  <Dialog open={payOpen} onOpenChange={setPayOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2"><CreditCard className="h-4 w-4" /> Pay Processing Fee</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Complete Payment</DialogTitle>
                        <DialogDescription>Pay the processing fee to advance your application to review.</DialogDescription>
                      </DialogHeader>
                      <div className="py-6 flex flex-col items-center">
                        <div className="text-3xl font-bold mb-2">₦2,500.00</div>
                        <p className="text-sm text-muted-foreground mb-6">{app.tenantName} State Processing Fee</p>
                        
                        <div className="w-full bg-muted/30 p-4 rounded-lg border">
                          <p className="text-sm font-medium mb-2">Demo Payment Gateway</p>
                          <p className="text-xs text-muted-foreground mb-4">Clicking below will simulate a successful card payment.</p>
                          <Button className="w-full" onClick={handlePay} disabled={payApp.isPending}>
                            {payApp.isPending ? "Processing..." : "Simulate Successful Payment"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {isIssued && (
                  <Button className="w-full gap-2" variant="default" onClick={handlePrintCertificate}>
                    <Printer className="h-4 w-4" /> Print Certificate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isIssued && app.certificate && (
        <div className="mt-8 border-2 border-gray-200 p-12 bg-white max-w-[800px] mx-auto relative shadow-sm print:shadow-none print:border-none print:p-0">
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <ShieldCheck className="w-96 h-96" />
          </div>
          
          <div className="text-center space-y-6 relative z-10">
            <div className="flex justify-center mb-4">
              <img src="/favicon.svg" alt="Logo" className="w-24 h-24" />
            </div>
            
            <div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 uppercase tracking-widest">{app.tenantName} STATE GOVERNMENT</h2>
              <p className="text-lg font-serif mt-2">LOCAL GOVERNMENT SERVICE COMMISSION</p>
            </div>
            
            <div className="py-6">
              <h1 className="text-4xl font-serif font-bold text-primary border-y-2 border-primary py-4 inline-block px-12">
                CERTIFICATE OF INDIGENE
              </h1>
            </div>
            
            <div className="text-lg space-y-6 max-w-2xl mx-auto leading-relaxed text-justify">
              <p>This is to certify that</p>
              <p className="text-3xl font-bold font-serif border-b border-gray-300 pb-1">{app.certificate.applicantDisplayName}</p>
              <p>is a bonafide indigene of</p>
              <div className="grid grid-cols-2 gap-4 text-center my-4">
                <div className="border-b border-gray-300 pb-1 font-bold text-xl">{app.certificate.wardName}</div>
                <div className="border-b border-gray-300 pb-1 font-bold text-xl">{app.certificate.lgaName}</div>
                <div className="text-sm text-gray-500 uppercase">Ward</div>
                <div className="text-sm text-gray-500 uppercase">Local Government Area</div>
              </div>
              <p>in {app.tenantName} State of Nigeria.</p>
            </div>
            
            <div className="grid grid-cols-3 gap-8 items-end mt-16 pt-8 text-left">
              <div className="text-center">
                <div className="border-t border-gray-400 pt-2 font-bold">{app.certificate.issuedByName || 'Authorizing Officer'}</div>
                <div className="text-sm text-gray-500">Issuing Officer</div>
              </div>
              <div className="flex flex-col items-center">
                <QRCodeSVG 
                  value={app.certificate.verificationUrl} 
                  size={120} 
                  level="H"
                  includeMargin={true}
                />
                <div className="text-xs text-center mt-2 font-mono">{app.certificate.certificateNumber}</div>
                <div className="text-[10px] text-gray-500 text-center mt-1">Scan to verify authenticity</div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-2 font-bold">{new Date(app.certificate.issueDate).toLocaleDateString()}</div>
                <div className="text-sm text-gray-500">Date of Issue</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
