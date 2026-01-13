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
    title: "Earn like a partner",
    description: "100% payout on the first paid subscription. Recurring commission when the learner renews. Unlimited earning potential (no cap)",
  },
  {
    icon: Link2,
    title: "Everything to help you win",
    description: "Your unique link. Ready creative angles + sample scripts. Transparent tracking + payout visibility",
  },
  {
    icon: Activity,
    title: "Works at any scale",
    description: "100 or 1M followers - if your audience pays, you earn",
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
            What you <span className="text-gradient">get?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Brand deals are one-time. This is your chance to make monthly income that compounds.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
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
              <h3 className="font-display font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
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
