import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit, Save, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

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

interface AffiliateDetailModalProps {
  affiliate: Affiliate | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const AffiliateDetailModal = ({
  affiliate,
  isOpen,
  onClose,
  onUpdate,
}: AffiliateDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    platform: "",
    socialHandle: "",
    followerCount: "",
    status: "active",
  });
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (affiliate) {
      setFormData({
        name: affiliate.name,
        phone: affiliate.phone,
        platform: affiliate.platform || "",
        socialHandle: affiliate.socialHandle || "",
        followerCount: affiliate.followerCount || "",
        status: affiliate.status || "active",
      });
      fetchAnalytics();
    }
  }, [affiliate]);

  const fetchAnalytics = async () => {
    if (!affiliate) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/${affiliate.id}/analytics`
      );
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const handleSave = async () => {
    if (!affiliate) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users/${affiliate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update affiliate");
      }

      toast({
        title: "Success",
        description: "Affiliate updated successfully",
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update affiliate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  if (!affiliate) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isEditing ? "Edit Affiliate" : "Affiliate Details"}
                  </h2>
                  <p className="text-sm text-gray-500">{affiliate.email}</p>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: affiliate.name,
                            phone: affiliate.phone,
                            platform: affiliate.platform || "",
                            socialHandle: affiliate.socialHandle || "",
                            followerCount: affiliate.followerCount || "",
                            status: affiliate.status || "active",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-gray-600">
                        Total Clicks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-gray-900">
                        {affiliate.stats.totalClicks.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-gray-600">
                        Conversions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-gray-900">
                        {affiliate.stats.totalConversions.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-gray-600">
                        Earnings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{affiliate.stats.totalEarnings.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-gray-600">
                        Conversion Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-gray-900">
                        {affiliate.stats.conversionRate}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Form Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    ) : (
                      <p className="text-gray-900">{affiliate.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    ) : (
                      <p className="text-gray-900">{affiliate.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform
                    </label>
                    {isEditing ? (
                      <Select
                        value={formData.platform}
                        onValueChange={(value) =>
                          setFormData({ ...formData, platform: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="YouTube">YouTube</SelectItem>
                          <SelectItem value="Telegram">Telegram</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Twitter/X">Twitter/X</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{affiliate.platform || "N/A"}</Badge>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follower Count
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.followerCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            followerCount: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <p className="text-gray-900">
                        {affiliate.followerCount || "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Social Handle
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.socialHandle}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialHandle: e.target.value,
                          })
                        }
                        placeholder="@username"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {affiliate.socialHandle || "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    {isEditing ? (
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={
                          affiliate.status === "active"
                            ? "default"
                            : affiliate.status === "inactive"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {affiliate.status || "active"}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Trackier Links */}
                {affiliate.links && affiliate.links.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Trackier Links
                    </h3>
                    <div className="space-y-2">
                      {affiliate.links.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                        >
                          <code className="flex-1 text-sm text-gray-700 break-all">
                            {link.link}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyLink(link.link)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(link.link, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AffiliateDetailModal;
