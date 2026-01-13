import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { GraduationCap, Target } from "lucide-react";

const products = [
  {
    icon: GraduationCap,
    name: "Reevo",
    tagline: "AI-powered English learning & speaking app for Bharat",
    description: "Perfect for creators who talk about: confidence, personality development, career growth, cracking interviews, dating tips, and more.",
    features: [
      "Practice with an AI coach - Riya - and gain confidence",
      "Real-time scenario practice with instant feedback",
      "Start speaking English at just ₹1 (trial entry and then ₹199/month)",
    ],
    gradient: "from-primary/10 to-primary/5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
];

const ProductCards = () => {
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
            About the <span className="text-gradient">Campaign</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're looking for creators to make videos talking about our products. That's it! No extra work, no hidden hoops. Just your videos, your audience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-1 gap-8 max-w-3xl mx-auto">
          {products.map((product, index) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{
                duration: 0.8,
                delay: index * 0.2,
                ease: "easeOut",
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="floating-card p-8 md:p-10"
            >
              <div
                className={`w-16 h-16 rounded-2xl ${product.iconBg} flex items-center justify-center mb-6`}
              >
                <product.icon className={`w-8 h-8 ${product.iconColor}`} />
              </div>

              <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                {product.name}
              </h3>

              <p className="text-lg text-muted-foreground mb-4">
                {product.tagline}
              </p>

              <p className="text-base text-foreground/90 mb-6">
                {product.description}
              </p>

              <div className="mb-6">
                <p className="text-sm font-semibold text-foreground mb-3">Highlights:</p>
                <ul className="space-y-2">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductCards;
