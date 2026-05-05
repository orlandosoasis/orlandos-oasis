import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import {
  useTechnicianPools,
  useUnassignedPools,
  useAssignPoolToTech,
} from "@/hooks/useAdminDetails";
import { useToast } from "@/hooks/use-toast";

export default function TechPoolAssignmentPanel({ technicianId }: { technicianId: string }) {
  const { toast } = useToast();
  const techPools = useTechnicianPools(technicianId);
  const allPools = useUnassignedPools();
  const assign = useAssignPoolToTech();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string>("");

  const handleRemove = async (poolId: string) => {
    try {
      await assign.mutateAsync({ poolId, technicianId: null });
      toast({ title: "Pool unassigned", variant: "success" });
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const handleAssign = async () => {
    if (!selectedPoolId) return;
    try {
      await assign.mutateAsync({ poolId: selectedPoolId, technicianId });
      setAddOpen(false);
      setSelectedPoolId("");
      toast({ title: "Pool assigned", variant: "success" });
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const candidatePools = (allPools.data ?? []).filter(
    (p) => p.assignedTechId !== technicianId
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Assigned Pools</CardTitle>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Assign Pool
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>Homeowner</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {techPools.isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">Loading…</TableCell></TableRow>
            ) : (techPools.data?.length ?? 0) === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4 text-sm">No pools assigned to this technician.</TableCell></TableRow>
            ) : techPools.data!.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-semibold">{p.address}</TableCell>
                <TableCell>{p.homeownerName}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => handleRemove(p.id)}>
                    <X className="h-3.5 w-3.5" /> Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="pt-10">
          <DialogHeader>
            <DialogTitle>Assign Pool to Technician</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Select pool</label>
            <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
              <SelectTrigger><SelectValue placeholder="Choose a pool…" /></SelectTrigger>
              <SelectContent>
                {candidatePools.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.address} — {p.homeownerName}
                    {p.assignedTechId ? " (currently assigned)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Reassigning a pool already assigned to another technician will move it.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedPoolId || assign.isPending}>
              {assign.isPending ? "Assigning…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
