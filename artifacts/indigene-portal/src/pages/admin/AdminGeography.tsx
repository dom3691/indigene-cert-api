import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { 
  useListLgas, 
  useCreateLga,
  useCreateWard,
  getListLgasQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, ListTree } from "lucide-react";

export default function AdminGeography() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tenantId = user?.tenantId || 0;

  const [newLgaName, setNewLgaName] = useState("");
  const [newWardName, setNewWardName] = useState("");
  const [selectedLgaId, setSelectedLgaId] = useState<number | null>(null);
  
  const [addLgaOpen, setAddLgaOpen] = useState(false);
  const [addWardOpen, setAddWardOpen] = useState(false);

  const { data: lgas, isLoading } = useListLgas(tenantId, {
    query: {
      enabled: !!tenantId,
      queryKey: getListLgasQueryKey(tenantId)
    }
  });

  const createLga = useCreateLga();
  const createWard = useCreateWard();

  const handleAddLga = () => {
    if (!newLgaName.trim()) return;
    createLga.mutate({
      tenantId,
      data: { name: newLgaName.trim() }
    }, {
      onSuccess: () => {
        toast({ title: "LGA created successfully" });
        setNewLgaName("");
        setAddLgaOpen(false);
        queryClient.invalidateQueries({ queryKey: getListLgasQueryKey(tenantId) });
      }
    });
  };

  const handleAddWard = () => {
    if (!newWardName.trim() || !selectedLgaId) return;
    createWard.mutate({
      lgaId: selectedLgaId,
      data: { name: newWardName.trim() }
    }, {
      onSuccess: () => {
        toast({ title: "Ward created successfully" });
        setNewWardName("");
        setAddWardOpen(false);
        queryClient.invalidateQueries({ queryKey: getListLgasQueryKey(tenantId) });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Geography Management</h1>
          <p className="text-muted-foreground">Manage Local Government Areas (LGAs) and Wards.</p>
        </div>
        <Dialog open={addLgaOpen} onOpenChange={setAddLgaOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add LGA</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New LGA</DialogTitle>
              <DialogDescription>Create a new Local Government Area for your state.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="lgaName">LGA Name</Label>
              <Input 
                id="lgaName" 
                value={newLgaName} 
                onChange={e => setNewLgaName(e.target.value)} 
                placeholder="e.g. Ikeja, Kano Municipal"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddLgaOpen(false)}>Cancel</Button>
              <Button onClick={handleAddLga} disabled={!newLgaName.trim() || createLga.isPending}>
                {createLga.isPending ? "Creating..." : "Create LGA"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> State LGAs</CardTitle>
          <CardDescription>Applicants will select from these LGAs and their associated Wards.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-12 bg-muted/50 rounded animate-pulse" />
              <div className="h-12 bg-muted/50 rounded animate-pulse" />
              <div className="h-12 bg-muted/50 rounded animate-pulse" />
            </div>
          ) : lgas && lgas.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {lgas.map(lga => (
                <AccordionItem key={lga.id} value={`lga-${lga.id}`}>
                  <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 rounded-t-md border-b-0 data-[state=open]:bg-muted/30">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="font-semibold text-base">{lga.name}</span>
                      <span className="text-sm text-muted-foreground font-normal">{lga.wards?.length || 0} Wards</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2 bg-muted/10 rounded-b-md border-x border-b">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <ListTree className="h-4 w-4 text-muted-foreground" /> Wards in {lga.name}
                      </h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs gap-1"
                        onClick={() => { setSelectedLgaId(lga.id); setAddWardOpen(true); }}
                      >
                        <Plus className="h-3 w-3" /> Add Ward
                      </Button>
                    </div>
                    
                    {lga.wards && lga.wards.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {lga.wards.map(ward => (
                          <div key={ward.id} className="bg-white border rounded px-3 py-2 text-sm">
                            {ward.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded bg-white">
                        No wards configured for this LGA.
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No LGAs configured yet. Click "Add LGA" to begin building your state's geography.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addWardOpen} onOpenChange={setAddWardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Ward</DialogTitle>
            <DialogDescription>
              Add a ward to {lgas?.find(l => l.id === selectedLgaId)?.name} LGA.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="wardName">Ward Name</Label>
            <Input 
              id="wardName" 
              value={newWardName} 
              onChange={e => setNewWardName(e.target.value)} 
              placeholder="e.g. Ward A, Central Ward"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddWardOpen(false)}>Cancel</Button>
            <Button onClick={handleAddWard} disabled={!newWardName.trim() || createWard.isPending}>
              {createWard.isPending ? "Adding..." : "Add Ward"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
