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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      toast({
        title: "Please accept the terms",
        description: "You need to accept the terms and conditions to proceed.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Welcome to Adda Millionaire! 🎉",
      description: "We'll be in touch shortly to get you started.",
    });
  };

  return (
    <section
      id="signup"
      className="py-24 md:py-32 gradient-hero"
      ref={ref}
    >
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
            Join as an <span className="text-gradient">Affiliate</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start your journey with Adda Millionaire today.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-xl mx-auto floating-card p-8 md:p-10"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="rounded-xl border-border/50 focus:border-primary bg-background/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="rounded-xl border-border/50 focus:border-primary bg-background/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Phone
              </label>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="rounded-xl border-border/50 focus:border-primary bg-background/50"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Primary Platform
                </label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) =>
                    setFormData({ ...formData, platform: value })
                  }
                >
                  <SelectTrigger className="rounded-xl border-border/50 focus:border-primary bg-background/50">
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
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Follower Count
                </label>
                <Select
                  value={formData.followerCount}
                  onValueChange={(value) =>
                    setFormData({ ...formData, followerCount: value })
                  }
                >
                  <SelectTrigger className="rounded-xl border-border/50 focus:border-primary bg-background/50">
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
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Social Handle
              </label>
              <Input
                type="text"
                placeholder="@yourusername"
                value={formData.socialHandle}
                onChange={(e) =>
                  setFormData({ ...formData, socialHandle: e.target.value })
                }
                className="rounded-xl border-border/50 focus:border-primary bg-background/50"
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
                className="text-sm text-muted-foreground cursor-pointer"
              >
                I agree to the{" "}
                <a href="#" className="text-primary hover:underline">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full gradient-cta text-primary-foreground py-6 text-lg rounded-2xl shadow-glow hover:shadow-elevated transition-all duration-300 group"
            >
              Join as an Affiliate
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Takes less than a minute.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SignupForm;
