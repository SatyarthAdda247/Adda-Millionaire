import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const ADMIN_CODE = "admin1312";

const AdminLogin = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Check if code matches
    if (code.trim() === ADMIN_CODE) {
      // Set authentication in sessionStorage
      sessionStorage.setItem('adminAuthenticated', 'true');
      sessionStorage.setItem('adminLoginTime', new Date().toISOString());
      
      toast({
        title: "Access Granted",
        description: "Redirecting to admin dashboard...",
      });
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 500);
    } else {
      setError("Invalid access code. Please try again.");
      setLoading(false);
      toast({
        title: "Access Denied",
        description: "Invalid access code.",
        variant: "destructive",
      });
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
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Admin Portal
            </CardTitle>
            <CardDescription className="text-base">
              Enter the access code to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Access Code
                </label>
                <Input
                  id="code"
                  type="password"
                  placeholder="Enter access code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(null);
                  }}
                  disabled={loading}
                  className="h-12 text-lg"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white h-12 text-base font-medium shadow-lg"
                size="lg"
              >
                {loading ? (
                  <>Verifying...</>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Access Dashboard
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-gray-500 pt-4 border-t">
                <p>Only authorized administrators can access this page</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
