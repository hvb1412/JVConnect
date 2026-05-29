import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { useTranslation } from "../lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Mail, Lock } from "lucide-react";
import { loginUser } from "../lib/authApi";

export function GuestLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setLoginError("");
      const result = await loginUser(email, password);
      
      // Store token, userId, and role
      localStorage.setItem("token", result.token);
      localStorage.setItem("userId", result.user.id);
      localStorage.setItem("role", result.role);
      
      // Redirect based on role and profile update requirement
      if (result.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/home");
      }
    } catch (error: any) {
      setLoginError(error.message || t("invalid_login_error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1759866221633-4d03836def4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWxjb21lJTIwaWxsdXN0cmF0aW9uJTIwbW9kZXJufGVufDF8fHx8MTc3NDk4ODEyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Welcome"
            className="w-full h-auto rounded-2xl shadow-lg"
          />
          <h2 className="mt-6 text-2xl font-semibold text-center text-gray-800">
            {t("auth_welcome_title")}
          </h2>
          <p className="mt-2 text-gray-600 text-center">
            {t("auth_welcome_subtitle")}
          </p>
          {/* Logo and language toggle moved to the login card top-right */}
        </div>

        <div className="flex flex-col justify-center relative">
          <div className="absolute -top-12 right-4 z-10 flex items-center space-x-3">
            <Logo />
            <LanguageToggle />
          </div>
          <Card className="w-full shadow-xl">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">{t("login_title")}</CardTitle>
              <CardDescription>{t("login_description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (loginError) setLoginError("");
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError("");
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/guest/forgot-password" className="text-sm text-blue-600 hover:underline">
                  {t("forgot_password")}
                </Link>
              </div>

              {loginError && <p className="text-sm text-red-600">{loginError}</p>}

              <div className="space-y-3">
                <Button className="w-full" size="lg" onClick={handleLogin} disabled={isLoading}>
                  {isLoading ? t("logging_in") : t("login_button")}
                </Button>
                <Button asChild variant="outline" className="w-full" size="lg" disabled={isLoading}>
                  <Link to="/guest/register">{t("login_register_link")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
