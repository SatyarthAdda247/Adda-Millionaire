import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { GraduationCap, Target } from "lucide-react";

const products = [
  {
    icon: GraduationCap,
    name: "Learning Platforms",
    tagline: "AI-powered learning platforms for skill development",
    description: "Perfect for creators who talk about: confidence, personality development, career growth, cracking interviews, dating tips, and more.",
    features: [
      "Interactive learning with AI-powered coaching",
      "Real-time practice with instant feedback",
      "Affordable pricing starting from ₹1 (trial) and ₹199/month",
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
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-8">
            What You'll <span className="text-green-600">Promote</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Educational apps and learning platforms that help people grow. Thousands already love them.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-1 gap-8 max-w-3xl mx-auto">
          {products.map((product, index) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, x: -150 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: 0.8,
                delay: index * 0.2,
                ease: "easeOut",
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="bg-white rounded-2xl p-8 md:p-10 shadow-lg border border-gray-200"
            >
              <div
                className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6"
              >
                <product.icon className="w-8 h-8 text-blue-600" />
              </div>

              <h3 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-6">
                {product.name}
              </h3>

              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {product.tagline}
              </p>

              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                {product.description}
              </p>

              <div className="space-y-3">
                <p className="text-base font-semibold text-gray-900 mb-3">What it does:</p>
                {product.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <Target className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <span className="text-base text-gray-700 leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductCards;
