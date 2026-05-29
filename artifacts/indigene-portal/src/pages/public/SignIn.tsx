import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useListAccounts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

export default function SignIn() {
  const { signIn } = useAuth();
  const [, setLocation] = useLocation();
  const { data: accounts, isLoading } = useListAccounts();

  const handleSignIn = (account: any) => {
    signIn(account);
    if (account.role === "applicant") setLocation("/apply");
    else if (account.role === "officer") setLocation("/officer");
    else if (account.role === "tenant_admin") setLocation("/admin");
    else setLocation("/platform");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <Link href="/">
        <div className="flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-8">
          <FileText className="h-8 w-8" />
          <span>Indigene Portal</span>
        </div>
      </Link>
      
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl">Demo Sign In</CardTitle>
          <CardDescription>
            Select a demo account below to sign in and test the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="grid gap-3">
              {accounts?.map((acc) => (
                <div 
                  key={acc.id} 
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-primary cursor-pointer hover:bg-primary/5 transition-all"
                  onClick={() => handleSignIn(acc)}
                >
                  <div>
                    <div className="font-medium text-foreground">{acc.name}</div>
                    <div className="text-xs text-muted-foreground">{acc.email}</div>
                    {acc.tenantName && (
                      <div className="text-xs text-primary mt-1">{acc.tenantName}</div>
                    )}
                  </div>
                  <Badge variant={
                    acc.role === "super_admin" ? "destructive" : 
                    acc.role === "tenant_admin" ? "default" :
                    acc.role === "officer" ? "secondary" : "outline"
                  }>
                    {acc.role.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
