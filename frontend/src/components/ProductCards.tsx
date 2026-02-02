import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Target } from "lucide-react";

const products = [
  {
    name: "Reevo",
    logo: "/logos/reevo-logo.png",
    logoAlt: "Reevo Logo",
    website: "https://reevo.in/",
    tagline: "AI-powered learning platform for skill development",
    description: "Perfect for creators who talk about: confidence, personality development, career growth, cracking interviews, dating tips, and more.",
    features: [
      "Interactive learning with AI-powered coaching",
      "Real-time practice with instant feedback",
      "Affordable pricing starting from ₹1 (trial) and ₹199/month",
    ],
    gradient: "from-blue-50 to-blue-100",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    fallbackLetter: "R",
    comingSoon: false,
  },
  {
    name: "Adda247 App",
    logo: "/logos/adda247-logo.png",
    logoAlt: "Adda247 Logo",
    website: "https://www.adda247.com/?srsltid=AfmBOorLMdhC5gL22BtXITQszW8sg5mzDlnNGnt7KnALbdZK-aqXtxI0",
    tagline: "Comprehensive exam preparation and learning app",
    description: "Ideal for creators focusing on: competitive exams, government jobs, banking, SSC, railway, teaching exams, and career guidance.",
    features: [
      "Live classes and recorded video courses",
      "Mock tests and practice papers",
      "Expert faculty and comprehensive study material",
    ],
    gradient: "from-green-50 to-green-100",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    fallbackLetter: "A",
    comingSoon: true,
  },
  {
    name: "Learnr's adda",
    logo: "/logos/learners-adda-logo.png",
    logoAlt: "Learnr's adda Logo",
    website: "https://play.google.com/store/apps/details?id=com.adda247.gold&hl=en_IN",
    tagline: "Personalized learning experience for students",
    description: "Great for creators who discuss: academic excellence, skill building, student success stories, exam strategies, and educational tips.",
    features: [
      "Personalized learning paths",
      "Interactive quizzes and assessments",
      "Progress tracking and performance analytics",
    ],
    gradient: "from-purple-50 to-purple-100",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    fallbackLetter: "L",
    comingSoon: true,
  },
];

// Logo component with proper fallback
const LogoDisplay = ({ logo, alt, name, iconBg, iconColor, fallbackLetter }: {
  logo: string;
  alt: string;
  name: string;
  iconBg: string;
  iconColor: string;
  fallbackLetter: string;
}) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    // Show styled letter fallback matching the design
    return (
      <div className={`w-full h-full rounded-full ${iconBg} flex items-center justify-center shadow-sm`}>
        <span className={`${iconColor} font-bold text-3xl`}>{fallbackLetter}</span>
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={alt}
      className="w-full h-full object-contain"
      onError={() => setImageError(true)}
    />
  );
};

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

        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {products.map((product, index) => {
            const CardWrapper = product.comingSoon ? motion.div : motion.a;
            const wrapperProps = product.comingSoon 
              ? {} 
              : {
                  href: product.website,
                  target: "_blank",
                  rel: "noopener noreferrer",
                };

            return (
              <CardWrapper
                key={product.name}
                {...wrapperProps}
                initial={{ opacity: 0, x: -150 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: 0.8,
                  delay: index * 0.15,
                  ease: "easeOut",
                }}
                whileHover={product.comingSoon ? {} : { y: -8, transition: { duration: 0.3 } }}
                className={`bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 flex flex-col relative ${
                  product.comingSoon 
                    ? "cursor-not-allowed opacity-75" 
                    : "cursor-pointer hover:shadow-xl transition-all duration-300 group"
                }`}
              >
                {product.comingSoon && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Coming Soon
                    </span>
                  </div>
                )}

                <div className={`mb-6 flex justify-center ${product.comingSoon ? "blur-none opacity-80" : ""}`}>
                  <div className={`w-20 h-20 rounded-full ${product.iconBg} flex items-center justify-center shadow-md`}>
                    <LogoDisplay 
                      logo={product.logo} 
                      alt={product.logoAlt}
                      name={product.name}
                      iconBg={product.iconBg}
                      iconColor={product.iconColor}
                      fallbackLetter={product.fallbackLetter}
                    />
                  </div>
                </div>

                <div className={product.comingSoon ? "blur-sm" : ""}>
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-4">
                    {product.name}
                  </h3>

                  <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                    {product.tagline}
                  </p>

                  <p className="text-base text-gray-700 mb-6 leading-relaxed flex-grow">
                    {product.description}
                  </p>

                  <div className="space-y-3 mt-auto">
                    <p className="text-sm font-semibold text-gray-900 mb-2">What it does:</p>
                    {product.features.map((feature, i) => (
                      <div key={i} className={`flex items-start gap-3 ${product.iconBg} rounded-lg p-3 border ${product.iconBg.replace('bg-', 'border-')}200`}>
                        <Target className={`w-5 h-5 ${product.iconColor} mt-0.5 shrink-0`} />
                        <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductCards;
