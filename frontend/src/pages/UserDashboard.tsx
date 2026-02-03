import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MousePointerClick,
  TrendingUp,
  DollarSign,
  Link as LinkIcon,
  LogOut,
  User,
  Mail,
  Phone,
  Calendar,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { getUserById, getLinksByUserId, getAnalyticsByUserId, isDynamoDBConfigured } from "@/lib/dynamodb";
import { fetchLinkStats } from "@/lib/apptrove";

interface SocialHandle {
  platform: string;
  handle: string;
  verified: boolean;
  verifiedFollowers?: number;
  verifiedAt?: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  platform: string;
  socialHandle: string;
  followerCount: string;
  socialHandles?: SocialHandle[];
  totalVerifiedFollowers?: number;
  createdAt: string;
  status?: string;
  approvalStatus?: string;
  unilink?: string; // Added: AppTrove unilink
  linkId?: string; // Added: AppTrove linkId
  links?: Array<{ id: string; link: string; createdAt?: string }>;
  stats?: {
    totalClicks: number;
    totalConversions: number;
    totalEarnings: number;
    totalInstalls?: number;
    totalPurchases?: number;
    conversionRate: number;
    installRate?: number;
    purchaseRate?: number;
    lastActivity: string;
  };
}

interface AnalyticsData {
  date: string;
  clicks: number;
  conversions: number;
  earnings: number;
  installs?: number;
  purchases?: number;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [appTroveStats, setAppTroveStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userSession = sessionStorage.getItem('user');
    if (!userSession) {
      navigate('/login');
      return;
    }

    const sessionUser = JSON.parse(userSession);
    if (sessionUser.type !== 'user') {
      navigate('/login');
      return;
    }

    fetchUserData(sessionUser.id);
    fetchAnalytics(sessionUser.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Helper function to extract linkId from unilink URL
  const extractLinkIdFromUnilink = (unilink: string): string | null => {
    if (!unilink) return null;
    const match = unilink.match(/\/d\/([^?&#]+)/);
    return match ? match[1] : null;
  };

  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Check if DynamoDB is configured
      const useDynamoDB = isDynamoDBConfigured();
      
      let userData;
      
      if (useDynamoDB) {
        // Fetch from DynamoDB directly
        console.log('📊 Fetching user data from DynamoDB...');
        userData = await getUserById(userId);
        
        if (!userData) {
          toast({
            title: "User Not Found",
            description: "Your account was not found. Please contact support.",
            variant: "destructive",
          });
          handleLogout();
          return;
        }
        
        // Get user's links
        const links = await getLinksByUserId(userId);
        userData = { ...userData, links };
        console.log('✅ User data loaded from DynamoDB');
      } else {
        // DynamoDB not configured
        throw new Error('DynamoDB not configured. Please set AWS credentials in Vercel environment variables.');
      }
      
      setUser(userData);
      
      // Fetch AppTrove stats if unilink exists
      if (userData.unilink) {
        fetchAppTroveStats(userData.unilink);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAppTroveStats = async (unilink: string) => {
    setLoadingStats(true);
    try {
      const linkId = extractLinkIdFromUnilink(unilink);
      
      if (!linkId) {
        console.warn('⚠️ Could not extract linkId from unilink:', unilink);
        return;
      }
      
      console.log(`📊 Fetching AppTrove stats for link: ${linkId}`);
      const statsResponse = await fetchLinkStats(linkId);
      
      if (statsResponse.success && statsResponse.stats) {
        console.log('✅ AppTrove stats fetched:', statsResponse.stats);
        setAppTroveStats(statsResponse.stats);
      } else {
        console.warn('⚠️ No AppTrove stats available:', statsResponse.error);
      }
    } catch (error) {
      console.error('❌ Error fetching AppTrove stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAnalytics = async (userId: string) => {
    try {
      // Check if DynamoDB is configured
      const useDynamoDB = isDynamoDBConfigured();
      
      if (useDynamoDB) {
        // Fetch analytics from DynamoDB directly
        console.log('📈 Fetching analytics from DynamoDB...');
        const analytics = await getAnalyticsByUserId(userId);
        setAnalytics(analytics);
        console.log('✅ Analytics loaded from DynamoDB:', analytics.length);
      } else {
        // DynamoDB not configured
        console.error('❌ DynamoDB not configured!');
        setAnalytics([]);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLink(text);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
      setTimeout(() => setCopiedLink(null), 2000);
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Use AppTrove stats if available, otherwise use stored stats
  const stats = appTroveStats ? {
    totalClicks: appTroveStats.clicks || 0,
    totalConversions: appTroveStats.conversions || 0,
    totalEarnings: appTroveStats.revenue || 0,
    totalInstalls: appTroveStats.installs || 0,
    conversionRate: appTroveStats.clicks > 0 ? ((appTroveStats.conversions / appTroveStats.clicks) * 100) : 0,
    lastActivity: user.createdAt,
  } : user.stats || {
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    conversionRate: 0,
    lastActivity: user.createdAt,
  };

  const status = user.approvalStatus || 'pending';
  const isApproved = status === 'approved';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-sm text-gray-600">Track your affiliate performance</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user.name}</span>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Status Alert */}
        {!isApproved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900">
                      Account Pending Approval
                    </h3>
                    <p className="text-sm text-yellow-700">
                      Your account is currently pending approval. You'll be able to access all features once approved.
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MousePointerClick className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalClicks.toLocaleString()}
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
                    {stats.totalConversions.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.conversionRate.toFixed(2)}% rate
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
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalEarnings)}
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
                    {stats.conversionRate.toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-500">Average</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {analytics.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Installs & Purchases Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="installs" stroke="#06b6d4" strokeWidth={2} name="Installs" />
                    <Line type="monotone" dataKey="purchases" stroke="#10b981" strokeWidth={2} name="Purchases" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clicks & Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} name="Clicks" />
                    <Line type="monotone" dataKey="conversions" stroke="#8b5cf6" strokeWidth={2} name="Conversions" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Earnings Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="earnings" fill="#10b981" name="Earnings (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Install & Purchase Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="installs" fill="#06b6d4" name="Installs" />
                    <Bar dataKey="purchases" fill="#10b981" name="Purchases" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Affiliate Links */}
        {isApproved && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Your Affiliate Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.unilink || (user.links && user.links.length > 0) ? (
                <div className="space-y-4">
                  {/* Show assigned unilink */}
                  {user.unilink && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span className="font-semibold text-green-700">Your Affiliate Link</span>
                          {loadingStats && (
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          )}
                        </div>
                        <a
                          href={user.unilink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all flex items-center gap-2"
                        >
                          {user.unilink}
                          <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        </a>
                        {appTroveStats && (
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="bg-white rounded p-2 text-center border border-green-100">
                              <div className="text-xs text-gray-500">Clicks</div>
                              <div className="font-bold text-blue-600">{appTroveStats.clicks || 0}</div>
                            </div>
                            <div className="bg-white rounded p-2 text-center border border-green-100">
                              <div className="text-xs text-gray-500">Installs</div>
                              <div className="font-bold text-cyan-600">{appTroveStats.installs || 0}</div>
                            </div>
                            <div className="bg-white rounded p-2 text-center border border-green-100">
                              <div className="text-xs text-gray-500">Revenue</div>
                              <div className="font-bold text-green-600">₹{appTroveStats.revenue || 0}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(user.unilink!)}
                        className="ml-4 bg-white hover:bg-green-50 border-green-300"
                      >
                        {copiedLink === user.unilink ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {/* Show old links if any */}
                  {user.links && user.links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex-1 min-w-0">
                        <a
                          href={link.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all flex items-center gap-2"
                        >
                          {link.link}
                          <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        </a>
                        {link.createdAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {formatDate(link.createdAt)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(link.link)}
                        className="ml-4"
                      >
                        {copiedLink === link.link ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <LinkIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium mb-1">No affiliate link yet</p>
                  <p className="text-sm">
                    Your unilink is being created. Please check back in a few moments or contact support if this persists.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Full Name</label>
                  <p className="font-medium">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  <p className="font-medium">{user.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Joined Date
                  </label>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Social Media Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.socialHandles && user.socialHandles.length > 0 ? (
                  <>
                    {user.socialHandles.map((handle, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{handle.platform}</span>
                            {handle.verified && (
                              <Badge className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Handle:</span> {handle.handle}
                        </div>
                        {handle.verified && handle.verifiedFollowers !== undefined && (
                          <div className="text-sm">
                            <span className="text-gray-500">
                              {handle.platform === 'YouTube' ? 'Subscribers' : 'Followers'}:
                            </span>
                            <span className="font-semibold text-green-600 ml-2">
                              {handle.verifiedFollowers.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    {user.totalVerifiedFollowers > 0 && (
                      <div className="pt-3 border-t border-gray-300">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Total Verified Followers:</span>
                          <span className="text-lg font-bold text-green-600">
                            {user.totalVerifiedFollowers.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-500">Platform</label>
                      <p className="font-medium">{user.platform || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Social Handle</label>
                      <p className="font-medium">
                        {user.socialHandle ? `@${user.socialHandle}` : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Follower Count</label>
                      <p className="font-medium">{user.followerCount || "Not specified"}</p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
