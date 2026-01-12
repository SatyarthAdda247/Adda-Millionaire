import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Zap,
  Link2,
  Activity,
  Shield,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "One-time onboarding",
    description: "Quick setup, then you're ready to earn",
  },
  {
    icon: Link2,
    title: "Instant tracking links",
    description: "Generate links for any product in seconds",
  },
  {
    icon: Activity,
    title: "Real-time analytics",
    description: "Watch clicks and conversions as they happen",
  },
  {
    icon: Shield,
    title: "Transparent payouts",
    description: "Clear earnings and monthly settlements",
  },
];

const Features = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 md:py-32 bg-background" ref={ref}>
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
            Everything You Need,{" "}
            <span className="text-gradient">Nothing You Don't</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Simple, powerful tools that stay out of your way.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.1 + index * 0.1,
                ease: "easeOut",
              }}
              className="bg-muted/30 rounded-2xl p-6 hover:bg-muted/50 transition-colors duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span>
            Performance and earnings tracked via a secure system powered by
            Trackier.
          </span>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
