import { useGetPlatformOverview, getGetPlatformOverviewQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FileText, CheckCircle, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function PlatformDashboard() {
  const { data: dashboard, isLoading } = useGetPlatformOverview({
    query: {
      queryKey: getGetPlatformOverviewQueryKey()
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!dashboard) return <div>Dashboard unavailable</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground">Global metrics across all state tenants.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalTenants}</div>
            <p className="text-xs text-muted-foreground">{dashboard.activeTenants} active, {dashboard.suspendedTenants} suspended</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalApplications}</div>
            <p className="text-xs text-muted-foreground">Across all states</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalCertificates}</div>
            <p className="text-xs text-muted-foreground">Issued successfully</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Revenue</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">₦{dashboard.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total volume processed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Performance</CardTitle>
          <CardDescription>Applications vs Certificates by State</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {dashboard.tenants && dashboard.tenants.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.tenants} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="tenantName" />
                <YAxis />
                <RechartsTooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="applications" name="Applications" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="certificates" name="Certificates Issued" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">No tenant data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
