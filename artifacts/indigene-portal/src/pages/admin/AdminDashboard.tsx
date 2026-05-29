import { useAuth } from "@/lib/auth";
import { useGetTenantDashboard, getGetTenantDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle, Clock, AlertTriangle, Activity, MapPin } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const { data: dashboard, isLoading } = useGetTenantDashboard(user?.tenantId || 0, {
    query: {
      enabled: !!user?.tenantId,
      queryKey: getGetTenantDashboardQueryKey(user?.tenantId || 0)
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight">Tenant Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!dashboard) return <div>Dashboard unavailable</div>;

  const COLORS = ['#0ea5e9', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6'];
  
  const formattedStatusData = dashboard.statusBreakdown?.map(item => ({
    name: item.status.replace('_', ' ').toUpperCase(),
    value: item.count
  })) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dashboard.tenantName} Dashboard</h1>
          <p className="text-muted-foreground">Overview of certificate issuance operations.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalApplications}</div>
            <p className="text-xs text-muted-foreground">All time submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.pendingReview}</div>
            <p className="text-xs text-muted-foreground">Awaiting officer action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued Certificates</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.issuedCertificates}</div>
            <p className="text-xs text-muted-foreground">Successfully generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">₦{dashboard.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From processing fees</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Current distribution of applications</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {formattedStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {formattedStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Applications by LGA</CardTitle>
            <CardDescription>Volume distribution across Local Government Areas</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dashboard.lgaBreakdown && dashboard.lgaBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.lgaBreakdown.slice(0, 5)} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="lgaName" type="category" width={80} tick={{fontSize: 12}} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
