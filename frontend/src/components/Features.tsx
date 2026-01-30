import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Zap,
  Link2,
  Activity,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Earn Every Month",
    description: "Get paid 100% (₹199) on first sale. Then earn 20% (₹40) every month when users renew. No limit on how much you can make.",
  },
  {
    icon: Link2,
    title: "We Help You Succeed",
    description: "Get your unique link. We give you video ideas and scripts. Track everything in real-time.",
  },
  {
    icon: Activity,
    title: "Works for Everyone",
    description: "100 followers or 1 million - doesn't matter. If your audience buys, you earn money.",
  },
];

const Features = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 md:py-32 bg-background" ref={ref}>
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-8">
            What You <span className="text-green-600">Get</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Three simple reasons to join us
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -150 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: 0.8,
                delay: 0.2 + index * 0.15,
                ease: "easeOut",
              }}
              className="bg-white rounded-2xl p-8 md:p-10 hover:shadow-lg transition-all duration-300 border border-gray-100"
            >
              <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center mb-6 shadow-sm">
                <feature.icon className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl md:text-2xl font-display font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Features;
