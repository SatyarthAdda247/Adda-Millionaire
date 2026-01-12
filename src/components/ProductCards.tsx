import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { GraduationCap, BookOpen, Target, Heart } from "lucide-react";

const products = [
  {
    icon: GraduationCap,
    name: "Reevo by AddaEducation",
    tagline: "Smart, structured exam preparation",
    features: [
      "Designed for serious aspirants",
      "High-intent learners, strong conversions",
    ],
    bestFor: "competitive exams, focused learners",
    gradient: "from-primary/10 to-primary/5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: BookOpen,
    name: "Learners Adda",
    tagline: "Daily learning made simple",
    features: [
      "Beginner-friendly, habit-building content",
      "Perfect for short-form content promotion",
    ],
    bestFor: "students, beginners, lifelong learners",
    gradient: "from-accent/10 to-accent/5",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
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
            Learning Products Your Audience{" "}
            <span className="text-gradient">Already Trusts</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Promote products that genuinely help your audience grow.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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

              <p className="text-lg text-muted-foreground mb-6">
                {product.tagline}
              </p>

              <ul className="space-y-3 mb-8">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-3">
                <Heart className="w-4 h-4 text-accent" />
                <span>
                  Best for: <strong className="text-foreground">{product.bestFor}</strong>
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductCards;
