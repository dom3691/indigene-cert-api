import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LogOut, Menu, User, FileText, CheckCircle, LayoutDashboard, Settings, MapPin, Users, Activity, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [location] = useLocation();

  if (!user) {
    return <>{children}</>;
  }

  const navItems = {
    applicant: [
      { label: "My Applications", href: "/apply", icon: FileText },
    ],
    officer: [
      { label: "Review Queue", href: "/officer", icon: CheckCircle },
    ],
    tenant_admin: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Geography", href: "/admin/geography", icon: MapPin },
      { label: "Officers", href: "/admin/officers", icon: Users },
      { label: "Audit Log", href: "/admin/audit", icon: Activity },
    ],
    super_admin: [
      { label: "Platform Overview", href: "/platform", icon: LayoutDashboard },
      { label: "Tenants", href: "/platform/tenants", icon: Building2 },
    ],
  }[user.role] || [];

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <div className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary ${location === item.href ? "bg-muted text-primary" : "text-muted-foreground"}`}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </div>
        </Link>
      ))}
    </>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <FileText className="h-6 w-6" />
                <span className="">Indigene Portal</span>
              </div>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLinks />
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link href="/">
                  <div className="flex items-center gap-2 text-lg font-semibold text-primary mb-4">
                    <FileText className="h-6 w-6" />
                    <span>Indigene Portal</span>
                  </div>
                </Link>
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1"></div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user.name}
                <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                <div className="text-xs text-primary font-medium mt-1">{user.role.replace("_", " ").toUpperCase()}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
