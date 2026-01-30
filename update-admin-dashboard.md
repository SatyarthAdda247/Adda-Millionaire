# AdminDashboard.tsx Update Required

## Current State
The `handleApprove` function has mixed old/new code causing issues.

## Required Changes

### 1. Update State Variables

Add:
```typescript
const [manualLinkUrl, setManualLinkUrl] = useState("");
```

### 2. Rewrite handleApprove

Replace entire function with:
```typescript
const handleApprove = async () => {
  if (!selectedAffiliate) return;
  
  try {
    const response = await approveAffiliate(selectedAffiliate.id, {
      adminNotes: adminNotes || undefined,
      approvedBy: 'admin'
    });
    
    if (response.success) {
      toast({
        title: "✅ Affiliate Approved!",
        description: "Now create link manually in AppTrove dashboard.",
        duration: 5000,
      });
      
      // Close approval dialog
      setApprovalDialogOpen(false);
      setAdminNotes("");
      
      // Open AppTrove dashboard in new tab
      window.open('https://dashboard.apptrove.com/v2/app/wBehUW', '_blank');
      
      // Show assign link dialog
      setAssignLinkDialogOpen(true);
      
      // Refresh affiliates
      fetchAffiliates();
    } else {
      throw new Error(response.error || 'Approval failed');
    }
  } catch (error) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to approve affiliate",
      variant: "destructive",
    });
  }
};
```

### 3. Add handleAssignLink Function

```typescript
const handleAssignLink = async () => {
  if (!selectedAffiliate || !manualLinkUrl) {
    toast({
      title: "Error",
      description: "Please enter a link URL",
      variant: "destructive",
    });
    return;
  }
  
  try {
    const response = await assignLinkToAffiliate(selectedAffiliate.id, {
      unilink: manualLinkUrl,
      templateId: 'wBehUW'
    });
    
    if (response.success) {
      toast({
        title: "✅ Link Assigned!",
        description: `Link assigned to ${selectedAffiliate.name}`,
      });
      
      setAssignLinkDialogOpen(false);
      setManualLinkUrl("");
      setSelectedAffiliate(null);
      fetchAffiliates();
    } else {
      throw new Error(response.error || 'Assignment failed');
    }
  } catch (error) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to assign link",
      variant: "destructive",
    });
  }
};
```

### 4. Update Assign Link Dialog

Find the dialog (around line 1837) and replace its content with:
```tsx
<Dialog open={assignLinkDialogOpen} onOpenChange={setAssignLinkDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Assign Link to {selectedAffiliate?.name}</DialogTitle>
      <DialogDescription>
        Create the link in AppTrove dashboard (opened in new tab), then paste it here.
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">AppTrove Link URL</label>
        <Input
          placeholder="https://applink.reevo.in/d/..."
          value={manualLinkUrl}
          onChange={(e) => setManualLinkUrl(e.target.value)}
          className="mt-2"
        />
        <p className="text-xs text-gray-500 mt-2">
          Copy the full link URL from AppTrove dashboard
        </p>
      </div>
      
      <Button
        variant="outline"
        className="w-full"
        onClick={() => window.open('https://dashboard.apptrove.com/v2/app/wBehUW', '_blank')}
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Open AppTrove Dashboard
      </Button>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setAssignLinkDialogOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleAssignLink} disabled={!manualLinkUrl}>
        Assign Link
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Summary

This removes all automation code and creates a simple manual flow:
1. Approve → Opens AppTrove in new tab
2. Admin creates link manually
3. Admin pastes link back
4. System saves it

Much simpler and more reliable!
