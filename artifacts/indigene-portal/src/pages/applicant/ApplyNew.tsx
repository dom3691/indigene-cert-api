import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  useListTenants, 
  useListLgas, 
  useCreateApplication,
  getListTenantsQueryKey,
  getListLgasQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Save, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ApplyNew() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    tenantId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    nin: "",
    email: user?.email || "",
    phone: "",
    residentialAddress: "",
    stateOfOrigin: "",
    lgaId: "",
    wardId: "",
    fatherName: "",
    motherName: "",
    community: "",
  });

  const { data: tenants, isLoading: tenantsLoading } = useListTenants({ status: "active" }, {
    query: { queryKey: getListTenantsQueryKey({ status: "active" }) }
  });

  const selectedTenantId = parseInt(formData.tenantId) || 0;
  
  const { data: lgas, isLoading: lgasLoading } = useListLgas(selectedTenantId, {
    query: {
      enabled: !!selectedTenantId,
      queryKey: getListLgasQueryKey(selectedTenantId)
    }
  });

  const createApplication = useCreateApplication();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-set state of origin based on tenant selection
    if (name === "tenantId" && tenants) {
      const selectedTenant = tenants.find(t => t.id.toString() === value);
      if (selectedTenant) {
        setFormData(prev => ({ ...prev, [name]: value, stateOfOrigin: selectedTenant.name, lgaId: "", wardId: "" }));
      }
    }
  };

  const selectedLga = lgas?.find(lga => lga.id.toString() === formData.lgaId);
  const wards = selectedLga?.wards || [];

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    createApplication.mutate({
      data: {
        tenantId: parseInt(formData.tenantId),
        applicantId: user.id,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        nin: formData.nin,
        email: formData.email,
        phone: formData.phone,
        residentialAddress: formData.residentialAddress,
        stateOfOrigin: formData.stateOfOrigin,
        lgaId: parseInt(formData.lgaId),
        wardId: parseInt(formData.wardId),
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        community: formData.community,
      }
    }, {
      onSuccess: (data) => {
        toast({
          title: "Application Created",
          description: "Your application has been saved as a draft.",
        });
        setLocation(`/apply/${data.id}`);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create application. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/apply">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Application</h1>
          <p className="text-muted-foreground">Complete the form below to apply for your certificate.</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -z-10 -translate-y-1/2 rounded"></div>
        <div className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
        
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${step >= i ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-muted text-muted-foreground'} font-semibold transition-colors duration-300`}>
            {step > i ? <CheckCircle className="h-5 w-5" /> : i}
          </div>
        ))}
      </div>

      <Card>
        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Basic Information"}
              {step === 2 && "Origin Details"}
              {step === 3 && "Review & Submit"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Personal and contact details"}
              {step === 2 && "Information about your community and parents"}
              {step === 3 && "Review your information before saving"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" required value={formData.firstName} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" required value={formData.lastName} onChange={handleInputChange} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name (Optional)</Label>
                    <Input id="middleName" name="middleName" value={formData.middleName} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(v) => handleSelectChange("gender", v)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" required value={formData.dateOfBirth} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nin">NIN (National Identity Number)</Label>
                    <Input id="nin" name="nin" required value={formData.nin} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" required value={formData.phone} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="residentialAddress">Current Residential Address</Label>
                  <Input id="residentialAddress" name="residentialAddress" required value={formData.residentialAddress} onChange={handleInputChange} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tenantId">Applying to State</Label>
                  <Select value={formData.tenantId} onValueChange={(v) => handleSelectChange("tenantId", v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder={tenantsLoading ? "Loading states..." : "Select state"} />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants?.map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lgaId">Local Government Area (LGA)</Label>
                    <Select value={formData.lgaId} onValueChange={(v) => handleSelectChange("lgaId", v)} required disabled={!formData.tenantId || lgasLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={lgasLoading ? "Loading..." : "Select LGA"} />
                      </SelectTrigger>
                      <SelectContent>
                        {lgas?.map(lga => (
                          <SelectItem key={lga.id} value={lga.id.toString()}>{lga.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wardId">Ward</Label>
                    <Select value={formData.wardId} onValueChange={(v) => handleSelectChange("wardId", v)} required disabled={!formData.lgaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map(ward => (
                          <SelectItem key={ward.id} value={ward.id.toString()}>{ward.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="community">Hometown / Community</Label>
                  <Input id="community" name="community" required value={formData.community} onChange={handleInputChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Full Name</Label>
                    <Input id="fatherName" name="fatherName" required value={formData.fatherName} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherName">Mother's Full Name</Label>
                    <Input id="motherName" name="motherName" required value={formData.motherName} onChange={handleInputChange} />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 bg-muted/30 p-4 rounded-lg border">
                  <div>
                    <span className="text-muted-foreground block mb-1">Full Name</span>
                    <span className="font-medium">{formData.firstName} {formData.middleName} {formData.lastName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">NIN</span>
                    <span className="font-medium">{formData.nin}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Contact</span>
                    <span className="font-medium">{formData.email} <br/> {formData.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Applying to</span>
                    <span className="font-medium">{formData.stateOfOrigin} State</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Origin Details</span>
                    <span className="font-medium">{selectedLga?.name} LGA<br/>{wards.find(w => w.id.toString() === formData.wardId)?.name} Ward</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Parents</span>
                    <span className="font-medium">F: {formData.fatherName}<br/>M: {formData.motherName}</span>
                  </div>
                </div>
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-100 flex gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Ready to save</h4>
                    <p className="mt-1 text-blue-700/80 text-sm">Saving this form will create a draft application. You'll be able to upload supporting documents and make payment on the next screen before final submission.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-6">
            <Button type="button" variant="outline" onClick={handlePrev} disabled={step === 1 || createApplication.isPending}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            
            {step < 3 ? (
              <Button type="submit">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={createApplication.isPending}>
                {createApplication.isPending ? "Saving..." : (
                  <>Save Draft & Continue <Save className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
