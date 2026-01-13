import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  Search,
  Filter,
  Download,
  RefreshCw,
  Edit,
  Eye,
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
import { toast } from "@/hooks/use-toast";
import AffiliateDetailModal from "@/components/AffiliateDetailModal";

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
  status?: string;
  stats: {
    totalClicks: number;
    totalConversions: number;
    totalEarnings: number;
    conversionRate: number;
    lastActivity: string;
  };
  links: Array<{ id: string; link: string }>;
}

interface DashboardStats {
  overview: {
    totalAffiliates: number;
    activeAffiliates: number;
    totalClicks: number;
    totalConversions: number;
    totalEarnings: number;
    conversionRate: number;
  };
  topPerformers: Array<{
    userId: string;
    name: string;
    earnings: number;
  }>;
}

const Dashboard = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [platformFilter, sortBy, sortOrder]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch affiliates
      const params = new URLSearchParams();
      if (platformFilter !== "all") params.append("platform", platformFilter);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      
      const affiliatesResponse = await fetch(
        `${API_BASE_URL}/api/users?${params.toString()}`
      );
      const affiliatesData = await affiliatesResponse.json();
      
      // Apply search filter
      let filtered = affiliatesData;
      if (searchQuery) {
        filtered = affiliatesData.filter((affiliate: Affiliate) =>
          affiliate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          affiliate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          affiliate.socialHandle.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setAffiliates(filtered);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/sync`, {
        method: "POST",
      });
      const data = await response.json();
      toast({
        title: "Sync Complete",
        description: data.message || "Analytics synced successfully",
      });
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync analytics",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Affiliate Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and track all your affiliates
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSync}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Analytics
              </Button>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Affiliates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.overview.totalAffiliates}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.overview.activeAffiliates} active
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Clicks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <MousePointerClick className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.overview.totalClicks.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">All time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.overview.totalConversions.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.overview.conversionRate}% rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.overview.totalEarnings)}
                    </p>
                    <p className="text-xs text-gray-500">Generated</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.overview.conversionRate}%
                    </p>
                    <p className="text-xs text-gray-500">Average</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="Telegram">Telegram</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Twitter/X">Twitter/X</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Joined</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="clicks">Clicks</SelectItem>
                  <SelectItem value="conversions">Conversions</SelectItem>
                  <SelectItem value="earnings">Earnings</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Affiliates Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Affiliates ({affiliates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading affiliates...</p>
              </div>
            ) : affiliates.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No affiliates found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Followers</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Conversions</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.map((affiliate) => (
                      <TableRow key={affiliate.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {affiliate.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {affiliate.email}
                            </p>
                            {affiliate.socialHandle && (
                              <p className="text-xs text-blue-600">
                                @{affiliate.socialHandle}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{affiliate.platform || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>{affiliate.followerCount || "N/A"}</TableCell>
                        <TableCell className="font-medium">
                          {affiliate.stats.totalClicks.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {affiliate.stats.totalConversions.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatCurrency(affiliate.stats.totalEarnings)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-medium ${
                              affiliate.stats.conversionRate >= 5
                                ? "text-green-600"
                                : affiliate.stats.conversionRate >= 2
                                ? "text-yellow-600"
                                : "text-gray-600"
                            }`}
                          >
                            {affiliate.stats.conversionRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(affiliate.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAffiliate(affiliate)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAffiliate(affiliate)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Affiliate Detail Modal */}
      <AffiliateDetailModal
        affiliate={selectedAffiliate}
        isOpen={!!selectedAffiliate}
        onClose={() => setSelectedAffiliate(null)}
        onUpdate={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;
