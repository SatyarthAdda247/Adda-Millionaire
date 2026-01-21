import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TrendingUp, Users, Coins } from "lucide-react";

const stats = [
  {
    icon: Coins,
    value: "₹199",
    label: "Commission Per Sale",
  },
  {
    icon: Users,
    value: "1,000+",
    label: "Active Affiliates",
  },
  {
    icon: TrendingUp,
    value: "20%",
    label: "Recurring Commission",
  },
];

const Stats = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 md:py-28 bg-background" ref={ref}>
      <div className="container px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: -100 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: 0.8,
                delay: index * 0.15,
                ease: "easeOut",
              }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                <stat.icon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-4xl md:text-5xl font-display font-bold text-blue-900 mb-2">
                {stat.value}
              </div>
              <div className="text-lg text-blue-800 font-medium">
                {stat.label}
              </div>
              {stat.description && (
                <div className="text-sm text-gray-500 mt-2">
                  {stat.description}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
