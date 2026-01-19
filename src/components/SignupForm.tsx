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
import SocialHandleInput from "./SocialHandleInput";

const followerRanges = [
  "1K - 5K",
  "5K - 10K",
  "10K - 50K",
  "50K - 100K",
  "100K - 500K",
  "500K+",
];

import { API_BASE_URL } from "@/lib/apiConfig";

interface SocialHandle {
  id: string;
  platform: string;
  handle: string;
}

const SignupForm = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    followerCount: "",
    termsAccepted: false,
  });

  const [socialHandles, setSocialHandles] = useState<SocialHandle[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            followerCount: formData.followerCount,
            socialHandles: socialHandles.map(h => ({
              platform: h.platform,
              handle: h.handle,
            })),
          }),
        });
      } catch (fetchError: any) {
        // Handle network errors (server not running, CORS, blocked by client, etc.)
        console.error('Network error:', fetchError);
        const errorMsg = fetchError?.message || String(fetchError) || 'Unknown error';
        const isNetworkError = 
          errorMsg.includes('Failed to fetch') || 
          errorMsg.includes('ERR_BLOCKED_BY_CLIENT') ||
          errorMsg.includes('ERR_CONNECTION_REFUSED') ||
          errorMsg.includes('NetworkError') ||
          fetchError?.name === 'TypeError' ||
          fetchError?.name === 'NetworkError';
        
        const errorMessage = isNetworkError
          ? `Unable to connect to backend server at ${API_BASE_URL}. Please ensure the backend server is running. Start it with: cd server && npm start`
          : `Network error: ${errorMsg}`;
        throw new Error(errorMessage);
      }

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || `Server returned ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Success
      setUserId(data.user.id);
      
      toast({
        title: "Application Submitted! 🎉",
        description: "Your application has been sent for admin approval. You'll receive an email once approved.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        followerCount: "",
        termsAccepted: false,
      });
      setSocialHandles([]);

    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Show longer for connection errors
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

            <div>
              <label className="block text-base font-medium text-gray-700 mb-3">
                Estimated Total Follower Count
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

            <SocialHandleInput handles={socialHandles} onChange={setSocialHandles} />

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

          {userId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Application Submitted Successfully!</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Your affiliate application has been received and is pending admin approval. 
                    Once approved, you'll be able to:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 mb-4 list-disc list-inside">
                    <li>Access your personalized affiliate dashboard</li>
                    <li>Get your unique tracking link</li>
                    <li>View your earnings and statistics</li>
                    <li>Start promoting and earning commissions</li>
                  </ul>
                  <p className="text-xs text-blue-600 mt-4">
                    We'll notify you via email once your application is reviewed. 
                    You can also check your status by logging in with your email or phone number.
                  </p>
                </div>
              </div>
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
