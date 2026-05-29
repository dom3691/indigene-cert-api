import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { 
  useListOfficers, 
  useCreateOfficer,
  getListOfficersQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, ShieldAlert } from "lucide-react";

export default function AdminOfficers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tenantId = user?.tenantId || 0;

  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "officer"
  });

  const { data: officers, isLoading } = useListOfficers(tenantId, {
    query: {
      enabled: !!tenantId,
      queryKey: getListOfficersQueryKey(tenantId)
    }
  });

  const createOfficer = useCreateOfficer();

  const handleAdd = () => {
    if (!formData.name || !formData.email) return;
    
    createOfficer.mutate({
      tenantId,
      data: formData
    }, {
      onSuccess: () => {
        toast({ title: "Account created successfully" });
        setFormData({ name: "", email: "", role: "officer" });
        setAddOpen(false);
        queryClient.invalidateQueries({ queryKey: getListOfficersQueryKey(tenantId) });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage issuing officers and tenant administrators.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>Create an account for an issuing officer or administrator.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} 
                  placeholder="jane@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={v => setFormData(prev => ({ ...prev, role: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="officer">Issuing Officer</SelectItem>
                    <SelectItem value="tenant_admin">Tenant Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!formData.name || !formData.email || createOfficer.isPending}>
                {createOfficer.isPending ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Active Staff</CardTitle>
          <CardDescription>All staff members with access to your tenant.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Reviewed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : officers && officers.length > 0 ? (
                officers.map(officer => (
                  <TableRow key={officer.id}>
                    <TableCell>
                      <div className="font-medium">{officer.name}</div>
                      <div className="text-xs text-muted-foreground">{officer.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {officer.role === 'tenant_admin' && <ShieldAlert className="h-3 w-3 text-amber-500" />}
                        <span className={officer.role === 'tenant_admin' ? "font-medium" : ""}>
                          {officer.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={officer.status === 'active' ? 'default' : 'secondary'} className={officer.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200' : ''}>
                        {officer.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {officer.role === 'officer' ? (officer.reviewedCount || 0) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No staff members found.
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
