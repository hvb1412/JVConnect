import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Mail, Lock, ShieldCheck, KeyRound } from "lucide-react";
import { forgotPassword, verifyForgotPasswordOtp, resetPassword } from "../lib/authApi";
import { useTranslation } from "../lib/i18n";

export function GuestForgotPassword() {
  const navigate = useNavigate();
  // step 1: enter email
  // step 2: enter otp
  // step 3: enter new password
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [resendTimer, setResendTimer] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0 && step === 2) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer, step]);

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setError(t("email") + " is required");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      await forgotPassword(email);
      setStep(2);
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || "リクエストに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError(t("otp_placeholder") + " is invalid");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      const result = await verifyForgotPasswordOtp(email, otp);
      setResetToken(result.resetToken);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "認証に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setError(t("confirm_password") + " does not match");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      await resetPassword(resetToken, newPassword);
      setSuccessMsg(t("change_password") + "。ログインしてください。");
      setTimeout(() => navigate("/guest/login"), 2000);
    } catch (err: any) {
      setError(err.message || "パスワードの変更に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-8">
          <Logo />
          <LanguageToggle />
        </div>

        <Card className="w-full shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl">
              {step === 1 && t("forgot_password")}
              {step === 2 && t("verify_title")}
              {step === 3 && t("reset_password_title")}
            </CardTitle>
            <CardDescription>
              {step === 1 && t("register_description")}
              {step === 2 && t("verify_description")}
              {step === 3 && t("reset_password_description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {successMsg && (
              <div className="bg-green-50 p-3 rounded text-green-700 text-sm text-center font-medium">
                {successMsg}
              </div>
            )}
            
            {!successMsg && step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button className="w-full" size="lg" onClick={handleRequestOtp} disabled={isLoading}>
                  {isLoading ? t("logging_in") : t("send_code")}
                </Button>
                <div className="text-center pt-2">
                  <Link to="/guest/login" className="text-sm text-gray-500 hover:text-gray-700 underline">
                    ログイン画面に戻る
                  </Link>
                </div>
              </div>
            )}

            {!successMsg && step === 2 && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">確認コードを送信しました</p>
                    <p className="text-xs text-blue-600 mt-1">{email} の受信箱をご確認ください。</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">確認コード (OTP)</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/[^0-9]/g, ''));
                      if (error) setError("");
                    }}
                  />
                </div>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                <Button className="w-full h-12 text-lg" onClick={handleVerifyOtp} disabled={isLoading || otp.length !== 6}>
                  {isLoading ? t("logging_in") : t("code_verify")}
                </Button>

                <div className="text-center mt-4">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-500">
                      コードを再送信するには {resendTimer} 秒お待ちください
                    </p>
                  ) : (
                    <button 
                      onClick={handleRequestOtp}
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      コードを再送信する
                    </button>
                  )}
                </div>
                
                <div className="text-center pt-2">
                  <button 
                    onClick={() => setStep(1)}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    メールアドレスを変更する
                  </button>
                </div>
              </div>
            )}

            {!successMsg && step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">新しいパスワード</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError("");
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError("");
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button className="w-full" size="lg" onClick={handleResetPassword} disabled={isLoading}>
                  {isLoading ? t("logging_in") : t("change_password")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
