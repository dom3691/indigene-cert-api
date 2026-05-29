import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/public/Landing";
import SignIn from "@/pages/public/SignIn";
import Verify from "@/pages/public/Verify";
import ApplyDashboard from "@/pages/applicant/ApplyDashboard";
import ApplyNew from "@/pages/applicant/ApplyNew";
import ApplyDetail from "@/pages/applicant/ApplyDetail";
import OfficerDashboard from "@/pages/officer/OfficerDashboard";
import OfficerDetail from "@/pages/officer/OfficerDetail";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminGeography from "@/pages/admin/AdminGeography";
import AdminOfficers from "@/pages/admin/AdminOfficers";
import AdminAudit from "@/pages/admin/AdminAudit";
import PlatformDashboard from "@/pages/superadmin/PlatformDashboard";
import PlatformTenants from "@/pages/superadmin/PlatformTenants";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/signin" component={SignIn} />
      <Route path="/verify" component={Verify} />
      
      <Route>
        <AppShell>
          <Switch>
            <Route path="/apply" component={ApplyDashboard} />
            <Route path="/apply/new" component={ApplyNew} />
            <Route path="/apply/:id" component={ApplyDetail} />
            
            <Route path="/officer" component={OfficerDashboard} />
            <Route path="/officer/:id" component={OfficerDetail} />
            
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/settings" component={AdminSettings} />
            <Route path="/admin/geography" component={AdminGeography} />
            <Route path="/admin/officers" component={AdminOfficers} />
            <Route path="/admin/audit" component={AdminAudit} />
            
            <Route path="/platform" component={PlatformDashboard} />
            <Route path="/platform/tenants" component={PlatformTenants} />
            
            <Route component={NotFound} />
          </Switch>
        </AppShell>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
