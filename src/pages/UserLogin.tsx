import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail, Phone, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const UserLogin = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email && !phone) {
        setError("Please provide either email or phone number");
        setLoading(false);
        return;
      }

      // Validate email format if provided
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      // Validate phone format if provided
      if (phone && phone.replace(/\D/g, '').length < 10) {
        setError("Please enter a valid phone number (at least 10 digits)");
        setLoading(false);
        return;
      }

      // Try to find user by email or phone
      let user;
      if (email) {
        const response = await fetch(`${API_BASE_URL}/api/users/email/${encodeURIComponent(email.trim().toLowerCase())}`);
        if (response.ok) {
          user = await response.json();
        } else if (response.status === 404) {
          setError("User not found. Please check your email or register first.");
          setLoading(false);
          return;
        } else if (response.status === 403) {
          const errorData = await response.json();
          setError(errorData.error || "Access denied. Your account may have been deleted.");
          setLoading(false);
          return;
        }
      } else if (phone) {
        // Search by phone - we'll need to implement this endpoint
        const response = await fetch(`${API_BASE_URL}/api/users/phone/${encodeURIComponent(phone.trim())}`);
        if (response.ok) {
          user = await response.json();
        } else if (response.status === 404) {
          setError("User not found. Please check your phone number or register first.");
          setLoading(false);
          return;
        } else if (response.status === 403) {
          const errorData = await response.json();
          setError(errorData.error || "Access denied. Your account may have been deleted.");
          setLoading(false);
          return;
        }
      }

      if (!user) {
        setError("User not found. Please register first.");
        setLoading(false);
        return;
      }

      // Check if user is deleted
      if (user.status === 'deleted' || user.approvalStatus === 'deleted') {
        setError("Your account has been deleted. Please contact support for more information.");
        setLoading(false);
        return;
      }

      // Check if user is approved
      const approvalStatus = user.approvalStatus || 'pending';
      if (approvalStatus !== 'approved') {
        setError(
          approvalStatus === 'pending' 
            ? "Your application is still pending approval. Please wait for admin approval."
            : "Your application has been rejected. Please contact support for more information."
        );
        setLoading(false);
        return;
      }

      // Store user session
      sessionStorage.setItem('user', JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        type: 'user'
      }));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name}!`,
      });

      navigate('/user/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-2">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              User Login
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to view your affiliate stats and earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white hover:from-blue-700 hover:to-green-700 h-12 text-base font-medium shadow-lg"
                size="lg"
              >
                {loading ? (
                  <>Signing in...</>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-gray-500 pt-4 border-t">
                <p>
                  Don't have an account?{" "}
                  <a
                    href="#signup"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/#signup';
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Register here
                  </a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserLogin;
