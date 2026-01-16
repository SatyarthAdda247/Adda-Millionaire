import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle, Loader2, AlertCircle, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SocialHandle {
  id: string;
  platform: string;
  handle: string;
  verified: boolean;
  verifiedFollowers?: number;
  verifiedAt?: string;
  error?: string;
}

interface SocialHandleInputProps {
  handles: SocialHandle[];
  onChange: (handles: SocialHandle[]) => void;
}

const platforms = [
  { value: "Instagram", label: "Instagram", placeholder: "@username or instagram.com/username" },
  { value: "YouTube", label: "YouTube", placeholder: "Channel URL or Channel ID" },
  { value: "Facebook", label: "Facebook", placeholder: "facebook.com/username or Page URL" },
  { value: "Twitter/X", label: "Twitter/X", placeholder: "@username or twitter.com/username" },
  { value: "Telegram", label: "Telegram", placeholder: "@username" },
  { value: "TikTok", label: "TikTok", placeholder: "@username" },
  { value: "LinkedIn", label: "LinkedIn", placeholder: "linkedin.com/in/username" },
  { value: "Other", label: "Other", placeholder: "Profile URL or handle" },
];

export default function SocialHandleInput({ handles, onChange }: SocialHandleInputProps) {
  const [verifying, setVerifying] = useState<string | null>(null);

  const addHandle = () => {
    const newHandle: SocialHandle = {
      id: Date.now().toString(),
      platform: "",
      handle: "",
      verified: false,
    };
    onChange([...handles, newHandle]);
  };

  const removeHandle = (id: string) => {
    onChange(handles.filter((h) => h.id !== id));
  };

  const updateHandle = (id: string, updates: Partial<SocialHandle>) => {
    onChange(
      handles.map((h) => (h.id === id ? { ...h, ...updates, verified: false } : h))
    );
  };

  const verifyHandle = async (handle: SocialHandle) => {
    if (!handle.platform || !handle.handle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a platform and enter a handle/URL",
        variant: "destructive",
      });
      return;
    }

    setVerifying(handle.id);

    try {
      const response = await fetch(`${API_BASE_URL}/api/social/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: handle.platform,
          handle: handle.handle.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        updateHandle(handle.id, {
          verified: true,
          verifiedFollowers: data.followers || data.subscribers || 0,
          verifiedAt: new Date().toISOString(),
          error: undefined,
        });
        toast({
          title: "Verified! ✅",
          description: `${handle.platform} profile verified with ${formatNumber(data.followers || data.subscribers || 0)} ${handle.platform === 'YouTube' ? 'subscribers' : 'followers'}`,
        });
      } else {
        updateHandle(handle.id, {
          verified: false,
          error: data.error || "Verification failed",
        });
        toast({
          title: "Verification Failed",
          description: data.error || "Could not verify this profile. Please check the handle/URL.",
          variant: "destructive",
        });
      }
    } catch (error) {
      updateHandle(handle.id, {
        verified: false,
        error: "Network error. Please try again.",
      });
      toast({
        title: "Verification Error",
        description: "Failed to verify profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(null);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-base font-medium text-gray-700">
          Social Media Handles
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addHandle}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Handle
        </Button>
      </div>

      {handles.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed rounded-lg">
          No social handles added. Click "Add Handle" to add one.
        </div>
      )}

      {handles.map((handle) => (
        <div
          key={handle.id}
          className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                value={handle.platform}
                onValueChange={(value) => updateHandle(handle.id, { platform: value })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={
                    platforms.find((p) => p.value === handle.platform)?.placeholder ||
                    "Enter handle or URL"
                  }
                  value={handle.handle}
                  onChange={(e) => updateHandle(handle.id, { handle: e.target.value })}
                  className="bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeHandle(handle.id)}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {handle.verified ? (
                <>
                  <Badge className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                  {handle.verifiedFollowers !== undefined && (
                    <span className="text-sm text-gray-600">
                      {formatNumber(handle.verifiedFollowers)}{" "}
                      {handle.platform === "YouTube" ? "subscribers" : "followers"}
                    </span>
                  )}
                </>
              ) : handle.error ? (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {handle.error}
                </Badge>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => verifyHandle(handle)}
              disabled={!handle.platform || !handle.handle.trim() || verifying === handle.id}
              className="flex items-center gap-2"
            >
              {verifying === handle.id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  {handle.verified ? "Re-verify" : "Verify"}
                </>
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
