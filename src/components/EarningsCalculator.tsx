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
  const [followers, setFollowers] = useState([10000]);
  const [avgViews, setAvgViews] = useState([5000]);

  const earnings = useMemo(() => {
    const viewsMultiplier = avgViews[0] / followers[0];
    const estimatedConversions =
      avgViews[0] * selectedPlatform.conversionRate * viewsMultiplier;
    const avgCommission = 150; // Average commission per conversion in INR
    const monthlyLow = Math.round(estimatedConversions * avgCommission * 0.7);
    const monthlyHigh = Math.round(estimatedConversions * avgCommission * 1.3);

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
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
            Estimate Your <span className="text-gradient">Earnings</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            See what your content could earn you each month.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl mx-auto floating-card p-8 md:p-12"
        >
          {/* Platform Selection */}
          <div className="mb-10">
            <label className="block text-sm font-medium text-muted-foreground mb-4">
              Platform
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    selectedPlatform.id === platform.id
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
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
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Followers / Subscribers
              </label>
              <span className="text-lg font-display font-bold text-foreground">
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
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Average Views
              </label>
              <span className="text-lg font-display font-bold text-foreground">
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
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
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
            className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 text-center"
          >
            <p className="text-sm text-muted-foreground mb-2">
              Estimated Monthly Earnings
            </p>
            <p className="text-3xl md:text-4xl font-display font-bold text-foreground">
              {formatCurrency(earnings.low)}{" "}
              <span className="text-muted-foreground font-normal text-xl">
                —
              </span>{" "}
              {formatCurrency(earnings.high)}
            </p>
          </motion.div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Actual earnings depend on engagement and conversions.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default EarningsCalculator;
