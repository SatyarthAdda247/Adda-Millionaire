import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const platforms = [
  "Instagram",
  "YouTube",
  "Telegram",
  "WhatsApp",
  "Twitter/X",
  "Other",
];

const followerRanges = [
  "1K - 5K",
  "5K - 10K",
  "10K - 50K",
  "50K - 100K",
  "100K - 500K",
  "500K+",
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const SignupForm = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    platform: "",
    socialHandle: "",
    followerCount: "",
    termsAccepted: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackierLink, setTrackierLink] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.termsAccepted) {
      toast({
        title: "Please accept the terms",
        description: "You need to accept the terms and conditions to proceed.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          platform: formData.platform,
          socialHandle: formData.socialHandle,
          followerCount: formData.followerCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Success
      setUserId(data.user.id);
      setTrackierLink(data.user.trackierLink);
      
      toast({
        title: "Welcome to Millionaire's Adda! 🎉",
        description: data.message || "Your profile has been created successfully!",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        platform: "",
        socialHandle: "",
        followerCount: "",
        termsAccepted: false,
      });

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="signup"
      className="py-24 md:py-32 gradient-hero"
      ref={ref}
    >
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-8">
            Ready to Start <span className="text-green-600">Earning?</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-4">
            Join our affiliate program today and start earning monthly commissions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -150 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-xl mx-auto bg-white rounded-2xl p-8 md:p-10 shadow-lg border border-gray-200"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="rounded-xl border-gray-300 focus:border-blue-600 bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="rounded-xl border-gray-300 focus:border-blue-600 bg-gray-50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-3">
                Phone
              </label>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="rounded-xl border-gray-300 focus:border-blue-600 bg-gray-50"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  Primary Platform
                </label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) =>
                    setFormData({ ...formData, platform: value })
                  }
                >
                  <SelectTrigger className="rounded-xl border-gray-300 focus:border-blue-600 bg-gray-50">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  Follower Count
                </label>
                <Select
                  value={formData.followerCount}
                  onValueChange={(value) =>
                    setFormData({ ...formData, followerCount: value })
                  }
                >
                  <SelectTrigger className="rounded-xl border-gray-300 focus:border-blue-600 bg-gray-50">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {followerRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-3">
                Social Handle
              </label>
              <Input
                type="text"
                placeholder="@yourusername"
                value={formData.socialHandle}
                onChange={(e) =>
                  setFormData({ ...formData, socialHandle: e.target.value })
                }
                className="rounded-xl border-gray-300 focus:border-blue-600 bg-gray-50"
              />
            </div>

            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="terms"
                checked={formData.termsAccepted}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, termsAccepted: checked as boolean })
                }
                className="mt-1"
              />
              <label
                htmlFor="terms"
                className="text-base text-gray-600 cursor-pointer"
              >
                I agree to the{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-7 text-xl font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>Creating Profile...</>
              ) : (
                <>
                  Start Now
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {trackierLink && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl"
            >
              <h3 className="font-semibold text-green-900 mb-2">Your Trackier Link:</h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-green-800 bg-white px-3 py-2 rounded border border-green-300 break-all">
                  {trackierLink}
                </code>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(trackierLink);
                    toast({
                      title: "Copied!",
                      description: "Trackier link copied to clipboard",
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-green-700 mt-2">
                Save this link! Use it in your videos and posts to track your earnings.
              </p>
            </motion.div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Takes less than a minute.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SignupForm;
