import { motion } from "framer-motion";
import { Play } from "lucide-react";

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/40 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container relative z-10 px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-gray-900 leading-[1.1] mb-10"
          >
            Join Millionaire's{" "}
            <span className="text-blue-600">Adda Affiliate Program</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            className="text-2xl md:text-3xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed font-light"
          >
            Make videos. Get paid every month. It's that simple.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex justify-center items-center"
          >
            <div className="relative flex items-center gap-8">
              <div className="h-px w-12 md:w-20 bg-muted-foreground/30"></div>
              <motion.div
                onClick={() => scrollToSection("signup")}
                className="group cursor-pointer bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl px-8 md:px-12 py-6 md:py-8 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-blue-600 fill-blue-600 ml-1" />
                </div>
                <div className="text-xl md:text-2xl font-display font-bold text-gray-900 whitespace-nowrap">
                  Create Once{" "}
                  <span className="text-green-600">→</span> Earn Every Month
                </div>
              </motion.div>
              <div className="h-px w-12 md:w-20 bg-muted-foreground/30"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2"
        >
          <motion.div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
