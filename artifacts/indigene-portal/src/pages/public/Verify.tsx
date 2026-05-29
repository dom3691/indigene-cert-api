import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useVerifyCertificate, getVerifyCertificateQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { FileText, Search, ShieldCheck, XCircle, AlertTriangle } from "lucide-react";

export default function Verify() {
  const [certNumber, setCertNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const encodedQuery = encodeURIComponent(searchQuery);
  const { data: result, isLoading, isError, error } = useVerifyCertificate(encodedQuery, {
    query: {
      enabled: !!searchQuery,
      retry: false,
      queryKey: getVerifyCertificateQueryKey(encodedQuery)
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (certNumber.trim()) {
      setSearchQuery(certNumber.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white">
        <Link href="/">
          <div className="flex items-center justify-center gap-2 text-primary font-semibold cursor-pointer">
            <FileText className="h-6 w-6" />
            <span className="text-lg">State Indigene Portal</span>
          </div>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/signin">
            <Button variant="ghost">Sign In</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Verify Certificate</h1>
            <p className="text-muted-foreground">
              Enter a certificate number below to verify its authenticity and current status.
            </p>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Certificate Search</CardTitle>
              <CardDescription>
                Certificate numbers can be found on the physical certificate or digital copy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input 
                  placeholder="e.g. LAG-2023-XYZ123" 
                  value={certNumber} 
                  onChange={(e) => setCertNumber(e.target.value)} 
                  className="flex-1"
                />
                <Button type="submit" disabled={!certNumber.trim() || isLoading}>
                  {isLoading ? "Verifying..." : (
                    <>
                      <Search className="mr-2 h-4 w-4" /> Verify
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {isLoading && (
            <Card className="animate-pulse">
              <CardContent className="p-8 flex flex-col items-center justify-center text-muted-foreground">
                <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                <p>Verifying with the registry...</p>
              </CardContent>
            </Card>
          )}

          {isError && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="p-6 flex items-center gap-4 text-destructive">
                <AlertTriangle className="h-8 w-8" />
                <div>
                  <h3 className="font-semibold text-lg">Verification Failed</h3>
                  <p>Could not verify the certificate. It may not exist or the service is temporarily unavailable.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card className={
              result.status === "valid" ? "border-green-200 bg-green-50/50" : 
              result.status === "revoked" ? "border-destructive/50 bg-destructive/10" : 
              "border-muted"
            }>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Verification Result</CardTitle>
                  <CardDescription>{result.result}</CardDescription>
                </div>
                {result.status === "valid" ? (
                  <ShieldCheck className="h-10 w-10 text-green-600" />
                ) : result.status === "revoked" ? (
                  <XCircle className="h-10 w-10 text-destructive" />
                ) : (
                  <AlertTriangle className="h-10 w-10 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {result.found ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Status</div>
                      <div className="mt-1"><StatusBadge status={result.status} /></div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Certificate Number</div>
                      <div className="font-mono mt-1">{result.certificateNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Applicant Name</div>
                      <div className="font-medium mt-1">{result.applicantDisplayName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">State of Origin</div>
                      <div className="font-medium mt-1">{result.stateOfOrigin}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Local Government Area</div>
                      <div className="font-medium mt-1">{result.lgaName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Issue Date</div>
                      <div className="font-medium mt-1">{result.issueDate ? new Date(result.issueDate).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-lg font-medium text-muted-foreground">No certificate found with this number.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <footer className="py-6 border-t text-center text-sm text-muted-foreground">
        <p>© 2025 Automated Indigene Certificate Issuance System.</p>
      </footer>
    </div>
  );
}
