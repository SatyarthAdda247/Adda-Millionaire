import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  LogOut,
  User,
  MessageSquare,
  Check,
  X,
  MousePointerClick,
  TrendingUp,
  DollarSign,
  ExternalLink,
  Eye,
  Calendar,
  Phone,
  Mail,
  Link as LinkIcon,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string;
  platform: string;
  socialHandle: string;
  followerCount: string;
  createdAt: string;
  updatedAt?: string;
  approvalStatus?: string;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  status?: string;
  links?: Array<{ id: string; link: string; createdAt?: string }>;
  stats?: {
    totalClicks: number;
    totalConversions: number;
    totalEarnings: number;
    conversionRate: number;
    lastActivity: string;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<string>("pending");
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [overallStats, setOverallStats] = useState({
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    conversionRate: 0
  });

  useEffect(() => {
    // Temporarily skip auth check - will configure auth later
    setAuthenticated(true);
    setUser({ email: 'admin@example.com', name: 'Admin' });
    fetchAffiliates();
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchAffiliates();
      fetchOverallStats();
    }
  }, [authenticated, approvalFilter]);

  const fetchOverallStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
      if (response.ok) {
        const data = await response.json();
        if (data.overview) {
          setOverallStats({
            totalClicks: data.overview.totalClicks || 0,
            totalConversions: data.overview.totalConversions || 0,
            totalEarnings: data.overview.totalEarnings || 0,
            conversionRate: data.overview.conversionRate || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching overall stats:', error);
    }
  };

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (approvalFilter !== "all") {
        params.append("approvalStatus", approvalFilter);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/users?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch affiliates');
      }
      
      const data = await response.json();
      setAffiliates(data);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch affiliates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedAffiliate) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${selectedAffiliate.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminNotes: adminNotes,
          approvedBy: user?.email || 'admin'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Approved",
          description: `${selectedAffiliate.name} has been approved`,
        });
        setApprovalDialogOpen(false);
        setAdminNotes("");
        setSelectedAffiliate(null);
        fetchAffiliates();
      } else {
        throw new Error(data.error || 'Failed to approve');
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
      const response = await fetch(`${API_BASE_URL}/api/users/${selectedAffiliate.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminNotes: adminNotes,
          approvedBy: user?.email || 'admin'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Rejected",
          description: `${selectedAffiliate.name} has been rejected`,
        });
        setRejectionDialogOpen(false);
        setAdminNotes("");
        setSelectedAffiliate(null);
        fetchAffiliates();
      } else {
        throw new Error(data.error || 'Failed to reject');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject affiliate",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    // Temporarily disabled - auth will be configured later
    navigate('/');
  };

  const filteredAffiliates = affiliates.filter((affiliate) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      affiliate.name.toLowerCase().includes(searchLower) ||
      affiliate.email.toLowerCase().includes(searchLower) ||
      affiliate.socialHandle.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = affiliates.filter(a => (a.approvalStatus || 'pending') === 'pending').length;
  const approvedCount = affiliates.filter(a => (a.approvalStatus || 'pending') === 'approved').length;
  const rejectedCount = affiliates.filter(a => (a.approvalStatus || 'pending') === 'rejected').length;

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Manage affiliate approvals</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>Admin Access</span>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Approval</CardTitle>
              <Clock className="w-5 h-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Clicks</CardTitle>
              <MousePointerClick className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{overallStats.totalClicks.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Conversions</CardTitle>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{overallStats.totalConversions.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {overallStats.conversionRate.toFixed(2)}% rate
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
              <DollarSign className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">₹{overallStats.totalEarnings.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or handle..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  fetchAffiliates();
                  fetchOverallStats();
                  toast({
                    title: "Refreshed",
                    description: "Data updated successfully",
                  });
                }}
                variant="outline"
                className="border-gray-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Affiliates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Affiliate Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : filteredAffiliates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No affiliates found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Platform Info</TableHead>
                      <TableHead>Trackier Stats</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAffiliates.map((affiliate) => {
                      const status = affiliate.approvalStatus || 'pending';
                      const stats = affiliate.stats || {
                        totalClicks: 0,
                        totalConversions: 0,
                        totalEarnings: 0,
                        conversionRate: 0,
                        lastActivity: affiliate.createdAt
                      };
                      return (
                        <TableRow key={affiliate.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{affiliate.name}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Joined: {new Date(affiliate.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span>{affiliate.email}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span>{affiliate.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="text-gray-500">Platform:</span> {affiliate.platform || '-'}
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">Handle:</span> {affiliate.socialHandle || '-'}
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">Followers:</span> {affiliate.followerCount || '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {affiliate.links && affiliate.links.length > 0 ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs">
                                  <MousePointerClick className="w-3 h-3 text-blue-600" />
                                  <span className="text-gray-600">Clicks:</span>
                                  <span className="font-semibold">{stats.totalClicks.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <TrendingUp className="w-3 h-3 text-green-600" />
                                  <span className="text-gray-600">Conversions:</span>
                                  <span className="font-semibold">{stats.totalConversions.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <DollarSign className="w-3 h-3 text-green-600" />
                                  <span className="text-gray-600">Earnings:</span>
                                  <span className="font-semibold">₹{stats.totalEarnings.toLocaleString()}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Rate: {stats.conversionRate.toFixed(2)}%
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400">No link created</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                status === 'approved'
                                  ? 'default'
                                  : status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className={
                                status === 'approved'
                                  ? 'bg-green-600'
                                  : status === 'rejected'
                                  ? 'bg-red-600'
                                  : 'bg-yellow-600'
                              }
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                            {affiliate.approvedAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(affiliate.approvedAt).toLocaleDateString()}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAffiliate(affiliate);
                                  setDetailDialogOpen(true);
                                }}
                                className="border-gray-300"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAffiliate(affiliate);
                                      setAdminNotes(affiliate.adminNotes || '');
                                      setApprovalDialogOpen(true);
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedAffiliate(affiliate);
                                      setAdminNotes(affiliate.adminNotes || '');
                                      setRejectionDialogOpen(true);
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Affiliate</DialogTitle>
            <DialogDescription>
              Approve {selectedAffiliate?.name} for the affiliate program?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Affiliate</DialogTitle>
            <DialogDescription>
              Reject {selectedAffiliate?.name}'s application?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Rejection (Required)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="mt-2"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              variant="destructive"
              disabled={!adminNotes.trim()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Affiliate Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedAffiliate?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="text-sm text-gray-500">Full Name</label>
                    <p className="font-medium">{selectedAffiliate.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium">{selectedAffiliate.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="font-medium">{selectedAffiliate.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Joined Date</label>
                    <p className="font-medium">
                      {new Date(selectedAffiliate.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Platform Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Platform Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="text-sm text-gray-500">Primary Platform</label>
                    <p className="font-medium">{selectedAffiliate.platform || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Social Handle</label>
                    <p className="font-medium">{selectedAffiliate.socialHandle || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Follower Count</label>
                    <p className="font-medium">{selectedAffiliate.followerCount || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <Badge
                      className={
                        (selectedAffiliate.approvalStatus || 'pending') === 'approved'
                          ? 'bg-green-600'
                          : (selectedAffiliate.approvalStatus || 'pending') === 'rejected'
                          ? 'bg-red-600'
                          : 'bg-yellow-600'
                      }
                    >
                      {(selectedAffiliate.approvalStatus || 'pending').charAt(0).toUpperCase() + 
                       (selectedAffiliate.approvalStatus || 'pending').slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Trackier Links */}
              {selectedAffiliate.links && selectedAffiliate.links.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    Trackier Links
                  </h3>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    {selectedAffiliate.links.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex-1 min-w-0">
                          <a
                            href={link.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline break-all flex items-center gap-1"
                          >
                            {link.link}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {link.createdAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Created: {new Date(link.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trackier Analytics */}
              {selectedAffiliate.stats && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MousePointerClick className="w-5 h-5" />
                    Trackier Analytics
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div className="bg-white p-3 rounded border">
                      <label className="text-sm text-gray-500">Total Clicks</label>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedAffiliate.stats.totalClicks.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <label className="text-sm text-gray-500">Total Conversions</label>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedAffiliate.stats.totalConversions.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <label className="text-sm text-gray-500">Total Earnings</label>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{selectedAffiliate.stats.totalEarnings.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <label className="text-sm text-gray-500">Conversion Rate</label>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedAffiliate.stats.conversionRate.toFixed(2)}%
                      </p>
                    </div>
                    <div className="col-span-2 bg-white p-3 rounded border">
                      <label className="text-sm text-gray-500">Last Activity</label>
                      <p className="font-medium">
                        {new Date(selectedAffiliate.stats.lastActivity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedAffiliate.adminNotes && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Admin Notes
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm">{selectedAffiliate.adminNotes}</p>
                    {selectedAffiliate.approvedBy && (
                      <p className="text-xs text-gray-500 mt-2">
                        By: {selectedAffiliate.approvedBy} on{' '}
                        {selectedAffiliate.approvedAt
                          ? new Date(selectedAffiliate.approvedAt).toLocaleString()
                          : 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
