import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useGetTenant, useUpdateTenant, getGetTenantQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Save } from "lucide-react";

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const tenantId = user?.tenantId || 0;
  
  const { data: tenant, isLoading } = useGetTenant(tenantId, {
    query: {
      enabled: !!tenantId,
      queryKey: getGetTenantQueryKey(tenantId)
    }
  });

  const updateTenant = useUpdateTenant();

  const [formData, setFormData] = useState({
    name: "",
    certificatePrefix: "",
    fee: "0",
    contactEmail: "",
    contactPhone: "",
    address: "",
    capital: "",
    tagline: ""
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || "",
        certificatePrefix: tenant.certificatePrefix || "",
        fee: tenant.fee?.toString() || "0",
        contactEmail: tenant.contactEmail || "",
        contactPhone: tenant.contactPhone || "",
        address: tenant.address || "",
        capital: tenant.capital || "",
        tagline: tenant.tagline || ""
      });
    }
  }, [tenant]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenant.mutate({
      tenantId,
      data: {
        ...formData,
        fee: parseFloat(formData.fee)
      }
    }, {
      onSuccess: () => {
        toast({ title: "Settings updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetTenantQueryKey(tenantId) });
      }
    });
  };

  if (isLoading) {
    return <div className="space-y-6 max-w-4xl"><Skeleton className="h-10 w-48" /><Skeleton className="h-[500px] w-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenant Settings</h1>
        <p className="text-muted-foreground">Configure your state portal profile and certificate parameters.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Update the public information visible to applicants.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">State Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capital">State Capital</Label>
                <Input id="capital" name="capital" value={formData.capital} onChange={handleChange} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tagline">Portal Tagline</Label>
              <Input id="tagline" name="tagline" value={formData.tagline} onChange={handleChange} placeholder="e.g. Official E-Governance Portal" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="certificatePrefix">Certificate Number Prefix</Label>
                <Input id="certificatePrefix" name="certificatePrefix" value={formData.certificatePrefix} onChange={handleChange} required placeholder="e.g. KAN, LAG" />
                <p className="text-xs text-muted-foreground">Prepended to all generated certificate numbers.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">Processing Fee (₦)</Label>
                <Input id="fee" name="fee" type="number" min="0" step="100" value={formData.fee} onChange={handleChange} required />
                <p className="text-xs text-muted-foreground">Amount applicants pay before review.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Support Email</Label>
                <Input id="contactEmail" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Support Phone</Label>
                <Input id="contactPhone" name="contactPhone" value={formData.contactPhone} onChange={handleChange} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Office Address</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={updateTenant.isPending} className="ml-auto gap-2">
              <Save className="h-4 w-4" /> 
              {updateTenant.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
