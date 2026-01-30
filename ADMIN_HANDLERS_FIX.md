# AdminDashboard Handlers Fix

Replace the handleApprove, handleReject, and handleDelete functions (lines 494-750) with these simplified versions:

```typescript
  const handleApprove = async () => {
    if (!selectedAffiliate) return;
    
    toast({
      title: "Approving affiliate...",
      description: "Approving affiliate and creating unilink...",
    });

    try {
      const response = await approveAffiliate(selectedAffiliate.id, {
        adminNotes: adminNotes || undefined,
        approvedBy: user?.email || 'admin',
      });
      
      if (response.success) {
        toast({
          title: "✅ Approved",
          description: `${selectedAffiliate.name} has been approved successfully.`,
          duration: 5000,
        });
        
        setApprovalDialogOpen(false);
        setAdminNotes("");
        setSelectedAffiliate(null);
        fetchAffiliates();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve affiliate",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedAffiliate) return;

    try {
      const response = await rejectAffiliate(selectedAffiliate.id, {
        adminNotes: adminNotes || undefined,
        approvedBy: user?.email || 'admin',
      });
      
      if (response.success) {
        toast({
          title: "Rejected",
          description: `${selectedAffiliate.name} has been rejected`,
        });
        setRejectionDialogOpen(false);
        setAdminNotes("");
        setSelectedAffiliate(null);
        fetchAffiliates();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject affiliate",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedAffiliate) return;

    try {
      const response = await deleteAffiliate(selectedAffiliate.id);
      
      if (response.success) {
        toast({
          title: "Deleted",
          description: `${selectedAffiliate.name} has been deleted`,
        });
        setDeleteDialogOpen(false);
        setSelectedAffiliate(null);
        fetchAffiliates();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete affiliate",
        variant: "destructive",
      });
    }
  };
```

Lines to replace:
- handleApprove: 494-675 (182 lines)
- handleReject: 677-711 (35 lines) 
- handleDelete: 727-750 (24 lines)
