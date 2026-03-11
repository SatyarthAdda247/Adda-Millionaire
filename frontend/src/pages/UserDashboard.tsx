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
      console.log(`📊 Fetching Trackier stats for unilink: ${unilink}`);
      // Pass full unilink URL to Trackier API - it will extract affiliate/campaign info
      const statsResponse = await fetchLinkStats(unilink);

      if (statsResponse.success && statsResponse.stats) {
        console.log('✅ Trackier stats fetched:', statsResponse.stats);
        setAppTroveStats(statsResponse.stats);
      } else {
        console.warn('⚠️ No Trackier stats available:', statsResponse.error);
      }
    } catch (error) {
      console.error('❌ Error fetching Trackier stats:', error);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 p-4 rounded-full bg-blue-100 items-center justify-center flex w-20 h-20">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin-slow" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Under Development</h2>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          We are currently working hard behind the scenes upgrading this dashboard with real-time stats from Adjust. Check back soon!
        </p>
      </main>
    </div>
  );
};

export default UserDashboard;
