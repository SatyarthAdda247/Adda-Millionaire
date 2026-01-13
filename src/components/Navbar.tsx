import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl shadow-soft"
          : "bg-transparent"
      }`}
    >
      <div className="container px-6">
        <div className="flex items-center justify-between h-20">
          <motion.a
            href="#"
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-xl font-display font-bold text-foreground">
              Millionaire's <span className="text-primary">Adda</span>
            </span>
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("products")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Products
            </button>
            <button
              onClick={() => scrollToSection("journey")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("calculator")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Calculator
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </button>
          </div>

          <div className="hidden md:block">
            <Button
              onClick={() => scrollToSection("signup")}
              className="gradient-cta text-primary-foreground rounded-xl px-6 shadow-glow hover:shadow-elevated transition-all duration-300"
            >
              Join Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-background/95 backdrop-blur-xl rounded-2xl shadow-elevated p-6 mb-4"
          >
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("products")}
                className="text-left py-2 text-foreground hover:text-primary transition-colors"
              >
                Products
              </button>
              <button
                onClick={() => scrollToSection("journey")}
                className="text-left py-2 text-foreground hover:text-primary transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("calculator")}
                className="text-left py-2 text-foreground hover:text-primary transition-colors"
              >
                Calculator
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-left py-2 text-foreground hover:text-primary transition-colors"
              >
                FAQ
              </button>
              <Button
                onClick={() => scrollToSection("signup")}
                className="gradient-cta text-primary-foreground rounded-xl w-full mt-2"
              >
                Join Now
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
