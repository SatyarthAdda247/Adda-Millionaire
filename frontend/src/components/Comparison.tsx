import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, X } from "lucide-react";

const comparisons = [
  {
    feature: "Money Every Month",
    ourModel: "Yes - 20% (₹40) on renewals",
    others: "No - One payment only",
  },
  {
    feature: "Need Followers?",
    ourModel: "No - Anyone can join",
    others: "Yes - Need 10,000+ followers",
  },
  {
    feature: "Cost to Join?",
    ourModel: "Free - No charges",
    others: "Paid - Some charge fees",
  },
  {
    feature: "How Much Can You Earn?",
    ourModel: "Unlimited - No limit",
    others: "Limited - Fixed amount",
  },
  {
    feature: "Your Style?",
    ourModel: "Yes - Create freely",
    others: "No - Strict rules",
  },
  {
    feature: "See Your Earnings?",
    ourModel: "Yes - Live dashboard",
    others: "No - Hard to track",
  },
];

const Comparison = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-blue-50 to-white" ref={ref}>
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-8">
            Why We're{" "}
            <span className="text-green-600">Better</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Simple comparison - See the difference
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 p-4 md:p-6 bg-gray-50 border-b border-gray-200">
              <div className="text-base md:text-lg font-semibold text-gray-900">What</div>
              <div className="text-base md:text-lg font-semibold text-green-600 text-center">
                Us ✓
              </div>
              <div className="text-base md:text-lg font-semibold text-gray-500 text-center">
                Others ✗
              </div>
            </div>

            {/* Comparison Rows */}
            <div className="divide-y divide-gray-200">
              {comparisons.map((comparison, index) => (
                <motion.div
                  key={comparison.feature}
                  initial={{ opacity: 0, x: -50 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.6,
                    delay: 0.3 + index * 0.1,
                    ease: "easeOut",
                  }}
                  className="grid grid-cols-3 gap-2 md:gap-4 p-4 md:p-6 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="font-semibold text-sm md:text-base lg:text-lg text-gray-900 flex items-center">
                    {comparison.feature}
                  </div>
                  <div className="text-center flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1 md:gap-2 text-green-600">
                      <Check className="w-5 h-5 md:w-6 md:h-6" />
                      <span className="text-xs md:text-sm lg:text-base font-medium text-center leading-tight text-gray-700">{comparison.ourModel}</span>
                    </div>
                  </div>
                  <div className="text-center flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1 md:gap-2 text-gray-400">
                      <X className="w-5 h-5 md:w-6 md:h-6" />
                      <span className="text-xs md:text-sm lg:text-base font-medium text-center leading-tight text-gray-500">{comparison.others}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Comparison;
