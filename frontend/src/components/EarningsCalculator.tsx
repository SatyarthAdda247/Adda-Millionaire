import { motion, useInView } from "framer-motion";
import { useRef, useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, Users } from "lucide-react";

const platforms = [
  { id: "instagram", name: "Instagram", conversionRate: 0.008 },
  { id: "youtube", name: "YouTube", conversionRate: 0.015 },
  { id: "telegram", name: "Telegram", conversionRate: 0.02 },
  { id: "whatsapp", name: "WhatsApp", conversionRate: 0.025 },
];

const EarningsCalculator = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0]);
  const [followers, setFollowers] = useState([5000]);
  const [avgViews, setAvgViews] = useState([2500]);

  const earnings = useMemo(() => {
    // Target: 5000 followers with 50% engagement = ₹15,000/month (center point)
    // Base rate: ₹4.4 per follower (5000 * 4.4 = ₹22,000)
    // With 0.75 engagement multiplier: ₹22,000 * 0.75 = ₹16,500
    // With platform multiplier 0.9: ₹16,500 * 0.9 = ₹14,850 ≈ ₹15,000
    
    const baseRate = 4.44; // ₹ per follower (adjusted to center around ₹15,000)
    const baseEarnings = followers[0] * baseRate;
    
    // Engagement multiplier: 0.5 to 1.0 based on views/followers ratio
    const engagementRate = Math.min(avgViews[0] / followers[0], 1);
    const engagementMultiplier = 0.5 + (engagementRate * 0.5); // 0.5x to 1x
    
    // Platform multiplier: slight variation by platform (0.85x to 0.95x)
    const platformMultipliers: { [key: string]: number } = {
      instagram: 0.9,
      youtube: 0.95,
      telegram: 0.85,
      whatsapp: 0.9,
    };
    const platformMultiplier = platformMultipliers[selectedPlatform.id] || 0.9;
    
    const estimatedMonthly = baseEarnings * engagementMultiplier * platformMultiplier;
    
    // Add variance: ±10% for realistic range around ₹15,000
    const monthlyLow = Math.round(estimatedMonthly * 0.9);
    const monthlyHigh = Math.round(estimatedMonthly * 1.1);

    return {
      low: monthlyLow,
      high: monthlyHigh,
    };
  }, [selectedPlatform, followers, avgViews]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <section className="py-24 md:py-32 gradient-hero" ref={ref}>
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-8">
            Estimate Your <span className="text-green-600">Earnings</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
            See what your content could earn you each month
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -150 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-2xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-200"
        >
          {/* Platform Selection */}
          <div className="mb-10">
            <label className="block text-lg font-medium text-gray-700 mb-6">
              Platform
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    selectedPlatform.id === platform.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {platform.name}
                </button>
              ))}
            </div>
          </div>

          {/* Followers Slider */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <label className="text-lg font-medium text-gray-700 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Followers / Subscribers
              </label>
              <span className="text-2xl font-display font-bold text-blue-900">
                {formatNumber(followers[0])}
              </span>
            </div>
            <Slider
              value={followers}
              onValueChange={setFollowers}
              min={1000}
              max={1000000}
              step={1000}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>1K</span>
              <span>1M</span>
            </div>
          </div>

          {/* Average Views Slider */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <label className="text-lg font-medium text-gray-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Average Views
              </label>
              <span className="text-2xl font-display font-bold text-blue-900">
                {formatNumber(avgViews[0])}
              </span>
            </div>
            <Slider
              value={avgViews}
              onValueChange={setAvgViews}
              min={500}
              max={followers[0]}
              step={500}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>500</span>
              <span>{formatNumber(followers[0])}</span>
            </div>
          </div>

          {/* Earnings Result */}
          <motion.div
            key={`${selectedPlatform.id}-${followers[0]}-${avgViews[0]}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 text-center border border-green-200"
          >
            <p className="text-lg text-gray-600 mb-3">
              Estimated Monthly Earnings
            </p>
            <p className="text-4xl md:text-5xl font-display font-bold text-green-700">
              {formatCurrency(earnings.low)}{" "}
              <span className="text-gray-500 font-normal text-xl">
                —
              </span>{" "}
              {formatCurrency(earnings.high)}
            </p>
          </motion.div>

          <p className="text-xs text-gray-500 text-center mt-6">
            Actual earnings depend on engagement and conversions.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default EarningsCalculator;
