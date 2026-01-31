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
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import SocialHandleInput from "./SocialHandleInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const followerRanges = [
  "1K - 5K",
  "5K - 10K",
  "10K - 50K",
  "50K - 100K",
  "100K - 500K",
  "500K+",
];

import { createUser } from "@/lib/backend-api";
import { v4 as uuidv4 } from "uuid";

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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate terms acceptance
    if (!formData.termsAccepted) {
      toast({
        title: "Please accept the terms",
        description: "You need to accept the terms and conditions to proceed.",
        variant: "destructive",
      });
      return;
    }

    // Validate at least one social handle is required
    const validHandles = socialHandles.filter(h => h.platform && h.handle.trim());
    if (validHandles.length === 0) {
      toast({
        title: "Social Handle Required",
        description: "Please add at least one social media handle to proceed.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📝 Form submission: Using backend API');
      
      // Process social handles
      const processedHandles = socialHandles.map(h => ({
        platform: (h.platform || '').trim(),
        handle: (h.handle || '').trim(),
      })).filter(h => h.platform && h.handle);

      // Create user via backend API
      const sanitizedEmail = formData.email.trim().toLowerCase();
      const userData = {
        name: formData.name.trim(),
        email: sanitizedEmail,
        phone: formData.phone.trim(),
        platform: processedHandles[0]?.platform || '',
        socialHandle: processedHandles[0]?.handle || '',
        followerCount: parseInt(formData.followerCount) || 0
      };

      console.log('💾 Creating user via backend API...', { email: sanitizedEmail, name: userData.name });
      const result = await createUser(userData);
      console.log('✅ User created:', result);
      
      const data = {
        success: result.success,
        user: {
          id: result.user?.id || result.data?.user?.id,
          name: result.user?.name || result.data?.user?.name,
          email: result.user?.email || result.data?.user?.email,
          approvalStatus: 'pending'
        },
        message: result.message || 'Your application has been submitted successfully. It is pending admin approval. You will receive an email once approved.'
      };

      // Success
      setUserId(data.user.id);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        followerCount: "",
        termsAccepted: false,
      });
      setSocialHandles([]);
      
      // Show success dialog
      setShowSuccessDialog(true);

    } catch (error) {
      console.error('❌ Registration error:', error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        // Provide helpful error messages
        if (errorMessage.includes('AWS credentials not configured')) {
          errorMessage = 'DynamoDB credentials not found. Please check Vercel environment variables (VITE_AWS_ACCESS_KEY_ID, VITE_AWS_SECRET_ACCESS_KEY).';
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('CORS')) {
          errorMessage = 'Unable to connect to server. If using DynamoDB directly, check that credentials are set correctly.';
        }
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

          {/* Success Dialog */}
          <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  Application Submitted Successfully!
                </DialogTitle>
                <DialogDescription className="pt-4 text-base text-gray-600">
                  Your affiliate application has been received and is pending admin approval.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-700 mb-4">
                  Once approved, you'll be able to:
                </p>
                <ul className="text-sm text-gray-600 space-y-2 mb-4 list-disc list-inside">
                  <li>Access your personalized affiliate dashboard</li>
                  <li>Get your unique tracking link</li>
                  <li>View your earnings and statistics</li>
                  <li>Start promoting and earning commissions</li>
                </ul>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Next Steps:</strong> We'll notify you via email once your application is reviewed. 
                    You can also check your status by logging in with your email or phone number.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
