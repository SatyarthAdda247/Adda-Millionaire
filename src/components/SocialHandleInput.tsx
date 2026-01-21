import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";

import { API_BASE_URL } from "@/lib/apiConfig";

interface SocialHandle {
  id: string;
  platform: string;
  handle: string;
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
  const addHandle = () => {
    const newHandle: SocialHandle = {
      id: Date.now().toString(),
      platform: "",
      handle: "",
    };
    onChange([...handles, newHandle]);
  };

  const removeHandle = (id: string) => {
    onChange(handles.filter((h) => h.id !== id));
  };

  const updateHandle = (id: string, updates: Partial<SocialHandle>) => {
    onChange(
      handles.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-base font-medium text-gray-700">
          Social Media Handles <span className="text-red-500">*</span>
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
        <div className="text-sm text-amber-600 text-center py-4 border-2 border-amber-300 border-dashed rounded-lg bg-amber-50">
          <strong>Required:</strong> Please add at least one social media handle to proceed.
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

        </div>
      ))}
    </div>
  );
}
