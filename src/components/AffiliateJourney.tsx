import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, Share2, Wallet } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Join & choose",
    description: "Join our affiliate program and get your unique partner link",
  },
  {
    icon: Share2,
    title: "Create & post",
    description: "Make videos in your style and post it on social media with your unique affiliate link",
  },
  {
    icon: Wallet,
    title: "Earn & grow",
    description: "Get monthly payouts. Track your progress on the dashboard and scale with insights",
  },
];

const AffiliateJourney = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
            Get Started in{" "}
            <span className="text-gradient">3 Simple Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Turn your content into monthly income.
          </p>
        </motion.div>

        {/* Desktop horizontal timeline */}
        <div className="hidden md:block">
          <div className="relative max-w-5xl mx-auto">
            {/* Connection line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
              className="absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 origin-left"
            />

            <div className="flex justify-between relative">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.6,
                    delay: 0.3 + index * 0.15,
                    ease: "easeOut",
                  }}
                  className="flex flex-col items-center text-center flex-1 max-w-xs"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="w-14 h-14 rounded-2xl bg-card shadow-card flex items-center justify-center mb-4 relative z-10"
                  >
                    <step.icon className="w-6 h-6 text-primary" />
                  </motion.div>
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile vertical timeline */}
        <div className="md:hidden space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.2 + index * 0.1,
                ease: "easeOut",
              }}
              className="flex items-start gap-4"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-card shadow-card flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-primary/20" />
                )}
              </div>
              <div className="pt-2">
                <h3 className="font-display font-semibold text-foreground mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AffiliateJourney;
