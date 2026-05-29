import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, ArrowRight } from "lucide-react";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/">
          <div className="flex items-center justify-center gap-2 text-primary font-semibold">
            <FileText className="h-6 w-6" />
            <span className="text-lg">State Indigene Portal</span>
          </div>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/verify">
            <Button variant="ghost">Verify Certificate</Button>
          </Link>
          {user ? (
            <Link href={user.role === "applicant" ? "/apply" : user.role === "officer" ? "/officer" : user.role === "tenant_admin" ? "/admin" : "/platform"}>
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <Link href="/signin">
              <Button>Sign In</Button>
            </Link>
          )}
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-12">
        <div className="max-w-3xl space-y-8">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-4">
            Official E-Government Service
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
            Apply for your <span className="text-primary">Indigene Certificate</span> online.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A fast, secure, and transparent way to obtain your proof of origin. Apply, track, and verify your certificate from anywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href={user ? "/apply" : "/signin"}>
              <Button size="lg" className="gap-2 text-lg px-8">
                Start Application <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8">
                Verify a Certificate <CheckCircle className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <footer className="py-6 w-full border-t text-center text-sm text-muted-foreground">
        <p>© 2025 Automated Indigene Certificate Issuance System.</p>
      </footer>
    </div>
  );
}
