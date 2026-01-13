import { motion, useInView } from "framer-motion";
import { useRef, useState, useMemo } from "react";
import { TrendingUp, Users } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const earningStages = [
  {
    month: "Month 1",
    newConversions: 50,
    commissionPerConversion: 199,
    totalEarnings: 9950,
    description: "50 New Conversions × ₹199",
    progress: 33,
    color: "green",
  },
  {
    month: "Month 2",
    newConversions: 75,
    renewals: 30,
    renewalCommission: 40,
    totalEarnings: 17350,
    description: "75 New × ₹199 + 30 Renewals × ₹40",
    growth: "+75% Growth",
    progress: 60,
    color: "blue",
  },
  {
    month: "Months 3+",
    newConversions: 100,
    renewals: 60,
    lifetimeCommission: "20%",
    totalEarnings: 27940,
    description: "100 New + 60 Renewals",
    compounding: "Compounding Forever",
    progress: 100,
    color: "gradient",
  },
];

const HowYouEarn = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [newConversions, setNewConversions] = useState([50]);
  const [renewals, setRenewals] = useState([30]);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const earnings = useMemo(() => {
    const newConversionEarnings = newConversions[0] * 199;
    const renewalEarnings = renewals[0] * 40;
    const totalEarnings = newConversionEarnings + renewalEarnings;
    
    // Add variance: ±10% for realistic range
    const monthlyLow = Math.round(totalEarnings * 0.9);
    const monthlyHigh = Math.round(totalEarnings * 1.1);

    return {
      low: monthlyLow,
      high: monthlyHigh,
      newConversionEarnings,
      renewalEarnings,
      totalEarnings,
    };
  }, [newConversions, renewals]);

  return (
    <section id="calculator" className="py-24 md:py-32 bg-background" ref={ref}>
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-8">
            Watch Recurring Income{" "}
            <span className="text-green-600">Compound Automatically</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            See how your earnings grow month by month
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {earningStages.map((stage, index) => (
            <motion.div
              key={stage.month}
              initial={{ opacity: 0, x: -100 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: 0.8,
                delay: 0.2 + index * 0.15,
                ease: "easeOut",
              }}
              className={`rounded-2xl p-6 md:p-8 ${
                stage.color === "green"
                  ? "bg-green-50 border-2 border-green-200"
                  : stage.color === "blue"
                  ? "bg-blue-50 border-2 border-blue-200"
                  : "bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 text-white border-2 border-transparent"
              } shadow-elevated`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  stage.color === "green"
                    ? "bg-green-100 text-green-700"
                    : stage.color === "blue"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-white/20 text-white"
                } font-bold text-lg`}
              >
                {index + 1}
              </div>

              <h3
                className={`text-lg font-semibold mb-4 ${
                  stage.color === "gradient" ? "text-white" : "text-foreground"
                }`}
              >
                {stage.month}
              </h3>

              <div
                className={`text-3xl md:text-4xl font-display font-bold mb-3 ${
                  stage.color === "gradient" ? "text-white" : "text-foreground"
                }`}
              >
                {formatCurrency(stage.totalEarnings)}
              </div>

              <p
                className={`text-sm mb-4 ${
                  stage.color === "gradient"
                    ? "text-white/90"
                    : "text-muted-foreground"
                }`}
              >
                {stage.description}
              </p>


              {stage.growth && (
                <div
                  className={`inline-block px-3 py-1 rounded-lg text-sm font-medium mb-4 ${
                    stage.color === "gradient"
                      ? "bg-white/20 text-white"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {stage.growth}
                </div>
              )}

              {stage.compounding && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">∞</span>
                  <span className="text-sm font-medium text-white">
                    {stage.compounding}
                  </span>
                </div>
              )}

              <div className="mt-6">
                <div className="flex justify-between text-xs mb-1">
                  <span
                    className={
                      stage.color === "gradient"
                        ? "text-white/80"
                        : "text-muted-foreground"
                    }
                  >
                    Progress
                  </span>
                  <span
                    className={
                      stage.color === "gradient"
                        ? "text-white"
                        : "text-foreground"
                    }
                  >
                    {stage.progress}%
                  </span>
                </div>
                <div
                  className={`h-2 rounded-full overflow-hidden ${
                    stage.color === "gradient"
                      ? "bg-white/20"
                      : stage.color === "green"
                      ? "bg-green-100"
                      : "bg-blue-100"
                  }`}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${stage.progress}%` } : {}}
                    transition={{
                      duration: 1,
                      delay: 0.5 + index * 0.2,
                      ease: "easeOut",
                    }}
                    className={`h-full ${
                      stage.color === "gradient"
                        ? "bg-white"
                        : stage.color === "green"
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto bg-blue-50 rounded-2xl p-6 md:p-8 border border-blue-100 mb-12"
        >
          <h3 className="text-xl md:text-2xl font-display font-semibold text-gray-900 mb-2 text-center">
            Create Videos. Get Paid Every Month.
          </h3>
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  New Conversion
                </h4>
                <p className="text-sm text-gray-600">
                  When someone buys using your link: <strong className="text-gray-900">₹199 commission</strong>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Renewal Commission
                </h4>
                <p className="text-sm text-gray-600">
                  When they renew monthly: <strong className="text-gray-900">20% commission (₹40)</strong> per renewal, every month
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Earnings Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="max-w-2xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-200"
        >
          <h3 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-2 text-center">
            Estimate Your <span className="text-green-600">Earnings</span>
          </h3>
          <p className="text-lg text-gray-600 text-center mb-8">
            See what your conversions could earn you each month
          </p>

          {/* New Conversions Slider */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <label className="text-lg font-medium text-gray-700 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                New Conversions
              </label>
              <span className="text-2xl font-display font-bold text-green-700">
                {formatNumber(newConversions[0])}
              </span>
            </div>
            <Slider
              value={newConversions}
              onValueChange={setNewConversions}
              min={10}
              max={200}
              step={5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>10</span>
              <span>200</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {newConversions[0]} × ₹199 = {formatCurrency(earnings.newConversionEarnings)}
            </p>
          </div>

          {/* Renewals Slider */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <label className="text-lg font-medium text-gray-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Monthly Renewals
              </label>
              <span className="text-2xl font-display font-bold text-blue-700">
                {formatNumber(renewals[0])}
              </span>
            </div>
            <Slider
              value={renewals}
              onValueChange={setRenewals}
              min={0}
              max={150}
              step={5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0</span>
              <span>150</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {renewals[0]} × ₹40 = {formatCurrency(earnings.renewalEarnings)}
            </p>
          </div>

          {/* Earnings Result */}
          <motion.div
            key={`${newConversions[0]}-${renewals[0]}`}
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

export default HowYouEarn;
