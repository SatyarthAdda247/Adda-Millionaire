import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 bg-foreground">
      <div className="container px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-display font-bold text-background">
              Millionaire's <span className="text-primary-foreground/80">Adda</span>
            </h3>
            <p className="text-background/60 text-sm mt-1">
              An affiliate program by AddaEducation
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-6"
          >
            <a
              href="#"
              className="text-sm text-background/60 hover:text-background transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-sm text-background/60 hover:text-background transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-sm text-background/60 hover:text-background transition-colors"
            >
              Contact
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-1 text-sm text-background/60"
          >
            Made with <Heart className="w-4 h-4 text-accent fill-accent" /> for
            affiliates
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
