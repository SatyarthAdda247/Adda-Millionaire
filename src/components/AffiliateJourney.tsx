import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, Share2, Wallet } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Step 1: Join",
    description: "Sign up free. Get your special link.",
  },
  {
    icon: Share2,
    title: "Step 2: Share",
    description: "Make videos. Add your link. Post anywhere.",
  },
  {
    icon: Wallet,
    title: "Step 3: Earn",
    description: "Get paid monthly. Watch your earnings grow.",
  },
];

const AffiliateJourney = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
            How It <span className="text-green-600">Works</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Just 3 steps to start earning money
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
              className="absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-blue-500 to-blue-200 origin-left"
            />

            <div className="flex justify-between relative">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -100 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.8,
                    delay: 0.3 + index * 0.2,
                    ease: "easeOut",
                  }}
                  className="flex flex-col items-center text-center flex-1 max-w-xs"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="w-14 h-14 rounded-2xl bg-white shadow-md border border-gray-200 flex items-center justify-center mb-4 relative z-10"
                  >
                    <step.icon className="w-6 h-6 text-blue-600" />
                  </motion.div>
                  <h3 className="text-xl md:text-2xl font-display font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-base md:text-lg text-gray-600 leading-relaxed">
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
              initial={{ opacity: 0, x: -100 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: 0.8,
                delay: 0.2 + index * 0.15,
                ease: "easeOut",
              }}
              className="flex items-start gap-4"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white shadow-md border border-gray-200 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-blue-600" />
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-blue-200" />
                )}
              </div>
              <div className="pt-2">
                <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
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
