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
  Trash2,
  Plus,
  BarChart3,
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

import { API_BASE_URL } from "@/lib/apiConfig";
import { getAllUsers, getLinksByUserId, getAnalyticsByUserId, isDynamoDBConfigured, updateUser, deleteUser, saveLink } from "@/lib/dynamodb";
import { getTemplates, getTemplateLinks, createLink, isAppTroveConfigured } from "@/lib/apptrove";
import { v4 as uuidv4 } from "uuid";

interface SocialHandle {
  platform: string;
  handle: string;
}

// Helper function to convert handle to clickable URL
function getSocialMediaUrl(platform: string, handle: string): string {
  const cleanHandle = handle.trim().replace(/^@/, '').replace(/^https?:\/\//, '');
  
  switch (platform.toLowerCase()) {
    case 'instagram':
      if (handle.includes('instagram.com/')) {
        return handle.startsWith('http') ? handle : `https://${handle}`;
      }
      return `https://www.instagram.com/${cleanHandle}`;
    case 'youtube':
      if (handle.includes('youtube.com/') || handle.includes('youtu.be/')) {
        return handle.startsWith('http') ? handle : `https://${handle}`;
      }
      return `https://www.youtube.com/@${cleanHandle}`;
    case 'facebook':
      if (handle.includes('facebook.com/')) {
        return handle.startsWith('http') ? handle : `https://${handle}`;
      }
      return `https://www.facebook.com/${cleanHandle}`;
    case 'twitter/x':
    case 'twitter':
    case 'x':
      if (handle.includes('twitter.com/') || handle.includes('x.com/')) {
        return handle.startsWith('http') ? handle : `https://${handle}`;
      }
      return `https://twitter.com/${cleanHandle}`;
    case 'telegram':
      if (handle.includes('t.me/')) {
        return handle.startsWith('http') ? handle : `https://${handle}`;
      }
      return `https://t.me/${cleanHandle}`;
    case 'tiktok':
      if (handle.includes('tiktok.com/@')) {
        return handle.startsWith('http') ? handle : `https://${handle}`;
      }
      return `https://www.tiktok.com/@${cleanHandle}`;
    case 'linkedin':
      if (handle.includes('linkedin.com/in/') || handle.includes('linkedin.com/company/')) {
        return handle.startsWith('http') ? handle : `https://${handle}`;
      }
      return `https://www.linkedin.com/in/${cleanHandle}`;
    default:
      if (handle.startsWith('http://') || handle.startsWith('https://')) {
        return handle;
      }
      return `https://${cleanHandle}`;
  }
}

interface Affiliate {
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
    totalInstalls?: number;
    totalPurchases?: number;
    conversionRate: number;
    installRate?: number;
    purchaseRate?: number;
    lastActivity: string;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  // Admin authentication - check sessionStorage
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<any>({ email: 'admin@edurise.com', name: 'Admin' });
  const [searchQuery, setSearchQuery] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignLinkDialogOpen, setAssignLinkDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [overallStats, setOverallStats] = useState({
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    conversionRate: 0,
    totalInstalls: 0,
    totalPurchases: 0,
    installRate: 0,
    purchaseRate: 0,
    averageEarningsPerAffiliate: 0
  });
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [availableLinks, setAvailableLinks] = useState<any[]>([]);
  const [selectedLink, setSelectedLink] = useState<string>("");
  const [manualUnilink, setManualUnilink] = useState("");
  const [userAnalytics, setUserAnalytics] = useState<any[]>([]);

  useEffect(() => {
    // Check authentication from sessionStorage
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/admin/login');
      return;
    }
    
    // Set authenticated state
    setAuthenticated(true);
    setUser({ email: 'admin@edurise.com', name: 'Admin' });
    fetchAffiliates();
  }, [navigate]);

  useEffect(() => {
    // Check authentication on every render
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    
    if (authenticated) {
      fetchAffiliates();
      fetchOverallStats();
      fetchAnalytics();
      fetchTemplates();
    }
  }, [authenticated, approvalFilter, navigate]);

  useEffect(() => {
    if (selectedTemplate) {
      fetchTemplateLinks(selectedTemplate);
    }
  }, [selectedTemplate]);

  // Auto-select "EduRise" template when dialog opens
  useEffect(() => {
    if (assignLinkDialogOpen && templates.length > 0) {
      // Find "EduRise" template by name or ID
      const eduriseTemplate = templates.find(
        (t) => 
          t.name?.toLowerCase().includes('edurise') || 
          t._id === 'wBehUW' || 
          t.id === 'wBehUW'
      );
      
      if (eduriseTemplate && !selectedTemplate) {
        const templateId = eduriseTemplate._id || eduriseTemplate.id;
        setSelectedTemplate(templateId);
      }
    }
  }, [assignLinkDialogOpen, templates]);

  const fetchOverallStats = async () => {
    try {
      const useDynamoDB = isDynamoDBConfigured();
      
      if (useDynamoDB) {
        // Calculate stats from DynamoDB
        console.log('📊 Calculating stats from DynamoDB...');
        const allUsers = await getAllUsers();
        const allLinks = await Promise.all(
          allUsers.map(user => getLinksByUserId(user.id))
        ).then(results => results.flat());
        
        const allAnalytics = await Promise.all(
          allUsers.map(user => getAnalyticsByUserId(user.id))
        ).then(results => results.flat());
        
        // Calculate totals
        const totalClicks = allAnalytics.reduce((sum, a) => sum + (a.clicks || 0), 0);
        const totalConversions = allAnalytics.reduce((sum, a) => sum + (a.conversions || 0), 0);
        const totalEarnings = allAnalytics.reduce((sum, a) => sum + (a.earnings || 0), 0);
        const totalInstalls = allAnalytics.reduce((sum, a) => sum + (a.installs || 0), 0);
        const totalPurchases = allAnalytics.reduce((sum, a) => sum + (a.purchases || 0), 0);
        
        const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
        const installRate = totalClicks > 0 ? (totalInstalls / totalClicks) * 100 : 0;
        const purchaseRate = totalInstalls > 0 ? (totalPurchases / totalInstalls) * 100 : 0;
        
        const approvedUsers = allUsers.filter(u => u.approvalStatus === 'approved');
        const averageEarningsPerAffiliate = approvedUsers.length > 0 ? totalEarnings / approvedUsers.length : 0;
        
        setOverallStats({
          totalClicks,
          totalConversions,
          totalEarnings,
          conversionRate,
          totalInstalls,
          totalPurchases,
          installRate,
          purchaseRate,
          averageEarningsPerAffiliate
        });
        console.log('✅ Calculated stats from DynamoDB');
      } else {
        // Fallback to backend API
        try {
          const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
          if (response.ok) {
            const data = await response.json();
            if (data.overview) {
              setOverallStats({
                totalClicks: data.overview.totalClicks || 0,
                totalConversions: data.overview.totalConversions || 0,
                totalEarnings: data.overview.totalEarnings || 0,
                conversionRate: data.overview.conversionRate || 0,
                totalInstalls: data.overview.totalInstalls || 0,
                totalPurchases: data.overview.totalPurchases || 0,
                installRate: data.overview.installRate || 0,
                purchaseRate: data.overview.purchaseRate || 0,
                averageEarningsPerAffiliate: data.overview.averageEarningsPerAffiliate || 0
              });
            }
          }
        } catch (apiError) {
          console.warn('Backend API not available, using default stats');
          setOverallStats({
            totalClicks: 0,
            totalConversions: 0,
            totalEarnings: 0,
            conversionRate: 0,
            totalInstalls: 0,
            totalPurchases: 0,
            installRate: 0,
            purchaseRate: 0,
            averageEarningsPerAffiliate: 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching overall stats:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const useDynamoDB = isDynamoDBConfigured();
      
      if (useDynamoDB) {
        // Fetch analytics from DynamoDB
        console.log('📈 Fetching analytics from DynamoDB...');
        const allUsers = await getAllUsers();
        const allAnalytics = await Promise.all(
          allUsers.map(user => getAnalyticsByUserId(user.id))
        ).then(results => results.flat());
        
        // Group by date for chart
        const analyticsByDate: Record<string, any> = {};
        allAnalytics.forEach(a => {
          const date = a.date || a.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0];
          if (!analyticsByDate[date]) {
            analyticsByDate[date] = { date, clicks: 0, conversions: 0, earnings: 0, installs: 0, purchases: 0 };
          }
          analyticsByDate[date].clicks += a.clicks || 0;
          analyticsByDate[date].conversions += a.conversions || 0;
          analyticsByDate[date].earnings += a.earnings || 0;
          analyticsByDate[date].installs += a.installs || 0;
          analyticsByDate[date].purchases += a.purchases || 0;
        });
        
        const analyticsArray = Object.values(analyticsByDate).sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        setAnalyticsData(analyticsArray);
        console.log('✅ Fetched analytics from DynamoDB:', analyticsArray.length);
      } else {
        // Fallback to backend API
        try {
          const response = await fetch(`${API_BASE_URL}/api/dashboard/analytics?days=30`);
          if (response.ok) {
            const data = await response.json();
            setAnalyticsData(data);
          }
        } catch (apiError) {
          console.warn('Backend API not available, using empty analytics');
          setAnalyticsData([]);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData([]);
    }
  };

  const fetchTemplates = async () => {
    try {
      // Use AppTrove API directly from frontend
      if (isAppTroveConfigured()) {
        console.log('📋 Fetching templates from AppTrove API...');
        const data = await getTemplates();
        if (data.success && data.templates) {
          setTemplates(data.templates);
          console.log('✅ Fetched templates from AppTrove:', data.templates.length);
        } else {
          setTemplates([]);
        }
      } else {
        // Fallback to backend API if AppTrove not configured
        try {
          const response = await fetch(`${API_BASE_URL}/api/apptrove/templates`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.templates) {
              setTemplates(data.templates);
            } else {
              setTemplates([]);
            }
          } else {
            console.warn('Templates API not available');
            setTemplates([]);
          }
        } catch (apiError) {
          console.warn('Backend API not available for templates. Link assignment will use manual URL entry.');
          setTemplates([]);
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
    }
  };

  const fetchTemplateLinks = async (templateId: string) => {
    try {
      // Use AppTrove API directly from frontend
      if (isAppTroveConfigured()) {
        console.log('🔗 Fetching template links from AppTrove API...');
        const data = await getTemplateLinks(templateId);
        if (data.success && data.links) {
          setAvailableLinks(data.links);
          console.log('✅ Fetched template links:', data.links.length);
        }
      } else {
        // Fallback to backend API
        try {
          const response = await fetch(`${API_BASE_URL}/api/apptrove/templates/${templateId}/links`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.links) {
              setAvailableLinks(data.links);
            }
          }
        } catch (apiError) {
          console.error('Error fetching template links:', apiError);
          toast({
            title: "Error",
            description: "Failed to fetch links from template",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error fetching template links:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch links from template",
        variant: "destructive",
      });
    }
  };

  const handleAssignLink = async () => {
    if (!selectedAffiliate) return;

    let unilink = manualUnilink.trim();
    let linkId = null;
    let templateId = selectedTemplate;

    // If a link was selected from template, use its data
    if (selectedLink) {
      const link = availableLinks.find(l => l.id === selectedLink);
      if (link) {
        unilink = link.shortUrl || link.longUrl;
        linkId = link.id;
      }
    }

    // If template is selected but no link chosen, try to create a new link from template
    if (!unilink && selectedTemplate) {
      try {
        toast({
          title: "Creating link...",
          description: "Creating a new unilink from template. Please wait.",
        });

        // Create a new link from the template using AppTrove API directly
        if (isAppTroveConfigured()) {
          const createData = await createLink(selectedTemplate, {
            name: `${selectedAffiliate.name} - Affiliate Link`,
            userId: selectedAffiliate.id
          });
          
          if (createData.success && createData.unilink) {
            unilink = createData.unilink;
            linkId = createData.link?.id || null;
            
            toast({
              title: "✅ Link Created",
              description: `New unilink created: ${unilink}`,
            });
          } else {
            throw new Error('Failed to create link from template');
          }
        } else {
          // Fallback to backend API
          const createResponse = await fetch(`${API_BASE_URL}/api/apptrove/templates/${selectedTemplate}/create-link`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: `${selectedAffiliate.name} - Affiliate Link`,
              userId: selectedAffiliate.id
            }),
          });

          const createData = await createResponse.json();
          
          if (createResponse.ok && createData.link) {
            unilink = createData.unilink || createData.link?.unilink;
            linkId = createData.link?.id || null;
          } else {
            throw new Error(createData.error || 'Failed to create link from template');
          }
        }
      } catch (error) {
        console.error('Error creating link:', error);
        toast({
          title: "Link Creation Failed",
          description: error instanceof Error ? error.message : "AppTrove API may not support programmatic link creation. Please create links manually in the AppTrove dashboard and paste the URL here.",
          variant: "destructive",
          duration: 10000,
        });
        return;
      }
    }

    // Final validation - must have a unilink URL
    if (!unilink || !unilink.trim()) {
      toast({
        title: "Missing Link",
        description: "Please enter a unilink URL manually. Create the link in AppTrove dashboard first, then paste the URL here.",
        variant: "destructive",
        duration: 8000,
      });
      return;
    }

    try {
      const useDynamoDB = isDynamoDBConfigured();
      
      if (useDynamoDB) {
        // Save link to DynamoDB
        const linkData = {
          id: linkId || uuidv4(),
          userId: selectedAffiliate.id,
          unilink,
          templateId: templateId || null,
          createdAt: new Date().toISOString(),
        };
        
        await saveLink(linkData);
        
        // Update user with link assignment
        await updateUser(selectedAffiliate.id, {
          assignedLink: unilink,
          linkId: linkData.id,
          templateId: templateId || null,
        });
        
        toast({
          title: "Success",
          description: `Link assigned to ${selectedAffiliate.name}`,
        });
        setAssignLinkDialogOpen(false);
        setSelectedLink("");
        setManualUnilink("");
        setSelectedTemplate("");
        setAvailableLinks([]);
        setSelectedAffiliate(null);
        fetchAffiliates();
      } else {
        // Fallback to backend API
        const response = await fetch(`${API_BASE_URL}/api/users/${selectedAffiliate.id}/assign-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            unilink,
            linkId,
            templateId
          }),
        });

        const data = await response.json();
        
        if (response.ok) {
          toast({
            title: "Success",
            description: `Link assigned to ${selectedAffiliate.name}`,
          });
          setAssignLinkDialogOpen(false);
          setSelectedLink("");
          setManualUnilink("");
          setSelectedTemplate("");
          setAvailableLinks([]);
          setSelectedAffiliate(null);
          fetchAffiliates();
        } else {
          throw new Error(data.error || 'Failed to assign link');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign link",
        variant: "destructive",
      });
    }
  };

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      
      // Check if DynamoDB is configured
      const useDynamoDB = isDynamoDBConfigured();
      
      let data;
      
      if (useDynamoDB) {
        // Fetch from DynamoDB directly
        console.log('📊 Fetching affiliates from DynamoDB...');
        const filters: any = {};
        // Note: searchQuery is used for client-side filtering after fetch
        // approvalFilter is the only server-side filter we need
        if (approvalFilter !== "all") filters.approvalStatus = approvalFilter;
        
        const users = await getAllUsers(filters);
        
        // Get links and analytics for each user
        const usersWithData = await Promise.all(users.map(async (user: any) => {
          const links = await getLinksByUserId(user.id);
          const analytics = await getAnalyticsByUserId(user.id);
          
          // Calculate stats
          const totalClicks = analytics.reduce((sum: number, a: any) => sum + (a.clicks || 0), 0);
          const totalConversions = analytics.reduce((sum: number, a: any) => sum + (a.conversions || 0), 0);
          const totalEarnings = analytics.reduce((sum: number, a: any) => sum + (a.earnings || 0), 0);
          const conversionRate = totalClicks > 0 ? parseFloat((totalConversions / totalClicks * 100).toFixed(2)) : 0;
          
          return {
            ...user,
            links,
            stats: {
              totalClicks,
              totalConversions,
              totalEarnings,
              conversionRate,
              lastActivity: analytics.length > 0 ? analytics[analytics.length - 1].date : user.createdAt
            }
          };
        }));
        
        // Filter out deleted users
        data = usersWithData.filter((u: any) => u.status !== 'deleted' && u.approvalStatus !== 'deleted');
        
        // Sort by createdAt descending (newest first)
        data.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        console.log('✅ Fetched affiliates from DynamoDB:', data.length);
      } else {
        // Fallback to backend API
        const params = new URLSearchParams();
        if (approvalFilter !== "all") {
          params.append("approvalStatus", approvalFilter);
        }
        
        const response = await fetch(`${API_BASE_URL}/api/users?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch affiliates');
        }
        
        data = await response.json();
      }
      
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
    
    // Show loading state
    toast({
      title: "Approving affiliate...",
      description: "Approving affiliate and creating unilink. This may take a moment.",
    });

    try {
      const useDynamoDB = isDynamoDBConfigured();
      
      if (useDynamoDB) {
        let unilink = null;
        let linkId = null;
        let templateId = null;
        let linkError = null;
        
        // Try to automatically create a unilink
        try {
          // Ensure templates are loaded
          let templatesToUse = templates;
          if (templatesToUse.length === 0 && isAppTroveConfigured()) {
            console.log('📋 Templates not loaded, fetching now...');
            const templatesData = await getTemplates();
            if (templatesData.success && templatesData.templates) {
              templatesToUse = templatesData.templates;
              setTemplates(templatesData.templates);
            }
          }
          
          // Find EduRise template
          const eduriseTemplate = templatesToUse.find(
            (t) => 
              t.name?.toLowerCase().includes('edurise') || 
              t._id === 'wBehUW' || 
              t.id === 'wBehUW'
          );
          
          if (eduriseTemplate && isAppTroveConfigured()) {
            const templateIdToUse = eduriseTemplate._id || eduriseTemplate.id;
            templateId = templateIdToUse;
            
            // Create a new link from the template
            const createData = await createLink(templateIdToUse, {
              name: `${selectedAffiliate.name} - Affiliate Link`,
              userId: selectedAffiliate.id
            });
            
            if (createData.success && createData.unilink) {
              unilink = createData.unilink;
              linkId = createData.link?.id || uuidv4();
              
              // Save link to DynamoDB
              const linkData = {
                id: linkId,
                userId: selectedAffiliate.id,
                unilink,
                templateId: templateIdToUse,
                createdAt: new Date().toISOString(),
              };
              
              await saveLink(linkData);
              
              // Update user with assigned link
              await updateUser(selectedAffiliate.id, {
                approvalStatus: 'approved',
                approvedAt: new Date().toISOString(),
                approvedBy: user?.email || 'admin',
                adminNotes: adminNotes || undefined,
                assignedLink: unilink,
                linkId: linkId,
                templateId: templateIdToUse,
              });
            } else {
              linkError = 'Failed to create unilink';
              // Still approve the user even if link creation fails
              await updateUser(selectedAffiliate.id, {
                approvalStatus: 'approved',
                approvedAt: new Date().toISOString(),
                approvedBy: user?.email || 'admin',
                adminNotes: adminNotes || undefined,
              });
            }
          } else {
            // No template found or AppTrove not configured
            linkError = templatesToUse.length === 0 
              ? 'No templates available. Please configure AppTrove API or assign link manually.'
              : 'EduRise template not found. Please assign link manually.';
            
            // Still approve the user
            await updateUser(selectedAffiliate.id, {
              approvalStatus: 'approved',
              approvedAt: new Date().toISOString(),
              approvedBy: user?.email || 'admin',
              adminNotes: adminNotes || undefined,
            });
          }
        } catch (linkCreationError) {
          console.error('Error creating unilink:', linkCreationError);
          linkError = linkCreationError instanceof Error ? linkCreationError.message : 'Failed to create unilink';
          
          // Still approve the user even if link creation fails
          await updateUser(selectedAffiliate.id, {
            approvalStatus: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: user?.email || 'admin',
            adminNotes: adminNotes || undefined,
          });
        }
        
        // Show appropriate toast message
        if (unilink) {
          toast({
            title: "✅ Approved & UniLink Created",
            description: `${selectedAffiliate.name} approved. UniLink: ${unilink}`,
            duration: 5000,
          });
        } else if (linkError) {
          toast({
            title: "⚠️ Approved (UniLink Failed)",
            description: `${selectedAffiliate.name} approved but unilink creation failed: ${linkError}. You can assign a link manually.`,
            variant: "destructive",
            duration: 7000,
          });
        } else {
          toast({
            title: "✅ Approved",
            description: `${selectedAffiliate.name} has been approved. You can now assign a link.`,
            duration: 5000,
          });
        }
        
        setApprovalDialogOpen(false);
        setAdminNotes("");
        setSelectedAffiliate(null);
        fetchAffiliates();
      } else {
        // Fallback to backend API
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
          if (data.unilink) {
            toast({
              title: "✅ Approved & UniLink Created",
              description: `${selectedAffiliate.name} approved. UniLink: ${data.unilink}`,
              duration: 5000,
            });
          } else if (data.warning || data.linkError) {
            toast({
              title: "⚠️ Approved (UniLink Failed)",
              description: `${selectedAffiliate.name} approved but unilink creation failed: ${data.warning || data.linkError}`,
              variant: "destructive",
              duration: 7000,
            });
          } else {
            toast({
              title: "Approved",
              description: `${selectedAffiliate.name} has been approved`,
            });
          }
          setApprovalDialogOpen(false);
          setAdminNotes("");
          setSelectedAffiliate(null);
          fetchAffiliates();
        } else {
          throw new Error(data.error || 'Failed to approve');
        }
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
      const useDynamoDB = isDynamoDBConfigured();
      
      if (useDynamoDB) {
        // Update user in DynamoDB
        await updateUser(selectedAffiliate.id, {
          approvalStatus: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectedBy: user?.email || 'admin',
          adminNotes: adminNotes || undefined,
        });
        
        toast({
          title: "Rejected",
          description: `${selectedAffiliate.name} has been rejected`,
        });
        setRejectionDialogOpen(false);
        setAdminNotes("");
        setSelectedAffiliate(null);
        fetchAffiliates();
      } else {
        // Fallback to backend API
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
    // Clear authentication
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminLoginTime');
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    
    // Redirect to login page
    navigate('/admin/login');
  };

  const handleDelete = async () => {
    if (!selectedAffiliate) return;

    try {
      const useDynamoDB = isDynamoDBConfigured();
      
      if (useDynamoDB) {
        // Delete user from DynamoDB
        await deleteUser(selectedAffiliate.id);
        
        toast({
          title: "User Deleted",
          description: `${selectedAffiliate.name} has been deleted successfully`,
        });
        setDeleteDialogOpen(false);
        setSelectedAffiliate(null);
        fetchAffiliates();
      } else {
        // Fallback to backend API
        const response = await fetch(`${API_BASE_URL}/api/users/${selectedAffiliate.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        if (response.ok) {
          toast({
            title: "User Deleted",
            description: `${selectedAffiliate.name} has been deleted successfully`,
          });
          setDeleteDialogOpen(false);
          setSelectedAffiliate(null);
          fetchAffiliates();
        } else {
          throw new Error(data.error || 'Failed to delete');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    }
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
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">Pending Approval</CardTitle>
              <Clock className="w-5 h-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">{pendingCount}</div>
              <div className="text-xs text-yellow-600 mt-1">Awaiting review</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Approved</CardTitle>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{approvedCount}</div>
              <div className="text-xs text-green-600 mt-1">Active affiliates</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Clicks</CardTitle>
              <MousePointerClick className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{overallStats.totalClicks.toLocaleString()}</div>
              <div className="text-xs text-blue-600 mt-1">
                {overallStats.conversionRate > 0 && `${overallStats.conversionRate.toFixed(2)}% conversion`}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Installs</CardTitle>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">{overallStats.totalInstalls.toLocaleString()}</div>
              <div className="text-xs text-purple-600 mt-1">
                {overallStats.installRate > 0 && `${overallStats.installRate.toFixed(2)}% install rate`}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Purchases</CardTitle>
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700">{overallStats.totalPurchases.toLocaleString()}</div>
              <div className="text-xs text-emerald-600 mt-1">
                {overallStats.purchaseRate > 0 && `${overallStats.purchaseRate.toFixed(2)}% purchase rate`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue & Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total Earnings</CardTitle>
              <DollarSign className="w-6 h-6 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-700 mb-1">₹{overallStats.totalEarnings.toLocaleString()}</div>
              <div className="text-sm text-green-600">
                Avg: ₹{overallStats.averageEarningsPerAffiliate.toLocaleString()}/affiliate
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-300 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-indigo-800">Conversion Rate</CardTitle>
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-indigo-700 mb-1">{overallStats.conversionRate.toFixed(2)}%</div>
              <div className="text-sm text-indigo-600">
                {overallStats.totalConversions.toLocaleString()} conversions
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-300 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-rose-800">Performance Funnel</CardTitle>
              <BarChart3 className="w-6 h-6 text-rose-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-rose-700">Clicks → Installs</span>
                  <span className="font-bold text-rose-700">{overallStats.installRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-rose-700">Installs → Purchases</span>
                  <span className="font-bold text-rose-700">{overallStats.purchaseRate.toFixed(2)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts Section */}
        {analyticsData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="shadow-lg border-2 border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <CardTitle className="text-lg font-bold text-blue-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Clicks & Conversions Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      name="Clicks"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="conversions" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                      name="Conversions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-2 border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
                <CardTitle className="text-lg font-bold text-purple-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Installs & Purchases Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="installs" 
                      stroke="#06b6d4" 
                      strokeWidth={3}
                      dot={{ fill: '#06b6d4', r: 4 }}
                      name="Installs"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="purchases" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                      name="Purchases"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-lg border-2 border-green-100">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
                <CardTitle className="text-lg font-bold text-green-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Earnings Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Earnings']}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Bar 
                      dataKey="earnings" 
                      fill="#10b981" 
                      radius={[8, 8, 0, 0]}
                      name="Earnings (₹)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

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
                  fetchAnalytics();
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
        <Card className="shadow-xl border-2 border-gray-100">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Affiliate Applications
              </CardTitle>
              <Badge className="bg-blue-100 text-blue-700 px-3 py-1">
                {filteredAffiliates.length} {filteredAffiliates.length === 1 ? 'affiliate' : 'affiliates'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-500">Loading affiliates...</p>
              </div>
            ) : filteredAffiliates.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No affiliates found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <TableHead className="font-bold text-gray-700 py-4">Name</TableHead>
                      <TableHead className="font-bold text-gray-700 py-4">Contact</TableHead>
                      <TableHead className="font-bold text-gray-700 py-4">Platform Info</TableHead>
                      <TableHead className="font-bold text-gray-700 py-4">Performance</TableHead>
                      <TableHead className="font-bold text-gray-700 py-4">Status</TableHead>
                      <TableHead className="font-bold text-gray-700 py-4 text-center">Actions</TableHead>
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
                        <TableRow 
                          key={affiliate.id}
                          className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 border-b border-gray-100"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {affiliate.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-base mb-1">{affiliate.name}</div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  <span>Joined {new Date(affiliate.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm group">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                  <Mail className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-gray-700 font-medium">{affiliate.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm group">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                  <Phone className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-gray-700 font-medium">{affiliate.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-2">
                              {affiliate.socialHandles && affiliate.socialHandles.length > 0 ? (
                                affiliate.socialHandles.map((handle: any, idx: number) => {
                                  const url = getSocialMediaUrl(handle.platform, handle.handle);
                                  return (
                                    <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 border-l-4 border-purple-400">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-purple-700 text-sm">{handle.platform}</span>
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 hover:underline text-sm flex items-center gap-1"
                                        >
                                          {handle.handle}
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-500 font-medium min-w-[70px]">Platform:</span>
                                    <Badge variant="outline" className="border-purple-300 text-purple-700">
                                      {affiliate.platform || '-'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-500 font-medium min-w-[70px]">Handle:</span>
                                    {affiliate.socialHandle ? (
                                      <a
                                        href={getSocialMediaUrl(affiliate.platform || 'Other', affiliate.socialHandle)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
                                      >
                                        {affiliate.socialHandle}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ) : (
                                      <span className="text-gray-700 font-medium">-</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-500 font-medium min-w-[70px]">Followers:</span>
                                    <span className="text-gray-700 font-semibold">{affiliate.followerCount || '-'}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {affiliate.links && affiliate.links.length > 0 ? (
                              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                  {/* UNILINK Section */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <LinkIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">UNILINK</span>
                                    </div>
                                    <a 
                                      href={affiliate.links[0].link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 break-all block leading-relaxed"
                                    >
                                      {affiliate.links[0].link}
                                    </a>
                                  </div>
                                  
                                  {/* Status and Date */}
                                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                    {status === 'approved' && (
                                      <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full flex items-center gap-1.5">
                                        <CheckCircle className="w-3 h-3" />
                                        Approved
                                      </Badge>
                                    )}
                                    {affiliate.links[0]?.createdAt && (
                                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(affiliate.links[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                    <div className="text-xs text-gray-600 font-medium mb-1.5">Clicks</div>
                                    <div className="text-xl font-bold text-blue-700">{stats.totalClicks.toLocaleString()}</div>
                                  </div>
                                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                    <div className="text-xs text-gray-600 font-medium mb-1.5">Conversions</div>
                                    <div className="text-xl font-bold text-purple-700">{stats.totalConversions.toLocaleString()}</div>
                                  </div>
                                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                                    <div className="text-xs text-gray-600 font-medium mb-1.5">Earnings</div>
                                    <div className="text-xl font-bold text-green-700">₹{stats.totalEarnings.toLocaleString()}</div>
                                  </div>
                                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium mb-1.5">
                                      <BarChart3 className="w-3 h-3" />
                                      Rate
                                    </div>
                                    <div className="text-xl font-bold text-orange-700">{stats.conversionRate.toFixed(2)}%</div>
                                  </div>
                                </div>
                              </div>
                            ) : status === 'approved' ? (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                                <div className="text-xs text-orange-600 font-medium">UniLink pending creation</div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                                <div className="text-xs text-gray-400 font-medium">No link created</div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col items-start gap-2">
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
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md px-3 py-1 text-sm font-semibold'
                                    : status === 'rejected'
                                    ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md px-3 py-1 text-sm font-semibold'
                                    : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md px-3 py-1 text-sm font-semibold'
                                }
                              >
                                {status === 'approved' && <CheckCircle className="w-3 h-3 mr-1 inline" />}
                                {status === 'rejected' && <XCircle className="w-3 h-3 mr-1 inline" />}
                                {status === 'pending' && <Clock className="w-3 h-3 mr-1 inline" />}
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                              {affiliate.approvedAt && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(affiliate.approvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  setSelectedAffiliate(affiliate);
                                  if (affiliate.id) {
                                    try {
                                      const useDynamoDB = isDynamoDBConfigured();
                                      
                                      if (useDynamoDB) {
                                        // Fetch analytics from DynamoDB
                                        const analytics = await getAnalyticsByUserId(affiliate.id);
                                        setUserAnalytics(analytics);
                                      } else {
                                        // Fallback to backend API
                                        const response = await fetch(`${API_BASE_URL}/api/users/${affiliate.id}/analytics?days=30`);
                                        if (response.ok) {
                                          const data = await response.json();
                                          setUserAnalytics(data);
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Error fetching user analytics:', error);
                                    }
                                  }
                                  setDetailDialogOpen(true);
                                }}
                                className="border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {status === 'approved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 transition-all shadow-sm"
                                  onClick={async () => {
                                    setSelectedAffiliate(affiliate);
                                    if (templates.length === 0) {
                                      await fetchTemplates();
                                    }
                                    setAssignLinkDialogOpen(true);
                                  }}
                                  title="Assign Link"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Link
                                </Button>
                              )}
                              {status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAffiliate(affiliate);
                                      setAdminNotes(affiliate.adminNotes || '');
                                      setApprovalDialogOpen(true);
                                    }}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md transition-all"
                                    title="Approve"
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
                                    className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-md transition-all"
                                    title="Reject"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedAffiliate(affiliate);
                                  setDeleteDialogOpen(true);
                                }}
                                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedAffiliate?.name}? This action cannot be undone.
              <br />
              <span className="font-semibold text-red-600 mt-2 block">
                The user will no longer be able to login after deletion.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
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
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  {selectedAffiliate.socialHandles && selectedAffiliate.socialHandles.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 gap-3">
                        {selectedAffiliate.socialHandles.map((handle: SocialHandle, idx: number) => {
                          const url = getSocialMediaUrl(handle.platform, handle.handle);
                          return (
                            <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">{handle.platform}</span>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Handle: </span>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 inline-flex"
                                >
                                  {handle.handle}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
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
                  )}
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

              {/* Performance Stats */}
              {selectedAffiliate.stats && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="bg-white p-3 rounded border">
                      <label className="text-sm text-gray-500">Total Clicks</label>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedAffiliate.stats.totalClicks.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <label className="text-sm text-gray-500">App Installs</label>
                      <p className="text-2xl font-bold text-cyan-600">
                        {(selectedAffiliate.stats.totalInstalls || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <label className="text-sm text-gray-500">Purchases</label>
                      <p className="text-2xl font-bold text-emerald-600">
                        {(selectedAffiliate.stats.totalPurchases || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <label className="text-sm text-gray-500">Total Conversions</label>
                      <p className="text-2xl font-bold text-purple-600">
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
                    <div className="bg-white p-3 rounded border">
                      <label className="text-sm text-gray-500">Install Rate</label>
                      <p className="text-2xl font-bold text-cyan-600">
                        {selectedAffiliate.stats.installRate ? `${selectedAffiliate.stats.installRate}%` : '0%'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <label className="text-sm text-gray-500">Purchase Rate</label>
                      <p className="text-2xl font-bold text-emerald-600">
                        {selectedAffiliate.stats.purchaseRate ? `${selectedAffiliate.stats.purchaseRate}%` : '0%'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <label className="text-sm text-gray-500">Last Activity</label>
                      <p className="font-medium text-sm">
                        {new Date(selectedAffiliate.stats.lastActivity).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Conversion Graphs */}
                  {userAnalytics.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Conversion Analytics (Last 30 Days)
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Installs & Purchases</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart data={userAnalytics}>
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
                            <CardTitle className="text-sm">Clicks & Conversions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart data={userAnalytics}>
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

                        <Card className="lg:col-span-2">
                          <CardHeader>
                            <CardTitle className="text-sm">Earnings Over Time</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={userAnalytics}>
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
                      </div>
                    </div>
                  )}
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

      {/* Assign Link Dialog */}
      <Dialog open={assignLinkDialogOpen} onOpenChange={setAssignLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Link to {selectedAffiliate?.name}</DialogTitle>
            <DialogDescription>
              Create a link in AppTrove dashboard, then paste the URL here to assign it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                <strong>Auto-Create:</strong> If you select the "EduRise" template and don't choose an existing link, a new link will be automatically created when you click "Assign Link".
              </AlertDescription>
            </Alert>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Template (Optional - to view existing links)
              </label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template to view existing links" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template._id || template.id} value={template._id || template.id}>
                      {template.name} ({template.domain})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Existing Link from Template {availableLinks.length > 0 && `(${availableLinks.length} available)`}
                </label>
                {availableLinks.length > 0 ? (
                  <Select value={selectedLink} onValueChange={setSelectedLink}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an existing link" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLinks.map((link) => (
                        <SelectItem key={link.id} value={link.id}>
                          {link.name} - {link.shortUrl || link.longUrl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                    No existing links found. Please create a link in AppTrove dashboard and paste the URL below.
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                UniLink URL
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                placeholder="https://applink.reevo.in/d/... or https://applink.adda247.com/d/..."
                value={manualUnilink}
                onChange={(e) => setManualUnilink(e.target.value)}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {selectedLink 
                  ? 'Selected link will override this entry.' 
                  : 'Paste the unilink URL from AppTrove dashboard here. You can find it after creating a link in the "EduRise" template.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAssignLinkDialogOpen(false);
              setSelectedLink("");
              setManualUnilink("");
              setSelectedTemplate("");
              setAvailableLinks([]);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignLink} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!selectedTemplate && !manualUnilink.trim() && !selectedLink}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              {selectedTemplate && !selectedLink ? "Create & Assign Link" : "Assign Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
