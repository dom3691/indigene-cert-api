import { useState } from "react";
import { 
  useListTenants, 
  useCreateTenant,
  useUpdateTenant,
  getListTenantsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, ExternalLink } from "lucide-react";

export default function PlatformTenants() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    certificatePrefix: "",
    fee: "2000"
  });

  const { data: tenants, isLoading } = useListTenants(undefined, {
    query: {
      queryKey: getListTenantsQueryKey()
    }
  });

  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();

  const handleAdd = () => {
    if (!formData.name || !formData.code || !formData.certificatePrefix) return;
    
    createTenant.mutate({
      data: {
        ...formData,
        fee: parseFloat(formData.fee)
      }
    }, {
      onSuccess: () => {
        toast({ title: "State Tenant created successfully" });
        setFormData({ name: "", code: "", certificatePrefix: "", fee: "2000" });
        setAddOpen(false);
        queryClient.invalidateQueries({ queryKey: getListTenantsQueryKey() });
      }
    });
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    updateTenant.mutate({
      tenantId: id,
      data: { status: newStatus }
    }, {
      onSuccess: () => {
        toast({ title: `Tenant ${newStatus === 'active' ? 'activated' : 'suspended'}` });
        queryClient.invalidateQueries({ queryKey: getListTenantsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">State Tenants</h1>
          <p className="text-muted-foreground">Manage participating state governments on the platform.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Tenant</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add State Tenant</DialogTitle>
              <DialogDescription>Onboard a new state government to the platform.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">State Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                  placeholder="e.g. Lagos State"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">State Code</Label>
                  <Input 
                    id="code" 
                    value={formData.code} 
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))} 
                    placeholder="e.g. LA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificatePrefix">Cert Prefix</Label>
                  <Input 
                    id="certificatePrefix" 
                    value={formData.certificatePrefix} 
                    onChange={e => setFormData(prev => ({ ...prev, certificatePrefix: e.target.value }))} 
                    placeholder="e.g. LAG"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">Default Processing Fee (₦)</Label>
                <Input 
                  id="fee" 
                  type="number"
                  value={formData.fee} 
                  onChange={e => setFormData(prev => ({ ...prev, fee: e.target.value }))} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!formData.name || !formData.code || createTenant.isPending}>
                {createTenant.isPending ? "Creating..." : "Create Tenant"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Enrolled States</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State / Tenant</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Cert Prefix</TableHead>
                <TableHead>Processing Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : tenants && tenants.length > 0 ? (
                tenants.map(tenant => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">
                      {tenant.name}
                      {tenant.capital && <div className="text-xs text-muted-foreground font-normal">{tenant.capital}</div>}
                    </TableCell>
                    <TableCell>{tenant.code}</TableCell>
                    <TableCell className="font-mono text-xs">{tenant.certificatePrefix}</TableCell>
                    <TableCell>₦{tenant.fee?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === 'active' ? 'default' : 'destructive'} className={tenant.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200' : ''}>
                        {tenant.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant={tenant.status === "active" ? "outline" : "default"} 
                        size="sm" 
                        onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                        disabled={updateTenant.isPending}
                      >
                        {tenant.status === "active" ? "Suspend" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No tenants found. Add your first state to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
