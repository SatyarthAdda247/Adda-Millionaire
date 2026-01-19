import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, LogIn, Shield, User, ChevronDown } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
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
            <span className="text-xl font-display font-bold text-gray-900">
              Edu<span className="text-blue-600">Rise</span>
            </span>
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("products")}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Products
            </button>
            <button
              onClick={() => scrollToSection("journey")}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("calculator")}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Calculator
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              FAQ
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-4"
                  size="sm"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                  <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => navigate('/login')}
                  className="cursor-pointer"
                >
                  <User className="w-4 h-4 mr-2" />
                  <div className="flex flex-col">
                    <span className="font-medium">User Login</span>
                    <span className="text-xs text-gray-500">View stats & earnings</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/admin/login')}
                  className="cursor-pointer"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  <div className="flex flex-col">
                    <span className="font-medium">Admin Login</span>
                    <span className="text-xs text-gray-500">Manage affiliates</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => scrollToSection("signup")}
              className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl px-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Join Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-900"
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
            className="md:hidden bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 p-6 mb-4"
          >
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("products")}
                className="text-left py-2 text-gray-900 hover:text-blue-600 transition-colors"
              >
                Products
              </button>
              <button
                onClick={() => scrollToSection("journey")}
                className="text-left py-2 text-gray-900 hover:text-blue-600 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("calculator")}
                className="text-left py-2 text-gray-900 hover:text-blue-600 transition-colors"
              >
                Calculator
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-left py-2 text-gray-900 hover:text-blue-600 transition-colors"
              >
                FAQ
              </button>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl w-full"
                >
                  <User className="w-4 h-4 mr-2" />
                  User Login
                </Button>
                <Button
                  onClick={() => {
                    navigate('/admin/login');
                    setIsMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Login
                </Button>
              </div>
              <Button
                onClick={() => scrollToSection("signup")}
                className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl w-full mt-2"
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
