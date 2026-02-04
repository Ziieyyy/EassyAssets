import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Package, Building2, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { PasswordStrengthIndicator, validatePassword } from "@/components/PasswordStrengthIndicator";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const isPasswordValid = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!isPasswordValid) {
      setError("Password does not meet all requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, companyName.trim() || undefined, fullName.trim() || undefined);
      toast.success("Account created successfully! Please sign in.");
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5EFFF] via-[#E5D9F2] to-[#d4c8e8] p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#F5EFFF] to-[#E5D9F2] shadow-lg shadow-stone-400/30">
            <Package className="w-8 h-8 text-stone-800" />
          </div>
          <h1 className="text-3xl font-bold text-stone-800">myEasyAssets</h1>
        </div>

        {/* Signup Card */}
        <Card className="bg-[#E5D9F2] border border-stone-400/40 shadow-xl shadow-stone-400/50">
          <CardHeader>
            <CardTitle className="text-2xl text-stone-800">Create Account</CardTitle>
            <CardDescription className="text-stone-600">Sign up to start managing your assets</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Company Name - Optional */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="flex items-center gap-2 text-stone-700">
                  <Building2 className="w-4 h-4" />
                  Company Name (Optional)
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Acme Corporation"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={loading}
                  className="bg-[#F5EFFF] border-stone-300 focus:border-[#E5D9F2] text-stone-800 placeholder-stone-500"
                />
                <p className="text-xs text-stone-500">
                  Your company name (can be the same as other users)
                </p>
              </div>

              {/* Full Name - Optional */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2 text-stone-700">
                  <User className="w-4 h-4" />
                  Full Name (Optional)
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className="bg-[#F5EFFF] border-stone-300 focus:border-[#E5D9F2] text-stone-800 placeholder-stone-500"
                />
              </div>
              
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-stone-700">
                  <Mail className="w-4 h-4" />
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-[#F5EFFF] border-stone-300 focus:border-[#E5D9F2] text-stone-800 placeholder-stone-500"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-stone-700">
                  <Lock className="w-4 h-4" />
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    disabled={loading}
                    className="bg-[#F5EFFF] border-stone-300 focus:border-[#E5D9F2] text-stone-800 placeholder-stone-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <PasswordStrengthIndicator 
                  password={password} 
                  show={passwordFocused || (password.length > 0 && !isPasswordValid)} 
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-stone-700">
                  <Lock className="w-4 h-4" />
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-[#F5EFFF] border-stone-300 focus:border-[#E5D9F2] text-stone-800 placeholder-stone-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive animate-in fade-in duration-150">
                    Passwords do not match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#F5EFFF] to-[#E5D9F2] hover:from-[#f0f4ff] hover:to-[#e0d0f5] text-stone-800 border border-stone-300 font-semibold shadow-lg shadow-stone-400/40 hover:shadow-stone-500/50 transition-all"
                disabled={loading || !isPasswordValid || !passwordsMatch}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-stone-600">
              Already have an account? {" "}
              <Link to="/login" className="text-stone-600 hover:text-stone-800 hover:underline font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
