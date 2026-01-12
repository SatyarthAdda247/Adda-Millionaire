import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Infinity,
  HeartHandshake,
  Clock,
  Globe,
  TrendingUp,
} from "lucide-react";

const reasons = [
  {
    icon: Infinity,
    title: "Evergreen Earnings",
    description: "Content earns long after posting",
  },
  {
    icon: HeartHandshake,
    title: "No Hard Selling",
    description: "Value-first promotion",
  },
  {
    icon: Clock,
    title: "Your Pace",
    description: "No deadlines, no targets",
  },
  {
    icon: Globe,
    title: "Any Platform",
    description: "Instagram, YouTube, Telegram, WhatsApp",
  },
  {
    icon: TrendingUp,
    title: "Skill Compounds",
    description: "Better content = better income",
  },
];

const WhyItWorks = () => {
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
            Why This Model <span className="text-gradient">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Built for affiliates who think long-term.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: "easeOut",
              }}
              whileHover={{
                y: -8,
                transition: { duration: 0.3 },
              }}
              className="glass-card rounded-2xl p-6 text-center group cursor-default"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
                className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow duration-300"
              >
                <reason.icon className="w-7 h-7 text-primary" />
              </motion.div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {reason.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {reason.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyItWorks;
